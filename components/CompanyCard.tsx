import React from 'react';
import { Company } from '../types';

interface CompanyCardProps {
  company: Company;
}

export const CompanyCard: React.FC<CompanyCardProps> = ({ company }) => {
  return (
    <div className="bg-slate-900 border border-slate-700 p-3 rounded-lg shadow flex flex-col justify-between h-full relative">
      <div>
        <div className="flex justify-between items-start mb-2">
            <h3 className="font-bold text-green-400 text-sm truncate" title={company.name}>{company.name}</h3>
            <span className="text-xs text-slate-500 bg-slate-800 px-1 rounded">{company.ceoName}</span>
        </div>
        <p className="text-xs text-slate-500 mb-2 line-clamp-2">{company.description}</p>
      </div>
      
      <div className="mt-2 pt-2 border-t border-slate-800 space-y-1">
         <div className="flex justify-between items-center">
            <span className="text-[10px] text-slate-400">FUNDS</span>
            <span className={`font-mono text-xs font-bold ${company.funds < 500 ? 'text-red-400' : 'text-white'}`}>
            ${company.funds.toFixed(0)}
            </span>
         </div>
         <div className="flex justify-between items-center">
            <span className="text-[10px] text-slate-400">REP</span>
            <span className={`font-mono text-xs font-bold ${company.reputation > 70 ? 'text-blue-400' : company.reputation < 40 ? 'text-red-400' : 'text-slate-300'}`}>
            {company.reputation}/100
            </span>
         </div>
      </div>
    </div>
  );
};