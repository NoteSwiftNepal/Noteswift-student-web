import { signChatUpload } from "@/api/student/messages";

// Presigned-PUT upload: sign → PUT the raw file straight to R2 → use the
// returned publicUrl. Distinct from Phase 3's subjective-test-answer upload
// (multipart/form-data POSTed through the Express server via multer) — this
// endpoint hands back an R2 presigned URL instead, so the file bytes go
// straight from the browser to storage, never through the backend at all.
// No mobile equivalent to port: AskDoubt.tsx doesn't implement image upload
// at all despite CODEBASE_MAP.md's summary and doubt attachments being a
// real, modeled field server-side (Question.attachments) — built fresh here
// per this phase's explicit brief, reusing the one signed-upload endpoint
// students actually have (messages/upload-sign).
export async function uploadImageAndGetAttachment(
  file: File
): Promise<{ name: string; url: string; type: string; size: number }> {
  const signRes = await signChatUpload(file.name, file.type, file.size);
  if (signRes.error) {
    throw new Error(signRes.message || "Failed to get upload URL");
  }

  const { uploadUrl, publicUrl } = signRes.result;

  const putRes = await fetch(uploadUrl, {
    method: "PUT",
    body: file,
    headers: { "Content-Type": file.type },
  });
  if (!putRes.ok) {
    throw new Error("Failed to upload image");
  }

  return { name: file.name, url: publicUrl, type: file.type, size: file.size };
}
