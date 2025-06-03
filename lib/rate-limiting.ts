import type { NextRequest } from "next/server"

interface RateLimitConfig {
  windowMs: number // Time window in milliseconds
  maxRequests: number // Maximum requests per window
  skipSuccessfulRequests?: boolean
  skipFailedRequests?: boolean
}

interface RateLimitStore {
  [key: string]: {
    count: number
    resetTime: number
  }
}

// In-memory store (use Redis in production)
const store: RateLimitStore = {}

// Default configurations for different endpoints
export const rateLimitConfigs = {
  // Authentication endpoints - stricter limits
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5, // 5 attempts per 15 minutes
  },
  // API endpoints - moderate limits
  api: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 60, // 60 requests per minute
  },
  // File uploads - stricter limits
  upload: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10, // 10 uploads per minute
  },
  // Azure sync - very strict limits
  azureSync: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 10, // 10 syncs per hour
  },
  // Exchange operations - strict limits
  exchange: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 20, // 20 operations per minute
  },
}

export function createRateLimiter(config: RateLimitConfig) {
  return async (
    request: NextRequest,
  ): Promise<{ success: boolean; limit: number; remaining: number; resetTime: number }> => {
    const identifier = getClientIdentifier(request)
    const key = `${identifier}:${Date.now()}`
    const now = Date.now()
    const windowStart = now - config.windowMs

    // Clean up old entries
    Object.keys(store).forEach((storeKey) => {
      if (store[storeKey].resetTime < now) {
        delete store[storeKey]
      }
    })

    // Get current window key
    const windowKey = `${identifier}:${Math.floor(now / config.windowMs)}`

    if (!store[windowKey]) {
      store[windowKey] = {
        count: 0,
        resetTime: now + config.windowMs,
      }
    }

    const current = store[windowKey]
    current.count++

    const remaining = Math.max(0, config.maxRequests - current.count)
    const success = current.count <= config.maxRequests

    return {
      success,
      limit: config.maxRequests,
      remaining,
      resetTime: current.resetTime,
    }
  }
}

function getClientIdentifier(request: NextRequest): string {
  // Try to get user ID from headers/cookies first
  const userId = request.headers.get("x-user-id") || request.cookies.get("user_id")?.value
  if (userId) {
    return `user:${userId}`
  }

  // Fall back to IP address
  const forwarded = request.headers.get("x-forwarded-for")
  const ip = forwarded ? forwarded.split(",")[0] : request.headers.get("x-real-ip") || "unknown"
  return `ip:${ip}`
}

// Middleware helper
export function withRateLimit(config: RateLimitConfig) {
  const limiter = createRateLimiter(config)

  return async (request: NextRequest, handler: () => Promise<Response>): Promise<Response> => {
    const result = await limiter(request)

    if (!result.success) {
      return new Response(
        JSON.stringify({
          error: "Too many requests",
          message: "Rate limit exceeded. Please try again later.",
          retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000),
        }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "X-RateLimit-Limit": result.limit.toString(),
            "X-RateLimit-Remaining": result.remaining.toString(),
            "X-RateLimit-Reset": result.resetTime.toString(),
            "Retry-After": Math.ceil((result.resetTime - Date.now()) / 1000).toString(),
          },
        },
      )
    }

    // Add rate limit headers to successful responses
    const response = await handler()
    response.headers.set("X-RateLimit-Limit", result.limit.toString())
    response.headers.set("X-RateLimit-Remaining", result.remaining.toString())
    response.headers.set("X-RateLimit-Reset", result.resetTime.toString())

    return response
  }
}

// Hook for client-side rate limit checking
export function useRateLimit() {
  return {
    checkRateLimit: async (endpoint: string) => {
      try {
        const response = await fetch(`/api/rate-limit/check?endpoint=${endpoint}`)
        return await response.json()
      } catch (error) {
        console.error("Rate limit check failed:", error)
        return { success: true, remaining: 0 }
      }
    },
  }
}
