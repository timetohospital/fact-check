'use client';

import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';

type CardType = 'improvement' | 'dramatic' | 'challenge';

interface HighlightCardProps {
  type: CardType;
  cancer: string;
  from?: number;
  to?: number;
  change?: number;
  rate?: number;
  description: string;
  onClick?: () => void;
}

const cardConfig: Record<CardType, { icon: typeof TrendingUp; bgColor: string; textColor: string; label: string }> = {
  improvement: {
    icon: TrendingUp,
    bgColor: 'bg-green-50',
    textColor: 'text-green-600',
    label: '가장 큰 향상',
  },
  dramatic: {
    icon: TrendingUp,
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-600',
    label: '가장 극적인 변화',
  },
  challenge: {
    icon: AlertTriangle,
    bgColor: 'bg-amber-50',
    textColor: 'text-amber-600',
    label: '아직도 과제',
  },
};

export default function HighlightCard({
  type,
  cancer,
  from,
  to,
  change,
  rate,
  description,
  onClick,
}: HighlightCardProps) {
  const config = cardConfig[type];
  const Icon = config.icon;

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -4 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`${config.bgColor} rounded-xl p-6 cursor-pointer transition-shadow hover:shadow-lg`}
    >
      <div className="flex items-start gap-4">
        <div className={`p-3 rounded-full ${config.bgColor}`}>
          <Icon className={`w-6 h-6 ${config.textColor}`} />
        </div>
        <div className="flex-1">
          <p className={`text-sm font-medium ${config.textColor}`}>
            {config.label}
          </p>
          <h3 className="text-xl font-bold text-gray-900 mt-1">
            {cancer}
          </h3>

          {type !== 'challenge' && from !== undefined && to !== undefined && change !== undefined ? (
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-gray-500 text-sm">{from}%</span>
              <span className="text-gray-400">→</span>
              <span className={`text-lg font-semibold ${config.textColor}`}>{to}%</span>
              <span className={`text-sm font-medium ${config.textColor}`}>
                (+{change}%p)
              </span>
            </div>
          ) : rate !== undefined ? (
            <div className="mt-3">
              <span className={`text-2xl font-bold ${config.textColor}`}>{rate}%</span>
            </div>
          ) : null}

          <p className="text-gray-600 text-sm mt-3">
            {description}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
