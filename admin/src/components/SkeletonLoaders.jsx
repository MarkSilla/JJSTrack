import React from 'react'

export const SkeletonBlock = ({ className = '' }) => (
  <div className={`animate-pulse rounded-lg bg-slate-200/80 ${className}`} />
)

export const RouteSkeleton = () => (
  <div className="min-h-screen bg-[#0f172a] px-4 py-5 sm:px-8">
    <div className="mx-auto flex min-h-[calc(100vh-2.5rem)] max-w-6xl flex-col gap-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <SkeletonBlock className="h-11 w-11 rounded-2xl bg-white/15" />
          <div className="space-y-2">
            <SkeletonBlock className="h-3 w-32 bg-white/15" />
            <SkeletonBlock className="h-2.5 w-24 bg-white/10" />
          </div>
        </div>
        <SkeletonBlock className="h-9 w-28 rounded-full bg-white/10" />
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {[0, 1, 2, 3].map((item) => (
          <SkeletonBlock key={item} className="h-24 rounded-2xl bg-white/10" />
        ))}
      </div>

      <div className="grid flex-1 gap-5 lg:grid-cols-[1fr_340px]">
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
          <div className="mb-4 flex items-center justify-between">
            <SkeletonBlock className="h-4 w-40 bg-white/15" />
            <SkeletonBlock className="h-9 w-24 rounded-xl bg-white/10" />
          </div>
          <div className="space-y-3">
            {[0, 1, 2, 3, 4].map((item) => (
              <div key={item} className="flex items-center gap-3 rounded-2xl bg-white/[0.04] p-3">
                <SkeletonBlock className="h-10 w-10 rounded-xl bg-white/15" />
                <div className="flex-1 space-y-2">
                  <SkeletonBlock className="h-3 w-2/3 bg-white/15" />
                  <SkeletonBlock className="h-2.5 w-1/2 bg-white/10" />
                </div>
                <SkeletonBlock className="h-6 w-16 rounded-full bg-white/10" />
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-3">
          {[0, 1, 2].map((item) => (
            <SkeletonBlock key={item} className="h-36 rounded-3xl bg-white/10" />
          ))}
        </div>
      </div>
    </div>
  </div>
)

export const StatCardsSkeleton = ({ count = 4, className = 'grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4' }) => (
  <div className={className}>
    {Array.from({ length: count }).map((_, index) => (
      <div key={index} className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
        <div className="mb-4 flex items-center gap-3">
          <SkeletonBlock className="h-10 w-10 rounded-xl" />
          <SkeletonBlock className="h-3 w-24 bg-slate-100" />
        </div>
        <SkeletonBlock className="mb-2 h-6 w-20" />
        <SkeletonBlock className="h-2.5 w-28 bg-slate-100" />
      </div>
    ))}
  </div>
)

export const TableSkeleton = ({ rows = 6, columns = 5, className = '' }) => (
  <div className={`overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm ${className}`}>
    <div className="border-b border-slate-100 bg-slate-50 px-4 py-3">
      <SkeletonBlock className="h-4 w-40" />
    </div>
    <div className="hidden lg:block">
      <table className="w-full">
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50/70">
            {Array.from({ length: columns }).map((_, index) => (
              <th key={index} className="px-4 py-3">
                <SkeletonBlock className="h-2.5 w-20 bg-slate-100" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, row) => (
            <tr key={row} className="border-b border-slate-50">
              {Array.from({ length: columns }).map((_, column) => (
                <td key={column} className="px-4 py-4">
                  <SkeletonBlock className={`${column === 0 ? 'h-4 w-36' : 'h-3 w-24'} bg-slate-100`} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    <div className="space-y-3 p-3 lg:hidden">
      {Array.from({ length: Math.min(rows, 4) }).map((_, index) => (
        <div key={index} className="rounded-2xl border border-slate-100 p-4">
          <div className="mb-3 flex items-start gap-3">
            <SkeletonBlock className="h-10 w-10 rounded-xl" />
            <div className="flex-1 space-y-2">
              <SkeletonBlock className="h-3.5 w-2/3" />
              <SkeletonBlock className="h-3 w-1/2 bg-slate-100" />
            </div>
          </div>
          <SkeletonBlock className="h-9 w-full bg-slate-100" />
        </div>
      ))}
    </div>
  </div>
)

export const DashboardSkeleton = () => (
  <div className="font-inter min-h-screen bg-slate-50 p-3">
    <StatCardsSkeleton count={5} className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-4" />
    <StatCardsSkeleton count={5} className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-4" />
    <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
      <TableSkeleton rows={6} columns={5} />
      <div className="space-y-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <SkeletonBlock className="mb-4 h-4 w-36" />
          <div className="space-y-3">
            {[0, 1, 2].map((item) => (
              <SkeletonBlock key={item} className="h-16 w-full bg-slate-100" />
            ))}
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <SkeletonBlock className="mb-4 h-4 w-32" />
          <SkeletonBlock className="h-48 w-full bg-slate-100" />
        </div>
      </div>
    </div>
  </div>
)

export const CalendarPageSkeleton = () => (
  <div className="font-inter min-h-screen bg-slate-50 px-4 py-5 sm:px-6">
    <StatCardsSkeleton count={4} />
    <div className="grid grid-cols-1 gap-4 lg:gap-6 xl:grid-cols-3">
      <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm xl:col-span-2">
        <div className="mb-6 flex items-center justify-between">
          <SkeletonBlock className="h-5 w-40" />
          <SkeletonBlock className="h-10 w-24 rounded-full bg-slate-100" />
        </div>
        <div className="mb-3 grid grid-cols-7 gap-2">
          {Array.from({ length: 7 }).map((_, index) => (
            <SkeletonBlock key={index} className="mx-auto h-3 w-8 bg-slate-100" />
          ))}
        </div>
        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: 35 }).map((_, index) => (
            <SkeletonBlock key={index} className="aspect-square rounded-2xl bg-slate-100 sm:min-h-[90px]" />
          ))}
        </div>
      </div>
      <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
        <SkeletonBlock className="mb-5 h-5 w-44" />
        <div className="space-y-3">
          {[0, 1, 2, 3].map((item) => (
            <SkeletonBlock key={item} className="h-20 w-full bg-slate-100" />
          ))}
        </div>
      </div>
    </div>
  </div>
)

export const StaffDashboardSkeleton = () => (
  <div className="space-y-5 font-inter">
    <div className="rounded-2xl border border-slate-200 bg-white px-8 py-7 shadow-sm">
      <SkeletonBlock className="mb-3 h-7 w-48" />
      <SkeletonBlock className="h-3 w-72 bg-slate-100" />
    </div>
    <StatCardsSkeleton count={6} className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4" />
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <TableSkeleton rows={7} columns={5} className="lg:col-span-2" />
      <div className="space-y-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <SkeletonBlock className="mb-4 h-4 w-24" />
          {[0, 1, 2].map((item) => <SkeletonBlock key={item} className="mb-3 h-16 bg-slate-100" />)}
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <SkeletonBlock className="mb-4 h-4 w-36" />
          {[0, 1, 2].map((item) => <SkeletonBlock key={item} className="mb-3 h-14 bg-slate-100" />)}
        </div>
      </div>
    </div>
  </div>
)

export const ProfileSkeleton = () => (
  <section className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm">
    <div className="border-b border-slate-800 bg-[#0F172A] px-5 py-7 md:px-8">
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-4">
          <SkeletonBlock className="h-20 w-20 rounded-3xl bg-white/15" />
          <div className="space-y-3">
            <SkeletonBlock className="h-6 w-28 rounded-full bg-white/10" />
            <SkeletonBlock className="h-8 w-56 bg-white/15" />
            <SkeletonBlock className="h-3 w-72 bg-white/10" />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
          {[0, 1, 2, 3].map((item) => (
            <SkeletonBlock key={item} className="h-16 rounded-xl bg-white/10" />
          ))}
        </div>
      </div>
    </div>
    {[0, 1, 2, 3].map((section) => (
      <div key={section} className="grid gap-6 border-b border-slate-200 px-5 py-6 md:px-8 lg:grid-cols-[260px_minmax(0,1fr)]">
        <div className="space-y-3">
          <SkeletonBlock className="h-9 w-44" />
          <SkeletonBlock className="h-3 w-52 bg-slate-100" />
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {[0, 1, 2, 3].map((field) => (
            <div key={field} className="space-y-2">
              <SkeletonBlock className="h-3 w-24 bg-slate-100" />
              <SkeletonBlock className="h-10 w-full bg-slate-100" />
            </div>
          ))}
        </div>
      </div>
    ))}
  </section>
)
