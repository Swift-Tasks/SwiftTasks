import { env } from "@/env";
import { drizzle } from "drizzle-orm/libsql";

declare global {
  var db: ReturnType<typeof drizzle> | undefined;
}

export const db = global.db ?? drizzle(env.DB_FILE!);

if (!global.db) {
  global.db = db;
}
