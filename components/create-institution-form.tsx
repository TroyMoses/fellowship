"use client";

import type React from "react";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export function CreateInstitutionForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    logo: "",
    adminEmail: "",
    adminName: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/root-admin/create-institution", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create institution");
      }

      toast.success(
        `${formData.name} has been created and ${formData.adminName} has been notified.`
      );

      router.push("/root-admin/institutions");
      router.refresh();
    } catch (error) {
      console.error("[v0] Error creating institution:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to create institution"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name">Institution Name *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="e.g., Tech Fellowship Program"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="logo">Institution Logo URL</Label>
        <Input
          id="logo"
          type="url"
          value={formData.logo}
          onChange={(e) => setFormData({ ...formData, logo: e.target.value })}
          placeholder="https://drive.google.com/file/d/..."
        />
        <p className="text-xs text-muted-foreground">
          Optional: Provide a Google Drive link or direct URL to the institution
          logo
        </p>
      </div>

      <div className="border-t border-border pt-6">
        <h3 className="text-lg font-semibold mb-4">Administrator Details</h3>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="adminName">Admin Name *</Label>
            <Input
              id="adminName"
              value={formData.adminName}
              onChange={(e) =>
                setFormData({ ...formData, adminName: e.target.value })
              }
              placeholder="e.g., John Doe"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="adminEmail">Admin Gmail Address *</Label>
            <Input
              id="adminEmail"
              type="email"
              value={formData.adminEmail}
              onChange={(e) =>
                setFormData({ ...formData, adminEmail: e.target.value })
              }
              placeholder="admin@gmail.com"
              required
            />
            <p className="text-xs text-muted-foreground">
              The admin will use this Gmail account to sign in and manage the
              institution
            </p>
          </div>
        </div>
      </div>

      <div className="flex gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={loading} className="flex-1">
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating...
            </>
          ) : (
            "Create Institution"
          )}
        </Button>
      </div>
    </form>
  );
}
