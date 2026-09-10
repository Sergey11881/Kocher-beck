import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

export interface DraftAttachment {
  id: string;
  name: string;
  uri: string;
  mimeType?: string;
  size?: number;
}

export interface LocalDraft {
  id: string;
  productType: string;
  client: string;
  contact: string;
  comment: string;
  data: Record<string, string>;
  fileNames: string[];
  attachments?: DraftAttachment[];
  step?: number;
  updatedAt: string;
}

interface DraftInput extends Omit<LocalDraft, 'id' | 'updatedAt'> {
  step?: number;
}

interface DraftsContextValue {
  drafts: LocalDraft[];
  isLoading: boolean;
  saveDraft: (draft: DraftInput, id?: string) => Promise<LocalDraft>;
  deleteDraft: (id: string) => Promise<void>;
  getDraft: (id: string) => LocalDraft | undefined;
}

const DraftsContext = createContext<DraftsContextValue | null>(null);
const STORAGE_KEY = '@print-fixture-orders/drafts';

function makeId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function OrdersProvider({ children }: { children: ReactNode }) {
  const [drafts, setDrafts] = useState<LocalDraft[]>([]);
  const draftsRef = useRef<LocalDraft[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((stored) => {
        if (!active || !stored) return;
        const parsed = JSON.parse(stored) as unknown;
        if (Array.isArray(parsed)) {
          const validDrafts = parsed.filter((draft): draft is LocalDraft => (
            typeof draft === 'object'
            && draft !== null
            && typeof draft.id === 'string'
            && typeof draft.productType === 'string'
            && typeof draft.data === 'object'
            && draft.data !== null
            && !Array.isArray(draft.data)
          ));
          draftsRef.current = validDrafts;
          setDrafts(validDrafts);
        }
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

  const saveDraft = useCallback(async (input: DraftInput, id?: string) => {
    const draft: LocalDraft = {
      ...input,
      id: id ?? makeId(),
      updatedAt: new Date().toISOString(),
    };
    const nextDrafts = id
      ? [draft, ...draftsRef.current.filter((item) => item.id !== id)]
      : [draft, ...draftsRef.current];
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(nextDrafts));
    draftsRef.current = nextDrafts;
    setDrafts(nextDrafts);
    return draft;
  }, []);

  const deleteDraft = useCallback(async (id: string) => {
    const nextDrafts = draftsRef.current.filter((draft) => draft.id !== id);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(nextDrafts));
    draftsRef.current = nextDrafts;
    setDrafts(nextDrafts);
  }, []);

  const getDraft = useCallback((id: string) => drafts.find((draft) => draft.id === id), [drafts]);

  const value = useMemo(
    () => ({ drafts, isLoading, saveDraft, deleteDraft, getDraft }),
    [drafts, isLoading, saveDraft, deleteDraft, getDraft],
  );
  return <DraftsContext.Provider value={value}>{children}</DraftsContext.Provider>;
}

export function useDrafts() {
  const context = useContext(DraftsContext);
  if (!context) throw new Error('useDrafts must be used within OrdersProvider');
  return context;
}