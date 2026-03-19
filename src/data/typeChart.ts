import type { TypeName } from '../types';

const N = 1;
const S = 1.25;
const W = 0.8;

export const typeChart: Record<TypeName, Record<TypeName, number>> = {
  normal: { normal: N, fighting: N, flying: N, poison: N, ground: N, rock: W, bug: N, ghost: W, steel: W, fire: N, water: N, grass: N, electric: N, psychic: N, ice: N, dragon: N, dark: N, fairy: N },
  fighting: { normal: S, fighting: N, flying: W, poison: W, ground: N, rock: S, bug: W, ghost: W, steel: S, fire: N, water: N, grass: N, electric: N, psychic: W, ice: S, dragon: N, dark: S, fairy: W },
  flying: { normal: N, fighting: S, flying: N, poison: N, ground: N, rock: W, bug: S, ghost: N, steel: W, fire: N, water: N, grass: S, electric: W, psychic: N, ice: N, dragon: N, dark: N, fairy: N },
  poison: { normal: N, fighting: N, flying: N, poison: W, ground: W, rock: W, bug: N, ghost: W, steel: W, fire: N, water: N, grass: S, electric: N, psychic: N, ice: N, dragon: N, dark: N, fairy: S },
  ground: { normal: N, fighting: N, flying: W, poison: S, ground: N, rock: S, bug: W, ghost: N, steel: S, fire: S, water: N, grass: W, electric: S, psychic: N, ice: N, dragon: N, dark: N, fairy: N },
  rock: { normal: N, fighting: W, flying: S, poison: N, ground: W, rock: N, bug: S, ghost: N, steel: W, fire: S, water: N, grass: N, electric: N, psychic: N, ice: S, dragon: N, dark: N, fairy: N },
  bug: { normal: N, fighting: W, flying: W, poison: W, ground: N, rock: N, bug: N, ghost: W, steel: W, fire: W, water: N, grass: S, electric: N, psychic: S, ice: N, dragon: N, dark: S, fairy: W },
  ghost: { normal: W, fighting: N, flying: N, poison: N, ground: N, rock: N, bug: N, ghost: S, steel: N, fire: N, water: N, grass: N, electric: N, psychic: S, ice: N, dragon: N, dark: W, fairy: N },
  steel: { normal: N, fighting: N, flying: N, poison: N, ground: N, rock: S, bug: N, ghost: N, steel: W, fire: W, water: W, grass: N, electric: W, psychic: N, ice: S, dragon: N, dark: N, fairy: S },
  fire: { normal: N, fighting: N, flying: N, poison: N, ground: N, rock: W, bug: S, ghost: N, steel: S, fire: W, water: W, grass: S, electric: N, psychic: N, ice: S, dragon: W, dark: N, fairy: N },
  water: { normal: N, fighting: N, flying: N, poison: N, ground: S, rock: S, bug: N, ghost: N, steel: N, fire: S, water: W, grass: W, electric: N, psychic: N, ice: N, dragon: W, dark: N, fairy: N },
  grass: { normal: N, fighting: N, flying: W, poison: W, ground: S, rock: S, bug: W, ghost: N, steel: W, fire: W, water: S, grass: W, electric: N, psychic: N, ice: N, dragon: W, dark: N, fairy: N },
  electric: { normal: N, fighting: N, flying: S, poison: N, ground: W, rock: N, bug: N, ghost: N, steel: N, fire: N, water: S, grass: W, electric: W, psychic: N, ice: N, dragon: W, dark: N, fairy: N },
  psychic: { normal: N, fighting: S, flying: N, poison: S, ground: N, rock: N, bug: N, ghost: N, steel: W, fire: N, water: N, grass: N, electric: N, psychic: W, ice: N, dragon: N, dark: W, fairy: N },
  ice: { normal: N, fighting: N, flying: S, poison: N, ground: S, rock: N, bug: N, ghost: N, steel: W, fire: W, water: W, grass: S, electric: N, psychic: N, ice: W, dragon: S, dark: N, fairy: N },
  dragon: { normal: N, fighting: N, flying: N, poison: N, ground: N, rock: N, bug: N, ghost: N, steel: W, fire: N, water: N, grass: N, electric: N, psychic: N, ice: N, dragon: S, dark: N, fairy: W },
  dark: { normal: N, fighting: W, flying: N, poison: N, ground: N, rock: N, bug: N, ghost: S, steel: N, fire: N, water: N, grass: N, electric: N, psychic: S, ice: N, dragon: N, dark: W, fairy: W },
  fairy: { normal: N, fighting: S, flying: N, poison: W, ground: N, rock: N, bug: N, ghost: N, steel: W, fire: W, water: N, grass: N, electric: N, psychic: N, ice: N, dragon: S, dark: S, fairy: N },
};
