# Ollama API Security Documentation

## Overview

The Ollama API route (`/api/ollama`) implements enterprise-grade security features to protect your AI infrastructure and prevent abuse.

## Security Features

### 🔐 Authentication

**Requirement:** Users must be logged in to access AI features.

- Uses Better Auth session validation
- Checks session on every request
- Returns 401 Unauthorized if not authenticated
- Session is validated server-side (cannot be spoofed)

**Implementation:**

```typescript
const session = await auth.api.getSession({ headers: await headers() });
if (!session?.user) {
  return 401 Unauthorized
}
```

### 🚦 Rate Limiting

**Two-tier rate limiting per user:**

1. **Per Minute:** Default 10 requests/minute
2. **Per Hour:** Default 50 requests/hour

**Features:**

- User-specific limits (tracked by user ID)
- Automatic cleanup of old entries (prevents memory leaks)
- Returns 429 with `Retry-After` header
- Configurable via environment variables

**Configuration:**

```bash
OLLAMA_RATE_LIMIT_PER_MINUTE=10
OLLAMA_RATE_LIMIT_PER_HOUR=50
```

**Response when rate limited:**

```json
{
  "error": "Rate limit exceeded",
  "message": "Rate limit exceeded: 10 requests per minute",
  "retryAfter": 45
}
```

### 🛡️ Input Validation

**All inputs are validated and sanitized:**

1. **Type checking:** Ensures prompt is a string
2. **Length validation:** Prevents excessively long prompts
3. **Sanitization:** Trims whitespace
4. **Non-empty check:** Rejects empty prompts

**Configuration:**

```bash
OLLAMA_MAX_PROMPT_LENGTH=10000  # characters
```

### ⏱️ Timeout Protection

**Prevents long-running requests from blocking resources:**

- Default timeout: 5 minutes (300,000ms)
- Automatically aborts requests that exceed timeout
- Returns 504 Gateway Timeout
- Configurable via environment variables

**Configuration:**

```bash
OLLAMA_TIMEOUT=300000  # milliseconds
```

### 🔒 Server-Side Secrets

**Ollama URL is never exposed to the browser:**

- All environment variables are server-side only
- No `NEXT_PUBLIC_*` prefixes
- API route acts as a secure proxy
- Client only communicates with Next.js API

### 🎯 Error Handling

**Comprehensive error handling:**

- Connection errors (Ollama not running)
- Timeout errors
- Rate limit errors
- Authentication errors
- Input validation errors
- Generic server errors

All errors return appropriate HTTP status codes and user-friendly messages.

## Rate Limiting Architecture

### In-Memory Store (Current)

```typescript
const rateLimitStore = new Map<
  string,
  {
    minute: number[]; // timestamps in last minute
    hour: number[]; // timestamps in last hour
  }
>();
```

**Pros:**

- Fast and simple
- No external dependencies
- Good for single-server deployments

**Cons:**

- Not shared across multiple servers
- Lost on server restart
- Memory usage grows with users

### Production Recommendation: Redis

For production deployments with multiple servers, use Redis:

```typescript
import { Redis } from "ioredis";

const redis = new Redis(process.env.REDIS_URL);

async function checkRateLimit(userId: string) {
  const minuteKey = `ratelimit:${userId}:minute`;
  const hourKey = `ratelimit:${userId}:hour`;

  const [minuteCount, hourCount] = await Promise.all([
    redis.incr(minuteKey),
    redis.incr(hourKey),
  ]);

  await Promise.all([redis.expire(minuteKey, 60), redis.expire(hourKey, 3600)]);

  // Check limits...
}
```

## Configuration Reference

### Required (Minimum Setup)

```bash
# Authentication
BETTER_AUTH_SECRET=your-secret-key
BETTER_AUTH_URL=http://localhost:3000

# Database
DB_FILE=./local.db

# OAuth
MICROSOFT_CLIENT_ID=your-client-id
MICROSOFT_CLIENT_SECRET=your-client-secret
```

### Optional (AI Features)

