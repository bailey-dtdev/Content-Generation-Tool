import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import type { GenerationResponse, OutlineSection } from "@/api/generated";

// The in-progress generation lives only in the browser session (arch §7.2);
// the backend never stores generated content.
interface GenerationState {
  generation: GenerationResponse | null;
  outline: OutlineSection[];
  setGeneration: (generation: GenerationResponse) => void;
  setOutline: (outline: OutlineSection[]) => void;
  reset: () => void;
}

export const useGenerationStore = create<GenerationState>()(
  persist(
    (set) => ({
      generation: null,
      outline: [],
      setGeneration: (generation) => set({ generation }),
      setOutline: (outline) => set({ outline }),
      reset: () => set({ generation: null, outline: [] }),
    }),
    {
      name: "active-generation",
      storage: createJSONStorage(() => sessionStorage),
    },
  ),
);
