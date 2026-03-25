import { Request, Response, NextFunction } from 'express';
import { redisCacher } from '../abstractions/redis/redisCacher';
import logger from '../logger/logger';

const MUTATION_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
const DEFAULT_TTL = 900; // 15 min

// ─── Key Building ─────────────────────────────────────────────────────────────

/**
 * Stable cache key from path + sorted query string.
 * Sorted so  ?a=1&b=2  and  ?b=2&a=1  produce the same key.
 *
 * Example: cache:GET:/products:{"category":"shoes","page":"2"}
 */
function buildCacheKey(req: Request): string {
  const sortedQuery = Object.fromEntries(
    Object.entries(req.query).sort(([a], [b]) => a.localeCompare(b)),
  );

  const baseKey = `cache:GET:${req.path}:${JSON.stringify(sortedQuery)}`;

  // ! handles the protected Routes posioning the cache
  // ! Not appending the user ID makes the cache respond with data of another user
  if (req.userInfo?._id) {
    return `${baseKey}:user:${req.userInfo._id}`;
  }

  return baseKey;
}

/**
 * Extracts the base resource segment from a path for pattern-based invalidation.
 * Strips numeric IDs, UUIDs, and semver-style version prefixes.
 *
 * /api/v1/products/123            → "products"
 * /api/v2/orders/abc-uuid/items   → "orders"
 * /public/categories              → "categories"
 */
function extractBaseResource(path: string): string {
  const UUID_RE = /^[0-9a-f]{8}-([0-9a-f]{4}-){3}[0-9a-f]{12}$/i;
  const ID_RE = /^\d+$/;
  const VER_RE = /^v\d+$/i;

  const segment = path
    .split('/')
    .filter(Boolean)
    .find((s) => !UUID_RE.test(s) && !ID_RE.test(s) && !VER_RE.test(s));

  return segment ?? '';
}

// ─── GET Handler ──────────────────────────────────────────────────────────────

async function handleGetCache(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const key = buildCacheKey(req);

  try {
    const cached = await redisCacher.get<unknown>(key);

    if (cached !== null) {
      logger.info(`[Cache] HIT  ${key}`);
      res.json(cached);
      return;
    }

    logger.info(`[Cache] MISS ${key}`);
  } catch (err) {
    // Redis failure must never block the request
    logger.error(
      `[Cache] GET error, bypassing cache: ${(err as Error).message}`,
    );
    return next();
  }

  // Intercept res.json so we can write to cache after the handler resolves
  const originalJson = res.json.bind(res);

  res.json = (body: unknown) => {
    // Only cache successful responses
    if (res.statusCode >= 200 && res.statusCode < 300) {
      redisCacher
        .set(key, body, DEFAULT_TTL)
        .catch((e) => logger.error('[Cache] SET error:', e.message));
    }
    return originalJson(body);
  };

  next();
}

// ─── Mutation Handler ─────────────────────────────────────────────────────────

function handleMutationInvalidation(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const resource = extractBaseResource(req.path);

  // Run invalidation AFTER the response is sent — not before, not during
  res.on('finish', () => {
    if (res.statusCode >= 200 && res.statusCode < 300 && resource) {
      const pattern = `cache:GET:*/${resource}*`;
      redisCacher
        .deleteByPattern(pattern)
        .then(() => logger.info(`[Cache] INVALIDATED pattern: ${pattern}`))
        .catch((e) => logger.error('[Cache] INVALIDATE error:', e.message));
    }
  });

  next();
}

// ─── Export ───────────────────────────────────────────────────────────────────

export function cacheMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (process.env.USE_REDIS !== 'TRUE') {
    return next();
  }

  const method = req.method.toUpperCase();

  if (method === 'GET') {
    void handleGetCache(req, res, next);
  } else if (MUTATION_METHODS.has(method)) {
    handleMutationInvalidation(req, res, next);
  } else {
    next();
  }
}