```bash
# Ollama Configuration
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2

# Rate Limiting
OLLAMA_RATE_LIMIT_PER_MINUTE=10
OLLAMA_RATE_LIMIT_PER_HOUR=50

# Advanced
OLLAMA_TIMEOUT=300000
OLLAMA_MAX_PROMPT_LENGTH=10000
```

## Usage Examples

### Successful Request

```bash
curl -X POST http://localhost:3000/api/ollama \
  -H "Content-Type: application/json" \
  -H "Cookie: better-auth.session_token=..." \
  -d '{"prompt": "Improve this text: Hello world"}'
```

**Response:** Streaming AI-generated content

### Rate Limited

```bash
HTTP/1.1 429 Too Many Requests
Retry-After: 45
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 0

{
  "error": "Rate limit exceeded",
  "message": "Rate limit exceeded: 10 requests per minute",
  "retryAfter": 45
}
```

### Unauthorized

```bash
HTTP/1.1 401 Unauthorized

{
  "error": "Unauthorized",
  "message": "You must be logged in to use AI features"
}
```

## Monitoring & Logging

### What Gets Logged

- Authentication failures
- Rate limit violations
- Ollama connection errors
- Request timeouts
- Invalid input attempts

### Production Monitoring

Consider adding:

1. **Metrics:**

   - Request count per user
   - Average response time
   - Rate limit hit rate
   - Error rate

2. **Alerts:**

   - High rate limit violations (possible abuse)
   - Ollama connection failures
   - Unusual traffic patterns

3. **Audit Logs:**
   - Who accessed AI features
   - What prompts were sent
   - When rate limits were hit

## Security Best Practices

### ✅ Do's

- ✓ Set strong `BETTER_AUTH_SECRET` (use `openssl rand -base64 32`)
- ✓ Use HTTPS in production
- ✓ Adjust rate limits based on your Ollama capacity
- ✓ Monitor for abuse patterns
- ✓ Keep Ollama URL internal (not public)
- ✓ Regularly update dependencies

### ❌ Don'ts

- ✗ Never commit `.env.local` to version control
- ✗ Don't use `NEXT_PUBLIC_` for Ollama URL
- ✗ Don't disable authentication in production
- ✗ Don't set rate limits too high (prevents abuse)
- ✗ Don't expose Ollama directly to the internet

## Testing

### Test Authentication

```typescript
// Should fail without auth
const response = await fetch("/api/ollama", {
  method: "POST",
  body: JSON.stringify({ prompt: "test" }),
});
expect(response.status).toBe(401);
```

### Test Rate Limiting

```typescript
// Make 11 requests quickly
for (let i = 0; i < 11; i++) {
  const response = await fetch("/api/ollama", {
    method: "POST",
    headers: { Cookie: sessionCookie },
    body: JSON.stringify({ prompt: "test" }),
  });

  if (i === 10) {
    expect(response.status).toBe(429);
  }
}
```

## Troubleshooting

### Rate Limit Store Growing Too Large

**Symptom:** Memory usage increases over time

**Solution:** The cleanup function runs every 5 minutes. If you need more aggressive cleanup:

```typescript
// Run cleanup every minute
setInterval(cleanupRateLimitStore, 60 * 1000);
```

Or migrate to Redis for automatic expiry.

### Rate Limits Not Working

**Check:**

1. Environment variables are set correctly
2. Server was restarted after env changes
3. User IDs are consistent across requests
4. System clock is accurate

### Authentication Failing

**Check:**

1. Better Auth is configured correctly
2. Session cookies are being sent
3. Session hasn't expired
4. Database connection is working

## Upgrading to Production

When deploying to production:

1. **Use Redis for rate limiting:**

   ```bash
   npm install ioredis
   # Update rate limiting code to use Redis
   ```

2. **Add request logging:**

   ```typescript
   console.log(`[AI] User ${userId} - ${prompt.length} chars`);
   ```

3. **Set up monitoring:**

   - Error tracking (Sentry, etc.)
   - Performance monitoring (New Relic, etc.)
   - Rate limit metrics

4. **Harden security:**
   - Enable HTTPS only
   - Add CORS restrictions
   - Implement request signing
   - Add IP-based rate limiting

## License

Part of the SwiftTasks project.
