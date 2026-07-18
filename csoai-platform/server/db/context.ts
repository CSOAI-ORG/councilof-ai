import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "./schema";
import { verifyToken } from "../services/auth";

export type Context = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<Context> {
  let user: User | null = null;

  try {
    // Extract token from Authorization header
    const authHeader = opts.req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      user = await verifyToken(token);
    }
  } catch (error) {
    // Authentication is optional for public procedures
    user = null;
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
