import type React from "react"
import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { FellowHeader } from "@/components/fellow/header"

export default async function FellowLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/auth/signin")
  }

  if (session.user.role === "admin") {
    redirect("/admin")
  }

  return (
    <div className="min-h-screen bg-background">
      <FellowHeader />
      <main className="container mx-auto px-4 py-8">{children}</main>
    </div>
  )
}
