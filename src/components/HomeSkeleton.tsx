// Skeleton mirroring the HomePage layout to avoid a blank/spinner flash
// during hydration. Uses neutral muted tokens from the design system.
export function HomeSkeleton() {
  return (
    <div className="flex-1 flex flex-col overflow-hidden" aria-hidden="true">
      {/* Header */}
      <div className="bg-background px-4 lg:px-8 pt-6 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 lg:hidden">
            <div className="w-12 h-12 rounded-xl bg-muted animate-pulse" />
            <div className="h-7 w-44 rounded-md bg-muted animate-pulse" />
          </div>
          <div className="hidden lg:block h-8 w-40 rounded-md bg-muted animate-pulse" />
          <div className="w-9 h-9 rounded-full bg-muted animate-pulse" />
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-hidden px-4 lg:px-8 pb-4">
        {/* Onboarding banner placeholder */}
        <div className="h-20 w-full rounded-2xl bg-muted/60 animate-pulse mb-4" />

        {/* Two scrollable rows */}
        {[0, 1].map((i) => (
          <section key={i} className="mb-4">
            <div className="h-5 w-48 rounded-md bg-muted animate-pulse mb-2" />
            <div className="flex gap-3 overflow-hidden">
              {Array.from({ length: 8 }).map((_, j) => (
                <div key={j} className="flex flex-col items-center gap-2 w-28 flex-shrink-0">
                  <div className="w-24 h-24 rounded-xl bg-muted animate-pulse" />
                  <div className="h-3 w-20 rounded bg-muted animate-pulse" />
                  <div className="h-2.5 w-14 rounded bg-muted/70 animate-pulse" />
                </div>
              ))}
            </div>
          </section>
        ))}

        {/* Genre grid */}
        <section className="mb-3">
          <div className="h-5 w-56 rounded-md bg-muted animate-pulse mb-2" />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
