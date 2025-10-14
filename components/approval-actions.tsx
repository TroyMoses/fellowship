"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface ApprovalActionsProps {
  institutionId: string;
  institutionName: string;
  adminEmail: string;
  adminName: string;
}

export function ApprovalActions({
  institutionId,
  institutionName,
  adminEmail,
  adminName,
}: ApprovalActionsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleApproval = async (action: "approve" | "reject") => {
    setIsLoading(true);

    try {
      const response = await fetch("/api/root-admin/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          institutionId,
          action,
          institutionName,
          adminEmail,
          adminName,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to process request");
      }

      toast.success(
        action === "approve"
          ? "Institution approved successfully!"
          : "Institution rejected"
      );

      router.push("/root-admin/institutions");
      router.refresh();
    } catch (error) {
      console.error("[v0] Error processing approval:", error);
      toast.error(
        error instanceof Error ? error.message : "Something went wrong"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex gap-4">
      <Button
        onClick={() => handleApproval("approve")}
        disabled={isLoading}
        className="flex-1 cursor-pointer"
        size="lg"
      >
        {isLoading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <CheckCircle className="mr-2 h-4 w-4" />
        )}
        Approve Institution
      </Button>
      <Button
        onClick={() => handleApproval("reject")}
        disabled={isLoading}
        variant="destructive"
        className="flex-1 cursor-pointer"
        size="lg"
      >
        {isLoading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <XCircle className="mr-2 h-4 w-4" />
        )}
        Reject Request
      </Button>
    </div>
  );
}
