export const TYPE_NAMES = [
  'normal',
  'fighting',
  'flying',
  'poison',
  'ground',
  'rock',
  'bug',
  'ghost',
  'steel',
  'fire',
  'water',
  'grass',
  'electric',
  'psychic',
  'ice',
  'dragon',
  'dark',
  'fairy',
] as const;

export type TypeName = (typeof TYPE_NAMES)[number];

export type PokemonSlot = {
  id: string;
  nickname: string;
  types: TypeName[];
  fastMove: TypeName | null;
  chargedMoves: TypeName[];
};

export type SavedTeam = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  slots: PokemonSlot[];
};

export type SlotAnalysis = {
  slotId: string;
  attackBest: number;
  attackAverage: number;
  incomingRisk: number;
  finalScore: number;
  overallLabel: '굉장' | '보통' | '별로';
  offenseLabel: '굉장' | '보통' | '별로';
  defenseLabel: '굉장' | '보통' | '별로';
  reasons: string[];
};
