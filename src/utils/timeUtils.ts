// Utility functions for time and schedule calculations

export const TIME_SLOT_MINUTES = 15
export const SLOTS_PER_HOUR = 4
export const TOTAL_DAILY_SLOTS = 96 // 24 * 4

/**
 * Convert time string (HH:MM) to slot number (0-95)
 */
export function timeToSlot(timeStr: string): number {
  const [hours, minutes] = timeStr.split(':').map(Number)
  return hours * SLOTS_PER_HOUR + Math.floor(minutes / TIME_SLOT_MINUTES)
}

/**
 * Convert slot number (0-95) to time string (HH:MM)
 */
export function slotToTime(slot: number): string {
  const hours = Math.floor(slot / SLOTS_PER_HOUR)
  const minutes = (slot % SLOTS_PER_HOUR) * TIME_SLOT_MINUTES
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
}

/**
 * Get all time slots for 24-hour period
 */
export function getAllTimeSlots(): string[] {
  const slots: string[] = []
  for (let i = 0; i < TOTAL_DAILY_SLOTS; i++) {
    slots.push(slotToTime(i))
  }
  return slots
}

/**
 * Check if time is on 15-minute boundary
 */
export function isValidTimeSlot(timeStr: string): boolean {
  const [hours, minutes] = timeStr.split(':').map(Number)
  return minutes % TIME_SLOT_MINUTES === 0
}

/**
 * Round time to nearest 15-minute slot
 */
export function roundToNearestSlot(timeStr: string): string {
  const [hours, minutes] = timeStr.split(':').map(Number)
  const rounded = Math.round(minutes / TIME_SLOT_MINUTES) * TIME_SLOT_MINUTES
  const newHours = hours + Math.floor(rounded / 60)
  const newMinutes = rounded % 60
  return `${String(newHours % 24).padStart(2, '0')}:${String(newMinutes).padStart(2, '0')}`
}

/**
 * Calculate duration between two times in minutes
 */
export function calculateDuration(startTime: string, endTime: string): number {
  const startSlot = timeToSlot(startTime)
  const endSlot = timeToSlot(endTime)
  
  // Handle cross-midnight shifts
  const diff = endSlot >= startSlot ? endSlot - startSlot : (TOTAL_DAILY_SLOTS - startSlot) + endSlot
  return diff * TIME_SLOT_MINUTES
}

/**
 * Check if two time ranges overlap
 */
export function timeRangesOverlap(
  start1: string,
  end1: string,
  start2: string,
  end2: string
): boolean {
  const s1 = timeToSlot(start1)
  const e1 = timeToSlot(end1)
  const s2 = timeToSlot(start2)
  const e2 = timeToSlot(end2)

  return !(e1 <= s2 || e2 <= s1)
}

/**
 * Check if time is within shift
 */
export function isTimeWithinShift(
  time: string,
  shiftStart: string,
  shiftEnd: string
): boolean {
  const timeSlot = timeToSlot(time)
  const startSlot = timeToSlot(shiftStart)
  const endSlot = timeToSlot(shiftEnd)

  // Handle cross-midnight shifts
  if (endSlot >= startSlot) {
    return timeSlot >= startSlot && timeSlot < endSlot
  } else {
    return timeSlot >= startSlot || timeSlot < endSlot
  }
}

/**
 * Format seconds to HH:MM:SS
 */
export function formatDurationSeconds(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
}

/**
 * Format minutes to HH:MM
 */
export function formatDurationMinutes(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`
}

/**
 * Get current time in HH:MM format
 */
export function getCurrentTimeSlot(): string {
  const now = new Date()
  const hours = now.getHours()
  const minutes = Math.floor(now.getMinutes() / TIME_SLOT_MINUTES) * TIME_SLOT_MINUTES
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
}

/**
 * Format date to YYYY-MM-DD
 */
export function formatDate(date: Date): string {
  return date.toISOString().split('T')[0]
}

/**
 * Format date and time display
 */
export function formatDisplayDate(date: Date): string {
  return new Intl.DateTimeFormat('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
}

/**
 * Format display time with AM/PM
 */
export function formatDisplayTime(date: Date): string {
  return new Intl.DateTimeFormat('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  }).format(date)
}

/**
 * Calculate elapsed time from timestamp
 */
export function getElapsedTime(startTime: Date, endTime: Date = new Date()): number {
  return Math.floor((endTime.getTime() - startTime.getTime()) / 1000)
}
