import { Agent, LocationType, MarketProduct, Company } from './types';

export const INITIAL_COMPANIES: Company[] = [
  {
    id: 'comp_1',
    name: 'FastBite Inc',
    ceoName: 'Sarah Chen',
    description: 'Cheap, fast, low-quality sustenance.',
    funds: 1000,
    reputation: 40,
    strategy: 'Focus on low price and high volume. Target hungry people who are broke.',
    modelProvider: 'groq',
    modelName: 'llama-3.3-70b-versatile',
    employees: [],
    openPositions: 3,
    wage: 45
  },
  {
    id: 'comp_2',
    name: 'Luxura Brands',
    ceoName: 'Marcus Wright',
    description: 'Premium status items and gourmet food.',
    funds: 5000,
    reputation: 80,
    strategy: 'High price, high quality. Target rich people who want status or comfort.',
    modelProvider: 'groq',
    modelName: 'openai/gpt-oss-120b',
    employees: [],
    openPositions: 2,
    wage: 85
  },
  {
    id: 'comp_3',
    name: 'Chaos Labs',
    ceoName: 'Zara Kim',
    description: 'Experimental and weird products.',
    funds: 2000,
    reputation: 60,
    strategy: 'Niche, weird, high-boredom reduction. Try random things.',
    modelProvider: 'groq',
    modelName: 'moonshotai/kimi-k2-instruct-0905',
    employees: [],
    openPositions: 2,
    wage: 65
  }
];

export const INITIAL_MARKET: MarketProduct[] = [
  {
    id: 'prod_1',
    companyId: 'comp_1',
    name: 'Insta-Oats',
    itemType: 'food',
    price: 5,
    quality: 20,
    cost: 2,
    effect: { hunger: -20 },
    ratings: []
  },
  {
    id: 'prod_2',
    companyId: 'comp_1',
    name: 'Energy Sludge',
    itemType: 'food',
    price: 8,
    quality: 15,
    cost: 3,
    effect: { energy: 15, hunger: -5 },
    ratings: []
  },
  {
    id: 'prod_3',
    companyId: 'comp_3',
    name: 'VR Headset',
    itemType: 'gadget',
    price: 150,
    quality: 80,
    cost: 100,
    effect: { boredom: -80 },
    ratings: []
  },
  {
    id: 'prod_4',
    companyId: 'comp_2',
    name: 'Wagyu Burger',
    itemType: 'food',
    price: 50,
    quality: 95,
    cost: 35,
    effect: { hunger: -70, energy: 10 },
    ratings: []
  },
];

