import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

// GET - Fetch all conversations for the user
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = await getDatabase();

    const conversations = await db
      .collection("conversations")
      .find({ participantIds: new ObjectId(session.user.id) })
      .sort({ lastMessageAt: -1 })
      .toArray();

    // Get participant details and last message for each conversation
    const conversationsWithDetails = await Promise.all(
      conversations.map(async (conv) => {
        const participants = await db
          .collection("users")
          .find({ _id: { $in: conv.participantIds } })
          .toArray();

        const lastMessage = await db
          .collection("messages")
          .findOne({ conversationId: conv._id }, { sort: { createdAt: -1 } });

        const unreadCount = await db.collection("messages").countDocuments({
          conversationId: conv._id,
          senderId: { $ne: new ObjectId(session.user.id) },
          readBy: { $ne: new ObjectId(session.user.id) },
        });

        let cohort = null;
        if (conv.cohortId) {
          cohort = await db
            .collection("cohorts")
            .findOne({ _id: conv.cohortId });
        }

        return {
          ...conv,
          participants,
          lastMessage,
          unreadCount,
          cohort,
        };
      })
    );

    return NextResponse.json({ conversations: conversationsWithDetails });
  } catch (error) {
    console.error("Error fetching conversations:", error);
    return NextResponse.json(
      { error: "Failed to fetch conversations" },
      { status: 500 }
    );
  }
}

// POST - Create a new conversation
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { type, cohortId, participantIds } = await request.json();

    if (!type || !participantIds || participantIds.length === 0) {
      return NextResponse.json(
        { error: "Type and participant IDs required" },
        { status: 400 }
      );
    }

    const db = await getDatabase();

    // Check if conversation already exists
    const existingConversation = await db.collection("conversations").findOne({
      type,
      ...(cohortId && { cohortId: new ObjectId(cohortId) }),
      participantIds: {
        $all: participantIds.map((id: string) => new ObjectId(id)),
        $size: participantIds.length,
      },
    });

    if (existingConversation) {
      return NextResponse.json({ conversation: existingConversation });
    }

    // Create new conversation
    const conversation = {
      type,
      ...(cohortId && { cohortId: new ObjectId(cohortId) }),
      participantIds: participantIds.map((id: string) => new ObjectId(id)),
      lastMessageAt: new Date(),
      createdAt: new Date(),
    };

    const result = await db.collection("conversations").insertOne(conversation);

    return NextResponse.json({
      conversation: { ...conversation, _id: result.insertedId },
    });
  } catch (error) {
    console.error("Error creating conversation:", error);
    return NextResponse.json(
      { error: "Failed to create conversation" },
      { status: 500 }
    );
  }
}
