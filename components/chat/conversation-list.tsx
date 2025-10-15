"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageSquare, Users } from "lucide-react";
import { useSession } from "next-auth/react";

interface Conversation {
  _id: string;
  type: "group" | "direct";
  participants: Array<{
    _id: string;
    name: string;
    email: string;
    image?: string;
  }>;
  lastMessage?: {
    content: string;
    createdAt: string;
  };
  unreadCount: number;
  cohort?: {
    name: string;
  };
}

interface ConversationListProps {
  onSelectConversation: (
    conversationId: string,
    conversation: Conversation
  ) => void;
  selectedConversationId?: string;
}

export function ConversationList({
  onSelectConversation,
  selectedConversationId,
}: ConversationListProps) {
  const { data: session } = useSession();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchConversations();
    const interval = setInterval(fetchConversations, 5000); // Poll every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchConversations = async () => {
    try {
      const response = await fetch("/api/conversations");
      const data = await response.json();
      if (data.conversations) {
        setConversations(data.conversations);
      }
    } catch (error) {
      console.error("Error fetching conversations:", error);
    } finally {
      setLoading(false);
    }
  };

  const getConversationName = (conversation: Conversation) => {
    if (conversation.type === "group") {
      return conversation.cohort?.name || "Group Chat";
    }
    const otherParticipant = conversation.participants.find(
      (p) => p._id !== session?.user?.id
    );
    return otherParticipant?.name || "Unknown";
  };

  const getConversationAvatar = (conversation: Conversation) => {
    if (conversation.type === "group") {
      return null;
    }
    const otherParticipant = conversation.participants.find(
      (p) => p._id !== session?.user?.id
    );
    return otherParticipant?.image;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <p className="text-muted-foreground">Loading conversations...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-[600px] flex flex-col">
      <CardHeader className="border-b">
        <CardTitle className="text-lg">Messages</CardTitle>
      </CardHeader>
      <ScrollArea className="flex-1">
        <div className="p-2">
          {conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <MessageSquare className="h-12 w-12 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">
                No conversations yet
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {conversations.map((conversation) => {
                const isSelected = conversation._id === selectedConversationId;
                const conversationName = getConversationName(conversation);
                const avatar = getConversationAvatar(conversation);

                return (
                  <button
                    key={conversation._id}
                    onClick={() =>
                      onSelectConversation(conversation._id, conversation)
                    }
                    className={`w-full text-left p-3 rounded-lg transition-colors ${
                      isSelected ? "bg-primary/10" : "hover:bg-muted"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <Avatar className="h-10 w-10">
                        {conversation.type === "group" ? (
                          <div className="bg-primary/10 w-full h-full flex items-center justify-center">
                            <Users className="h-5 w-5 text-primary" />
                          </div>
                        ) : (
                          <>
                            <AvatarImage src={avatar || "/placeholder.svg"} />
                            <AvatarFallback>
                              {conversationName.charAt(0)}
                            </AvatarFallback>
                          </>
                        )}
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-medium text-sm truncate">
                            {conversationName}
                          </p>
                          {conversation.unreadCount > 0 && (
                            <Badge
                              variant="default"
                              className="ml-2 h-5 min-w-5 px-1.5"
                            >
                              {conversation.unreadCount}
                            </Badge>
                          )}
                        </div>
                        {conversation.lastMessage && (
                          <p className="text-xs text-muted-foreground truncate">
                            {conversation.lastMessage.content}
                          </p>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </ScrollArea>
    </Card>
  );
}
