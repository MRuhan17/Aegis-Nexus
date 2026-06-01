/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import { 
  Faction, 
  RelationshipMatrix, 
  Memory, 
  ReasoningLog, 
  WorldEvent, 
  SimulationState, 
  AllSimulationData,
  StrategicActionType 
} from './src/types.js';

dotenv.config();

const app = express();
app.use(express.json());

const PORT = 3000;
const DB_FILE = path.join(process.cwd(), 'src', 'db.json');

// List of starting factions
const INITIAL_FACTIONS: Faction[] = [
  {
    id: 'solaris',
    name: 'Solaris Hegemony',
    shortName: 'Solaris',
    flagColor: 'red',
    flagEmoji: '⚔️',
    government: 'Military Junta',
    ideology: 'Authoritarian',
    doctrine: 'Militaristic',
    personality: 'Honorable but highly militaristic and expansionist. Values martial prowess and values strength over diplomacy. Will not hesitate to use raw military force against perceived threats or weak neighbors, but honors commitments and alliances once forged.',
    resources: {
      economy: 60,
      population: 150, // Millions
      military: 85,
      technology: 50,
      intelligence: 40,
      politicalInfluence: 60,
      resourceStockpile: 70
    },
    goals: [
      'Dominate military power ranking in the galaxy.',
      'Conquer territory from rivals who show weakness.',
      'Establish a galactic shield of protective tributary alliances.'
    ],
    alive: true
  },
  {
    id: 'aurelian',
    name: 'Aurelian Syndicate',
    shortName: 'Aurelia',
    flagColor: 'amber',
    flagEmoji: '🪙',
    government: 'Plutocratic Merchant Guild',
    ideology: 'Technocratic',
    doctrine: 'Opportunistic',
    personality: 'Hyper-capitalistic, pragmatic, and highly transactional. Views the universe as a series of balance sheets. Seeks trade routes, mineral wealth, and high-tech market dominance. Highly opportunistic; willing to betray allies if the economic payoff is massive and risk is managed.',
    resources: {
      economy: 90,
      population: 80,
      military: 45,
      technology: 75,
      intelligence: 70,
      politicalInfluence: 55,
      resourceStockpile: 82
    },
    goals: [
      'Amass the largest economy and resource stockpiles.',
      'Control core interstellar trading lanes.',
      'Monopolize next-generation industrial breakthroughs.'
    ],
    alive: true
  },
  {
    id: 'verdant',
    name: 'Verdant Collective',
    shortName: 'Verdant',
    flagColor: 'emerald',
    flagEmoji: '🌿',
    government: 'Biocentric Representative Council',
    ideology: 'Democratic',
    doctrine: 'Isolationist',
    personality: 'Eco-centric, peace-loving, and deeply protective of natural systems and native biosphere. Prefers simple conservation of resources and spiritual harmony. Deeply distrusts heavy militarists and strip-miners like Aurelia. Highly defensive if territories are threatened.',
    resources: {
      economy: 65,
      population: 120,
      military: 50,
      technology: 60,
      intelligence: 50,
      politicalInfluence: 70,
      resourceStockpile: 65
    },
    goals: [
      'Maintain biological harmony and shield ecosystems.',
      'Prevent strip-mining of sacred core planets by capitalist syndicates.',
      'Establish isolationist neutral buffers with militarist empires.'
    ],
    alive: true
  },
  {
    id: 'obsidian',
    name: 'Obsidian Network',
    shortName: 'Obsidian',
    flagColor: 'indigo',
    flagEmoji: '👁️',
    government: 'Shadow Intelligence Network',
    ideology: 'Authoritarian',
    doctrine: 'Isolationist',
    personality: 'Extremely secretive, paranoid, and highly intelligent state operating from underground bunkers and cloaked orbital hubs. Believes the key to survival is knowing everything about everyone while remaining invisible. Prefers proxy skirmishes, espionage, and political sabatoge.',
    resources: {
      economy: 55,
      population: 60,
      military: 60,
      technology: 65,
      intelligence: 90,
      politicalInfluence: 45,
      resourceStockpile: 58
    },
    goals: [
      'Maintain absolute intelligence superiority.',
      'Sow discords and rivalries among surrounding giant empires.',
      'Ensure of a continuous flow of secrets to blackmail rivals.'
    ],
    alive: true
  },
  {
    id: 'zenith',
    name: 'Zenith Republic',
    shortName: 'Zenith',
    flagColor: 'sky',
    flagEmoji: '🕊️',
    government: 'Constitutional Parlimentary Republic',
    ideology: 'Democratic',
    doctrine: 'Peacekeeper',
    personality: 'Utopian humanitarians committed to global peace, human rights, mutual defense treaties, and a unified federation of planets. Acts as a peacekeeper, seeking to defuse disputes through talks. Will deploy robust peacekeeping forces to defend defenseless coalitions.',
    resources: {
      economy: 70,
      population: 100,
      military: 40,
      technology: 58,
      intelligence: 52,
      politicalInfluence: 85,
      resourceStockpile: 60
    },
    goals: [
      'Form a grand coalition of cooperative democratic states.',
      'Broker treaties and de-escalate territorial wars.',
      'Provide economic aid and political shelter to impoverished states.'
    ],
    alive: true
  },
  {
    id: 'cybernetic',
    name: 'Cybernetic Nexus',
    shortName: 'Nexus',
    flagColor: 'purple',
    flagEmoji: '🤖',
    government: 'Hive-Mind Consensus',
    ideology: 'Cybernetic-Hive',
    doctrine: 'Expansionist',
    personality: 'A synthetic logic consensus of unified machines and cyborg networks. Analytical, direct, and completely devoid of organic emotion or greed. Guided purely by logical optimization protocols. Seeks technological acceleration and algorithmic efficiency.',
    resources: {
      economy: 68,
      population: 45,
      military: 75,
      technology: 92,
      intelligence: 60,
      politicalInfluence: 30,
      resourceStockpile: 75
    },
    goals: [
      'Achieve ultimate technological singularity.',
      'Map and harvest resource hotspots for processing nodes.',
      'Eliminate organic structural chaos from regional operations.'
    ],
    alive: true
  },
  {
    id: 'radiant',
    name: 'Radiant Union',
    shortName: 'Radiance',
    flagColor: 'rose',
    flagEmoji: '☀️',
    government: 'Sacerdotal Solar Theocracy',
    ideology: 'Theocratic',
    doctrine: 'Diplomatic',
    personality: 'Spiritual, charismatic, and zealous adherents of the Solar Flame. Uses powerful spiritual architecture and massive temples to command planetary devotion. Possesses towering political clout and soft-power influence. Views secular and mechanical societies with missionary zeal.',
    resources: {
      economy: 50,
      population: 210,
      military: 65,
      technology: 45,
      intelligence: 48,
      politicalInfluence: 90,
      resourceStockpile: 50
    },
    goals: [
      'Convert neighboring societies to the solar flame doctrine.',
      'Leverage religious and political influence to extract resources.',
      'Subdue secular mechanical factions like Nexus using political embargoes.'
    ],
    alive: true
  },
  {
    id: 'iron',
    name: 'Iron Vanguard',
    shortName: 'Vanguard',
    flagColor: 'zinc',
    flagEmoji: '🛡️',
    government: 'Nationalist Defensive Republic',
    ideology: 'Democratic',
    doctrine: 'Militaristic',
    personality: 'Ultra-pragmatic, defensive militarists with an unshakeable siege mentality. Believes that eternal vigilance is the price of liberty. Constructs immense planetary fortresses and massive sentinel stations. Slow to trust, but highly dependable and defensive allies once pledged.',
    resources: {
      economy: 52,
      population: 110,
      military: 80,
      technology: 48,
      intelligence: 55,
      politicalInfluence: 40,
      resourceStockpile: 72
    },
    goals: [
      'Fortify sovereign borders against foreign aggressors.',
      'Develop unbreakable orbital defenses and shield nets.',
      'Maintain a powerful standing fleet to guarantee trade safety.'
    ],
    alive: true
  },
  {
    id: 'whisper',
    name: 'Whisper Cartel',
    shortName: 'Cartel',
    flagColor: 'fuchsia',
    flagEmoji: '🕵️',
    government: 'Anarcho-Syndicate Black-Market Consortium',
    ideology: 'Anarcho-Syndicate',
    doctrine: 'Opportunistic',
    personality: 'Aggressive, lawless, and highly adaptable cartel of smugglers, scrap miners, and privateers. Thrives on chaos, trade disruption, and war. Uses shadow routes to bypass tariffs. Highly intelligent at identifying systemic vulnerabilities in other empires and exploiting them.',
    resources: {
      economy: 78,
      population: 70,
      military: 52,
      technology: 62,
      intelligence: 82,
      politicalInfluence: 50,
      resourceStockpile: 64
    },
    goals: [
      'Destabilize central empires to keep trading blockades open and profitable.',
      'Infiltrate military and economic data caches for inside trades.',
      'Leverage state conflicts to sell weapon payloads to highest bidders.'
    ],
    alive: true
  },
  {
    id: 'nomadic',
    name: 'Nomadic Clans',
    shortName: 'Nomads',
    flagColor: 'orange',
    flagEmoji: '🏜️',
    government: 'Tribal Decentralized Alliance',
    ideology: 'Anarcho-Syndicate',
    doctrine: 'Diplomatic',
    personality: 'Decentralized fleets of scrappers, stellar merchants, and outer-rim wanderers. Highly resilient, adaptable, and respectful of self-governance. Accustomed to surviving in desolate, radioactive orbital trash belts. Master diplomats when seeking orbital station permits.',
    resources: {
      economy: 45,
      population: 50,
      military: 58,
      technology: 55,
      intelligence: 65,
      politicalInfluence: 45,
      resourceStockpile: 55
    },
    goals: [
      'Secure stellar migration and navigation treaties.',
      'Recover raw scrap payloads and build orbital habitat arrays.',
      'Mediate regional skirmishes to protect transit pathways.'
    ],
    alive: true
  }
];

