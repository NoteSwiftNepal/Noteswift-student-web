import { PasswordChangeCard } from "@/components/profile/password-change-card";
import { NotificationPreferencesCard } from "@/components/profile/notification-preferences-card";

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage your account security and notification preferences.</p>
      </div>

      <PasswordChangeCard />
      <NotificationPreferencesCard />
    </div>
  );
}
