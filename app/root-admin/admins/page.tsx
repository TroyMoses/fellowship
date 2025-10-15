import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getDatabase } from "@/lib/mongodb";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";
import { ArrowLeft, Users, Mail, Building2 } from "lucide-react";
import Image from "next/image";

/**
 * Utility function to convert a Google Drive 'view' link into a direct image link.
 * This is crucial for next/image and standard <img> tags when loading assets
 * from Google Drive, as the view link often redirects and causes issues.
 * @param url The Google Drive URL (e.g., https://drive.google.com/file/d/{ID}/view)
 * @returns The direct image link (e.g., https://drive.google.com/uc?export=view&id={ID}) or the original URL/placeholder.
 */
function getDirectGoogleDriveUrl(url: string | null | undefined): string {
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

  // If it's not a recognizable Google Drive view URL, return it as is
  return url;
}

export default async function AllAdminsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user || session.user.role !== "root_admin") {
    redirect("/");
  }

  const db = await getDatabase();

  // Get all admins
  const admins = await db
    .collection("users")
    .find({ role: "admin" })
    .sort({ createdAt: -1 })
    .toArray();

  // Get all institutions
  const institutions = await db.collection("institutions").find({}).toArray();
  const institutionMap = new Map(
    institutions.map((inst) => [inst._id.toString(), inst])
  );

  // Define the expected admin type for clarity
  type AdminWithInstitution = {
    _id: any; // You can replace 'any' with the actual type, e.g., ObjectId, if available
    name?: string;
    email?: string;
    image?: string;
    createdAt?: string | Date;
    institutionId?: string;
    institution?: (typeof institutions)[0] | null;
  };

  // Combine admin data with institution info
  const adminsWithInstitutions: AdminWithInstitution[] = admins.map((admin) => {
    const institution = admin.institutionId
      ? institutionMap.get(admin.institutionId.toString())
      : null;
    return { ...admin, institution };
  });

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
              <Link href="/root-admin">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div className="flex-1">
              <h1 className="text-2xl font-bold">All Administrators</h1>
              <p className="text-sm text-muted-foreground">
                View all institution administrators
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Total Administrators
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{admins.length}</div>
            <p className="text-xs text-muted-foreground">
              Across all institutions
            </p>
          </CardContent>
        </Card>

        {adminsWithInstitutions.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No administrators found</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {adminsWithInstitutions.map((admin) => (
              <Card key={admin._id.toString()}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-4 flex-1">
                      <Avatar className="h-12 w-12">
                        {/* 👇 Conversion applied to admin.image */}
                        <AvatarImage
                          src={getDirectGoogleDriveUrl(admin.image)}
                        />
                        <AvatarFallback>
                          {admin.name?.charAt(0) || "A"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg">{admin.name}</CardTitle>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                          <Mail className="h-3 w-3" />
                          <span className="truncate">{admin.email}</span>
                        </div>
                        {admin.institution && (
                          <div className="flex items-center gap-2 mt-2">
                            {admin.institution.logo && (
                              <div className="relative h-6 w-6 rounded overflow-hidden bg-muted">
                                <Image
                                  // 👇 Conversion applied to institution.logo
                                  src={getDirectGoogleDriveUrl(
                                    admin.institution.logo as string
                                  )}
                                  alt={admin.institution.name}
                                  fill
                                  className="object-cover"
                                />
                              </div>
                            )}
                            <div className="flex items-center gap-2 text-sm">
                              <Building2 className="h-3 w-3 text-muted-foreground" />
                              <span className="font-medium">
                                {admin.institution.name}
                              </span>
                              {getStatusBadge(admin.institution.status)}
                            </div>
                          </div>
                        )}
                        <p className="text-xs text-muted-foreground mt-2">
                          Joined:{" "}
                          {new Date(admin.createdAt ?? "").toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    {admin.institution && (
                      <Button asChild size="sm">
                        <Link
                          href={`/root-admin/institutions/${admin.institution._id}`}
                        >
                          View Institution
                        </Link>
                      </Button>
                    )}
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
