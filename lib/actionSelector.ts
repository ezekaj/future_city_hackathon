import { TrafficLight } from '../types';
import { ACTION_LIBRARY, ActionRecommendation, Season } from './actionLibrary';

/**
 * Generate a daily seed based on date for consistent randomization
 * Same actions throughout the day, but different actions each day
 */
function getDailySeed(date: Date): number {
  return date.getFullYear() * 10000 +
         (date.getMonth() + 1) * 100 +
         date.getDate();
}

/**
 * Seeded random number generator
 * Returns a number between 0 and 1
 */
function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

/**
 * Shuffle array using seeded random
 */
function shuffleArray<T>(array: T[], seed: number): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(seededRandom(seed + i) * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Detect current season based on month
 */
export function getCurrentSeason(month: number): Season {
  // Northern Hemisphere seasons for Germany
  if (month >= 3 && month <= 5) return 'summer'; // Spring → Summer activities
  if (month >= 6 && month <= 9) return 'summer'; // Summer → Full summer activities
  if (month >= 10 || month <= 2) return 'winter'; // Fall/Winter → Winter activities
  return 'all';
}

/**
 * Check if current day is a weekend
 */
export function isWeekend(dayOfWeek: number): boolean {
  return dayOfWeek === 0 || dayOfWeek === 6; // Sunday or Saturday
}

/**
 * Select actions based on current context
 *
 * @param currentHour - Current hour (0-23)
 * @param gridStatus - Current grid traffic light status
 * @param currentDate - Current date for day-of-week and season detection
 * @param numActions - Number of actions to return (default: 2)
 * @returns Array of selected action recommendations
 */
export function selectActions(
  currentHour: number,
  gridStatus: TrafficLight,
  currentDate: Date = new Date(),
  numActions: number = 2
): ActionRecommendation[] {

  const month = currentDate.getMonth(); // 0-11
  const dayOfWeek = currentDate.getDay(); // 0-6 (0 = Sunday)
  const season = getCurrentSeason(month);
  const isWeekendDay = isWeekend(dayOfWeek);

  // Filter eligible actions
  const eligibleActions = ACTION_LIBRARY.filter(action => {
    // Filter by day type
    if (action.dayType === 'weekday' && isWeekendDay) return false;
    if (action.dayType === 'weekend' && !isWeekendDay) return false;

    // Filter by time window (when to show the action)
    if (currentHour < action.minHourToShow || currentHour > action.maxHourToShow) {
      return false;
    }

    // Filter by grid status (only show during stress)
    if (!action.validGridStatus.includes(gridStatus)) {
      return false;
    }

    // Filter by season
    if (action.season !== 'all' && action.season !== season) {
      return false;
    }

    return true;
  });

  // If no eligible actions, return empty array
  if (eligibleActions.length === 0) {
    return [];
  }

  // Generate daily seed for consistent randomization
  const dailySeed = getDailySeed(currentDate);

  // Shuffle eligible actions with daily seed
  const shuffled = shuffleArray(eligibleActions, dailySeed);

  // Sort by priority (high first)
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  const sorted = shuffled.sort((a, b) => {
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });

  // Return top N actions
  return sorted.slice(0, Math.min(numActions, sorted.length));
}

/**
 * Get total count of eligible actions for current context
 * Useful for UI display: "2 of 8 actions"
 */
export function getEligibleActionCount(
  currentHour: number,
  gridStatus: TrafficLight,
  currentDate: Date = new Date()
): number {
  const month = currentDate.getMonth();
  const dayOfWeek = currentDate.getDay();
  const season = getCurrentSeason(month);
  const isWeekendDay = isWeekend(dayOfWeek);

  return ACTION_LIBRARY.filter(action => {
    if (action.dayType === 'weekday' && isWeekendDay) return false;
    if (action.dayType === 'weekend' && !isWeekendDay) return false;
    if (currentHour < action.minHourToShow || currentHour > action.maxHourToShow) return false;
    if (!action.validGridStatus.includes(gridStatus)) return false;
    if (action.season !== 'all' && action.season !== season) return false;
    return true;
  }).length;
}

/**
 * Format suggested time for display
 * Examples: "11:00 PM tonight", "6:00 AM tomorrow", "Saturday at 7:00 AM"
 */
export function formatSuggestedTime(
  suggestedHour: number,
  currentHour: number,
  currentDate: Date
): string {
  const isPM = suggestedHour >= 12;
  const displayHour = suggestedHour % 12 || 12;
  const period = isPM ? 'PM' : 'AM';
  const time = `${displayHour}:00 ${period}`;

  // If suggested time is later today
  if (suggestedHour > currentHour && suggestedHour < 24) {
    return `${time} tonight`;
  }

  // If suggested time is early morning (off-peak overnight)
  if (suggestedHour >= 23 || suggestedHour <= 7) {
    if (suggestedHour >= 23) {
      return `${time} tonight`;
    } else {
      return `${time} tomorrow`;
    }
  }

  // If it's a weekend-specific action
  const dayOfWeek = currentDate.getDay();
  if (dayOfWeek < 6 && suggestedHour >= 6 && suggestedHour <= 12) {
    // Weekday suggesting weekend morning
    const daysUntilSaturday = 6 - dayOfWeek;
    if (daysUntilSaturday === 1) {
      return `Saturday at ${time}`;
    } else if (daysUntilSaturday === 2) {
      return `Sunday at ${time}`;
    }
  }

  return time;
}

/**
 * Get action recommendation summary for debugging
 */
export function getActionSummary(
  currentHour: number,
  gridStatus: TrafficLight,
  currentDate: Date = new Date()
): string {
  const selected = selectActions(currentHour, gridStatus, currentDate, 10);
  const total = getEligibleActionCount(currentHour, gridStatus, currentDate);
  const season = getCurrentSeason(currentDate.getMonth());
  const dayType = isWeekend(currentDate.getDay()) ? 'Weekend' : 'Weekday';

  return `
Current Context:
- Hour: ${currentHour}:00
- Grid: ${gridStatus}
- Day: ${dayType}
- Season: ${season}
- Eligible actions: ${total}
- Selected: ${selected.length}

Selected Actions:
${selected.map(a => `- ${a.title} (${a.points} pts, ${a.priority} priority)`).join('\n')}
  `.trim();
}
