export function RoutePlaceholder({ title }: { title: string }) {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <h1 className="text-2xl font-bold text-foreground">{title}</h1>
    </div>
  );
}
