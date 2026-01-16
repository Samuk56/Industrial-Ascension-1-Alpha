
export enum Era {
  STONE = 'Primitivismo',
  BRONZE = 'Era do Bronze',
  IRON = 'Era do Ferro',
  MEDIEVAL = 'Feudalismo',
  INDUSTRIAL = 'Ascensão Industrial',
  MODERN = 'Era Atômica',
  DIGITAL = 'Era da Informação',
  SPACE = 'Colonização Espacial',
  FUTURE = 'Singularidade',
  TRANSCENDENCE = 'Transcendência'
}

export type ResourceType = 
  | 'sticks' | 'stones' | 'food' 
  | 'bronze' | 'iron' | 'gold' 
  | 'coal' | 'electricity' | 'data' 
  | 'antimatter';

export interface Resource {
  id: ResourceType;
  name: string;
  amount: number;
  perSecond: number;
  icon: string;
}

export interface Building {
  id: string;
  name: string;
  description: string;
  baseCost: Partial<Record<ResourceType, number>>;
  baseProduction: Partial<Record<ResourceType, number>>;
  count: number;
  level: number;
  eraRequired: Era;
}

export interface Technology {
  id: string;
  name: string;
  description: string;
  cost: Partial<Record<ResourceType, number>>;
  unlocked: boolean;
  eraRequired: Era;
  unlocksEra?: Era;
}

export interface GameEvent {
  id: string;
  timestamp: number;
  message: string;
  type: 'info' | 'success' | 'warning' | 'era';
}
