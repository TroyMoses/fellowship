import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getDatabase } from "@/lib/mongodb"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { FileText, ImageIcon, Video, File, ExternalLink } from "lucide-react"
import { ObjectId } from "mongodb"

const getFileIcon = (mimeType: string) => {
  if (mimeType.startsWith("image/")) return ImageIcon
  if (mimeType.startsWith("video/")) return Video
  if (mimeType.includes("pdf") || mimeType.includes("document")) return FileText
  return File
}

export default async function FellowContentPage() {
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

  // Get all content
  const content = await db
    .collection("content")
    .find({
      cohortId: { $in: cohorts.map((c) => c._id) },
    })
    .sort({ uploadedAt: -1 })
    .toArray()

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold tracking-tight">Content Library</h1>
        <p className="text-muted-foreground mt-2">Access all your fellowship materials and resources</p>
      </div>

      {content.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No content yet</h3>
            <p className="text-muted-foreground text-center">Content will appear here once it's uploaded</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {content.map((item) => {
            const Icon = getFileIcon(item.mimeType || "")
            const cohort = cohorts.find((c) => c._id.toString() === item.cohortId.toString())

            return (
              <Card key={item._id.toString()} className="hover:border-primary/50 transition-colors">
                <CardHeader>
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base truncate">{item.title}</CardTitle>
                      <CardDescription className="text-xs mt-1">{cohort?.name}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {item.description && <p className="text-sm text-muted-foreground line-clamp-2">{item.description}</p>}
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-xs">
                      {item.type}
                    </Badge>
                    <p className="text-xs text-muted-foreground">{new Date(item.uploadedAt).toLocaleDateString()}</p>
                  </div>
                  <a href={item.googleDriveLink} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" size="sm" className="w-full cursor-pointer bg-transparent">
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Open in Drive
                    </Button>
                  </a>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
