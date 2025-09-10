import type { DatabaseSchema } from './schema.ts';
import { createEmptySchema } from './schema.ts';
import fs from 'fs/promises';

export interface Migration {
  version: number;
  apply(db: DatabaseSchema): DatabaseSchema;
}

// v1: ensure missing collections exist
const v1EnsureCollections: Migration = {
  version: 1,
  apply(db: DatabaseSchema): DatabaseSchema {
    return {
      patients: Array.isArray(db?.patients) ? db.patients : [],
      appointments: Array.isArray(db?.appointments) ? db.appointments : [],
      prescriptions: Array.isArray(db?.prescriptions) ? db.prescriptions : [],
      services: Array.isArray(db?.services) ? db.services : [],
      medicalRecords: Array.isArray((db as any)?.medicalRecords) ? (db as any).medicalRecords : [],
      doctors: Array.isArray((db as any)?.doctors) ? (db as any).doctors : []
    };
  }
};

const migrations: Migration[] = [v1EnsureCollections];

function coerceToSchema(raw: any): DatabaseSchema {
  if (!raw || typeof raw !== 'object') return createEmptySchema();
  // best-effort coerce
  return v1EnsureCollections.apply(raw as DatabaseSchema);
}

export interface LoadedSchema {
  schema: DatabaseSchema;
  version: number;
}

export function applyMigrations(raw: any): LoadedSchema {
  let db = coerceToSchema(raw);
  let currentVersion = 0;
  // For now we simply apply the latest normalize. If we introduce real versions in file later,
  // we can stepwise apply.
  for (const m of migrations) {
    db = m.apply(db);
    currentVersion = Math.max(currentVersion, m.version);
  }
  return { schema: db, version: currentVersion };
}

export async function readJsonFile(path: string): Promise<any> {
  const content = await fs.readFile(path, 'utf-8');
  try {
    return JSON.parse(content);
  } catch {
    return {};
  }
}

