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
import { Calendar, Video, FileText, ExternalLink, Clock } from "lucide-react";
import { ObjectId } from "mongodb";
import { ShareApplicationLink } from "@/components/admin/share-application-link";

export default async function FellowDashboardPage() {
  const session = await getServerSession(authOptions);
  const db = await getDatabase();

  // Get user's cohorts
  const user = await db.collection("users").findOne({
    _id: new ObjectId(session?.user?.id),
  });

  const institution = user?.institutionId
    ? await db.collection("institutions").findOne({
        _id: new ObjectId(user.institutionId),
      })
    : null;

  const cohorts = await db
    .collection("cohorts")
    .find({
      _id: { $in: user?.cohortIds || [] },
    })
    .toArray();

  // Get upcoming sessions
  const now = new Date();
  const upcomingSessions = await db
    .collection("sessions")
    .find({
      cohortId: { $in: cohorts.map((c) => c._id) },
      startTime: { $gte: now },
    })
    .sort({ startTime: 1 })
    .limit(5)
    .toArray();

  // Get recent content
  const recentContent = await db
    .collection("content")
    .find({
      cohortId: { $in: cohorts.map((c) => c._id) },
    })
    .sort({ uploadedAt: -1 })
    .limit(6)
    .toArray();

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div>
        <h1 className="text-4xl font-bold tracking-tight">
          Welcome back, {session?.user?.name?.split(" ")[0]}
        </h1>
        <p className="text-muted-foreground mt-2">
          Here's what's happening in your fellowship programs
        </p>
      </div>

      {institution && (
        <ShareApplicationLink
          institutionId={institution._id.toString()}
          institutionName={institution.name}
        />
      )}

      {/* Cohorts */}
      {cohorts.length > 0 && (
        <div>
          <h2 className="text-2xl font-semibold mb-4">Your Cohorts</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {cohorts.map((cohort) => (
              <Card key={cohort._id.toString()}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg">{cohort.name}</CardTitle>
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
                  <CardDescription className="line-clamp-2">
                    {cohort.description || "No description"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {new Date(cohort.startDate).toLocaleDateString()} -{" "}
                      {new Date(cohort.endDate).toLocaleDateString()}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Upcoming Sessions */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-semibold">Upcoming Sessions</h2>
          <Link href="/fellow/sessions">
            <Button variant="ghost" size="sm" className="cursor-pointer">
              View All
            </Button>
          </Link>
        </div>

        {upcomingSessions.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                No upcoming sessions scheduled
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {upcomingSessions.map((sessionItem) => {
              const cohort = cohorts.find(
                (c) => c._id.toString() === sessionItem.cohortId.toString()
              );
              const timeUntil =
                new Date(sessionItem.startTime).getTime() - now.getTime();
              const hoursUntil = Math.floor(timeUntil / (1000 * 60 * 60));
              const isToday = hoursUntil < 24;

              return (
                <Card
                  key={sessionItem._id.toString()}
                  className="hover:border-primary/50 transition-colors"
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg">
                          {sessionItem.title}
                        </CardTitle>
                        <CardDescription className="mt-1">
                          {cohort?.name} •{" "}
                          {new Date(sessionItem.startTime).toLocaleString()}
                        </CardDescription>
                      </div>
                      {isToday && <Badge>Today</Badge>}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>
                          {new Date(sessionItem.startTime).toLocaleTimeString()}{" "}
                          - {new Date(sessionItem.endTime).toLocaleTimeString()}
                        </span>
                      </div>
                      {sessionItem.googleMeetLink && (
                        <a
                          href={sessionItem.googleMeetLink}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Button size="sm" className="cursor-pointer">
                            <Video className="mr-2 h-4 w-4" />
                            Join Meeting
                          </Button>
                        </a>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Recent Content */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-semibold">Recent Content</h2>
          <Link href="/fellow/content">
            <Button variant="ghost" size="sm" className="cursor-pointer">
              View All
            </Button>
          </Link>
        </div>

        {recentContent.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No content available yet</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {recentContent.map((item) => {
              const cohort = cohorts.find(
                (c) => c._id.toString() === item.cohortId.toString()
              );

              return (
                <Card
                  key={item._id.toString()}
                  className="hover:border-primary/50 transition-colors"
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-base truncate">
                          {item.title}
                        </CardTitle>
                        <CardDescription className="text-xs mt-1">
                          {cohort?.name}
                        </CardDescription>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {item.type}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <a
                      href={item.googleDriveLink}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full cursor-pointer bg-transparent"
                      >
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Open in Drive
                      </Button>
                    </a>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
