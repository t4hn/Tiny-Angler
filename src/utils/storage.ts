import {
  IndividualFishRecord,
  FishSpeciesDefinition,
  RarityConfig,
  PlayerState,
  FishVariant,
  LocationId,
} from '../types/fishing';
import { DEFAULT_FISH_CATALOGUE, DEFAULT_RARITY_CONFIG } from '../data/defaultFishCatalogue';
import { LOCATIONS } from '../data/locations';
import { RODS, BAITS } from '../data/equipment';

const STORAGE_KEYS = {
  CATALOGUE: 'tiny_angler_catalogue_v1',
  RARITY_CONFIG: 'tiny_angler_rarity_config_v1',
  CAUGHT_FISH: 'tiny_angler_caught_fish_v1',
  PLAYER_STATE: 'tiny_angler_player_state_v1',
  NEXT_COLLECTION_NUM: 'tiny_angler_collection_seq_v1',
};

export const getStoredCatalogue = (): FishSpeciesDefinition[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CATALOGUE);
    if (!raw) return DEFAULT_FISH_CATALOGUE;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
  } catch (e) {
    console.warn('Failed to parse stored catalogue, using defaults', e);
  }
  return DEFAULT_FISH_CATALOGUE;
};

export const saveCatalogue = (catalogue: FishSpeciesDefinition[]): void => {
  localStorage.setItem(STORAGE_KEYS.CATALOGUE, JSON.stringify(catalogue));
};

export const resetCatalogueToDefault = (): FishSpeciesDefinition[] => {
  saveCatalogue(DEFAULT_FISH_CATALOGUE);
  return DEFAULT_FISH_CATALOGUE;
};

export const getStoredRarityConfig = (): RarityConfig => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.RARITY_CONFIG);
    if (!raw) return DEFAULT_RARITY_CONFIG;
    return { ...DEFAULT_RARITY_CONFIG, ...JSON.parse(raw) };
  } catch (e) {
    console.warn('Failed to parse rarity config, using defaults', e);
  }
  return DEFAULT_RARITY_CONFIG;
};

export const saveRarityConfig = (config: RarityConfig): void => {
  localStorage.setItem(STORAGE_KEYS.RARITY_CONFIG, JSON.stringify(config));
};

export const getStoredCaughtFish = (): IndividualFishRecord[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CAUGHT_FISH);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.warn('Failed to parse caught fish collection', e);
    return [];
  }
};

export const saveCaughtFish = (fishList: IndividualFishRecord[]): void => {
  localStorage.setItem(STORAGE_KEYS.CAUGHT_FISH, JSON.stringify(fishList));
};

export const getNextCollectionNumber = (): number => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.NEXT_COLLECTION_NUM);
    const num = raw ? parseInt(raw, 10) : 1;
    localStorage.setItem(STORAGE_KEYS.NEXT_COLLECTION_NUM, (num + 1).toString());
    return num;
  } catch {
    return Math.floor(Math.random() * 900) + 100;
  }
};

export const getStoredPlayerState = (): PlayerState => {
  const defaultState: PlayerState = {
    coins: 40, // Nice welcoming starting coin purse
    currentRodId: 'bamboo',
    currentBaitId: 'none',
    ownedRodIds: ['bamboo'],
    baitInventory: {
      none: Infinity,
      breadcrumbs: 5,
    },
    unlockedLocations: ['sunny_meadow'],
    soundEnabled: true,
    totalCatches: 0,
  };

  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PLAYER_STATE);
    if (!raw) return defaultState;
    return { ...defaultState, ...JSON.parse(raw) };
  } catch {
    return defaultState;
  }
};

export const savePlayerState = (state: PlayerState): void => {
  localStorage.setItem(STORAGE_KEYS.PLAYER_STATE, JSON.stringify(state));
};

