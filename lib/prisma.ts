import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

const host = process.env.MYSQL_HOST || "mysql-31beb727-saec-89c8.a.aivencloud.com";
const port = Number(process.env.MYSQL_PORT || 15894);
const user = process.env.MYSQL_USER || "avnadmin";
const password = process.env.MYSQL_PASSWORD || "AVNS_SYNgd0VRyzVu5JqSKnP";
const database = process.env.MYSQL_DATABASE || "defaultdb";

const adapter = new PrismaMariaDb({
  host,
  port,
  user,
  password,
  database,
  ssl: {
    rejectUnauthorized: false,
  },
  allowPublicKeyRetrieval: true,
  connectionLimit: 1,
  connectTimeout: 10000,
  acquireTimeout: 10000,
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