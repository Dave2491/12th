export type Country = {
  code: string;      // ISO 3166-1 alpha-2, e.g. "BR"
  name: string;      // e.g. "Brazil"
  flag: string;      // emoji flag, e.g. "🇧🇷"
  group?: string;    // World Cup group, e.g. "A"
  totalPoints: number;
  fanCount: number;
  rank?: number;
};

export type FanProfile = {
  id: string;
  walletAddress: string;
  countryCode: string;
  displayName: string | null;
  totalPoints: number;
  checkInStreak: number;
  longestStreak: number;
  badgeCount: number;
  joinedAt: string;
};

export type Fixture = {
  id: number;
  homeTeam: Country;
  awayTeam: Country;
  kickoffUtc: string;   // ISO timestamp
  status: "upcoming" | "live" | "finished";
  homeScore?: number;
  awayScore?: number;
  isDemo: boolean;
};

export type QuestType =
  | "predict_winner"
  | "vote_potm"
  | "trivia"
  | "react_moment"
  | "share_support"
  | "checkin";

export type Quest = {
  id: string;
  fixtureId: number;
  type: QuestType;
  title: string;
  description: string;
  points: number;
  completed?: boolean;
};

export type BadgeType =
  | "first_checkin"
  | "streak_3"
  | "streak_7"
  | "correct_prediction"
  | "top_fan"
  | "country_contributor";

export type Badge = {
  type: BadgeType;
  name: string;
  description: string;
  imageUrl: string;
  earnedAt?: string;
  tokenId?: number;
};

export type CheckIn = {
  id: string;
  fanId: string;
  fixtureId: number;
  checkedInAt: string;
  pointsEarned: number;
};

export type LeaderboardEntry = {
  rank: number;
  country: Country;
  totalPoints: number;
  weeklyGrowth: number;
};
