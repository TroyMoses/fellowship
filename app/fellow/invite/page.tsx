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
import { redirect } from "next/navigation";

export default async function FellowInvitePage() {
  const session = await getServerSession(authOptions);
  const db = await getDatabase();

  // Check if fellow has an institution
  const user = await db
    .collection("users")
    .findOne({ _id: new ObjectId(session?.user?.id) });

  if (!user?.institutionId) {
    redirect("/fellow/fellowships");
  }

  const institution = await db.collection("institutions").findOne({
    _id: user.institutionId,
  });

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">
          Invite to Fellowship
        </h2>
        <p className="text-muted-foreground">
          Invite others to join your fellowship program
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
            institutionId={user.institutionId.toString()}
            userRole="fellow"
          />
        </CardContent>
      </Card>
    </div>
  );
}
