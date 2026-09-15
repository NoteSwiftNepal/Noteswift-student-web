"use client";

import { useRef, useState } from "react";
import { Camera } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useAuthStore } from "@/stores/authStore";
import { uploadProfileImage } from "@/api/student/user";

const MAX_SIZE_BYTES = 5 * 1024 * 1024;

// Avatar editing on web = photo upload only. avatarEmoji is randomly
// assigned server-side at registration (auth.controller.ts's
// getRandomAvatarEmoji) with no endpoint to change it after the fact — on
// both platforms, not just here — so there's no "emoji picker" to build;
// mobile's own avatar tap goes straight to the image picker for the same
// reason. Matches /user/upload-profile-image's real mechanism: a base64
// data URL in a JSON body, not multipart or presigned-PUT (see
// api/student/user.ts's header comment for why neither of those fits).
export function AvatarEditor() {
  const user = useAuthStore((s) => s.user);
  const updateUser = useAuthStore((s) => s.updateUser);
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFile = (file: File) => {
    if (file.size > MAX_SIZE_BYTES) {
      toast({
        title: "Image too large",
        description: `Please choose an image smaller than 5MB (this one is ${(file.size / (1024 * 1024)).toFixed(1)}MB).`,
        variant: "destructive",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      setUploading(true);
      try {
        const res = await uploadProfileImage(dataUrl);
        if (res.error || !res.result) throw new Error(res.message || "Upload failed");
        updateUser(res.result.student);
        toast({ title: "Profile picture updated" });
      } catch (err) {
        toast({
          title: "Upload failed",
          description: err instanceof Error ? err.message : "Please try again.",
          variant: "destructive",
        });
      } finally {
        setUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const initial = user?.full_name?.trim()?.charAt(0)?.toUpperCase() || "?";

  return (
    <div className="relative">
      <div className="flex size-24 items-center justify-center overflow-hidden rounded-full bg-primary/10 text-3xl font-bold text-primary">
        {user?.profileImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={user.profileImage} alt={user.full_name} className="size-full object-cover" />
        ) : user?.avatarEmoji ? (
          <span className="text-4xl">{user.avatarEmoji}</span>
        ) : (
          initial
        )}
      </div>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="absolute -bottom-1 -right-1 flex size-8 items-center justify-center rounded-full border-2 border-background bg-primary text-primary-foreground disabled:opacity-60"
        aria-label="Change profile picture"
      >
        <Camera className="size-3.5" />
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = "";
        }}
      />
    </div>
  );
}
