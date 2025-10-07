import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/auth/signin")
  }

  // Redirect based on role
  if (session.user.role === "admin") {
    redirect("/admin")
  } else {
    redirect("/fellow")
  }
}
