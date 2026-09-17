import { DownloadsList } from "@/components/learn/downloads-list";

// Standalone entry point (linked from the sidebar's More menu) for the same
// content the "Saved" tab on /learn renders — see downloads-list.tsx for
// the shared component itself.
export default function DownloadsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-h1 text-foreground">Downloads</h1>
        <p className="text-body text-muted-foreground">Files you&apos;ve downloaded for offline reference.</p>
      </div>

      <DownloadsList />
    </div>
  );
}
