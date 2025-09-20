import { neon, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import ws from 'ws';
import * as schema from "./schema";

const connectionString = process.env.NODE_ENV === 'production'
    ? process.env.DATABASE_URL!
    : 'postgres://neon:npg@localhost:5432/neondb';

if (process.env.NODE_ENV === 'development') {
    // Point the serverless driver to the local proxy
    neonConfig.fetchEndpoint = 'http://localhost:5432/sql';
    neonConfig.poolQueryViaFetch = true;
}

// Use the WebSocket constructor for Node.js
neonConfig.webSocketConstructor = ws;

export const sql = neon(connectionString);
export const db = drizzle(sql, { schema });