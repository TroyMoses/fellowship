"use client";

import type React from "react";

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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Users, GraduationCap, Upload } from "lucide-react";
import { toast } from "sonner";

export default function OnboardingPage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<"admin" | "fellow" | null>(
    null
  );
  const [showAdminForm, setShowAdminForm] = useState(false);
  const [institutionName, setInstitutionName] = useState("");
  const [institutionLogo, setInstitutionLogo] = useState("");

  useEffect(() => {
    if (session?.user?.role) {
      console.log("[v0] User has role, checking approval status", {
        role: session.user.role,
        approvalStatus: session.user.approvalStatus,
      });

      if (session.user.role === "root_admin") {
        router.push("/root-admin");
      } else if (session.user.role === "admin") {
        if (session.user.approvalStatus === "approved") {
          console.log("[v0] Approved admin, redirecting to dashboard");
          router.push("/admin");
        } else if (session.user.approvalStatus === "pending") {
          console.log("[v0] Pending admin, redirecting to pending page");
          router.push("/auth/pending");
        }
        // If rejected or no status, stay on onboarding
      } else if (session.user.role === "fellow") {
        router.push("/fellow");
      }
    }
  }, [session, router]);

  const handleRoleSelection = async (role: "admin" | "fellow") => {
    setSelectedRole(role);

    if (role === "admin") {
      setShowAdminForm(true);
    } else {
      await submitRole(role);
    }
  };

  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!institutionName.trim()) {
      toast.error("Please enter an institution name");
      return;
    }

    if (!institutionLogo.trim()) {
      toast.error(
        "Please provide a Google Drive link for your institution logo"
      );
      return;
    }

    await submitRole("admin", {
      institutionName: institutionName.trim(),
      institutionLogo: institutionLogo.trim(),
    });
  };

  const submitRole = async (
    role: "admin" | "fellow",
    institutionData?: { institutionName: string; institutionLogo: string }
  ) => {
    setIsLoading(true);

    try {
      console.log("[v0] Setting role", { role, institutionData });

      const response = await fetch("/api/user/role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, ...institutionData }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to set role");
      }

      console.log("[v0] Role set successfully", data);

      if (data.pending) {
        toast.success(
          "Admin request submitted! You'll receive an email once approved."
        );
        // Redirect to a pending page or sign out
        setTimeout(() => {
          router.push("/auth/pending");
        }, 2000);
      } else {
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
      }
    } catch (error) {
      console.error("[v0] Error setting role:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Something went wrong. Please try again."
      );
      setIsLoading(false);
      setSelectedRole(null);
      setShowAdminForm(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (showAdminForm) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-border">
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <CardTitle>Institution Details</CardTitle>
            </div>
            <CardDescription>
              Provide your institution information to complete registration
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAdminSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="institutionName">Institution Name</Label>
                <Input
                  id="institutionName"
                  placeholder="e.g., Tech Fellowship Program"
                  value={institutionName}
                  onChange={(e) => setInstitutionName(e.target.value)}
                  disabled={isLoading}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="institutionLogo">
                  Institution Logo (Google Drive Link)
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="institutionLogo"
                    placeholder="https://drive.google.com/file/d/..."
                    value={institutionLogo}
                    onChange={(e) => setInstitutionLogo(e.target.value)}
                    disabled={isLoading}
                    required
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    disabled={isLoading}
                    onClick={() =>
                      window.open("https://drive.google.com", "_blank")
                    }
                  >
                    <Upload className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Upload your logo to Google Drive and paste the shareable link
                  here
                </p>
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowAdminForm(false);
                    setSelectedRole(null);
                    setInstitutionName("");
                    setInstitutionLogo("");
                  }}
                  disabled={isLoading}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 cursor-pointer"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    "Submit Request"
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
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
