import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    NODE_ENV: z.enum(["development", "test", "production"]).optional(),
    DB_FILE: z.string(),
    BETTER_AUTH_SECRET: z.string(),
    BETTER_AUTH_URL: z.string().url(),
    MICROSOFT_CLIENT_ID: z.string(),
    MICROSOFT_CLIENT_SECRET: z.string(),
    OLLAMA_URL: z.string().url().optional(),
    OLLAMA_MODEL: z.string().optional(),
    OLLAMA_RATE_LIMIT_PER_MINUTE: z.string().optional(),
    OLLAMA_RATE_LIMIT_PER_HOUR: z.string().optional(),
    OLLAMA_TIMEOUT: z.string().optional(),
    OLLAMA_MAX_PROMPT_LENGTH: z.string().optional(),
    CANVAS_API_URL: z.string().url().optional(),
    CANVAS_API_TOKEN: z.string().optional(),
  },
  client: {
    NEXT_PUBLIC_BETTER_AUTH_URL: z.string().url().optional(),
  },
  runtimeEnv: {
    NODE_ENV: process.env.NODE_ENV,
    DB_FILE: process.env.DB_FILE,
    BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
    BETTER_AUTH_URL: process.env.BETTER_AUTH_URL,
    MICROSOFT_CLIENT_ID: process.env.MICROSOFT_CLIENT_ID,
    MICROSOFT_CLIENT_SECRET: process.env.MICROSOFT_CLIENT_SECRET,
    NEXT_PUBLIC_BETTER_AUTH_URL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL,
    OLLAMA_URL: process.env.OLLAMA_URL,
    OLLAMA_MODEL: process.env.OLLAMA_MODEL,
    OLLAMA_RATE_LIMIT_PER_MINUTE: process.env.OLLAMA_RATE_LIMIT_PER_MINUTE,
    OLLAMA_RATE_LIMIT_PER_HOUR: process.env.OLLAMA_RATE_LIMIT_PER_HOUR,
    OLLAMA_TIMEOUT: process.env.OLLAMA_TIMEOUT,
    OLLAMA_MAX_PROMPT_LENGTH: process.env.OLLAMA_MAX_PROMPT_LENGTH,
    CANVAS_API_URL: process.env.CANVAS_API_URL,
    CANVAS_API_TOKEN: process.env.CANVAS_API_TOKEN,
  },
});
