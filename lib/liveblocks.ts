import { Liveblocks } from "@liveblocks/node";

// Fixed palette of cursor colors for consistent user representation
const CURSOR_COLOR_PALETTE = [
  "#E63946", // red
  "#F1FAEE", // off-white
  "#A8DADC", // light blue
  "#457B9D", // steel blue
  "#1D3557", // dark blue
  "#FFB703", // amber
  "#FB8500", // orange
  "#8ECAE6", // sky blue
];

/**
 * Deterministically map a user ID to a consistent cursor color from the palette.
 * Uses hash of the user ID for consistency across sessions.
 */
export function getUserCursorColor(userId: string): string {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    const char = userId.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }

  const index = Math.abs(hash) % CURSOR_COLOR_PALETTE.length;
  return CURSOR_COLOR_PALETTE[index];
}

// Cached Liveblocks node client instance
let liveblocksClient: Liveblocks | null = null;

export class LiveblocksConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LiveblocksConfigurationError";
  }
}

function resolveLiveblocksSecretKey(): string {
  const secretKey =
    process.env.LIVEBLOCKS_SECRET_KEY?.trim() ||
    process.env.LIVEBLOCKS_SECRET?.trim();

  if (!secretKey) {
    throw new LiveblocksConfigurationError(
      "Missing Liveblocks server secret. Set LIVEBLOCKS_SECRET_KEY in .env.local."
    );
  }

  if (!secretKey.startsWith("sk_")) {
    throw new LiveblocksConfigurationError(
      "Invalid Liveblocks server secret. LIVEBLOCKS_SECRET_KEY must start with 'sk_'."
    );
  }

  return secretKey;
}

/**
 * Get or create a cached Liveblocks node client.
 * Uses the LIVEBLOCKS_SECRET_KEY environment variable for authentication.
 */
export function getLiveblocksClient(): Liveblocks {
  if (!liveblocksClient) {
    liveblocksClient = new Liveblocks({ secret: resolveLiveblocksSecretKey() });
  }

  return liveblocksClient;
}
