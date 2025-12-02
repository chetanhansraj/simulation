import { LocationType } from '../types';

export const GAME_CONFIG = {
  width: 1200,
  height: 800,
  backgroundColor: '#0f172a', // Slate 900
};

export const WORLD_LOCATIONS = {
  [LocationType.HOME]: { x: 200, y: 600, color: 0x3b82f6, label: 'Residences' },     // Blue
  [LocationType.WORK]: { x: 1000, y: 250, color: 0x64748b, label: 'Office Tower' },   // Slate
  [LocationType.STORE]: { x: 600, y: 600, color: 0x10b981, label: 'Mega Market' },    // Green
  [LocationType.PARK]: { x: 400, y: 300, color: 0xf59e0b, label: 'Central Park' },    // Amber
};

export const COMPANY_HQS = [
  { id: 'comp_1', x: 200, y: 100, color: 0xef4444, label: 'FastBite HQ' }, // Red
  { id: 'comp_2', x: 600, y: 100, color: 0x14b8a6, label: 'Luxura HQ' },   // Teal
  { id: 'comp_3', x: 1000, y: 100, color: 0x8b5cf6, label: 'Chaos HQ' }    // Violet
];

export const AGENT_COLORS: Record<string, number> = {
  'The Grinder': 0x3b82f6, // Blue
  'The Nurturer': 0x10b981, // Green
  'The Hedonist': 0xf43f5e, // Rose
  'Student': 0xf59e0b,      // Amber
  'Retiree': 0xd946ef,      // Fuchsia
  'Freelancer': 0x06b6d4,   // Cyan
  'Parent': 0x84cc16,       // Lime
  'Artist': 0xa855f7,       // Purple
  'Athlete': 0xeab308,      // Yellow
  'Gamer': 0x6366f1         // Indigo
};