"use client";

import { Phone, School, GraduationCap, MapPin, Mail } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { useSelectedCourse } from "@/hooks/useSelectedCourse";
import { getCourseId } from "@/lib/course";
import { AvatarEditor } from "@/components/profile/avatar-editor";
import { EditFieldDialog } from "@/components/profile/edit-field-dialog";
import { EmailChangeDialog } from "@/components/profile/email-change-dialog";
import { CurrentlyLearningCard } from "@/components/profile/currently-learning-card";
import { ProfileStats } from "@/components/profile/profile-stats";
import { Card, CardContent } from "@/components/ui/card";

function InfoRow({
  icon: Icon,
  label,
  value,
  editor,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  editor?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 py-3">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-secondary text-muted-foreground">
        <Icon className="size-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="truncate text-sm font-medium text-foreground">{value}</p>
      </div>
      {editor}
    </div>
  );
}

export default function ProfilePage() {
  const user = useAuthStore((s) => s.user);
  const { selectedCourse } = useSelectedCourse();
  const courseId = selectedCourse ? getCourseId(selectedCourse) : undefined;
  const streak = user?.currentStreak ?? 0;

  const address = user?.address;
  const locationValue = address
    ? [address.municipality, address.district, address.province].filter(Boolean).join(", ") +
      (address.ward ? ` (Ward ${address.ward})` : "")
    : "Not specified";

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex flex-col items-center gap-3 py-4">
        <AvatarEditor />
        <div className="text-center">
          <h1 className="text-xl font-bold text-foreground">{user?.full_name || "Student"}</h1>
        </div>
        {/* Real stat cards (streak tier-colored flame + per-course rank),
            not a bare text line — mirrors mobile's actual ProfileHeader.tsx,
            reusing the exact same StatTile/useCourseRank pieces the
            Dashboard's stats-overview.tsx already built rather than a third
            implementation. w-full since the parent's items-center would
            otherwise shrink the 2-column grid to its content's width. */}
        <div className="w-full max-w-xs">
          <ProfileStats streak={streak} studentId={user?.id} courseId={courseId} />
        </div>
      </div>

      {/* First thing after identity — not buried near the bottom of the
          page behind cards a student has to scroll past to reach. */}
      <CurrentlyLearningCard />

      <Card>
        <CardContent className="divide-y divide-border p-4">
          <InfoRow icon={GraduationCap} label="Full Name" value={user?.full_name || "Not specified"} editor={<EditFieldDialog kind="name" />} />
          <InfoRow icon={Phone} label="Phone Number" value={user?.phone_number || "Not specified"} />
          <InfoRow icon={Mail} label="Email" value={user?.email || "Not specified"} editor={<EmailChangeDialog />} />
          <InfoRow icon={GraduationCap} label="Grade Level" value={user?.grade ? `Grade ${user.grade}` : "Not specified"} editor={<EditFieldDialog kind="grade" />} />
          <InfoRow
            icon={School}
            label="Institution / School"
            value={address?.institution || "Not specified"}
            editor={<EditFieldDialog kind="institution" />}
          />
          <InfoRow icon={MapPin} label="Address & Location" value={locationValue} editor={<EditFieldDialog kind="location" />} />
        </CardContent>
      </Card>
    </div>
  );
}
