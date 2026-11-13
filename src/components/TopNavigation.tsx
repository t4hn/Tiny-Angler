import React from 'react';
import { Volume2, VolumeX, Coins, Fish } from 'lucide-react';
import { sounds } from '../utils/audio';

export type NavTab = 'pond' | 'collection' | 'aquarium' | 'shop' | 'editor';

interface TopNavigationProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  coins: number;
  soundEnabled: boolean;
  onToggleSound: () => void;
  totalCatches: number;
}

export const TopNavigation: React.FC<TopNavigationProps> = ({
  activeTab,
  onSelectTab,
  coins,
  soundEnabled,
  onToggleSound,
}) => {
  return (
    <header className="w-full bg-white border-b border-slate-200 sticky top-0 z-40">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-8 px-6 py-3.5">
        {/* Zone 1: Single text element wordmark */}
        <button
          onClick={() => onSelectTab('pond')}
          className="text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0 hover:text-sky-700 transition-colors flex items-center gap-2"
        >
          <Fish className="w-5 h-5 text-sky-600" />
          <span>Tiny Angler</span>
        </button>

        {/* Zone 2: 4-5 concise single-line text navigation links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
          <button
            onClick={() => onSelectTab('pond')}
            className={`transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'pond'
                ? 'text-slate-900 font-semibold border-b-2 border-slate-900 pb-0.5'
                : 'hover:text-slate-900'
            }`}
          >
            Fishing Pond
          </button>

          <button
            onClick={() => onSelectTab('collection')}
            className={`transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'collection'
                ? 'text-slate-900 font-semibold border-b-2 border-slate-900 pb-0.5'
                : 'hover:text-slate-900'
            }`}
          >
            Creel & Journal
          </button>

          <button
            onClick={() => onSelectTab('aquarium')}
            className={`transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'aquarium'
                ? 'text-slate-900 font-semibold border-b-2 border-slate-900 pb-0.5'
                : 'hover:text-slate-900'
            }`}
          >
            Sanctuary Tank
          </button>

          <button
            onClick={() => onSelectTab('shop')}
            className={`transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'shop'
                ? 'text-slate-900 font-semibold border-b-2 border-slate-900 pb-0.5'
                : 'hover:text-slate-900'
            }`}
          >
            Tackle Shop
          </button>

          <button
            onClick={() => onSelectTab('editor')}
            className={`transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'editor'
                ? 'text-slate-900 font-semibold border-b-2 border-slate-900 pb-0.5'
                : 'hover:text-slate-900'
            }`}
          >
            Fish Editor
          </button>
        </nav>

        {/* Zone 3: 1 primary action & status */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={onToggleSound}
            title={soundEnabled ? 'Mute Audio' : 'Unmute Audio'}
            className="p-2 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition-colors"
          >
            {soundEnabled ? (
              <Volume2 className="w-4 h-4 text-slate-600" />
            ) : (
              <VolumeX className="w-4 h-4 text-slate-400" />
            )}
          </button>

          <div
            onClick={() => onSelectTab('shop')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100/80 rounded-lg border border-amber-200/80 text-xs font-bold text-amber-800 cursor-pointer transition-colors shadow-2xs"
          >
            <Coins className="w-3.5 h-3.5 text-amber-600" />
            <span className="font-mono tabular-nums">{coins}</span>
          </div>
        </div>
      </div>

      {/* Mobile nav row */}
      <div className="md:hidden flex items-center justify-around border-t border-slate-100 py-2 px-3 text-xs bg-slate-50">
        <button
          onClick={() => onSelectTab('pond')}
          className={`px-2 py-1 rounded font-medium ${activeTab === 'pond' ? 'bg-white shadow-2xs text-slate-900' : 'text-slate-600'}`}
        >
          Pond
        </button>
        <button
          onClick={() => onSelectTab('collection')}
          className={`px-2 py-1 rounded font-medium ${activeTab === 'collection' ? 'bg-white shadow-2xs text-slate-900' : 'text-slate-600'}`}
        >
          Creel
        </button>
        <button
          onClick={() => onSelectTab('aquarium')}
          className={`px-2 py-1 rounded font-medium ${activeTab === 'aquarium' ? 'bg-white shadow-2xs text-slate-900' : 'text-slate-600'}`}
        >
          Aquarium
        </button>
        <button
          onClick={() => onSelectTab('shop')}
          className={`px-2 py-1 rounded font-medium ${activeTab === 'shop' ? 'bg-white shadow-2xs text-slate-900' : 'text-slate-600'}`}
        >
          Shop
        </button>
        <button
          onClick={() => onSelectTab('editor')}
          className={`px-2 py-1 rounded font-medium ${activeTab === 'editor' ? 'bg-white shadow-2xs text-slate-900' : 'text-slate-600'}`}
        >
          Editor
        </button>
      </div>
    </header>
  );
};
