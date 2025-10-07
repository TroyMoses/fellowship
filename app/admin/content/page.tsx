import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getDatabase } from "@/lib/mongodb"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { Plus, FileText, ImageIcon, Video, File, ExternalLink } from "lucide-react"
import { ObjectId } from "mongodb"

const getFileIcon = (mimeType: string) => {
  if (mimeType.startsWith("image/")) return ImageIcon
  if (mimeType.startsWith("video/")) return Video
  if (mimeType.includes("pdf") || mimeType.includes("document")) return FileText
  return File
}

export default async function ContentPage() {
  const session = await getServerSession(authOptions)
  const db = await getDatabase()

  const content = await db
    .collection("content")
    .aggregate([
      {
        $lookup: {
          from: "cohorts",
          localField: "cohortId",
          foreignField: "_id",
          as: "cohort",
        },
      },
      {
        $match: {
          "cohort.institutionId": new ObjectId(session?.user?.institutionId),
        },
      },
      { $sort: { uploadedAt: -1 } },
      { $limit: 50 },
    ])
    .toArray()

  const cohorts = await db
    .collection("cohorts")
    .find({
      institutionId: new ObjectId(session?.user?.institutionId),
    })
    .toArray()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Content Library</h2>
          <p className="text-muted-foreground">Manage and share content with your fellows via Google Drive</p>
        </div>
        <Link href="/admin/content/upload">
          <Button className="cursor-pointer">
            <Plus className="mr-2 h-4 w-4" />
            Upload Content
          </Button>
        </Link>
      </div>

      {content.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No content yet</h3>
            <p className="text-muted-foreground text-center mb-6">Upload your first content to share with fellows</p>
            <Link href="/admin/content/upload">
              <Button className="cursor-pointer">
                <Plus className="mr-2 h-4 w-4" />
                Upload Your First Content
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {content.map((item) => {
            const Icon = getFileIcon(item.mimeType || "")
            const cohort = item.cohort?.[0]

            return (
              <Card key={item._id.toString()} className="cursor-pointer hover:border-primary/50 transition-colors">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-base truncate">{item.title}</CardTitle>
                        <CardDescription className="text-xs mt-1">{cohort?.name || "Unknown cohort"}</CardDescription>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {item.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">{item.description}</p>
                    )}
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-xs">
                        {item.type}
                      </Badge>
                      <a href={item.googleDriveLink} target="_blank" rel="noopener noreferrer">
                        <Button variant="ghost" size="sm" className="cursor-pointer h-8">
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      </a>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Uploaded {new Date(item.uploadedAt).toLocaleDateString()}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {cohorts.length === 0 && (
        <Card className="border-destructive/50">
          <CardContent className="py-6">
            <p className="text-sm text-muted-foreground">
              You need to create a cohort first before uploading content.{" "}
              <Link href="/admin/cohorts/new" className="text-primary hover:underline cursor-pointer">
                Create a cohort
              </Link>
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
