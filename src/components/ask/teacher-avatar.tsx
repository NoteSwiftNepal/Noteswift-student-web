import { getTeacherAvatarSource } from "@/lib/directChat";
import { cn } from "@/lib/utils";

// Shared by the conversation-list rows (ask/chat/page.tsx) and the chat
// thread header (ask/chat/[teacherId]/[subjectName]/page.tsx) — mirrors
// mobile's app/Ask/components/TeacherAvatar.tsx exactly, so both render
// sites stay in sync with the same photo-vs-initial fallback rule instead
// of duplicating it. Plain <img>, not next/image: teacher profile photos
// come from whatever host the backend/admin uploaded them to (Cloudinary,
// R2, etc.) — the same "arbitrary remote host" case course thumbnails and
// the student's own avatar already handle with a plain <img>, not a second
// pattern.
export function TeacherAvatar({
  name,
  photoUrl,
  size = 40,
  className,
}: {
  name: string | null | undefined;
  photoUrl?: string | null;
  size?: number;
  className?: string;
}) {
  const source = getTeacherAvatarSource(name, photoUrl);

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/10 font-semibold text-primary",
        className
      )}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.4) }}
    >
      {source.kind === "photo" ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={source.url} alt={name || "Teacher"} className="size-full object-cover" />
      ) : (
        source.letter
      )}
    </div>
  );
}
