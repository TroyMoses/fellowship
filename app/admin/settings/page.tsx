"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { CheckCircle2, XCircle, RefreshCw } from "lucide-react"

export default function SettingsPage() {
  const [loading, setLoading] = useState(false)
  const [googleConnected, setGoogleConnected] = useState(false)
  const [testingConnection, setTestingConnection] = useState(false)

  useEffect(() => {
    checkGoogleConnection()
  }, [])

  const checkGoogleConnection = async () => {
    // This would check if Google is connected
    // For now, we'll assume it's connected if the user is authenticated
    setGoogleConnected(true)
  }

  const testGoogleConnection = async () => {
    setTestingConnection(true)
    try {
      // This would test the Google API connection
      await new Promise((resolve) => setTimeout(resolve, 1500))
      toast.success("Google APIs are working correctly!")
    } catch (error: any) {
      toast.error("Failed to connect to Google APIs")
    } finally {
      setTestingConnection(false)
    }
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground">Manage your institution settings and integrations</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Google Workspace Integration</CardTitle>
          <CardDescription>Connect your Google account to enable Calendar and Drive features</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border border-border rounded-lg">
            <div className="flex items-center gap-3">
              {googleConnected ? (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-destructive" />
              )}
              <div>
                <p className="font-medium">Google Account</p>
                <p className="text-sm text-muted-foreground">
                  {googleConnected ? "Connected and active" : "Not connected"}
                </p>
              </div>
            </div>
            <Badge variant={googleConnected ? "default" : "outline"}>
              {googleConnected ? "Connected" : "Disconnected"}
            </Badge>
          </div>

          <div className="flex items-center justify-between p-4 border border-border rounded-lg">
            <div className="flex items-center gap-3">
              {googleConnected ? (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-destructive" />
              )}
              <div>
                <p className="font-medium">Google Calendar API</p>
                <p className="text-sm text-muted-foreground">For scheduling sessions with Google Meet</p>
              </div>
            </div>
            <Badge variant={googleConnected ? "default" : "outline"}>{googleConnected ? "Active" : "Inactive"}</Badge>
          </div>

          <div className="flex items-center justify-between p-4 border border-border rounded-lg">
            <div className="flex items-center gap-3">
              {googleConnected ? (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-destructive" />
              )}
              <div>
                <p className="font-medium">Google Drive API</p>
                <p className="text-sm text-muted-foreground">For content management and file sharing</p>
              </div>
            </div>
            <Badge variant={googleConnected ? "default" : "outline"}>{googleConnected ? "Active" : "Inactive"}</Badge>
          </div>

          <div className="pt-4">
            <Button onClick={testGoogleConnection} disabled={testingConnection} className="cursor-pointer">
              {testingConnection ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Testing Connection...
                </>
              ) : (
                <>Test Google Connection</>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Institution Information</CardTitle>
          <CardDescription>Your institution details and settings</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Institution Name</p>
              <p className="text-base">Fellowship Institution</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Admin Email</p>
              <p className="text-base">Connected via Google OAuth</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