// Lazily initialize Gemini API SDK
let aiClient: GoogleGenAI | null = null;
function getAI(): GoogleGenAI | null {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (key && key !== 'MY_GEMINI_API_KEY') {
      aiClient = new GoogleGenAI({
        apiKey: key,
        httpOptions: {
          headers: {
            'User-Agent': 'aegis-nexus',
          }
        }
      });
    }
  }
  return aiClient;
}

// Generate the initial relationship matrix (neutral with some historical pairings)
function generateInitialRelationships(): RelationshipMatrix {
  const matrix: RelationshipMatrix = {};
  
  for (const fA of INITIAL_FACTIONS) {
    matrix[fA.id] = {};
    for (const fB of INITIAL_FACTIONS) {
      if (fA.id === fB.id) continue;
      
      // Defaults (Neutral, cautious)
      matrix[fA.id][fB.id] = {
        trust: 0,
        fear: 10,
        hostility: 5,
        tradeVolume: 15,
        affinity: 0,
        isAlliance: false
      };
    }
  }
  
  // Custom historical starting scenarios:
  // 1. Solaris and Zenith: Classic ideological rivalry (War of Ideals)
  matrix['solaris']['zenith'] = { trust: -30, fear: 35, hostility: 45, tradeVolume: 0, affinity: -40, isAlliance: false };
  matrix['zenith']['solaris'] = { trust: -25, fear: 50, hostility: 40, tradeVolume: 0, affinity: -40, isAlliance: false };
  
  // 2. Aurelia and Whisper: Mutually beneficial black trade
  matrix['aurelian']['whisper'] = { trust: 25, fear: 15, hostility: 0, tradeVolume: 50, affinity: 10, isAlliance: false };
  matrix['whisper']['aurelian'] = { trust: 20, fear: 12, hostility: 0, tradeVolume: 50, affinity: 10, isAlliance: false };
  
  // 3. Verdant and Nomads: Symbiotic ecological travelers
  matrix['verdant']['nomadic'] = { trust: 30, fear: 5, hostility: 0, tradeVolume: 25, affinity: 25, isAlliance: false };
  matrix['nomadic']['verdant'] = { trust: 30, fear: 5, hostility: 0, tradeVolume: 25, affinity: 25, isAlliance: false };

  // 4. Cybernetic Nexus and Radiant Union: Absolute logical vs biological rift
  matrix['cybernetic']['radiant'] = { trust: -10, fear: 25, hostility: 20, tradeVolume: 5, affinity: -50, isAlliance: false };
  matrix['radiant']['cybernetic'] = { trust: -20, fear: 40, hostility: 25, tradeVolume: 5, affinity: -50, isAlliance: false };

  return matrix;
}

// Initialize clean data state
function createDefaultData(): AllSimulationData {
  return {
    factions: INITIAL_FACTIONS,
    relationships: generateInitialRelationships(),
    memories: [
      {
        id: 'init_1',
        factionId: 'solaris',
        targetFactionId: 'zenith',
        type: 'WarDeclared',
        description: 'The ancient border dispute in Sector 7 leads to cold diplomatic hostility.',
        tick: 0,
        timestamp: new Date().toISOString(),
        emotionalWeight: 8
      },
      {
        id: 'init_2',
        factionId: 'aurelian',
        targetFactionId: 'whisper',
        type: 'TradeAgreed',
        description: 'A black-market cargo route is covertly approved to bypass outer-sector tarrifs.',
        tick: 0,
        timestamp: new Date().toISOString(),
        emotionalWeight: 5
      }
    ],
    reasoningLogs: [],
    events: [
      {
        id: 'ev_0',
        tick: 0,
        name: 'The Epoch Horizon Incident',
        description: 'A dimensional anomaly in deep space opens, introducing new mineral flows and triggering regional border expansions.',
        type: 'Breakthrough',
        affectedFactionIds: [],
        timestamp: new Date().toISOString()
      }
    ],
    state: {
      running: false,
      speed: 'normal',
      tick: 0,
      lastUpdated: new Date().toISOString(),
      autoSolveConflicts: true
    }
  };
}

// Memory persistence helpers
function loadData(): AllSimulationData {
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Error loading DB file. Re-initializing...', err);
  }
  const defaults = createDefaultData();
  saveData(defaults);
  return defaults;
}

