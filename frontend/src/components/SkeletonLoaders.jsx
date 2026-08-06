import React from 'react'

export const SkeletonBlock = ({ className = '' }) => (
  <div className={`animate-pulse rounded-lg bg-slate-200/80 ${className}`} />
)

// Main layout wrapper skeleton to avoid layout jumps during initial load or refresh
export const RouteSkeleton = ({ children }) => (
  <div className="min-h-screen bg-slate-50 flex animate-fade-in">
    {/* Collapsed Sidebar skeleton (matches HomeSidebar width 20) */}
    <div className="hidden lg:flex w-20 flex-col items-center py-5 border-r border-slate-200 bg-slate-900 shrink-0 gap-6">
      <SkeletonBlock className="h-10 w-10 rounded-xl bg-white/20" />
      <div className="flex flex-col gap-5 mt-4">
        {[0, 1, 2, 3, 4].map((i) => (
          <SkeletonBlock key={i} className="h-9 w-9 rounded-xl bg-white/10" />
        ))}
      </div>
    </div>

    {/* Main Application Area */}
    <div className="flex-1 flex flex-col min-w-0">
      {/* Top Navbar skeleton (matches HomeNavbar height 16) */}
      <div className="h-16 border-b border-slate-200 bg-white px-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <SkeletonBlock className="h-8 w-8 rounded-lg bg-slate-200" />
          <SkeletonBlock className="h-4 w-32 bg-slate-200" />
        </div>
        <div className="flex items-center gap-3">
          <SkeletonBlock className="h-8 w-8 rounded-full bg-slate-200" />
          <SkeletonBlock className="h-8 w-8 rounded-full bg-slate-200" />
        </div>
      </div>

      {/* Render children skeleton or default to dashboard */}
      <div className="flex-1 overflow-y-auto">
        {children || <DashboardSkeleton />}
      </div>
    </div>
  </div>
)

export const DashboardSkeleton = () => (
  <div className="p-6 lg:p-8 space-y-6 max-w-7xl w-full mx-auto">
    {/* Dark Hero Banner Skeleton */}
    <div className="h-44 rounded-2xl bg-slate-900 p-6 flex flex-col justify-between shadow-md relative overflow-hidden">
      <div className="space-y-2">
        <SkeletonBlock className="h-6 w-48 bg-white/20" />
        <SkeletonBlock className="h-3.5 w-72 bg-white/10" />
      </div>
      <div className="grid grid-cols-3 gap-3">
        {[0, 1, 2].map((i) => (
          <SkeletonBlock key={i} className="h-14 rounded-xl bg-white/10" />
        ))}
      </div>
    </div>

    {/* Content Grid Skeleton */}
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-4">
        <div className="h-80 rounded-2xl bg-white border border-slate-200 p-5 shadow-sm space-y-4">
          <SkeletonBlock className="h-5 w-36 bg-slate-200" />
          <SkeletonBlock className="h-60 w-full rounded-xl bg-slate-100/50" />
        </div>
      </div>
      <div className="space-y-4">
        <div className="h-80 rounded-2xl bg-white border border-slate-200 p-5 shadow-sm space-y-4">
          <SkeletonBlock className="h-5 w-28 bg-slate-200" />
          <SkeletonBlock className="h-60 w-full rounded-xl bg-slate-100/50" />
        </div>
      </div>
    </div>
  </div>
)

