/**
 * src/lib/feed/userPrefs.js
 *
 * Tiny localStorage-backed stores for client-side personalisation:
 *   - favourites: Set of feed-item dedupeIds the user bookmarked
 *   - following:  Set of normalized source keys the user follows
 *
 * Implemented as external stores consumed via React's useSyncExternalStore, so
 * any component (filter tabs, cards, the feed) re-renders immediately and stays
 * consistent when state changes anywhere in the tree. State persists across
 * refresh / new tab and is resilient to private-mode storage errors.
 */

import { useCallback, useSyncExternalStore } from 'react';
import { STORAGE_KEYS } from './feedConfig.js';

function createSetStore(storageKey) {
  /** @type {Set<() => void>} */
  const listeners = new Set();
  let current = load();

  function load() {
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return new Set();
      const arr = JSON.parse(raw);
      return new Set(Array.isArray(arr) ? arr.map(String) : []);
    } catch {
      return new Set();
    }
  }

  function persist(next) {
    try {
      localStorage.setItem(storageKey, JSON.stringify([...next]));
    } catch {
      /* ignore quota / privacy-mode errors */
    }
  }

  function emit() {
    listeners.forEach((l) => l());
  }

  // Cross-tab sync: mirror changes made in other tabs.
  if (typeof window !== 'undefined') {
    window.addEventListener('storage', (e) => {
      if (e.key === storageKey) {
        current = load();
        emit();
      }
    });
  }

  return {
    getSnapshot: () => current,
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    has: (id) => current.has(String(id)),
    toggle: (id) => {
      const key = String(id);
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      current = next;
      persist(next);
      emit();
    },
    set: (id, on) => {
      const key = String(id);
      if (current.has(key) === !!on) return;
      const next = new Set(current);
      if (on) next.add(key);
      else next.delete(key);
      current = next;
      persist(next);
      emit();
    },
    // Replace the entire set — used to hydrate from the server on login so the
    // store reflects saves made on other devices (server is source of truth).
    replaceAll: (ids) => {
      const next = new Set((Array.isArray(ids) ? ids : []).map(String));
      current = next;
      persist(next);
      emit();
    },
    // Clear the store — used on logout so one browser never leaks another
    // account's bookmarks.
    reset: () => {
      current = new Set();
      persist(current);
      emit();
    },
  };
}

export const favoritesStore = createSetStore(STORAGE_KEYS.favorites);
export const followingStore = createSetStore(STORAGE_KEYS.following);

function useSetStore(store) {
  const snapshot = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);
  const has = useCallback((id) => snapshot.has(String(id)), [snapshot]);
  const toggle = useCallback((id) => store.toggle(id), [store]);
  const set = useCallback((id, on) => store.set(id, on), [store]);
  return { items: snapshot, has, toggle, set };
}

export function useFavorites() {
  return useSetStore(favoritesStore);
}

export function useFollowing() {
  return useSetStore(followingStore);
}
