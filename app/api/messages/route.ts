import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

// GET - Fetch messages for a conversation
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get("conversationId");

    if (!conversationId) {
      return NextResponse.json(
        { error: "Conversation ID required" },
        { status: 400 }
      );
    }

    const db = await getDatabase();

    // Verify user is part of the conversation
    const conversation = await db.collection("conversations").findOne({
      _id: new ObjectId(conversationId),
      participantIds: new ObjectId(session.user.id),
    });

    if (!conversation) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      );
    }

    // Fetch messages
    const messages = await db
      .collection("messages")
      .find({ conversationId: new ObjectId(conversationId) })
      .sort({ createdAt: 1 })
      .limit(100)
      .toArray();

    // Mark messages as read
    await db.collection("messages").updateMany(
      {
        conversationId: new ObjectId(conversationId),
        senderId: { $ne: new ObjectId(session.user.id) },
        readBy: { $ne: new ObjectId(session.user.id) },
      },
      {
        $addToSet: { readBy: new ObjectId(session.user.id) },
      }
    );

    return NextResponse.json({ messages });
  } catch (error) {
    console.error("Error fetching messages:", error);
    return NextResponse.json(
      { error: "Failed to fetch messages" },
      { status: 500 }
    );
  }
}

// POST - Send a new message
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { conversationId, content } = await request.json();

    if (!conversationId || !content) {
      return NextResponse.json(
        { error: "Conversation ID and content required" },
        { status: 400 }
      );
    }

    const db = await getDatabase();

    // Verify user is part of the conversation
    const conversation = await db.collection("conversations").findOne({
      _id: new ObjectId(conversationId),
      participantIds: new ObjectId(session.user.id),
    });

    if (!conversation) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      );
    }

    // Create message
    const message = {
      conversationId: new ObjectId(conversationId),
      senderId: new ObjectId(session.user.id),
      content,
      readBy: [new ObjectId(session.user.id)],
      createdAt: new Date(),
    };

    const result = await db.collection("messages").insertOne(message);

    // Update conversation's last message time
    await db
      .collection("conversations")
      .updateOne(
        { _id: new ObjectId(conversationId) },
        { $set: { lastMessageAt: new Date() } }
      );

    return NextResponse.json({
      message: { ...message, _id: result.insertedId },
    });
  } catch (error) {
    console.error("Error sending message:", error);
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 }
    );
  }
}