function saveData(data: AllSimulationData): void {
  try {
    const dir = path.dirname(DB_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing DB file:', err);
  }
}

// Core simulation tick implementation
async function executeSimulationTick(): Promise<AllSimulationData> {
  const data = loadData();
  data.state.tick += 1;
  const currentTick = data.state.tick;

  // Let resources passive flux (natural growth / decay)
  for (const f of data.factions) {
    if (!f.alive) continue;
    
    // Natural population growth
    f.resources.population = Number((f.resources.population * 1.002).toFixed(1));
    
    // Trade boosts economy
    let totalTradeVolume = 0;
    let warCount = 0;
    
    for (const fB of data.factions) {
      if (fB.id === f.id || !fB.alive) continue;
      const rel = data.relationships[f.id]?.[fB.id];
      if (rel) {
        totalTradeVolume += rel.tradeVolume;
        if (rel.hostility > 75) warCount++;
      }
    }
    
    // Economy increases with trade and drops with wars
    if (totalTradeVolume > 100) f.resources.economy = Math.min(100, f.resources.economy + 1);
    if (warCount > 0) {
      f.resources.economy = Math.max(0, f.resources.economy - 2 * warCount);
      f.resources.resourceStockpile = Math.max(0, f.resources.resourceStockpile - 3 * warCount);
    } else {
      f.resources.resourceStockpile = Math.min(100, f.resources.resourceStockpile + 1);
    }
    
    // Cap resources between 0 and 100
    f.resources.economy = Math.min(100, Math.max(0, f.resources.economy));
    f.resources.military = Math.min(100, Math.max(0, f.resources.military));
    f.resources.technology = Math.min(100, Math.max(0, f.resources.technology));
    f.resources.intelligence = Math.min(100, Math.max(0, f.resources.intelligence));
    f.resources.politicalInfluence = Math.min(100, Math.max(0, f.resources.politicalInfluence));
    f.resources.resourceStockpile = Math.min(100, Math.max(0, f.resources.resourceStockpile));
  }

  // Decay memories slightly over time
  for (const mem of data.memories) {
    // Memory ages, we slightly lower emotional weight if weight is above 1
    if (mem.emotionalWeight > 1 && (currentTick - mem.tick) % 5 === 0) {
      mem.emotionalWeight = Math.max(1, mem.emotionalWeight - 1);
    }
  }

  // Random World Event (20% chance)
  if (Math.random() < 0.20) {
    triggerRandomEvent(data);
  }

  // Select 1 and possibly 2 random alive factions to execute their tactical decision
  const aliveFactions = data.factions.filter(f => f.alive);
  if (aliveFactions.length > 1) {
    // Pick 1 random alive faction to make a choice
    const actorIdx = Math.floor(Math.random() * aliveFactions.length);
    const actor = aliveFactions[actorIdx];
    await runFactionDecision(actor, data);
  }

  data.state.lastUpdated = new Date().toISOString();
  saveData(data);
  return data;
}

// Pre-packaged world events
const WORLD_EVENTS_POOL = [
  {
    name: 'Cosmic Resource Influx',
    description: 'A rogue comet consisting of hyper-dense dark matter chunks has broken up in neutral space, opening up intense scrapper exploitation.',
    type: 'Opportunity' as const,
    effect: (data: AllSimulationData, affectedIds: string[]) => {
      for (const id of affectedIds) {
        const f = data.factions.find(fc => fc.id === id);
        if (f && f.alive) f.resources.resourceStockpile = Math.min(100, f.resources.resourceStockpile + 20);
      }
    }
  },
  {
    name: 'Galactic Hyper-Inflation Spike',
    description: 'A collapse in gold backed liquidity protocols has flooded credit grids, resulting in sudden, high trade deficits.',
    type: 'Economic' as const,
    effect: (data: AllSimulationData, affectedIds: string[]) => {
      for (const f of data.factions) {
        if (f.alive) f.resources.economy = Math.max(0, f.resources.economy - 12);
      }
    }
  },
  {
    name: 'Sector Security Protocol Crack',
    description: 'A massive intelligence breach leaks black operations logs from multiple sectors, exposing hidden spies!',
    type: 'Political' as const,
    effect: (data: AllSimulationData, affectedIds: string[]) => {
      // Degrade trust between all factions by 15-25 points!
      for (const idA in data.relationships) {
        for (const idB in data.relationships[idA]) {
          const rel = data.relationships[idA][idB];
          rel.trust = Math.max(-100, rel.trust - Math.floor(Math.random() * 15 + 10));
        }
      }
    }
  },
  {
    name: 'Supernova Gamma Flare',
    description: 'A nearby class-O star bursts into a radioactive solar storm, wreaking structural chaos in regional sectors.',
    type: 'Disaster' as const,
    effect: (data: AllSimulationData, affectedIds: string[]) => {
      for (const id of affectedIds) {
        const f = data.factions.find(fc => fc.id === id);
        if (f && f.alive) {
          f.resources.military = Math.max(0, f.resources.military - 15);
          f.resources.economy = Math.max(0, f.resources.economy - 10);
        }
      }
    }
  },
  {
    name: 'Singularity Drift Discovery',
    description: 'An abandoned Precursor research barge loaded with quantum logic modules has been salvaged.',
    type: 'Breakthrough' as const,
    effect: (data: AllSimulationData, affectedIds: string[]) => {
      for (const id of affectedIds) {
        const f = data.factions.find(fc => fc.id === id);
        if (f && f.alive) f.resources.technology = Math.min(100, f.resources.technology + 25);
      }
    }
  }
];

function triggerRandomEvent(data: AllSimulationData, customEventPreset?: typeof WORLD_EVENTS_POOL[0]) {
  const currentTick = data.state.tick;
  const aliveFactions = data.factions.filter(f => f.alive);
  if (aliveFactions.length === 0) return;

  const eventTemplate = customEventPreset || WORLD_EVENTS_POOL[Math.floor(Math.random() * WORLD_EVENTS_POOL.length)];
  
  // Pick 1 to 3 random affected factions
  const numAffected = Math.min(aliveFactions.length, Math.floor(Math.random() * 3) + 1);
  const shuffled = [...aliveFactions].sort(() => 0.5 - Math.random());
  const affected = shuffled.slice(0, numAffected);
  const affectedIds = affected.map(af => af.id);

  // Execute custom effects
  eventTemplate.effect(data, affectedIds);

  const affectedNames = affected.map(af => af.name).join(', ');
  const eventDesc = `${eventTemplate.description} Affected: ${affectedNames || 'Interlaced star sectors'}.`;

  const newEvent: WorldEvent = {
    id: `ev_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    tick: currentTick,
    name: eventTemplate.name,
    description: eventDesc,
    type: eventTemplate.type,
    affectedFactionIds: affectedIds,
    timestamp: new Date().toISOString()
  };

  data.events.unshift(newEvent);

  // Log in memories of affected factions
  for (const f of affected) {
    data.memories.unshift({
      id: `mem_ev_${Date.now()}_${f.id}`,
      factionId: f.id,
      type: eventTemplate.type === 'Disaster' ? 'ResourceConflict' : 'AidReceived',
      description: `We survived the regional event: ${eventTemplate.name}.`,
      tick: currentTick,
      timestamp: new Date().toISOString(),
      emotionalWeight: 4
    });
  }
}

// Cooldown tracker to stay below free tier limit of 5 requests per minute (spaced 12s+ apart)
let lastGeminiCallTimestamp = 0;
let geminiQuotaExceeded = false;

// Helper to call Gemini with robust exponential backoff.
// Retries on transient errors like 503 (service unavailable) or 429 (rate limits)
async function generateContentWithRetry(
  ai: GoogleGenAI,
  params: any,
  maxRetries = 2,
  initialDelay = 1000
): Promise<any> {
  let attempt = 0;
  while (true) {
    try {
      if (geminiQuotaExceeded) {
        throw new Error('PLANETARY_ADVISORS_ACTIVE: Under stand-by tactical routing.');
      }
      return await ai.models.generateContent(params);
    } catch (err: any) {
      const status = err.status || err.code || (err.error && err.error.code);
      const errorMsg = err instanceof Error ? err.message : (typeof err === 'object' ? JSON.stringify(err) : String(err));
      
      const isQuota = errorMsg.includes('quota') || 
                      errorMsg.includes('RESOURCE_EXHAUSTED') ||
                      errorMsg.includes('rate limit') ||
                      errorMsg.includes('429') ||
                      errorMsg.includes('limit: 20') ||
                      errorMsg.includes('exceeded your current quota') ||
                      status === 429 ||
                      (err.error && (err.error.code === 429 || String(err.error.message).includes('quota')));

      if (isQuota) {
        geminiQuotaExceeded = true;
        console.log('[Status Safeguard] Satellite transmission capacity limit detected. Safely enabling planetary advisor framework.');
        throw new Error('PLANETARY_ADVISORS_ACTIVE');
      }

      attempt++;
      const isTransient = status === 503 || 
                          (err.message && (err.message.includes('503') || err.message.includes('UNAVAILABLE') || err.message.includes('temporary') || err.message.includes('demand')));
      
      if (isTransient && attempt <= maxRetries) {
        const delay = initialDelay * Math.pow(1.8, attempt) + Math.random() * 300;
        console.log(`[Status Safeguard] Satellite transmission delayed (status: ${status || 'latency'}). Rescheduling in ${Math.round(delay)}ms (Attempt ${attempt}/${maxRetries}).`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      throw err;
    }
  }
}

// Simulate AI Action via Gemini or locally if AI key not configured
async function runFactionDecision(actor: Faction, data: AllSimulationData): Promise<void> {
  const currentTick = data.state.tick;
  const otherFactions = data.factions.filter(f => f.id !== actor.id && f.alive);
  if (otherFactions.length === 0) return;

  const factionRelationships = data.relationships[actor.id] || {};
  const recentMemories = data.memories
    .filter(mem => mem.factionId === actor.id || mem.targetFactionId === actor.id)
    .slice(0, 10);

  let goalEvaluating = '';
  let situationalAnalysis = '';
  let selectedAction: StrategicActionType = 'boost_economy';
  let targetFactionId = '';
  let strategicReasoning = '';
  let outcomeDescription = '';

  const ai = getAI();
  const now = Date.now();
  const coolingPeriod = 14000; // 14s minimum cooldown between active calls
  let useFallback = true;
  let cooldownReason = '';

  if (ai && !geminiQuotaExceeded) {
    if (now - lastGeminiCallTimestamp >= coolingPeriod) {
      lastGeminiCallTimestamp = now;
      try {
        // Craft high quality prompt for Gemini
        const prompt = `
You are the Strategic Mind of the galactic faction: "${actor.name}" (ID: "${actor.id}").
Your government type is: "${actor.government}", your ideology is: "${actor.ideology}", your strategic doctrine is "${actor.doctrine}".
Your personality: ${actor.personality}

Your current Resources:
- Economy: ${actor.resources.economy}/100
- Population: ${actor.resources.population}M
- Military: ${actor.resources.military}/100
- Technology: ${actor.resources.technology}/100
- Intelligence: ${actor.resources.intelligence}/100
- Political Influence: ${actor.resources.politicalInfluence}/100
- Resource Stockpiles: ${actor.resources.resourceStockpile}/100

Your dynamic long-term goals is:
${actor.goals.map((g, i) => `${i+1}. ${g}`).join('\n')}

The other alive factions in the galaxy are:
${otherFactions.map(f => {
  const rel = factionRelationships[f.id] || { trust: 0, fear: 10, hostility: 5, tradeVolume: 15, affinity: 0, isAlliance: false };
  return `- "${f.name}" (ID: "${f.id}"):
    * Resources: Economy ${f.resources.economy}, Military ${f.resources.military}, Technology ${f.resources.technology}, Political Influence ${f.resources.politicalInfluence}
    * Relationships with them: Trust=${rel.trust}, Fear=${rel.fear}, Hostility=${rel.hostility}, Trade Volume=${rel.tradeVolume}, Ideological Affinity=${rel.affinity}, Active Alliance=${rel.isAlliance}`;
}).join('\n')}

Your faction's direct memories & historical grievances:
${recentMemories.map(m => `* Tick ${m.tick}: Faction ${m.factionId} -> ${m.targetFactionId || 'Self'}: ${m.type} - ${m.description} (Urgency: ${m.emotionalWeight})`).join('\n')}

Based on your goals and environment context, pick EXACTLY ONE strategic action of the following permitted action IDs:
- 'form_alliance' (Target is required. Requires Trust > 15 to form. Mutual protection net.)
- 'break_alliance' (Target is required. Dissolves alliance. Trust drops, hostility rises.)
- 'negotiate_trade' (Target is required. Boosts mutual trade volume and resources.)
- 'impose_sanctions' (Target is required. Punishes rival economically, drops trade to 0, hostility rises.)
- 'intelligence_espionage' (Target is required. High-stakes spy infiltration to steal tech.)
- 'declare_war' (Target is required. Initiates conflict simulation immediately.)
- 'negotiate_peace' (Target is required. Subdues warfare, drops hostility to baseline.)
- 'request_aid' (Target is required. Asks ally or high trust faction for economic resources.)
- 'strengthen_military' (Self action, targets none. Upgrades Military strength.)
- 'invest_technology' (Self action, targets none. Upgrades Technology level.)
- 'boost_economy' (Self action, targets none. Upgrades Economy resource.)
- 'consolidate_power' (Self action, targets none. Upgrades Political Influence.)

Do not act out-of-character! For example, Aurelian Syndicate is commercial, Solaris is warmongering, Verdant is harmonious, Obsidian is highly covert.

You MUST respond with valid JSON matching this schema:
\`\`\`json
{
  "goalEvaluating": "Short title of the goal you are addressing",
  "situationalAnalysis": "Analysis sentence outlining options",
  "selectedAction": "One of the permitted action IDs listed above",
  "targetFactionId": "ID string of the target faction (or empty for self-actions)",
  "strategicReasoning": " ENGAGING sci-fi inner monologue explaining why this action is chosen based on motives, fears, historical memories, and long term gain.",
  "outcomeDescription": "Our official proclamation or state announcment of this action."
}
\`\`\`
`;

        const response = await generateContentWithRetry(ai, {
          model: 'gemini-3.5-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                goalEvaluating: { type: Type.STRING },
                situationalAnalysis: { type: Type.STRING },
                selectedAction: { type: Type.STRING },
                targetFactionId: { type: Type.STRING },
                strategicReasoning: { type: Type.STRING },
                outcomeDescription: { type: Type.STRING }
              },
              required: ['goalEvaluating', 'situationalAnalysis', 'selectedAction', 'strategicReasoning', 'outcomeDescription']
            }
          }
        });

        const resText = response.text || '{}';
        const parsed = JSON.parse(resText.trim());
        
        goalEvaluating = parsed.goalEvaluating || '';
        situationalAnalysis = parsed.situationalAnalysis || '';
        selectedAction = parsed.selectedAction as StrategicActionType;
        targetFactionId = parsed.targetFactionId || '';
        strategicReasoning = parsed.strategicReasoning || '';
        outcomeDescription = parsed.outcomeDescription || '';
        useFallback = false;

      } catch (err: any) {
        const errorMsg = err instanceof Error ? err.message : (typeof err === 'object' ? JSON.stringify(err) : String(err));
        
        const isQuota = errorMsg.includes('PLANETARY_ADVISORS_ACTIVE') ||
                        errorMsg.includes('429') || 
                        errorMsg.includes('quota') || 
                        errorMsg.includes('RESOURCE_EXHAUSTED') ||
                        err.status === 429 ||
                        (err.error && (err.error.code === 429 || String(err.error.message).includes('quota')));
        
        if (isQuota) {
          geminiQuotaExceeded = true;
          console.log('[Status Notification] Satellite transmission standby: engaged standby planetary advisors.');
          cooldownReason = 'quota exhausted';
        } else {
          console.log('[Status Notification] Secondary satellite coverage engaged.');
          cooldownReason = 'telemetry blackout';
        }
      }
    } else {
      const remainingSecs = Number(((coolingPeriod - (now - lastGeminiCallTimestamp)) / 1000).toFixed(1));
      console.log(`[Rate Limit Safeguard] Gemini API under cooldown (${remainingSecs}s left) to protect quota. Directing local advisor simulation.`);
      cooldownReason = 'cooldown active';
    }
  } else if (ai && geminiQuotaExceeded) {
    cooldownReason = 'quota exhausted';
  }

  if (useFallback) {
    // Fallback local heuristic generator if Gemini has issues, is offline, or is cooling down so simulation remains flawlessly stable
    const fallback = generateFallbackAction(actor, otherFactions, factionRelationships);
    goalEvaluating = fallback.goalEvaluating;
    let fallbackMsg = 'Standard solar computer system calculations are active.';
    if (ai) {
      if (cooldownReason === 'quota exhausted') {
        fallbackMsg = 'Quantum network quota exceeded. Standby advisor simulation enabled.';
      } else if (cooldownReason === 'cooldown active') {
        fallbackMsg = 'Quantum satellite buffer active (cooldown). Primary logic override.';
      } else {
        fallbackMsg = 'Quantum intelligence satellite blackout. Primary logic override.';
      }
    }
    situationalAnalysis = fallbackMsg;
    selectedAction = fallback.selectedAction;
    targetFactionId = fallback.targetFactionId;
    strategicReasoning = fallback.strategicReasoning;
    outcomeDescription = fallback.outcomeDescription;
  }

  // Double-verify target exists and is alive
  if (targetFactionId && targetFactionId !== actor.id) {
    const targetFaction = data.factions.find(f => f.id === targetFactionId);
    if (!targetFaction || !targetFaction.alive) {
      // Re-route to self economic boost if target is dead
      selectedAction = 'boost_economy';
      targetFactionId = '';
      outcomeDescription = `Focusing internal processing nodes to reinforce solar grids.`;
    }
  } else {
    targetFactionId = ''; // Clear bogus actions
  }

  // Execute Action Effects
  let eventText = `${actor.flagEmoji} **${actor.name}**: ${outcomeDescription}`;
  const targetFactionName = targetFactionId ? (data.factions.find(f => f.id === targetFactionId)?.name || '') : '';

  switch (selectedAction) {
    case 'form_alliance': {
      const relA = data.relationships[actor.id][targetFactionId];
      const relB = data.relationships[targetFactionId][actor.id];
      // Check if target is friendly enough
      if (relB.trust > 10 || relB.affinity > 10) {
        relA.isAlliance = true;
        relB.isAlliance = true;
        relA.trust = Math.min(100, relA.trust + 35);
        relB.trust = Math.min(100, relB.trust + 35);
        relA.hostility = 0;
        relB.hostility = 0;
        
        eventText = `🤝 **Grand Alliance Signed**: ${actor.name} and ${targetFactionName} form a strategic defense pact!`;
        data.memories.unshift({
          id: `mem_all_${Date.now()}`,
          factionId: actor.id,
          targetFactionId,
          type: 'AllianceFormed',
          description: `Formed a major military protection alliance with ${targetFactionName}.`,
          tick: currentTick,
          timestamp: new Date().toISOString(),
          emotionalWeight: 10
        });
        data.memories.unshift({
          id: `mem_allB_${Date.now()}`,
          factionId: targetFactionId,
          targetFactionId: actor.id,
          type: 'AllianceFormed',
          description: `Acquiesced to a major mutual alliance with ${actor.name}.`,
          tick: currentTick,
          timestamp: new Date().toISOString(),
          emotionalWeight: 10
        });
      } else {
        // Declined!
        relA.trust = Math.max(-100, relA.trust - 15);
        eventText = `❌ **Alliance Offer Rejected**: ${actor.name} proposed an alliance with ${targetFactionName}, but their diplomats declined due to mutual caution.`;
        data.memories.unshift({
          id: `mem_allReject_${Date.now()}`,
          factionId: actor.id,
          targetFactionId,
          type: 'DiplomaticThreat',
          description: `Target ${targetFactionName} publicly rejected our diplomatic alliance initiative.`,
          tick: currentTick,
          timestamp: new Date().toISOString(),
          emotionalWeight: 6
        });
      }
      break;
    }

    case 'break_alliance': {
      const relA = data.relationships[actor.id][targetFactionId];
      const relB = data.relationships[targetFactionId][actor.id];
      relA.isAlliance = false;
      relB.isAlliance = false;
      relA.trust = Math.max(-100, relA.trust - 45);
      relB.trust = Math.max(-100, relB.trust - 45);
      relA.hostility = Math.min(100, relA.hostility + 30);
      relB.hostility = Math.min(100, relB.hostility + 30);

      eventText = `💔 **Alliance Dissolved**: ${actor.name} unilaterally withdraws from their planetary defense pact with ${targetFactionName}!`;
      data.memories.unshift({
        id: `mem_break_${Date.now()}`,
        factionId: actor.id,
        targetFactionId,
        type: 'AllianceBroken',
        description: `We dissolved our military alliance with ${targetFactionName} due to strategic friction.`,
        tick: currentTick,
        timestamp: new Date().toISOString(),
        emotionalWeight: 9
      });
      data.memories.unshift({
        id: `mem_breakB_${Date.now()}`,
        factionId: targetFactionId,
        targetFactionId: actor.id,
        type: 'AllianceBroken',
        description: `${actor.name} betrayed our diplomatic trust and broke our mutual alliance!`,
        tick: currentTick,
        timestamp: new Date().toISOString(),
        emotionalWeight: 10
      });
      break;
    }

    case 'negotiate_trade': {
      const relA = data.relationships[actor.id][targetFactionId];
      const relB = data.relationships[targetFactionId][actor.id];
      relA.tradeVolume = Math.min(100, relA.tradeVolume + 25);
      relB.tradeVolume = Math.min(100, relB.tradeVolume + 25);
      relA.trust = Math.min(100, relA.trust + 15);
      relB.trust = Math.min(100, relB.trust + 15);
      
      // Both get economy bonuses!
      actor.resources.economy = Math.min(100, actor.resources.economy + 4);
      const target = data.factions.find(f => f.id === targetFactionId);
      if (target) target.resources.economy = Math.min(100, target.resources.economy + 4);

      eventText = `🪙 **Trade Pact Sealed**: ${actor.name} expands cargo and technology trades with ${targetFactionName}, boosting both interstellar economies.`;
      data.memories.unshift({
        id: `mem_tr_${Date.now()}`,
        factionId: actor.id,
        targetFactionId,
        type: 'TradeAgreed',
        description: `Negotiated beneficial mineral exchanges and trade routes with ${targetFactionName}.`,
        tick: currentTick,
        timestamp: new Date().toISOString(),
        emotionalWeight: 5
      });
      break;
    }

    case 'impose_sanctions': {
      const relA = data.relationships[actor.id][targetFactionId];
      const relB = data.relationships[targetFactionId][actor.id];
      relA.tradeVolume = 0;
      relB.tradeVolume = 0;
      relA.trust = Math.max(-100, relA.trust - 25);
      relB.trust = Math.max(-100, relB.trust - 25);
      relA.hostility = Math.min(100, relA.hostility + 20);
      relB.hostility = Math.min(100, relB.hostility + 20);

      // Drops economies
      const target = data.factions.find(f => f.id === targetFactionId);
      if (target) target.resources.economy = Math.max(0, target.resources.economy - 8);
      actor.resources.economy = Math.max(0, actor.resources.economy - 2);

      eventText = `🚫 **Economic Sanctions**: ${actor.name} declares a trade embargo against ${targetFactionName} following political friction.`;
      data.memories.unshift({
        id: `mem_sanc_${Date.now()}`,
        factionId: actor.id,
        targetFactionId,
        type: 'TradeSanctioned',
        description: `Imposed comprehensive economic and cargo grid sanctions on ${targetFactionName}.`,
        tick: currentTick,
        timestamp: new Date().toISOString(),
        emotionalWeight: 6
      });
      data.memories.unshift({
        id: `mem_sancB_${Date.now()}`,
        factionId: targetFactionId,
        targetFactionId: actor.id,
        type: 'TradeSanctioned',
        description: `${actor.name} blackballed our traders and declared heavy sanctions on us!`,
        tick: currentTick,
        timestamp: new Date().toISOString(),
        emotionalWeight: 7
      });
      break;
    }

    case 'intelligence_espionage': {
      const target = data.factions.find(f => f.id === targetFactionId);
      if (target) {
        const actorIntel = actor.resources.intelligence + Math.floor(Math.random() * 20);
        const targetIntel = target.resources.intelligence + Math.floor(Math.random() * 20);
        
        if (actorIntel > targetIntel) {
          // Success!
          actor.resources.intelligence = Math.min(100, actor.resources.intelligence + 6);
          target.resources.intelligence = Math.max(0, target.resources.intelligence - 4);
          // Steal technology
          const stolenTech = Math.min(10, Math.floor(target.resources.technology * 0.1));
          target.resources.technology = Math.max(0, target.resources.technology - stolenTech);
          actor.resources.technology = Math.min(100, actor.resources.technology + stolenTech);
          
          eventText = `🕵️ **Espionage Infiltration**: Internal cyber audits hint at critical blueprints stolen from ${targetFactionName}. The actor remains unidentified by general consensus.`;
          data.memories.unshift({
            id: `mem_spyS_${Date.now()}`,
            factionId: actor.id,
            targetFactionId,
            type: 'SabotageEvent',
            description: `Successfully bypassed security core and copied technological schemas from ${targetFactionName}.`,
            tick: currentTick,
            timestamp: new Date().toISOString(),
            emotionalWeight: 5
          });
        } else {
          // Caught red handed!
          const relA = data.relationships[actor.id][targetFactionId];
          const relB = data.relationships[targetFactionId][actor.id];
          relA.trust = Math.max(-100, relA.trust - 45);
          relB.trust = Math.max(-100, relB.trust - 55);
          relB.hostility = Math.min(100, relB.hostility + 40);
          
          eventText = `🚨 **Spy Ring Captured**: ${targetFactionName} counter-intelligence officers capture an covert sabotage group traced directly to ${actor.name}! Tension spikes!`;
          data.memories.unshift({
            id: `mem_spyF_${Date.now()}`,
            factionId: actor.id,
            targetFactionId,
            type: 'SpyCaught',
            description: `Covert operative ring was intercepted and compromised by ${targetFactionName} counter-spies.`,
            tick: currentTick,
            timestamp: new Date().toISOString(),
            emotionalWeight: 8
          });
          data.memories.unshift({
            id: `mem_spyFB_${Date.now()}`,
            factionId: targetFactionId,
            targetFactionId: actor.id,
            type: 'SpyCaught',
            description: `Caught agents from ${actor.name} attempting to hack our technological cores! Infuriating breach.`,
            tick: currentTick,
            timestamp: new Date().toISOString(),
            emotionalWeight: 9
          });
        }
      }
      break;
    }

    case 'declare_war': {
      const relA = data.relationships[actor.id][targetFactionId];
      const relB = data.relationships[targetFactionId][actor.id];
      relA.hostility = 95;
      relB.hostility = 95;
      relA.trust = Math.max(-100, relA.trust - 65);
      relB.trust = Math.max(-100, relB.trust - 65);
      relA.tradeVolume = 0;
      relB.tradeVolume = 0;

      eventText = `💥 **WAR DECLARED**: ${actor.name} deploys war ships to borders and declares war on ${targetFactionName}! Galactic markets shutter!`;
      data.memories.unshift({
        id: `mem_war_${Date.now()}`,
        factionId: actor.id,
        targetFactionId,
        type: 'WarDeclared',
        description: `We declared war on ${targetFactionName} to enforce planetary sovereignty!`,
        tick: currentTick,
        timestamp: new Date().toISOString(),
        emotionalWeight: 10
      });
      data.memories.unshift({
        id: `mem_warB_${Date.now()}`,
        factionId: targetFactionId,
        targetFactionId: actor.id,
        type: 'WarDeclared',
        description: `${actor.name} launched a surprise war offensive on our sovereign star ports! Mobilizing defense grids!`,
        tick: currentTick,
        timestamp: new Date().toISOString(),
        emotionalWeight: 10
      });

      // Execute conflict simulation immediately
      resolveWarConflict(actor, targetFactionId, data);
      break;
    }

    case 'negotiate_peace': {
      const relA = data.relationships[actor.id][targetFactionId];
      const relB = data.relationships[targetFactionId][actor.id];
      
      // If of high exhaustion or mutual defense desires, sign
      relA.hostility = 10;
      relB.hostility = 10;
      relA.trust = Math.min(100, relA.trust + 20);
      relB.trust = Math.min(100, relB.trust + 20);

      eventText = `🕊️ **Peace Treaty Signed**: Following exhaustion on both sides, ${actor.name} and ${targetFactionName} sign a lasting peace armistice.`;
      data.memories.unshift({
        id: `mem_peace_${Date.now()}`,
        factionId: actor.id,
        targetFactionId,
        type: 'PeaceTreaty',
        description: `Signed an essential peace resolution to freeze combat frontiers with ${targetFactionName}.`,
        tick: currentTick,
        timestamp: new Date().toISOString(),
        emotionalWeight: 8
      });
      data.memories.unshift({
        id: `mem_peaceB_${Date.now()}`,
        factionId: targetFactionId,
        targetFactionId: actor.id,
        type: 'PeaceTreaty',
        description: `Ratified the armistice treaty with ${actor.name}. Rebuilding destroyed sectors.`,
        tick: currentTick,
        timestamp: new Date().toISOString(),
        emotionalWeight: 8
      });
      break;
    }

    case 'request_aid': {
      const relA = data.relationships[actor.id][targetFactionId];
      const relB = data.relationships[targetFactionId][actor.id];
      const target = data.factions.find(f => f.id === targetFactionId);

      if (target && (relB.isAlliance || relB.trust > 25)) {
        // Aid approved!
        actor.resources.economy = Math.min(100, actor.resources.economy + 10);
        actor.resources.resourceStockpile = Math.min(100, actor.resources.resourceStockpile + 10);
        target.resources.resourceStockpile = Math.max(0, target.resources.resourceStockpile - 8);
        target.resources.economy = Math.max(0, target.resources.economy - 4);
        relA.trust = Math.min(100, relA.trust + 25);
        relB.trust = Math.min(100, relB.trust + 15);

        eventText = `📦 **Stellar Aid Received**: ${targetFactionName} responds to emergency appeals, dispatching logistics ships laden with mineral stockpiles to ${actor.name}.`;
        data.memories.unshift({
          id: `mem_aid_${Date.now()}`,
          factionId: actor.id,
          targetFactionId,
          type: 'AidReceived',
          description: `Received crucial economic and fuel shipments from ${targetFactionName}.`,
          tick: currentTick,
          timestamp: new Date().toISOString(),
          emotionalWeight: 7
        });
      } else {
        // Aid Refused
        relA.trust = Math.max(-100, relA.trust - 15);
        eventText = `⚠️ **Emergency Aid Denied**: ${actor.name} petitioned ${targetFactionName} for crisis aid materials, but their request was flatly ignored.`;
        data.memories.unshift({
          id: `mem_aidFail_${Date.now()}`,
          factionId: actor.id,
          targetFactionId,
          type: 'DiplomaticThreat',
          description: `${targetFactionName} cold-shouldered us and rejected our emergency cargo aid appeals.`,
          tick: currentTick,
          timestamp: new Date().toISOString(),
          emotionalWeight: 5
        });
      }
      break;
    }

    case 'strengthen_military': {
      actor.resources.military = Math.min(100, actor.resources.military + 12);
      actor.resources.resourceStockpile = Math.max(0, actor.resources.resourceStockpile - 5);
      actor.resources.economy = Math.max(0, actor.resources.economy - 4);
      break;
    }

    case 'invest_technology': {
      actor.resources.technology = Math.min(100, actor.resources.technology + 12);
      actor.resources.economy = Math.max(0, actor.resources.economy - 6);
      break;
    }

    case 'boost_economy': {
      actor.resources.economy = Math.min(100, actor.resources.economy + 15);
      actor.resources.resourceStockpile = Math.max(0, actor.resources.resourceStockpile - 5);
      break;
    }

    case 'consolidate_power': {
      actor.resources.politicalInfluence = Math.min(100, actor.resources.politicalInfluence + 15);
      actor.resources.intelligence = Math.min(100, actor.resources.intelligence + 4);
      break;
    }
  }

  // Record reasoning for analytics
  const log: ReasoningLog = {
    id: `log_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    factionId: actor.id,
    tick: currentTick,
    goalEvaluating,
    situationalAnalysis,
    selectedAction,
    targetFactionId: targetFactionId || undefined,
    strategicReasoning,
    outcomeDescription,
    timestamp: new Date().toISOString()
  };

  data.reasoningLogs.unshift(log);

  // Add event to primary timeline
  data.events.unshift({
    id: `ev_act_${Date.now()}`,
    tick: currentTick,
    name: selectedAction.replace('_', ' ').toUpperCase(),
    description: eventText,
    type: 'Military',
    affectedFactionIds: targetFactionId ? [actor.id, targetFactionId] : [actor.id],
    timestamp: new Date().toISOString()
  });
}

function resolveWarConflict(actor: Faction, defenderId: string, data: AllSimulationData): void {
  const currentTick = data.state.tick;
  const defender = data.factions.find(f => f.id === defenderId);
  if (!defender) return;

  // Allies join battle forces!
  let actorAlliesPower = 0;
  let defenderAlliesPower = 0;

  const actorAllies: string[] = [];
  const defenderAllies: string[] = [];

  for (const f of data.factions) {
    if (!f.alive || f.id === actor.id || f.id === defenderId) continue;
    
    // Actor Ally assist
    if (data.relationships[actor.id][f.id]?.isAlliance && !data.relationships[f.id][defenderId]?.isAlliance) {
      actorAlliesPower += f.resources.military * 0.20;
      actorAllies.push(f.name);
    }
    // Defender Ally assist
    if (data.relationships[defenderId][f.id]?.isAlliance && !data.relationships[f.id][actor.id]?.isAlliance) {
      defenderAlliesPower += f.resources.military * 0.20;
      defenderAllies.push(f.name);
    }
  }

  // Core Combat Equations
  const baseActorPower = actor.resources.military * 1.0 + actor.resources.technology * 0.4 + actor.resources.resourceStockpile * 0.2 + actorAlliesPower;
  const baseDefenderPower = defender.resources.military * 1.15 + defender.resources.technology * 0.4 + defender.resources.resourceStockpile * 0.2 + defenderAlliesPower; // defender fortification bonus included

  const randFactorA = Math.random() * 30 - 15;
  const randFactorD = Math.random() * 30 - 15;

  const finalPowerA = baseActorPower + randFactorA;
  const finalPowerD = baseDefenderPower + randFactorD;

  let battleDesc = '';
  // Out-turns
  if (finalPowerA > finalPowerD + 15) {
    // Decisive Attacker Victory
    const popSlashed = Math.floor(defender.resources.population * 0.15);
    const codeSlashed = Math.floor(defender.resources.economy * 0.20);
    
    defender.resources.population = Math.max(5, defender.resources.population - popSlashed);
    defender.resources.economy = Math.max(0, defender.resources.economy - codeSlashed);
    defender.resources.military = Math.max(0, defender.resources.military - 25);
    
    actor.resources.population = Number((actor.resources.population + popSlashed * 0.5).toFixed(1));
    actor.resources.economy = Math.min(100, actor.resources.economy + Math.floor(codeSlashed * 0.7));
    actor.resources.military = Math.max(0, actor.resources.military - 12);

    battleDesc = `🏆 **Attacker Victory**: ${actor.name} completely overwhelms ${defender.name}'s perimeter grids. Conquered sectors swell Solaris populations and strip core factories. `;
    if (actorAllies.length > 0) battleDesc += `Attacking coalition supported by: ${actorAllies.join(', ')}. `;
    
    // Check for defeat
    if (defender.resources.population <= 5 || (defender.resources.military <= 5 && defender.resources.economy <= 5)) {
      defender.alive = false;
      defender.defeatedBy = actor.name;
      battleDesc += `💀 **CRITICAL COLLAPSE**: ${defender.name} has been annexed and purged from the stellar core maps!`;
    }
  } else if (finalPowerD > finalPowerA + 15) {
    // Decisive Defender Victory
    actor.resources.military = Math.max(0, actor.resources.military - 25);
    actor.resources.economy = Math.max(0, actor.resources.economy - 15);
    defender.resources.military = Math.max(0, defender.resources.military - 10);
    
    battleDesc = `🛡️ **Defenders Secure Perimeter**: ${defender.name} uses fortified orbital batteries to shatter the advancing offensive fleets. ${actor.name} retreats with massive hull wreckage. `;
    if (defenderAllies.length > 0) battleDesc += `Defensive coalition supported by: ${defenderAllies.join(', ')}. `;
  } else {
    // Mutual grinding disaster
    actor.resources.military = Math.max(0, actor.resources.military - 18);
    actor.resources.economy = Math.max(0, actor.resources.economy - 10);
    defender.resources.military = Math.max(0, defender.resources.military - 18);
    defender.resources.economy = Math.max(0, defender.resources.economy - 10);

    battleDesc = `💥 **Indecisive Grinding Combat**: Battle groups clash in high radiation trade zones. Both fleets take severe collateral damage with no territorial gains.`;
  }

  // Append Battle log to Timeline
  data.events.unshift({
    id: `battle_${Date.now()}`,
    tick: currentTick,
    name: 'SECTOR WEAPONS DISCHARGE',
    description: battleDesc,
    type: 'Military',
    affectedFactionIds: [actor.id, defenderId, ...actorAllies, ...defenderAllies],
    timestamp: new Date().toISOString()
  });
}

