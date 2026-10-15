"use client";

import Link from "next/link";
import { useAuthStore } from "@/stores/authStore";

// Web adaptation of mobile's HomeHeader.tsx avatar (far left, opens
// More/MorePage) — the sidebar already occupies the web app's left edge, so
// this instead sits beside the notification bell in the top-right cluster
// (see app-shell.tsx and mobile-nav.tsx), and links straight to /profile
// rather than a "More" hub screen, since the web app has no equivalent
// intermediate menu for this to open.
export function UserAvatarLink() {
  const user = useAuthStore((s) => s.user);
  const initial = user?.full_name?.trim()?.charAt(0)?.toUpperCase() || "?";

  return (
    <Link
      href="/profile"
      aria-label="Your profile"
      className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/10 text-sm font-bold text-primary transition-opacity hover:opacity-80"
    >
      {user?.profileImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={user.profileImage} alt={user.full_name} className="size-full object-cover" />
      ) : (
        // No photo uploaded: the first letter of the student's name.
        // (avatarEmoji is a generated image URL on this backend, not an
        // emoji, so it isn't shown as text.)
        initial
      )}
    </Link>
  );
}
