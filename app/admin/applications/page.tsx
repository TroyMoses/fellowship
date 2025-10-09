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
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import { FileText, Clock, CheckCircle, XCircle } from "lucide-react";
import { ObjectId } from "mongodb";

export default async function ApplicationsPage() {
  const session = await getServerSession(authOptions);
  const db = await getDatabase();

  const applications = await db
    .collection("applications")
    .find({
      institutionId: new ObjectId(session?.user?.institutionId),
    })
    .sort({ submittedAt: -1 })
    .toArray();

  // Get fellow details for each application
  const fellowIds = applications.map((app) => app.fellowId);
  const fellows = await db
    .collection("users")
    .find({
      _id: { $in: fellowIds },
    })
    .toArray();

  const fellowMap = new Map(fellows.map((f) => [f._id.toString(), f]));

  const pendingApplications = applications.filter(
    (app) => app.status === "pending"
  );
  const approvedApplications = applications.filter(
    (app) => app.status === "approved"
  );
  const rejectedApplications = applications.filter(
    (app) => app.status === "rejected"
  );

  const ApplicationCard = ({ application }: { application: any }) => {
    const fellow = fellowMap.get(application.fellowId.toString());

    return (
      <Link href={`/admin/applications/${application._id.toString()}`}>
        <Card className="cursor-pointer hover:border-primary/50 transition-colors">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage src={fellow?.image || "/placeholder.svg"} />
                  <AvatarFallback>
                    {application.applicationData.fullName?.charAt(0) || "A"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-lg">
                    {application.applicationData.fullName}
                  </CardTitle>
                  <CardDescription>
                    {application.applicationData.email}
                  </CardDescription>
                </div>
              </div>
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
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
              {application.applicationData.motivation}
            </p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>
                Submitted{" "}
                {new Date(application.submittedAt).toLocaleDateString()}
              </span>
            </div>
          </CardContent>
        </Card>
      </Link>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">
          Fellowship Applications
        </h2>
        <p className="text-muted-foreground">
          Review and manage fellowship applications
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {pendingApplications.length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {approvedApplications.length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {rejectedApplications.length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Applications Tabs */}
      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pending">
            Pending ({pendingApplications.length})
          </TabsTrigger>
          <TabsTrigger value="approved">
            Approved ({approvedApplications.length})
          </TabsTrigger>
          <TabsTrigger value="rejected">
            Rejected ({rejectedApplications.length})
          </TabsTrigger>
          <TabsTrigger value="all">All ({applications.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {pendingApplications.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  No pending applications
                </h3>
                <p className="text-muted-foreground text-center">
                  All applications have been reviewed
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {pendingApplications.map((app) => (
                <ApplicationCard key={app._id.toString()} application={app} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="approved" className="space-y-4">
          {approvedApplications.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <CheckCircle className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  No approved applications
                </h3>
                <p className="text-muted-foreground text-center">
                  Approved applications will appear here
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {approvedApplications.map((app) => (
                <ApplicationCard key={app._id.toString()} application={app} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="rejected" className="space-y-4">
          {rejectedApplications.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <XCircle className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  No rejected applications
                </h3>
                <p className="text-muted-foreground text-center">
                  Rejected applications will appear here
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {rejectedApplications.map((app) => (
                <ApplicationCard key={app._id.toString()} application={app} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="all" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {applications.map((app) => (
              <ApplicationCard key={app._id.toString()} application={app} />
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
