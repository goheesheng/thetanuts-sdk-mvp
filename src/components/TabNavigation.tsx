/**
 * TabNavigation Component
 *
 * Toggle between Orderbook and RFQ trading modes.
 */

import { TabNavigationProps, MainTab } from '../types/rfq';

const tabs: { id: MainTab; label: string }[] = [
  { id: 'orderbook', label: 'Orderbook' },
  { id: 'rfq', label: 'RFQ' },
];

export function TabNavigation({ activeTab, onTabChange }: TabNavigationProps) {
  return (
    <div className="flex gap-1 p-1 bg-gray-800 rounded-lg">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === tab.id
              ? 'bg-blue-600 text-white'
              : 'text-gray-300 hover:bg-gray-700 hover:text-white'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