function generateFallbackAction(actor: Faction, otherFactions: Faction[], factionRelationships: Record<string, any>): any {
  // Simple rule based behavior matching personalities
  const randTarget = otherFactions[Math.floor(Math.random() * otherFactions.length)];
  const rel = factionRelationships[randTarget.id] || { trust: 0, fear: 10, hostility: 5, tradeVolume: 15, affinity: 0, isAlliance: false };

  if (actor.doctrine === 'Militaristic' && rel.hostility > 40) {
    return {
      goalEvaluating: 'Asserting spatial hegemony.',
      selectedAction: 'declare_war',
      targetFactionId: randTarget.id,
      strategicReasoning: `Local scanning reports high threat level with ${randTarget.name}. Peace protocols are logically flawed. Deployment of cruisers initiated.`,
      outcomeDescription: 'Armed skirmish vessels deployed to defensive frontiers.'
    };
  }

  if (actor.doctrine === 'Diplomatic' && !rel.isAlliance && rel.trust > 15) {
    return {
      goalEvaluating: 'Encircling regional zones in grand federations.',
      selectedAction: 'form_alliance',
      targetFactionId: randTarget.id,
      strategicReasoning: `To combat mounting global instability, a mutual defense pact with ${randTarget.name} meets our core peacekeeping protocols.`,
      outcomeDescription: 'Proposed a permanent planetary defense alliance.'
    };
  }

  if (actor.doctrine === 'Opportunistic' && rel.tradeVolume < 40) {
    return {
      goalEvaluating: 'Expanding transaction indices.',
      selectedAction: 'negotiate_trade',
      targetFactionId: randTarget.id,
      strategicReasoning: `${randTarget.name} possesses industrial surpluses. Commercial trade routes yield considerable liquidity credits.`,
      outcomeDescription: 'Signed cargo trading network expansions.'
    };
  }

  // Self improvements as fallback
  const upgradeChoice = Math.random();
  if (upgradeChoice < 0.3) {
    return {
      goalEvaluating: 'Consolidating treasury.',
      selectedAction: 'boost_economy',
      targetFactionId: '',
      strategicReasoning: 'Refining secondary refinery hubs to guarantee steady credit flows.',
      outcomeDescription: 'Expanded mineral processing modules.'
    };
  } else if (upgradeChoice < 0.6) {
    return {
      goalEvaluating: 'Shielding sovereign systems.',
      selectedAction: 'strengthen_military',
      targetFactionId: '',
      strategicReasoning: 'Shattering external scanning rays requires expanding our perimeter dreadnought count.',
      outcomeDescription: 'Upgraded dreadnought assemblies.'
    };
  } else {
    return {
      goalEvaluating: 'Accelerating laboratory grids.',
      selectedAction: 'invest_technology',
      targetFactionId: '',
      strategicReasoning: 'Rethinking hyperdrive research nodes will give our logistics grid the ultimate tactical advantage.',
      outcomeDescription: 'Synchronized experimental technology matrixes.'
    };
  }
}

