import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { headers } from "next/headers";

/**
 * Rate limiting store (in-memory)
 * In production, use Redis or a database for distributed rate limiting
 */
const rateLimitStore = new Map<string, { daily: number[] }>();

/**
 * Clean up old rate limit entries (prevent memory leak)
 */
function cleanupRateLimitStore() {
  const now = Date.now();
  const oneDayAgo = now - 24 * 60 * 60 * 1000;

  for (const [key, value] of rateLimitStore.entries()) {
    // Remove entries older than 24 hours
    value.daily = value.daily.filter((timestamp) => timestamp > oneDayAgo);

    // Remove the key entirely if no recent requests
    if (value.daily.length === 0) {
      rateLimitStore.delete(key);
    }
  }
}

// Run cleanup every 5 minutes
setInterval(cleanupRateLimitStore, 5 * 60 * 1000);

/**
 * Check rate limit for a user
 * @returns rate limit status and usage info
 */
function checkRateLimit(userId: string): {
  limited: boolean;
  reason?: string;
  retryAfter?: number;
  used: number;
  limit: number;
  remaining: number;
  resetsAt?: number;
} {
  const now = Date.now();
  const dailyLimit = parseInt(process.env.OLLAMA_RATE_LIMIT_PER_DAY || "8", 10);

  // Get or create user's rate limit data
  let userLimits = rateLimitStore.get(userId);
  if (!userLimits) {
    userLimits = { daily: [] };
    rateLimitStore.set(userId, userLimits);
  }

  // Clean up old timestamps (older than 24 hours)
  const oneDayAgo = now - 24 * 60 * 60 * 1000;
  userLimits.daily = userLimits.daily.filter(
    (timestamp) => timestamp > oneDayAgo
  );

  const used = userLimits.daily.length;
  const remaining = Math.max(0, dailyLimit - used);

  // Check daily limit
  if (used >= dailyLimit) {
    const oldestRequest = Math.min(...userLimits.daily);
    const resetsAt = oldestRequest + 24 * 60 * 60 * 1000;
    const retryAfter = Math.ceil((resetsAt - now) / 1000);

    return {
      limited: true,
      reason: `Daily limit of ${dailyLimit} AI requests reached`,
      retryAfter,
      used,
      limit: dailyLimit,
      remaining: 0,
      resetsAt,
    };
  }

  // Add current request timestamp
  userLimits.daily.push(now);

  return {
    limited: false,
    used: used + 1,
    limit: dailyLimit,
    remaining: remaining - 1,
  };
}

/**
 * API Route for Ollama AI requests
 * Features:
 * - Authentication required (only logged-in users)
 * - Rate limiting per user
 * - Server-side Ollama URL (never exposed to browser)
 * - Input validation and sanitization
 */
