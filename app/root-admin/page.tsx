import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getDatabase } from "@/lib/mongodb";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Building2, CheckCircle, Clock, XCircle, Users } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function RootAdminDashboard() {
  const session = await getServerSession(authOptions);

  if (!session?.user || session.user.role !== "root_admin") {
    redirect("/");
  }

  const db = await getDatabase();

  // Get institution statistics
  const [pending, approved, rejected, totalAdmins] = await Promise.all([
    db.collection("institutions").countDocuments({ status: "pending" }),
    db.collection("institutions").countDocuments({ status: "approved" }),
    db.collection("institutions").countDocuments({ status: "rejected" }),
    db.collection("users").countDocuments({ role: "admin" }),
  ]);

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Root Admin Dashboard</h1>
              <p className="text-sm text-muted-foreground">
                Manage institution admin approvals
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
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Pending Requests
              </CardTitle>
              <Clock className="h-4 w-4 text-amber-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pending}</div>
              <p className="text-xs text-muted-foreground">Awaiting approval</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Approved Institutions
              </CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{approved}</div>
              <p className="text-xs text-muted-foreground">
                Active institutions
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Rejected Requests
              </CardTitle>
              <XCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{rejected}</div>
              <p className="text-xs text-muted-foreground">Declined requests</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Admins
              </CardTitle>
              <Users className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalAdmins}</div>
              <p className="text-xs text-muted-foreground">
                Active administrators
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Manage institution admin requests and view all data
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link
              href="/root-admin/institutions?status=pending"
              className="block p-4 rounded-lg border border-border hover:bg-muted transition-colors"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Review Pending Requests</h3>
                  <p className="text-sm text-muted-foreground">
                    {pending} request{pending !== 1 ? "s" : ""} waiting for
                    approval
                  </p>
                </div>
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
            </Link>

            <Link
              href="/root-admin/institutions"
              className="block p-4 rounded-lg border border-border hover:bg-muted transition-colors"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">View All Institutions</h3>
                  <p className="text-sm text-muted-foreground">
                    Manage all institution requests
                  </p>
                </div>
                <Building2 className="h-5 w-5 text-blue-600" />
              </div>
            </Link>

            <Link
              href="/root-admin/admins"
              className="block p-4 rounded-lg border border-border hover:bg-muted transition-colors"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">View All Admins</h3>
                  <p className="text-sm text-muted-foreground">
                    See all institution administrators
                  </p>
                </div>
                <Users className="h-5 w-5 text-purple-600" />
              </div>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
