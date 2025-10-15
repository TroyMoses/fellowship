"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { XCircle } from "lucide-react";

interface CancelSessionDialogProps {
  sessionId: string;
  sessionTitle: string;
}

export function CancelSessionDialog({
  sessionId,
  sessionTitle,
}: CancelSessionDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [reason, setReason] = useState("");

  const handleCancel = async () => {
    if (!reason.trim()) {
      toast.error("Please provide a reason for cancellation");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`/api/sessions/${sessionId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to cancel session");
      }

      toast.success(
        "Session cancelled successfully! Fellows have been notified."
      );
      setOpen(false);
      router.push("/admin/sessions");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive" className="cursor-pointer">
          <XCircle className="mr-2 h-4 w-4" />
          Cancel Session
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cancel Session</DialogTitle>
          <DialogDescription>
            Are you sure you want to cancel "{sessionTitle}"? This action cannot
            be undone.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="reason">Reason for Cancellation *</Label>
            <Textarea
              id="reason"
              placeholder="Please provide a reason for cancelling this session..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              required
            />
          </div>

          <div className="rounded-lg bg-destructive/10 p-4 text-sm">
            <p className="text-destructive">
              All fellows will receive an email notification about the
              cancellation with your reason.
            </p>
          </div>

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="cursor-pointer"
            >
              Keep Session
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleCancel}
              disabled={loading}
              className="cursor-pointer"
            >
              {loading ? "Cancelling..." : "Cancel Session"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
