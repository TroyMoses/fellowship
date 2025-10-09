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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import {
  ArrowLeft,
  Mail,
  Calendar,
  Users,
  Video,
  FileText,
} from "lucide-react";
import { ObjectId } from "mongodb";
import { notFound } from "next/navigation";

export default async function FellowDetailsPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getServerSession(authOptions);
  const db = await getDatabase();

  let fellowId: ObjectId;
  try {
    fellowId = new ObjectId(params.id);
  } catch {
    notFound();
  }

  const fellow = await db.collection("users").findOne({
    _id: fellowId,
    institutionId: new ObjectId(session?.user?.institutionId),
    role: "fellow",
  });

  if (!fellow) {
    notFound();
  }

  // Get cohorts this fellow is part of
  const cohorts = await db
    .collection("cohorts")
    .find({
      _id: { $in: fellow.cohortIds || [] },
    })
    .toArray();

  // Get sessions this fellow attended
  const sessions = await db
    .collection("sessions")
    .find({
      "attendees.fellowId": fellowId,
    })
    .sort({ startTime: -1 })
    .limit(10)
    .toArray();

  // Calculate attendance stats
  const totalSessions = sessions.length;
  const attendedSessions = sessions.filter((s) =>
    s.attendees.some(
      (a: any) =>
        a.fellowId.toString() === fellowId.toString() && a.status === "attended"
    )
  ).length;

  // Get application if exists
  const application = await db.collection("applications").findOne({
    fellowId: fellowId,
    institutionId: new ObjectId(session?.user?.institutionId),
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/fellows">
          <Button variant="ghost" size="icon" className="cursor-pointer">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h2 className="text-3xl font-bold tracking-tight">Fellow Details</h2>
          <p className="text-muted-foreground">
            View fellow information and activity
          </p>
        </div>
      </div>

      {/* Fellow Profile */}
      <Card>
        <CardHeader>
          <div className="flex items-start gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={fellow.image || "/placeholder.svg"} />
              <AvatarFallback className="text-2xl">
                {fellow.name?.charAt(0) || "F"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <CardTitle className="text-2xl">{fellow.name}</CardTitle>
              <CardDescription className="flex items-center gap-2 mt-1">
                <Mail className="h-4 w-4" />
                {fellow.email}
              </CardDescription>
              <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>
                  Joined {new Date(fellow.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cohorts</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{cohorts.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sessions</CardTitle>
            <Video className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSessions}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Attendance</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalSessions > 0
                ? Math.round((attendedSessions / totalSessions) * 100)
                : 0}
              %
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cohorts */}
      <Card>
        <CardHeader>
          <CardTitle>Cohorts</CardTitle>
          <CardDescription>Cohorts this fellow is enrolled in</CardDescription>
        </CardHeader>
        <CardContent>
          {cohorts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Not enrolled in any cohorts</p>
            </div>
          ) : (
            <div className="space-y-3">
              {cohorts.map((cohort) => (
                <Link
                  key={cohort._id.toString()}
                  href={`/admin/cohorts/${cohort._id.toString()}`}
                >
                  <div className="flex items-center justify-between p-3 rounded-lg border hover:border-primary/50 transition-colors cursor-pointer">
                    <div>
                      <p className="font-medium">{cohort.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(cohort.startDate).toLocaleDateString()} -{" "}
                        {new Date(cohort.endDate).toLocaleDateString()}
                      </p>
                    </div>
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
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Sessions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Sessions</CardTitle>
          <CardDescription>
            Latest sessions this fellow was invited to
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sessions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Video className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No sessions yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sessions.map((session) => {
                const attendance = session.attendees.find(
                  (a: any) => a.fellowId.toString() === fellowId.toString()
                );

                return (
                  <Link
                    key={session._id.toString()}
                    href={`/admin/sessions/${session._id.toString()}`}
                  >
                    <div className="flex items-start justify-between p-3 rounded-lg border hover:border-primary/50 transition-colors cursor-pointer">
                      <div className="flex-1">
                        <p className="font-medium">{session.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(session.startTime).toLocaleString()}
                        </p>
                      </div>
                      <Badge
                        variant={
                          attendance?.status === "attended"
                            ? "default"
                            : attendance?.status === "missed"
                            ? "destructive"
                            : "secondary"
                        }
                      >
                        {attendance?.status || "invited"}
                      </Badge>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Application Details */}
      {application && (
        <Card>
          <CardHeader>
            <CardTitle>Application Information</CardTitle>
            <CardDescription>
              Original application submitted by this fellow
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">
                Education
              </p>
              <p className="text-sm whitespace-pre-wrap">
                {application.applicationData.education}
              </p>
            </div>
            <Separator />
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">
                Experience
              </p>
              <p className="text-sm whitespace-pre-wrap">
                {application.applicationData.experience}
              </p>
            </div>
            <Separator />
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">
                Motivation
              </p>
              <p className="text-sm whitespace-pre-wrap">
                {application.applicationData.motivation}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
