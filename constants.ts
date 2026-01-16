
import { Era, Building, Technology, ResourceType } from './types';

export const INITIAL_RESOURCES: Record<ResourceType, { name: string, icon: string }> = {
  sticks: { name: 'Gravetos', icon: '🌿' },
  stones: { name: 'Pedras', icon: '⛰️' },
  food: { name: 'Comida', icon: '🍖' },
  bronze: { name: 'Bronze', icon: '🛡️' },
  iron: { name: 'Ferro', icon: '⚔️' },
  gold: { name: 'Ouro', icon: '💰' },
  coal: { name: 'Carvão', icon: '⬛' },
  electricity: { name: 'Energia', icon: '⚡' },
  data: { name: 'Dados', icon: '💾' },
  antimatter: { name: 'Antimatéria', icon: '⚛️' },
};

export const BUILDINGS_DATA: Building[] = [
  {
    id: 'campfire',
    name: 'Altar Primitivo',
    description: 'Chamas sagradas que produzem sustento básico.',
    baseCost: { sticks: 15 },
    baseProduction: { food: 1.5 },
    count: 0,
    level: 1,
    eraRequired: Era.STONE
  },
  {
    id: 'shelter',
    name: 'Cabana de Ramos',
    description: 'Abrigo simples que organiza a coleta de galhos.',
    baseCost: { sticks: 60, food: 15 },
    baseProduction: { sticks: 2.5 },
    count: 0,
    level: 1,
    eraRequired: Era.STONE
  },
  {
    id: 'quarry',
    name: 'Escavação de Encosta',
    description: 'Local de extração de rochas brutas da montanha.',
    baseCost: { sticks: 150, stones: 25 },
    baseProduction: { stones: 4.0 },
    count: 0,
    level: 1,
    eraRequired: Era.STONE
  },
  {
    id: 'mine',
    name: 'Fundição de Bronze',
    description: 'Fornalhas que refinam metais avermelhados.',
    baseCost: { stones: 500, food: 300 },
    baseProduction: { bronze: 2.0 },
    count: 0,
    level: 1,
    eraRequired: Era.BRONZE
  },
  {
    id: 'blacksmith',
    name: 'Forja de Aço',
    description: 'Martelos de ferro moldando o futuro industrial.',
    baseCost: { bronze: 400, stones: 1200, food: 800 },
    baseProduction: { iron: 5.0 },
    count: 0,
    level: 1,
    eraRequired: Era.IRON
  },
  {
    id: 'market',
    name: 'Bolsa de Valores',
    description: 'Capitalismo em sua forma mais pura e lucrativa.',
    baseCost: { iron: 1000, food: 6000 },
    baseProduction: { gold: 15.0 },
    count: 0,
    level: 1,
    eraRequired: Era.MEDIEVAL
  }
];

export const TECHNOLOGIES_DATA: Technology[] = [
  {
    id: 'tools',
    name: 'Pedra Lascada',
    description: 'Ferramentas afiadas multiplicam sua força física por 8x.',
    cost: { sticks: 50, stones: 20 },
    unlocked: false,
    eraRequired: Era.STONE
  },
  {
    id: 'metallurgy',
    name: 'Domínio Térmico',
    description: 'O segredo para fundir rochas. Desbloqueia a Era do Bronze.',
    cost: { sticks: 400, stones: 400, food: 300 },
    unlocked: false,
    eraRequired: Era.STONE,
    unlocksEra: Era.BRONZE
  },
  {
    id: 'steam_power',
    name: 'Vapor e Pistão',
    description: 'A força da água fervente. Desbloqueia a Era Industrial.',
    cost: { iron: 2000, gold: 500, stones: 5000 },
    unlocked: false,
    eraRequired: Era.IRON,
    unlocksEra: Era.INDUSTRIAL
  }
];

export const ERA_ORDER = [
  Era.STONE, Era.BRONZE, Era.IRON, Era.MEDIEVAL, Era.INDUSTRIAL, 
  Era.MODERN, Era.DIGITAL, Era.SPACE, Era.FUTURE, Era.TRANSCENDENCE
];

export const BUILDING_ICONS: Record<string, string> = {
  campfire: '🔥',
  shelter: '⛺',
  quarry: '⛏️',
  mine: '🚜',
  workshop: '🔨',
  blacksmith: '⚒️',
  farm: '🌾',
  market: '⚖️',
  castle: '🏰'
};
