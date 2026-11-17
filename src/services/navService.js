/**
 * NAV Service
 * Handles data fetching and caching for GPF NAV summary, chart data, and full history.
 */

let _cachedSummary = null;
let _cachedChart = null;
let _cachedHistory = null;

/**
 * Universal JSON fetcher supporting browser fetch with relative path fallbacks
 * and Node.js testing environments.
 */
async function loadJson(primaryUrl, relativeFallback) {
  const isBrowser = typeof window !== 'undefined' && typeof window.document !== 'undefined' && window.location && !!window.location.origin;

  // In browser environments
  if (isBrowser && typeof window.fetch === 'function') {
    const urls = [
      `./${primaryUrl.replace(/^\.?\//, '')}`,
      primaryUrl,
      `./${relativeFallback.replace(/^\.?\//, '')}`,
      relativeFallback
    ];
    for (const u of urls) {
      try {
        const res = await window.fetch(u);
        if (res && res.ok) {
          return await res.json();
        }
      } catch {
        // continue to next URL candidate
      }
    }
  }

  // In Node.js testing environment or if fetch is unavailable
  try {
    const fsMod = 'node:fs';
    const pathMod = 'node:path';
    const fs = await import(/* @vite-ignore */ fsMod);
    const path = await import(/* @vite-ignore */ pathMod);
    const resolvedPath = path.resolve(relativeFallback);
    if (fs.existsSync(resolvedPath)) {
      const content = fs.readFileSync(resolvedPath, 'utf8');
      return JSON.parse(content);
    }
  } catch {
    // ignore node-specific errors in non-node runtimes
  }

  // Fallback if URL is absolute and fetch is available
  if (typeof globalThis.fetch === 'function' && primaryUrl.startsWith('http')) {
    try {
      const res = await globalThis.fetch(primaryUrl);
      if (res.ok) return await res.json();
    } catch {
      // ignore
    }
  }

  throw new Error(`Failed to load JSON data from ${primaryUrl} or ${relativeFallback}`);
}

/**
 * Fetch NAV summary statistics for all 15 plans.
 * @param {Object} [options]
 * @param {boolean} [options.forceReload=false]
 * @returns {Promise<Object>}
 */
export async function fetchSummary(options = {}) {
  if (_cachedSummary && !options.forceReload) {
    return _cachedSummary;
  }

  const data = await loadJson('/data/nav_summary.json', 'public/data/nav_summary.json');
  _cachedSummary = data;
  return _cachedSummary;
}

/**
 * Fetch optimized NAV chart history (for ApexCharts).
 * @param {Object} [options]
 * @param {boolean} [options.forceReload=false]
 * @returns {Promise<Object>}
 */
export async function fetchChartData(options = {}) {
  if (_cachedChart && !options.forceReload) {
    return _cachedChart;
  }

  const data = await loadJson('/data/nav_chart.json', 'public/data/nav_chart.json');
  _cachedChart = data;
  return _cachedChart;
}

/**
 * Fetch full historical NAV data with metadata.
 * @param {Object} [options]
 * @param {boolean} [options.forceReload=false]
 * @returns {Promise<Object>}
 */
export async function fetchFullHistory(options = {}) {
  if (_cachedHistory && !options.forceReload) {
    return _cachedHistory;
  }

  const data = await loadJson('/data/nav_history.json', 'public/data/nav_history.json');
  _cachedHistory = data;
  return _cachedHistory;
}

/**
 * Retrieve plan details from cached or provided summary.
 * @param {string} planKey
 * @param {Object} [summary]
 * @returns {Object|null}
 */
export function getPlanDetails(planKey, summary = _cachedSummary) {
  if (!summary || !summary.plans) return null;
  return summary.plans[planKey] || null;
}

/**
 * Clear in-memory cache
 */
export function clearCache() {
  _cachedSummary = null;
  _cachedChart = null;
  _cachedHistory = null;
}

export default {
  fetchSummary,
  fetchChartData,
  fetchFullHistory,
  getPlanDetails,
  clearCache,
};
