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
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { Users, Search } from "lucide-react";
import { ObjectId } from "mongodb";

export default async function FellowsPage() {
  const session = await getServerSession(authOptions);
  const db = await getDatabase();

  // Get all fellows in this institution
  const fellows = await db
    .collection("users")
    .find({
      institutionId: new ObjectId(session?.user?.institutionId),
      role: "fellow",
    })
    .sort({ createdAt: -1 })
    .toArray();

  // Get all cohorts for this institution
  const cohorts = await db
    .collection("cohorts")
    .find({
      institutionId: new ObjectId(session?.user?.institutionId),
    })
    .toArray();

  const cohortMap = new Map(cohorts.map((c) => [c._id.toString(), c]));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Fellows</h2>
          <p className="text-muted-foreground">
            Manage and view all fellows in your institution
          </p>
        </div>
      </div>

      {/* Stats Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Fellows</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{fellows.length}</div>
          <p className="text-xs text-muted-foreground">
            Active fellows in your institution
          </p>
        </CardContent>
      </Card>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search fellows by name or email..."
          className="pl-10"
        />
      </div>

      {/* Fellows List */}
      {fellows.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No fellows yet</h3>
            <p className="text-muted-foreground text-center">
              Fellows will appear here once they are approved and added to your
              institution
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {fellows.map((fellow) => {
            const fellowCohorts = fellow.cohortIds
              ?.map((id: ObjectId) => cohortMap.get(id.toString()))
              .filter(Boolean);

            return (
              <Link
                key={fellow._id.toString()}
                href={`/admin/fellows/${fellow._id.toString()}`}
              >
                <Card className="cursor-pointer hover:border-primary/50 transition-colors h-full">
                  <CardHeader>
                    <div className="flex items-start gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={fellow.image || "/placeholder.svg"} />
                        <AvatarFallback>
                          {fellow.name?.charAt(0) || "F"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg truncate">
                          {fellow.name}
                        </CardTitle>
                        <CardDescription className="truncate">
                          {fellow.email}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="text-sm text-muted-foreground">
                        <span className="font-medium">Cohorts:</span>{" "}
                        {fellowCohorts && fellowCohorts.length > 0
                          ? fellowCohorts.length
                          : "None"}
                      </div>
                      {fellowCohorts && fellowCohorts.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {fellowCohorts.slice(0, 2).map((cohort: any) => (
                            <Badge
                              key={cohort._id.toString()}
                              variant="secondary"
                              className="text-xs"
                            >
                              {cohort.name}
                            </Badge>
                          ))}
                          {fellowCohorts.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{fellowCohorts.length - 2}
                            </Badge>
                          )}
                        </div>
                      )}
                      <div className="text-xs text-muted-foreground">
                        Joined {new Date(fellow.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
