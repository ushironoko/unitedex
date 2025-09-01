import type { UsePokemonDataReturn } from "../types";
import { pokemonMatchupData } from "../data/pokemonMatchupData";

export const usePokemonData = (): UsePokemonDataReturn => {
  return {
    data: pokemonMatchupData,
  };
};
