import { useCallback } from "react";
import { pokemonMatchupData } from "../data/pokemonMatchupData";
import { useLocalStorage } from "./useLocalStorage";
import { validatePokemonData } from "../utils/validation";
import type { UsePokemonDataReturn, PokemonData } from "../types";

const STORAGE_KEY = "custom_pokemon_matchup_data";

export const usePokemonData = (): UsePokemonDataReturn => {
  const [customData, setCustomData, removeCustomData] =
    useLocalStorage<PokemonData | null>(STORAGE_KEY, null);

  const uploadCustomData = useCallback(
    async (data: PokemonData): Promise<void> => {
      const validation = validatePokemonData(data);

      if (!validation.success) {
        const errorMessage =
          validation.errors?.join("\n") || "データの検証に失敗しました";
        throw new Error(errorMessage);
      }

      setCustomData(validation.data as PokemonData);
    },
    [setCustomData],
  );

  const resetToDefault = useCallback(() => {
    removeCustomData();
  }, [removeCustomData]);

  const downloadDefaultData = useCallback(() => {
    const dataStr = JSON.stringify(pokemonMatchupData, null, 2);
    const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`;

    const exportFileDefaultName = "pokemon_matchup_data.json";

    const linkElement = document.createElement("a");
    linkElement.setAttribute("href", dataUri);
    linkElement.setAttribute("download", exportFileDefaultName);
    linkElement.click();
  }, []);

  return {
    data: customData || pokemonMatchupData,
    isCustomData: !!customData,
    uploadCustomData,
    resetToDefault,
    downloadDefaultData,
  };
};
