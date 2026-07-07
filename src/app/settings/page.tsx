"use client";

import { useState, useEffect } from "react";
import { 
  User, 
  Mail, 
  BookOpen, 
  Key, 
  Copy, 
  Check, 
  Settings, 
  Sparkles,
  Save,
  LogOut,
  Hash,
  HelpCircle,
  Bug,
  Info,
  Bell,
  Lock,
  MapPin,
  School,
  ArrowRight,
  ShieldCheck,
  RefreshCw
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { DashboardGuard } from "@/components/auth-guard";
import { StudentLayout } from "@/components/student-layout";
import { useStudentAuth } from "@/context/student-auth-context";
import { api } from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import Link from "next/link";

const provinces = [
  { label: "Koshi Province", value: "koshi" },
  { label: "Madhesh Province", value: "madhesh" },
  { label: "Bagmati Province", value: "bagmati" },
  { label: "Gandaki Province", value: "gandaki" },
  { label: "Lumbini Province", value: "lumbini" },
  { label: "Karnali Province", value: "karnali" },
  { label: "Sudurpashchim Province", value: "sudurpashchim" }
];

const districtsMap: { [key: string]: { label: string; value: string }[] } = {
  koshi: [
    { label: "Jhapa", value: "jhapa" },
    { label: "Morang", value: "morang" },
    { label: "Sunsari", value: "sunsari" },
    { label: "Dhankuta", value: "dhankuta" },
    { label: "Ilam", value: "ilam" }
  ],
  madhesh: [
    { label: "Dhanusha", value: "dhanusha" },
    { label: "Saptari", value: "saptari" },
    { label: "Siraha", value: "siraha" },
    { label: "Parsa", value: "parsa" },
    { label: "Bara", value: "bara" }
  ],
  bagmati: [
    { label: "Kathmandu", value: "kathmandu" },
    { label: "Lalitpur", value: "lalitpur" },
    { label: "Bhaktapur", value: "bhaktapur" },
    { label: "Chitwan", value: "chitwan" },
    { label: "Makwanpur", value: "makwanpur" }
  ],
  gandaki: [
    { label: "Kaski", value: "kaski" },
    { label: "Lamjung", value: "lamjung" },
    { label: "Gorkha", value: "gorkha" },
    { label: "Syangja", value: "syangja" },
    { label: "Tanahun", value: "tanahun" }
  ],
  lumbini: [
    { label: "Rupandehi", value: "rupandehi" },
    { label: "Dang", value: "dang" },
    { label: "Banke", value: "banke" },
    { label: "Bardiya", value: "bardiya" },
    { label: "Palpa", value: "palpa" }
  ],
  karnali: [
    { label: "Surkhet", value: "surkhet" },
    { label: "Dailekh", value: "dailekh" },
    { label: "Salyan", value: "salyan" },
    { label: "Jumla", value: "jumla" },
    { label: "Mugu", value: "mugu" }
  ],
  sudurpashchim: [
    { label: "Kailali", value: "kailali" },
    { label: "Kanchanpur", value: "kanchanpur" },
    { label: "Doti", value: "doti" },
    { label: "Achham", value: "achham" },
    { label: "Baitadi", value: "baitadi" }
  ]
};

const getAvatarGradient = (theme: string) => {
  switch (theme) {
    case "purple": return "from-purple-500 to-indigo-700 text-white";
    case "emerald": return "from-emerald-500 to-teal-700 text-white";
    case "rose": return "from-rose-500 to-pink-600 text-white";
    case "amber": return "from-amber-500 to-orange-600 text-white";
    case "cyan": return "from-cyan-500 to-blue-600 text-white";
    default: return "from-blue-500 to-indigo-600 text-white";
  }
};

const getInitials = (name: string) => {
  if (!name) return "NS";
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

function SettingsContent() {
  const { student, logout, updateProfile } = useStudentAuth();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState<"profile" | "notifications" | "security">("profile");

  // Profile fields (aligned with backend update schema)
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [grade, setGrade] = useState("10");
  const [institution, setInstitution] = useState("");
  const [province, setProvince] = useState("");
  const [district, setDistrict] = useState("");
  const [avatar, setAvatar] = useState("🎒");
  const [customAvatarUrl, setCustomAvatarUrl] = useState<string | null>(null);

  // Security fields
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Notification Preferences (matching backend controller preferences schema)
  const [prefs, setPrefs] = useState({
    push_notifications: true,
    email_notifications: true,
    lesson_reminders: true,
    progress_updates: true,
    course_announcements: true,
    study_streak_reminders: true,
    weekly_progress_report: false,
    new_content_alerts: true,
  });

  // Parent link code generators
  const [linkingCode, setLinkingCode] = useState("");
  const [codeExpiresAt, setCodeExpiresAt] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes in seconds
  const [isCopied, setIsCopied] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingCode, setIsGeneratingCode] = useState(false);

  useEffect(() => {
    if (student) {
      setFullName(student.fullName);
      setEmail(student.email || "");
      setGrade(student.grade ? student.grade.replace(/[^0-9]/g, "") : "10");
      setInstitution(student.schoolName || student.address?.institution || "");
      setProvince(student.address?.province || "");
      setDistrict(student.address?.district || "");
      
      const localTheme = localStorage.getItem(`student_avatar_theme_${student.id}`);
      setAvatar(localTheme || student.avatar || "blue");
      setLinkingCode(student.linkingCode || "");
      
      if (student.profileImage) {
        setCustomAvatarUrl(student.profileImage);
      }
    }
  }, [student]);

  // Countdown timer for generated parent code
  useEffect(() => {
    if (!codeExpiresAt) return;
    
    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.floor((new Date(codeExpiresAt).getTime() - Date.now()) / 1000));
      setTimeLeft(remaining);
      if (remaining === 0) {
        setLinkingCode("");
        setCodeExpiresAt(null);
        toast({
          title: "Code Expired",
          description: "Please generate a new temporary parent link code.",
        });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [codeExpiresAt]);

  if (!student) return null;

  const handleGenerateLinkCode = async () => {
    setIsGeneratingCode(true);
    const res = await api.generateParentLinkCode();
    setIsGeneratingCode(false);

    if (res.success && res.code) {
      setLinkingCode(res.code);
      if (res.expiresAt) {
        setCodeExpiresAt(res.expiresAt);
        const remaining = Math.max(0, Math.floor((new Date(res.expiresAt).getTime() - Date.now()) / 1000));
        setTimeLeft(remaining);
      } else {
        setCodeExpiresAt(new Date(Date.now() + 10 * 60 * 1000).toISOString());
        setTimeLeft(600);
      }
      toast({
        title: "Temporary Code Generated",
        description: "Code expires in 10 minutes.",
      });
    } else {
      toast({
        title: "Generation Failed",
        description: res.message || "Failed to generate parent connection code.",
        variant: "destructive"
      });
    }
  };

  const handleCopyCode = () => {
    if (!linkingCode) return;
    navigator.clipboard.writeText(linkingCode);
    setIsCopied(true);
    toast({
      title: "Code Copied",
      description: "Temporary linking code copied to clipboard.",
    });
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Profile picture should be smaller than 5MB.",
        variant: "destructive"
      });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setCustomAvatarUrl(reader.result as string);
      toast({
        title: "Avatar Loaded",
        description: "Click Save Settings to apply your new profile photo.",
      });
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    try {
      let currentAvatarUrl = customAvatarUrl;

      // 1. If there's a new base64 image, upload it first
      if (customAvatarUrl && customAvatarUrl.startsWith("data:image/")) {
        const uploadRes = await api.uploadProfileImage(customAvatarUrl);
        if (uploadRes.success && uploadRes.data?.imageUrl) {
          currentAvatarUrl = uploadRes.data.imageUrl;
          setCustomAvatarUrl(uploadRes.data.imageUrl);
        } else {
          toast({
            title: "Avatar Upload Failed",
            description: uploadRes.message || "Could not upload profile picture.",
            variant: "destructive",
          });
          setIsSaving(false);
          return;
        }
      }

      // 2. Save the rest of the profile data using the context's updateProfile method
      const res = await updateProfile({
        fullName,
        email,
        grade: `Grade ${grade}`,
        schoolName: institution,
        address: {
          province,
          district,
          institution
        },
        avatar: currentAvatarUrl || avatar
      });

      if (res.success) {
        // Save local theme preference if no custom avatar uploaded
        if (avatar && (!currentAvatarUrl || !currentAvatarUrl.startsWith("http"))) {
          localStorage.setItem(`student_avatar_theme_${student.id}`, avatar);
        }
        toast({
          title: "Profile Updated",
          description: "Your student profile has been synced with database.",
        });
      } else {
        toast({
          title: "Update Failed",
          description: "Failed to update profile info.",
          variant: "destructive",
        });
      }
    } catch (err: any) {
      toast({
        title: "Error occurred",
        description: err.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveSecurity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      toast({ title: "Verification Required", description: "Please enter your current password.", variant: "destructive" });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: "Mismatch Error", description: "Passwords do not match.", variant: "destructive" });
      return;
    }
    
    setIsSaving(true);
    const res = await api.changePasswordWithCurrent(currentPassword, newPassword);
    setIsSaving(false);
    
    if (res.success) {
      toast({
        title: "Password Changed",
        description: "Your security credentials have been updated.",
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } else {
      toast({
        title: "Change Failed",
        description: res.message || "Failed to change password.",
        variant: "destructive"
      });
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex flex-col gap-6 max-w-2xl mx-auto">
      {/* Tabs list selector */}
      <div className="flex bg-gray-150 p-1.5 rounded-2xl border border-gray-250 gap-1 sm:gap-2">
        <button
          onClick={() => setActiveTab("profile")}
          className={cn(
            "flex-1 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer",
            activeTab === "profile" ? "bg-white text-gray-800 shadow-sm" : "text-gray-500 hover:text-gray-800"
          )}
        >
          <User className="h-4 w-4" />
          Profile Info
        </button>
        <button
          onClick={() => setActiveTab("notifications")}
          className={cn(
            "flex-1 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer",
            activeTab === "notifications" ? "bg-white text-gray-800 shadow-sm" : "text-gray-500 hover:text-gray-800"
          )}
        >
          <Bell className="h-4 w-4" />
          Alert Settings
        </button>
        <button
          onClick={() => setActiveTab("security")}
          className={cn(
            "flex-1 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer",
            activeTab === "security" ? "bg-white text-gray-800 shadow-sm" : "text-gray-500 hover:text-gray-800"
          )}
        >
          <Lock className="h-4 w-4" />
          Security Options
        </button>
      </div>

      {/* Tab Content Panels */}
      {activeTab === "profile" && (
        <Card className="border border-gray-300 shadow-sm bg-white rounded-2xl overflow-hidden">
          <CardHeader className="border-b border-gray-200 bg-gray-50/50 p-5">
            <CardTitle className="text-base sm:text-lg font-extrabold text-gray-800 flex items-center gap-2">
              <Settings className="h-5 w-5 text-indigo-500" />
              Student Profile Form
            </CardTitle>
            <CardDescription className="text-xs text-gray-500 font-semibold">
              Update academic levels, provinces, districts, and upload custom images.
            </CardDescription>
          </CardHeader>

          <CardContent className="p-6">
            <form onSubmit={handleSaveProfile} className="space-y-4">
              
              {/* Avatar section */}
              <div className="flex flex-col items-center gap-2 pb-4">
                <div className="relative group cursor-pointer">
                  {customAvatarUrl ? (
                    <img 
                      src={customAvatarUrl} 
                      alt="Avatar Preview" 
                      className="h-20 w-20 object-cover border-2 border-indigo-200 rounded-full shadow-sm hover:scale-105 transition-all"
                    />
                  ) : (
                    <div className={cn(
                      "h-20 w-20 bg-gradient-to-tr rounded-full flex items-center justify-center font-bold text-xl tracking-wide shadow-sm hover:scale-105 transition-all",
                      getAvatarGradient(avatar)
                    )}>
                      {getInitials(fullName)}
                    </div>
                  )}
                  
                  <div className="absolute -bottom-1 -right-1 bg-white border border-gray-300 rounded-full p-1.5 shadow-sm text-xs">
                    📷
                  </div>
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                </div>
                
                <span className="text-[10px] text-gray-400 font-bold">
                  Tap to upload custom photo or pick background theme:
                </span>
                
                {/* Gradient selection row */}
                <div className="flex gap-2">
                  {["blue", "purple", "emerald", "rose", "amber", "cyan"].map((theme) => (
                    <button
                      key={theme}
                      type="button"
                      onClick={() => {
                        setAvatar(theme);
                        setCustomAvatarUrl(null);
                      }}
                      className={cn(
                        "h-7 w-7 rounded-full bg-gradient-to-tr border transition-all cursor-pointer",
                        theme === "blue" && "from-blue-500 to-indigo-600",
                        theme === "purple" && "from-purple-500 to-indigo-700",
                        theme === "emerald" && "from-emerald-500 to-teal-700",
                        theme === "rose" && "from-rose-500 to-pink-600",
                        theme === "amber" && "from-amber-500 to-orange-600",
                        theme === "cyan" && "from-cyan-500 to-blue-600",
                        avatar === theme && !customAvatarUrl ? "ring-2 ring-indigo-500 ring-offset-2 scale-110 border-transparent" : "border-gray-300"
                      )}
                    />
                  ))}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="fullName" className="text-xs font-bold text-gray-655">Full Name *</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="fullName"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                      placeholder="Your full name"
                      className="h-11 pl-9 border-gray-250 rounded-xl text-xs sm:text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-xs font-bold text-gray-655">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. name@example.com"
                      className="h-11 pl-9 border-gray-250 rounded-xl text-xs sm:text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-gray-655">Grade Level *</Label>
                  <select
                    value={grade}
                    onChange={(e) => setGrade(e.target.value)}
                    className="w-full h-11 border border-gray-250 rounded-xl px-3 bg-white text-xs sm:text-sm text-gray-700"
                  >
                    {Array.from({ length: 12 }, (_, i) => (
                      <option key={i + 1} value={i + 1}>
                        Grade {i + 1}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="institution" className="text-xs font-bold text-gray-655">Institution / School Name</Label>
                  <div className="relative">
                    <School className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="institution"
                      value={institution}
                      onChange={(e) => setInstitution(e.target.value)}
                      placeholder="School name"
                      className="h-11 pl-9 border-gray-250 rounded-xl text-xs sm:text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-gray-655">Province Location</Label>
                  <select
                    value={province}
                    onChange={(e) => {
                      setProvince(e.target.value);
                      setDistrict("");
                    }}
                    className="w-full h-11 border border-gray-250 rounded-xl px-3 bg-white text-xs sm:text-sm text-gray-700"
                  >
                    <option value="">Select Province</option>
                    {provinces.map((prov) => (
                      <option key={prov.value} value={prov.value}>
                        {prov.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-gray-655">District</Label>
                  <select
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    disabled={!province}
                    className="w-full h-11 border border-gray-250 rounded-xl px-3 bg-white text-xs sm:text-sm text-gray-700 disabled:bg-gray-50"
                  >
                    <option value="">Select District</option>
                    {province && districtsMap[province]?.map((dist) => (
                      <option key={dist.value} value={dist.value}>
                        {dist.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="border-t border-gray-150 pt-4 flex gap-3 justify-end">
                <Button 
                  type="submit" 
                  disabled={isSaving}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl h-11 px-5 border border-blue-700 flex items-center gap-1.5"
                >
                  <Save className="h-4 w-4" />
                  <span>{isSaving ? "Saving..." : "Save Settings"}</span>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {activeTab === "notifications" && (
        <Card className="border border-gray-300 shadow-sm bg-white rounded-2xl p-5 space-y-4">
          <div>
            <h4 className="text-sm font-extrabold text-gray-800 flex items-center gap-1.5">
              <Bell className="h-5 w-5 text-indigo-500" />
              Notification Preferences
            </h4>
            <span className="text-[10px] text-gray-400 font-bold mt-1 block">
              Manage how and when you receive study alerts.
            </span>
          </div>

          <div className="space-y-3.5 pt-2">
            {[
              { key: "push_notifications", label: "Push Notifications", desc: "Send visual popups directly inside browser window." },
              { key: "email_notifications", label: "Email Alerts", desc: "Receive backup logs or notes alerts via email." },
              { key: "lesson_reminders", label: "Lesson Reminders", desc: "Prompt when weekly batch streams are commencing." },
              { key: "progress_updates", label: "Syllabus Progress Tracker", desc: "Ping on chapters milestone checklists completion." },
              { key: "course_announcements", label: "Course Announcements", desc: "Get notifications when homework or files are posted." },
              { key: "study_streak_reminders", label: "Study Streak Boosters", desc: "Warm indicators to sustain your daily streak status." }
            ].map((pref) => (
              <label 
                key={pref.key} 
                className="flex items-start gap-3 p-3 bg-gray-50/50 hover:bg-gray-50 border border-gray-200 rounded-xl cursor-pointer transition-colors"
              >
                <input 
                  type="checkbox"
                  checked={(prefs as any)[pref.key]}
                  onChange={(e) => setPrefs({ ...prefs, [pref.key]: e.target.checked })}
                  className="mt-1 h-4 w-4 accent-indigo-650 rounded border-gray-300"
                />
                <div>
                  <span className="text-xs font-bold text-gray-800 block">{pref.label}</span>
                  <span className="text-[10px] text-gray-450 font-medium block mt-0.5 leading-snug">{pref.desc}</span>
                </div>
              </label>
            ))}
          </div>

          <div className="border-t border-gray-150 pt-4 flex justify-end">
            <Button
              onClick={async () => {
                const res = await api.updateNotificationPreferences(prefs);
                if (res.success) {
                  toast({
                    title: "Preferences Saved",
                    description: "Your notification settings have been updated.",
                  });
                } else {
                  toast({
                    title: "Update Failed",
                    description: res.message || "Failed to update notification preferences.",
                    variant: "destructive"
                  });
                }
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl h-10 text-xs px-4"
            >
              Update Preferences
            </Button>
          </div>
        </Card>
      )}

      {activeTab === "security" && (
        <Card className="border border-gray-300 shadow-sm bg-white rounded-2xl p-5 space-y-4">
          <div>
            <h4 className="text-sm font-extrabold text-gray-800 flex items-center gap-1.5">
              <Lock className="h-5 w-5 text-indigo-500" />
              Credentials Management
            </h4>
            <span className="text-[10px] text-gray-400 font-bold mt-1 block">
              Change login security passwords.
            </span>
          </div>

          <form onSubmit={handleSaveSecurity} className="space-y-3.5 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-gray-655">Current Password</Label>
              <Input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                className="h-11 border-gray-250 rounded-xl text-xs sm:text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-gray-655">New Password</Label>
              <Input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="h-11 border-gray-250 rounded-xl text-xs sm:text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-gray-655">Confirm New Password</Label>
              <Input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="h-11 border-gray-250 rounded-xl text-xs sm:text-sm"
              />
            </div>

            <div className="border-t border-gray-150 pt-4 flex justify-end">
              <Button
                type="submit"
                disabled={isSaving}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl h-10 text-xs px-4"
              >
                Change Password
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Parent Linking Card */}
      <Card className="border border-gray-300 shadow-sm bg-white rounded-2xl p-5 space-y-4">
        <div className="flex gap-3 items-center">
          <div className="p-2.5 bg-indigo-50 text-indigo-700 rounded-xl border border-indigo-150">
            <Key className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-sm font-extrabold text-gray-800 leading-none">Link Parent Account</h4>
            <span className="text-[10px] text-gray-400 font-bold mt-1 block">Connect profiles for home updates.</span>
          </div>
        </div>

        <p className="text-xs text-gray-500 font-semibold leading-relaxed">
          Generate a secure, temporary connection code for your parents. They can input this code in their <span className="font-extrabold text-gray-700">NoteSwift Parent Portal</span> to verify your syllabus progress, mock test attempts, and payments.
        </p>

        {student.parentLinked && (
          <div className="flex items-center gap-3 p-3.5 bg-green-50 border border-green-200 rounded-xl">
            <ShieldCheck className="h-5 w-5 text-green-600 shrink-0" />
            <div>
              <span className="text-xs font-bold text-green-950 block">Linked Parent Account Connected</span>
              <span className="text-[10px] text-green-700 font-semibold block mt-0.5">
                {student.parentName ? `Linked with: ${student.parentName}` : "Your profile is linked to a parent account."}
              </span>
            </div>
          </div>
        )}

        {linkingCode ? (
          <div className="space-y-2">
            <div className="flex items-center gap-3 bg-gray-50 border border-indigo-150 p-3.5 rounded-2xl">
              <span className="font-mono font-extrabold text-sm sm:text-base tracking-wider text-indigo-650 flex-1 uppercase">
                {linkingCode}
              </span>
              <Button 
                onClick={handleCopyCode} 
                size="sm" 
                variant="outline" 
                className="border-gray-300 rounded-xl font-bold h-9 text-xs px-3 hover:bg-gray-100 flex items-center gap-1 shrink-0 bg-white"
              >
                {isCopied ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{isCopied ? "Copied" : "Copy"}</span>
              </Button>
            </div>
            
            <div className="flex justify-between items-center px-1 text-[10px] font-bold text-gray-450">
              <span className="flex items-center gap-1">
                <RefreshCw className="h-3.5 w-3.5 animate-spin text-indigo-500" />
                Code expires in: {formatTime(timeLeft)}
              </span>
              <button 
                onClick={handleGenerateLinkCode}
                className="text-indigo-650 hover:underline"
              >
                Regenerate Code
              </button>
            </div>
          </div>
        ) : (
          <Button
            onClick={handleGenerateLinkCode}
            disabled={isGeneratingCode}
            className="w-full bg-indigo-550 hover:bg-indigo-600 text-white font-bold h-11 text-xs rounded-xl flex items-center justify-center gap-1.5 border border-indigo-600 cursor-pointer bg-indigo-600 hover:bg-indigo-700"
          >
            <ShieldCheck className="h-4 w-4" />
            {isGeneratingCode ? "Generating Secure Link..." : "Generate Temporary Link Code"}
          </Button>
        )}
      </Card>

      {/* Support & Resources Card */}
      <Card className="border border-gray-300 shadow-sm bg-white rounded-2xl p-5 space-y-4">
        <div className="flex gap-3 items-center">
          <div className="p-2.5 bg-blue-50 text-blue-700 rounded-xl border border-blue-150">
            <HelpCircle className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-sm font-extrabold text-gray-800 leading-none">Support & Resources</h4>
            <span className="text-[10px] text-gray-400 font-bold mt-1 block">Help centers, technical assistance, and system info.</span>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <Link 
            href="/support"
            className="flex flex-col p-3 border border-gray-200 rounded-xl hover:bg-gray-50/50 transition-colors text-center items-center gap-1.5"
          >
            <HelpCircle className="h-5 w-5 text-indigo-500" />
            <span className="text-xs font-bold text-gray-700">Help Center</span>
          </Link>
          <Link 
            href="/report-issue"
            className="flex flex-col p-3 border border-gray-200 rounded-xl hover:bg-gray-50/50 transition-colors text-center items-center gap-1.5"
          >
            <Bug className="h-5 w-5 text-red-500" />
            <span className="text-xs font-bold text-gray-700">Report Issue</span>
          </Link>
          <Link 
            href="/about"
            className="flex flex-col p-3 border border-gray-200 rounded-xl hover:bg-gray-50/50 transition-colors text-center items-center gap-1.5"
          >
            <Info className="h-5 w-5 text-blue-500" />
            <span className="text-xs font-bold text-gray-700">About App</span>
          </Link>
        </div>
      </Card>

      {/* Logout Card */}
      <Card className="border border-red-200 shadow-sm bg-red-50/10 rounded-2xl p-5 flex items-center justify-between gap-4">
        <div className="space-y-0.5">
          <h4 className="text-xs sm:text-sm font-bold text-gray-800">Sign Out of Session</h4>
          <p className="text-[10px] text-gray-500 font-semibold">Sign out of the NoteSwift student dashboard on this device.</p>
        </div>
        <Button 
          onClick={() => {
            logout();
            toast({
              title: "Signed Out",
              description: "You have signed out of NoteSwift.",
            });
          }}
          variant="destructive" 
          className="rounded-xl h-10 font-bold text-xs bg-red-600 border border-red-700 hover:bg-red-700 flex items-center gap-1.5 cursor-pointer"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </Button>
      </Card>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <DashboardGuard>
      <StudentLayout>
        <SettingsContent />
      </StudentLayout>
    </DashboardGuard>
  );
}
