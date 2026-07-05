import { config } from "dotenv";

import { readEnv } from "./read-env.js";

export { readEnv } from "./read-env.js";

config({ path: new URL("../../../.env", import.meta.url) });

export type AppEnv = {
  appEnv: string;
  host: string;
  port: number;
  corsOrigin: string;
  googleAiApiKey?: string;
  googleAiModel: string;
  googleAiApiBaseUrl: string;
  roomAnalysisIntervalMs: number;
  roomAnalysisBatchSize: number;
  supabaseUrl: string;
  supabasePublishableKey: string;
  supabaseSecretKey: string;
  supabaseServiceRoleKey: string;
  supabaseJwksUrl: string;
  authSecret: string;
  adminPassword: string;
};

export const readOptionalEnv = (
  key: string,
  processEnv: NodeJS.ProcessEnv = process.env,
): string | undefined => {
  const value = processEnv[key];

  return value?.trim() ? value : undefined;
};

export const env: AppEnv = {
  appEnv: readEnv("APP_ENV"),
  host: readEnv("BACKEND_HOST"),
  port: Number(readEnv("BACKEND_PORT")),
  corsOrigin: readEnv("CORS_ORIGIN"),
  googleAiApiKey: readOptionalEnv("GOOGLE_AI_API_KEY"),
  googleAiModel: readEnv("GOOGLE_AI_MODEL", "gemma-4-31b-it"),
  googleAiApiBaseUrl: readEnv(
    "GOOGLE_AI_API_BASE_URL",
    "https://generativelanguage.googleapis.com/v1beta",
  ),
  roomAnalysisIntervalMs: Number(readEnv("ROOM_ANALYSIS_INTERVAL_MS", "60000")),
  roomAnalysisBatchSize: Number(readEnv("ROOM_ANALYSIS_BATCH_SIZE", "5")),
  supabaseUrl: readEnv("SUPABASE_URL"),
  supabasePublishableKey: readEnv("SUPABASE_PUBLISHABLE_KEY"),
  supabaseSecretKey: readEnv("SUPABASE_SECRET_KEY"),
  supabaseServiceRoleKey: readEnv(
    "SUPABASE_SERVICE_ROLE_KEY",
    process.env.SUPABASE_SECRET_KEY,
  ),
  supabaseJwksUrl: readEnv("SUPABASE_JWKS_URL"),
  authSecret: readEnv("AUTH_SECRET"),
  adminPassword: readEnv("ADMIN_PASSWORD"),
};
