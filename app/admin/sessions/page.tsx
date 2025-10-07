import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getDatabase } from "@/lib/mongodb"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { Plus, Calendar, Video, Users } from "lucide-react"
import { ObjectId } from "mongodb"

export default async function SessionsPage() {
  const session = await getServerSession(authOptions)
  const db = await getDatabase()

  const sessions = await db
    .collection("sessions")
    .find({
      institutionId: new ObjectId(session?.user?.institutionId),
    })
    .sort({ startTime: -1 })
    .limit(50)
    .toArray()

  const now = new Date()
  const upcomingSessions = sessions.filter((s) => new Date(s.startTime) > now)
  const pastSessions = sessions.filter((s) => new Date(s.startTime) <= now)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Sessions</h2>
          <p className="text-muted-foreground">Schedule and manage fellowship sessions with Google Meet</p>
        </div>
        <Link href="/admin/sessions/new">
          <Button className="cursor-pointer">
            <Plus className="mr-2 h-4 w-4" />
            Schedule Session
          </Button>
        </Link>
      </div>

      {sessions.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No sessions yet</h3>
            <p className="text-muted-foreground text-center mb-6">
              Schedule your first session with automatic Google Meet integration
            </p>
            <Link href="/admin/sessions/new">
              <Button className="cursor-pointer">
                <Plus className="mr-2 h-4 w-4" />
                Schedule Your First Session
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Upcoming Sessions */}
          {upcomingSessions.length > 0 && (
            <div>
              <h3 className="text-xl font-semibold mb-4">Upcoming Sessions</h3>
              <div className="space-y-4">
                {upcomingSessions.map((sessionItem) => (
                  <Link key={sessionItem._id.toString()} href={`/admin/sessions/${sessionItem._id.toString()}`}>
                    <Card className="cursor-pointer hover:border-primary/50 transition-colors">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-lg">{sessionItem.title}</CardTitle>
                            <CardDescription className="mt-1">
                              {new Date(sessionItem.startTime).toLocaleString()} -{" "}
                              {new Date(sessionItem.endTime).toLocaleTimeString()}
                            </CardDescription>
                          </div>
                          <Badge>Upcoming</Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            <span>{sessionItem.attendees?.length || 0} attendees</span>
                          </div>
                          {sessionItem.googleMeetLink && (
                            <div className="flex items-center gap-1">
                              <Video className="h-4 w-4" />
                              <span>Google Meet</span>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Past Sessions */}
          {pastSessions.length > 0 && (
            <div>
              <h3 className="text-xl font-semibold mb-4">Past Sessions</h3>
              <div className="space-y-4">
                {pastSessions.map((sessionItem) => (
                  <Link key={sessionItem._id.toString()} href={`/admin/sessions/${sessionItem._id.toString()}`}>
                    <Card className="cursor-pointer hover:border-primary/50 transition-colors opacity-75">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-lg">{sessionItem.title}</CardTitle>
                            <CardDescription className="mt-1">
                              {new Date(sessionItem.startTime).toLocaleString()}
                            </CardDescription>
                          </div>
                          <Badge variant="outline">Completed</Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            <span>{sessionItem.attendees?.length || 0} attendees</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
