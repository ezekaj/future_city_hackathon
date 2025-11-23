export interface TierReward {
  name: string;
  description: string;
  icon: string;
}

export interface Tier {
  id: number;
  name: string;
  threshold: number;
  color: string;
  gradient: string;
  badge: string;
  title: string;
  rewards: string[];
  rewardDetails: TierReward[];
}

export const TIERS: Tier[] = [
  {
    id: 1,
    name: "Eco Starter",
    threshold: 0,
    color: "#8B7355",
    gradient: "linear-gradient(135deg, #8B7355 0%, #A0826D 100%)",
    badge: "🌱",
    title: "Beginning Your Eco Journey",
    rewards: [
      "Daily impact tracking",
      "Access to basic eco-tips"
    ],
    rewardDetails: [
      {
        name: "\"Behind the Scenes\" Infrastructure Tour with HNVG Experts",
        description: "Exclusive guided tour of Heilbronn's water infrastructure",
        icon: "🏗️"
      }
    ]
  },
  {
    id: 2,
    name: "Green Guardian",
    threshold: 500,
    color: "#C0C0C0",
    gradient: "linear-gradient(135deg, #C0C0C0 0%, #E8E8E8 100%)",
    badge: "🌿",
    title: "Making Sustainable Choices",
    rewards: [
      "Weekly insights dashboard",
      "Community leaderboard access",
      "Tier 1 + 2 rewards unlocked"
    ],
    rewardDetails: [
      {
        name: "\"Behind the Scenes\" Infrastructure Tour with HNVG Experts",
        description: "Exclusive guided tour of Heilbronn's water infrastructure",
        icon: "🏗️"
      },
      {
        name: "Exclusive Experimenta Science Center Tour & Dome Show",
        description: "VIP access to Germany's largest science center",
        icon: "🔬"
      }
    ]
  },
  {
    id: 3,
    name: "Planet Champion",
    threshold: 1500,
    color: "#FFD700",
    gradient: "linear-gradient(135deg, #FFD700 0%, #FFA500 100%)",
    badge: "🌍",
    title: "Leading Environmental Change",
    rewards: [
      "Monthly impact reports",
      "Advanced analytics",
      "Carbon offset calculator",
      "Tier 1 + 2 + 3 rewards unlocked"
    ],
    rewardDetails: [
      {
        name: "\"Behind the Scenes\" Infrastructure Tour with HNVG Experts",
        description: "Exclusive guided tour of Heilbronn's water infrastructure",
        icon: "🏗️"
      },
      {
        name: "Exclusive Experimenta Science Center Tour & Dome Show",
        description: "VIP access to Germany's largest science center",
        icon: "🔬"
      },
      {
        name: "VIP Access to the Neckarcup Tennis Tournament",
        description: "Premium seating at Heilbronn's premier tennis event",
        icon: "🎾"
      },
      {
        name: "Outdoor Adventure Day with DAV (Climbing Experience)",
        description: "Guided climbing experience with German Alpine Club",
        icon: "🧗"
      }
    ]
  },
  {
    id: 4,
    name: "Climate Hero",
    threshold: 3000,
    color: "#00CED1",
    gradient: "linear-gradient(135deg, #00CED1 0%, #48D1CC 100%)",
    badge: "⭐",
    title: "Elite Sustainability Advocate",
    rewards: [
      "Lifetime impact statistics",
      "Custom eco-challenges",
      "VIP community features",
      "ALL rewards unlocked"
    ],
    rewardDetails: [
      {
        name: "\"Behind the Scenes\" Infrastructure Tour with HNVG Experts",
        description: "Exclusive guided tour of Heilbronn's water infrastructure",
        icon: "🏗️"
      },
      {
        name: "Exclusive Experimenta Science Center Tour & Dome Show",
        description: "VIP access to Germany's largest science center",
        icon: "🔬"
      },
      {
        name: "VIP Access to the Neckarcup Tennis Tournament",
        description: "Premium seating at Heilbronn's premier tennis event",
        icon: "🎾"
      },
      {
        name: "Outdoor Adventure Day with DAV (Climbing Experience)",
        description: "Guided climbing experience with German Alpine Club",
        icon: "🧗"
      },
      {
        name: "VIP Ice Hockey Night with the Heilbronner Falken",
        description: "VIP tickets and meet-and-greet with local ice hockey team",
        icon: "🏒"
      },
      {
        name: "Trollinger Marathon \"Energy Boost\" Experience",
        description: "VIP marathon package with local wine tasting",
        icon: "🏃"
      }
    ]
  }
];

/**
 * Calculate which tier a user belongs to based on total points
 */
export function calculateTier(points: number): Tier {
  const sortedTiers = [...TIERS].reverse(); // Highest threshold first
  return sortedTiers.find(t => points >= t.threshold) || TIERS[0];
}

/**
 * Get the next tier above the current one
 */
export function getNextTier(currentTierId: number): Tier | null {
  return TIERS.find(t => t.id === currentTierId + 1) || null;
}

/**
 * Calculate progress percentage to next tier
 */
export function calculateProgressToNextTier(
  currentPoints: number,
  currentTier: Tier,
  nextTier: Tier | null
): number {
  if (!nextTier) return 100; // Max tier reached

  const pointsIntoCurrentTier = currentPoints - currentTier.threshold;
  const pointsNeededForNextTier = nextTier.threshold - currentTier.threshold;

  return Math.min(100, (pointsIntoCurrentTier / pointsNeededForNextTier) * 100);
}

/**
 * Get points needed to reach next tier
 */
export function getPointsToNextTier(currentPoints: number, nextTier: Tier | null): number {
  if (!nextTier) return 0; // Max tier reached
  return Math.max(0, nextTier.threshold - currentPoints);
}
