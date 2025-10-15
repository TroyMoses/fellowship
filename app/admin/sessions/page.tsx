import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { SessionsView } from "@/components/admin/sessions-view";

export default async function SessionsPage() {
  const session = await getServerSession(authOptions);
  const db = await getDatabase();

  const sessions = await db
    .collection("sessions")
    .find({
      institutionId: new ObjectId(session?.user?.institutionId),
    })
    .sort({ startTime: -1 })
    .limit(50)
    .toArray();

  const now = new Date();
  const upcomingSessions = sessions.filter(
    (s) => new Date(s.startTime) > now && s.status !== "cancelled"
  );
  const cancelledSessions = sessions.filter((s) => s.status === "cancelled");
  const pastSessions = sessions.filter(
    (s) => new Date(s.startTime) <= now && s.status !== "cancelled"
  );

  return (
    <SessionsView
      upcomingSessions={upcomingSessions}
      cancelledSessions={cancelledSessions}
      pastSessions={pastSessions}
    />
  );
}
