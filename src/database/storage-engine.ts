import fs from 'fs/promises';
import fscb from 'fs';
import path from 'path';
import { applyMigrations, readJsonFile } from './migrations.ts';
import type { DatabaseSchema } from './schema.ts';
import { createEmptySchema } from './schema.ts';

export type EntityType = keyof DatabaseSchema;

interface VersionContext {
  version: number;
  data: DatabaseSchema;
  setData(next: DatabaseSchema): void;
}

export class StorageEngine {
  private jsonPath: string;
  private cache: DatabaseSchema | null = null;
  private version = 0;

  constructor(jsonPath: string) {
    this.jsonPath = jsonPath;
  }

  private tmpPath(): string { return this.jsonPath + '.tmp'; }

  private async ensureLoaded(): Promise<void> {
    if (this.cache) return;

    // If tmp exists (previous crash mid-commit), warn and ignore tmp.
    try {
      await fs.access(this.tmpPath());
      console.warn('[StorageEngine] Found leftover tmp file; ignoring and proceeding:', this.tmpPath());
    } catch { /* no tmp, OK */ }

    try {
      const raw = await readJsonFile(this.jsonPath);
      const { schema } = applyMigrations(raw);
      this.cache = schema;
    } catch (err: any) {
      if (err && err.code === 'ENOENT') {
        this.cache = createEmptySchema();
        await this.writeAtomic(this.cache);
      } else {
        console.error('[StorageEngine] Failed to load JSON:', err);
        this.cache = createEmptySchema();
      }
    }
  }

  async readSnapshot(): Promise<DatabaseSchema> {
    await this.ensureLoaded();
    // return a shallow clone to avoid external accidental mutations to arrays
    const d = this.cache as DatabaseSchema;
    return {
      patients: d.patients.slice(),
      appointments: d.appointments.slice(),
      prescriptions: d.prescriptions.slice(),
      services: d.services.slice(),
      medicalRecords: d.medicalRecords.slice(),
      doctors: d.doctors.slice(),
    };
  }

  async atomicWrite(_type: EntityType, handler: (ctx: VersionContext) => void | Promise<void>): Promise<void> {
    await this.ensureLoaded();
    const current = await this.readSnapshot();
    let next = current;

    const ctx: VersionContext = {
      version: this.version,
      data: current,
      setData(d: DatabaseSchema) { next = d; }
    };

    await handler(ctx);

    // If handler didn't setData, assume it mutated current and wants to commit that
    if (next === current) {
      next = current;
    }

    await this.writeAtomic(next);
    // update cache and bump version
    this.cache = next;
    this.version += 1;
  }

  private async writeAtomic(data: DatabaseSchema): Promise<void> {
    const content = JSON.stringify(data, null, 2);
    const tmp = this.tmpPath();
    // write tmp
    const fh = await fs.open(tmp, 'w');
    try {
      await fh.truncate(0);
      await fh.writeFile(content, 'utf-8');
      await this.fsyncHandle(fh);
    } finally {
      await fh.close();
    }
    // rename over
    await fs.rename(tmp, this.jsonPath);
    // fsync directory to persist rename (best-effort)
    try {
      const dir = path.dirname(this.jsonPath);
      const dirFd = await fs.open(dir, fscb.constants.O_DIRECTORY as any);
      try {
        await this.fsyncHandle(dirFd);
      } finally {
        await dirFd.close();
      }
    } catch {
      // ignore if not supported
    }
  }

  private async fsyncHandle(handle: fscb.promises.FileHandle): Promise<void> {
    // Node 18+ supports handle.sync()
    // @ts-ignore
    if (typeof handle.sync === 'function') {
      // @ts-ignore
      await handle.sync();
      return;
    }
    // fallback using fsync via fd
    await new Promise<void>((resolve, reject) => {
      // @ts-ignore
      fscb.fsync(handle.fd, (err) => err ? reject(err) : resolve());
    });
  }
}

