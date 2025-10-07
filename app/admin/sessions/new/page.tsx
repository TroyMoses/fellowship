"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function NewSessionPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [cohorts, setCohorts] = useState<any[]>([])
  const [formData, setFormData] = useState({
    cohortId: "",
    title: "",
    description: "",
    date: "",
    startTime: "",
    endTime: "",
  })

  useEffect(() => {
    fetchCohorts()
  }, [])

  const fetchCohorts = async () => {
    try {
      const response = await fetch("/api/cohorts")
      const data = await response.json()
      setCohorts(data.cohorts || [])
    } catch (error) {
      console.error("[v0] Failed to fetch cohorts:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Combine date and time
      const startDateTime = new Date(`${formData.date}T${formData.startTime}`)
      const endDateTime = new Date(`${formData.date}T${formData.endTime}`)

      const response = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cohortId: formData.cohortId,
          title: formData.title,
          description: formData.description,
          startTime: startDateTime.toISOString(),
          endTime: endDateTime.toISOString(),
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to create session")
      }

      toast.success("Session scheduled successfully with Google Meet!")
      router.push("/admin/sessions")
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <Link href="/admin/sessions">
          <Button variant="ghost" className="mb-4 cursor-pointer">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Sessions
          </Button>
        </Link>
        <h2 className="text-3xl font-bold tracking-tight">Schedule New Session</h2>
        <p className="text-muted-foreground">Create a session with automatic Google Meet link</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Session Details</CardTitle>
          <CardDescription>Enter the information for your new session</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="cohortId">Cohort *</Label>
              <Select
                value={formData.cohortId}
                onValueChange={(value) => setFormData({ ...formData, cohortId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a cohort" />
                </SelectTrigger>
                <SelectContent>
                  {cohorts.map((cohort) => (
                    <SelectItem key={cohort._id} value={cohort._id}>
                      {cohort.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Session Title *</Label>
              <Input
                id="title"
                placeholder="e.g., Week 1: Introduction to Fellowship"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="What will be covered in this session..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">Date *</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="startTime">Start Time *</Label>
                <Input
                  id="startTime"
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endTime">End Time *</Label>
                <Input
                  id="endTime"
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="rounded-lg bg-primary/10 p-4 text-sm">
              <p className="text-primary">
                A Google Meet link will be automatically created and all fellows in the selected cohort will receive
                calendar invites.
              </p>
            </div>

            <div className="flex gap-4">
              <Button type="submit" disabled={loading || cohorts.length === 0} className="cursor-pointer">
                {loading ? "Scheduling..." : "Schedule Session"}
              </Button>
              <Link href="/admin/sessions">
                <Button type="button" variant="outline" className="cursor-pointer bg-transparent">
                  Cancel
                </Button>
              </Link>
            </div>

            {cohorts.length === 0 && (
              <p className="text-sm text-muted-foreground">
                You need to create a cohort first before scheduling sessions.
              </p>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
