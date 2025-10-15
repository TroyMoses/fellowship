import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { FellowSessionsView } from "@/components/fellow/sessions-view";

export default async function FellowSessionsPage() {
  const session = await getServerSession(authOptions);
  const db = await getDatabase();

  const user = await db.collection("users").findOne({
    _id: new ObjectId(session?.user?.id),
  });

  const cohorts = await db
    .collection("cohorts")
    .find({
      _id: { $in: user?.cohortIds || [] },
    })
    .toArray();

  const now = new Date();
  const allSessions = await db
    .collection("sessions")
    .find({
      cohortId: { $in: cohorts.map((c) => c._id) },
    })
    .sort({ startTime: -1 })
    .toArray();

  const upcomingSessions = allSessions.filter(
    (s) => new Date(s.startTime) > now && s.status !== "cancelled"
  );
  const cancelledSessions = allSessions.filter((s) => s.status === "cancelled");
  const pastSessions = allSessions.filter(
    (s) => new Date(s.startTime) <= now && s.status !== "cancelled"
  );

  return (
    <FellowSessionsView
      upcomingSessions={upcomingSessions}
      cancelledSessions={cancelledSessions}
      pastSessions={pastSessions}
      cohorts={cohorts}
    />
  );
}
