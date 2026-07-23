import { createInitialModel, type AppModel } from "./store";

export const STORAGE_KEY = "nexus.v1.phase1";

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export function loadAppModel(storage?: StorageLike): AppModel {
  if (!storage) {
    return createInitialModel();
  }

  const raw = storage.getItem(STORAGE_KEY);
  if (!raw) {
    return createInitialModel();
  }

  try {
    const parsed = JSON.parse(raw) as Partial<AppModel> | null;
    if (!parsed || typeof parsed !== "object" || !parsed.state || !parsed.data) {
      return createInitialModel();
    }

    return {
      state: parsed.state,
      data: parsed.data
    } as AppModel;
  } catch {
    return createInitialModel();
  }
}

export function saveAppModel(model: AppModel, storage?: StorageLike): void {
  if (!storage) {
    return;
  }

  storage.setItem(STORAGE_KEY, JSON.stringify(model));
}
