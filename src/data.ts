import type { IconName } from './icons';

export type Tone = 'coral' | 'teal' | 'amber' | 'navy' | 'green' | 'blue';

export type Place = {
  id: string;
  name: string;
  level: string;
  pct: number;
  tone: Tone;
  icon: IconName;
  walk: [number, number];
  forecast: [number, number, number, number, number];
  /** Chart labels for live forecasts, e.g. ["Now", "2 PM", …]. */
  hourLabels?: string[];
};

export type Mall = {
  id: string;
  name: string;
  short: string;
  accent: string;
  places: Place[];
};

export const FORECAST_HOURS = ['Now', '2 PM', '4 PM', '6 PM', '8 PM'];

export const MALLS: Mall[] = [
  {
    id: 'sm-city',
    name: 'SM City',
    short: 'SM',
    accent: '#1a5bb8',
    places: [
      {
        id: 'smc-food-court',
        name: 'Food Court',
        level: 'Ground level',
        pct: 64,
        tone: 'coral',
        icon: 'utensils',
        walk: [5, 7],
        forecast: [64, 72, 80, 85, 70],
      },
      {
        id: 'smc-supermarket',
        name: 'SM Supermarket',
        level: 'Ground level',
        pct: 28,
        tone: 'teal',
        icon: 'cart',
        walk: [3, 5],
        forecast: [28, 44, 62, 78, 52],
      },
      {
        id: 'smc-department-store',
        name: 'Department Store',
        level: 'Level 1',
        pct: 32,
        tone: 'navy',
        icon: 'bag',
        walk: [4, 6],
        forecast: [32, 48, 66, 80, 58],
      },
      {
        id: 'smc-cinema',
        name: 'SM Cinema',
        level: 'Level 2',
        pct: 67,
        tone: 'coral',
        icon: 'film',
        walk: [2, 4],
        forecast: [67, 58, 72, 88, 92],
      },
      {
        id: 'smc-cyberzone',
        name: 'Cyberzone',
        level: 'Level 3',
        pct: 55,
        tone: 'amber',
        icon: 'gamepad',
        walk: [6, 8],
        forecast: [55, 58, 64, 70, 60],
      },
      {
        id: 'smc-north-dining',
        name: 'North Dining Area',
        level: 'Level 1',
        pct: 26,
        tone: 'green',
        icon: 'bowl',
        walk: [5, 7],
        forecast: [26, 38, 55, 68, 44],
      },
    ],
  },
  {
    id: 'sm-mall-of-asia',
    name: 'SM Mall of Asia',
    short: 'MOA',
    accent: '#14479a',
    places: [
      {
        id: 'moa-food-hall',
        name: 'Food Hall',
        level: 'Level 1',
        pct: 72,
        tone: 'coral',
        icon: 'utensils',
        walk: [4, 6],
        forecast: [72, 78, 86, 90, 74],
      },
      {
        id: 'moa-seaside-dining',
        name: 'Seaside Dining',
        level: 'Ground level',
        pct: 38,
        tone: 'green',
        icon: 'bowl',
        walk: [7, 9],
        forecast: [38, 50, 62, 71, 60],
      },
      {
        id: 'moa-atrium',
        name: 'Main Mall Atrium',
        level: 'Ground level',
        pct: 58,
        tone: 'navy',
        icon: 'bag',
        walk: [1, 2],
        forecast: [58, 64, 72, 79, 66],
      },
      {
        id: 'moa-imax',
        name: 'IMAX Cinema',
        level: 'Level 2',
        pct: 44,
        tone: 'coral',
        icon: 'film',
        walk: [3, 5],
        forecast: [44, 40, 58, 82, 88],
      },
      {
        id: 'moa-cyberzone',
        name: 'Cyberzone',
        level: 'Level 2',
        pct: 34,
        tone: 'amber',
        icon: 'gamepad',
        walk: [6, 8],
        forecast: [34, 42, 52, 60, 48],
      },
    ],
  },
  {
    id: 'ayala-cebu',
    name: 'Ayala Center Cebu',
    short: 'AY',
    accent: '#1d8a6f',
    places: [
      {
        id: 'ayc-food-choices',
        name: 'Food Choices',
        level: 'Level 4',
        pct: 61,
        tone: 'coral',
        icon: 'utensils',
        walk: [6, 8],
        forecast: [61, 68, 76, 82, 68],
      },
      {
        id: 'ayc-terraces',
        name: 'The Terraces',
        level: 'Ground level',
        pct: 47,
        tone: 'green',
        icon: 'bowl',
        walk: [2, 3],
        forecast: [47, 55, 68, 74, 62],
      },
      {
        id: 'ayc-metro',
        name: 'Metro Department Store',
        level: 'Level 1',
        pct: 24,
        tone: 'navy',
        icon: 'bag',
        walk: [3, 5],
        forecast: [24, 38, 54, 66, 50],
      },
      {
        id: 'ayc-cinema',
        name: 'Cinema 5',
        level: 'Level 5',
        pct: 35,
        tone: 'coral',
        icon: 'film',
        walk: [7, 9],
        forecast: [35, 32, 48, 70, 78],
      },
      {
        id: 'ayc-kids',
        name: "Kids' Zone",
        level: 'Level 3',
        pct: 78,
        tone: 'amber',
        icon: 'gamepad',
        walk: [5, 6],
        forecast: [78, 74, 82, 86, 64],
      },
    ],
  },
];

export type Status = 'Light' | 'Moderate' | 'Busy';

export const statusOf = (pct: number): Status => (pct < 40 ? 'Light' : pct < 60 ? 'Moderate' : 'Busy');

export const headlineOf = (pct: number): string =>
  pct < 40 ? 'Not too crowded' : pct < 65 ? 'Moderately busy' : 'Very busy';

export const formatTime = (date: Date): string =>
  new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' }).format(date);

export const walkLabel = (walk: [number, number]): string => `${walk[0]}–${walk[1]} min walk`;
