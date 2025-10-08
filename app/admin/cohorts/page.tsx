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
import { Plus, Users, Calendar } from "lucide-react";
import { ObjectId } from "mongodb";

export default async function CohortsPage() {
  const session = await getServerSession(authOptions);
  const db = await getDatabase();

  const cohorts = await db
    .collection("cohorts")
    .find({
      institutionId: new ObjectId(session?.user?.institutionId),
    })
    .sort({ createdAt: -1 })
    .toArray();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Cohorts</h2>
          <p className="text-muted-foreground">
            Manage your fellowship cohorts and participants
          </p>
        </div>
        <Link href="/admin/cohorts/new">
          <Button className="cursor-pointer">
            <Plus className="mr-2 h-4 w-4" />
            Create Cohort
          </Button>
        </Link>
      </div>

      {cohorts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No cohorts yet</h3>
            <p className="text-muted-foreground text-center mb-6">
              Create your first cohort to start managing fellows and sessions
            </p>
            <Link href="/admin/cohorts/new">
              <Button className="cursor-pointer">
                <Plus className="mr-2 h-4 w-4" />
                Create Your First Cohort
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {cohorts.map((cohort) => (
            <Link
              key={cohort._id.toString()}
              href={`/admin/cohorts/${cohort._id.toString()}`}
            >
              <Card className="cursor-pointer hover:border-primary/50 transition-colors">
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
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      <span>{cohort.fellowIds?.length || 0} fellows</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {new Date(cohort.startDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
