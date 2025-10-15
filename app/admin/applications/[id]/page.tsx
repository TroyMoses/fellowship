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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import {
  ArrowLeft,
  Mail,
  Phone,
  Linkedin,
  GraduationCap,
  Briefcase,
  Heart,
} from "lucide-react";
import { ObjectId } from "mongodb";
import { notFound } from "next/navigation";
import { ApplicationActions } from "@/components/application-actions";

export default async function ApplicationDetailsPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getServerSession(authOptions);
  const db = await getDatabase();

  let applicationId: ObjectId;
  try {
    applicationId = new ObjectId(params.id);
  } catch {
    notFound();
  }

  if (!session?.user?.institutionId) {
    notFound();
  }

  const application = await db.collection("applications").findOne({
    _id: applicationId,
    institutionId: new ObjectId(session.user.institutionId),
  });

  if (!application) {
    notFound();
  }

  const fellow = await db
    .collection("users")
    .findOne({ _id: application.fellowId });

  // Get active cohort for this institution
  const activeCohort = await db.collection("cohorts").findOne({
    institutionId: new ObjectId(session?.user?.institutionId),
    status: "active",
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/applications">
          <Button variant="ghost" size="icon" className="cursor-pointer">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h2 className="text-3xl font-bold tracking-tight">
            Application Details
          </h2>
          <p className="text-muted-foreground">
            Review and take action on this application
          </p>
        </div>
        <Badge
          variant={
            application.status === "approved"
              ? "default"
              : application.status === "pending"
              ? "secondary"
              : "destructive"
          }
        >
          {application.status}
        </Badge>
      </div>

      {/* Applicant Info */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={fellow?.image || "/placeholder.svg"} />
              <AvatarFallback className="text-lg">
                {application.applicationData.fullName?.charAt(0) || "A"}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-2xl">
                {application.applicationData.fullName}
              </CardTitle>
              <CardDescription className="flex items-center gap-2 mt-1">
                <Mail className="h-4 w-4" />
                {application.applicationData.email}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-4">
            {application.applicationData.phone && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="h-4 w-4" />
                <span>{application.applicationData.phone}</span>
              </div>
            )}
            {application.applicationData.linkedIn && (
              <a
                href={application.applicationData.linkedIn}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-primary hover:underline"
              >
                <Linkedin className="h-4 w-4" />
                <span>LinkedIn Profile</span>
              </a>
            )}
          </div>
          <Separator />
          <div className="text-sm text-muted-foreground">
            Submitted on{" "}
            {new Date(application.submittedAt).toLocaleDateString()} at{" "}
            {new Date(application.submittedAt).toLocaleTimeString()}
          </div>
        </CardContent>
      </Card>

      {/* Application Details */}
      <Card>
        <CardHeader>
          <CardTitle>Application Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <GraduationCap className="h-5 w-5 text-primary mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold mb-2">Educational Background</h3>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {application.applicationData.education}
                </p>
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <Briefcase className="h-5 w-5 text-primary mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold mb-2">Professional Experience</h3>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {application.applicationData.experience}
                </p>
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <Heart className="h-5 w-5 text-primary mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold mb-2">Motivation</h3>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {application.applicationData.motivation}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Review Section */}
      {application.reviewedAt && (
        <Card>
          <CardHeader>
            <CardTitle>Review Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-sm">
              <span className="text-muted-foreground">Reviewed on: </span>
              <span>
                {new Date(application.reviewedAt).toLocaleDateString()}
              </span>
            </div>
            {application.reviewNotes && (
              <div className="text-sm">
                <span className="text-muted-foreground">Notes: </span>
                <p className="mt-1 whitespace-pre-wrap">
                  {application.reviewNotes}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      {application.status === "pending" && (
        <Card>
          <CardHeader>
            <CardTitle>Take Action</CardTitle>
            <CardDescription>
              Approve or reject this application
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ApplicationActions
              applicationId={params.id}
              hasActiveCohort={!!activeCohort}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
