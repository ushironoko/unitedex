import { pokemonMatchupData } from "../data/pokemonMatchupData";
import type { UsePokemonDataReturn } from "../types";

export const usePokemonData = (): UsePokemonDataReturn => {
  return {
    data: pokemonMatchupData,
  };
};
