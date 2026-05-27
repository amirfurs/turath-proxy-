import { config } from "../config.js";

export class UpstreamError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number
  ) {
    super(message);
  }
}

const delay = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));

export const turathGet = async (path: string, params: Record<string, string | number | undefined>): Promise<any> => {
  const url = new URL(path, config.turathApiBase);
  Object.entries({ ...params, ver: 3 }).forEach(([k, v]) => {
    if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
  });

  for (let attempt = 0; attempt <= config.turathRetries; attempt += 1) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), config.turathTimeoutMs);
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": config.userAgent, Accept: "application/json" },
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      if (!res.ok) throw new UpstreamError(`Turath API responded with ${res.status}`, res.status);
      return await res.json();
    } catch (err) {
      clearTimeout(timeoutId);
      const isLast = attempt === config.turathRetries;
      if (err instanceof UpstreamError) throw err;
      if (err instanceof DOMException && err.name === "AbortError") throw new UpstreamError("Turath API timeout", 504);
      if (isLast) throw new UpstreamError("Failed to fetch data from Turath API", 502);
      await delay(200 * (attempt + 1));
    }
  }
  throw new UpstreamError("Failed to fetch data from Turath API", 502);
};
