import { TrafficLight } from '../types';

export interface TimeRange {
  start: number; // 0-23
  end: number; // 0-23
}

export type DayType = 'weekday' | 'weekend' | 'both';
export type Priority = 'high' | 'medium' | 'low';
export type Season = 'summer' | 'winter' | 'all';

export interface ActionRecommendation {
  id: string;
  title: string;
  description: string;
  waterUsage: number; // liters
  points: number;
  icon: string; // lucide-react icon name

  // Time constraints
  typicalCurrentTime: TimeRange; // When users typically do this NOW (peak hours)
  suggestedTime: TimeRange; // When we recommend shifting TO (off-peak)

  // Context
  dayType: DayType;
  priority: Priority;
  season: Season;

  // Display conditions
  minHourToShow: number; // Don't show before this hour
  maxHourToShow: number; // Don't show after this hour
  validGridStatus: TrafficLight[]; // Only show during these statuses
}

/**
 * Complete action library with 20 diverse water-using activities
 * Based on typical German household routines
 */
export const ACTION_LIBRARY: ActionRecommendation[] = [
  // KITCHEN ACTIVITIES
  {
    id: 'dishwasher-evening',
    title: 'Dishwasher Tonight',
    description: 'Run at 11:00 PM instead',
    waterUsage: 12,
    points: 120,
    icon: 'Utensils',
    typicalCurrentTime: { start: 19, end: 21 },
    suggestedTime: { start: 23, end: 6 },
    dayType: 'both',
    priority: 'high',
    season: 'all',
    minHourToShow: 17,
    maxHourToShow: 22,
    validGridStatus: [TrafficLight.RED, TrafficLight.YELLOW]
  },
  {
    id: 'dishes-by-hand',
    title: 'Hand-wash Dishes Later',
    description: 'Wait until 10:30 PM',
    waterUsage: 8,
    points: 80,
    icon: 'Droplets',
    typicalCurrentTime: { start: 20, end: 21 },
    suggestedTime: { start: 22, end: 23 },
    dayType: 'both',
    priority: 'medium',
    season: 'all',
    minHourToShow: 19,
    maxHourToShow: 21,
    validGridStatus: [TrafficLight.RED, TrafficLight.YELLOW]
  },
  {
    id: 'coffee-prefill',
    title: 'Pre-fill Coffee Maker',
    description: 'Fill tonight for auto-start at 6 AM',
    waterUsage: 2,
    points: 20,
    icon: 'Coffee',
    typicalCurrentTime: { start: 6, end: 7 },
    suggestedTime: { start: 22, end: 23 },
    dayType: 'weekday',
    priority: 'low',
    season: 'all',
    minHourToShow: 20,
    maxHourToShow: 22,
    validGridStatus: [TrafficLight.YELLOW]
  },

  // LAUNDRY ACTIVITIES
  {
    id: 'washing-machine-night',
    title: 'Laundry Tonight',
    description: 'Start washer at 11:00 PM',
    waterUsage: 50,
    points: 500,
    icon: 'Wind',
    typicalCurrentTime: { start: 18, end: 20 },
    suggestedTime: { start: 23, end: 6 },
    dayType: 'both',
    priority: 'high',
    season: 'all',
    minHourToShow: 16,
    maxHourToShow: 22,
    validGridStatus: [TrafficLight.RED, TrafficLight.YELLOW]
  },
  {
    id: 'washing-machine-morning',
    title: 'Laundry Tomorrow Morning',
    description: 'Run at 6:00 AM before work',
    waterUsage: 50,
    points: 500,
    icon: 'Wind',
    typicalCurrentTime: { start: 18, end: 20 },
    suggestedTime: { start: 6, end: 8 },
    dayType: 'weekday',
    priority: 'high',
    season: 'all',
    minHourToShow: 17,
    maxHourToShow: 21,
    validGridStatus: [TrafficLight.RED]
  },

  // BATHROOM ACTIVITIES
  {
    id: 'shower-morning-shift',
    title: 'Morning Shower Instead',
    description: 'Shower at 6:30 AM tomorrow',
    waterUsage: 60,
    points: 600,
    icon: 'Droplets',
    typicalCurrentTime: { start: 19, end: 21 },
    suggestedTime: { start: 6, end: 7 },
    dayType: 'weekday',
    priority: 'medium',
    season: 'all',
    minHourToShow: 18,
    maxHourToShow: 21,
    validGridStatus: [TrafficLight.RED]
  },
  {
    id: 'shower-late-evening',
    title: 'Late Evening Shower',
    description: 'Shower at 10:30 PM instead',
    waterUsage: 60,
    points: 600,
    icon: 'Droplets',
    typicalCurrentTime: { start: 19, end: 21 },
    suggestedTime: { start: 22, end: 23 },
    dayType: 'both',
    priority: 'medium',
    season: 'all',
    minHourToShow: 18,
    maxHourToShow: 20,
    validGridStatus: [TrafficLight.RED, TrafficLight.YELLOW]
  },
  {
    id: 'bath-weekend',
    title: 'Relaxing Bath Later',
    description: 'Enjoy a bath at 10:00 PM',
    waterUsage: 120,
    points: 1200,
    icon: 'Bath',
    typicalCurrentTime: { start: 19, end: 21 },
    suggestedTime: { start: 22, end: 23 },
    dayType: 'weekend',
    priority: 'medium',
    season: 'all',
    minHourToShow: 17,
    maxHourToShow: 20,
    validGridStatus: [TrafficLight.RED, TrafficLight.YELLOW]
  },

  // OUTDOOR ACTIVITIES
  {
    id: 'garden-watering-morning',
    title: 'Garden Watering',
    description: 'Water at 6:00 AM (better for plants!)',
    waterUsage: 200,
    points: 2000,
    icon: 'Sprout',
    typicalCurrentTime: { start: 18, end: 20 },
    suggestedTime: { start: 5, end: 7 },
    dayType: 'both',
    priority: 'high',
    season: 'summer',
    minHourToShow: 16,
    maxHourToShow: 20,
    validGridStatus: [TrafficLight.RED, TrafficLight.YELLOW]
  },
  {
    id: 'garden-watering-evening',
    title: 'Garden Watering',
    description: 'Water at 11:00 PM tonight',
    waterUsage: 200,
    points: 2000,
    icon: 'Sprout',
    typicalCurrentTime: { start: 18, end: 20 },
    suggestedTime: { start: 23, end: 24 },
    dayType: 'both',
    priority: 'high',
    season: 'summer',
    minHourToShow: 17,
    maxHourToShow: 21,
    validGridStatus: [TrafficLight.RED]
  },
  {
    id: 'car-wash-weekend',
    title: 'Car Wash Saturday',
    description: 'Wash at 7:00 AM',
    waterUsage: 150,
    points: 1500,
    icon: 'Car',
    typicalCurrentTime: { start: 14, end: 16 },
    suggestedTime: { start: 6, end: 8 },
    dayType: 'weekend',
    priority: 'medium',
    season: 'all',
    minHourToShow: 10,
    maxHourToShow: 18,
    validGridStatus: [TrafficLight.YELLOW, TrafficLight.RED]
  },
  {
    id: 'lawn-sprinkler-morning',
    title: 'Lawn Sprinkler',
    description: 'Run at 5:30 AM for 1 hour',
    waterUsage: 300,
    points: 3000,
    icon: 'CloudRain',
    typicalCurrentTime: { start: 18, end: 20 },
    suggestedTime: { start: 5, end: 7 },
    dayType: 'both',
    priority: 'high',
    season: 'summer',
    minHourToShow: 15,
    maxHourToShow: 20,
    validGridStatus: [TrafficLight.RED]
  },

  // CLEANING ACTIVITIES
  {
    id: 'floor-mopping',
    title: 'Floor Mopping',
    description: 'Mop Saturday at 8:00 AM',
    waterUsage: 10,
    points: 100,
    icon: 'Waves',
    typicalCurrentTime: { start: 14, end: 16 },
    suggestedTime: { start: 8, end: 10 },
    dayType: 'weekend',
    priority: 'low',
    season: 'all',
    minHourToShow: 12,
    maxHourToShow: 17,
    validGridStatus: [TrafficLight.YELLOW]
  },
  {
    id: 'bathroom-deep-clean',
    title: 'Bathroom Deep Clean',
    description: 'Clean Sunday at 9:00 AM',
    waterUsage: 20,
    points: 200,
    icon: 'Sparkles',
    typicalCurrentTime: { start: 14, end: 16 },
    suggestedTime: { start: 9, end: 11 },
    dayType: 'weekend',
    priority: 'low',
    season: 'all',
    minHourToShow: 11,
    maxHourToShow: 17,
    validGridStatus: [TrafficLight.YELLOW]
  },
  {
    id: 'window-washing',
    title: 'Window Washing',
    description: 'Wash windows Sunday at 8:00 AM',
    waterUsage: 15,
    points: 150,
    icon: 'Square',
    typicalCurrentTime: { start: 13, end: 15 },
    suggestedTime: { start: 8, end: 10 },
    dayType: 'weekend',
    priority: 'low',
    season: 'all',
    minHourToShow: 11,
    maxHourToShow: 16,
    validGridStatus: [TrafficLight.YELLOW]
  },

  // COOKING ACTIVITIES
  {
    id: 'veggie-pre-wash',
    title: 'Pre-wash Vegetables',
    description: 'Wash veggies at 5:00 PM for later cooking',
    waterUsage: 5,
    points: 50,
    icon: 'Apple',
    typicalCurrentTime: { start: 18, end: 19 },
    suggestedTime: { start: 17, end: 18 },
    dayType: 'weekday',
    priority: 'low',
    season: 'all',
    minHourToShow: 16,
    maxHourToShow: 18,
    validGridStatus: [TrafficLight.YELLOW]
  },
  {
    id: 'pasta-pot-prefill',
    title: 'Pre-fill Pasta Pot',
    description: 'Fill pot at 5:00 PM, heat later',
    waterUsage: 3,
    points: 30,
    icon: 'Soup',
    typicalCurrentTime: { start: 18, end: 19 },
    suggestedTime: { start: 17, end: 18 },
    dayType: 'both',
    priority: 'low',
    season: 'all',
    minHourToShow: 16,
    maxHourToShow: 18,
    validGridStatus: [TrafficLight.YELLOW]
  },

  // MISCELLANEOUS
  {
    id: 'pet-water-refill',
    title: 'Pet Water Bowl',
    description: 'Refill at 11:00 PM',
    waterUsage: 2,
    points: 20,
    icon: 'Dog',
    typicalCurrentTime: { start: 19, end: 20 },
    suggestedTime: { start: 23, end: 24 },
    dayType: 'both',
    priority: 'low',
    season: 'all',
    minHourToShow: 18,
    maxHourToShow: 21,
    validGridStatus: [TrafficLight.YELLOW]
  },
  {
    id: 'humidifier-fill',
    title: 'Humidifier Refill',
    description: 'Fill at 10:00 PM before bed',
    waterUsage: 5,
    points: 50,
    icon: 'Wind',
    typicalCurrentTime: { start: 19, end: 20 },
    suggestedTime: { start: 22, end: 23 },
    dayType: 'both',
    priority: 'low',
    season: 'winter',
    minHourToShow: 18,
    maxHourToShow: 21,
    validGridStatus: [TrafficLight.YELLOW]
  },
  {
    id: 'aquarium-water-change',
    title: 'Aquarium Water Change',
    description: 'Change water Sunday at 9:00 AM',
    waterUsage: 30,
    points: 300,
    icon: 'Fish',
    typicalCurrentTime: { start: 14, end: 16 },
    suggestedTime: { start: 9, end: 11 },
    dayType: 'weekend',
    priority: 'medium',
    season: 'all',
    minHourToShow: 11,
    maxHourToShow: 17,
    validGridStatus: [TrafficLight.YELLOW, TrafficLight.RED]
  }
];

/**
 * Get total number of actions in library
 */
export function getActionCount(): number {
  return ACTION_LIBRARY.length;
}

/**
 * Get action by ID
 */
export function getActionById(id: string): ActionRecommendation | undefined {
  return ACTION_LIBRARY.find(action => action.id === id);
}
