import type { DatabaseSchema } from './schema.ts';
import type { StorageEngine } from './storage-engine.ts';

type Key = keyof DatabaseSchema;

export function makeCollection<K extends Key>(engine: StorageEngine, key: K, getId?: (e: DatabaseSchema[K][number]) => string) {
  const idOf = (entity: any): string => {
    if (getId) return getId(entity);
    // default: entity.info.id or entity.id
    if (entity && entity.info && entity.info.id) return String(entity.info.id);
    if (entity && entity.id) return String(entity.id);
    return '';
  };

  return {
    async list(): Promise<DatabaseSchema[K]> {
      const snap = await engine.readSnapshot();
      return (snap[key] as unknown) as DatabaseSchema[K];
    },

    async getById(id: string): Promise<DatabaseSchema[K][number] | null> {
      if (!id) return null;
      const list = await this.list();
      // @ts-ignore
      return (list as any[]).find(e => idOf(e) === id) ?? null;
    },

    async upsert(entity: DatabaseSchema[K][number]): Promise<boolean> {
      const id = idOf(entity);
      if (!id) return false;
      await engine.atomicWrite(key, (ctx) => {
        const d = ctx.data;
        const arr = (d[key] as unknown as any[]).slice();
        const idx = arr.findIndex(e => idOf(e) === id);
        if (idx >= 0) arr[idx] = entity as any;
        else arr.push(entity as any);
        ctx.setData({ ...(d as any), [key]: arr });
      });
      return true;
    },

    async remove(id: string): Promise<boolean> {
      if (!id) return false;
      let removed = false;
      await engine.atomicWrite(key, (ctx) => {
        const d = ctx.data;
        const arr = (d[key] as unknown as any[]).slice();
        const idx = arr.findIndex(e => idOf(e) === id);
        if (idx >= 0) {
          arr.splice(idx, 1);
          removed = true;
          ctx.setData({ ...(d as any), [key]: arr });
        }
      });
      return removed;
    }
  };
}

