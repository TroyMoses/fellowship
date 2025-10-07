import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, FolderOpen, Users, Video } from "lucide-react"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">FP</span>
            </div>
            <span className="font-semibold text-lg">Fellowship Platform</span>
          </div>
          <nav className="flex items-center gap-4">
            <Link href="/auth/signin">
              <Button variant="ghost" className="cursor-pointer">
                Sign In
              </Button>
            </Link>
            <Link href="/auth/signin">
              <Button className="cursor-pointer">Get Started</Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-5xl font-bold mb-6 text-balance">Manage Your Fellowship Programs with Ease</h1>
        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto text-pretty">
          A modern platform for educational institutions to schedule sessions, manage content, and track fellow
          progress—all integrated with Google Workspace.
        </p>
        <Link href="/auth/signin">
          <Button size="lg" className="cursor-pointer">
            Start Your Free Trial
          </Button>
        </Link>
      </section>

      {/* Features Grid */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-border bg-card cursor-pointer hover:border-primary/50 transition-colors">
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Calendar className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Session Scheduling</CardTitle>
              <CardDescription>
                Create Google Meet sessions with automatic calendar invites for all fellows
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-border bg-card cursor-pointer hover:border-primary/50 transition-colors">
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <FolderOpen className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Content Management</CardTitle>
              <CardDescription>Organize and share materials through integrated Google Drive folders</CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-border bg-card cursor-pointer hover:border-primary/50 transition-colors">
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Cohort Management</CardTitle>
              <CardDescription>Manage multiple cohorts with automatic access control and permissions</CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-border bg-card cursor-pointer hover:border-primary/50 transition-colors">
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Video className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Google Meet Integration</CardTitle>
              <CardDescription>Seamless video conferencing with one-click join from the platform</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <Card className="border-border bg-card/50">
          <CardContent className="p-12 text-center">
            <h2 className="text-3xl font-bold mb-4">Ready to Transform Your Fellowship Program?</h2>
            <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
              Join institutions worldwide using our platform to deliver exceptional educational experiences.
            </p>
            <Link href="/auth/signin">
              <Button size="lg" className="cursor-pointer">
                Get Started Today
              </Button>
            </Link>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t border-border mt-20">
        <div className="container mx-auto px-4 py-8 text-center text-sm text-muted-foreground">
          <p>&copy; 2025 Fellowship Platform. Built with Next.js and MongoDB.</p>
        </div>
      </footer>
    </div>
  )
}
