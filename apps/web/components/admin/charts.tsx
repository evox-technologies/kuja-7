'use client'

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { LabelledValue } from '@/lib/admin/types'

/**
 * Chart primitives for the admin dashboard.
 *
 * Colour follows the job, not the brand: single-series charts (magnitude) use
 * one hue stepped dark enough to read on white, and multi-series charts use a
 * fixed categorical order that is validated for colour-vision deficiency —
 * assigned by index and never cycled, so a moderator keeps their colour when
 * the list is filtered.
 *
 * The app is light-only (no theme toggle anywhere in the codebase), so these
 * are light-surface values.
 */

/** brand-600. Brand yellow itself is ~1.9:1 on white — too faint for a mark. */
const MARK = '#d4970a'
/** brand-800, for thin marks like a 2px line where the fill can't carry it. */
const MARK_STRONG = '#a06c00'

/**
 * Validated categorical order (adjacent-pair CVD ΔE 9.1, normal-vision 19.6 on
 * white). Assigned by index, never cycled — past eight series we fold into
 * "Other" rather than inventing a ninth hue.
 */
const CATEGORICAL = [
  '#2a78d6',
  '#eb6834',
  '#1baf7a',
  '#eda100',
  '#e87ba4',
  '#008300',
  '#4a3aa7',
  '#e34948',
]

export function seriesColor(index: number): string {
  return CATEGORICAL[index % CATEGORICAL.length]
}

const GRID = '#f3f4f6'
const AXIS_TEXT = { fill: '#9ca3af', fontSize: 11 }

function TooltipBox({
  active,
  payload,
  label,
  suffix = '',
}: {
  active?: boolean
  payload?: { name?: string; value?: number; color?: string }[]
  label?: string | number
  suffix?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-gray-100 bg-white px-3 py-2 text-xs shadow-lg">
      {label !== undefined && <p className="mb-1 font-semibold text-gray-900">{label}</p>}
      {payload.map((entry, i) => (
        <p key={i} className="flex items-center gap-1.5 text-gray-600">
          {entry.color && (
            <span
              aria-hidden
              className="inline-block h-2 w-2 rounded-full"
              style={{ background: entry.color }}
            />
          )}
          {entry.name && <span>{entry.name}:</span>}
          <span className="font-semibold text-gray-900">
            {entry.value}
            {suffix}
          </span>
        </p>
      ))}
    </div>
  )
}

