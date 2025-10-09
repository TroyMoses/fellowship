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
import { ObjectId } from "mongodb";
import { InviteForm } from "@/components/invite-form";

export default async function InvitePage() {
  const session = await getServerSession(authOptions);
  const db = await getDatabase();

  const institution = await db.collection("institutions").findOne({
    _id: new ObjectId(session?.user?.institutionId),
  });

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">
          Invite to Fellowship
        </h2>
        <p className="text-muted-foreground">
          Send invitations to potential fellows via email
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Send Invitation</CardTitle>
          <CardDescription>
            Invite people to apply to {institution?.name}. They will receive an
            email with a link to the application form.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <InviteForm
            institutionId={session?.user?.institutionId || ""}
            userRole="admin"
          />
        </CardContent>
      </Card>
    </div>
  );
}
