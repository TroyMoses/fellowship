import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getDatabase } from "@/lib/mongodb";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft, Building2 } from "lucide-react";
import Image from "next/image";

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
  // (though the regex covers the primary use case)
  return url;
}

export default async function InstitutionsListPage({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user || session.user.role !== "root_admin") {
    redirect("/");
  }

  const db = await getDatabase();

  // Build query based on status filter
  const query = searchParams.status ? { status: searchParams.status } : {};

  const institutions = await db
    .collection("institutions")
    .find(query)
    .sort({ createdAt: -1 })
    .toArray();

  // Get admin info for each institution
  type AdminUser = {
    name?: string;
    email?: string;
    [key: string]: any;
  };

  type InstitutionWithAdmin = {
    _id: (typeof institutions)[0]["_id"];
    name: string;
    logo?: string;
    status: string;
    createdAt: Date | string;
    admin: AdminUser | null;
    [key: string]: any;
  };

  const institutionsWithAdmins: InstitutionWithAdmin[] = await Promise.all(
    institutions.map(async (inst) => {
      const admin = await db.collection("users").findOne({
        institutionId: inst._id,
      });
      return { ...inst, admin } as InstitutionWithAdmin;
    })
  );

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
              <h1 className="text-2xl font-bold">Institutions</h1>
              <p className="text-sm text-muted-foreground">
                {searchParams.status
                  ? `Showing ${searchParams.status} institutions`
                  : "All institutions"}
              </p>
            </div>
            <Button asChild>
              <Link href="/root-admin/institutions/create">
                <Building2 className="h-4 w-4 mr-2" />
                Create Institution
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="flex gap-2 mb-6">
          <Button
            variant={!searchParams.status ? "default" : "outline"}
            asChild
          >
            <Link href="/root-admin/institutions">All</Link>
          </Button>
          <Button
            variant={searchParams.status === "pending" ? "default" : "outline"}
            asChild
          >
            <Link href="/root-admin/institutions?status=pending">Pending</Link>
          </Button>
          <Button
            variant={searchParams.status === "approved" ? "default" : "outline"}
            asChild
          >
            <Link href="/root-admin/institutions?status=approved">
              Approved
            </Link>
          </Button>
          <Button
            variant={searchParams.status === "rejected" ? "default" : "outline"}
            asChild
          >
            <Link href="/root-admin/institutions?status=rejected">
              Rejected
            </Link>
          </Button>
        </div>

        {institutionsWithAdmins.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No institutions found</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {institutionsWithAdmins.map((institution) => {
              // 👈 LOGIC ADDED HERE
              const logoSrc = institution.logo
                ? getDirectGoogleDriveUrl(institution.logo as string)
                : "/placeholder.svg";

              return (
                <Card key={institution._id.toString()}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-4">
                        {institution.logo && (
                          <div className="relative h-12 w-12 rounded-lg overflow-hidden bg-muted">
                            <Image
                              // 👈 SRC PROP UPDATED
                              src={logoSrc}
                              alt={institution.name}
                              fill
                              className="object-cover"
                            />
                          </div>
                        )}
                        <div>
                          <CardTitle className="text-lg">
                            {institution.name}
                          </CardTitle>
                          <p className="text-sm text-muted-foreground">
                            Admin: {institution.admin?.name || "Unknown"} (
                            {institution.admin?.email || "N/A"})
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Created:{" "}
                            {new Date(
                              institution.createdAt
                            ).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(institution.status)}
                        <Button asChild size="sm">
                          <Link
                            href={`/root-admin/institutions/${institution._id}`}
                          >
                            View Details
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
