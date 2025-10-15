"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import Link from "next/link";
import {
  Plus,
  Calendar,
  Video,
  Users,
  LayoutGrid,
  TableIcon,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Session {
  _id: { toString: () => string };
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  googleMeetLink?: string;
  attendees?: any[];
  status?: string;
  cancellationReason?: string;
}

interface SessionsViewProps {
  upcomingSessions: Session[];
  cancelledSessions: Session[];
  pastSessions: Session[];
}

export function SessionsView({
  upcomingSessions,
  cancelledSessions,
  pastSessions,
}: SessionsViewProps) {
  const [view, setView] = useState<"cards" | "table">(
    typeof window !== "undefined" && window.innerWidth < 768 ? "cards" : "table"
  );

  const SessionCard = ({
    session,
    isCancelled = false,
  }: {
    session: Session;
    isCancelled?: boolean;
  }) => (
    <Link href={`/admin/sessions/${session._id.toString()}`}>
      <Card
        className={`cursor-pointer hover:border-primary/50 transition-colors ${
          isCancelled ? "opacity-60" : ""
        }`}
      >
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-lg">{session.title}</CardTitle>
              <CardDescription className="mt-1">
                {new Date(session.startTime).toLocaleString()} -{" "}
                {new Date(session.endTime).toLocaleTimeString()}
              </CardDescription>
            </div>
            {isCancelled ? (
              <Badge variant="destructive">Cancelled</Badge>
            ) : new Date(session.startTime) > new Date() ? (
              <Badge>Upcoming</Badge>
            ) : (
              <Badge variant="outline">Completed</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isCancelled && session.cancellationReason && (
            <p className="text-sm text-destructive mb-3">
              Reason: {session.cancellationReason}
            </p>
          )}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              <span>{session.attendees?.length || 0} attendees</span>
            </div>
            {session.googleMeetLink && !isCancelled && (
              <div className="flex items-center gap-1">
                <Video className="h-4 w-4" />
                <span>Google Meet</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );

  const SessionTableRow = ({
    session,
    isCancelled = false,
  }: {
    session: Session;
    isCancelled?: boolean;
  }) => (
    <TableRow className={isCancelled ? "opacity-60" : ""}>
      <TableCell>
        <Link
          href={`/admin/sessions/${session._id.toString()}`}
          className="font-medium hover:underline"
        >
          {session.title}
        </Link>
      </TableCell>
      <TableCell>{new Date(session.startTime).toLocaleString()}</TableCell>
      <TableCell>{session.attendees?.length || 0}</TableCell>
      <TableCell>
        {isCancelled ? (
          <Badge variant="destructive">Cancelled</Badge>
        ) : new Date(session.startTime) > new Date() ? (
          <Badge>Upcoming</Badge>
        ) : (
          <Badge variant="outline">Completed</Badge>
        )}
      </TableCell>
      <TableCell>
        {session.googleMeetLink && !isCancelled ? (
          <Video className="h-4 w-4 text-muted-foreground" />
        ) : (
          <span className="text-muted-foreground">-</span>
        )}
      </TableCell>
    </TableRow>
  );

  const allSessions = [
    ...upcomingSessions,
    ...cancelledSessions,
    ...pastSessions,
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Sessions</h2>
          <p className="text-muted-foreground">
            Schedule and manage fellowship sessions with Google Meet
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ToggleGroup
            type="single"
            value={view}
            onValueChange={(v) => v && setView(v as "cards" | "table")}
          >
            <ToggleGroupItem value="cards" aria-label="Card view">
              <LayoutGrid className="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="table" aria-label="Table view">
              <TableIcon className="h-4 w-4" />
            </ToggleGroupItem>
          </ToggleGroup>
          <Link href="/admin/sessions/new">
            <Button className="cursor-pointer">
              <Plus className="mr-2 h-4 w-4" />
              Schedule Session
            </Button>
          </Link>
        </div>
      </div>

      {allSessions.length === 0 ? (
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
      ) : view === "cards" ? (
        <div className="space-y-6">
          {upcomingSessions.length > 0 && (
            <div>
              <h3 className="text-xl font-semibold mb-4">Upcoming Sessions</h3>
              <div className="space-y-4">
                {upcomingSessions.map((session) => (
                  <SessionCard key={session._id.toString()} session={session} />
                ))}
              </div>
            </div>
          )}

          {cancelledSessions.length > 0 && (
            <div>
              <h3 className="text-xl font-semibold mb-4">Cancelled Sessions</h3>
              <div className="space-y-4">
                {cancelledSessions.map((session) => (
                  <SessionCard
                    key={session._id.toString()}
                    session={session}
                    isCancelled
                  />
                ))}
              </div>
            </div>
          )}

          {pastSessions.length > 0 && (
            <div>
              <h3 className="text-xl font-semibold mb-4">Past Sessions</h3>
              <div className="space-y-4">
                {pastSessions.map((session) => (
                  <SessionCard key={session._id.toString()} session={session} />
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Date & Time</TableHead>
                <TableHead>Attendees</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Meet Link</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {upcomingSessions.map((session) => (
                <SessionTableRow
                  key={session._id.toString()}
                  session={session}
                />
              ))}
              {cancelledSessions.map((session) => (
                <SessionTableRow
                  key={session._id.toString()}
                  session={session}
                  isCancelled
                />
              ))}
              {pastSessions.map((session) => (
                <SessionTableRow
                  key={session._id.toString()}
                  session={session}
                />
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
