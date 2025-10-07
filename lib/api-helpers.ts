import { getServerSession } from "next-auth"
import { authOptions } from "./auth"
import { NextResponse } from "next/server"

/**
 * Get authenticated session or return 401 error
 */
export async function getAuthSession() {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    return null
  }

  return session
}

/**
 * Check if user is an admin
 */
export function isAdmin(session: any): boolean {
  return session?.user?.role === "admin"
}

/**
 * Create standardized API error response
 */
export function apiError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status })
}

/**
 * Create standardized API success response
 */
export function apiSuccess(data: any, status = 200) {
  return NextResponse.json(data, { status })
}

/**
 * Validate required fields in request body
 */
export function validateRequired(body: any, fields: string[]): string | null {
  for (const field of fields) {
    if (!body[field]) {
      return `Missing required field: ${field}`
    }
  }
  return null
}
