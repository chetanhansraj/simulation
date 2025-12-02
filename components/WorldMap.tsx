import React from 'react';
import { LocationType, MarketProduct, Agent } from '../types';
import { LOCATIONS } from '../constants';

interface WorldMapProps {
  agents: Agent[];
  market: MarketProduct[];
}

export const WorldMap: React.FC<WorldMapProps> = ({ agents, market }) => {
  return (
    <div className="grid grid-cols-1 gap-6">
      {/* Locations */}
      <div className="grid grid-cols-2 gap-4">
        {LOCATIONS.map((loc) => {
           // Find agents currently here
           const agentsHere = agents.filter(a => a.location === loc.type);

           return (
            <div key={loc.type} className={`
              relative p-4 rounded-xl border-2 transition-all
              ${agentsHere.length > 0 ? 'border-indigo-500 bg-indigo-900/20' : 'border-slate-700 bg-slate-800'}
            `}>
              <div className="flex justify-between items-start mb-2">
                <span className="text-3xl">{loc.icon}</span>
                <span className="text-xs uppercase font-bold text-slate-400">{loc.type}</span>
              </div>
              <p className="text-xs text-slate-500 mb-4">{loc.description}</p>
              
              {/* Avatars at this location */}
              <div className="flex -space-x-2 overflow-hidden h-8">
                {agentsHere.map(agent => (
                  <img 
                    key={agent.id}
                    className="inline-block h-8 w-8 rounded-full ring-2 ring-slate-900 bg-slate-800"
                    src={agent.avatar}
                    alt={agent.name}
                    title={agent.name}
                  />
                ))}
              </div>
            </div>
           );
        })}
      </div>

      {/* Market View */}
      <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
        <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-white flex items-center">
            <span className="mr-2">🏪</span> Market Listings
            </h3>
            <span className="text-xs text-slate-500">{market.length} items</span>
        </div>
        
        <div className="space-y-3 max-h-60 overflow-y-auto pr-2 scrollbar-hide">
          {market.length === 0 && <p className="text-slate-500 italic text-sm">The shelves are empty...</p>}
          {market.map((item, idx) => (
            <div key={idx} className="flex items-center justify-between bg-slate-900/50 p-3 rounded-lg border border-slate-700/50 group hover:border-indigo-500/50 transition-colors">
              <div>
                <div className="flex items-center gap-2">
                    <span className="text-xs mr-1 opacity-70" title={item.itemType}>
                      {item.itemType === 'food' ? '🍗' : item.itemType === 'gadget' ? '🎮' : '🎫'}
                    </span>
                    <span className="text-indigo-300 font-medium">{item.name}</span>
                    {/* Quality Stars */}
                    <div className="flex text-[10px]">
                        {[...Array(5)].map((_, i) => (
                            <span key={i} className={i < Math.round(item.quality / 20) ? "text-yellow-500" : "text-slate-700"}>★</span>
                        ))}
                    </div>
                </div>
                <div className="flex gap-2 text-xs text-slate-500 mt-1">
                  {item.effect.hunger && <span>Hunger {item.effect.hunger}</span>}
                  {item.effect.energy && <span>Energy +{item.effect.energy}</span>}
                  {item.effect.boredom && <span>Fun +{Math.abs(item.effect.boredom)}</span>}
                </div>
              </div>
              <div className="text-right">
                  <div className="text-green-400 font-bold font-mono text-sm">${item.price}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};