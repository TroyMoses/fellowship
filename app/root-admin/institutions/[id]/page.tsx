import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  Mail,
  User,
  Calendar,
  ExternalLink,
} from "lucide-react";
import Image from "next/image";
import { ApprovalActions } from "@/components/approval-actions";

/**
 * Utility function to convert a Google Drive 'view' link into a direct image link.
 * This is necessary for next/image component to correctly load the asset.
 * @param url The Google Drive URL (e.g., https://drive.google.com/file/d/{ID}/view)
 * @returns The direct image link (e.g., https://drive.google.com/uc?export=view&id={ID})
 */
function getDirectGoogleDriveUrl(url: string): string {
  if (!url || typeof url !== "string") {
    return "/placeholder.svg";
  }

  // Regular expression to find the file ID in the standard URL structure: /d/{ID}/view
  const match = url.match(/\/d\/(.+?)\/view/);

  if (match && match[1]) {
    const fileId = match[1];
    // Construct the direct image link
    return `https://drive.google.com/uc?export=view&id=${fileId}`;
  }

  // If it's already the direct format or another unknown format, return it as is
  return url;
}

export default async function InstitutionDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user || session.user.role !== "root_admin") {
    redirect("/");
  }

  const db = await getDatabase();

  const institution = await db.collection("institutions").findOne({
    _id: new ObjectId(params.id),
  });

  if (!institution) {
    redirect("/root-admin/institutions");
  }

  const admin = await db.collection("users").findOne({
    institutionId: institution._id,
  });

  // Calculate the correct logo source early
  const logoSrc = institution.logo
    ? getDirectGoogleDriveUrl(institution.logo as string)
    : "/placeholder.svg";

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge
            variant="outline"
            className="bg-amber-50 text-amber-700 border-amber-200"
          >
            Pending
          </Badge>
        );
      case "approved":
        return (
          <Badge
            variant="outline"
            className="bg-green-50 text-green-700 border-green-200"
          >
            Approved
          </Badge>
        );
      case "rejected":
        return (
          <Badge
            variant="outline"
            className="bg-red-50 text-red-700 border-red-200"
          >
            Rejected
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/root-admin/institutions">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div className="flex-1">
              <h1 className="text-2xl font-bold">Institution Details</h1>
              <p className="text-sm text-muted-foreground">
                Review and manage institution approval
              </p>
            </div>
            {getStatusBadge(institution.status)}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-4">
                {institution.logo && (
                  <div className="relative h-16 w-16 rounded-lg overflow-hidden bg-muted">
                    <Image
                      // 👈 UPDATED SRC
                      src={logoSrc}
                      alt={institution.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
                <div className="flex-1">
                  <CardTitle className="text-2xl">{institution.name}</CardTitle>
                  <CardDescription>Institution Information</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Building2 className="h-4 w-4" />
                    <span>Institution Name</span>
                  </div>
                  <p className="font-medium">{institution.name}</p>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    <span>Google Account</span>
                  </div>
                  <p className="font-medium">
                    {institution.googleAccountEmail}
                  </p>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>Created Date</span>
                  </div>
                  <p className="font-medium">
                    {new Date(institution.createdAt).toLocaleDateString()}
                  </p>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <ExternalLink className="h-4 w-4" />
                    <span>Institution Logo</span>
                  </div>
                  <a
                    // The link here can still point to the original 'view' URL
                    // since it opens in a new tab, but for consistency,
                    // I'll keep the original `institution.logo` value for the clickable link.
                    href={institution.logo as string}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline"
                  >
                    View Logo Link
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>

          {admin && (
            <Card>
              <CardHeader>
                <CardTitle>Administrator Information</CardTitle>
                <CardDescription>
                  Details about the requesting admin
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <User className="h-4 w-4" />
                      <span>Name</span>
                    </div>
                    <p className="font-medium">{admin.name}</p>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail className="h-4 w-4" />
                      <span>Email</span>
                    </div>
                    <p className="font-medium">{admin.email}</p>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>Registered</span>
                    </div>
                    <p className="font-medium">
                      {new Date(admin.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {institution.status === "pending" && (
            <Card>
              <CardHeader>
                <CardTitle>Approval Actions</CardTitle>
                <CardDescription>
                  Review the institution details and approve or reject the
                  request
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ApprovalActions
                  institutionId={params.id}
                  institutionName={institution.name}
                  adminEmail={admin?.email || ""}
                  adminName={admin?.name || ""}
                />
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
