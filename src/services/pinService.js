/**
 * Pin Service
 * Manages client-side price level pinning saved in localStorage under key `gpf_pinned_levels_v1`.
 * Dispatches `pins-changed` CustomEvent whenever pins are added or removed.
 */

export const STORAGE_KEY = 'gpf_pinned_levels_v1';

/**
 * In-memory fallback if localStorage is unavailable
 */
let _memoryStore = {};

/**
 * Get safe storage reference (localStorage or in-memory fallback)
 */
function getStorage() {
  if (typeof globalThis !== 'undefined' && globalThis.localStorage) {
    return globalThis.localStorage;
  }
  if (typeof window !== 'undefined' && window.localStorage) {
    return window.localStorage;
  }
  return null;
}

/**
 * Dispatch `pins-changed` event on document and window
 */
function dispatchChangeEvent(detail = {}) {
  const event = typeof CustomEvent !== 'undefined'
    ? new CustomEvent('pins-changed', { bubbles: true, detail })
    : { type: 'pins-changed', detail, bubbles: true };

  if (typeof document !== 'undefined' && typeof document.dispatchEvent === 'function') {
    try {
      document.dispatchEvent(event);
    } catch {
      // ignore
    }
  }

  if (typeof window !== 'undefined' && window !== document && typeof window.dispatchEvent === 'function') {
    try {
      window.dispatchEvent(event);
    } catch {
      // ignore
    }
  }
}

/**
 * Retrieve all pinned price levels grouped by plan key.
 * @returns {Record<string, Array<{ id: string, value: number, note: string, createdAt: string }>>}
 */
export function getPins() {
  const storage = getStorage();
  if (storage) {
    try {
      const raw = storage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('[pinService] Failed to parse pins from storage:', e);
    }
    return {};
  }
  return _memoryStore;
}

/**
 * Save dictionary of pins into storage.
 */
function savePins(allPins) {
  const storage = getStorage();
  if (storage) {
    try {
      storage.setItem(STORAGE_KEY, JSON.stringify(allPins));
    } catch (e) {
      console.error('[pinService] Failed to save pins to storage:', e);
    }
  } else {
    _memoryStore = allPins;
  }
}

/**
 * Retrieve pinned price levels for a specific plan key.
 * @param {string} planKey
 * @returns {Array<{ id: string, value: number, note: string, createdAt: string }>}
 */
export function getPinsForPlan(planKey) {
  if (!planKey) return [];
  const all = getPins();
  return Array.isArray(all[planKey]) ? all[planKey] : [];
}

/**
 * Add a new pinned price level for a plan.
 * @param {string} planKey
 * @param {number|string} value - Target NAV price level
 * @param {string} [note=''] - Optional note or description
 * @returns {{ id: string, value: number, note: string, createdAt: string }}
 */
export function addPin(planKey, value, note = '') {
  if (!planKey) {
    throw new Error('Plan key is required to add pin');
  }

  const numVal = parseFloat(value);
  if (isNaN(numVal) || numVal <= 0) {
    throw new Error('Pin value must be a positive number');
  }

  const allPins = getPins();
  if (!Array.isArray(allPins[planKey])) {
    allPins[planKey] = [];
  }

  const newPin = {
    id: `pin_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    value: Number(numVal.toFixed(4)),
    note: String(note || '').trim(),
    createdAt: new Date().toISOString()
  };

  allPins[planKey].push(newPin);
  savePins(allPins);

  dispatchChangeEvent({
    action: 'add',
    planKey,
    pin: newPin,
    pins: allPins[planKey]
  });

  return newPin;
}

/**
 * Remove a pinned price level by plan key and pin ID.
 * @param {string} planKey
 * @param {string} pinId
 * @returns {boolean} True if removed, false otherwise
 */
export function removePin(planKey, pinId) {
  if (!planKey || !pinId) return false;

  const allPins = getPins();
  if (!Array.isArray(allPins[planKey])) return false;

  const initialLength = allPins[planKey].length;
  allPins[planKey] = allPins[planKey].filter(p => p.id !== pinId);

  if (allPins[planKey].length !== initialLength) {
    if (allPins[planKey].length === 0) {
      delete allPins[planKey];
    }
    savePins(allPins);

    dispatchChangeEvent({
      action: 'remove',
      planKey,
      pinId,
      pins: allPins[planKey] || []
    });

    return true;
  }

  return false;
}

/**
 * Clear all pins for a specific plan or globally.
 * @param {string} [planKey]
 */
export function clearPins(planKey = null) {
  const allPins = getPins();
  if (planKey) {
    delete allPins[planKey];
    savePins(allPins);
    dispatchChangeEvent({ action: 'clear', planKey, pins: [] });
  } else {
    savePins({});
    dispatchChangeEvent({ action: 'clearAll', pins: {} });
  }
}

export default {
  STORAGE_KEY,
  getPins,
  getPinsForPlan,
  addPin,
  removePin,
  clearPins
};
