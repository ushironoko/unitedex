import { useEffect, useState } from "react";

/**
 * 選択の変更をデバウンスして、頻繁な更新を防ぐ
 */
export const useDebouncedSelection = (
  selectedPokemon: string[],
  delay: number = 100, // 150msから100msに短縮
): string[] => {
  const [debouncedSelection, setDebouncedSelection] = useState(selectedPokemon);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSelection(selectedPokemon);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [selectedPokemon, delay]);

  return debouncedSelection;
};