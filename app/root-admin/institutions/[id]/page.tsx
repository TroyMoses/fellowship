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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  Mail,
  User,
  Calendar,
  ExternalLink,
  Users,
  GraduationCap,
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
    role: "admin",
  });

  const cohorts = await db
    .collection("cohorts")
    .find({ institutionId: institution._id })
    .sort({ createdAt: -1 })
    .toArray();

  const fellows = await db
    .collection("users")
    .find({ institutionId: institution._id, role: "fellow" })
    .sort({ createdAt: -1 })
    .toArray();

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

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="grid gap-6">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Cohorts
                </CardTitle>
                <GraduationCap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{cohorts.length}</div>
                <p className="text-xs text-muted-foreground">Active programs</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Fellows
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{fellows.length}</div>
                <p className="text-xs text-muted-foreground">
                  Enrolled students
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Status</CardTitle>
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold capitalize">
                  {institution.status}
                </div>
                <p className="text-xs text-muted-foreground">
                  Institution status
                </p>
              </CardContent>
            </Card>
          </div>

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
                  Details about the institution admin
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={admin.image || "/placeholder.svg"} />
                    <AvatarFallback>
                      {admin.name?.charAt(0) || "A"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid gap-4 md:grid-cols-2 flex-1">
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
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Cohorts ({cohorts.length})</CardTitle>
              <CardDescription>
                Fellowship programs in this institution
              </CardDescription>
            </CardHeader>
            <CardContent>
              {cohorts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <GraduationCap className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No cohorts created yet</p>
                </div>
              ) : (
                <div className="grid gap-3">
                  {cohorts.map((cohort) => (
                    <div
                      key={cohort._id.toString()}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex-1">
                        <h4 className="font-medium">{cohort.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {cohort.description || "No description"}
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <span>
                            Start:{" "}
                            {new Date(cohort.startDate).toLocaleDateString()}
                          </span>
                          <span>
                            End: {new Date(cohort.endDate).toLocaleDateString()}
                          </span>
                          <span>{cohort.fellowIds?.length || 0} fellows</span>
                        </div>
                      </div>
                      <Badge
                        variant={
                          cohort.status === "active" ? "default" : "secondary"
                        }
                      >
                        {cohort.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Fellows ({fellows.length})</CardTitle>
              <CardDescription>
                Students enrolled in this institution
              </CardDescription>
            </CardHeader>
            <CardContent>
              {fellows.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No fellows enrolled yet</p>
                </div>
              ) : (
                <div className="grid gap-3 md:grid-cols-2">
                  {fellows.map((fellow) => (
                    <div
                      key={fellow._id.toString()}
                      className="flex items-center gap-3 p-3 border rounded-lg"
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={fellow.image || "/placeholder.svg"} />
                        <AvatarFallback>
                          {fellow.name?.charAt(0) || "F"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{fellow.name}</p>
                        <p className="text-sm text-muted-foreground truncate">
                          {fellow.email}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {fellow.cohortIds?.length || 0} cohort
                          {fellow.cohortIds?.length !== 1 ? "s" : ""}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

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