export const OrdersSkeleton = () => (
  <div className="p-6 lg:p-8 space-y-6 max-w-7xl w-full mx-auto">
    {/* Dark Hero Banner Skeleton */}
    <div className="h-44 rounded-2xl bg-slate-900 p-6 flex flex-col justify-between shadow-md relative overflow-hidden">
      <div className="space-y-2">
        <SkeletonBlock className="h-6 w-36 bg-white/20" />
        <SkeletonBlock className="h-3.5 w-64 bg-white/10" />
      </div>
      <div className="grid grid-cols-3 gap-3">
        {[0, 1, 2].map((i) => (
          <SkeletonBlock key={i} className="h-14 rounded-xl bg-white/10" />
        ))}
      </div>
    </div>

    {/* Controls skeleton */}
    <div className="flex items-center gap-3">
      <SkeletonBlock className="h-10 flex-1 bg-slate-200 rounded-xl" />
      <SkeletonBlock className="h-10 w-24 bg-slate-200 rounded-xl" />
    </div>

    {/* Orders Grid/Table skeleton */}
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-3">
              <SkeletonBlock className="h-11 w-11 rounded-xl bg-slate-200" />
              <div className="space-y-2">
                <SkeletonBlock className="h-4 w-40 bg-slate-200" />
                <SkeletonBlock className="h-3 w-28 bg-slate-100" />
              </div>
            </div>
            <SkeletonBlock className="h-6 w-16 rounded-full bg-slate-200" />
          </div>
        ))}
      </div>
      <div className="space-y-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
          <SkeletonBlock className="h-5 w-24 bg-slate-200" />
          <div className="space-y-3">
            {[0, 1, 2, 3].map((i) => (
              <SkeletonBlock key={i} className="h-10 w-full bg-slate-100" />
            ))}
          </div>
        </div>
      </div>
    </div>
  </div>
)

export const AppointmentsSkeleton = () => (
  <div className="p-6 lg:p-8 space-y-6 max-w-7xl w-full mx-auto">
    {/* Dark Hero Banner Skeleton */}
    <div className="h-44 rounded-2xl bg-slate-900 p-6 flex flex-col justify-between shadow-md relative overflow-hidden">
      <div className="space-y-2">
        <SkeletonBlock className="h-6 w-44 bg-white/20" />
        <SkeletonBlock className="h-3.5 w-60 bg-white/10" />
      </div>
      <div className="grid grid-cols-4 gap-3">
        {[0, 1, 2, 3].map((i) => (
          <SkeletonBlock key={i} className="h-14 rounded-xl bg-white/10" />
        ))}
      </div>
    </div>

    {/* Calendar / Info columns */}
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
      <div className="xl:col-span-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
          <SkeletonBlock className="h-5 w-28 bg-slate-200" />
          <SkeletonBlock className="h-[400px] w-full rounded-xl bg-slate-100/50" />
        </div>
      </div>
      <div className="space-y-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
          <SkeletonBlock className="h-5 w-24 bg-slate-200" />
          <SkeletonBlock className="h-40 w-full bg-slate-100 rounded-xl" />
          <SkeletonBlock className="h-10 w-full bg-blue-100 rounded-xl" />
        </div>
      </div>
    </div>
  </div>
)

