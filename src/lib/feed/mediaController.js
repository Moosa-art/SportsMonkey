/**
 * src/lib/feed/mediaController.js
 *
 * Tiny module-level coordinator so that AT MOST ONE inline feed video plays at
 * a time (matching native social-app behaviour). A card claims the "active"
 * slot when it autoplays; claiming asks the previous holder to pause itself.
 *
 * Intentionally framework-agnostic and side-effect-free apart from the single
 * module-scoped reference, so it is trivial to reason about and unit-test.
 */

let current = null; // { id: string, pause: () => void }

/**
 * Claim the single playback slot for `id`. If another holder owns it, that
 * holder's `pause` callback is invoked first.
 * @param {string} id
 * @param {() => void} pause
 */
export function claimPlayback(id, pause) {
  if (current && current.id !== id && typeof current.pause === 'function') {
    try {
      current.pause();
    } catch {
      /* a card may have unmounted — ignore */
    }
  }
  current = { id, pause };
}

/**
 * Release the slot if (and only if) `id` currently owns it.
 * @param {string} id
 */
export function releasePlayback(id) {
  if (current && current.id === id) current = null;
}
