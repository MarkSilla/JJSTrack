import React from 'react'

export const SkeletonBlock = ({ className = '' }) => (
  <div className={`animate-pulse rounded-lg bg-slate-200/80 ${className}`} />
)

export const RouteSkeleton = () => (
  <div className="min-h-screen bg-[#0f172a] px-4 py-5 sm:px-8">
    <div className="mx-auto flex h-full min-h-[calc(100vh-2.5rem)] max-w-6xl flex-col gap-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <SkeletonBlock className="h-11 w-11 rounded-2xl bg-white/15" />
          <div className="space-y-2">
            <SkeletonBlock className="h-3 w-28 bg-white/15" />
            <SkeletonBlock className="h-2.5 w-20 bg-white/10" />
          </div>
        </div>
        <SkeletonBlock className="h-9 w-24 rounded-full bg-white/10" />
      </div>

      <div className="grid flex-1 items-center gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-4">
          <SkeletonBlock className="h-4 w-24 bg-blue-300/25" />
          <SkeletonBlock className="h-10 w-4/5 max-w-xl bg-white/15" />
          <SkeletonBlock className="h-10 w-3/5 max-w-md bg-white/10" />
          <div className="grid max-w-lg grid-cols-3 gap-3 pt-3">
            {[0, 1, 2].map((item) => (
              <SkeletonBlock key={item} className="h-20 rounded-2xl bg-white/10" />
            ))}
          </div>
        </div>
        <div className="space-y-3 rounded-3xl border border-white/10 bg-white/[0.04] p-4">
          {[0, 1, 2, 3].map((item) => (
            <div key={item} className="flex items-center gap-3 rounded-2xl bg-white/[0.04] p-3">
              <SkeletonBlock className="h-10 w-10 rounded-xl bg-white/15" />
              <div className="flex-1 space-y-2">
                <SkeletonBlock className="h-3 w-2/3 bg-white/15" />
                <SkeletonBlock className="h-2.5 w-1/2 bg-white/10" />
              </div>
              <SkeletonBlock className="h-6 w-14 rounded-full bg-white/10" />
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
)

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

export const InvoicePageSkeleton = () => (
  <div className="font-inter">
    <div className="mb-8 rounded-2xl bg-[#0F172A] p-6 shadow-xl">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-3">
          <SkeletonBlock className="h-8 w-44 bg-white/15" />
          <SkeletonBlock className="h-3 w-64 bg-white/10" />
        </div>
        <div className="grid w-full grid-cols-3 gap-3 lg:w-auto">
          {[0, 1, 2].map((item) => (
            <SkeletonBlock key={item} className="h-20 rounded-xl bg-white/10" />
          ))}
        </div>
      </div>
    </div>

    <div className="grid gap-5 lg:grid-cols-[320px_minmax(0,1fr)]">
      <div className="space-y-3">
        {[0, 1, 2, 3].map((item) => (
          <div key={item} className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-2">
                <SkeletonBlock className="h-3.5 w-36" />
                <SkeletonBlock className="h-3 w-24 bg-slate-100" />
              </div>
              <SkeletonBlock className="h-6 w-16 rounded-full bg-slate-100" />
            </div>
          </div>
        ))}
      </div>
      <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
        <div className="mb-8 flex items-start justify-between">
          <div className="space-y-3">
            <SkeletonBlock className="h-8 w-36" />
            <SkeletonBlock className="h-3 w-48 bg-slate-100" />
          </div>
          <SkeletonBlock className="h-16 w-24 rounded-xl bg-slate-100" />
        </div>
        <div className="space-y-3">
          {[0, 1, 2, 3, 4].map((item) => (
            <SkeletonBlock key={item} className="h-11 w-full bg-slate-100" />
          ))}
        </div>
      </div>
    </div>
  </div>
)

export const ProfilePageSkeleton = () => (
  <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-slate-50 via-white to-blue-50/30 px-4 py-6 sm:px-6 lg:px-8">
    <div className="mx-auto max-w-3xl space-y-5">
      <div className="overflow-hidden rounded-2xl bg-slate-900 shadow-xl">
        <div className="h-1 bg-blue-500" />
        <div className="px-6 py-6 sm:px-8 sm:py-7">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <SkeletonBlock className="h-16 w-16 rounded-2xl bg-white/15" />
              <div className="space-y-3">
                <SkeletonBlock className="h-3 w-24 bg-white/10" />
                <SkeletonBlock className="h-7 w-56 bg-white/15" />
                <SkeletonBlock className="h-6 w-64 rounded-full bg-white/10" />
              </div>
            </div>
            <SkeletonBlock className="h-24 w-full rounded-xl bg-white/10 lg:w-60" />
          </div>
        </div>
      </div>

      {[0, 1, 2, 3].map((section) => (
        <div key={section} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <SkeletonBlock className="mb-5 h-4 w-40" />
          <div className="grid gap-4 sm:grid-cols-2">
            {[0, 1, 2, 3].map((field) => (
              <div key={field} className="space-y-2">
                <SkeletonBlock className="h-3 w-24 bg-slate-100" />
                <SkeletonBlock className="h-10 w-full bg-slate-100" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  </div>
)
