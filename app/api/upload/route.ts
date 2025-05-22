import { NextResponse } from "next/server"
import { uploadToBlob } from "@/lib/blob"

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File | null
    const folder = (formData.get("folder") as string) || "uploads"

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Check if Blob integration is available
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      console.warn("BLOB_READ_WRITE_TOKEN is not set. Using local storage fallback.")
    }

    const result = await uploadToBlob(file, folder)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    return NextResponse.json({ url: result.url })
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json(
      { error: `Upload failed: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 },
    )
  }
}
