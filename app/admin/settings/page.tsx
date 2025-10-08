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
import { CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { ObjectId } from "mongodb";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);
  const db = await getDatabase();

  const institution = session?.user?.institutionId
    ? await db.collection("institutions").findOne({
        _id: new ObjectId(session.user.institutionId),
      })
    : null;

  const googleConnected = !!institution?.googleRefreshToken;
  const hasCalendarAccess = googleConnected;
  const hasDriveAccess = googleConnected;

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground">
          Manage your institution settings and integrations
        </p>
      </div>

      {!googleConnected && (
        <Card className="border-yellow-500/50 bg-yellow-500/5">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-500" />
              <CardTitle>Google Account Not Connected</CardTitle>
            </div>
            <CardDescription>
              You need to connect your Google account to use Calendar and Drive
              features. Please sign out and sign in again to grant the necessary
              permissions.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/api/auth/signout">
              <Button
                variant="outline"
                className="cursor-pointer bg-transparent"
              >
                Sign Out and Reconnect
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Google Workspace Integration</CardTitle>
          <CardDescription>
            Connect your Google account to enable Calendar and Drive features
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border border-border rounded-lg">
            <div className="flex items-center gap-3">
              {googleConnected ? (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-destructive" />
              )}
              <div>
                <p className="font-medium">Google Account</p>
                <p className="text-sm text-muted-foreground">
                  {googleConnected
                    ? `Connected as ${institution?.googleAccountEmail}`
                    : "Not connected"}
                </p>
              </div>
            </div>
            <Badge variant={googleConnected ? "default" : "outline"}>
              {googleConnected ? "Connected" : "Disconnected"}
            </Badge>
          </div>

          <div className="flex items-center justify-between p-4 border border-border rounded-lg">
            <div className="flex items-center gap-3">
              {hasCalendarAccess ? (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-destructive" />
              )}
              <div>
                <p className="font-medium">Google Calendar API</p>
                <p className="text-sm text-muted-foreground">
                  For scheduling sessions with Google Meet
                </p>
              </div>
            </div>
            <Badge variant={hasCalendarAccess ? "default" : "outline"}>
              {hasCalendarAccess ? "Active" : "Inactive"}
            </Badge>
          </div>

          <div className="flex items-center justify-between p-4 border border-border rounded-lg">
            <div className="flex items-center gap-3">
              {hasDriveAccess ? (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-destructive" />
              )}
              <div>
                <p className="font-medium">Google Drive API</p>
                <p className="text-sm text-muted-foreground">
                  For content management and file sharing
                </p>
              </div>
            </div>
            <Badge variant={hasDriveAccess ? "default" : "outline"}>
              {hasDriveAccess ? "Active" : "Inactive"}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Institution Information</CardTitle>
          <CardDescription>
            Your institution details and settings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Institution Name
              </p>
              <p className="text-base">{institution?.name || "Not set"}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Admin Email
              </p>
              <p className="text-base">
                {session?.user?.email || "Not available"}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Institution ID
              </p>
              <p className="font-mono text-xs">
                {session?.user?.institutionId || "Not set"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
