import React, { useState, useEffect, useRef } from 'react';
import { Agent, SimulationLog, MarketProduct, LocationType, ActionType, Company, PurchaseRecord, ActionResult, InventoryItem, ItemType, AgentDecision } from './types';
import { INITIAL_AGENTS, INITIAL_MARKET, INITIAL_COMPANIES, LOCATIONS } from './constants';
import { getAgentDecision, getCeoDecision, getCeoObservation } from './services/geminiService';
import { AgentCard } from './components/AgentCard';
import { GameCanvas } from './components/GameCanvas'; // CHANGED: Import new canvas
import { CompanyCard } from './components/CompanyCard';

export default function App() {
  const [agents, setAgents] = useState<Agent[]>(INITIAL_AGENTS);
  const [market, setMarket] = useState<MarketProduct[]>(INITIAL_MARKET);
  const [companies, setCompanies] = useState<Company[]>(INITIAL_COMPANIES);
  const [worldTime, setWorldTime] = useState<number>(8); 
  const [logs, setLogs] = useState<SimulationLog[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [autoPlay, setAutoPlay] = useState(false);
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (autoPlay && !isProcessing) {
      interval = setInterval(() => {
        handleTick();
      }, 4000); 
    }
    return () => clearInterval(interval);
  }, [autoPlay, isProcessing, worldTime]);

  const addLog = (agentName: string, message: string, type: 'action' | 'thought' | 'system' | 'market') => {
    const newLog: SimulationLog = {
      id: Math.random().toString(36).substr(2, 9),
      time: worldTime,
      agentName,
      message,
      type
    };
    setLogs(prev => [...prev, newLog]);
  };

  const copyLogs = () => {
    const text = logs.map(l => `[Hour ${l.time}:00] ${l.agentName}: ${l.message}`).join('\n');
    navigator.clipboard.writeText(text).then(() => {
      alert('Logs copied to clipboard!');
    });
  };

  const handleTick = async () => {
    if (isProcessing) return;
    setIsProcessing(true);

    const nextTime = (worldTime + 1) % 24;
    addLog('System', `Hour ${nextTime}:00`, 'system');

    // 1. CEO Logic (Every 3 hours or if market empty)
    const shouldCeosAct = nextTime % 3 === 0 || market.length === 0;
    let updatedCompanies = [...companies];
    let updatedMarket = [...market];

    if (shouldCeosAct) {
      addLog('System', 'CEOs are analyzing the competitive landscape...', 'market');
      
      for (let i = 0; i < updatedCompanies.length; i++) {
        const company = updatedCompanies[i];
        const decision = await getCeoDecision(company, updatedMarket, logs, updatedCompanies);
        
        addLog(company.name, `CEO ${company.ceoName}: ${decision.thought_process}`, 'market');

        let newProduct: MarketProduct | null = null;
        let cost = 0;

        if (decision.action === 'LAUNCH_PRODUCT' && decision.productName) {
            const quality = decision.productQuality || 50;
            cost = Math.floor(quality * 0.3 + 2); 
            
            let itemType: ItemType = 'food';
            if (decision.productType === 'GADGET') itemType = 'gadget';
            if (decision.productType === 'FOOD' || decision.productType === 'DRINK') itemType = 'food';

            newProduct = {
                id: `prod_${Math.random().toString(36).substr(2,5)}`,
                companyId: company.id,
                name: decision.productName,
                itemType: itemType,
                price: decision.productPrice || 10,
                quality: quality,
                cost: cost,
                effect: {
                  hunger: decision.productType === 'FOOD' ? -20 - (quality/5) : 0,
                  energy: decision.productType === 'DRINK' ? 15 + (quality/10) : 0,
                  boredom: decision.productType === 'GADGET' ? -30 - (quality/2) : 0
                }
            };
        } 
        else if ((decision.action === 'UNDERCUT' || decision.action === 'IMPROVE') && decision.targetProductId) {
            const targetProd = updatedMarket.find(p => p.id === decision.targetProductId);
            
            if (targetProd) {
                const isImprove = decision.action === 'IMPROVE';
                const quality = decision.productQuality || (isImprove ? targetProd.quality + 10 : targetProd.quality - 5);
                const price = decision.productPrice || (isImprove ? targetProd.price * 1.2 : targetProd.price * 0.8);
                cost = Math.floor(quality * 0.3 + 2);

                const name = decision.productName || (isImprove ? `${targetProd.name} Pro` : `Budget ${targetProd.name}`);

                newProduct = {
                    id: `prod_${Math.random().toString(36).substr(2,5)}`,
                    companyId: company.id,
                    name: name,
                    itemType: targetProd.itemType,
                    price: Math.floor(price),
                    quality: Math.min(100, Math.max(1, quality)),
                    cost: cost,
                    effect: { ...targetProd.effect } 
                };
                
                if (isImprove) {
                    if (newProduct.effect.hunger) newProduct.effect.hunger -= 10;
                    if (newProduct.effect.boredom) newProduct.effect.boredom -= 20;
                }
            } else {
                addLog(company.name, `Tried to ${decision.action} but couldn't find target product.`, 'market');
            }
        }

        if (newProduct) {
             if (company.funds > newProduct.cost * 10) {
                 updatedMarket.push(newProduct);
                 addLog(company.name, `${decision.action}: Launched ${newProduct.name} ($${newProduct.price}) [Qual: ${newProduct.quality}]`, 'market');
             } else {
                 addLog(company.name, `Cannot afford to launch ${newProduct.name}.`, 'market');
             }
        }
        
        if (decision.action === 'WITHDRAW_PRODUCT' && decision.targetProductId) {
          updatedMarket = updatedMarket.filter(p => p.id !== decision.targetProductId);
          addLog(company.name, `WITHDREW a product from market.`, 'market');
        }

        updatedCompanies[i] = company;
      }
      setMarket(updatedMarket);
    }

      if (!shouldCeosAct) {  // Only observe when NOT making decisions
        const recentEvents = logs
          .filter(l => l.time === worldTime)
          .map(l => `${l.agentName}: ${l.message}`)
          .slice(-10);

        for (const company of updatedCompanies) {
          const observation = await getCeoObservation(company, recentEvents);
          addLog(
            company.name, 
            `📊 ${company.ceoName}: ${observation}`, 
            'market'
          );
        }
      }
    // ===================================================================



    // 2. Physics Engine (Apply to ALL agents, even sleeping ones)
    let currentAgents = agents.map(agent => {
      let newHunger = agent.vitals.hunger + 5;
      let newEnergy = agent.vitals.energy - 3;
      let newBoredom = agent.vitals.boredom + 5;

      if (agent.lastDecision?.action === ActionType.SLEEP) {
        newEnergy += 25;
        newHunger += 2; 
      }

      return {
        ...agent,
        vitals: {
          ...agent.vitals,
          hunger: Math.min(100, Math.max(0, newHunger)),
          energy: Math.min(100, Math.max(0, newEnergy)),
          boredom: Math.min(100, Math.max(0, newBoredom)),
          money: agent.vitals.money
        }
      };
    });

    // 3. Agent AI Decision Loop
    const locationNames = LOCATIONS.map(l => l.type);
    const updatedAgents = [...currentAgents];

    // Determine Active Agents (Spawn Time Logic)
    const activeAgents = updatedAgents.map((a, index) => ({ agent: a, index: index }))
        .filter(({ agent }) => {
            // Simplified logic: Agent is active if world time >= spawn time OR if spawn time is small (morning)
            // Assuming the sim runs 24h. If spawn is 10, they appear at 10.
            return nextTime >= agent.spawnTime || (nextTime < agent.spawnTime && agent.spawnTime > 24);
        });

    for (const { agent, index } of activeAgents) {
      
      // -- SPAWN ANNOUNCEMENT --
      if (nextTime === agent.spawnTime && agent.history.length === 0) {
          addLog(agent.name, "Has entered the simulation.", "system");
      }

      // -- SLEEP LOGIC --
      if (agent.lastDecision?.action === ActionType.SLEEP && agent.vitals.energy < 90) {
          addLog(agent.name, "Zzz...", 'action');
          continue; 
      }

      // -- THINKING FREQUENCY OPTIMIZER --
      const isCritical = agent.vitals.hunger > 80 || agent.vitals.energy < 20;
      // Stagger logic: Use agent ID/Index to offset checks
      const shouldThink = isCritical || ((nextTime + index) % agent.thinkFrequency === 0);

      let decision: AgentDecision;

      if (shouldThink) {
          decision = await getAgentDecision(agent, nextTime, updatedMarket, updatedCompanies, locationNames);
          addLog(agent.name, `💭 ${decision.thought_process}`, 'thought');
      } else {
          // AUTO-PILOT / IDLE if not thinking
          decision = {
              thought_process: "Autopilot: Conserving mental energy.",
              action: ActionType.IDLE,
              target: "Self"
          };
      }
      
      const newVitals = { ...agent.vitals };
      let newLocation = agent.location;
      let newInventory = [...agent.inventory];
      let newMemory = { ...agent.memory };
      
      let logMessage = "";
      let actionSuccess = false;
      let actionFailMessage = "";

      // ACTION EXECUTION LOGIC (Same as before)
      switch (decision.action) {
        case ActionType.MOVE:
          const validLoc = Object.values(LocationType).find(l => l === decision.target);
          if (validLoc) {
            newLocation = validLoc as LocationType;
            actionSuccess = true;
            logMessage = `Moved to ${newLocation}`;
          } else {
            actionSuccess = false;
            actionFailMessage = `Invalid location ${decision.target}`;
            logMessage = `Tried to move to invalid location ${decision.target}`;
          }
          break;

        case ActionType.WORK:
          if (agent.location === LocationType.WORK) {
            newVitals.money += 50;
            newVitals.energy -= 10;
            newVitals.boredom += 5;
            actionSuccess = true;
            logMessage = `Worked hard. Earned $50.`;
          } else {
            actionSuccess = false;
            actionFailMessage = "Tried to WORK but wasn't at Office. You must MOVE to 'Office' first.";
            logMessage = `Tried to work, but wasn't at the office.`;
          }
          break;

        case ActionType.BUY:
          if (agent.location === LocationType.STORE) {
             const product = updatedMarket.find(p => p.name.toLowerCase() === decision.target.toLowerCase());
             if (product) {
               if (newVitals.money >= product.price) {
                 newVitals.money -= product.price;
                 
                 const compIdx = updatedCompanies.findIndex(c => c.id === product.companyId);
                 if (compIdx > -1) {
                   const profit = product.price - product.cost;
                   updatedCompanies[compIdx].funds += profit; 
                 }

                 const newItem: InventoryItem = {
                   id: Math.random().toString(36).substr(2, 9),
                   companyId: product.companyId, 
                   name: product.name,
                   type: product.itemType,
                   effect: product.effect,
                   quality: product.quality,
                   price: product.price
                 };

                 newInventory.push(newItem);
                 actionSuccess = true;
                 logMessage = `Bought ${product.name} for $${product.price}.`;
                 newMemory.recentEvents.push(`Bought ${product.name}.`);
               } else {
                 actionSuccess = false;
                 actionFailMessage = `Tried to BUY ${product.name} but couldn't afford it ($${newVitals.money} vs $${product.price})`;
                 logMessage = `Can't afford ${product.name}.`;
               }
             } else {
               actionSuccess = false;
               actionFailMessage = `Tried to BUY ${decision.target} but it wasn't in the market.`;
               logMessage = `Can't find "${decision.target}".`;
             }
          } else {
            actionSuccess = false;
            actionFailMessage = "Tried to BUY but wasn't at Supermarket. You must MOVE to 'Supermarket' first.";
            logMessage = `Tried to buy, but wasn't at the store.`;
          }
          break;
        
        case ActionType.CONSUME:
          const consumeIndex = newInventory.findIndex(i => i.name.toLowerCase() === decision.target.toLowerCase());
          
          if (consumeIndex > -1) {
             const item = newInventory[consumeIndex];
             if (item.type !== 'food' && item.type !== 'service') {
               actionSuccess = false;
               actionFailMessage = `Tried to CONSUME ${item.name} but it is a ${item.type}. Use USE instead.`;
               logMessage = `Tried to eat a ${item.name}... bad idea.`;
             } else {
               if (item.effect.hunger) newVitals.hunger += item.effect.hunger;
               if (item.effect.energy) newVitals.energy += item.effect.energy;
               if (item.effect.boredom) newVitals.boredom += item.effect.boredom;
               
               newInventory.splice(consumeIndex, 1);
               
               const randomVar = Math.floor(Math.random() * 20) - 10; 
               const satisfaction = Math.max(1, Math.min(10, Math.round((item.quality + randomVar) / 10)));
               
               let opinionChange = 0;
               let opinionMsg = "";
               if (satisfaction >= 8) {
                   opinionChange = 2;
                   opinionMsg = "Loved it!";
               } else if (satisfaction <= 4) {
                   opinionChange = -5;
                   opinionMsg = "Hated it.";
               }
               
               if (item.companyId) {
                   const currentOp = newMemory.brandOpinions[item.companyId] || 0;
                   newMemory.brandOpinions[item.companyId] = Math.max(-100, Math.min(100, currentOp + opinionChange));
                   
                   const compIdx = updatedCompanies.findIndex(c => c.id === item.companyId);
                   if (compIdx > -1) {
                       const repChange = satisfaction >= 8 ? 1 : (satisfaction <= 4 ? -2 : 0);
                       updatedCompanies[compIdx].reputation = Math.max(0, Math.min(100, updatedCompanies[compIdx].reputation + repChange));
                   }
               }

               const record: PurchaseRecord = {
                 productName: item.name,
                 price: item.price,
                 satisfaction: satisfaction,
                 time: worldTime
               };
               newMemory.purchaseHistory.push(record);
               newMemory.recentEvents.push(`Consumed ${item.name}. Rating: ${satisfaction}/10. ${opinionMsg}`);

               logMessage = `Consumed ${item.name}. ${opinionMsg} (Sat: ${satisfaction})`;
               actionSuccess = true;
             }
          } else {
             actionSuccess = false;
             actionFailMessage = `Tried to CONSUME ${decision.target} but didn't have it.`;
             logMessage = `Wanted to eat ${decision.target} but didn't have it.`;
          }
          break;
        
        case ActionType.USE:
          const useIndex = newInventory.findIndex(i => i.name.toLowerCase() === decision.target.toLowerCase());
          
          if (useIndex > -1) {
             const item = newInventory[useIndex];
             if (item.type !== 'gadget') {
               actionSuccess = false;
               actionFailMessage = `Tried to USE ${item.name} but it is a ${item.type}. Use CONSUME instead.`;
               logMessage = `Tried to use ${item.name}... didn't work.`;
             } else {
                if (item.effect.boredom) newVitals.boredom += item.effect.boredom;
                if (item.effect.energy) newVitals.energy += (item.effect.energy || 0);
                
                const satisfaction = Math.round(item.quality / 10);
                
                if (item.companyId && satisfaction > 7) {
                   const currentOp = newMemory.brandOpinions[item.companyId] || 0;
                   newMemory.brandOpinions[item.companyId] = Math.min(100, currentOp + 1);
                }

                newMemory.recentEvents.push(`Used ${item.name}. It was fun.`);
                logMessage = `Used ${item.name}. Fun! (Boredom ${item.effect.boredom})`;
                actionSuccess = true;
             }
          } else {
             actionSuccess = false;
             actionFailMessage = `Tried to USE ${decision.target} but didn't have it.`;
             logMessage = `Wanted to use ${decision.target} but didn't have it.`;
          }
          break;

        case ActionType.SLEEP:
           if (agent.location === LocationType.HOME) {
             actionSuccess = true;
             logMessage = `Is sleeping.`;
             newMemory.recentEvents.push("Slept.");
           } else {
             actionSuccess = false;
             actionFailMessage = "Tried to SLEEP but wasn't at Home. Move to 'Home' first.";
             logMessage = `Tried to sleep at ${agent.location} but it was too noisy.`;
           }
           break;

        case ActionType.SOCIALIZE:
           if (agent.location === LocationType.PARK) {
               newVitals.boredom -= 15;
               actionSuccess = true;
               logMessage = `Socialized at Park.`;
               newMemory.recentEvents.push("Hung out at the Park.");
           } else {
             actionSuccess = false;
             actionFailMessage = "Tried to SOCIALIZE but wasn't at Park. Move to 'Park' first.";
             logMessage = `Tried to socialize, but wasn't at the park.`;
           }
           break;

        default:
          actionSuccess = true;
          if (decision.action !== ActionType.IDLE) {
             logMessage = "Idling.";
          }
          break;
      }

      if (shouldThink) {
          const actionResult: ActionResult = {
            tick: worldTime,
            action: decision.action,
            target: decision.target,
            success: actionSuccess,
            message: actionSuccess ? "Action Completed" : actionFailMessage
          };
          newMemory.actionHistory = [...newMemory.actionHistory, actionResult].slice(-5);
      }
      
      newMemory.recentEvents = newMemory.recentEvents.slice(-10);

      newVitals.hunger = Math.max(0, Math.min(100, newVitals.hunger));
      newVitals.energy = Math.max(0, Math.min(100, newVitals.energy));
      newVitals.boredom = Math.max(0, Math.min(100, newVitals.boredom));

      // Update the correct agent in the original list
      updatedAgents[index] = {
        ...agent,
        vitals: newVitals,
        location: newLocation,
        inventory: newInventory,
        memory: newMemory,
        lastDecision: decision,
        history: logMessage ? [logMessage, ...agent.history].slice(0, 5) : agent.history
      };

      if (logMessage) addLog(agent.name, logMessage, 'action');
    }

    setAgents(updatedAgents);
    setCompanies(updatedCompanies);
    setWorldTime(nextTime);
    setIsProcessing(false);
  };



  return (
    <div className="flex flex-col h-screen bg-slate-950 text-slate-100 font-sans">
      <header className="bg-slate-900 border-b border-slate-800 p-4 flex justify-between items-center shadow-lg z-10">
        <div className="flex items-center space-x-3">
           <div className="h-8 w-8 bg-indigo-600 rounded flex items-center justify-center text-xl">🤖</div>
           <h1 className="text-xl font-bold tracking-tight">OODA Loop Simulation (Pixel Edition)</h1>
        </div>
        
        <div className="flex items-center space-x-6">
          <div className="bg-slate-800 px-4 py-2 rounded-lg border border-slate-700 font-mono text-indigo-400">
            TIME: <span className="text-white text-xl font-bold">{worldTime.toString().padStart(2, '0')}:00</span>
          </div>
          
          <div className="flex space-x-2">
            <button 
              onClick={() => handleTick()} 
              disabled={isProcessing || autoPlay}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded font-medium transition-colors"
            >
              {isProcessing ? 'Simulating...' : 'Next Hour'}
            </button>
             <button 
              onClick={() => setAutoPlay(!autoPlay)} 
              className={`px-4 py-2 rounded font-medium transition-colors border ${autoPlay ? 'bg-red-900/50 border-red-500 text-red-200' : 'bg-slate-800 border-slate-600 hover:bg-slate-700'}`}
            >
              {autoPlay ? 'Pause' : 'Auto Play'}
            </button>
          </div>
        </div>
      </header>

      <main className="flex-grow flex overflow-hidden">
        
        {/* Active Agents Column */}
        <div className="w-1/4 p-4 overflow-y-auto space-y-4 bg-slate-900 border-r border-slate-800 z-10">
           <h2 className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-2">
               Active Population ({agents.filter(a => worldTime >= a.spawnTime || (worldTime < a.spawnTime && a.spawnTime > 24)).length})
           </h2>
           <div className="grid grid-cols-1 gap-4">
             {agents
               .filter(a => worldTime >= a.spawnTime || (worldTime < a.spawnTime && a.spawnTime > 24))
               .map(agent => (
               <AgentCard key={agent.id} agent={agent} />
             ))}
           </div>
           
           {/* Coming Soon List */}
           {agents.some(a => !(worldTime >= a.spawnTime || (worldTime < a.spawnTime && a.spawnTime > 24))) && (
               <div className="mt-6 opacity-50">
                   <h2 className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-2">Spawning Soon</h2>
                   {agents
                    .filter(a => !(worldTime >= a.spawnTime || (worldTime < a.spawnTime && a.spawnTime > 24)))
                    .sort((a,b) => a.spawnTime - b.spawnTime)
                    .map(a => (
                       <div key={a.id} className="text-xs text-slate-600 p-2 border border-slate-800 rounded">
                           {a.name} ({a.personality.type}) - Hour {a.spawnTime}:00
                       </div>
                   ))}
               </div>
           )}
        </div>

        {/* MAIN GAME DISPLAY */}
        <div className="w-1/2 overflow-hidden bg-black flex flex-col relative">
           <GameCanvas 
             agents={agents} 
             companies={companies} 
             market={market} 
             worldTime={worldTime} 
           />
           
           {/* Overlay Market List for quick reference */}
           <div className="absolute bottom-4 left-4 right-4 bg-slate-900/90 border border-slate-700 rounded-lg p-3 max-h-40 overflow-y-auto pointer-events-auto">
               <h3 className="text-xs font-bold text-green-400 uppercase mb-2">Marketplace</h3>
               <div className="flex gap-2 overflow-x-auto pb-2">
                  {market.map((item, i) => (
                    <div key={i} className="bg-slate-800 border border-slate-700 px-2 py-1 rounded text-xs shrink-0 whitespace-nowrap">
                       <span className="text-indigo-300">{item.name}</span> <span className="text-green-500">${item.price}</span>
                    </div>
                  ))}
               </div>
           </div>
        </div>

        <div className="w-1/4 bg-slate-900 border-l border-slate-800 flex flex-col z-10">
          <div className="p-4 border-b border-slate-800 bg-slate-900 flex justify-between items-center">
            <h2 className="text-slate-400 text-xs font-bold uppercase tracking-widest">Live Feed</h2>
            <button 
              onClick={copyLogs}
              className="text-xs bg-slate-800 hover:bg-slate-700 text-indigo-400 border border-slate-700 px-2 py-1 rounded transition-colors"
            >
              Copy Logs
            </button>
          </div>
          <div className="flex-grow overflow-y-auto p-4 space-y-3 font-mono text-sm scrollbar-hide">
            {logs.length === 0 && <div className="text-slate-600 text-center mt-10">Press "Next Hour" to begin.</div>}
            {logs.map((log) => (
              <div key={log.id} className="animate-fade-in flex space-x-2">
                 <div className="text-slate-600 shrink-0 w-10 text-xs pt-1">{log.time}:00</div>
                 <div className="flex-grow break-words">
                   <span className={`font-bold mr-2 text-xs uppercase ${
                     log.type === 'market' ? 'text-green-400' :
                     log.agentName === 'System' ? 'text-slate-500' :
                     'text-indigo-400'
                   }`}>{log.agentName}</span>
                   <span className={`${
                     log.type === 'thought' ? 'text-slate-400 italic' :
                     log.type === 'market' ? 'text-green-200' :
                     'text-slate-300'
                   }`}>
                     {log.message}
                   </span>
                 </div>
              </div>
            ))}
            <div ref={logsEndRef} />
          </div>
          
          <div className="h-40 border-t border-slate-800 bg-slate-950 p-3 overflow-y-auto">
             <h2 className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-2">Company Stats</h2>
             <div className="space-y-2">
               {companies.map(c => (
                 <div key={c.id} className="flex justify-between text-xs border-b border-slate-800 pb-1">
                   <span className="text-green-400">{c.name}</span>
                   <span className="text-slate-300">${c.funds.toFixed(0)}</span>
                 </div>
               ))}
             </div>
          </div>
        </div>
      </main>
    </div>
  );
}