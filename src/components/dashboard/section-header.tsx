import Link from "next/link";

export function SectionHeader({ title, href }: { title: string; href?: string }) {
  return (
    <div className="mb-4 flex items-center justify-between">
      <h2 className="text-h2 text-foreground">{title}</h2>
      {href && (
        <Link href={href} className="text-body-sm font-semibold text-primary hover:underline">
          View all
        </Link>
      )}
    </div>
  );
}