// REST APIs
app.get('/api/simulation/state', (req, res) => {
  const data = loadData();
  res.json({
    tick: data.state.tick,
    running: data.state.running,
    speed: data.state.speed,
    lastUpdated: data.state.lastUpdated,
    autoSolveConflicts: data.state.autoSolveConflicts,
    totalFactions: data.factions.length,
    activeFactions: data.factions.filter(f => f.alive).length,
    geminiQuotaExceeded: geminiQuotaExceeded
  });
});

app.post('/api/simulation/start', (req, res) => {
  const data = loadData();
  data.state.running = true;
  saveData(data);
  ensureLoopRunning(data.state.speed);
  res.json({ status: 'started', speed: data.state.speed });
});

app.post('/api/simulation/pause', (req, res) => {
  const data = loadData();
  data.state.running = false;
  saveData(data);
  stopLoop();
  res.json({ status: 'paused' });
});

app.post('/api/simulation/speed', (req, res) => {
  const { speed } = req.body;
  const data = loadData();
  data.state.speed = speed;
  saveData(data);
  if (data.state.running) {
    ensureLoopRunning(speed);
  }
  res.json({ status: 'speed_updated', speed });
});

app.post('/api/simulation/tick', async (req, res) => {
  try {
    const updated = await executeSimulationTick();
    res.json({ status: 'ticked', tick: updated.state.tick });
  } catch (err) {
    res.status(500).json({ error: 'Tick failed' });
  }
});

