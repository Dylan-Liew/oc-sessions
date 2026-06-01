import { existsSync } from "node:fs";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

export interface SqliteRunResult {
  changes: number;
  lastInsertRowid?: number | bigint;
}

export interface SqliteStatement {
  all(...params: unknown[]): unknown[];
  get(...params: unknown[]): unknown;
  run(...params: unknown[]): SqliteRunResult;
}

export interface SqliteDatabase {
  prepare(sql: string): SqliteStatement;
  close(): void;
}

interface OpenSqliteDatabaseOptions {
  readonly: boolean;
}

interface NativeSqliteDatabase {
  prepare(sql: string): SqliteStatement;
  close(...args: unknown[]): void;
}

class RuntimeSqliteDatabase implements SqliteDatabase {
  #closed = false;

  constructor(private readonly db: NativeSqliteDatabase) {}

  prepare(sql: string): SqliteStatement {
    return this.db.prepare(sql);
  }

  close(): void {
    if (this.#closed) {
      return;
    }

    this.db.close();
    this.#closed = true;
  }
}

function isBunRuntime(): boolean {
  return typeof (process.versions as NodeJS.ProcessVersions & { bun?: string }).bun === "string";
}

function assertDatabaseExists(dbPath: string): void {
  if (!existsSync(dbPath)) {
    throw new Error(`SQLite database does not exist: ${dbPath}`);
  }
}

function openBunSqliteDatabase(
  dbPath: string,
  options: OpenSqliteDatabaseOptions,
): NativeSqliteDatabase {
  const { Database } = require("bun:sqlite") as {
    Database: new (
      filename: string,
      options: { readonly?: boolean; readwrite?: boolean; create?: boolean },
    ) => NativeSqliteDatabase;
  };

  return new Database(
    dbPath,
    options.readonly ? { readonly: true } : { readwrite: true, create: false },
  );
}

function openNodeSqliteDatabase(
  dbPath: string,
  options: OpenSqliteDatabaseOptions,
): NativeSqliteDatabase {
  const { DatabaseSync } = require("node:sqlite") as {
    DatabaseSync: new (filename: string, options: { readOnly?: boolean }) => NativeSqliteDatabase;
  };

  return new DatabaseSync(dbPath, { readOnly: options.readonly });
}

export function openSqliteDatabase(
  dbPath: string,
  options: OpenSqliteDatabaseOptions,
): SqliteDatabase {
  assertDatabaseExists(dbPath);

  const db = isBunRuntime()
    ? openBunSqliteDatabase(dbPath, options)
    : openNodeSqliteDatabase(dbPath, options);

  return new RuntimeSqliteDatabase(db);
}
