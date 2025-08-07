// import { Pool, neonConfig } from '@neondatabase/serverless';
// import { drizzle } from 'drizzle-orm/neon-serverless';
import dotenv from 'dotenv';
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
// import ws from "ws";
import * as schema from "@shared/schema";

// neonConfig.webSocketConstructor = ws;
dotenv.config();
console.log("******************");
if (!process.env.DATABASE_URL_COCKROACH) {
  throw new Error(
    "DATABASE_URL_COCKROACH must be set. Did you forget to provision a database?"
  );
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL_COCKROACH });
export const db = drizzle({ client: pool, schema });