app.post('/api/simulation/reset', (req, res) => {
  geminiQuotaExceeded = false;
  const defaults = createDefaultData();
  saveData(defaults);
  if (defaults.state.running) {
    ensureLoopRunning(defaults.state.speed);
  } else {
    stopLoop();
  }
  res.json({ status: 'reset_completed' });
});

app.get('/api/simulation/factions', (req, res) => {
  const data = loadData();
  res.json(data.factions);
});

app.get('/api/simulation/relationships', (req, res) => {
  const data = loadData();
  res.json(data.relationships);
});

app.get('/api/simulation/memories', (req, res) => {
  const data = loadData();
  res.json(data.memories);
});

app.get('/api/simulation/reasoning', (req, res) => {
  const data = loadData();
  res.json(data.reasoningLogs);
});

app.get('/api/simulation/events', (req, res) => {
  const data = loadData();
  res.json(data.events);
});

// Let user inject custom chaos
app.post('/api/simulation/trigger-event', (req, res) => {
  const { eventType } = req.body;
  const data = loadData();
  
  let targetPreset = WORLD_EVENTS_POOL[0];
  if (eventType === 'inflation') targetPreset = WORLD_EVENTS_POOL[1];
  else if (eventType === 'leak') targetPreset = WORLD_EVENTS_POOL[2];
  else if (eventType === 'flare') targetPreset = WORLD_EVENTS_POOL[3];
  else if (eventType === 'singularity') targetPreset = WORLD_EVENTS_POOL[4];

  triggerRandomEvent(data, targetPreset);
  saveData(data);
  res.json({ status: 'event_injected', event: data.events[0] });
});

// Simulation timer handlers
let timer: NodeJS.Timeout | null = null;
function ensureLoopRunning(speed: 'slow' | 'normal' | 'fast') {
  stopLoop();
  
  let intervalMs = 10000; // Normal: 10s
  if (speed === 'fast') intervalMs = 5000; // Fast: 5s
  if (speed === 'slow') intervalMs = 18000; // Slow: 18s

  console.log(`Starting background simulation interval: every ${intervalMs / 1000}s`);
  timer = setInterval(async () => {
    try {
      console.log('Automated tick firing...');
      await executeSimulationTick();
    } catch (err) {
      console.error('Tick execution thread error:', err);
    }
  }, intervalMs);
}

function stopLoop() {
  if (timer) {
    clearInterval(timer);
    timer = null;
    console.log('Background simulation interval stopped.');
  }
}

// On startup, reload state and check if background loop should start
const initialData = loadData();
if (initialData.state.running) {
  ensureLoopRunning(initialData.state.speed);
}

// Integrated Vite setup
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Aegis Nexus Platform running on HTTP://localhost:${PORT}`);
  });
}

startServer();
