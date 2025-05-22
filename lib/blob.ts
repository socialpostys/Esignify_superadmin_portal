import { put } from "@vercel/blob"
import { nanoid } from "nanoid"

export async function uploadToBlob(file: File, folder = "uploads") {
  try {
    // Check if we have the Blob token
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      console.warn("BLOB_READ_WRITE_TOKEN is not set. Using local storage fallback.")
      // Return a data URL as fallback
      return await convertToBase64(file)
    }

    // Generate a unique filename
    const filename = `${folder}/${nanoid()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "")}`

    // Upload to Vercel Blob
    const { url } = await put(filename, file, {
      access: "public",
    })

    return { url, success: true }
  } catch (error) {
    console.error("Error uploading to Blob:", error)

    // Try fallback to base64 if Blob upload fails
    try {
      console.warn("Blob upload failed. Using base64 fallback.")
      return await convertToBase64(file)
    } catch (fallbackError) {
      return {
        error: `Failed to upload file: ${error instanceof Error ? error.message : "Unknown error"}`,
        success: false,
      }
    }
  }
}

// Fallback function to convert file to base64 data URL
async function convertToBase64(file: File) {
  return new Promise<{ url: string; success: true }>((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => {
      resolve({ url: reader.result as string, success: true })
    }
    reader.onerror = (error) => {
      reject({
        error: `Failed to convert file to base64: ${error}`,
        success: false,
      })
    }
  })
}
