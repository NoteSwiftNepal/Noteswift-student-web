import Link from "next/link";
import {
  MessageCircleQuestion,
  ListChecks,
  MessagesSquare,
  Sparkles,
  Users,
  Wand2,
  Lightbulb,
  HelpCircle,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const FEATURES = [
  {
    href: "/ask/doubt",
    icon: MessageCircleQuestion,
    title: "Ask a Doubt",
    description: "Post a question to your course teachers.",
  },
  {
    href: "/ask/questions",
    icon: ListChecks,
    title: "My Doubts",
    description: "Track questions you've already asked.",
  },
  {
    href: "/ask/chat",
    icon: MessagesSquare,
    title: "Teacher Chat",
    description: "Message a teacher directly.",
  },
  {
    href: "/ask/ai",
    icon: Sparkles,
    title: "AI Tutor",
    description: "Get instant help from SikAI.",
  },
  {
    href: "/ask/study-tips",
    icon: Lightbulb,
    title: "Study Tips",
    description: "Techniques for better learning.",
  },
];

const STUBS = [
  { href: "/ask/community", icon: Users, title: "Community" },
  { href: "/ask/doubt-solver", icon: HelpCircle, title: "Doubt Solver" },
  { href: "/ask/question-generator", icon: Wand2, title: "Question Generator" },
];

export default function AskPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Ask</h1>
        <p className="text-sm text-muted-foreground">
          Get help from teachers, AI, or browse your doubts.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((f) => (
          <Link key={f.href} href={f.href}>
            <Card className="h-full transition-shadow hover:shadow-md">
              <CardContent className="flex items-start gap-3 p-5">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <f.icon className="size-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{f.title}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{f.description}</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase text-muted-foreground">Coming soon</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {STUBS.map((f) => (
            <Link key={f.href} href={f.href}>
              <Card className="h-full opacity-80 transition-opacity hover:opacity-100">
                <CardContent className="flex items-center gap-3 p-4">
                  <f.icon className="size-5 text-muted-foreground" />
                  <p className="text-sm font-medium text-foreground">{f.title}</p>
                  <Badge variant="secondary" className="ml-auto text-[10px]">
                    Soon
                  </Badge>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
