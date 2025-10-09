import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getDatabase } from "@/lib/mongodb";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";
import { ArrowLeft, Calendar, Users, FileText, Video } from "lucide-react";
import { ObjectId } from "mongodb";
import { notFound } from "next/navigation";

export default async function CohortDetailsPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getServerSession(authOptions);
  const db = await getDatabase();

  let cohortId: ObjectId;
  try {
    cohortId = new ObjectId(params.id);
  } catch {
    notFound();
  }

  const cohort = await db.collection("cohorts").findOne({
    _id: cohortId,
    institutionId: new ObjectId(session?.user?.institutionId),
  });

  if (!cohort) {
    notFound();
  }

  // Fetch fellows in this cohort
  const fellows = await db
    .collection("users")
    .find({
      _id: { $in: cohort.fellowIds || [] },
    })
    .toArray();

  // Fetch sessions for this cohort
  const sessions = await db
    .collection("sessions")
    .find({
      cohortId: cohortId,
    })
    .sort({ startTime: -1 })
    .limit(5)
    .toArray();

  // Fetch content for this cohort
  const content = await db
    .collection("content")
    .find({
      cohortId: cohortId,
    })
    .sort({ uploadedAt: -1 })
    .limit(5)
    .toArray();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/cohorts">
          <Button variant="ghost" size="icon" className="cursor-pointer">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h2 className="text-3xl font-bold tracking-tight">{cohort.name}</h2>
            <Badge
              variant={
                cohort.status === "active"
                  ? "default"
                  : cohort.status === "upcoming"
                  ? "secondary"
                  : "outline"
              }
            >
              {cohort.status}
            </Badge>
          </div>
          <p className="text-muted-foreground">
            {cohort.description || "No description"}
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Fellows</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{fellows.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sessions</CardTitle>
            <Video className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sessions.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Content Items</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{content.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Cohort Details */}
      <Card>
        <CardHeader>
          <CardTitle>Cohort Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Start Date
              </p>
              <p className="text-lg">
                {new Date(cohort.startDate).toLocaleDateString()}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                End Date
              </p>
              <p className="text-lg">
                {new Date(cohort.endDate).toLocaleDateString()}
              </p>
            </div>
          </div>
          {cohort.googleDriveFolderId && (
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">
                Google Drive Folder
              </p>
              <a
                href={`https://drive.google.com/drive/folders/${cohort.googleDriveFolderId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Open in Google Drive
              </a>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Fellows List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Fellows ({fellows.length})</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {fellows.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No fellows in this cohort yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {fellows.map((fellow) => (
                <div
                  key={fellow._id.toString()}
                  className="flex items-center gap-4 p-3 rounded-lg border"
                >
                  <Avatar>
                    <AvatarImage src={fellow.image || "/placeholder.svg"} />
                    <AvatarFallback>
                      {fellow.name?.charAt(0) || "F"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-medium">{fellow.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {fellow.email}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Sessions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Recent Sessions</CardTitle>
            <Link href="/admin/sessions">
              <Button variant="ghost" size="sm" className="cursor-pointer">
                View All
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {sessions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Video className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No sessions scheduled yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sessions.map((session) => (
                <Link
                  key={session._id.toString()}
                  href={`/admin/sessions/${session._id.toString()}`}
                >
                  <div className="flex items-start gap-3 p-3 rounded-lg border hover:border-primary/50 transition-colors cursor-pointer">
                    <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div className="flex-1">
                      <p className="font-medium">{session.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(session.startTime).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Content */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Recent Content</CardTitle>
            <Link href="/admin/content">
              <Button variant="ghost" size="sm" className="cursor-pointer">
                View All
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {content.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No content uploaded yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {content.map((item) => (
                <a
                  key={item._id.toString()}
                  href={item.googleDriveLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-3 p-3 rounded-lg border hover:border-primary/50 transition-colors"
                >
                  <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium">{item.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(item.uploadedAt).toLocaleDateString()}
                    </p>
                  </div>
                </a>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