export const INITIAL_AGENTS: Agent[] = [
  // --- HERO AGENTS (Migrated to Groq) ---
  {
    id: '1',
    name: 'Alex',
    avatar: 'https://picsum.photos/seed/alex/128/128',
    personality: {
      type: 'The Grinder',
      traits: ['Ambitious', 'Workaholic', 'Impatient', 'Dislikes Cooking'],
      goals: 'Maximize wealth, minimize wasted time.',
      ambition: 95
    },
    vitals: { hunger: 30, energy: 80, boredom: 10, money: 1200 },
    location: LocationType.HOME,
    inventory: [],
    memory: { purchaseHistory: [], learnings: [], actionHistory: [], recentEvents: [], brandOpinions: {} },
    lastDecision: null,
    history: [],
    modelProvider: 'groq',
    modelName: 'llama-3.3-70b-versatile',
    spawnTime: 0,
    thinkFrequency: 2,
    employer: null,
    wage: 0,
    sleepCounter: 0,
    restCounter: 0
  },
  {
    id: '2',
    name: 'Bella',
    avatar: 'https://picsum.photos/seed/bella/128/128',
    personality: {
      type: 'The Nurturer',
      traits: ['Frugal', 'Risk-averse', 'Patient', 'Loves Cooking'],
      goals: 'Maintain safety, keep budget balanced, stay healthy.',
      ambition: 50
    },
    vitals: { hunger: 20, energy: 90, boredom: 20, money: 450 },
    location: LocationType.HOME,
    inventory: [
      {
        id: 'inv_bella_1',
        companyId: 'comp_1',
        name: 'Raw Vegetables',
        type: 'food',
        effect: { hunger: -15, energy: 5 },
        quality: 50,
        price: 0
      }
    ],
    memory: { purchaseHistory: [], learnings: [], actionHistory: [], recentEvents: [], brandOpinions: {} },
    lastDecision: null,
    history: [],
    modelProvider: 'groq',
    modelName: 'llama-3.3-70b-versatile',
    spawnTime: 0,
    thinkFrequency: 2,
    employer: null,
    wage: 0,
    sleepCounter: 0,
    restCounter: 0
  },
  {
    id: '3',
    name: 'Charlie',
    avatar: 'https://picsum.photos/seed/charlie/128/128',
    personality: {
      type: 'The Hedonist',
      traits: ['Impulsive', 'Tech-addict', 'Lazy', 'Status-seeker'],
      goals: 'Maximize fun, avoid work, buy cool stuff.',
      ambition: 15
    },
    vitals: { hunger: 50, energy: 60, boredom: 80, money: 200 },
    location: LocationType.HOME,
    inventory: [],
    memory: { purchaseHistory: [], learnings: [], actionHistory: [], recentEvents: [], brandOpinions: {} },
    lastDecision: null,
    history: [],
    modelProvider: 'groq',
    modelName: 'llama-3.3-70b-versatile',
    spawnTime: 0,
    thinkFrequency: 2,
    employer: null,
    wage: 0,
    sleepCounter: 0,
    restCounter: 0
  },

  // --- NEW AGENTS (Groq) ---
  {
    id: '4',
    name: 'David', // Student
    avatar: 'https://picsum.photos/seed/david/128/128',
    personality: {
      type: 'Student',
      traits: ['Broke', 'Social', 'Optimistic', 'Hungry'],
      goals: 'Survive on cheap food, have fun with friends.',
      ambition: 40
    },
    vitals: { hunger: 60, energy: 70, boredom: 50, money: 300 },
    location: LocationType.HOME,
    inventory: [],
    memory: { purchaseHistory: [], learnings: [], actionHistory: [], recentEvents: [], brandOpinions: {} },
    lastDecision: null,
    history: [],
    modelProvider: 'groq',
    modelName: 'llama-3.3-70b-versatile', // Fast, efficient
    spawnTime: 10,
    thinkFrequency: 4,
    employer: null,
    wage: 0,
    sleepCounter: 0,
    restCounter: 0
  },
  {
    id: '5',
    name: 'Margaret', // Retiree
    avatar: 'https://picsum.photos/seed/margaret/128/128',
    personality: {
      type: 'Retiree',
      traits: ['Wealthy', 'Patient', 'Quality-conscious', 'Traditional'],
      goals: 'Enjoy life, buy high quality goods, avoid stress.',
      ambition: 10
    },
    vitals: { hunger: 20, energy: 60, boredom: 10, money: 2000 },
    location: LocationType.HOME,
    inventory: [
        { id: 'inv_m_1', companyId: 'comp_2', name: 'Premium Tea', type: 'food', effect: { energy: 10 }, quality: 90, price: 0 },
        { id: 'inv_m_2', companyId: 'comp_2', name: 'Gourmet Biscuits', type: 'food', effect: { hunger: -10 }, quality: 85, price: 0 }
    ],
    memory: { purchaseHistory: [], learnings: [], actionHistory: [], recentEvents: [], brandOpinions: {} },
    lastDecision: null,
    history: [],
    modelProvider: 'groq',
    modelName: 'llama-3.3-70b-versatile', // High intelligence
    spawnTime: 7,
    thinkFrequency: 4,
    employer: null,
    wage: 0,
    sleepCounter: 0,
    restCounter: 0
  },
  {
    id: '6',
    name: 'Nina', // Freelancer
    avatar: 'https://picsum.photos/seed/nina/128/128',
    personality: {
      type: 'Freelancer',
      traits: ['Stressed', 'Irregular Schedule', 'Budget-conscious', 'Creative'],
      goals: 'Balance work and life, save money where possible.',
      ambition: 60
    },
    vitals: { hunger: 40, energy: 50, boredom: 30, money: 800 },
    location: LocationType.HOME,
    inventory: [
        { id: 'inv_n_1', companyId: 'comp_1', name: 'Instant Coffee', type: 'food', effect: { energy: 20 }, quality: 30, price: 0 }
    ],
    memory: { purchaseHistory: [], learnings: [], actionHistory: [], recentEvents: [], brandOpinions: {} },
    lastDecision: null,
    history: [],
    modelProvider: 'groq',
    modelName: 'llama-3.3-70b-versatile', // Complex constraints
    spawnTime: 11,
    thinkFrequency: 3,
    employer: null,
    wage: 0,
    sleepCounter: 0,
    restCounter: 0
  },
  {
    id: '7',
    name: 'Robert', // Parent
    avatar: 'https://picsum.photos/seed/robert/128/128',
    personality: {
      type: 'Parent',
      traits: ['Responsible', 'Protective', 'Value-oriented', 'Tired'],
      goals: 'Provide for family, ensure safety, find good deals.',
      ambition: 55
    },
    vitals: { hunger: 30, energy: 40, boredom: 10, money: 1200 },
    location: LocationType.HOME,
    inventory: [
        { id: 'inv_r_1', companyId: 'comp_1', name: 'Bulk Rice', type: 'food', effect: { hunger: -30 }, quality: 40, price: 0 },
        { id: 'inv_r_2', companyId: 'comp_1', name: 'Canned Beans', type: 'food', effect: { hunger: -20 }, quality: 40, price: 0 },
        { id: 'inv_r_3', companyId: 'comp_1', name: 'Water Jug', type: 'food', effect: { energy: 5 }, quality: 50, price: 0 }
    ],
    memory: { purchaseHistory: [], learnings: [], actionHistory: [], recentEvents: [], brandOpinions: {} },
    lastDecision: null,
    history: [],
    modelProvider: 'groq',
    modelName: 'llama-3.3-70b-versatile', // Responsibility
    spawnTime: 6,
    thinkFrequency: 4,
    employer: null,
    wage: 0,
    sleepCounter: 0,
    restCounter: 0
  },
  {
    id: '8',
    name: 'Yuki', // Artist
    avatar: 'https://picsum.photos/seed/yuki/128/128',
    personality: {
      type: 'Artist',
      traits: ['Eccentric', 'Curious', 'Impulsive', 'Visual'],
      goals: 'Find inspiration, experience new things, avoid boredom.',
      ambition: 30
    },
    vitals: { hunger: 50, energy: 70, boredom: 90, money: 600 },
    location: LocationType.HOME,
    inventory: [
        { id: 'inv_y_1', companyId: 'comp_3', name: 'Kaleidoscope', type: 'gadget', effect: { boredom: -20 }, quality: 70, price: 0 }
    ],
    memory: { purchaseHistory: [], learnings: [], actionHistory: [], recentEvents: [], brandOpinions: {} },
    lastDecision: null,
    history: [],
    modelProvider: 'groq',
    modelName: 'llama-3.3-70b-versatile', // Creative/Weird
    spawnTime: 14,
    thinkFrequency: 3,
    employer: null,
    wage: 0,
    sleepCounter: 0,
    restCounter: 0
  },
  {
    id: '9',
    name: 'Marcus', // Athlete
    avatar: 'https://picsum.photos/seed/marcus/128/128',
    personality: {
      type: 'Athlete',
      traits: ['Health-conscious', 'Disciplined', 'Energetic', 'Picky Eater'],
      goals: 'Maximize physical performance, eat clean, train hard.',
      ambition: 85
    },
    vitals: { hunger: 20, energy: 95, boredom: 40, money: 1000 },
    location: LocationType.HOME,
    inventory: [
        { id: 'inv_ma_1', companyId: 'comp_2', name: 'Protein Shake', type: 'food', effect: { hunger: -10, energy: 10 }, quality: 80, price: 0 },
        { id: 'inv_ma_2', companyId: 'comp_2', name: 'Chicken Breast', type: 'food', effect: { hunger: -30 }, quality: 75, price: 0 }
    ],
    memory: { purchaseHistory: [], learnings: [], actionHistory: [], recentEvents: [], brandOpinions: {} },
    lastDecision: null,
    history: [],
    modelProvider: 'groq',
    modelName: 'llama-3.3-70b-versatile', // Routine/Simple
    spawnTime: 5,
    thinkFrequency: 4,
    employer: null,
    wage: 0,
    sleepCounter: 0,
    restCounter: 0
  },
  {
    id: '10',
    name: 'Tyler', // Gamer
    avatar: 'https://picsum.photos/seed/tyler/128/128',
    personality: {
      type: 'Gamer',
      traits: ['Night Owl', 'Tech-savvy', 'Sedentary', 'Efficient'],
      goals: 'Get best tech, minimize time spent on chores/work.',
      ambition: 25
    },
    vitals: { hunger: 60, energy: 50, boredom: 90, money: 900 },
    location: LocationType.HOME,
    inventory: [],
    memory: { purchaseHistory: [], learnings: [], actionHistory: [], recentEvents: [], brandOpinions: {} },
    lastDecision: null,
    history: [],
    modelProvider: 'groq',
    modelName: 'llama-3.3-70b-versatile', // Fast/Efficient
    spawnTime: 12,
    thinkFrequency: 3,
    employer: null,
    wage: 0,
    sleepCounter: 0,
    restCounter: 0
  }
];

export const LOCATIONS = [
  { type: LocationType.HOME, icon: '🏠', description: 'Restores Energy slowly.' },
  { type: LocationType.WORK, icon: '🏢', description: 'Earns money, drains energy fast.' },
  { type: LocationType.STORE, icon: '🛒', description: 'Buy items to reduce hunger/boredom.' },
  { type: LocationType.PARK, icon: '🌳', description: 'Free relaxation, reduces boredom slowly.' },
];