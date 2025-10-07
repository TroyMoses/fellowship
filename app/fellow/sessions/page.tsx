import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getDatabase } from "@/lib/mongodb"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, Video, Clock } from "lucide-react"
import { ObjectId } from "mongodb"

export default async function FellowSessionsPage() {
  const session = await getServerSession(authOptions)
  const db = await getDatabase()

  // Get user's cohorts
  const user = await db.collection("users").findOne({
    _id: new ObjectId(session?.user?.id),
  })

  const cohorts = await db
    .collection("cohorts")
    .find({
      _id: { $in: user?.cohortIds || [] },
    })
    .toArray()

  // Get all sessions
  const now = new Date()
  const allSessions = await db
    .collection("sessions")
    .find({
      cohortId: { $in: cohorts.map((c) => c._id) },
    })
    .sort({ startTime: -1 })
    .toArray()

  const upcomingSessions = allSessions.filter((s) => new Date(s.startTime) > now)
  const pastSessions = allSessions.filter((s) => new Date(s.startTime) <= now)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold tracking-tight">Sessions</h1>
        <p className="text-muted-foreground mt-2">View and join your fellowship sessions</p>
      </div>

      {/* Upcoming Sessions */}
      {upcomingSessions.length > 0 && (
        <div>
          <h2 className="text-2xl font-semibold mb-4">Upcoming Sessions</h2>
          <div className="space-y-4">
            {upcomingSessions.map((sessionItem) => {
              const cohort = cohorts.find((c) => c._id.toString() === sessionItem.cohortId.toString())
              const timeUntil = new Date(sessionItem.startTime).getTime() - now.getTime()
              const hoursUntil = Math.floor(timeUntil / (1000 * 60 * 60))
              const isToday = hoursUntil < 24

              return (
                <Card key={sessionItem._id.toString()} className="hover:border-primary/50 transition-colors">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{sessionItem.title}</CardTitle>
                        <CardDescription className="mt-1">
                          {cohort?.name} • {new Date(sessionItem.startTime).toLocaleString()}
                        </CardDescription>
                      </div>
                      {isToday && <Badge>Today</Badge>}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {sessionItem.description && (
                      <p className="text-sm text-muted-foreground">{sessionItem.description}</p>
                    )}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>
                          {new Date(sessionItem.startTime).toLocaleTimeString()} -{" "}
                          {new Date(sessionItem.endTime).toLocaleTimeString()}
                        </span>
                      </div>
                      {sessionItem.googleMeetLink && (
                        <a href={sessionItem.googleMeetLink} target="_blank" rel="noopener noreferrer">
                          <Button size="sm" className="cursor-pointer">
                            <Video className="mr-2 h-4 w-4" />
                            Join Meeting
                          </Button>
                        </a>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      )}

      {/* Past Sessions */}
      {pastSessions.length > 0 && (
        <div>
          <h2 className="text-2xl font-semibold mb-4">Past Sessions</h2>
          <div className="space-y-4">
            {pastSessions.map((sessionItem) => {
              const cohort = cohorts.find((c) => c._id.toString() === sessionItem.cohortId.toString())

              return (
                <Card key={sessionItem._id.toString()} className="opacity-75">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{sessionItem.title}</CardTitle>
                        <CardDescription className="mt-1">
                          {cohort?.name} • {new Date(sessionItem.startTime).toLocaleString()}
                        </CardDescription>
                      </div>
                      <Badge variant="outline">Completed</Badge>
                    </div>
                  </CardHeader>
                  {sessionItem.description && (
                    <CardContent>
                      <p className="text-sm text-muted-foreground">{sessionItem.description}</p>
                    </CardContent>
                  )}
                </Card>
              )
            })}
          </div>
        </div>
      )}

      {allSessions.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No sessions yet</h3>
            <p className="text-muted-foreground text-center">Sessions will appear here once they are scheduled</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
