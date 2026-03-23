import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "@/db/schema";
import { assertCoreConfig, env } from "@/lib/env";

function createDatabase() {
  assertCoreConfig();

  const client = neon(env.databaseUrl!);
  return drizzle(client, { schema });
}

let dbInstance: ReturnType<typeof createDatabase> | null = null;

export function db() {
  if (!dbInstance) {
    dbInstance = createDatabase();
  }

  return dbInstance;
}
