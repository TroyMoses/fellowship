import "next-auth"
import type { ObjectId } from "mongodb"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      email: string
      name: string
      image?: string
      role: "admin" | "fellow"
      institutionId?: string
    }
  }

  interface User {
    role?: "admin" | "fellow"
    institutionId?: ObjectId
  }
}
