"use client";

import { useEffect, useState } from "react";
import { toast } from "@/hooks/use-toast";
import { getNotificationPreferences, updateNotificationPreferences } from "@/api/student/user";
import type { NotificationPreferences } from "@/types/user";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

const DEFAULTS: NotificationPreferences = {
  push_notifications: true,
  email_notifications: true,
  lesson_reminders: true,
  progress_updates: true,
  course_announcements: true,
  study_streak_reminders: true,
  weekly_progress_report: false,
  new_content_alerts: true,
};

const ITEMS: { key: keyof NotificationPreferences; title: string; description: string; category: string }[] = [
  { key: "push_notifications", title: "Push Notifications", description: "Receive notifications on your device", category: "General" },
  { key: "email_notifications", title: "Email Notifications", description: "Get important updates via email", category: "General" },
  { key: "lesson_reminders", title: "Lesson Reminders", description: "Daily reminders to continue learning", category: "Learning" },
  { key: "study_streak_reminders", title: "Study Streak Alerts", description: "Maintain your learning streak", category: "Learning" },
  { key: "progress_updates", title: "Progress Updates", description: "Weekly learning progress summaries", category: "Progress" },
  { key: "weekly_progress_report", title: "Weekly Reports", description: "Detailed weekly progress reports", category: "Progress" },
  { key: "course_announcements", title: "Course Announcements", description: "Important updates about your courses", category: "Content" },
  { key: "new_content_alerts", title: "New Content Alerts", description: "Notify when new lessons are available", category: "Content" },
];

export function NotificationPreferencesCard() {
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getNotificationPreferences()
      .then((res) => {
        if (!res.error && res.result) setPreferences(res.result.preferences);
        else setPreferences(DEFAULTS);
      })
      .catch(() => setPreferences(DEFAULTS));
  }, []);

  const handleToggle = (key: keyof NotificationPreferences) => {
    setPreferences((prev) => (prev ? { ...prev, [key]: !prev[key] } : prev));
  };

  const handleSave = async () => {
    if (!preferences) return;
    setSaving(true);
    try {
      const res = await updateNotificationPreferences(preferences);
      if (res.error) throw new Error(res.message);
      toast({ title: "Preferences updated" });
    } catch (err) {
      toast({ title: "Update failed", description: err instanceof Error ? err.message : undefined, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const grouped = ITEMS.reduce<Record<string, typeof ITEMS>>((acc, item) => {
    (acc[item.category] ??= []).push(item);
    return acc;
  }, {});

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Notification Preferences</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {!preferences ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : (
          <>
            {Object.entries(grouped).map(([category, items]) => (
              <div key={category} className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{category}</p>
                <div className="divide-y divide-border rounded-lg border border-border">
                  {items.map((item) => (
                    <div key={item.key} className="flex items-center justify-between gap-3 p-3">
                      <div>
                        <p className="text-sm font-medium text-foreground">{item.title}</p>
                        <p className="text-xs text-muted-foreground">{item.description}</p>
                      </div>
                      <Switch checked={preferences[item.key]} onCheckedChange={() => handleToggle(item.key)} />
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setPreferences(Object.fromEntries(ITEMS.map((i) => [i.key, true])) as unknown as NotificationPreferences)}
              >
                Enable All
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setPreferences(Object.fromEntries(ITEMS.map((i) => [i.key, false])) as unknown as NotificationPreferences)}
              >
                Disable All
              </Button>
            </div>

            <Button className="w-full" onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : "Save Preferences"}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
