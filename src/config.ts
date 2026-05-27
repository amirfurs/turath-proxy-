export type AppConfig = {
  port: number;
  host: string;
  turathApiBase: string;
  turathTimeoutMs: number;
  turathRetries: number;
  indexCacheTtlMs: number;
  enableFileCache: boolean;
  cacheDir: string;
  userAgent: string;
};

const asNumber = (value: string | undefined, fallback: number): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const asBool = (value: string | undefined, fallback: boolean): boolean => {
  if (value == null) return fallback;
  return ["1", "true", "yes", "on"].includes(value.toLowerCase());
};

export const config: AppConfig = {
  port: asNumber(process.env.PORT, 3000),
  host: process.env.HOST ?? "0.0.0.0",
  turathApiBase: process.env.TURATH_API_BASE ?? "https://api.turath.io",
  turathTimeoutMs: asNumber(process.env.TURATH_TIMEOUT_MS, 15000),
  turathRetries: asNumber(process.env.TURATH_RETRIES, 2),
  indexCacheTtlMs: asNumber(process.env.INDEX_CACHE_TTL_MS, 24 * 60 * 60 * 1000),
  enableFileCache: asBool(process.env.ENABLE_FILE_CACHE, true),
  cacheDir: process.env.CACHE_DIR ?? ".cache",
  userAgent: process.env.USER_AGENT ?? "turath-gpt-proxy/1.0 (+https://localhost)"
};
