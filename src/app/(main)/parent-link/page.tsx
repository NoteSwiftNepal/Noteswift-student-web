import { ParentLinkCard } from "@/components/profile/parent-link-card";

// Its own top-level route now, reached directly from the sidebar's More
// section — previously a card bolted onto the bottom of /profile. Reuses
// ParentLinkCard as-is (docs/DESIGN-STANDARDS.md §12 fix-pass). A direct
// sidebar destination, so no back button (§6.9 — sidebar nav is itself the
// "back" mechanism, matching every other top-level destination).
export default function ParentLinkPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Parent Link</h1>
        <p className="text-sm text-muted-foreground">Connect a parent account to your profile.</p>
      </div>

      <ParentLinkCard />
    </div>
  );
}
