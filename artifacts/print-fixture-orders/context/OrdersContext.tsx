import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';

export interface LocalDraft {
  id: string;
  productType: string;
  client: string;
  contact: string;
  comment: string;
  data: Record<string, string>;
  fileNames: string[];
  updatedAt: string;
}

interface DraftInput extends Omit<LocalDraft, 'id' | 'updatedAt'> {}

interface DraftsContextValue {
  drafts: LocalDraft[];
  isLoading: boolean;
  saveDraft: (draft: DraftInput) => Promise<LocalDraft>;
}

const DraftsContext = createContext<DraftsContextValue | null>(null);
const STORAGE_KEY = '@print-fixture-orders/drafts';

function makeId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function OrdersProvider({ children }: { children: ReactNode }) {
  const [drafts, setDrafts] = useState<LocalDraft[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((stored) => {
        if (!active || !stored) return;
        const parsed = JSON.parse(stored) as LocalDraft[];
        if (Array.isArray(parsed)) setDrafts(parsed);
      })
      .catch((error: unknown) => {
        if (active) {
          console.error('Failed to load local drafts:', error);
        }
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const saveDraft = async (input: DraftInput) => {
    const draft: LocalDraft = { ...input, id: makeId(), updatedAt: new Date().toISOString() };
    const nextDrafts = [draft, ...drafts];
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(nextDrafts));
    setDrafts(nextDrafts);
    return draft;
  };

  const value = useMemo(() => ({ drafts, isLoading, saveDraft }), [drafts, isLoading]);
  return <DraftsContext.Provider value={value}>{children}</DraftsContext.Provider>;
}

export function useDrafts() {
  const context = useContext(DraftsContext);
  if (!context) throw new Error('useDrafts must be used within OrdersProvider');
  return context;
}