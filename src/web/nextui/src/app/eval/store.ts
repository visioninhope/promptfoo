import type { ResultLightweightWithLabel } from '@/../../../types';
import { getApiBaseUrl } from '@/api';
import { get, set, del } from 'idb-keyval';
import { create } from 'zustand';
import { persist, createJSONStorage, StateStorage } from 'zustand/middleware';
import type { EvaluateTable, UnifiedConfig } from './types';

const storage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    return (await get(name)) || null;
  },
  setItem: async (name: string, value: string): Promise<void> => {
    await set(name, value);
  },
  removeItem: async (name: string): Promise<void> => {
    await del(name);
  },
};

interface TableState {
  evalId: string | null;
  setEvalId: (evalId: string) => void;

  author: string | null;
  setAuthor: (author: string | null) => void;

  table: EvaluateTable | null;
  setTable: (table: EvaluateTable | null) => void;

  config: Partial<UnifiedConfig> | null;
  setConfig: (config: Partial<UnifiedConfig> | null) => void;

  maxTextLength: number;
  setMaxTextLength: (maxTextLength: number) => void;
  wordBreak: 'break-word' | 'break-all';
  setWordBreak: (wordBreak: 'break-word' | 'break-all') => void;
  showInferenceDetails: boolean;
  setShowInferenceDetails: (showInferenceDetails: boolean) => void;
  renderMarkdown: boolean;
  setRenderMarkdown: (renderMarkdown: boolean) => void;
  prettifyJson: boolean;
  setPrettifyJson: (prettifyJson: boolean) => void;
  showPrompts: boolean;
  setShowPrompts: (showPrompts: boolean) => void;
  showPassFail: boolean;
  setShowPassFail: (showPassFail: boolean) => void;

  inComparisonMode: boolean;
  setInComparisonMode: (inComparisonMode: boolean) => void;

  recentEvals: ResultLightweightWithLabel[];
  setRecentEvals: (recentEvals: ResultLightweightWithLabel[]) => void;
  fetchRecentEvals: () => Promise<ResultLightweightWithLabel[]>;
}

export const useStore = create<TableState>()(
  persist(
    (set, get) => ({
      evalId: null,
      setEvalId: (evalId: string) => set(() => ({ evalId })),

      author: null,
      setAuthor: (author: string | null) => set(() => ({ author })),

      table: null,
      setTable: (table: EvaluateTable | null) => set(() => ({ table })),
      config: null,
      setConfig: (config: Partial<UnifiedConfig> | null) => set(() => ({ config })),

      maxTextLength: 250,
      setMaxTextLength: (maxTextLength: number) => set(() => ({ maxTextLength })),
      wordBreak: 'break-word',
      setWordBreak: (wordBreak: 'break-word' | 'break-all') => set(() => ({ wordBreak })),
      showInferenceDetails: true,
      setShowInferenceDetails: (showInferenceDetails: boolean) =>
        set(() => ({ showInferenceDetails })),
      renderMarkdown: false,
      setRenderMarkdown: (renderMarkdown: boolean) => set(() => ({ renderMarkdown })),
      prettifyJson: false,
      setPrettifyJson: (prettifyJson: boolean) => set(() => ({ prettifyJson })),
      showPrompts: false,
      setShowPrompts: (showPrompts: boolean) => set(() => ({ showPrompts })),
      showPassFail: true,
      setShowPassFail: (showPassFail: boolean) => set(() => ({ showPassFail })),

      inComparisonMode: false,
      setInComparisonMode: (inComparisonMode: boolean) => set(() => ({ inComparisonMode })),

      recentEvals: [],
      setRecentEvals: (recentEvals: ResultLightweightWithLabel[]) => set(() => ({ recentEvals })),
      fetchRecentEvals: async () => {
        const state = get();
        if (state.recentEvals.length === 0) {
          const apiBaseUrl = await getApiBaseUrl();
          const resp = await fetch(`${apiBaseUrl}/api/results`, { cache: 'no-store' });
          const body = (await resp.json()) as { data: ResultLightweightWithLabel[] };
          set({ recentEvals: body.data });
          return body.data;
        }
        return state.recentEvals;
      },
    }),
    {
      name: 'ResultsViewStorage',
      storage: createJSONStorage(() => storage),
    },
  ),
);
