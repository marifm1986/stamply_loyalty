import { defineConfig } from "drizzle-kit";

export default defineConfig({
  out: "./drizzle-postgres-reference",
  schema: "./db/schema.ts",
  dialect: "postgresql",
});
