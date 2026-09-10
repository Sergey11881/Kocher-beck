import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

export interface DraftAttachment {
  id: string;
  name: string;
  uri: string;
  mimeType?: string;
  size?: number;
}

export const TEMPLATE_VERSION = 1;

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

export interface LocalTemplate {
  id: string;
  version: number;
  name: string;
  productType: string;
  client: string;
  contact: string;
  comment: string;
  data: Record<string, string>;
  fileNames: string[];
  attachments?: DraftAttachment[];
  createdAt: string;
  updatedAt: string;
}

interface DraftInput extends Omit<LocalDraft, 'id' | 'updatedAt'> {
  step?: number;
}

export interface TemplateInput {
  name: string;
  productType: string;
  client: string;
  contact: string;
  comment: string;
  data: Record<string, string>;
  fileNames: string[];
  attachments?: DraftAttachment[];
}

interface DraftsContextValue {
  drafts: LocalDraft[];
  templates: LocalTemplate[];
  isLoading: boolean;
  templatesLoading: boolean;
  saveDraft: (draft: DraftInput, id?: string) => Promise<LocalDraft>;
  deleteDraft: (id: string) => Promise<void>;
  getDraft: (id: string) => LocalDraft | undefined;
  saveTemplate: (template: TemplateInput, id?: string) => Promise<LocalTemplate>;
  deleteTemplate: (id: string) => Promise<void>;
  renameTemplate: (id: string, name: string) => Promise<void>;
  getTemplate: (id: string) => LocalTemplate | undefined;
}

const DraftsContext = createContext<DraftsContextValue | null>(null);
const STORAGE_KEY = '@print-fixture-orders/drafts';
const TEMPLATES_STORAGE_KEY = '@print-fixture-orders/templates';

function makeId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function OrdersProvider({ children }: { children: ReactNode }) {
  const [drafts, setDrafts] = useState<LocalDraft[]>([]);
  const draftsRef = useRef<LocalDraft[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [templates, setTemplates] = useState<LocalTemplate[]>([]);
  const templatesRef = useRef<LocalTemplate[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(true);

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

  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(TEMPLATES_STORAGE_KEY)
      .then((stored) => {
        if (!active || !stored) return;
        const parsed = JSON.parse(stored) as unknown;
        if (Array.isArray(parsed)) {
          const validTemplates = parsed.filter((template): template is LocalTemplate => (
            typeof template === 'object'
            && template !== null
            && typeof template.id === 'string'
            && typeof template.name === 'string'
            && typeof template.productType === 'string'
            && typeof template.data === 'object'
            && template.data !== null
            && !Array.isArray(template.data)
          )).map((template) => ({
            ...template,
            version: typeof template.version === 'number' ? template.version : TEMPLATE_VERSION,
            fileNames: Array.isArray(template.fileNames) ? template.fileNames.filter((file): file is string => typeof file === 'string') : [],
            createdAt: typeof template.createdAt === 'string' ? template.createdAt : new Date().toISOString(),
            updatedAt: typeof template.updatedAt === 'string' ? template.updatedAt : new Date().toISOString(),
          }));
          templatesRef.current = validTemplates;
          setTemplates(validTemplates);
        }
      })
      .catch((error: unknown) => {
        if (active) console.error('Failed to load local templates:', error);
      })
      .finally(() => {
        if (active) setTemplatesLoading(false);
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
  const saveTemplate = useCallback(async (input: TemplateInput, id?: string) => {
    const existing = id ? templatesRef.current.find((template) => template.id === id) : undefined;
    const now = new Date().toISOString();
    const template: LocalTemplate = {
      ...input,
      id: id ?? makeId(),
      version: TEMPLATE_VERSION,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };
    const nextTemplates = id
      ? [template, ...templatesRef.current.filter((item) => item.id !== id)]
      : [template, ...templatesRef.current];
    await AsyncStorage.setItem(TEMPLATES_STORAGE_KEY, JSON.stringify(nextTemplates));
    templatesRef.current = nextTemplates;
    setTemplates(nextTemplates);
    return template;
  }, []);

  const deleteTemplate = useCallback(async (id: string) => {
    const nextTemplates = templatesRef.current.filter((template) => template.id !== id);
    await AsyncStorage.setItem(TEMPLATES_STORAGE_KEY, JSON.stringify(nextTemplates));
    templatesRef.current = nextTemplates;
    setTemplates(nextTemplates);
  }, []);

  const renameTemplate = useCallback(async (id: string, name: string) => {
    const template = templatesRef.current.find((item) => item.id === id);
    if (!template || !name.trim()) return;
    await saveTemplate({ ...template, name: name.trim() }, id);
  }, [saveTemplate]);

  const getTemplate = useCallback((id: string) => templates.find((template) => template.id === id), [templates]);

  const value = useMemo(
    () => ({
      drafts, templates, isLoading, templatesLoading, saveDraft, deleteDraft, getDraft,
      saveTemplate, deleteTemplate, renameTemplate, getTemplate,
    }),
    [drafts, templates, isLoading, templatesLoading, saveDraft, deleteDraft, getDraft, saveTemplate, deleteTemplate, renameTemplate, getTemplate],
  );
  return <DraftsContext.Provider value={value}>{children}</DraftsContext.Provider>;
}

export function useDrafts() {
  const context = useContext(DraftsContext);
  if (!context) throw new Error('useDrafts must be used within OrdersProvider');
  return context;
}