import React from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { TableSkeleton } from '../SkeletonLoaders'
import EmptyState from './EmptyState'

export function Pagination({
  currentPage = 1,
  totalPages = 1,
  pageSize = 10,
  totalItems = 0,
  onPageChange,
  onPageSizeChange,
  className = '',
}) {
  if (totalPages <= 1 && totalItems <= pageSize) return null

  const startItem = (currentPage - 1) * pageSize + 1
  const endItem = Math.min(currentPage * pageSize, totalItems)

  return (
    <div className={`flex flex-col sm:flex-row items-center justify-between gap-3 p-3 bg-white border-t border-slate-100 ${className}`}>
      <div className="text-xs text-slate-500 font-medium">
        Showing <span className="font-bold text-slate-800">{startItem}</span> to{' '}
        <span className="font-bold text-slate-800">{endItem}</span> of{' '}
        <span className="font-bold text-slate-800">{totalItems}</span> results
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onPageChange && onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed transition-saas cursor-pointer"
        >
          <ChevronLeft size={16} />
        </button>

        <span className="text-xs font-bold text-slate-700 px-2">
          Page {currentPage} of {totalPages}
        </span>

        <button
          type="button"
          onClick={() => onPageChange && onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed transition-saas cursor-pointer"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  )
}

export function TableWrapper({
  columns = [],
  data = [],
  loading = false,
  emptyProps,
  onRowClick,
  pagination,
  className = '',
}) {
  if (loading) return <TableSkeleton rows={5} columns={columns.length || 4} />

  if (!data || data.length === 0) {
    return <EmptyState {...emptyProps} />
  }

  return (
    <div className={`bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden ${className}`}>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
              {columns.map((col, idx) => (
                <th key={idx} className={`px-4 py-3 ${col.className || ''}`}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 text-xs text-slate-700 font-medium">
            {data.map((row, rowIdx) => (
              <tr
                key={row.id || row._id || rowIdx}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={`transition-colors ${
                  onRowClick ? 'cursor-pointer hover:bg-blue-50/40' : 'hover:bg-slate-50/50'
                }`}
              >
                {columns.map((col, colIdx) => (
                  <td key={colIdx} className={`px-4 py-3.5 ${col.cellClassName || ''}`}>
                    {col.accessor ? row[col.accessor] : col.render ? col.render(row) : null}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pagination && <Pagination {...pagination} />}
    </div>
  )
}
