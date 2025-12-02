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
    
    return `- ${p.name} (${companyName}) $${p.price} [Qual: ${p.quality}]${opinionText}`;
  }).join("\n");

  const lastAction = agent.memory.actionHistory[agent.memory.actionHistory.length - 1];
  let feedback = "Last Hour: Nothing significant.";
  if (lastAction) {
    feedback = `Last Hour You Tried To: ${lastAction.action} ${lastAction.target}. Result: ${lastAction.success ? "SUCCESS" : "FAILED"}. Reason: ${lastAction.message}`;
  }

  const inventoryList = agent.inventory.length > 0 
    ? agent.inventory.map(i => `${i.name} (${i.type})`).join(", ") 
    : "Empty";

  const prompt = `
    You are a simulation agent named ${agent.name}.
    
    IDENTITY:
    Traits: ${agent.personality.traits.join(", ")}
    Goal: ${agent.personality.goals}
    
    STATE (Time: ${worldTime}:00):
    - Location: ${agent.location}
    - Vitals: Hunger ${agent.vitals.hunger}/100, Energy ${agent.vitals.energy}/100, Boredom ${agent.vitals.boredom}/100
    - Wallet: $${agent.vitals.money}
    - Inventory: ${inventoryList}
    
    MEMORY STREAM:
    - Recent Events: ${recentEventsLog || "Just woke up."}
    - Immediate Feedback: ${feedback}
    
    MARKET (at Store):
    ${marketList}
    
    CRITICAL LOCATION & ITEM RULES:
    1. To WORK -> You MUST be at 'Office'. If not, MOVE to 'Office'.
    2. To BUY -> You MUST be at 'Supermarket'. If not, MOVE to 'Supermarket'.
    3. To SOCIALIZE -> You MUST be at 'Park'. If not, MOVE to 'Park'.
    4. To SLEEP -> Go 'Home' first.
    5. To CONSUME (Food/Drink/Service) -> You MUST have the item in Inventory. Consuming removes the item.
    6. To USE (Gadget) -> You MUST have the item in Inventory. Using keeps the item (reusable).

    DECISION PROCESS:
    1. Look at your LAST ACTION result. Did it fail? If so, fix the problem.
    2. Check Vitals. Prioritize critical needs (Hunger > 80, Energy < 20).
    3. Check Brand Opinions. If you hate a brand, don't buy from them unless desperate.
    4. Check Location. Can you do what you want here? If not, MOVE.
    
    Task: Return JSON for your next move.
    Format: {"thought_process": "string", "action": "MOVE|WORK|BUY|CONSUME|USE|SLEEP|SOCIALIZE|IDLE", "target": "string", "param": "string"}
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
    return `ID: ${p.id} | Name: ${p.name} | Price: $${p.price} | Quality: ${p.quality} | Brand: ${ownerName} (Rep: ${owner?.reputation || 50}) ${isMine ? "[MINE]" : ""}`;
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
    4. WITHDRAW_PRODUCT: Remove a failing product (targetProductId) to save costs.
    5. WAIT: Save money.
    
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