import React from 'react';
import { Agent, ActionType } from '../types';

interface AgentCardProps {
  agent: Agent;
}

const VitalBar: React.FC<{ label: string; value: number; colorClass: string; inverse?: boolean }> = ({ label, value, colorClass, inverse }) => {
  let percentage = value;
  if (value > 100) percentage = 100;
  if (value < 0) percentage = 0;

  const width = `${percentage}%`;
  
  return (
    <div className="mb-2">
      <div className="flex justify-between text-xs uppercase tracking-wider text-slate-400 mb-1">
        <span>{label}</span>
        <span>{value}/100</span>
      </div>
      <div className="h-2 w-full bg-slate-700 rounded-full overflow-hidden">
        <div className={`h-full transition-all duration-500 ${colorClass}`} style={{ width }}></div>
      </div>
    </div>
  );
};

export const AgentCard: React.FC<AgentCardProps> = ({ agent }) => {
  const getActionColor = (action?: ActionType) => {
    switch (action) {
      case ActionType.WORK: return 'text-blue-400';
      case ActionType.BUY: return 'text-green-400';
      case ActionType.CONSUME: return 'text-orange-400';
      case ActionType.USE: return 'text-pink-400';
      case ActionType.SLEEP: return 'text-purple-400';
      case ActionType.MOVE: return 'text-yellow-400';
      default: return 'text-slate-400';
    }
  };

  const getHungerColor = (val: number) => val > 70 ? 'bg-red-500' : (val > 40 ? 'bg-yellow-500' : 'bg-green-500');
  const getEnergyColor = (val: number) => val < 30 ? 'bg-red-500' : (val < 60 ? 'bg-yellow-500' : 'bg-green-500');
  const getBoredomColor = (val: number) => val > 70 ? 'bg-red-500' : 'bg-blue-500';

  // Format brand opinions for display
  const topOpinions = Object.entries(agent.memory.brandOpinions)
    .sort(([,a], [,b]) => b - a) // Sort by score
    .slice(0, 3); // Top 3

  return (
    <div className="bg-slate-800 rounded-xl border border-slate-700 p-4 shadow-lg flex flex-col h-full relative overflow-hidden">
      {/* Header */}
      <div className="flex items-center space-x-4 mb-4">
        <div className="relative">
          <img src={agent.avatar} alt={agent.name} className="w-16 h-16 rounded-full border-2 border-indigo-500 object-cover" />
          <div className="absolute -bottom-1 -right-1 bg-indigo-600 text-xs px-2 py-0.5 rounded-full text-white font-bold">
            {agent.location}
          </div>
        </div>
        <div>
          <h3 className="text-xl font-bold text-white">{agent.name}</h3>
          <p className="text-sm text-indigo-300">{agent.personality.type}</p>
          <div className="flex items-center text-xs text-green-400 mt-1 font-mono">
            <span className="mr-1">$</span>{agent.vitals.money}
          </div>
        </div>
      </div>

      {/* Thought Bubble */}
      <div className="bg-slate-700/50 p-3 rounded-lg mb-4 flex-grow relative border-l-4 border-indigo-500">
        <p className="text-xs text-slate-400 uppercase tracking-widest mb-1">Current Thought</p>
        <p className="text-sm italic text-slate-200">"{agent.lastDecision?.thought_process || "Processing surroundings..."}"</p>
        
        {agent.lastDecision && (
          <div className={`mt-2 text-xs font-bold uppercase ${getActionColor(agent.lastDecision.action)}`}>
            ➜ {agent.lastDecision.action} {agent.lastDecision.target !== 'None' ? `@ ${agent.lastDecision.target}` : ''}
          </div>
        )}
      </div>

      {/* Brand Opinions (New) */}
      {topOpinions.length > 0 && (
         <div className="mb-4">
             <p className="text-[10px] text-slate-500 uppercase mb-1">Brand Biases</p>
             <div className="flex gap-2 flex-wrap">
                 {topOpinions.map(([comp, score]) => (
                     <span key={comp} className={`text-[10px] px-1.5 py-0.5 rounded ${score > 0 ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'}`}>
                         {comp}: {score > 0 ? '+' : ''}{score}
                     </span>
                 ))}
             </div>
         </div>
      )}

      {/* Vitals */}
      <div className="mt-auto">
        <VitalBar label="Hunger" value={agent.vitals.hunger} colorClass={getHungerColor(agent.vitals.hunger)} />
        <VitalBar label="Energy" value={agent.vitals.energy} colorClass={getEnergyColor(agent.vitals.energy)} />
        <VitalBar label="Boredom" value={agent.vitals.boredom} colorClass={getBoredomColor(agent.vitals.boredom)} />
      </div>
      
      {/* Inventory Mini-list */}
      <div className="mt-4 pt-3 border-t border-slate-700">
         <p className="text-xs text-slate-500 mb-1">INVENTORY</p>
         <div className="flex flex-wrap gap-1">
            {agent.inventory.length === 0 && <span className="text-xs text-slate-600">Empty</span>}
            {agent.inventory.map((item, idx) => (
              <span key={idx} className="text-xs bg-slate-900 text-slate-300 px-2 py-1 rounded border border-slate-700 flex items-center">
                <span className="mr-1 opacity-50 text-[10px]">
                  {item.type === 'food' ? '🍗' : item.type === 'gadget' ? '🎮' : '🎫'}
                </span>
                {item.name}
              </span>
            ))}
         </div>
      </div>
    </div>
  );
};