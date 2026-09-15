"use client";

import { Phone, School, GraduationCap, MapPin, Mail } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { AvatarEditor } from "@/components/profile/avatar-editor";
import { EditFieldDialog } from "@/components/profile/edit-field-dialog";
import { EmailChangeDialog } from "@/components/profile/email-change-dialog";
import { ParentLinkCard } from "@/components/profile/parent-link-card";
import { CurrentlyLearningCard } from "@/components/profile/currently-learning-card";
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
          {typeof user?.currentStreak === "number" && (
            <p className="text-sm text-muted-foreground">{user.currentStreak} day streak</p>
          )}
        </div>
      </div>

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

      <CurrentlyLearningCard />

      <ParentLinkCard />
    </div>
  );
}
