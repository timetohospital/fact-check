'use client';

import { motion } from 'framer-motion';

interface CancerType {
  name: string;
  nameEn: string;
  color: string;
}

interface FilterButtonsProps {
  cancerTypes: Record<string, CancerType>;
  selected: string[];
  onSelect: (key: string) => void;
  onClear: () => void;
}

export default function FilterButtons({
  cancerTypes,
  selected,
  onSelect,
  onClear,
}: FilterButtonsProps) {
  const isAllSelected = selected.length === 0;

  return (
    <div className="flex flex-wrap gap-2 justify-center p-4">
      {/* All button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onClear}
        className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
          isAllSelected
            ? 'bg-blue-500 text-white'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        }`}
      >
        전체
      </motion.button>

      {/* Cancer type buttons */}
      {Object.entries(cancerTypes).map(([key, type]) => {
        const isSelected = selected.includes(key);
        return (
          <motion.button
            key={key}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onSelect(key)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              isSelected
                ? 'text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            style={{
              backgroundColor: isSelected ? type.color : undefined,
            }}
          >
            {type.name}
          </motion.button>
        );
      })}
    </div>
  );
}