export const ProfileSkeleton = () => (
  <div className="p-6 lg:p-8 space-y-6 max-w-3xl mx-auto">
    {/* Header Profile Info card */}
    <div className="overflow-hidden rounded-2xl bg-slate-900 shadow-md">
      <div className="h-1.5 bg-blue-600" />
      <div className="px-6 py-6 sm:px-8 sm:py-7 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-4">
          <SkeletonBlock className="h-16 w-16 rounded-2xl bg-white/15" />
          <div className="space-y-3">
            <SkeletonBlock className="h-3.5 w-24 bg-white/10" />
            <SkeletonBlock className="h-6 w-48 bg-white/15" />
            <SkeletonBlock className="h-5 w-56 rounded-full bg-white/10" />
          </div>
        </div>
        <SkeletonBlock className="h-20 w-full rounded-xl bg-white/10 lg:w-44" />
      </div>
    </div>

    {/* Details grid */}
    <div className="space-y-5">
      {[0, 1].map((section) => (
        <div key={section} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
          <SkeletonBlock className="h-5 w-36 bg-slate-200" />
          <div className="grid gap-4 sm:grid-cols-2">
            {[0, 1, 2, 3].map((field) => (
              <div key={field} className="space-y-2">
                <SkeletonBlock className="h-3 w-20 bg-slate-100" />
                <SkeletonBlock className="h-10 w-full bg-slate-50" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  </div>
)

export const InvoicesSkeleton = () => (
  <div className="p-6 lg:p-8 space-y-6 max-w-7xl w-full mx-auto">
    {/* Hero banner skeleton */}
    <div className="h-44 rounded-2xl bg-slate-900 p-6 flex flex-col justify-between shadow-md relative overflow-hidden">
      <div className="space-y-2">
        <SkeletonBlock className="h-6 w-48 bg-white/20" />
        <SkeletonBlock className="h-3.5 w-64 bg-white/10" />
      </div>
      <div className="grid grid-cols-3 gap-3">
        {[0, 1, 2].map((i) => (
          <SkeletonBlock key={i} className="h-14 rounded-xl bg-white/10" />
        ))}
      </div>
    </div>

    {/* Invoices List / Preview grid */}
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      <div className="lg:col-span-2 space-y-3">
        <div className="flex justify-between items-center px-1">
          <SkeletonBlock className="h-4 w-28 bg-slate-200" />
          <SkeletonBlock className="h-5 w-14 bg-slate-200 rounded-full" />
        </div>
        {[0, 1, 2].map((i) => (
          <div key={i} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
            <div className="flex justify-between items-center">
              <SkeletonBlock className="h-3.5 w-24 bg-slate-200" />
              <SkeletonBlock className="h-5 w-12 rounded-full bg-slate-100" />
            </div>
            <SkeletonBlock className="h-4 w-40 bg-slate-200" />
            <div className="flex justify-between items-center pt-2 border-t border-slate-50">
              <SkeletonBlock className="h-3 w-16 bg-slate-100" />
              <SkeletonBlock className="h-5 w-20 bg-slate-200" />
            </div>
          </div>
        ))}
      </div>
      <div className="lg:col-span-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <SkeletonBlock className="h-5 w-32 bg-slate-200" />
              <SkeletonBlock className="h-3.5 w-48 bg-slate-100" />
            </div>
            <SkeletonBlock className="h-12 w-20 rounded-xl bg-slate-200" />
          </div>
          <div className="space-y-3 pt-6 border-t border-slate-100">
            {[0, 1, 2].map((i) => (
              <SkeletonBlock key={i} className="h-10 w-full bg-slate-50" />
            ))}
          </div>
        </div>
      </div>
    </div>
  </div>
)

// Keep legacy fallback list formats for smaller modular components
export const PageListSkeleton = ({ rows = 4 }) => (
  <div className="space-y-3">
    {Array.from({ length: rows }).map((_, index) => (
      <div key={index} className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
        <div className="flex items-start gap-3">
          <SkeletonBlock className="h-11 w-11 rounded-xl" />
          <div className="flex-1 space-y-2">
            <SkeletonBlock className="h-3.5 w-2/3" />
            <SkeletonBlock className="h-3 w-1/2 bg-slate-100" />
          </div>
          <SkeletonBlock className="h-6 w-16 rounded-full bg-slate-100" />
        </div>
      </div>
    ))}
  </div>
)

export const AppointmentListSkeleton = () => (
  <div className="space-y-3">
    {Array.from({ length: 5 }).map((_, index) => (
      <div key={index} className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 p-2.5">
        <SkeletonBlock className="h-10 w-10 rounded-xl" />
        <div className="flex-1 space-y-2">
          <SkeletonBlock className="h-3.5 w-36" />
          <SkeletonBlock className="h-2.5 w-48 bg-slate-100" />
        </div>
        <SkeletonBlock className="h-6 w-20 rounded-lg bg-slate-100" />
      </div>
    ))}
  </div>
)

export const InvoicePageSkeleton = () => <InvoicesSkeleton />
export const ProfilePageSkeleton = () => <ProfileSkeleton />
