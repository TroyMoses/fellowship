import type { NextRequest } from "next/server";
import {
  getAuthSession,
  isAdmin,
  apiError,
  apiSuccess,
} from "@/lib/api-helpers";
import { getDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

/**
 * Cron job endpoint to automatically activate/deactivate cohorts based on dates
 * This should be called periodically (e.g., daily via Vercel Cron)
 */
export async function POST(req: NextRequest) {
  try {
    // Verify cron secret for security
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET || "dev-secret";

    if (authHeader !== `Bearer ${cronSecret}`) {
      return apiError("Unauthorized", 401);
    }

    const db = await getDatabase();
    const now = new Date();

    // Get all institutions
    const institutions = await db.collection("institutions").find({}).toArray();

    let activatedCount = 0;
    let deactivatedCount = 0;

    for (const institution of institutions) {
      // Get all cohorts for this institution
      const cohorts = await db
        .collection("cohorts")
        .find({ institutionId: institution._id })
        .sort({ startDate: 1 })
        .toArray();

      // Find current active cohort
      const activeCohort = cohorts.find((c) => c.status === "active");

      // Check if active cohort should be deactivated
      if (activeCohort) {
        const endDate = new Date(activeCohort.endDate);
        if (now > endDate) {
          await db.collection("cohorts").updateOne(
            { _id: activeCohort._id },
            {
              $set: {
                status: "completed",
                updatedAt: now,
              },
            }
          );
          deactivatedCount++;
          console.log("[v0] Deactivated expired cohort:", {
            cohortId: activeCohort._id,
            name: activeCohort.name,
          });
        }
      }

      // Find the next upcoming cohort that should be activated
      const upcomingCohorts = cohorts.filter((c) => c.status === "upcoming");

      for (const cohort of upcomingCohorts) {
        const startDate = new Date(cohort.startDate);
        const endDate = new Date(cohort.endDate);

        // Activate if start date has been reached and end date hasn't passed
        if (now >= startDate && now <= endDate) {
          // Double-check no other cohort is active for this institution
          const stillActiveCohort = await db.collection("cohorts").findOne({
            institutionId: institution._id,
            status: "active",
          });

          if (!stillActiveCohort) {
            await db.collection("cohorts").updateOne(
              { _id: cohort._id },
              {
                $set: {
                  status: "active",
                  updatedAt: now,
                },
              }
            );
            activatedCount++;
            console.log("[v0] Activated upcoming cohort:", {
              cohortId: cohort._id,
              name: cohort.name,
            });
            break; // Only activate one cohort per institution
          }
        }
      }
    }

    return apiSuccess({
      message: "Cohort status update completed",
      activatedCount,
      deactivatedCount,
    });
  } catch (error: any) {
    console.error("[v0] Cohort activation error:", error);
    return apiError(error.message || "Failed to update cohort statuses", 500);
  }
}

/**
 * Manual trigger endpoint for admins to check and update cohort statuses
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session || !isAdmin(session)) {
      return apiError("Unauthorized", 401);
    }

    const db = await getDatabase();
    const now = new Date();
    const institutionId = new ObjectId(session.user.institutionId);

    // Get all cohorts for this institution
    const cohorts = await db
      .collection("cohorts")
      .find({ institutionId })
      .sort({ startDate: 1 })
      .toArray();

    // Find current active cohort
    const activeCohort = cohorts.find((c) => c.status === "active");

    let updated = false;

    // Check if active cohort should be deactivated
    if (activeCohort) {
      const endDate = new Date(activeCohort.endDate);
      if (now > endDate) {
        await db.collection("cohorts").updateOne(
          { _id: activeCohort._id },
          {
            $set: {
              status: "completed",
              updatedAt: now,
            },
          }
        );
        updated = true;
      }
    }

    // Find the next upcoming cohort that should be activated
    const upcomingCohorts = cohorts.filter((c) => c.status === "upcoming");

    for (const cohort of upcomingCohorts) {
      const startDate = new Date(cohort.startDate);
      const endDate = new Date(cohort.endDate);

      if (now >= startDate && now <= endDate) {
        const stillActiveCohort = await db.collection("cohorts").findOne({
          institutionId,
          status: "active",
        });

        if (!stillActiveCohort) {
          await db.collection("cohorts").updateOne(
            { _id: cohort._id },
            {
              $set: {
                status: "active",
                updatedAt: now,
              },
            }
          );
          updated = true;
          break;
        }
      }
    }

    return apiSuccess({
      message: updated
        ? "Cohort statuses updated"
        : "No cohort status changes needed",
      updated,
    });
  } catch (error: any) {
    console.error("[v0] Cohort status check error:", error);
    return apiError(error.message || "Failed to check cohort statuses", 500);
  }
}
