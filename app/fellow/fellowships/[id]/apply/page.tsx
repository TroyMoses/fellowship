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
import Link from "next/link";
import { ArrowLeft, Building2 } from "lucide-react";
import { ObjectId } from "mongodb";
import { notFound, redirect } from "next/navigation";
import { ApplicationForm } from "@/components/application-form";

export default async function ApplyPage({
  params,
}: {
  params: { id: string };
}) {
  const institutionIdString = params.id;

  const session = await getServerSession(authOptions);
  const db = await getDatabase();

  let institutionId: ObjectId;
  try {
    institutionId = new ObjectId(institutionIdString);
  } catch {
    notFound();
  }

  const institution = await db
    .collection("institutions")
    .findOne({ _id: institutionId });

  if (!institution) {
    notFound();
  }

  // Check if user already applied
  const existingApplication = await db.collection("applications").findOne({
    fellowId: new ObjectId(session?.user?.id),
    institutionId: institutionId,
  });

  if (existingApplication) {
    redirect("/fellow/fellowships");
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/fellow/fellowships">
          <Button variant="ghost" size="icon" className="cursor-pointer">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            Apply to Fellowship
          </h2>
          <p className="text-muted-foreground">
            Complete the application form below
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            <CardTitle>{institution.name}</CardTitle>
          </div>
          <CardDescription>
            Please provide accurate information. Your application will be
            reviewed by the fellowship administrators.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ApplicationForm institutionId={institutionIdString} />
        </CardContent>
      </Card>
    </div>
  );
}