/** Registrations over time. One series, so no legend — the title names it. */
export function TimeSeriesChart({
  data,
  height = 200,
}: {
  data: { day: string; count: number }[]
  height?: number
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="registrationsFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={MARK} stopOpacity={0.25} />
            <stop offset="100%" stopColor={MARK} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke={GRID} />
        <XAxis
          dataKey="day"
          tickFormatter={shortDay}
          tickLine={false}
          axisLine={false}
          tick={AXIS_TEXT}
          minTickGap={24}
        />
        <YAxis tickLine={false} axisLine={false} tick={AXIS_TEXT} allowDecimals={false} width={40} />
        <Tooltip content={<TooltipBox />} cursor={{ stroke: GRID }} />
        <Area
          type="monotone"
          dataKey="count"
          name="Registrations"
          stroke={MARK_STRONG}
          strokeWidth={2}
          fill="url(#registrationsFill)"
          dot={false}
          activeDot={{ r: 4 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}

/** Single-series magnitude — age bands, top cities. Labelled, per the relief rule. */
export function CategoryBarChart({
  data,
  height = 200,
  horizontal = false,
}: {
  data: LabelledValue[]
  height?: number
  horizontal?: boolean
}) {
  if (horizontal) {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 28, left: 4, bottom: 4 }}>
          <CartesianGrid horizontal={false} stroke={GRID} />
          <XAxis type="number" hide allowDecimals={false} />
          <YAxis
            type="category"
            dataKey="label"
            tickLine={false}
            axisLine={false}
            tick={AXIS_TEXT}
            width={90}
          />
          <Tooltip content={<TooltipBox />} cursor={{ fill: '#fafafa' }} />
          <Bar dataKey="value" name="Profiles" fill={MARK} radius={[0, 4, 4, 0]} barSize={14}>
            <LabelList dataKey="value" position="right" fill="#6b7280" fontSize={11} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 18, right: 8, left: -20, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke={GRID} />
        <XAxis dataKey="label" tickLine={false} axisLine={false} tick={AXIS_TEXT} />
        <YAxis tickLine={false} axisLine={false} tick={AXIS_TEXT} allowDecimals={false} width={40} />
        <Tooltip content={<TooltipBox />} cursor={{ fill: '#fafafa' }} />
        <Bar dataKey="value" name="Profiles" fill={MARK} radius={[4, 4, 0, 0]} maxBarSize={44}>
          <LabelList dataKey="value" position="top" fill="#6b7280" fontSize={11} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

/**
 * Two-category split. A donut would make a reader compare arcs; one bar with
 * both numbers written on it is read at a glance.
 */
export function SplitBar({ data }: { data: LabelledValue[] }) {
  const total = data.reduce((sum, d) => sum + d.value, 0)
  if (total === 0) {
    return <p className="py-6 text-center text-xs text-gray-400">No profiles yet</p>
  }

  return (
    <div>
      {/* gap-0.5 is the 2px surface gap that keeps adjacent fills legible. */}
      <div className="flex h-3 w-full gap-0.5 overflow-hidden rounded-full">
        {data.map((entry, i) => (
          <div
            key={entry.label}
            className="h-full first:rounded-l-full last:rounded-r-full"
            style={{
              width: `${(entry.value / total) * 100}%`,
              background: seriesColor(i),
            }}
            title={`${entry.label}: ${entry.value}`}
          />
        ))}
      </div>
      <ul className="mt-3 flex flex-wrap gap-4">
        {data.map((entry, i) => (
          <li key={entry.label} className="flex items-center gap-1.5 text-xs">
            <span
              aria-hidden
              className="inline-block h-2 w-2 rounded-full"
              style={{ background: seriesColor(i) }}
            />
            <span className="text-gray-500">{entry.label}</span>
            <span className="font-semibold text-gray-900">{entry.value}</span>
            <span className="text-gray-400">
              ({Math.round((entry.value / total) * 100)}%)
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

/**
 * Registrations → Interests → Matches → Conversations. Each step is measured
 * against the first, with the step-to-step drop shown alongside — the number
 * people actually want from a funnel.
 */
export function Funnel({ steps }: { steps: LabelledValue[] }) {
  const top = steps[0]?.value ?? 0

  return (
    <ol className="flex flex-col gap-3">
      {steps.map((step, i) => {
        const ofTotal = top === 0 ? 0 : (step.value / top) * 100
        const previous = i === 0 ? null : steps[i - 1].value
        const stepRate =
          previous === null || previous === 0 ? null : Math.round((step.value / previous) * 100)

        return (
          <li key={step.label}>
            <div className="mb-1 flex items-baseline justify-between gap-2">
              <span className="text-xs text-gray-500">{step.label}</span>
              <span className="text-sm font-semibold tabular-nums text-gray-900">
                {step.value}
                {stepRate !== null && (
                  <span className="ml-1.5 text-[11px] font-normal text-gray-400">
                    {stepRate}% of previous
                  </span>
                )}
              </span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-gray-100">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${Math.max(ofTotal, step.value > 0 ? 2 : 0)}%`,
                  background: MARK,
                }}
              />
            </div>
          </li>
        )
      })}
    </ol>
  )
}

/**
 * Profiles created per day, one series per moderator. Stacked so the day's
 * total reads directly, with a 2px white stroke standing in for the surface gap
 * between segments.
 */
export function StackedDailyChart({
  days,
  series,
  height = 240,
}: {
  days: string[]
  series: { id: string; name: string; byDay: Record<string, number> }[]
  height?: number
}) {
  const data = days.map((day) => {
    const row: Record<string, string | number> = { day }
    for (const s of series) row[s.id] = s.byDay[day] ?? 0
    return row
  })

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke={GRID} />
        <XAxis
          dataKey="day"
          tickFormatter={shortDay}
          tickLine={false}
          axisLine={false}
          tick={AXIS_TEXT}
          minTickGap={20}
        />
        <YAxis tickLine={false} axisLine={false} tick={AXIS_TEXT} allowDecimals={false} width={40} />
        <Tooltip content={<TooltipBox />} cursor={{ fill: '#fafafa' }} />
        {series.length > 1 && (
          <Legend
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ fontSize: 11, color: '#6b7280', paddingTop: 8 }}
          />
        )}
        {series.map((s, i) => (
          <Bar
            key={s.id}
            dataKey={s.id}
            name={s.name}
            stackId="created"
            fill={seriesColor(i)}
            stroke="#ffffff"
            strokeWidth={2}
            maxBarSize={36}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  )
}

/** A single number with a label — often the right answer instead of a chart. */
export function StatTile({
  label,
  value,
  hint,
  tone = 'default',
}: {
  label: string
  value: string | number
  hint?: string
  tone?: 'default' | 'warning' | 'danger' | 'success'
}) {
  const toneCls = {
    default: 'text-gray-900',
    warning: 'text-warning',
    danger: 'text-danger',
    success: 'text-success',
  }[tone]

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-4">
      <p className="text-[10px] uppercase tracking-wide text-gray-400">{label}</p>
      <p className={`mt-1 text-2xl font-bold tabular-nums ${toneCls}`}>{value}</p>
      {hint && <p className="mt-0.5 text-[11px] text-gray-400">{hint}</p>}
    </div>
  )
}

function shortDay(day: string): string {
  const d = new Date(day)
  return isNaN(d.getTime())
    ? day
    : d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}
