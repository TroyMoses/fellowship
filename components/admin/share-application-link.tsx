"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Share2, Copy, Facebook, Twitter, Linkedin, Mail } from "lucide-react";

interface ShareApplicationLinkProps {
  institutionId: string;
  institutionName: string;
}

export function ShareApplicationLink({
  institutionId,
  institutionName,
}: ShareApplicationLinkProps) {
  const [copied, setCopied] = useState(false);

  // Generate the shareable application link
  const applicationUrl = `${
    typeof window !== "undefined" ? window.location.origin : ""
  }/fellow/fellowships/${institutionId}/apply`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(applicationUrl);
      setCopied(true);
      toast.success("Link copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error("Failed to copy link");
    }
  };

  const shareToSocial = (platform: string) => {
    const text = `Apply to join ${institutionName} Fellowship Program!`;
    const encodedUrl = encodeURIComponent(applicationUrl);
    const encodedText = encodeURIComponent(text);

    let shareUrl = "";

    switch (platform) {
      case "twitter":
        shareUrl = `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`;
        break;
      case "facebook":
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
        break;
      case "linkedin":
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
        break;
      case "email":
        shareUrl = `mailto:?subject=${encodedText}&body=${encodedText}%0A%0A${encodedUrl}`;
        break;
    }

    if (shareUrl) {
      window.open(shareUrl, "_blank", "width=600,height=400");
    }
  };

  return (
    <Card className="border-primary/50 bg-primary/5">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Share2 className="h-5 w-5 text-primary" />
          <CardTitle>Share Application Link</CardTitle>
        </div>
        <CardDescription>
          Share this link with potential fellows to apply to your fellowship
          program
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            value={applicationUrl}
            readOnly
            className="font-mono text-sm"
          />
          <Button
            onClick={handleCopy}
            variant="outline"
            className="cursor-pointer shrink-0 bg-transparent"
          >
            <Copy className="h-4 w-4 mr-2" />
            {copied ? "Copied!" : "Copy"}
          </Button>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => shareToSocial("twitter")}
            variant="outline"
            size="sm"
            className="cursor-pointer"
          >
            <Twitter className="h-4 w-4 mr-2" />
            Twitter
          </Button>
          <Button
            onClick={() => shareToSocial("facebook")}
            variant="outline"
            size="sm"
            className="cursor-pointer"
          >
            <Facebook className="h-4 w-4 mr-2" />
            Facebook
          </Button>
          <Button
            onClick={() => shareToSocial("linkedin")}
            variant="outline"
            size="sm"
            className="cursor-pointer"
          >
            <Linkedin className="h-4 w-4 mr-2" />
            LinkedIn
          </Button>
          <Button
            onClick={() => shareToSocial("email")}
            variant="outline"
            size="sm"
            className="cursor-pointer"
          >
            <Mail className="h-4 w-4 mr-2" />
            Email
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