// Roll a fish catch based on location, equipment, catalogue, and rarity weights
export const rollCatch = (
  locationId: LocationId,
  rodId: string,
  baitId: string,
  catalogue: FishSpeciesDefinition[],
  rarityConfig: RarityConfig
): {
  species: FishSpeciesDefinition;
  sizeCm: number;
  weightKg: number;
  variant: FishVariant;
} | null => {
  // 1. Filter enabled fish for this location
  const eligible = catalogue.filter((f) => f.enabled && f.habitats.includes(locationId));
  if (eligible.length === 0) return null;

  const rod = RODS.find((r) => r.id === rodId) || RODS[0];
  const bait = BAITS.find((b) => b.id === baitId) || BAITS[0];

  // 2. Adjust rarity weights based on rod and bait
  const rareMultiplier = 1 + (rod.rareBonus + bait.rareChanceBonus) / 100;
  const weights: Record<string, number> = {
    common: Math.max(5, rarityConfig.common),
    uncommon: rarityConfig.uncommon * (1 + (rod.rareBonus * 0.3) / 100),
    rare: rarityConfig.rare * rareMultiplier,
    epic: rarityConfig.epic * rareMultiplier,
    legendary: rarityConfig.legendary * rareMultiplier * 1.25,
  };

  // Check which tiers actually have eligible fish at this location
  const tiersWithFish = new Set(eligible.map((f) => f.rarity));

  // Zero-out tiers with no fish to prevent dead rolls, redistributing to available tiers
  const activeWeights: { tier: string; weight: number }[] = [];
  let totalActiveWeight = 0;

  for (const [tier, weight] of Object.entries(weights)) {
    if (tiersWithFish.has(tier as any)) {
      activeWeights.push({ tier, weight });
      totalActiveWeight += weight;
    }
  }

  if (totalActiveWeight === 0) return null;

  // 3. Roll rarity
  const rarityRoll = Math.random() * totalActiveWeight;
  let accumulated = 0;
  let selectedTier = activeWeights[0].tier;

  for (const item of activeWeights) {
    accumulated += item.weight;
    if (rarityRoll <= accumulated) {
      selectedTier = item.tier;
      break;
    }
  }

  // 4. Select species within tier using spawnWeight
  const tierEligible = eligible.filter((f) => f.rarity === selectedTier);
  const totalSpawnWeight = tierEligible.reduce((sum, f) => sum + (f.spawnWeight || 1), 0);
  const speciesRoll = Math.random() * totalSpawnWeight;
  let speciesAcc = 0;
  let selectedSpecies = tierEligible[0];

  for (const fish of tierEligible) {
    speciesAcc += fish.spawnWeight || 1;
    if (speciesRoll <= speciesAcc) {
      selectedSpecies = fish;
      break;
    }
  }

  // 5. Calculate size and weight
  // Natural bell curve for size: average of 3 random rolls
  const sizeFactor = (Math.random() + Math.random() + Math.random()) / 3;
  const sizeCm = parseFloat((selectedSpecies.minSizeCm + (selectedSpecies.maxSizeCm - selectedSpecies.minSizeCm) * sizeFactor).toFixed(1));

  // Weight incorporates size cubed with natural density variance
  const relativeSize = sizeCm / ((selectedSpecies.minSizeCm + selectedSpecies.maxSizeCm) / 2);
  const densityVariance = 0.85 + Math.random() * 0.3;
  const baseKg = selectedSpecies.weightRatio * sizeCm * Math.pow(relativeSize, 1.8) * densityVariance;
  const weightKg = parseFloat(Math.max(0.05, baseKg).toFixed(2));

  // 6. Roll variant
  const effectiveVariantChance = selectedSpecies.variantChance * (1 + bait.variantChanceBonus / 100);
  let variant: FishVariant = 'Standard';
  if (Math.random() < effectiveVariantChance && selectedSpecies.possibleVariants.length > 1) {
    const variants = selectedSpecies.possibleVariants.filter((v) => v !== 'Standard');
    if (variants.length > 0) {
      variant = variants[Math.floor(Math.random() * variants.length)];
    }
  }

  return {
    species: selectedSpecies,
    sizeCm,
    weightKg,
    variant,
  };
};

export const createIndividualFishRecord = (
  species: FishSpeciesDefinition,
  sizeCm: number,
  weightKg: number,
  variant: FishVariant,
  locationId: LocationId,
  rodId: string,
  baitId: string,
  existingCatches: IndividualFishRecord[]
): {
  record: IndividualFishRecord;
  isFirstCatch: boolean;
  isLargest: boolean;
  isSmallest: boolean;
  coinsEarned: number;
} => {
  const collectionNumber = getNextCollectionNumber();
  const location = LOCATIONS.find((l) => l.id === locationId) || LOCATIONS[0];
  const rod = RODS.find((r) => r.id === rodId) || RODS[0];
  const bait = BAITS.find((b) => b.id === baitId) || BAITS[0];

  const sameSpecies = existingCatches.filter((f) => f.speciesId === species.id);
  const isFirstCatch = sameSpecies.length === 0;

  const previousLargest = sameSpecies.length > 0 ? Math.max(...sameSpecies.map((f) => f.sizeCm)) : 0;
  const previousSmallest = sameSpecies.length > 0 ? Math.min(...sameSpecies.map((f) => f.sizeCm)) : Infinity;

  const isLargest = isFirstCatch || sizeCm > previousLargest;
  const isSmallest = !isFirstCatch && sizeCm < previousSmallest;

  let coinsEarned = 0;
  if (isFirstCatch) {
    coinsEarned += species.firstDiscoveryReward;
  }
  if (isLargest && !isFirstCatch) {
    coinsEarned += species.recordBonusReward;
  }

  // Adjust palette if special variant
  const palette = { ...species.palette };
  if (variant === 'Golden') {
    palette.body = '#f59e0b';
    palette.fins = '#fbbf24';
    palette.pattern = '#d97706';
    palette.belly = '#fef08a';
  } else if (variant === 'Albino') {
    palette.body = '#f8fafc';
    palette.fins = '#fecdd3';
    palette.pattern = '#e2e8f0';
    palette.belly = '#ffffff';
  } else if (variant === 'Shadow') {
    palette.body = '#1e293b';
    palette.fins = '#334155';
    palette.pattern = '#0f172a';
    palette.belly = '#475569';
  } else if (variant === 'Neon Glow') {
    palette.body = '#06b6d4';
    palette.fins = '#a855f7';
    palette.pattern = '#3b82f6';
    palette.belly = '#67e8f9';
  } else if (variant === 'Iridescent') {
    palette.body = '#ec4899';
    palette.fins = '#8b5cf6';
    palette.pattern = '#06b6d4';
    palette.belly = '#fbcfe8';
  }

  const record: IndividualFishRecord = {
    id: `fish_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    collectionNumber,
    speciesId: species.id,
    speciesName: species.name,
    rarity: species.rarity,
    sizeCm,
    weightKg,
    variant,
    caughtAt: new Date().toISOString(),
    locationId,
    locationName: location.name,
    rodUsed: rod.name,
    baitUsed: bait.name,
    isLargest,
    isSmallest,
    isFirstCatch,
    inAquarium: false,
    palette,
  };

  return {
    record,
    isFirstCatch,
    isLargest,
    isSmallest,
    coinsEarned,
  };
};
