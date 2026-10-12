export interface DateParts {
  year: number
  month: number
  day: number
}

/** 解析 `YYYY-MM-DD` 日期字符串，避免时区导致的日期偏移。 */
export function parseDateParts(value: string): DateParts {
  const [year = 1970, month = 1, day = 1] = value.slice(0, 10).split('-').map(Number)
  return { year, month, day }
}

export function formatDate(value: string): string {
  return value.slice(0, 10)
}

export function toUtcDate(value: string): Date {
  const { year, month, day } = parseDateParts(value)
  return new Date(Date.UTC(year, month - 1, day))
}

export function monthName(month: number): string {
  return new Intl.DateTimeFormat('en-US', { month: 'long', timeZone: 'UTC' })
    .format(new Date(Date.UTC(2000, month - 1, 1)))
}
