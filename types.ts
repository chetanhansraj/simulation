export enum LocationType {
  HOME = 'Home',
  WORK = 'Office',
  STORE = 'Supermarket',
  PARK = 'Park'
}

export enum ActionType {
  MOVE = 'MOVE',
  WORK = 'WORK',
  BUY = 'BUY',
  CONSUME = 'CONSUME',
  USE = 'USE',
  SLEEP = 'SLEEP',
  REST = 'REST',
  SOCIALIZE = 'SOCIALIZE',
  IDLE = 'IDLE',
  APPLY = 'APPLY'
}

export type ItemType = 'food' | 'gadget' | 'service';

export interface Vitals {
  hunger: number; // 0-100 (100 is starving)
  energy: number; // 0-100 (100 is fully rested)
  boredom: number; // 0-100 (100 is extremely bored)
  money: number;
}

export interface AgentDecision {
  thought_process: string;
  action: ActionType;
  target: string;
  param?: string;
}

export interface PurchaseRecord {
  productName: string;
  price: number;
  satisfaction: number; // 1-10
  time: number;
}

export interface ActionResult {
  tick: number;
  action: ActionType;
  target: string;
  success: boolean;
  message: string;
}

export interface InventoryItem {
  id: string; 
  companyId: string; // To track who made it
  name: string;
  type: ItemType;
  effect: {
    hunger?: number;
    energy?: number;
    boredom?: number;
  };
  quality: number;
  price: number;
}

export interface AgentMemory {
  purchaseHistory: PurchaseRecord[];
  learnings: string[]; // General strings
  recentEvents: string[]; // Narrative log of last 10 things (Phase 3B)
  brandOpinions: Record<string, number>; // CompanyID -> Score (-100 to 100) (Phase 3B)
  actionHistory: ActionResult[];
}

export interface Agent {
  id: string;
  name: string;
  avatar: string;
  personality: {
    type: string;
    traits: string[];
    goals: string;
    ambition: number; // 0-100: affects work frequency and brand preferences
  };
  vitals: Vitals;
  location: LocationType;
  inventory: InventoryItem[];
  memory: AgentMemory;
  lastDecision: AgentDecision | null;
  history: string[]; // Short history of recent log messages

  // Phase 3E: Multi-LLM & Scaling
  modelProvider: 'groq';
  modelName: string;
  spawnTime: number; // Hour of day (0-23) to start existing
  thinkFrequency: number; // How often to query LLM (in hours)

  // Employment
  employer: string | null; // Company ID
  wage: number; // Hourly wage
  sleepCounter: number; // Tracks hours sleeping (for 6-hour sleep cycles)
  restCounter: number; // Tracks hours resting
}

export interface MarketProduct {
  id: string;
  companyId: string;
  name: string;
  itemType: ItemType;
  price: number;
  quality: number; // 1-100 (Affects satisfaction)
  cost: number; // Cost to produce per unit
  effect: {
    hunger?: number; // Reduces hunger (negative value)
    energy?: number; // Increases energy
    boredom?: number; // Reduces boredom
  };
  ratings: number[]; // Array of ratings 0-100 from agents
}

export interface Company {
  id: string;
  name: string;
  ceoName: string;
  description: string;
  funds: number;
  reputation: number; // 0-100 (Phase 3C)
  strategy: string; // CEO personality/strategy
  modelProvider?: string;
  modelName?: string;

  // Employment System
  employees: string[]; // Agent IDs
  openPositions: number; // Number of open job slots
  wage: number; // Hourly wage for workers
}

export interface CeoDecision {
  thought_process: string;
  action: 'LAUNCH_PRODUCT' | 'WITHDRAW_PRODUCT' | 'WAIT' | 'UNDERCUT' | 'IMPROVE' | 'HIRE' | 'REJECT';
  productName?: string;
  productPrice?: number;
  productQuality?: number; // 1-100
  productType?: 'FOOD' | 'DRINK' | 'GADGET';
  targetProductId?: string; // For withdrawal, undercut, or improvement
  applicantId?: string; // For hiring decisions
}

export interface SimulationLog {
  id: string;
  time: number;
  agentName: string;
  message: string;
  type: 'action' | 'thought' | 'system' | 'market';
}