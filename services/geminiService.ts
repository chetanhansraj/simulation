import { Agent, AgentDecision, MarketProduct, ActionType, Company, CeoDecision, SimulationLog } from "../types";

// Initialize Groq Config
const GROQ_API_KEYS = [
    "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",
    "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"
];

const getGroqKey = () => GROQ_API_KEYS[Math.floor(Math.random() * GROQ_API_KEYS.length)];

// --- GROQ API CLIENT ---
const callGroq = async (prompt: string, model: string): Promise<any> => {
    try {
        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${getGroqKey()}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                messages: [
                    { role: "system", content: "You are a simulation agent. You MUST respond with valid JSON." },
                    { role: "user", content: prompt }
                ],
                model: model,
                temperature: 0.6,
                response_format: { type: "json_object" }
            })
        });

        if (!response.ok) {
            const err = await response.text();
            throw new Error(`Groq API Error: ${err}`);
        }

        const data = await response.json();
        const content = data.choices[0].message.content;
        return JSON.parse(content);
    } catch (error) {
        console.error("Groq Call Failed:", error);
        throw error;
    }
};

export const getAgentDecision = async (
  agent: Agent,
  worldTime: number,
  market: MarketProduct[],
  companies: Company[],
  locations: string[]
): Promise<AgentDecision> => {
  
  // 1. Context Building
  const recentEventsLog = agent.memory.recentEvents.slice(-6).join("; ");
  
  const marketList = market.map(p => {
    const company = companies.find(c => c.id === p.companyId);
    const companyName = company ? company.name : 'Unknown';
    const opinionScore = agent.memory.brandOpinions[p.companyId] || 0;

    let opinionText = "";
    if (opinionScore > 5) opinionText = " [I LOVE THIS BRAND]";
    else if (opinionScore < -5) opinionText = " [I HATE THIS BRAND]";

    // Calculate average rating
    const avgRating = p.ratings.length > 0
      ? Math.round(p.ratings.reduce((a, b) => a + b, 0) / p.ratings.length)
      : null;
    const ratingText = avgRating !== null ? ` | Avg Rating: ${avgRating}/100 (${p.ratings.length} reviews)` : '';

    // Show effects
    const effects = [];
    if (p.effect.hunger) effects.push(`Hunger ${p.effect.hunger}`);
    if (p.effect.energy) effects.push(`Energy +${p.effect.energy}`);
    if (p.effect.boredom) effects.push(`Boredom ${p.effect.boredom}`);
    const effectText = effects.length > 0 ? ` | Effects: ${effects.join(', ')}` : '';

    return `- ${p.name} (${companyName}) | $${p.price} | Quality: ${p.quality}${effectText}${ratingText}${opinionText}`;
  }).join("\n");

  const lastAction = agent.memory.actionHistory[agent.memory.actionHistory.length - 1];
  let feedback = "Last Hour: Nothing significant.";
  if (lastAction) {
    feedback = `Last Hour You Tried To: ${lastAction.action} ${lastAction.target}. Result: ${lastAction.success ? "SUCCESS" : "FAILED"}. Reason: ${lastAction.message}`;
  }

  const inventoryList = agent.inventory.length > 0 
    ? agent.inventory.map(i => `${i.name} (${i.type})`).join(", ") 
    : "Empty";

  const employmentInfo = agent.employer
    ? `Employed at ${companies.find(c => c.id === agent.employer)?.name || 'Unknown'} (Wage: $${agent.wage}/hour)`
    : 'Unemployed';

  const prompt = `
    You are a simulation agent named ${agent.name}.

    IDENTITY:
    Traits: ${agent.personality.traits.join(", ")}
    Goal: ${agent.personality.goals}
    Ambition: ${agent.personality.ambition}/100 (affects work drive and spending)

    STATE (Time: ${worldTime}:00):
    - Location: ${agent.location}
    - Vitals: Hunger ${agent.vitals.hunger}/100, Energy ${agent.vitals.energy}/100, Boredom ${agent.vitals.boredom}/100
    - Wallet: $${agent.vitals.money}
    - Employment: ${employmentInfo}
    - Inventory: ${inventoryList}

    MEMORY STREAM:
    - Recent Events: ${recentEventsLog || "Just woke up."}
    - Immediate Feedback: ${feedback}

    AVAILABLE PRODUCTS (at Supermarket):
    ${marketList || "No products available"}

    CRITICAL RULES:
    1. WORK -> Must be at 'Office'. ${agent.employer ? 'You work for ' + companies.find(c => c.id === agent.employer)?.name : 'You can work freelance for $50/hour'}.
    2. BUY <product name> -> Must be at 'Supermarket'. Use EXACT product names from the list above.
    3. CONSUME <item> -> Can be done ANYWHERE if item is in inventory. Removes the item.
    4. USE <gadget> -> Can be done ANYWHERE if gadget is in inventory. Reusable.
    5. SLEEP -> Must be at 'Home'. Takes 6 hours, fully restores energy.
    6. REST -> Can be done ANYWHERE. Takes 1 hour, restores +25 energy. Quick recharge.
    7. SOCIALIZE -> Must be at 'Park' or 'Supermarket'. Reduces boredom significantly.
    8. MOVE <location> -> Valid locations: Home, Office, Supermarket, Park

    DECISION PROCESS:
    1. Check last action feedback. If it failed, fix the issue.
    2. Prioritize critical vitals: Hunger > 70, Energy < 25, Boredom > 80.
    3. Use REST for quick energy boost when away from home. Use SLEEP at home for full restore.
    4. You can eat/consume items ANYWHERE now (no need to go home).
    5. Consider ambition: High ambition = work more, low ambition = prioritize fun.
    6. Check product ratings before buying. Avoid low-rated items.

    Task: Return JSON for your next move.
    Format: {"thought_process": "string", "action": "MOVE|WORK|BUY|CONSUME|USE|SLEEP|REST|SOCIALIZE|IDLE", "target": "string"}
  `;

  try {
      return await callGroq(prompt, agent.modelName);
  } catch (error) {
    console.error(`Error for ${agent.name}:`, error);
    return {
      thought_process: "Brain fog... I can't think clearly.",
      action: ActionType.IDLE,
      target: "Self"
    };
  }
};



