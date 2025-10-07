import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getDatabase } from "@/lib/mongodb"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { ArrowLeft, Calendar, Clock, Users, Video, ExternalLink } from "lucide-react"
import { ObjectId } from "mongodb"
import { notFound } from "next/navigation"

export default async function SessionDetailPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  const db = await getDatabase()

  const sessionData = await db.collection("sessions").findOne({
    _id: new ObjectId(params.id),
    institutionId: new ObjectId(session?.user?.institutionId),
  })

  if (!sessionData) {
    notFound()
  }

  const cohort = await db.collection("cohorts").findOne({
    _id: sessionData.cohortId,
  })

  const fellows = await db
    .collection("users")
    .find({
      _id: { $in: sessionData.attendees.map((a: any) => a.fellowId) },
    })
    .toArray()

  const isPast = new Date(sessionData.startTime) < new Date()

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <Link href="/admin/sessions">
          <Button variant="ghost" className="mb-4 cursor-pointer">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Sessions
          </Button>
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">{sessionData.title}</h2>
            <p className="text-muted-foreground">{cohort?.name}</p>
          </div>
          <Badge variant={isPast ? "outline" : "default"}>{isPast ? "Completed" : "Upcoming"}</Badge>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Session Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="font-medium">Date</p>
                <p className="text-sm text-muted-foreground">{new Date(sessionData.startTime).toLocaleDateString()}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="font-medium">Time</p>
                <p className="text-sm text-muted-foreground">
                  {new Date(sessionData.startTime).toLocaleTimeString()} -{" "}
                  {new Date(sessionData.endTime).toLocaleTimeString()}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Users className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="font-medium">Attendees</p>
                <p className="text-sm text-muted-foreground">{fellows.length} fellows invited</p>
              </div>
            </div>

            {sessionData.googleMeetLink && (
              <div className="flex items-start gap-3">
                <Video className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium mb-2">Google Meet</p>
                  <a href={sessionData.googleMeetLink} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" size="sm" className="cursor-pointer bg-transparent">
                      Join Meeting
                      <ExternalLink className="ml-2 h-4 w-4" />
                    </Button>
                  </a>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Description</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{sessionData.description || "No description provided"}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Attendees ({fellows.length})</CardTitle>
          <CardDescription>Fellows invited to this session</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {fellows.map((fellow) => {
              const attendeeStatus = sessionData.attendees.find(
                (a: any) => a.fellowId.toString() === fellow._id.toString(),
              )?.status
              return (
                <div key={fellow._id.toString()} className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-sm font-medium">{fellow.name[0]}</span>
                    </div>
                    <div>
                      <p className="font-medium">{fellow.name}</p>
                      <p className="text-sm text-muted-foreground">{fellow.email}</p>
                    </div>
                  </div>
                  <Badge variant="outline">{attendeeStatus}</Badge>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
