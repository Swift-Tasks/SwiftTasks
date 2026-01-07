import { migrate } from "drizzle-orm/libsql/migrator";
import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import * as dotenv from "dotenv";

dotenv.config();

async function runMigrations() {
  console.log("🔄 Running database migrations...");

  const dbFile = process.env.DB_FILE;
  if (!dbFile) {
    throw new Error("DB_FILE environment variable is not set");
  }

  console.log(`📁 Database file: ${dbFile}`);

  const client = createClient({
    url: `file:${dbFile}`
  });

  const db = drizzle(client);

  await migrate(db, { migrationsFolder: "./drizzle" });

  console.log("✅ Migrations completed successfully");
}

runMigrations()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  });
