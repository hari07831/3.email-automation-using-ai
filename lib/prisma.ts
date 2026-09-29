import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

const adapter = new PrismaMariaDb({
  host: process.env.MYSQL_HOST || "mysql-31beb727-saec-89c8.a.aivencloud.com",
  port: Number(process.env.MYSQL_PORT || 15894),
  user: process.env.MYSQL_USER || "avnadmin",
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE || "defaultdb",
  ssl: {
    rejectUnauthorized: false, // Required for Aiven SSL connection
  },
  connectionLimit: 5,
  acquireTimeout: 60000,
  connectTimeout: 10000,
});

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}