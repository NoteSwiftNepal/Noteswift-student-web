"use client"

import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"

import { cn } from "@/lib/utils"

const Tabs = TabsPrimitive.Root

// docs/DESIGN-STANDARDS.md §6.8 — desktop (≥lg): a fixed, fully-visible row
// with a 2px sliding underline indicator in --primary; below lg: mobile's
// own horizontally-scrollable pill row (the one place that compromise is
// still correct, since narrow width is real on mobile web too). The
// indicator's left/width is measured off the actually-active trigger's real
// DOM rect — not guessed from index × an assumed width — so it works for
// any tab label length or count.
const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, children, ...props }, ref) => {
  const listRef = React.useRef<HTMLDivElement | null>(null)
  const [indicator, setIndicator] = React.useState<{ left: number; width: number } | null>(null)

  const measure = React.useCallback(() => {
    const list = listRef.current
    if (!list) return
    const active = list.querySelector<HTMLElement>('[role="tab"][data-state="active"]')
    if (!active) return
    setIndicator({ left: active.offsetLeft, width: active.offsetWidth })
  }, [])

  React.useEffect(() => {
    measure()
    const list = listRef.current
    if (!list) return
    const resizeObserver = new ResizeObserver(measure)
    resizeObserver.observe(list)
    // Radix flips each trigger's own data-state on click outside of this
    // component's render cycle, so the indicator has to watch for that
    // directly rather than only re-measuring on this component's own
    // re-renders.
    const mutationObserver = new MutationObserver(measure)
    mutationObserver.observe(list, { attributes: true, attributeFilter: ["data-state"], subtree: true })
    return () => {
      resizeObserver.disconnect()
      mutationObserver.disconnect()
    }
  }, [measure])

  return (
    <TabsPrimitive.List
      ref={(node) => {
        listRef.current = node
        if (typeof ref === "function") ref(node)
        else if (ref) ref.current = node
      }}
      className={cn(
        "relative flex items-center gap-2 overflow-x-auto scrollbar-hide lg:gap-1 lg:overflow-visible lg:border-b lg:border-border",
        className
      )}
      {...props}
    >
      {children}
      {indicator && (
        <span
          aria-hidden
          className="absolute bottom-0 hidden h-0.5 rounded-full bg-primary transition-[left,width] duration-fast ease-standard lg:block"
          style={{ left: indicator.left, width: indicator.width }}
        />
      )}
    </TabsPrimitive.List>
  )
})
TabsList.displayName = TabsPrimitive.List.displayName

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      // Mobile (<lg): the existing segmented-pill look. Desktop (≥lg): a
      // flat underline row — the sliding <span> in TabsList supplies the
      // indicator, so the trigger itself only needs a color change.
      "inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-full border border-border bg-card px-4 py-2 text-body-sm font-semibold text-muted-foreground ring-offset-background transition-colors duration-fast ease-standard focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:border-primary data-[state=active]:bg-primary data-[state=active]:text-primary-foreground lg:rounded-none lg:border-0 lg:bg-transparent lg:px-3 lg:py-2.5 lg:data-[state=active]:bg-transparent lg:data-[state=active]:text-primary",
      className
    )}
    {...props}
  />
))
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "mt-4 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      className
    )}
    {...props}
  />
))
TabsContent.displayName = TabsPrimitive.Content.displayName

export { Tabs, TabsList, TabsTrigger, TabsContent }
