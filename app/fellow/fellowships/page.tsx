import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getDatabase } from "@/lib/mongodb";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Building2, Users, Calendar, CheckCircle } from "lucide-react";
import { ObjectId } from "mongodb";

export default async function FellowshipsPage() {
  const session = await getServerSession(authOptions);
  const db = await getDatabase();

  // Get all institutions (fellowships)
  const institutions = await db.collection("institutions").find({}).toArray();

  // Get user's applications
  const applications = await db
    .collection("applications")
    .find({
      fellowId: new ObjectId(session?.user?.id),
    })
    .toArray();

  // Create a map of institution IDs to application status
  const applicationMap = new Map(
    applications.map((app) => [app.institutionId.toString(), app])
  );

  // Check if user is already part of an institution
  const user = await db
    .collection("users")
    .findOne({ _id: new ObjectId(session?.user?.id) });
  const hasInstitution = !!user?.institutionId;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">
          Available Fellowships
        </h2>
        <p className="text-muted-foreground">
          Browse and apply to fellowship programs
        </p>
      </div>

      {hasInstitution && (
        <Card className="border-primary/50 bg-primary/5">
          <CardContent className="flex items-center gap-3 py-4">
            <CheckCircle className="h-5 w-5 text-primary" />
            <p className="text-sm">
              You are currently enrolled in a fellowship program. You can view
              your content and sessions from the dashboard.
            </p>
          </CardContent>
        </Card>
      )}

      {institutions.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              No fellowships available
            </h3>
            <p className="text-muted-foreground text-center">
              Check back later for new fellowship opportunities
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {institutions.map((institution) => {
            const application = applicationMap.get(institution._id.toString());
            const hasApplied = !!application;

            return (
              <Card key={institution._id.toString()} className="flex flex-col">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-5 w-5 text-primary" />
                      <CardTitle className="text-lg">
                        {institution.name}
                      </CardTitle>
                    </div>
                    {hasApplied && (
                      <Badge
                        variant={
                          application.status === "approved"
                            ? "default"
                            : application.status === "pending"
                            ? "secondary"
                            : "destructive"
                        }
                      >
                        {application.status}
                      </Badge>
                    )}
                  </div>
                  <CardDescription>
                    A comprehensive fellowship program designed to develop
                    future leaders
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col justify-between">
                  <div className="space-y-3 mb-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Users className="h-4 w-4" />
                      <span>Professional development program</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>Multiple cohorts available</span>
                    </div>
                  </div>

                  {hasApplied ? (
                    <Button disabled className="w-full">
                      {application.status === "approved"
                        ? "Approved"
                        : application.status === "pending"
                        ? "Application Pending"
                        : "Application Rejected"}
                    </Button>
                  ) : (
                    <Link
                      href={`/fellow/fellowships/${institution._id.toString()}/apply`}
                      className="w-full"
                    >
                      <Button className="w-full cursor-pointer">
                        Apply Now
                      </Button>
                    </Link>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
