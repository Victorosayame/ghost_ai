const DIRECT_POSTGRES_PROTOCOLS = new Set(["postgres:", "postgresql:"]);
const DEPRECATED_STRICT_SSL_MODES = new Set(["prefer", "require", "verify-ca"]);

export function normalizeDatabaseUrl(databaseUrl: string): string;
export function normalizeDatabaseUrl(databaseUrl: undefined): undefined;
export function normalizeDatabaseUrl(
  databaseUrl: string | undefined,
): string | undefined;
export function normalizeDatabaseUrl(
  databaseUrl: string | undefined,
): string | undefined {
  if (!databaseUrl || databaseUrl.startsWith("prisma+postgres://")) {
    return databaseUrl;
  }

  try {
    const url = new URL(databaseUrl);

    if (!DIRECT_POSTGRES_PROTOCOLS.has(url.protocol)) {
      return databaseUrl;
    }

    const sslMode = url.searchParams.get("sslmode");

    if (!sslMode || !DEPRECATED_STRICT_SSL_MODES.has(sslMode)) {
      return databaseUrl;
    }

    url.searchParams.set("sslmode", "verify-full");

    return url.toString();
  } catch {
    return databaseUrl;
  }
}
