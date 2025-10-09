"use client";

import type React from "react";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, Plus, X } from "lucide-react";

interface InviteFormProps {
  institutionId: string;
  userRole: "admin" | "fellow";
}

export function InviteForm({ institutionId, userRole }: InviteFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emails, setEmails] = useState<string[]>([""]);
  const [message, setMessage] = useState("");

  const addEmailField = () => {
    setEmails([...emails, ""]);
  };

  const removeEmailField = (index: number) => {
    setEmails(emails.filter((_, i) => i !== index));
  };

  const updateEmail = (index: number, value: string) => {
    const newEmails = [...emails];
    newEmails[index] = value;
    setEmails(newEmails);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Filter out empty emails
    const validEmails = emails.filter((email) => email.trim() !== "");

    if (validEmails.length === 0) {
      toast.error("Please enter at least one email address");
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch("/api/invitations/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          institutionId,
          emails: validEmails,
          message,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to send invitations");
      }

      toast.success(
        `Successfully sent ${validEmails.length} invitation${
          validEmails.length > 1 ? "s" : ""
        }!`
      );
      setEmails([""]);
      setMessage("");
    } catch (error) {
      console.error("Error sending invitations:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to send invitations"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Email Addresses</Label>
          {emails.map((email, index) => (
            <div key={index} className="flex gap-2">
              <Input
                type="email"
                value={email}
                onChange={(e) => updateEmail(index, e.target.value)}
                placeholder="fellow@example.com"
                required={index === 0}
              />
              {emails.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeEmailField(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addEmailField}
            className="w-full bg-transparent"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Another Email
          </Button>
        </div>

        <div className="space-y-2">
          <Label htmlFor="message">Personal Message (Optional)</Label>
          <Textarea
            id="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Add a personal message to your invitation..."
            rows={4}
          />
        </div>
      </div>

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Sending Invitations...
          </>
        ) : (
          `Send ${emails.filter((e) => e.trim()).length} Invitation${
            emails.filter((e) => e.trim()).length !== 1 ? "s" : ""
          }`
        )}
      </Button>
    </form>
  );
}
