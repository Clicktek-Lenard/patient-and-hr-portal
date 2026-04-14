import { PrismaClient } from "../generated/cms-client";

const globalForCms = globalThis as unknown as {
  cmsPrisma: PrismaClient | undefined;
};

export const cmsPrisma =
  globalForCms.cmsPrisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForCms.cmsPrisma = cmsPrisma;
