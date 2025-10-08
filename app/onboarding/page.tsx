"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Users, GraduationCap } from "lucide-react";
import { toast } from "sonner";

export default function OnboardingPage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<"admin" | "fellow" | null>(
    null
  );

  useEffect(() => {
    if (session?.user?.role) {
      console.log("[v0] User has role, redirecting", {
        role: session.user.role,
      });
      if (session.user.role === "admin") {
        router.push("/admin");
      } else {
        router.push("/fellow");
      }
    }
  }, [session, router]);

  const handleRoleSelection = async (role: "admin" | "fellow") => {
    setIsLoading(true);
    setSelectedRole(role);

    try {
      console.log("[v0] Setting role", { role });

      const response = await fetch("/api/user/role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });

      if (!response.ok) {
        throw new Error("Failed to set role");
      }

      const data = await response.json();
      console.log("[v0] Role set successfully", data);

      toast.success(`Welcome! Setting up your ${role} dashboard...`);

      console.log("[v0] Updating session...");
      await update();

      setTimeout(() => {
        console.log("[v0] Redirecting to dashboard");
        if (role === "admin") {
          router.push("/admin");
        } else {
          router.push("/fellow");
        }
        router.refresh();
      }, 1000);
    } catch (error) {
      console.error("[v0] Error setting role:", error);
      toast.error("Something went wrong. Please try again.");
      setIsLoading(false);
      setSelectedRole(null);
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2 text-balance">
            Welcome to Fellowship Platform
          </h1>
          <p className="text-muted-foreground">
            Choose your role to get started
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card className="border-border hover:border-primary transition-colors cursor-pointer">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <CardTitle>Institution Admin</CardTitle>
              </div>
              <CardDescription>
                Manage cohorts, schedule sessions, and oversee your fellowship
                program
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={() => handleRoleSelection("admin")}
                disabled={isLoading}
                className="w-full cursor-pointer"
              >
                {isLoading && selectedRole === "admin" ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Setting up...
                  </>
                ) : (
                  "Continue as Admin"
                )}
              </Button>
            </CardContent>
          </Card>

          <Card className="border-border hover:border-primary transition-colors cursor-pointer">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <GraduationCap className="h-5 w-5 text-primary" />
                </div>
                <CardTitle>Fellow</CardTitle>
              </div>
              <CardDescription>
                Access sessions, view content, and participate in your
                fellowship program
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={() => handleRoleSelection("fellow")}
                disabled={isLoading}
                className="w-full cursor-pointer"
                variant="outline"
              >
                {isLoading && selectedRole === "fellow" ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Setting up...
                  </>
                ) : (
                  "Continue as Fellow"
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
