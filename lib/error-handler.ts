import { NextResponse } from "next/server"

export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode = 500,
    public code?: string,
  ) {
    super(message)
    this.name = "AppError"
  }
}

export function handleError(error: unknown) {
  console.error("[v0] Error:", error)

  if (error instanceof AppError) {
    return NextResponse.json(
      {
        error: error.message,
        code: error.code,
      },
      { status: error.statusCode },
    )
  }

  if (error instanceof Error) {
    return NextResponse.json(
      {
        error: error.message,
      },
      { status: 500 },
    )
  }

  return NextResponse.json(
    {
      error: "An unexpected error occurred",
    },
    { status: 500 },
  )
}
