import React, { useState, useMemo } from 'react';
import {
  FishSpeciesDefinition,
  RarityConfig,
  RarityTier,
  LocationId,
  SilhouetteShape,
  MovementPattern,
  FishVariant,
} from '../types/fishing';
import { LOCATIONS } from '../data/locations';
import { FishRenderer } from './FishRenderer';
import { sounds } from '../utils/audio';
import {
  Search,
  Plus,
  Copy,
  Trash2,
  Play,
  RotateCcw,
  Download,
  Upload,
  Check,
  Sparkles,
  Sliders,
  SlidersHorizontal,
  ChevronRight,
  Eye,
  AlertCircle,
} from 'lucide-react';

interface FishCatalogueEditorProps {
  catalogue: FishSpeciesDefinition[];
  rarityConfig: RarityConfig;
  onUpdateCatalogue: (newCatalogue: FishSpeciesDefinition[]) => void;
  onUpdateRarityConfig: (newConfig: RarityConfig) => void;
  onResetCatalogue: () => void;
  onPreviewCatch: (fish: FishSpeciesDefinition) => void;
}

export const FishCatalogueEditor: React.FC<FishCatalogueEditorProps> = ({
  catalogue,
  rarityConfig,
  onUpdateCatalogue,
  onUpdateRarityConfig,
  onResetCatalogue,
  onPreviewCatch,
}) => {
  const [activeTab, setActiveTab] = useState<'species' | 'rarity_balancer' | 'probability_calc'>('species');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRarityFilter, setSelectedRarityFilter] = useState<string>('all');
  const [selectedFishId, setSelectedFishId] = useState<string>(catalogue[0]?.id || '');
  const [isEditing, setIsEditing] = useState(false);
  const [testLocationId, setTestLocationId] = useState<LocationId>('sunny_meadow');

  // Currently selected fish for editing
  const selectedFish = catalogue.find((f) => f.id === selectedFishId) || catalogue[0];

  // Working copy when editing
  const [formState, setFormState] = useState<FishSpeciesDefinition | null>(null);

  const startEditing = (fish: FishSpeciesDefinition) => {
    setSelectedFishId(fish.id);
    setFormState({ ...fish, habitats: [...fish.habitats], possibleVariants: [...fish.possibleVariants], palette: { ...fish.palette } });
    setIsEditing(true);
  };

  const handleCreateNew = () => {
    const newFish: FishSpeciesDefinition = {
      id: `custom_fish_${Date.now()}`,
      name: 'New Discovery Specimen',
      scientificName: 'Piscis novus',
      description: 'A newly catalogued aquatic species awaiting observation.',
      rarity: 'uncommon',
      habitats: ['sunny_meadow'],
      enabled: true,
      spawnWeight: 80,
      minSizeCm: 15,
      maxSizeCm: 35,
      weightRatio: 0.035,
      silhouetteShape: 'slender',
      swimSpeed: 1.0,
      movementPattern: 'wander',
      catchDurationSec: 7.5,
      baseSellValue: 25,
      firstDiscoveryReward: 40,
      recordBonusReward: 25,
      variantChance: 0.1,
      possibleVariants: ['Standard', 'Golden'],
      palette: {
        body: '#0ea5e9',
        fins: '#38bdf8',
        belly: '#e0f2fe',
        pattern: '#0284c7',
      },
    };
    onUpdateCatalogue([newFish, ...catalogue]);
    startEditing(newFish);
  };

  const handleDuplicate = (fish: FishSpeciesDefinition) => {
    const duplicated: FishSpeciesDefinition = {
      ...fish,
      id: `${fish.id}_copy_${Date.now().toString().slice(-4)}`,
      name: `${fish.name} (Copy)`,
      habitats: [...fish.habitats],
      possibleVariants: [...fish.possibleVariants],
      palette: { ...fish.palette },
    };
    onUpdateCatalogue([...catalogue, duplicated]);
    startEditing(duplicated);
  };

  const handleDelete = (fishId: string) => {
    if (catalogue.length <= 1) return;
    const filtered = catalogue.filter((f) => f.id !== fishId);
    onUpdateCatalogue(filtered);
    if (selectedFishId === fishId) {
      setSelectedFishId(filtered[0]?.id || '');
      setIsEditing(false);
      setFormState(null);
    }
  };

  const handleToggleEnabled = (fishId: string) => {
    const updated = catalogue.map((f) => (f.id === fishId ? { ...f, enabled: !f.enabled } : f));
    onUpdateCatalogue(updated);
  };

  const handleSaveForm = () => {
    if (!formState) return;
    const updated = catalogue.map((f) => (f.id === formState.id ? formState : f));
    onUpdateCatalogue(updated);
    setIsEditing(false);
  };

  // Filtered fish list
  const filteredCatalogue = useMemo(() => {
    return catalogue.filter((fish) => {
      const matchesSearch =
        fish.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        fish.scientificName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRarity = selectedRarityFilter === 'all' || fish.rarity === selectedRarityFilter;
      return matchesSearch && matchesRarity;
    });
  }, [catalogue, searchQuery, selectedRarityFilter]);

  // Normalized rarity weights calculations
  const totalRarityWeight =
    rarityConfig.common +
    rarityConfig.uncommon +
    rarityConfig.rare +
    rarityConfig.epic +
    rarityConfig.legendary;

  const rarityPercentages = {
    common: ((rarityConfig.common / totalRarityWeight) * 100).toFixed(1),
    uncommon: ((rarityConfig.uncommon / totalRarityWeight) * 100).toFixed(1),
    rare: ((rarityConfig.rare / totalRarityWeight) * 100).toFixed(1),
    epic: ((rarityConfig.epic / totalRarityWeight) * 100).toFixed(1),
    legendary: ((rarityConfig.legendary / totalRarityWeight) * 100).toFixed(1),
  };

  // Probability Calculator for Selected Location
  const locationProbabilities = useMemo(() => {
    const eligible = catalogue.filter((f) => f.enabled && f.habitats.includes(testLocationId));
    if (eligible.length === 0) return [];

    const activeTiers = new Set(eligible.map((f) => f.rarity));
    let activeTierWeightSum = 0;
    const tierWeights: Record<string, number> = {};

    (['common', 'uncommon', 'rare', 'epic', 'legendary'] as RarityTier[]).forEach((tier) => {
      if (activeTiers.has(tier)) {
        tierWeights[tier] = rarityConfig[tier];
        activeTierWeightSum += rarityConfig[tier];
      } else {
        tierWeights[tier] = 0;
      }
    });

    return eligible.map((fish) => {
      const tierProbability = activeTierWeightSum > 0 ? tierWeights[fish.rarity] / activeTierWeightSum : 0;
      const tierFish = eligible.filter((f) => f.rarity === fish.rarity);
      const totalTierSpawnWeight = tierFish.reduce((acc, f) => acc + (f.spawnWeight || 1), 0);
      const withinTierProbability = totalTierSpawnWeight > 0 ? (fish.spawnWeight || 1) / totalTierSpawnWeight : 0;
      const overallProbability = tierProbability * withinTierProbability * 100;

      return {
        fish,
        tierProbability: (tierProbability * 100).toFixed(1),
        overallProbability: overallProbability.toFixed(2),
      };
    }).sort((a, b) => parseFloat(b.overallProbability) - parseFloat(a.overallProbability));
  }, [catalogue, rarityConfig, testLocationId]);

  // Export / Import
  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(catalogue, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `tiny_angler_catalogue_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (Array.isArray(parsed) && parsed.length > 0) {
          onUpdateCatalogue(parsed);
          setSelectedFishId(parsed[0].id);
        }
      } catch (err) {
        alert('Invalid JSON file format.');
      }
    };
    reader.readAsText(file);
  };

  const rarityColorMap: Record<string, string> = {
    common: 'text-slate-600 bg-slate-100 border-slate-200',
    uncommon: 'text-emerald-700 bg-emerald-50 border-emerald-200',
    rare: 'text-sky-700 bg-sky-50 border-sky-200',
    epic: 'text-purple-700 bg-purple-50 border-purple-200',
    legendary: 'text-amber-700 bg-amber-50 border-amber-200',
  };

  return (
    <div className="w-full max-w-5xl bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
      {/* Editor Sub-Header & Navigation Tabs */}
      <div className="px-6 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4 bg-slate-50/50">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">
            Fish Catalogue & Spawn Balancer
          </h2>
          <p className="text-xs text-slate-500">
            Configure species, rarity weights, movement physics, and preview catches
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-1 bg-slate-200/60 p-1 rounded-xl">
          <button
            onClick={() => { setActiveTab('species'); setIsEditing(false); }}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'species' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Species List ({catalogue.length})
          </button>
          <button
            onClick={() => setActiveTab('rarity_balancer')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'rarity_balancer' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Rarity Weights
          </button>
          <button
            onClick={() => setActiveTab('probability_calc')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'probability_calc' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Probability Simulator
          </button>
        </div>

        {/* Import/Export & Reset tools */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportJSON}
            title="Export Catalogue JSON"
            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg border border-slate-200 text-xs flex items-center gap-1"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export</span>
          </button>

          <label
            title="Import Catalogue JSON"
            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg border border-slate-200 text-xs flex items-center gap-1 cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Import</span>
            <input type="file" accept=".json" onChange={handleImportJSON} className="hidden" />
          </label>

          <button
            onClick={() => {
              if (window.confirm('Reset catalogue definitions to original defaults?')) {
                onResetCatalogue();
              }
            }}
            title="Reset Catalogue to Defaults"
            className="p-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg border border-rose-200 text-xs flex items-center gap-1"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset Defaults</span>
          </button>
        </div>
      </div>

      {/* TAB 1: SPECIES CATALOGUE */}
      {activeTab === 'species' && (
        <div className="p-6">
          {/* If Editing a Fish, show the Editor Form */}
          {isEditing && formState ? (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div className="flex items-center gap-3">
                  <FishRenderer
                    shape={formState.silhouetteShape}
                    palette={formState.palette}
                    variant="Standard"
                    mode="full"
                    width={70}
                    height={35}
                  />
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      Editing: {formState.name}
                    </h3>
                    <p className="text-xs text-slate-500 italic">{formState.scientificName}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onPreviewCatch(formState)}
                    className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-semibold rounded-lg border border-amber-200 flex items-center gap-1.5 transition-colors"
                  >
                    <Play className="w-3 h-3 text-amber-600 fill-amber-600" />
                    Preview Catch
                  </button>
                  <button
                    onClick={() => { setIsEditing(false); setFormState(null); }}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveForm}
                    className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors flex items-center gap-1"
                  >
                    <Check className="w-3.5 h-3.5" />
                    Save Changes
                  </button>
                </div>
              </div>

              {/* Form Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-xs">
                {/* Column 1: Core Info */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-slate-800 uppercase tracking-wider text-[11px] pb-1 border-b border-slate-100">
                    Species Identification
                  </h4>

                  <div>
                    <label className="block text-slate-600 font-medium mb-1">Common Name</label>
                    <input
                      type="text"
                      value={formState.name}
                      onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-medium mb-1">Scientific Name</label>
                    <input
                      type="text"
                      value={formState.scientificName}
                      onChange={(e) => setFormState({ ...formState, scientificName: e.target.value })}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-medium mb-1">Field Description</label>
                    <textarea
                      rows={3}
                      value={formState.description}
                      onChange={(e) => setFormState({ ...formState, description: e.target.value })}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-500 resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-medium mb-1">Rarity Tier</label>
                    <select
                      value={formState.rarity}
                      onChange={(e) => setFormState({ ...formState, rarity: e.target.value as RarityTier })}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-500 bg-white"
                    >
                      <option value="common">Common (60%)</option>
                      <option value="uncommon">Uncommon (25%)</option>
                      <option value="rare">Rare (10%)</option>
                      <option value="epic">Epic (4%)</option>
                      <option value="legendary">Legendary (1%)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-600 font-medium mb-1">Habitats (Locations)</label>
                    <div className="space-y-1.5 pt-1">
                      {LOCATIONS.map((loc) => {
                        const isChecked = formState.habitats.includes(loc.id);
                        return (
                          <label key={loc.id} className="flex items-center gap-2 cursor-pointer text-slate-700">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                const newHabitats = e.target.checked
                                  ? [...formState.habitats, loc.id]
                                  : formState.habitats.filter((h) => h !== loc.id);
                                setFormState({ ...formState, habitats: newHabitats });
                              }}
                              className="rounded border-slate-300 text-sky-600"
                            />
                            <span>{loc.name}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Column 2: Behaviour & Silhouette Physics */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-slate-800 uppercase tracking-wider text-[11px] pb-1 border-b border-slate-100">
                    Behaviour & Silhouettes
                  </h4>

                  <div>
                    <label className="block text-slate-600 font-medium mb-1">Silhouette Profile</label>
                    <select
                      value={formState.silhouetteShape}
                      onChange={(e) => setFormState({ ...formState, silhouetteShape: e.target.value as SilhouetteShape })}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-500 bg-white"
                    >
                      <option value="slender">Slender (Trout, Minnow, Loach)</option>
                      <option value="round">Round (Bluegill, Sunfish, Betta)</option>
                      <option value="wide">Wide (Perch, Bullhead, Ray)</option>
                      <option value="giant">Giant / Armored (Sturgeon, King Koi)</option>
                      <option value="eel">Eel / Serpentine (Wyrm)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-600 font-medium mb-1">Movement Pattern</label>
                    <select
                      value={formState.movementPattern}
                      onChange={(e) => setFormState({ ...formState, movementPattern: e.target.value as MovementPattern })}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-500 bg-white"
                    >
                      <option value="wander">Gentle Wandering</option>
                      <option value="dart">Swift Darting</option>
                      <option value="circular">Circular Orbit</option>
                      <option value="ambush">Lurking / Ambush</option>
                    </select>
                  </div>

                  <div>
                    <div className="flex justify-between text-slate-600 mb-1">
                      <span className="font-medium">Swimming Speed</span>
                      <span className="font-mono">{formState.swimSpeed}x</span>
                    </div>
                    <input
                      type="range"
                      min="0.5"
                      max="2.2"
                      step="0.1"
                      value={formState.swimSpeed}
                      onChange={(e) => setFormState({ ...formState, swimSpeed: parseFloat(e.target.value) })}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-slate-600 mb-1">
                      <span className="font-medium">Catch Window (Seconds)</span>
                      <span className="font-mono">{formState.catchDurationSec}s</span>
                    </div>
                    <input
                      type="range"
                      min="3.0"
                      max="14.0"
                      step="0.5"
                      value={formState.catchDurationSec}
                      onChange={(e) => setFormState({ ...formState, catchDurationSec: parseFloat(e.target.value) })}
                      className="w-full"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-slate-600 font-medium mb-1">Min Length (cm)</label>
                      <input
                        type="number"
                        min="2"
                        max="200"
                        value={formState.minSizeCm}
                        onChange={(e) => setFormState({ ...formState, minSizeCm: parseInt(e.target.value, 10) || 5 })}
                        className="w-full px-2 py-1.5 border border-slate-300 rounded-lg font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 font-medium mb-1">Max Length (cm)</label>
                      <input
                        type="number"
                        min="5"
                        max="300"
                        value={formState.maxSizeCm}
                        onChange={(e) => setFormState({ ...formState, maxSizeCm: parseInt(e.target.value, 10) || 20 })}
                        className="w-full px-2 py-1.5 border border-slate-300 rounded-lg font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* Column 3: Economy & Colors */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-slate-800 uppercase tracking-wider text-[11px] pb-1 border-b border-slate-100">
                    Economy & Palette
                  </h4>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-slate-600 font-medium mb-1">Sell Value</label>
                      <input
                        type="number"
                        min="1"
                        value={formState.baseSellValue}
                        onChange={(e) => setFormState({ ...formState, baseSellValue: parseInt(e.target.value, 10) || 5 })}
                        className="w-full px-2 py-1.5 border border-slate-300 rounded-lg font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 font-medium mb-1">Discovery</label>
                      <input
                        type="number"
                        min="0"
                        value={formState.firstDiscoveryReward}
                        onChange={(e) => setFormState({ ...formState, firstDiscoveryReward: parseInt(e.target.value, 10) || 10 })}
                        className="w-full px-2 py-1.5 border border-slate-300 rounded-lg font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 font-medium mb-1">Record Bonus</label>
                      <input
                        type="number"
                        min="0"
                        value={formState.recordBonusReward}
                        onChange={(e) => setFormState({ ...formState, recordBonusReward: parseInt(e.target.value, 10) || 10 })}
                        className="w-full px-2 py-1.5 border border-slate-300 rounded-lg font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-slate-600 mb-1">
                      <span className="font-medium">Spawn Weight within Tier</span>
                      <span className="font-mono">{formState.spawnWeight}</span>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="200"
                      step="5"
                      value={formState.spawnWeight}
                      onChange={(e) => setFormState({ ...formState, spawnWeight: parseInt(e.target.value, 10) })}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-slate-600 mb-1">
                      <span className="font-medium">Rare Variant Chance</span>
                      <span className="font-mono">{Math.round(formState.variantChance * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="0.5"
                      step="0.02"
                      value={formState.variantChance}
                      onChange={(e) => setFormState({ ...formState, variantChance: parseFloat(e.target.value) })}
                      className="w-full"
                    />
                  </div>

                  {/* Palette Swatches */}
                  <div>
                    <label className="block text-slate-600 font-medium mb-1.5">Color Palette</label>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex items-center gap-1.5">
                        <input
                          type="color"
                          value={formState.palette.body}
                          onChange={(e) => setFormState({ ...formState, palette: { ...formState.palette, body: e.target.value } })}
                          className="w-7 h-7 rounded border cursor-pointer"
                        />
                        <span className="text-[11px] text-slate-600">Body</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="color"
                          value={formState.palette.fins}
                          onChange={(e) => setFormState({ ...formState, palette: { ...formState.palette, fins: e.target.value } })}
                          className="w-7 h-7 rounded border cursor-pointer"
                        />
                        <span className="text-[11px] text-slate-600">Fins</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="color"
                          value={formState.palette.belly}
                          onChange={(e) => setFormState({ ...formState, palette: { ...formState.palette, belly: e.target.value } })}
                          className="w-7 h-7 rounded border cursor-pointer"
                        />
                        <span className="text-[11px] text-slate-600">Belly</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="color"
                          value={formState.palette.pattern}
                          onChange={(e) => setFormState({ ...formState, palette: { ...formState.palette, pattern: e.target.value } })}
                          className="w-7 h-7 rounded border cursor-pointer"
                        />
                        <span className="text-[11px] text-slate-600">Markings</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Species Table View */
            <div className="space-y-4">
              {/* Controls bar: Search, Rarity filter, New Fish button */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 flex-1 max-w-sm">
                  <div className="relative w-full">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search species name or binomial..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-400"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-slate-500">Rarity:</span>
                  <select
                    value={selectedRarityFilter}
                    onChange={(e) => setSelectedRarityFilter(e.target.value)}
                    className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white"
                  >
                    <option value="all">All Rarities</option>
                    <option value="common">Common</option>
                    <option value="uncommon">Uncommon</option>
                    <option value="rare">Rare</option>
                    <option value="epic">Epic</option>
                    <option value="legendary">Legendary</option>
                  </select>

                  <button
                    onClick={handleCreateNew}
                    className="ml-2 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Species
                  </button>
                </div>
              </div>

              {/* Table of Species */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs divide-y divide-slate-200">
                  <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="px-4 py-2.5 font-semibold">Active</th>
                      <th className="px-4 py-2.5 font-semibold">Sprite</th>
                      <th className="px-4 py-2.5 font-semibold">Species Name</th>
                      <th className="px-4 py-2.5 font-semibold">Rarity</th>
                      <th className="px-4 py-2.5 font-semibold">Habitats</th>
                      <th className="px-4 py-2.5 font-semibold">Size Range</th>
                      <th className="px-4 py-2.5 font-semibold">Window</th>
                      <th className="px-4 py-2.5 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {filteredCatalogue.map((fish) => {
                      const rarityClass = rarityColorMap[fish.rarity] || rarityColorMap.common;
                      return (
                        <tr
                          key={fish.id}
                          className={`hover:bg-slate-50/80 transition-colors ${!fish.enabled ? 'opacity-50' : ''}`}
                        >
                          <td className="px-4 py-2.5">
                            <input
                              type="checkbox"
                              checked={fish.enabled}
                              onChange={() => handleToggleEnabled(fish.id)}
                              title={fish.enabled ? 'Enabled' : 'Disabled'}
                              className="rounded border-slate-300 text-sky-600"
                            />
                          </td>
                          <td className="px-4 py-2.5">
                            <FishRenderer
                              shape={fish.silhouetteShape}
                              palette={fish.palette}
                              mode="full"
                              width={44}
                              height={22}
                            />
                          </td>
                          <td className="px-4 py-2.5">
                            <div className="font-semibold text-slate-900">{fish.name}</div>
                            <div className="text-[10px] text-slate-400 italic">{fish.scientificName}</div>
                          </td>
                          <td className="px-4 py-2.5">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase border ${rarityClass}`}>
                              {fish.rarity}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 text-slate-600">
                            {fish.habitats.map((h) => h.split('_')[0]).join(', ')}
                          </td>
                          <td className="px-4 py-2.5 text-slate-600 font-mono">
                            {fish.minSizeCm} - {fish.maxSizeCm} cm
                          </td>
                          <td className="px-4 py-2.5 text-slate-600 font-mono">
                            {fish.catchDurationSec}s
                          </td>
                          <td className="px-4 py-2.5 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => onPreviewCatch(fish)}
                                title="Simulate Catch Preview"
                                className="p-1 text-amber-600 hover:bg-amber-50 rounded"
                              >
                                <Play className="w-3.5 h-3.5 fill-amber-500 text-amber-600" />
                              </button>
                              <button
                                onClick={() => startEditing(fish)}
                                title="Edit Species"
                                className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-medium text-[11px]"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDuplicate(fish)}
                                title="Duplicate Definition"
                                className="p-1 text-slate-500 hover:bg-slate-100 rounded"
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDelete(fish.id)}
                                title="Delete Definition"
                                className="p-1 text-rose-500 hover:bg-rose-50 rounded"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: RARITY BALANCER */}
      {activeTab === 'rarity_balancer' && (
        <div className="p-6 space-y-6">
          <div className="bg-sky-50 border border-sky-200 rounded-xl p-4 text-xs text-sky-900 flex items-start gap-3">
            <SlidersHorizontal className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold mb-0.5">Global Rarity Weight Engine</div>
              <p className="text-sky-800">
                Adjusting tier weights changes the global rarity roll without needing to rebuild individual species.
                Probabilities automatically normalize to 100%.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Sliders */}
            <div className="space-y-4 bg-slate-50 p-5 rounded-xl border border-slate-200">
              <h3 className="font-bold text-slate-900 text-sm">Tier Weight Configuration</h3>

              {(['common', 'uncommon', 'rare', 'epic', 'legendary'] as RarityTier[]).map((tier) => {
                const weight = rarityConfig[tier];
                const pct = rarityPercentages[tier];
                const rarityLabel = tier.charAt(0).toUpperCase() + tier.slice(1);

                return (
                  <div key={tier} className="space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-slate-800">{rarityLabel} Tier</span>
                      <span className="font-mono text-slate-600 font-medium">
                        Weight: {weight} · <strong>{pct}%</strong>
                      </span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="150"
                      value={weight}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        onUpdateRarityConfig({ ...rarityConfig, [tier]: val });
                      }}
                      className="w-full"
                    />
                  </div>
                );
              })}
            </div>

            {/* Live Distribution Graph */}
            <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-sm mb-3">Live Rarity Distribution</h3>
                <div className="w-full h-8 rounded-lg overflow-hidden flex border border-slate-300">
                  <div style={{ width: `${rarityPercentages.common}%` }} className="bg-slate-400" title={`Common: ${rarityPercentages.common}%`} />
                  <div style={{ width: `${rarityPercentages.uncommon}%` }} className="bg-emerald-500" title={`Uncommon: ${rarityPercentages.uncommon}%`} />
                  <div style={{ width: `${rarityPercentages.rare}%` }} className="bg-sky-500" title={`Rare: ${rarityPercentages.rare}%`} />
                  <div style={{ width: `${rarityPercentages.epic}%` }} className="bg-purple-500" title={`Epic: ${rarityPercentages.epic}%`} />
                  <div style={{ width: `${rarityPercentages.legendary}%` }} className="bg-amber-400" title={`Legendary: ${rarityPercentages.legendary}%`} />
                </div>
              </div>

              <div className="space-y-2 pt-4 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-200">
                  <span className="text-slate-600">Common Probability</span>
                  <span className="font-mono font-bold text-slate-700">{rarityPercentages.common}%</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200">
                  <span className="text-emerald-700">Uncommon Probability</span>
                  <span className="font-mono font-bold text-emerald-800">{rarityPercentages.uncommon}%</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200">
                  <span className="text-sky-700">Rare Probability</span>
                  <span className="font-mono font-bold text-sky-800">{rarityPercentages.rare}%</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200">
                  <span className="text-purple-700">Epic Probability</span>
                  <span className="font-mono font-bold text-purple-800">{rarityPercentages.epic}%</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-amber-700 font-semibold">Legendary Probability</span>
                  <span className="font-mono font-bold text-amber-800">{rarityPercentages.legendary}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: PROBABILITY SIMULATOR */}
      {activeTab === 'probability_calc' && (
        <div className="p-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Habitat Spawn Odds Simulator</h3>
              <p className="text-xs text-slate-500">
                See exact calculated catch odds for every species based on current habitat and weights
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-600">Inspect Location:</span>
              <select
                value={testLocationId}
                onChange={(e) => setTestLocationId(e.target.value as LocationId)}
                className="px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white font-medium"
              >
                {LOCATIONS.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs divide-y divide-slate-200">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-4 py-2.5 font-semibold">Fish</th>
                  <th className="px-4 py-2.5 font-semibold">Rarity</th>
                  <th className="px-4 py-2.5 font-semibold">Tier Roll Odds</th>
                  <th className="px-4 py-2.5 font-semibold">Spawn Weight</th>
                  <th className="px-4 py-2.5 font-semibold text-right">Net Catch Probability</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {locationProbabilities.map(({ fish, tierProbability, overallProbability }) => (
                  <tr key={fish.id} className="hover:bg-slate-50">
                    <td className="px-4 py-2.5 flex items-center gap-2">
                      <FishRenderer
                        shape={fish.silhouetteShape}
                        palette={fish.palette}
                        mode="full"
                        width={36}
                        height={18}
                      />
                      <span className="font-semibold text-slate-900">{fish.name}</span>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className="uppercase text-[10px] font-bold text-slate-700">
                        {fish.rarity}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 font-mono text-slate-600">{tierProbability}%</td>
                    <td className="px-4 py-2.5 font-mono text-slate-600">{fish.spawnWeight}</td>
                    <td className="px-4 py-2.5 text-right font-mono font-bold text-slate-900">
                      {overallProbability}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
