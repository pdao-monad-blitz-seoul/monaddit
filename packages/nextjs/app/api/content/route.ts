import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";

// In-memory storage for demo (replace with actual database in production)
const contentStore = new Map<string, any>();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, content, author, contentType = "post" } = body;

    if (!title || !content || !author) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Create content hash
    const contentString = JSON.stringify({ title, content, author, contentType });
    const contentHash = "0x" + createHash("sha256").update(contentString).digest("hex");

    // Generate unique ID
    const contentId = Date.now().toString();

    // Store content (in production, use PostgreSQL)
    const contentData = {
      id: contentId,
      title,
      content,
      author,
      contentType,
      contentHash,
      timestamp: new Date().toISOString(),
      status: "published",
    };

    contentStore.set(contentId, contentData);

    // Return hash for on-chain storage
    return NextResponse.json({
      success: true,
      contentId,
      contentHash,
      uri: `/api/content/${contentId}`,
    });
  } catch (error) {
    console.error("Error storing content:", error);
    return NextResponse.json(
      { error: "Failed to store content" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const contentId = searchParams.get("id");

    if (contentId) {
      const content = contentStore.get(contentId);
      if (!content) {
        return NextResponse.json(
          { error: "Content not found" },
          { status: 404 }
        );
      }
      return NextResponse.json(content);
    }

    // Return all content
    const allContent = Array.from(contentStore.values())
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return NextResponse.json(allContent);
  } catch (error) {
    console.error("Error fetching content:", error);
    return NextResponse.json(
      { error: "Failed to fetch content" },
      { status: 500 }
    );
  }
}