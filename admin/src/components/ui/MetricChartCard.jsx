import React from 'react'
import DataCard from './DataCard'
import FilterBar from './FilterBar'

export function MetricChartCard({
  title,
  subtitle,
  icon,
  filterOptions,
  filterValue,
  onFilterChange,
  filterVariant = 'pills',
  chart,
  legend,
  summary,
  loading = false,
  empty = false,
  error = null,
  onRetry,
  className = '',
  height = 240,
}) {
  const headerAction = filterOptions ? (
    <FilterBar
      options={filterOptions}
      value={filterValue}
      onChange={onFilterChange}
      variant={filterVariant}
    />
  ) : null

  return (
    <DataCard
      title={title}
      subtitle={subtitle}
      icon={icon}
      action={headerAction}
      loading={loading}
      empty={empty}
      error={error}
      onRetry={onRetry}
      className={className}
    >
      {summary && <div className="mb-3">{summary}</div>}
      <div style={{ height, minHeight: height }} className="w-full relative">
        {chart}
      </div>
      {legend && <div className="mt-3 pt-3 border-t border-slate-100">{legend}</div>}
    </DataCard>
  )
}
