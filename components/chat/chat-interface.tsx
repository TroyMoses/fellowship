"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Loader2 } from "lucide-react";
import { useSession } from "next-auth/react";

interface Message {
  _id: string;
  senderId: string;
  content: string;
  createdAt: string;
  readBy: string[];
}

interface Participant {
  _id: string;
  name: string;
  email: string;
  image?: string;
}

interface ChatInterfaceProps {
  conversationId: string;
  participants: Participant[];
  type: "group" | "direct";
  cohortName?: string;
}

export function ChatInterface({
  conversationId,
  participants,
  type,
  cohortName,
}: ChatInterfaceProps) {
  const { data: session } = useSession();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 3000); // Poll every 3 seconds
    return () => clearInterval(interval);
  }, [conversationId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/messages?conversationId=${conversationId}`
      );
      const data = await response.json();
      if (data.messages) {
        setMessages(data.messages);
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || sending) return;

    try {
      setSending(true);
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId,
          content: newMessage.trim(),
        }),
      });

      if (response.ok) {
        setNewMessage("");
        await fetchMessages();
      }
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setSending(false);
    }
  };

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  const getOtherParticipant = () => {
    return participants.find((p) => p._id !== session?.user?.id);
  };

  const otherParticipant = type === "direct" ? getOtherParticipant() : null;

  return (
    <Card className="flex flex-col h-[600px]">
      <CardHeader className="border-b">
        <div className="flex items-center gap-3">
          {type === "direct" && otherParticipant && (
            <Avatar>
              <AvatarImage src={otherParticipant.image || "/placeholder.svg"} />
              <AvatarFallback>{otherParticipant.name.charAt(0)}</AvatarFallback>
            </Avatar>
          )}
          <div>
            <CardTitle className="text-lg">
              {type === "group"
                ? cohortName || "Group Chat"
                : otherParticipant?.name || "Chat"}
            </CardTitle>
            {type === "group" && (
              <p className="text-sm text-muted-foreground">
                {participants.length} members
              </p>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 p-0 flex flex-col">
        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          <div className="space-y-4">
            {messages.map((message) => {
              const isOwn = message.senderId === session?.user?.id;
              const sender = participants.find(
                (p) => p._id === message.senderId
              );

              return (
                <div
                  key={message._id}
                  className={`flex gap-3 ${isOwn ? "flex-row-reverse" : ""}`}
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={sender?.image || "/placeholder.svg"} />
                    <AvatarFallback>
                      {sender?.name.charAt(0) || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className={`flex flex-col ${isOwn ? "items-end" : ""}`}>
                    {!isOwn && type === "group" && (
                      <span className="text-xs text-muted-foreground mb-1">
                        {sender?.name}
                      </span>
                    )}
                    <div
                      className={`rounded-lg px-4 py-2 max-w-[70%] ${
                        isOwn
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                    </div>
                    <span className="text-xs text-muted-foreground mt-1">
                      {new Date(message.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>

        <div className="border-t p-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage();
            }}
            className="flex gap-2"
          >
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              disabled={sending}
            />
            <Button
              type="submit"
              size="icon"
              disabled={sending || !newMessage.trim()}
            >
              {sending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  );
}
