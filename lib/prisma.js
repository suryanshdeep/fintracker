
import { PrismaClient } from "@/lib/generated/prisma"; // adjust alias if needed

export const db=globalThis.prisma || new PrismaClient();

if(process.env.NODE_ENV !== "production"){
    globalThis.prisma =db;
}

// {In Next.js (especially with the App Router) or any serverless environment, you may hit a problem where:

// Every time your app reloads or handles a new request in development, it creates a new PrismaClient instance.

// This can lead to "Too many connections" errors on your PostgreSQL database (especially with Supabase and its pooled connections).

// ✅ This pattern stores the PrismaClient in globalThis so that the same instance is reused across hot reloads.}

