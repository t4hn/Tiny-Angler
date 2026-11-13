export type RarityTier = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

export type SilhouetteShape = 'slender' | 'round' | 'wide' | 'eel' | 'giant';

export type MovementPattern = 'wander' | 'dart' | 'circular' | 'ambush';

export type FishVariant = 'Standard' | 'Golden' | 'Albino' | 'Shadow' | 'Iridescent' | 'Neon Glow';

export type LocationId = 'sunny_meadow' | 'whispering_river' | 'twilight_lake' | 'crystal_caverns';

export interface LocationInfo {
  id: LocationId;
  name: string;
  tagline: string;
  description: string;
  unlockedByDefault: boolean;
  unlockCost: number;
  waterColor: string;
  deepWaterColor: string;
  bankColor: string;
  accentColor: string;
  ambientType: 'meadow' | 'river' | 'lake' | 'cavern';
}

export interface FishSpeciesDefinition {
  id: string;
  name: string;
  scientificName: string;
  description: string;
  rarity: RarityTier;
  habitats: LocationId[];
  enabled: boolean;
  spawnWeight: number; // weight within its rarity tier
  minSizeCm: number;
  maxSizeCm: number;
  weightRatio: number; // kg per cm ratio
  silhouetteShape: SilhouetteShape;
  swimSpeed: number; // 0.6 - 2.5 multiplier
  movementPattern: MovementPattern;
  catchDurationSec: number; // how long it stays catchable
  baseSellValue: number; // coins
  firstDiscoveryReward: number; // coins
  recordBonusReward: number; // coins
  variantChance: number; // 0.0 - 1.0
  possibleVariants: FishVariant[];
  palette: {
    body: string;
    fins: string;
    belly: string;
    pattern: string;
  };
}

export interface IndividualFishRecord {
  id: string;
  collectionNumber: number; // #001, #002...
  speciesId: string;
  speciesName: string;
  rarity: RarityTier;
  sizeCm: number;
  weightKg: number;
  variant: FishVariant;
  caughtAt: string; // ISO string
  locationId: LocationId;
  locationName: string;
  rodUsed: string;
  baitUsed: string;
  isLargest: boolean;
  isSmallest: boolean;
  isFirstCatch: boolean;
  customNickname?: string;
  inAquarium: boolean;
  palette: {
    body: string;
    fins: string;
    belly: string;
    pattern: string;
  };
}

export interface RarityConfig {
  common: number;
  uncommon: number;
  rare: number;
  epic: number;
  legendary: number;
}

export interface RodItem {
  id: string;
  name: string;
  price: number;
  description: string;
  catchWindowBonusSec: number;
  biteSpeedBonus: number; // percentage
  rareBonus: number; // percentage boost to rare rolls
  color: string;
}

export interface BaitItem {
  id: string;
  name: string;
  price: number;
  description: string;
  count: number;
  rareChanceBonus: number;
  biteSpeedBonus: number;
  variantChanceBonus: number;
  icon: string;
}

export interface PlayerState {
  coins: number;
  currentRodId: string;
  currentBaitId: string;
  ownedRodIds: string[];
  baitInventory: Record<string, number>;
  unlockedLocations: LocationId[];
  soundEnabled: boolean;
  totalCatches: number;
}
