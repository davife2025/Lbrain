const map = new Map();
const LIMITS = {
    'ai': { windowMs: 60000, max: 20 },
    'market': { windowMs: 10000, max: 30 },
    'trade': { windowMs: 60000, max: 10 },
    'default': { windowMs: 60000, max: 60 },
};
export function rateLimit(key, type = 'default') {
    const config = LIMITS[type] ?? LIMITS.default;
    const now = Date.now();
    const entry = map.get(key);
    if (!entry || now > entry.resetAt) {
        map.set(key, { count: 1, resetAt: now + config.windowMs });
        return { allowed: true, remaining: config.max - 1 };
    }
    entry.count++;
    if (entry.count > config.max)
        return { allowed: false, remaining: 0 };
    return { allowed: true, remaining: config.max - entry.count };
}
//# sourceMappingURL=rateLimit.js.map