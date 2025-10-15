"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ConversationList } from "@/components/chat/conversation-list";
import { ChatInterface } from "@/components/chat/chat-interface";
import { MessageSquare, Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Cohort {
  _id: string;
  name: string;
  fellowIds: string[];
}

interface Fellow {
  _id: string;
  name: string;
  email: string;
  image?: string;
  cohortIds: string[];
}

export default function AdminChatPage() {
  const { data: session } = useSession();
  const [selectedConversation, setSelectedConversation] = useState<any>(null);
  const [cohorts, setCohorts] = useState<Cohort[]>([]);
  const [fellows, setFellows] = useState<Fellow[]>([]);
  const [selectedCohort, setSelectedCohort] = useState<string>("");
  const [selectedFellow, setSelectedFellow] = useState<string>("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchCohorts();
    fetchFellows();
  }, []);

  const fetchCohorts = async () => {
    try {
      const response = await fetch("/api/cohorts");
      const data = await response.json();
      if (data.cohorts) {
        setCohorts(data.cohorts);
      }
    } catch (error) {
      console.error("Error fetching cohorts:", error);
    }
  };

  const fetchFellows = async () => {
    try {
      const response = await fetch("/api/fellows");
      const data = await response.json();
      if (data.fellows) {
        setFellows(data.fellows);
      }
    } catch (error) {
      console.error("Error fetching fellows:", error);
    }
  };

  const createGroupChat = async (cohortId: string) => {
    try {
      setCreating(true);
      const cohort = cohorts.find((c) => c._id === cohortId);
      if (!cohort) return;

      const participantIds = [...cohort.fellowIds, session?.user?.id];

      const response = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "group",
          cohortId,
          participantIds,
        }),
      });

      const data = await response.json();
      if (data.conversation) {
        setSelectedConversation({
          _id: data.conversation._id,
          type: "group",
          participants: fellows.filter((f) => participantIds.includes(f._id)),
          cohort: { name: cohort.name },
        });
        setDialogOpen(false);
      }
    } catch (error) {
      console.error("Error creating group chat:", error);
    } finally {
      setCreating(false);
    }
  };

  const createDirectChat = async (fellowId: string) => {
    try {
      setCreating(true);
      const participantIds = [fellowId, session?.user?.id];

      const response = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "direct",
          participantIds,
        }),
      });

      const data = await response.json();
      if (data.conversation) {
        setSelectedConversation({
          _id: data.conversation._id,
          type: "direct",
          participants: fellows.filter((f) => participantIds.includes(f._id)),
        });
        setDialogOpen(false);
      }
    } catch (error) {
      console.error("Error creating direct chat:", error);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Messages</h2>
          <p className="text-muted-foreground">
            Chat with fellows in your cohorts
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Chat
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Start a New Chat</DialogTitle>
              <DialogDescription>
                Create a group chat with a cohort or chat one-on-one with a
                fellow
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold mb-3">Group Chats (Cohorts)</h3>
                <ScrollArea className="h-[200px]">
                  <div className="space-y-2">
                    {cohorts.map((cohort) => (
                      <button
                        key={cohort._id}
                        onClick={() => createGroupChat(cohort._id)}
                        disabled={creating}
                        className="w-full text-left p-3 rounded-lg border hover:bg-muted transition-colors"
                      >
                        <p className="font-medium">{cohort.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {cohort.fellowIds.length} fellows
                        </p>
                      </button>
                    ))}
                  </div>
                </ScrollArea>
              </div>

              <div>
                <h3 className="font-semibold mb-3">Direct Messages</h3>
                <ScrollArea className="h-[200px]">
                  <div className="space-y-2">
                    {fellows.map((fellow) => (
                      <button
                        key={fellow._id}
                        onClick={() => createDirectChat(fellow._id)}
                        disabled={creating}
                        className="w-full text-left p-3 rounded-lg border hover:bg-muted transition-colors flex items-center gap-3"
                      >
                        <Avatar className="h-8 w-8">
                          <AvatarImage
                            src={fellow.image || "/placeholder.svg"}
                          />
                          <AvatarFallback>
                            {fellow.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{fellow.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {fellow.email}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <ConversationList
            onSelectConversation={(id, conversation) =>
              setSelectedConversation(conversation)
            }
            selectedConversationId={selectedConversation?._id}
          />
        </div>

        <div className="lg:col-span-2">
          {selectedConversation ? (
            <ChatInterface
              conversationId={selectedConversation._id}
              participants={selectedConversation.participants}
              type={selectedConversation.type}
              cohortName={selectedConversation.cohort?.name}
            />
          ) : (
            <Card className="h-[600px] flex items-center justify-center">
              <CardContent className="text-center">
                <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  No conversation selected
                </h3>
                <p className="text-muted-foreground">
                  Select a conversation or start a new chat
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
