/**
 * P2-3: 政府人格选择器组件
 * 允许玩家在游戏开始前选择不同类型的政府AI人格
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import type { GovPersonaType } from '../../types/speculator';
import { GOV_PERSONAS, type GovPersona } from '../../engine/speculatorEngine';

interface GovPersonaSelectorProps {
  selected: GovPersonaType;
  onSelect: (persona: GovPersonaType) => void;
}

export function GovPersonaSelector({ selected, onSelect }: GovPersonaSelectorProps) {
  const personas = Object.values(GOV_PERSONAS);

  const getRarityColor = (type: GovPersonaType) => {
    switch (type) {
      case 'conservative': return 'border-blue-300 bg-blue-50 text-blue-700';
      case 'aggressive': return 'border-red-300 bg-red-50 text-red-700';
      case 'balanced': return 'border-purple-300 bg-purple-50 text-purple-700';
      case 'populist': return 'border-amber-300 bg-amber-50 text-amber-700';
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">🏛️</span>
        <span className="font-bold text-sm text-gray-700">选择政府人格</span>
        <span className="text-xs text-gray-400 ml-auto">影响政府AI行为</span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {personas.map((persona) => (
          <motion.button
            key={persona.type}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelect(persona.type)}
            className={`p-3 rounded-xl border-2 transition-all text-left ${
              selected === persona.type
                ? `${getRarityColor(persona.type)} border-opacity-100`
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xl">{persona.icon}</span>
              <span className="font-bold text-sm">{persona.name}</span>
              {selected === persona.type && (
                <span className="ml-auto text-xs bg-white px-1.5 py-0.5 rounded-full">✓</span>
              )}
            </div>
            <div className="text-xs text-gray-600 leading-relaxed">
              {persona.description}
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────
// 政府人格展示组件（用于游戏内显示当前人格）
// ────────────────────────────────────────────────────────────────

interface GovPersonaDisplayProps {
  persona: GovPersona;
  compact?: boolean;
}

export function GovPersonaDisplay({ persona, compact = false }: GovPersonaDisplayProps) {
  if (compact) {
    return (
      <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-gray-100">
        <span className="text-sm">{persona.icon}</span>
        <span className="text-xs font-medium text-gray-700">{persona.name}</span>
      </div>
    );
  }

  return (
    <div className="p-3 rounded-xl border border-gray-200 bg-white">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">{persona.icon}</span>
        <span className="font-bold text-sm text-gray-700">{persona.name}</span>
      </div>
      <div className="text-xs text-gray-600 leading-relaxed">
        {persona.description}
      </div>
    </div>
  );
}
