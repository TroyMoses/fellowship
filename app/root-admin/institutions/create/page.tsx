import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { CreateInstitutionForm } from "@/components/create-institution-form";

export default async function CreateInstitutionPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user || session.user.role !== "root_admin") {
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/root-admin">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Create New Institution</h1>
              <p className="text-sm text-muted-foreground">
                Set up a new institution and assign an administrator
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Institution Details</CardTitle>
            <CardDescription>
              Enter the institution information and assign an admin. The admin
              will receive an email notification.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CreateInstitutionForm />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
