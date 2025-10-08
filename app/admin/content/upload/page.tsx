"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { ArrowLeft, Upload } from "lucide-react";
import Link from "next/link";

export default function UploadContentPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [cohorts, setCohorts] = useState<any[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    cohortId: "",
    title: "",
    description: "",
    type: "document" as "document" | "video" | "presentation" | "other",
  });

  useEffect(() => {
    fetchCohorts();
  }, []);

  const fetchCohorts = async () => {
    try {
      const response = await fetch("/api/cohorts");
      const data = await response.json();
      setCohorts(data.cohorts || []);
    } catch (error) {
      console.error("[v0] Failed to fetch cohorts:", error);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);

      // Auto-fill title if empty
      if (!formData.title) {
        setFormData({ ...formData, title: selectedFile.name });
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!file) {
      toast.error("Please select a file to upload");
      return;
    }

    setLoading(true);

    try {
      // Convert file to base64
      const reader = new FileReader();
      reader.readAsDataURL(file);

      reader.onload = async () => {
        const base64 = reader.result as string;

        const response = await fetch("/api/content", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            cohortId: formData.cohortId,
            title: formData.title,
            description: formData.description,
            type: formData.type,
            fileName: file.name,
            mimeType: file.type,
            fileData: base64,
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Failed to upload content");
        }

        toast.success("Content uploaded successfully to Google Drive!");
        router.push("/admin/content");
      };

      reader.onerror = () => {
        throw new Error("Failed to read file");
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      toast.error(error.message);
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <Link href="/admin/content">
          <Button variant="ghost" className="mb-4 cursor-pointer">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Content
          </Button>
        </Link>
        <h2 className="text-3xl font-bold tracking-tight">Upload Content</h2>
        <p className="text-muted-foreground">
          Upload files to Google Drive and share with fellows
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Content Details</CardTitle>
          <CardDescription>
            Upload a file and add information about it
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="cohortId">Cohort *</Label>
              <Select
                value={formData.cohortId}
                onValueChange={(value) =>
                  setFormData({ ...formData, cohortId: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a cohort" />
                </SelectTrigger>
                <SelectContent>
                  {cohorts.map((cohort) => (
                    <SelectItem key={cohort._id} value={cohort._id}>
                      {cohort.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="file">File *</Label>
              <div className="flex items-center gap-4">
                <Input
                  id="file"
                  type="file"
                  onChange={handleFileChange}
                  required
                  className="cursor-pointer"
                />
              </div>
              {file && (
                <p className="text-sm text-muted-foreground">
                  Selected: {file.name} ({(file.size / 1024 / 1024).toFixed(2)}{" "}
                  MB)
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                placeholder="e.g., Week 1 Presentation"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Brief description of this content..."
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Content Type *</Label>
              <Select
                value={formData.type}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                onValueChange={(value: any) =>
                  setFormData({ ...formData, type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="document">Document</SelectItem>
                  <SelectItem value="video">Video</SelectItem>
                  <SelectItem value="presentation">Presentation</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="rounded-lg bg-primary/10 p-4 text-sm">
              <p className="text-primary">
                This file will be uploaded to the cohort&apos;s Google Drive
                folder and all fellows will have access to view it.
              </p>
            </div>

            <div className="flex gap-4">
              <Button
                type="submit"
                disabled={loading || cohorts.length === 0}
                className="cursor-pointer"
              >
                {loading ? (
                  <>Uploading...</>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload to Drive
                  </>
                )}
              </Button>
              <Link href="/admin/content">
                <Button
                  type="button"
                  variant="outline"
                  className="cursor-pointer bg-transparent"
                >
                  Cancel
                </Button>
              </Link>
            </div>

            {cohorts.length === 0 && (
              <p className="text-sm text-muted-foreground">
                You need to create a cohort first before uploading content.
              </p>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
