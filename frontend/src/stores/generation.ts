import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import type { GenerationResponse, OutlineSection, QANote } from "@/api/generated";

interface SectionContent {
  heading: string;
  text: string; // streamed plain text
  html?: string; // editor output once the user starts editing
}

// The in-progress generation lives only in the browser session (arch §7.2);
// the backend never stores generated content.
interface GenerationState {
  generation: GenerationResponse | null;
  outline: OutlineSection[];
  content: Record<string, SectionContent>;
  qaNotes: QANote[];
  setGeneration: (generation: GenerationResponse) => void;
  setOutline: (outline: OutlineSection[]) => void;
  setQaNotes: (qaNotes: QANote[]) => void;
  startSection: (sectionId: string, heading: string) => void;
  appendDelta: (sectionId: string, text: string) => void;
  setSectionHtml: (sectionId: string, html: string) => void;
  reset: () => void;
}

export const useGenerationStore = create<GenerationState>()(
  persist(
    (set) => ({
      generation: null,
      outline: [],
      content: {},
      qaNotes: [],
      setGeneration: (generation) => set({ generation }),
      setOutline: (outline) => set({ outline }),
      setQaNotes: (qaNotes) => set({ qaNotes }),
      startSection: (sectionId, heading) =>
        set((state) => ({
          content: { ...state.content, [sectionId]: { heading, text: "" } },
        })),
      appendDelta: (sectionId, text) =>
        set((state) => {
          const current = state.content[sectionId] ?? { heading: "", text: "" };
          return {
            content: {
              ...state.content,
              [sectionId]: { ...current, text: current.text + text },
            },
          };
        }),
      setSectionHtml: (sectionId, html) =>
        set((state) => {
          const current = state.content[sectionId] ?? { heading: "", text: "" };
          return {
            content: { ...state.content, [sectionId]: { ...current, html } },
          };
        }),
      reset: () => set({ generation: null, outline: [], content: {}, qaNotes: [] }),
    }),
    {
      name: "active-generation",
      storage: createJSONStorage(() => sessionStorage),
    },
  ),
);
