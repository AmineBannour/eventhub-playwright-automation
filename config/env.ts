import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';

/**
 * Single source of environment configuration for the test framework.
 * Values come from .env (git-ignored); .env.example is the fallback so a
 * clean checkout runs without manual setup. Nothing secret is hard-coded here.
 */
const root = path.resolve(__dirname, '..');
const envFile = fs.existsSync(path.join(root, '.env')) ? '.env' : '.env.example';
dotenv.config({ path: path.join(root, envFile) });

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing environment variable ${name} - copy .env.example to .env`);
  return value;
}

export const env = {
  envFile,
  baseURL: process.env.BASE_URL ?? `http://localhost:${process.env.APP_PORT ?? 3000}`,
  workers: Number(process.env.WORKERS ?? 4),
  browserChannel: process.env.BROWSER_CHANNEL || undefined,
  credentials: {
    username: required('APP_USERNAME'),
    password: required('APP_PASSWORD'),
  },
} as const;
