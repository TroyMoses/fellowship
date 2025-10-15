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
import {
  Calendar,
  Video,
  Clock,
  LayoutGrid,
  TableIcon,
  XCircle,
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
  cohortId: { toString: () => string };
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  googleMeetLink?: string;
  status?: string;
  cancellationReason?: string;
}

interface Cohort {
  _id: { toString: () => string };
  name: string;
}

interface FellowSessionsViewProps {
  upcomingSessions: Session[];
  cancelledSessions: Session[];
  pastSessions: Session[];
  cohorts: Cohort[];
}

export function FellowSessionsView({
  upcomingSessions,
  cancelledSessions,
  pastSessions,
  cohorts,
}: FellowSessionsViewProps) {
  const [view, setView] = useState<"cards" | "table">(
    typeof window !== "undefined" && window.innerWidth < 768 ? "cards" : "table"
  );

  const getCohortName = (cohortId: string) => {
    return (
      cohorts.find((c) => c._id.toString() === cohortId)?.name ||
      "Unknown cohort"
    );
  };

  const SessionCard = ({
    session,
    isCancelled = false,
  }: {
    session: Session;
    isCancelled?: boolean;
  }) => {
    const cohortName = getCohortName(session.cohortId.toString());
    const now = new Date();
    const timeUntil = new Date(session.startTime).getTime() - now.getTime();
    const hoursUntil = Math.floor(timeUntil / (1000 * 60 * 60));
    const isToday = hoursUntil < 24 && hoursUntil >= 0;

    return (
      <Card
        className={`hover:border-primary/50 transition-colors ${
          isCancelled ? "opacity-60" : ""
        }`}
      >
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-lg">{session.title}</CardTitle>
              <CardDescription className="mt-1">
                {cohortName} • {new Date(session.startTime).toLocaleString()}
              </CardDescription>
            </div>
            {isCancelled ? (
              <Badge variant="destructive">Cancelled</Badge>
            ) : isToday ? (
              <Badge>Today</Badge>
            ) : null}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {session.description && (
            <p className="text-sm text-muted-foreground">
              {session.description}
            </p>
          )}
          {isCancelled && session.cancellationReason && (
            <p className="text-sm text-destructive">
              Reason: {session.cancellationReason}
            </p>
          )}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>
                {new Date(session.startTime).toLocaleTimeString()} -{" "}
                {new Date(session.endTime).toLocaleTimeString()}
              </span>
            </div>
            {session.googleMeetLink && !isCancelled && (
              <a
                href={session.googleMeetLink}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button size="sm" className="cursor-pointer">
                  <Video className="mr-2 h-4 w-4" />
                  Join Meeting
                </Button>
              </a>
            )}
            {isCancelled && (
              <Button size="sm" disabled variant="outline">
                <XCircle className="mr-2 h-4 w-4" />
                Cancelled
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  const SessionTableRow = ({
    session,
    isCancelled = false,
  }: {
    session: Session;
    isCancelled?: boolean;
  }) => {
    const cohortName = getCohortName(session.cohortId.toString());

    return (
      <TableRow className={isCancelled ? "opacity-60" : ""}>
        <TableCell className="font-medium">{session.title}</TableCell>
        <TableCell>{cohortName}</TableCell>
        <TableCell>{new Date(session.startTime).toLocaleString()}</TableCell>
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
            <a
              href={session.googleMeetLink}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button size="sm" className="cursor-pointer">
                <Video className="mr-2 h-4 w-4" />
                Join
              </Button>
            </a>
          ) : isCancelled ? (
            <Button size="sm" disabled variant="outline">
              Cancelled
            </Button>
          ) : (
            <span className="text-muted-foreground">-</span>
          )}
        </TableCell>
      </TableRow>
    );
  };

  const allSessions = [
    ...upcomingSessions,
    ...cancelledSessions,
    ...pastSessions,
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Sessions</h1>
          <p className="text-muted-foreground mt-2">
            View and join your fellowship sessions
          </p>
        </div>
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
      </div>

      {allSessions.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No sessions yet</h3>
            <p className="text-muted-foreground text-center">
              Sessions will appear here once they are scheduled
            </p>
          </CardContent>
        </Card>
      ) : view === "cards" ? (
        <div className="space-y-6">
          {upcomingSessions.length > 0 && (
            <div>
              <h2 className="text-2xl font-semibold mb-4">Upcoming Sessions</h2>
              <div className="space-y-4">
                {upcomingSessions.map((session) => (
                  <SessionCard key={session._id.toString()} session={session} />
                ))}
              </div>
            </div>
          )}

          {cancelledSessions.length > 0 && (
            <div>
              <h2 className="text-2xl font-semibold mb-4">
                Cancelled Sessions
              </h2>
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
              <h2 className="text-2xl font-semibold mb-4">Past Sessions</h2>
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
                <TableHead>Cohort</TableHead>
                <TableHead>Date & Time</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Action</TableHead>
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