export async function POST(request: NextRequest) {
  try {
    // 1. AUTHENTICATION CHECK
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json(
        {
          error: "Unauthorized",
          message: "You must be logged in to use AI features",
        },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // 2. RATE LIMITING CHECK
    const rateLimit = checkRateLimit(userId);
    if (rateLimit.limited) {
      return NextResponse.json(
        {
          error: "Rate limit exceeded",
          message: rateLimit.reason,
          retryAfter: rateLimit.retryAfter,
          used: rateLimit.used,
          limit: rateLimit.limit,
          remaining: rateLimit.remaining,
          resetsAt: rateLimit.resetsAt,
        },
        {
          status: 429,
          headers: {
            "Retry-After": rateLimit.retryAfter?.toString() || "86400",
            "X-RateLimit-Limit": rateLimit.limit.toString(),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Used": rateLimit.used.toString(),
          },
        }
      );
    }

    // 3. OLLAMA CONFIGURATION CHECK
    const ollamaUrl = process.env.OLLAMA_URL;
    const ollamaModel = process.env.OLLAMA_MODEL || "llama3.2";
    const ollamaTimeout = parseInt(process.env.OLLAMA_TIMEOUT || "300000", 10);
    const maxPromptLength = parseInt(
      process.env.OLLAMA_MAX_PROMPT_LENGTH || "20000",
      10
    );

    if (!ollamaUrl) {
      return NextResponse.json(
        {
          error: "Ollama not configured",
          message: "OLLAMA_URL environment variable is not set on the server",
        },
        { status: 503 }
      );
    }

    // 4. INPUT VALIDATION
    const { prompt } = await request.json();

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json(
        {
          error: "Invalid input",
          message: "Prompt must be a non-empty string",
        },
        { status: 400 }
      );
    }

    // Sanitize and validate prompt length
    const sanitizedPrompt = prompt.trim();
    if (sanitizedPrompt.length === 0) {
      return NextResponse.json(
        { error: "Invalid input", message: "Prompt cannot be empty" },
        { status: 400 }
      );
    }

    if (sanitizedPrompt.length > maxPromptLength) {
      return NextResponse.json(
        {
          error: "Prompt too long",
          message: `Prompt exceeds maximum length of ${maxPromptLength} characters`,
        },
        { status: 400 }
      );
    }

    // 5. MAKE REQUEST TO OLLAMA
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), ollamaTimeout);

    try {
      const response = await fetch(`${ollamaUrl}/api/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: ollamaModel,
          prompt: sanitizedPrompt,
          stream: true,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(
          `Ollama API error: ${response.status} ${response.statusText}`
        );
      }

      if (!response.body) {
        throw new Error("No response body from Ollama");
      }

      // 6. RETURN STREAMING RESPONSE
      return new NextResponse(response.body, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      });
    } catch (fetchError: any) {
      clearTimeout(timeoutId);

      if (fetchError.name === "AbortError") {
        return NextResponse.json(
          {
            error: "Request timeout",
            message: "AI request took too long and was cancelled",
          },
          { status: 504 }
        );
      }
      throw fetchError;
    }
  } catch (error: any) {
    console.error("Ollama API error:", error);

    const isConnectionError =
      error.message?.includes("fetch") ||
      error.message?.includes("network") ||
      error.message?.includes("ECONNREFUSED");

    return NextResponse.json(
      {
        error: "AI request failed",
        message: isConnectionError
          ? "Cannot connect to Ollama. Make sure Ollama is running."
          : error.message || "Unknown error occurred",
      },
      { status: isConnectionError ? 503 : 500 }
    );
  }
}

/**
 * Check if Ollama is configured and get user's usage stats
 * Authentication optional - returns more info if authenticated
 */
export async function GET(request: NextRequest) {
  const ollamaUrl = process.env.OLLAMA_URL;
  const ollamaModel = process.env.OLLAMA_MODEL || "llama3.2";
  const dailyLimit = parseInt(process.env.OLLAMA_RATE_LIMIT_PER_DAY || "8", 10);

  // Try to get session (optional for this endpoint)
  let usage = null;
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (session?.user) {
      const userId = session.user.id;
      const userLimits = rateLimitStore.get(userId);

      if (userLimits) {
        const now = Date.now();
        const oneDayAgo = now - 24 * 60 * 60 * 1000;
        const dailyRequests = userLimits.daily.filter(
          (timestamp) => timestamp > oneDayAgo
        );
        const used = dailyRequests.length;
        const remaining = Math.max(0, dailyLimit - used);

        let resetsAt = null;
        if (dailyRequests.length > 0) {
          const oldestRequest = Math.min(...dailyRequests);
          resetsAt = oldestRequest + 24 * 60 * 60 * 1000;
        }

        usage = {
          used,
          remaining,
          limit: dailyLimit,
          resetsAt,
        };
      } else {
        usage = {
          used: 0,
          remaining: dailyLimit,
          limit: dailyLimit,
          resetsAt: null,
        };
      }
    }
  } catch (error) {
    // Not authenticated or error getting session - that's okay for GET
  }

  return NextResponse.json({
    configured: !!ollamaUrl,
    model: ollamaUrl ? ollamaModel : null,
    usage,
  });
}
