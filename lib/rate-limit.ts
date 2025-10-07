import type { NextRequest } from "next/server"

interface RateLimitStore {
  [key: string]: {
    count: number
    resetTime: number
  }
}

const store: RateLimitStore = {}

export interface RateLimitConfig {
  interval: number // in milliseconds
  maxRequests: number
}

/**
 * Simple in-memory rate limiter
 * For production, use Redis or a dedicated rate limiting service
 */
export function rateLimit(config: RateLimitConfig) {
  return async (req: NextRequest, identifier: string): Promise<{ success: boolean; remaining: number }> => {
    const now = Date.now()
    const key = `${identifier}`

    // Clean up old entries
    if (store[key] && store[key].resetTime < now) {
      delete store[key]
    }

    // Initialize or get current state
    if (!store[key]) {
      store[key] = {
        count: 0,
        resetTime: now + config.interval,
      }
    }

    // Increment count
    store[key].count++

    // Check if limit exceeded
    if (store[key].count > config.maxRequests) {
      return {
        success: false,
        remaining: 0,
      }
    }

    return {
      success: true,
      remaining: config.maxRequests - store[key].count,
    }
  }
}

// Pre-configured rate limiters
export const apiRateLimit = rateLimit({
  interval: 60 * 1000, // 1 minute
  maxRequests: 60,
})

export const uploadRateLimit = rateLimit({
  interval: 60 * 1000, // 1 minute
  maxRequests: 10,
})
