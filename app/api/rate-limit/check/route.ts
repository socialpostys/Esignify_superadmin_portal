import { type NextRequest, NextResponse } from "next/server"
import { rateLimitConfigs, createRateLimiter } from "@/lib/rate-limiting"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const endpoint = searchParams.get("endpoint") || "api"

    // Get the appropriate rate limit config
    const config = rateLimitConfigs[endpoint as keyof typeof rateLimitConfigs] || rateLimitConfigs.api

    // Create rate limiter and check
    const limiter = createRateLimiter(config)
    const result = await limiter(request)

    return NextResponse.json({
      success: result.success,
      limit: result.limit,
      remaining: result.remaining,
      resetTime: result.resetTime,
      retryAfter: result.success ? 0 : Math.ceil((result.resetTime - Date.now()) / 1000),
    })
  } catch (error) {
    console.error("Rate limit check error:", error)
    return NextResponse.json({ error: "Failed to check rate limit" }, { status: 500 })
  }
}
