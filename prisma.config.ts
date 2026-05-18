import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "./prisma/schema.prisma",
  migrations: {
    path: "./prisma/migrations",
  },
  datasource: {
    // Use process.env directly so prisma generate works without DATABASE_URL
    url: process.env.DATABASE_URL || "mysql://root:root@localhost:3306/placeholder",
  },
});