export const getCeoDecision = async (
  company: Company,
  marketState: MarketProduct[],
  logs: SimulationLog[],
  allCompanies: Company[]
): Promise<CeoDecision> => {
  
  const marketIntel = logs
    .filter(l => l.type === 'thought' || l.type === 'action')
    .slice(-20)
    .map(l => `${l.agentName}: ${l.message}`)
    .join("\n");

  const marketSnapshot = marketState.map(p => {
    const owner = allCompanies.find(c => c.id === p.companyId);
    const ownerName = owner ? owner.name : "Unknown";
    const isMine = p.companyId === company.id;

    // Calculate average rating
    const avgRating = p.ratings.length > 0
      ? Math.round(p.ratings.reduce((a, b) => a + b, 0) / p.ratings.length)
      : null;
    const ratingText = avgRating !== null
      ? ` | Avg Rating: ${avgRating}/100 (${p.ratings.length} reviews)`
      : ' | No ratings yet';

    return `ID: ${p.id} | ${p.name} | $${p.price} | Quality: ${p.quality}${ratingText} | ${ownerName} (Rep: ${owner?.reputation || 50}) ${isMine ? "[MINE]" : ""}`;
  }).join("\n");
  
  const prompt = `
    You are ${company.ceoName}, CEO of ${company.name}.
    Strategy: ${company.strategy}
    Funds: $${company.funds}
    Reputation: ${company.reputation}/100
    
    COMPETITIVE LANDSCAPE:
    ${marketSnapshot}
    
    RECENT CUSTOMER CHATTER:
    ${marketIntel}
    
    TACTICAL OPTIONS:
    1. LAUNCH_PRODUCT: Create something entirely new.
    2. UNDERCUT: Target a competitor's successful product (targetProductId). Launch a cheaper version to steal their customers.
    3. IMPROVE: Target YOUR OWN existing product (targetProductId). Launch a "Pro" version with higher quality and price.
    4. WITHDRAW_PRODUCT: Remove a failing product (targetProductId) with low ratings (< 40/100) to protect brand reputation.
    5. WAIT: Save money.

    STRATEGIC TIPS:
    - Pay attention to average ratings. Products with < 40/100 rating hurt your reputation.
    - High-rated competitor products (> 70/100) are good targets to UNDERCUT.
    - If your product has high ratings, consider launching an IMPROVE version.

    TASK:
    Analyze the market. Aggressively compete if you have funds (> $2000). Protect your reputation.
    
    Response JSON format:
    {
      "thought_process": "string",
      "action": "LAUNCH_PRODUCT" | "WITHDRAW_PRODUCT" | "WAIT" | "UNDERCUT" | "IMPROVE",
      "productName": "string (optional)",
      "productPrice": number (optional),
      "productQuality": number (optional),
      "productType": "FOOD" | "DRINK" | "GADGET" (optional),
      "targetProductId": "string (optional)"
    }
  `;

  try {
    // CEOs always use the powerful model
    return await callGroq(prompt, company.modelName || "llama-3.3-70b-versatile");
  } catch (error) {
    console.error(`Error for CEO ${company.ceoName}:`, error);
    return {
      thought_process: "Market is volatile. Holding position.",
      action: "WAIT"
    };
  }
};

export const getCeoObservation = async (
  company: Company,
  recentEvents: string[]
): Promise<string> => {
  
  const recentActivity = recentEvents.slice(-5).join("\n");
  
const prompt = `
You are ${company.ceoName}, CEO of ${company.name}.

STATUS:
- Funds: $${company.funds}
- Reputation: ${company.reputation}/100

WHAT JUST HAPPENED:
${recentActivity || "Market has been quiet."}

Provide a BRIEF observation (2-3 sentences max):
- What are you noticing?
- How do you feel?

Keep it conversational and emotional.

Response JSON format:
{
  "observation": "string"
}
`;

  try {
    const response = await callGroq(prompt, company.modelName || "llama-3.3-70b-versatile");
    return response.observation || "Watching the market closely.";
  } catch (error) {
    console.error(`CEO observation failed for ${company.ceoName}:`, error);
    return "Monitoring market conditions.";
  }
};