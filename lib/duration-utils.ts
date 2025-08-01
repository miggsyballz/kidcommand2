/**
 * Comprehensive duration formatting utilities for consistent mm:ss display
 */

// Parse duration from various formats and return seconds
export function parseDurationToSeconds(value: any): number {
  if (value === null || value === undefined || value === "") {
    return 0
  }

  // Handle numeric values
  if (typeof value === "number") {
    // Check if it's an Excel time fraction (0 < value < 1)
    if (value > 0 && value < 1) {
      // Excel time fraction (e.g., 0.04167 = 1 minute)
      return Math.round(value * 24 * 60 * 60)
    }
    // Assume it's already in seconds
    return Math.round(value)
  }

  // Handle string values
  if (typeof value === "string") {
    const trimmed = value.trim()

    // Already in MM:SS or M:SS format
    const timeMatch = trimmed.match(/^(\d{1,2}):(\d{2})$/)
    if (timeMatch) {
      const minutes = Number.parseInt(timeMatch[1])
      const seconds = Number.parseInt(timeMatch[2])
      return minutes * 60 + seconds
    }

    // Handle H:MM:SS format
    const longTimeMatch = trimmed.match(/^(\d{1,2}):(\d{2}):(\d{2})$/)
    if (longTimeMatch) {
      const hours = Number.parseInt(longTimeMatch[1])
      const minutes = Number.parseInt(longTimeMatch[2])
      const seconds = Number.parseInt(longTimeMatch[3])
      return hours * 3600 + minutes * 60 + seconds
    }

    // Handle plain number as string
    const numMatch = trimmed.match(/^(\d+\.?\d*)$/)
    if (numMatch) {
      const num = Number.parseFloat(numMatch[1])
      if (!isNaN(num)) {
        // Check if it's a decimal fraction (Excel time)
        if (num > 0 && num < 1) {
          return Math.round(num * 24 * 60 * 60)
        }
        // Assume it's seconds
        return Math.round(num)
      }
    }

    // Handle Excel decimal format like "0.04167"
    const decimalMatch = trimmed.match(/^0\.(\d+)$/)
    if (decimalMatch) {
      const decimal = Number.parseFloat(trimmed)
      return Math.round(decimal * 24 * 60 * 60)
    }
  }

  return 0
}

// Format seconds to MM:SS display format
export function formatDurationDisplay(value: any): string {
  const seconds = parseDurationToSeconds(value)

  if (seconds <= 0) {
    return "-"
  }

  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60

  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
}

// Format seconds to H:MM:SS for longer durations
export function formatLongDuration(seconds: number): string {
  if (seconds <= 0) {
    return "-"
  }

  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const remainingSeconds = seconds % 60

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`
  }

  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
}

// Check if a column name indicates it contains duration data
export function isDurationColumn(columnName: string): boolean {
  const lowerName = columnName.toLowerCase()
  return (
    lowerName.includes("runtime") ||
    lowerName.includes("duration") ||
    lowerName.includes("time") ||
    lowerName.includes("runs") ||
    lowerName === "runs"
  )
}

// Get display value for any cell, with duration formatting applied
export function getCellDisplayValue(value: any, columnName: string): string {
  if (value === null || value === undefined || value === "") {
    return "-"
  }

  // Apply duration formatting for duration columns
  if (isDurationColumn(columnName)) {
    return formatDurationDisplay(value)
  }

  // Return string representation for other columns
  return String(value)
}

// Convert display value back to storage format (for editing)
export function parseDisplayValueForStorage(displayValue: string, columnName: string): any {
  if (!displayValue || displayValue === "-") {
    return null
  }

  // For duration columns, convert MM:SS back to seconds
  if (isDurationColumn(columnName)) {
    const timeMatch = displayValue.match(/^(\d{1,2}):(\d{2})$/)
    if (timeMatch) {
      const minutes = Number.parseInt(timeMatch[1])
      const seconds = Number.parseInt(timeMatch[2])
      return minutes * 60 + seconds
    }

    // If it's not in MM:SS format, try to parse as number
    const num = Number.parseFloat(displayValue)
    if (!isNaN(num)) {
      return num
    }
  }

  return displayValue
}
