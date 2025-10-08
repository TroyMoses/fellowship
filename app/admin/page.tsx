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
import { Calendar, FolderOpen, Users, Video } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ObjectId } from "mongodb";

export default async function AdminDashboardPage() {
  const session = await getServerSession(authOptions);
  const db = await getDatabase();

  const institutionObjectId = session?.user?.institutionId
    ? new ObjectId(session.user.institutionId)
    : null;

  // Get stats
  const cohortsCount = await db.collection("cohorts").countDocuments({
    institutionId: institutionObjectId,
  });

  const sessionsCount = await db.collection("sessions").countDocuments({
    institutionId: institutionObjectId,
  });

  const fellowsCount = await db.collection("users").countDocuments({
    institutionId: institutionObjectId,
    role: "fellow",
  });

  const contentCount = await db.collection("content").countDocuments({
    institutionId: institutionObjectId,
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">
          Welcome back, {session?.user?.name}
        </h2>
        <p className="text-muted-foreground">
          Here&apos;s what&apos;s happening with your fellowship programs
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="cursor-pointer hover:border-primary/50 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cohorts</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{cohortsCount}</div>
            <p className="text-xs text-muted-foreground">
              Active fellowship programs
            </p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:border-primary/50 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Fellows</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{fellowsCount}</div>
            <p className="text-xs text-muted-foreground">
              Enrolled participants
            </p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:border-primary/50 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Sessions
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sessionsCount}</div>
            <p className="text-xs text-muted-foreground">Scheduled meetings</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:border-primary/50 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Content Items</CardTitle>
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{contentCount}</div>
            <p className="text-xs text-muted-foreground">Uploaded materials</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Common tasks to manage your fellowship programs
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Link href="/admin/cohorts/new">
            <Button
              variant="outline"
              className="w-full cursor-pointer bg-transparent"
            >
              <Users className="mr-2 h-4 w-4" />
              Create Cohort
            </Button>
          </Link>
          <Link href="/admin/sessions/new">
            <Button
              variant="outline"
              className="w-full cursor-pointer bg-transparent"
            >
              <Video className="mr-2 h-4 w-4" />
              Schedule Session
            </Button>
          </Link>
          <Link href="/admin/content">
            <Button
              variant="outline"
              className="w-full cursor-pointer bg-transparent"
            >
              <FolderOpen className="mr-2 h-4 w-4" />
              Upload Content
            </Button>
          </Link>
          <Link href="/admin/settings">
            <Button
              variant="outline"
              className="w-full cursor-pointer bg-transparent"
            >
              <Calendar className="mr-2 h-4 w-4" />
              Connect Google
            </Button>
          </Link>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>
            Latest updates from your fellowship programs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-4 text-sm">
              <div className="h-2 w-2 rounded-full bg-primary" />
              <p className="text-muted-foreground">
                No recent activity yet. Start by creating a cohort!
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
