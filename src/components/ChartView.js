/**
 * Interactive Multi-Series ApexCharts Component - Trading Terminal Edition
 * Displays GPF NAV historical trends with timeframe range filtering,
 * synchronized timeline, custom tooltip, active plan filtering, theme reactivity,
 * and dual mode: "NAV จริง (฿)" vs "% เปลี่ยนแปลง (%)" (Base 0% comparison).
 */

import navService, { fetchChartData, fetchFullHistory, fetchSummary } from '../services/navService.js';
import pinService from '../services/pinService.js';
import { TradingViewChart } from './TradingViewChart.js';

/**
 * Toast Notification Utility
 */
export function showToast(message, duration = 2800) {
  if (typeof document === 'undefined') return;
  let container = document.getElementById('gpf-toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'gpf-toast-container';
    container.className = 'gpf-toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = 'gpf-toast';
  toast.innerHTML = `<span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('fade-out');
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
  }, duration);
}

export const TIMEFRAMES = ['1M', '3M', '6M', 'YTD', '1Y', '3Y', '5Y', 'ALL'];

export const RANGE_DELTAS = {
  '1M': 30,
  '3M': 91,
  '6M': 182,
  '1Y': 365,
  '3Y': 1095,
  '5Y': 1826
};

export const THAI_MONTHS_SHORT = [
  'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
  'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
];

export const DEFAULT_PLAN_COLORS = {
  'แผนเชิงรุก 20': '#00BCD4',
  'แผนเชิงรุก 35': '#2196F3',
  'แผนเชิงรุก 65': '#E91E63',
  'แผนเชิงรุก 75': '#8BC34A',
  'แผนเงินฝากและตราสารหนี้ระยะสั้น': '#607D8B',
  'แผนตราสารหนี้': '#FF9800',
  'แผนตราสารหนี้ต่างประเทศ': '#009688',
  'แผนหุ้นไทย': '#F44336',
  'แผนหุ้นต่างประเทศ': '#9C27B0',
  'แผนกองทุนอสังหาริมทรัพย์ไทย': '#FF5722',
  'แผนทองคำ': '#FFC107',
  'แผนกองทุนรวมวายุภักษ์': '#3F51B5',
  'แผนการลงทุนตามหลักชะรีอะฮ์': '#059669',
  'แผนลงทุนพื้นฐานทั่วไป': '#4CAF50',
  'แผนเกษียณสบายใจ 2569': '#E11D48'
};

/**
 * Safely parse date string or Date object into a UTC Date
 */
export function parseDateUTC(dateInput) {
  if (dateInput instanceof Date) return dateInput;
  if (typeof dateInput === 'string') {
    const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(dateInput);
    if (match) {
      return new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
    }
  }
  return new Date(dateInput);
}

/**
 * Format a Date object to YYYY-MM-DD
 */
export function formatISODate(date) {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Calculate cutoff date for a given timeframe relative to a reference date.
 * Returns null for 'ALL'.
 */
export function calculateCutoffDate(timeframe, refDateInput) {
  if (timeframe === 'ALL') return null;
  const ref = parseDateUTC(refDateInput);
  if (isNaN(ref.getTime())) return null;

  if (timeframe === 'YTD') {
    return new Date(Date.UTC(ref.getUTCFullYear(), 0, 1));
  }

  const days = RANGE_DELTAS[timeframe];
  if (days != null) {
    return new Date(ref.getTime() - days * 86400000);
  }

  return null;
}

/**
 * Get plan color from summaryData or default palette
 */
export function getPlanColor(planName, summaryData = null) {
  if (summaryData?.plans?.[planName]?.color) {
    return summaryData.plans[planName].color;
  }
  return DEFAULT_PLAN_COLORS[planName] || '#388bfd';
}

/**
 * Slice and transform series data based on selected timeframe, active plans,
 * data resolution requirements, and display mode ('nav' | 'pct').
 */
export function sliceSeriesData({
  timeframe = '1Y',
  activePlans = ['แผนเชิงรุก 35'],
  historyData = null,
  chartData = null,
  summaryData = null,
  referenceDate = null,
  mode = 'nav'
}) {
  const activeList = Array.isArray(activePlans)
    ? activePlans
    : Array.from(activePlans || ['แผนเชิงรุก 35']);
  
  const finalActivePlans = activeList.length > 0 ? activeList : ['แผนเชิงรุก 35'];

  // Determine reference date (fallback to dataset's latest date)
  let refDate = referenceDate ? parseDateUTC(referenceDate) : null;
  if (!refDate || isNaN(refDate.getTime())) {
    if (historyData && historyData.length > 0) {
      refDate = parseDateUTC(historyData[historyData.length - 1].date);
    } else if (chartData?.dates && chartData.dates.length > 0) {
      refDate = parseDateUTC(chartData.dates[chartData.dates.length - 1]);
    } else {
      refDate = new Date();
    }
  }

  const cutoff = calculateCutoffDate(timeframe, refDate);
  const cutoffStr = cutoff ? formatISODate(cutoff) : null;

  // Slicing logic:
  // <= 1Y (1M, 3M, 6M, YTD, 1Y) -> use historyData (100% exact daily resolution)
  // > 1Y (3Y, 5Y, ALL) -> use chartData (downsampled 2,000 points)
  const isShortRange = ['1M', '3M', '6M', 'YTD', '1Y'].includes(timeframe);
  const useHistory = isShortRange && Boolean(historyData && historyData.length > 0);

  let rawResult = null;

  if (useHistory) {
    const filtered = cutoffStr
      ? historyData.filter(d => d.date >= cutoffStr)
      : historyData;

    const series = finalActivePlans.map(planName => {
      const data = filtered.map(row => {
        const ts = parseDateUTC(row.date).getTime();
        const val = row.plans ? row.plans[planName] ?? null : null;
        return [ts, val];
      });
      return {
        name: planName,
        data
      };
    });

    const colors = series.map(s => getPlanColor(s.name, summaryData));

    rawResult = {
      source: 'history',
      timeframe,
      series,
      colors
    };
  } else if (chartData && chartData.dates) {
    const startIdx = cutoffStr
      ? chartData.dates.findIndex(d => d >= cutoffStr)
      : 0;
    const validStartIdx = startIdx === -1 ? 0 : startIdx;
    const slicedDates = chartData.dates.slice(validStartIdx);
    const timestamps = slicedDates.map(d => parseDateUTC(d).getTime());

    const series = finalActivePlans.map(planName => {
      const raw = chartData.series?.find(s => s.name === planName);
      const rawData = raw ? raw.data.slice(validStartIdx) : [];
      const data = timestamps.map((ts, i) => [ts, rawData[i] ?? null]);
      return {
        name: planName,
        data
      };
    });

    const colors = series.map(s => getPlanColor(s.name, summaryData));

    rawResult = {
      source: 'chart',
      timeframe,
      series,
      colors
    };
  } else {
    rawResult = {
      source: 'empty',
      timeframe,
      series: [],
      colors: []
    };
  }

  // If mode is 'pct', normalize each series so its first valid non-zero point is 0.00%
  if (mode === 'pct' && rawResult.series.length > 0) {
    const normalizedSeries = rawResult.series.map(s => {
      let baseVal = null;
      for (const pt of s.data) {
        const v = pt[1];
        if (v != null && !isNaN(v) && v > 0) {
          baseVal = v;
          break;
        }
      }

      const normalizedData = s.data.map(([ts, val]) => {
        if (val == null || isNaN(val) || !baseVal) return [ts, null];
        const pct = ((val - baseVal) / baseVal) * 100;
        return [ts, Number(pct.toFixed(2))];
      });

      return {
        name: s.name,
        data: normalizedData
      };
    });

    return {
      ...rawResult,
      mode: 'pct',
      series: normalizedSeries
    };
  }

  return rawResult;
}

/**
 * Exponential Moving Average (EMA) Calculation
 */
export function calcEMA(data, period) {
  if (!data || data.length === 0) return [];
  const k = 2 / (period + 1);
  const ema = [data[0]];
  for (let i = 1; i < data.length; i++) {
    ema.push(data[i] * k + ema[i - 1] * (1 - k));
  }
  return ema;
}

/**
 * Relative Strength Index (RSI) Calculation using Wilder's Smoothing
 */
export function calcRSI(values, period = 14) {
  if (!values || values.length <= period) return 50;
  let gains = 0, losses = 0;
  for (let i = 1; i <= period; i++) {
    const change = values[i] - values[i - 1];
    if (change > 0) gains += change;
    else losses -= change;
  }
  let avgGain = gains / period;
  let avgLoss = losses / period;
  for (let i = period + 1; i < values.length; i++) {
    const change = values[i] - values[i - 1];
    const gain = change > 0 ? change : 0;
    const loss = change < 0 ? -change : 0;
    avgGain = ((avgGain * (period - 1)) + gain) / period;
    avgLoss = ((avgLoss * (period - 1)) + loss) / period;
  }
  if (avgLoss === 0) return avgGain > 0 ? 100 : 50;
  const rs = avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
}

/**
 * Technical Analysis Engine for a GPF plan
 * Computes Volatility, EMA(12), EMA(26), MACD Line, Signal(9), Histogram, RSI(14), and Golden/Dead Crosses
 */
export function analyzePlanTechnical(chartData, planName) {
  if (!chartData || !chartData.series || !chartData.dates || !planName) return null;
  const s = chartData.series.find(x => x.name === planName || x.name?.includes(planName));
  if (!s || !s.data) return null;

  const dates = [];
  const values = [];
  for (let i = 0; i < s.data.length; i++) {
    const v = s.data[i];
    if (v !== null && v !== undefined && v > 0) {
      dates.push(chartData.dates[i]);
      values.push(v);
    }
  }

  if (values.length < 35) {
    return {
      planName,
      dates,
      values,
      volatility: 0,
      isLowVol: false,
      isUnreliable: true,
      crosses: [],
      currentHist: 0,
      latestCross: null,
      rsi: 50
    };
  }

  // Calculate annualized volatility to guard against noise in low-risk bond/money market funds
  const returns = [];
  for (let i = 1; i < values.length; i++) {
    returns.push((values[i] - values[i - 1]) / values[i - 1]);
  }
  const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance = returns.reduce((a, r) => a + (r - mean) ** 2, 0) / (returns.length - 1);
  const volatility = Math.sqrt(variance) * Math.sqrt(252);
  const isLowVol = volatility < 0.02; // Under 2% volatility: e.g. money market & short debt

  const ema12 = calcEMA(values, 12);
  const ema26 = calcEMA(values, 26);
  const macd = values.map((_, i) => ema12[i] - ema26[i]);
  const signal = calcEMA(macd, 9);
  const hist = macd.map((v, i) => v - signal[i]);
  const rsi = calcRSI(values, 14);

  // Identify Golden Cross (Hist: <=0 -> >0) and Dead Cross (Hist: >=0 -> <0)
  const crosses = [];
  for (let i = 1; i < hist.length; i++) {
    if (hist[i - 1] <= 0 && hist[i] > 0) {
      crosses.push({ type: 'golden', date: dates[i], price: values[i], index: i });
    } else if (hist[i - 1] >= 0 && hist[i] < 0) {
      crosses.push({ type: 'dead', date: dates[i], price: values[i], index: i });
    }
  }

  const lastIdx = values.length - 1;
  return {
    planName,
    dates,
    values,
    volatility,
    isLowVol,
    isUnreliable: false,
    ema12,
    ema26,
    macd,
    signal,
    hist,
    rsi,
    crosses,
    currentHist: hist[lastIdx],
    latestCross: crosses.length > 0 ? crosses[crosses.length - 1] : null
  };
}

/**
 * Build ApexCharts options for MACD Sub-Chart Oscillator
 */
export function buildMacdSubChartOptions({
  dates = [],
  macdLine = [],
  signalLine = [],
  hist = [],
  themeMode = 'dark',
  planName = ''
}) {
  const isDark = themeMode === 'dark';
  const textColor = isDark ? '#8b949e' : '#57606a';
  const borderColor = isDark ? '#1f293d' : '#d0d7de';

  const macdData = [];
  const signalData = [];
  const histData = [];

  for (let i = 0; i < dates.length; i++) {
    const ts = parseDateUTC(dates[i]).getTime();
    macdData.push([ts, Number(macdLine[i]?.toFixed(4) || 0)]);
    signalData.push([ts, Number(signalLine[i]?.toFixed(4) || 0)]);
    histData.push([ts, Number(hist[i]?.toFixed(4) || 0)]);
  }

  return {
    chart: {
      id: 'gpf-macd-subchart',
      group: 'gpf-charts',
      type: 'line',
      height: 160,
      animations: { enabled: false },
      toolbar: { show: false },
      fontFamily: 'Sarabun, sans-serif',
      background: 'transparent'
    },
    series: [
      {
        name: 'Histogram',
        type: 'column',
        data: histData
      },
      {
        name: 'MACD (12,26)',
        type: 'line',
        data: macdData
      },
      {
        name: 'Signal (9)',
        type: 'line',
        data: signalData
      }
    ],
    plotOptions: {
      bar: {
        columnWidth: '60%',
        colors: {
          ranges: [
            {
              from: -999999,
              to: -0.000001,
              color: '#EF4444'
            },
            {
              from: 0,
              to: 999999,
              color: '#10B981'
            }
          ]
        }
      }
    },
    colors: ['#10B981', '#3B82F6', '#F59E0B'],
    stroke: {
      width: [0, 2, 2],
      curve: 'smooth'
    },
    xaxis: {
      type: 'datetime',
      labels: {
        show: false
      },
      axisBorder: { show: false },
      axisTicks: { show: false }
    },
    yaxis: {
      labels: {
        formatter: (val) => (val != null ? val.toFixed(3) : ''),
        style: {
          colors: textColor,
          fontSize: '10px'
        }
      }
    },
    grid: {
      borderColor: borderColor,
      strokeDashArray: 3
    },
    annotations: {
      yaxis: [
        {
          y: 0,
          borderColor: isDark ? '#4b5563' : '#9ca3af',
          strokeDashArray: 2,
          opacity: 0.6
        }
      ]
    },
    legend: {
      show: true,
      position: 'top',
      horizontalAlign: 'right',
      labels: {
        colors: textColor
      },
      fontSize: '11px',
      markers: { width: 8, height: 8 }
    },
    tooltip: {
      theme: isDark ? 'dark' : 'light',
      shared: true,
      intersect: false,
      y: {
        formatter: (val) => (val != null ? val.toFixed(4) : '-')
      }
    }
  };
}

let _ApexChartsClass = null;

/**
 * Dynamic loader for ApexCharts with testing mock injection support
 */
export async function loadApexCharts(injected = null) {
  if (injected) {
    _ApexChartsClass = injected;
    return _ApexChartsClass;
  }
  if (_ApexChartsClass) return _ApexChartsClass;
  if (typeof window !== 'undefined' && window.ApexCharts) {
    _ApexChartsClass = window.ApexCharts;
    return _ApexChartsClass;
  }
  try {
    const mod = await import('apexcharts');
    _ApexChartsClass = mod.default || mod;
    return _ApexChartsClass;
  } catch {
    return null;
  }
}

/**
 * Build ApexCharts options configuration
 */
export function buildApexOptions({
  series = [],
  colors = [],
  themeMode = 'dark',
  annotations = null,
  mode = 'nav',
  crossLookup = null
}) {
  const isDark = themeMode === 'dark';
  const textColor = isDark ? '#8b949e' : '#57606a';
  const borderColor = isDark ? '#1f293d' : '#d0d7de';
  const isPct = mode === 'pct';

  // Merge custom annotations with zero-line in pct mode
  const mergedAnnotations = annotations ? { ...annotations } : { yaxis: [], points: [] };
  if (!mergedAnnotations.yaxis) mergedAnnotations.yaxis = [];
  if (!mergedAnnotations.points) mergedAnnotations.points = [];
  if (isPct) {
    const hasZero = mergedAnnotations.yaxis.some(a => a.y === 0);
    if (!hasZero) {
      mergedAnnotations.yaxis.push({
        y: 0,
        borderColor: '#8b949e',
        strokeDashArray: 4,
        label: {
          text: '0.00% (จุดอ้างอิง)',
          borderColor: '#8b949e',
          style: {
            color: '#ffffff',
            background: '#8b949e',
            fontSize: '11px',
            fontFamily: 'Sarabun, sans-serif'
          }
        }
      });
    }
  }

  return {
    chart: {
      id: 'gpf-main-chart',
      group: 'gpf-charts',
      type: 'line',
      height: 450,
      animations: {
        enabled: true,
        easing: 'easeinout',
        speed: 500,
        dynamicAnimation: {
          enabled: true,
          speed: 300
        }
      },
      toolbar: {
        show: false
      },
      fontFamily: 'Sarabun, sans-serif',
      background: 'transparent'
    },
    series,
    colors,
    annotations: mergedAnnotations,
    stroke: {
      curve: 'smooth',
      width: 2.5
    },
    xaxis: {
      type: 'datetime',
      labels: {
        style: {
          colors: textColor,
          fontFamily: 'Sarabun, sans-serif',
          fontSize: '11px'
        },
        formatter: (val, timestamp) => {
          const ts = timestamp || val;
          if (!ts) return '';
          const d = new Date(ts);
          if (isNaN(d.getTime())) return String(val);
          const day = d.getUTCDate();
          const month = THAI_MONTHS_SHORT[d.getUTCMonth()];
          const yearBE = (d.getUTCFullYear() + 543) % 100;
          return `${day} ${month} ${yearBE}`;
        }
      },
      axisBorder: {
        color: borderColor
      },
      axisTicks: {
        color: borderColor
      }
    },
    yaxis: {
      labels: {
        style: {
          colors: textColor,
          fontFamily: 'Sarabun, sans-serif',
          fontSize: '11px'
        },
        formatter: (val) => {
          if (val == null || isNaN(val)) return '';
          if (isPct) {
            const sign = val > 0 ? '+' : '';
            return `${sign}${Number(val).toFixed(2)}%`;
          }
          return Number(val).toFixed(2);
        }
      },
      tooltip: {
        enabled: true
      }
    },
    tooltip: {
      shared: true,
      intersect: false,
      theme: isDark ? 'dark' : 'light',
      custom: function({ series: srs, seriesIndex, dataPointIndex, w }) {
        if (!w || !w.globals) return '';
        const ts = w.globals.seriesX?.[0]?.[dataPointIndex] || w.globals.categoryLabels?.[dataPointIndex];
        let dateHeader = 'ข้อมูล NAV';
        if (ts) {
          const d = new Date(ts);
          if (!isNaN(d.getTime())) {
            const day = d.getUTCDate();
            const month = THAI_MONTHS_SHORT[d.getUTCMonth()];
            const yearBE = d.getUTCFullYear() + 543;
            dateHeader = `${day} ${month} ${yearBE}`;
          }
        }

        let crossBadge = '';
        if (ts && crossLookup) {
          const d = new Date(ts);
          const iso = formatISODate(d);
          const cType = crossLookup[iso];
          if (cType === 'golden') {
            crossBadge = ` <span class="tooltip-cross-tag golden">🟢 ซื้อ (Golden Cross)</span>`;
          } else if (cType === 'dead') {
            crossBadge = ` <span class="tooltip-cross-tag dead">🔴 ขาย (Dead Cross)</span>`;
          }
        }

        let rowsHtml = '';
        const names = w.globals.seriesNames || [];
        const clrs = w.globals.colors || [];

        names.forEach((name, i) => {
          const val = srs?.[i]?.[dataPointIndex];
          const color = clrs[i] || '#388bfd';
          let displayVal = '-';
          if (val != null && !isNaN(val)) {
            if (isPct) {
              const sign = val > 0 ? '+' : '';
              displayVal = `${sign}${Number(val).toFixed(2)}%`;
            } else {
              displayVal = `${Number(val).toFixed(4)} ฿`;
            }
          }
          rowsHtml += `
            <div class="chart-tooltip-row">
              <span class="chart-tooltip-dot" style="background-color: ${color}"></span>
              <span class="chart-tooltip-name">${name}:</span>
              <span class="chart-tooltip-val ${isPct && val > 0 ? 'up' : (isPct && val < 0 ? 'down' : '')}">${displayVal}</span>
            </div>
          `;
        });

        return `
          <div class="chart-custom-tooltip">
            <div class="chart-tooltip-header">${dateHeader}${crossBadge}</div>
            <div class="chart-tooltip-body">${rowsHtml}</div>
          </div>
        `;
      }
    },
    legend: {
      show: false
    },
    grid: {
      borderColor,
      strokeDashArray: 3,
      xaxis: {
        lines: {
          show: false
        }
      },
      yaxis: {
        lines: {
          show: true
        }
      }
    },
    theme: {
      mode: isDark ? 'dark' : 'light'
    }
  };
}

/**
 * ChartView Component
 */
export class ChartView {
  constructor(container, options = {}) {
    this.container = typeof container === 'string'
      ? (typeof document !== 'undefined' ? document.querySelector(container) : null)
      : container;

    this.options = options;
    this.chartData = options.chartData || null;
    this.historyData = options.historyData || null;
    this.summaryData = options.summaryData || null;
    this.activePlans = new Set(options.activePlans || ['แผนเชิงรุก 35']);
    this.primaryPlan = options.primaryPlan || (options.activePlans && options.activePlans[0]) || 'แผนเชิงรุก 35';
    this.currentTimeframe = options.defaultTimeframe || '1Y';
    this.currentMode = options.defaultMode || 'nav'; // 'nav' | 'pct'
    this.currentTheme = options.theme || (typeof document !== 'undefined' && document.documentElement?.getAttribute('data-theme')) || 'dark';

    this.isAutoFit = (typeof localStorage !== 'undefined' && localStorage.getItem('gpf_chart_autofit') === 'true');
    this.chartHeight = 450;
    this.chart = null;
    this.showSignalOverlay = (typeof localStorage !== 'undefined' ? localStorage.getItem('gpf_show_signals') !== 'false' : true);
    this.chartEngine = (typeof localStorage !== 'undefined' ? localStorage.getItem('gpf_chart_engine') || 'apex' : 'apex');
    this.tvChart = null;
    this.ApexCharts = options.ApexCharts || null;
    this._handleClick = this._handleClick.bind(this);
    this._handlePinsChanged = this._handlePinsChanged.bind(this);
    this._handleChartDblClick = this._handleChartDblClick.bind(this);
  }

  setPrimaryPlan(planName) {
    if (planName) {
      this.primaryPlan = planName;
      this.updateMacdSignalBanner();
      if (this.chartEngine === 'tradingview') {
        this.renderTradingViewChart();
      } else {
        this.updateAnnotations();
      }
    }
  }

  /**
   * Load required datasets and initialize the chart view
   */
  async init() {
    if (!this.container) return;

    try {
      if (!this.chartData) {
        this.chartData = await fetchChartData();
      }
      if (!this.historyData) {
        this.historyData = await fetchFullHistory();
      }
      if (!this.summaryData) {
        this.summaryData = await fetchSummary();
      }
    } catch (err) {
      console.warn('[ChartView] Failed to fetch one or more datasets:', err);
    }

    this.renderSkeleton();
    await this.mountChart();
    if (this.chartEngine === 'tradingview') {
      this.renderTradingViewChart();
    }
    this.updateMacdSignalBanner();
    this._initModeListener();
  }

  _initModeListener() {
    if (typeof document !== 'undefined' && !this._hasModeListener) {
      this._hasModeListener = true;
      document.addEventListener('chart-mode-change', (e) => {
        if (e.detail?.mode && e.detail.mode !== this.currentMode) {
          this.setMode(e.detail.mode);
        }
      });
    }
  }

  /**
   * Render component shell and range filter toolbar
   */
  renderSkeleton() {
    if (!this.container) return;

    const btnsHtml = TIMEFRAMES.map(tf => {
      const isActive = tf === this.currentTimeframe;
      return `<button class="timeframe-btn ${isActive ? 'is-active' : ''}" data-timeframe="${tf}">${tf}</button>`;
    }).join('');

    this.container.innerHTML = `
      <div class="chart-wrapper trading-chart-card">
        <div class="chart-header">
          <div class="macd-signal-banner" id="macd-signal-banner" style="display: ${this.showSignalOverlay ? 'flex' : 'none'};"></div>

          <div class="chart-toolbar">
            <!-- Timeframe Group -->
            <div class="timeframe-group" role="group" aria-label="ช่วงเวลาแสดงผล">
              ${btnsHtml}
            </div>

            <!-- Signal Overlay Toggle Button -->
            <button class="chart-action-btn ${this.showSignalOverlay ? 'is-active' : ''}" id="btn-toggle-signals" title="เปิด/ปิด จุดสัญญาณซื้อขาย (Overlay) บนเส้นกราฟ">
              <span>🟢 สัญญาณซื้อ/ขาย</span>
            </button>

            <!-- TradingView Toggle Button -->
            <button class="chart-action-btn ${this.chartEngine === 'tradingview' ? 'is-active' : ''}" id="btn-toggle-engine" title="สลับการแสดงผลระหว่างกราฟ ApexCharts และ TradingView">
              <span>TradingView</span>
            </button>

            <!-- Chart Auto-Fit Height Toggle -->
            <button class="chart-action-btn ${this.isAutoFit ? 'is-active' : ''}" id="btn-chart-autofit" title="ขยายกราฟให้พอดีความสูงหน้าจอ (Auto-Fit) หรือคืนค่าขนาดเดิม">
              <span>${this.isAutoFit ? '↕ ขนาดมาตรฐาน' : '⛶ พอดีหน้าจอ'}</span>
            </button>
          </div>
        </div>

        <div class="normalize-banner" id="normalize-banner" style="display: ${this.currentMode === 'pct' ? 'flex' : 'none'};">
          <span class="banner-icon">📊</span>
          <span class="banner-text">โหมด % เปลี่ยนแปลง — ทุกแผนเริ่มต้นที่ 0% จากวันแรกในช่วงที่เลือก เพื่อเปรียบเทียบผลตอบแทนได้อย่างเท่าเทียม</span>
        </div>

        <div class="chart-render-area" id="apexcharts-area" style="display: ${this.chartEngine === 'apex' ? 'block' : 'none'};"></div>
        <div class="chart-render-area tv-chart-area" id="tradingview-area" style="display: ${this.chartEngine === 'tradingview' ? 'block' : 'none'};"></div>

        <!-- Draggable Resizer Bar -->
        <div class="chart-resizer" id="chart-resizer" title="คลิกลากขึ้นลงเพื่อปรับความสูงกราฟ">
          <div class="resizer-handle"></div>
        </div>
      </div>
    `;

    // Add click listeners to buttons
    const tfBtns = this.container.querySelectorAll
      ? this.container.querySelectorAll('.timeframe-btn')
      : [];
    if (tfBtns && tfBtns.length > 0) {
      tfBtns.forEach(btn => btn.addEventListener('click', this._handleClick));
    }

    const modeBtns = this.container.querySelectorAll
      ? this.container.querySelectorAll('.mode-btn')
      : [];
    if (modeBtns && modeBtns.length > 0) {
      modeBtns.forEach(btn => btn.addEventListener('click', this._handleClick));
    }

    const fitBtn = this.container.querySelector
      ? this.container.querySelector('#btn-chart-autofit')
      : null;
    if (fitBtn) {
      fitBtn.addEventListener('click', this._handleClick);
    }

    const signalBtn = this.container.querySelector
      ? this.container.querySelector('#btn-toggle-signals')
      : null;
    if (signalBtn) {
      signalBtn.addEventListener('click', this._handleClick);
    }

    const engineBtn = this.container.querySelector
      ? this.container.querySelector('#btn-toggle-engine')
      : null;
    if (engineBtn) {
      engineBtn.addEventListener('click', this._handleClick);
    }
  }

  _handleClick(e) {
    const target = e.target || e;
    const btn = target.closest ? target.closest('.timeframe-btn, .mode-btn, #btn-chart-autofit, #btn-toggle-signals, #btn-toggle-engine') : target;
    if (!btn) return;

    if (btn.id === 'btn-toggle-signals' || (btn.closest && btn.closest('#btn-toggle-signals'))) {
      this.toggleSignalOverlay();
      return;
    }

    if (btn.id === 'btn-toggle-engine' || (btn.closest && btn.closest('#btn-toggle-engine'))) {
      this.toggleChartEngine();
      return;
    }

    if (btn.id === 'btn-chart-autofit' || (btn.closest && btn.closest('#btn-chart-autofit'))) {
      this.toggleAutoFit();
      return;
    }

    // Handle timeframe button click
    const timeframe = btn.dataset?.timeframe || btn.getAttribute?.('data-timeframe');
    if (timeframe && TIMEFRAMES.includes(timeframe)) {
      this.setTimeframe(timeframe);
      return;
    }

    // Handle mode button click
    const mode = btn.dataset?.mode || btn.getAttribute?.('data-mode');
    if (mode && (mode === 'nav' || mode === 'pct')) {
      this.setMode(mode);
    }
  }

  /**
   * Switch between 'nav' (Baht) and 'pct' (Base 0% return)
   */
  setMode(newMode) {
    if (newMode !== 'nav' && newMode !== 'pct') return;
    if (this.currentMode === newMode) return;

    this.currentMode = newMode;

    // Update active button state
    const modeBtns = this.container.querySelectorAll ? this.container.querySelectorAll('.mode-btn') : [];
    if (modeBtns && modeBtns.length > 0) {
      modeBtns.forEach(btn => {
        const m = btn.dataset?.mode || btn.getAttribute?.('data-mode');
        if (m === newMode) {
          btn.classList.add('is-active');
        } else {
          btn.classList.remove('is-active');
        }
      });
    }

    // Toggle normalize banner
    const banner = this.container.querySelector ? this.container.querySelector('#normalize-banner') : null;
    if (banner && banner.style) {
      banner.style.display = newMode === 'pct' ? 'flex' : 'none';
    }

    this.updateChartData(true);
  }

  /**
   * Retrieve Y-axis annotations for active plans based on stored pins
   */
  getAnnotations() {
    const yaxis = [];
    const points = [];
    // Only show absolute price pins when in 'nav' mode
    if (this.currentMode === 'nav') {
      const isMobile = (typeof window !== 'undefined' && (
        window.innerWidth <= 768 ||
        document.documentElement?.classList?.contains('mobile-view') ||
        document.body?.classList?.contains('mobile-view')
      ));
      const activeList = Array.from(this.activePlans);
      for (const planName of activeList) {
        const pins = pinService.getPinsForPlan(planName);
        const color = getPlanColor(planName, this.summaryData);
        for (const pin of pins) {
          const noteStr = pin.note ? ` (${pin.note})` : '';
          const labelText = isMobile
            ? `${pin.value.toFixed(4)}`
            : `📌 ${planName} ${pin.value.toFixed(4)}${noteStr}`;

          yaxis.push({
            y: pin.value,
            borderColor: color,
            strokeDashArray: 4,
            label: {
              text: labelText,
              borderColor: color,
              position: 'left',
              textAnchor: 'start',
              offsetX: isMobile ? 4 : 8,
              offsetY: 0,
              style: {
                color: '#ffffff',
                background: color,
                fontSize: isMobile ? '9.5px' : '11px',
                fontWeight: 600,
                fontFamily: 'Sarabun, sans-serif'
              }
            }
          });
        }
      }

      // MACD Tactical Cross Points for Primary Plan (Overlay Dots)
      if (this.showSignalOverlay && ['1M', '3M', '6M', 'YTD', '1Y'].includes(this.currentTimeframe) && this.chartData) {
        const targetPlan = this.primaryPlan || (activeList.length > 0 ? activeList[0] : null);
        if (targetPlan) {
          const analysis = analyzePlanTechnical(this.chartData, targetPlan);
          if (analysis && !analysis.isLowVol && !analysis.isUnreliable && analysis.crosses.length > 0) {
            let refDate = this.options.referenceDate ? parseDateUTC(this.options.referenceDate) : null;
            if (!refDate || isNaN(refDate.getTime())) {
              if (this.chartData.dates && this.chartData.dates.length > 0) {
                refDate = parseDateUTC(this.chartData.dates[this.chartData.dates.length - 1]);
              } else {
                refDate = new Date();
              }
            }
            const cutoff = calculateCutoffDate(this.currentTimeframe, refDate);
            const cutoffTime = cutoff ? cutoff.getTime() : 0;

            const visibleCrosses = analysis.crosses.filter(c => {
              const t = parseDateUTC(c.date).getTime();
              return t >= cutoffTime;
            });

            // Show visible crosses as clean, un-obstructive signal dots on the line (no text boxes blocking the curve)
            const recentCrosses = visibleCrosses.slice(-8);
            for (const cross of recentCrosses) {
              const isGolden = cross.type === 'golden';
              const color = isGolden ? '#10B981' : '#EF4444';
              points.push({
                x: parseDateUTC(cross.date).getTime(),
                y: cross.price,
                marker: {
                  size: 6,
                  fillColor: color,
                  strokeColor: '#ffffff',
                  strokeWidth: 2,
                  shape: 'circle',
                  radius: 3
                }
              });
            }
          }
        }
      }
    }
    return { yaxis, points };
  }

  /**
   * Mount ApexCharts instance
   */
  async mountChart() {
    if (!this.ApexCharts) {
      this.ApexCharts = await loadApexCharts(this.options.ApexCharts);
    }

    if (!this.ApexCharts) {
      console.warn('[ChartView] ApexCharts library not available');
      return;
    }

    const renderArea = this.container.querySelector
      ? this.container.querySelector('#apexcharts-area')
      : null;

    if (!renderArea) return;

    const sliced = sliceSeriesData({
      timeframe: this.currentTimeframe,
      activePlans: this.activePlans,
      historyData: this.historyData,
      chartData: this.chartData,
      summaryData: this.summaryData,
      referenceDate: this.options.referenceDate,
      mode: this.currentMode
    });

    const options = buildApexOptions({
      series: sliced.series,
      colors: sliced.colors,
      themeMode: this.currentTheme,
      annotations: this.getAnnotations(),
      mode: this.currentMode,
      crossLookup: this.getCrossLookup()
    });

    if (this.isAutoFit) {
      const fitH = this.calculateChartHeight();
      if (fitH && fitH !== 450) {
        options.chart.height = fitH;
      }
    }

    this.chart = new this.ApexCharts(renderArea, options);
    if (typeof this.chart.render === 'function') {
      await this.chart.render();
    }

    if (renderArea && typeof renderArea.addEventListener === 'function') {
      renderArea.addEventListener('dblclick', this._handleChartDblClick);
    }
    this._bindResizer();

    if (typeof document !== 'undefined') {
      document.addEventListener('pins-changed', this._handlePinsChanged);
    }
    if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
      window.addEventListener('resize', () => {
        if (this.isAutoFit) {
          const newH = this.calculateChartHeight();
          if (this.chart && typeof this.chart.updateOptions === 'function') {
            this.chart.updateOptions({
              chart: { height: newH },
              annotations: this.getAnnotations()
            }, false, false);
          }
          if (this.tvChart && typeof this.tvChart.resize === 'function') {
            const tvArea = this.container?.querySelector('#tradingview-area');
            if (tvArea) {
              tvArea.style.height = `${newH}px`;
              this.tvChart.resize(tvArea.clientWidth, newH);
            }
          }
        }
      });
    }
  }

  _handleChartDblClick(e) {
    if (this.currentMode !== 'nav') {
      showToast('⚠️ การปักหมุดราคาใช้ได้เฉพาะในโหมด "NAV จริง"');
      return;
    }

    const targetPlan = this.primaryPlan || (this.activePlans && this.activePlans.size > 0 ? Array.from(this.activePlans)[0] : 'แผนเชิงรุก 35');
    if (!targetPlan) return;

    const renderArea = this.container?.querySelector ? this.container.querySelector('#apexcharts-area') : null;
    if (!renderArea) return;

    const grid = renderArea.querySelector('.apexcharts-grid') || renderArea.querySelector('.apexcharts-inner') || renderArea;
    const rect = grid.getBoundingClientRect ? grid.getBoundingClientRect() : null;

    if (!rect || rect.height <= 0) return;
    if (e.clientY < rect.top - 15 || e.clientY > rect.bottom + 15) return;

    const clientY = Math.max(rect.top, Math.min(rect.bottom, e.clientY));
    const ratio = 1 - ((clientY - rect.top) / rect.height);

    let pinPrice = null;
    const globals = this.chart?.w?.globals;
    const minY = Array.isArray(globals?.minYArr) ? globals.minYArr[0] : (globals?.minY ?? null);
    const maxY = Array.isArray(globals?.maxYArr) ? globals.maxYArr[0] : (globals?.maxY ?? null);

    if (minY != null && maxY != null && !isNaN(minY) && !isNaN(maxY) && maxY > minY) {
      const calculatedVal = minY + ratio * (maxY - minY);
      pinPrice = Number(calculatedVal.toFixed(4));
    } else {
      const planSummary = this.summaryData?.plans?.[targetPlan];
      pinPrice = planSummary?.current_nav || 30.0;
    }

    if (!pinPrice || isNaN(pinPrice) || pinPrice <= 0) return;

    // Check if user clicked near an existing pin of this plan (within 0.8% threshold)
    const existingPins = pinService.getPinsForPlan(targetPlan);
    const matchPin = existingPins.find(p => Math.abs(p.value - pinPrice) / p.value < 0.008);

    if (matchPin) {
      pinService.removePin(targetPlan, matchPin.id);
      showToast(`🗑️ ลบหมุดราคา ${matchPin.value.toFixed(4)} (${targetPlan}) แล้ว`);
    } else {
      pinService.addPin(targetPlan, pinPrice, 'ดับเบิลคลิกจากกราฟ');
      showToast(`📌 ปักหมุด ${targetPlan} ที่ราคา ${pinPrice.toFixed(4)} เรียบร้อย`);
    }
  }

  toggleAutoFit() {
    this.isAutoFit = !this.isAutoFit;
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('gpf_chart_autofit', this.isAutoFit ? 'true' : 'false');
    }

    const fitBtn = this.container?.querySelector ? this.container.querySelector('#btn-chart-autofit') : null;
    if (fitBtn) {
      if (this.isAutoFit) {
        fitBtn.classList.add('is-active');
        fitBtn.innerHTML = '<span>↕ ขนาดมาตรฐาน</span>';
      } else {
        fitBtn.classList.remove('is-active');
        fitBtn.innerHTML = '<span>⛶ พอดีหน้าจอ</span>';
      }
    }

    const targetHeight = this.calculateChartHeight();
    if (this.chart && typeof this.chart.updateOptions === 'function') {
      this.chart.updateOptions({
        chart: { height: targetHeight }
      }, false, true);
    }

    if (this.tvChart && typeof this.tvChart.resize === 'function') {
      const tvArea = this.container?.querySelector('#tradingview-area');
      if (tvArea) {
        tvArea.style.height = `${targetHeight}px`;
        const tvCanvas = tvArea.querySelector('.tv-render-canvas');
        if (tvCanvas) tvCanvas.style.height = `${targetHeight}px`;
        const tvWrap = tvArea.querySelector('.tv-wrapper');
        if (tvWrap) tvWrap.style.height = `${targetHeight}px`;
        this.tvChart.resize(tvArea.clientWidth, targetHeight);
      }
    }

    if (this.isAutoFit) {
      showToast('⛶ ขยายกราฟเต็มพื้นที่หน้าจอเรียบร้อย');
    } else {
      showToast('↕ ปรับความสูงกราฟเป็นขนาดมาตรฐาน (480px)');
    }
  }

  calculateChartHeight() {
    if (this.isAutoFit && typeof window !== 'undefined' && window.innerHeight) {
      // True 100vh docked terminal height:
      // Measure parent stage and hud to compute exact remaining height for chart canvas
      const hudEl = document.querySelector('#metric-cards-container');
      const hudH = hudEl && hudEl.offsetHeight > 0 ? hudEl.offsetHeight : 70;
      const bannerEl = this.container?.querySelector('#macd-signal-banner');
      const bannerH = (this.showSignalOverlay && bannerEl && bannerEl.offsetHeight > 0) ? bannerEl.offsetHeight : (this.showSignalOverlay ? 30 : 0);
      const normEl = this.container?.querySelector('#normalize-banner');
      const normH = (this.currentMode === 'pct' && normEl && normEl.offsetHeight > 0) ? normEl.offsetHeight : 0;

      // Screen innerHeight minus:
      // header (52px), stage padding (20px), HUD height, stage gaps (12px),
      // chart header (44px), banner(s), chart-card padding (26px)
      const available = window.innerHeight - 52 - 20 - hudH - 12 - 44 - bannerH - normH - 26;
      return Math.max(450, available);
    }
    return this.chartHeight || 480;
  }

  _bindResizer() {
    const resizer = this.container?.querySelector ? this.container.querySelector('#chart-resizer') : null;
    if (!resizer || typeof document === 'undefined') return;

    let startY = 0;
    let startH = 0;

    const onMouseMove = (e) => {
      const delta = e.clientY - startY;
      const newHeight = Math.max(360, Math.min(1400, startH + delta));
      this.chartHeight = newHeight;
      this.isAutoFit = false;
      const fitBtn = this.container?.querySelector ? this.container.querySelector('#btn-chart-autofit') : null;
      if (fitBtn) {
        fitBtn.classList.remove('is-active');
        fitBtn.innerHTML = '<span>⛶ พอดีหน้าจอ</span>';
      }
      if (this.chart && typeof this.chart.updateOptions === 'function') {
        this.chart.updateOptions({ chart: { height: newHeight } }, false, false);
      }
      if (this.tvChart && typeof this.tvChart.resize === 'function') {
        const tvArea = this.container?.querySelector('#tradingview-area');
        if (tvArea) {
          tvArea.style.height = `${newHeight}px`;
          const tvCanvas = tvArea.querySelector('.tv-render-canvas');
          if (tvCanvas) tvCanvas.style.height = `${newHeight}px`;
          const tvWrap = tvArea.querySelector('.tv-wrapper');
          if (tvWrap) tvWrap.style.height = `${newHeight}px`;
          this.tvChart.resize(tvArea.clientWidth, newHeight);
        }
      }
    };

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('gpf_chart_height', String(this.chartHeight));
      }
    };

    resizer.addEventListener('mousedown', (e) => {
      startY = e.clientY;
      startH = this.chartHeight || 450;
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    });
  }

  _handlePinsChanged() {
    if (this.chartEngine === 'tradingview') {
      this.renderTradingViewChart();
    } else {
      this.updateAnnotations();
    }
  }

  updateAnnotations() {
    if (!this.chart || typeof this.chart.updateOptions !== 'function') return;
    const annotations = this.getAnnotations();
    this.chart.updateOptions({ annotations }, false, true);
  }

  /**
   * Switch active timeframe range
   */
  setTimeframe(newTimeframe) {
    if (!TIMEFRAMES.includes(newTimeframe) || this.currentTimeframe === newTimeframe) {
      return;
    }

    this.currentTimeframe = newTimeframe;

    // Update active button classes
    const btns = this.container.querySelectorAll
      ? this.container.querySelectorAll('.timeframe-btn')
      : [];
    
    if (btns && btns.length > 0) {
      btns.forEach(btn => {
        const tf = btn.dataset?.timeframe || btn.getAttribute?.('data-timeframe');
        if (tf === newTimeframe) {
          btn.classList.add('is-active');
        } else {
          btn.classList.remove('is-active');
        }
      });
    }

    this.updateChartData();
  }

  /**
   * Update active plans filter
   */
  updateActivePlans(activePlansInput) {
    if (!activePlansInput) return;
    const planArray = Array.isArray(activePlansInput)
      ? activePlansInput
      : Array.from(activePlansInput);

    this.activePlans = new Set(planArray.length > 0 ? planArray : ['แผนเชิงรุก 35']);
    this.updateChartData();
  }

  getCrossLookup() {
    if (!this.showSignalOverlay || !this.chartData) return null;
    const targetPlan = this.primaryPlan || (this.activePlans && this.activePlans.size > 0 ? Array.from(this.activePlans)[0] : null);
    if (!targetPlan) return null;
    const analysis = analyzePlanTechnical(this.chartData, targetPlan);
    if (!analysis || analysis.isLowVol || analysis.isUnreliable || !analysis.crosses) return null;
    const lookup = {};
    for (const cross of analysis.crosses) {
      lookup[cross.date] = cross.type;
    }
    return lookup;
  }

  /**
   * Re-slice data and update ApexCharts series & colors
   */
  updateChartData(fullOptionsUpdate = false) {
    if (this.chartEngine === 'tradingview') {
      this.renderTradingViewChart();
      this.updateMacdSignalBanner();
      return;
    }

    if (!this.chart) return;

    const sliced = sliceSeriesData({
      timeframe: this.currentTimeframe,
      activePlans: this.activePlans,
      historyData: this.historyData,
      chartData: this.chartData,
      summaryData: this.summaryData,
      referenceDate: this.options.referenceDate,
      mode: this.currentMode
    });

    if (fullOptionsUpdate && typeof this.chart.updateOptions === 'function') {
      const fullOptions = buildApexOptions({
        series: sliced.series,
        colors: sliced.colors,
        themeMode: this.currentTheme,
        annotations: this.getAnnotations(),
        mode: this.currentMode,
        crossLookup: this.getCrossLookup()
      });
      this.chart.updateOptions(fullOptions, true, true);
    } else {
      if (typeof this.chart.updateOptions === 'function') {
        this.chart.updateOptions({
          colors: sliced.colors,
          annotations: this.getAnnotations()
        }, false, true);
      }
      if (typeof this.chart.updateSeries === 'function') {
        this.chart.updateSeries(sliced.series, true);
      }
    }

    this.updateMacdSignalBanner();
  }

  /**
   * Update theme (dark / light)
   */
  setTheme(themeMode) {
    if (!themeMode || this.currentTheme === themeMode) return;
    this.currentTheme = themeMode;

    if (this.tvChart) {
      this.tvChart.setTheme(themeMode);
    }

    if (!this.chart || typeof this.chart.updateOptions !== 'function') return;

    const isDark = themeMode === 'dark';
    const textColor = isDark ? '#8b949e' : '#57606a';
    const borderColor = isDark ? '#1f293d' : '#d0d7de';

    this.chart.updateOptions({
      theme: {
        mode: isDark ? 'dark' : 'light'
      },
      grid: {
        borderColor
      },
      xaxis: {
        labels: {
          style: {
            colors: textColor
          }
        },
        axisBorder: {
          color: borderColor
        },
        axisTicks: {
          color: borderColor
        }
      },
      yaxis: {
        labels: {
          style: {
            colors: textColor
          }
        }
      },
      tooltip: {
        theme: isDark ? 'dark' : 'light'
      }
    }, false, true);
  }

  updateMacdSignalBanner() {
    const bannerEl = this.container ? this.container.querySelector('#macd-signal-banner') : null;
    if (!bannerEl) return;

    if (!this.showSignalOverlay) {
      bannerEl.style.display = 'none';
      return;
    }
    bannerEl.style.display = 'flex';

    if (!this.chartData) {
      bannerEl.innerHTML = '';
      return;
    }

    const targetPlan = this.primaryPlan || (this.activePlans && this.activePlans.size > 0 ? Array.from(this.activePlans)[0] : 'แผนเชิงรุก 35');
    const analysis = analyzePlanTechnical(this.chartData, targetPlan);
    if (!analysis) {
      bannerEl.innerHTML = '';
      return;
    }

    if (analysis.isLowVol) {
      bannerEl.innerHTML = `
        <div class="signal-tag tag-low-vol">🛡️ มั่นคง</div>
        <div class="signal-metrics-row">
          <span>ความผันผวนต่ำ</span>
          <span class="signal-sep">·</span>
          <span>Vol: ${(analysis.volatility * 100).toFixed(2)}%</span>
        </div>
      `;
      return;
    }

    if (analysis.isUnreliable) {
      bannerEl.innerHTML = `
        <div class="signal-tag tag-neutral">⏳ ประวัติน้อย</div>
        <div class="signal-metrics-row">
          <span>ต้องการ 60 วันทำการ</span>
        </div>
      `;
      return;
    }

    const isBullish = analysis.currentHist > 0;
    const lastCross = analysis.latestCross;
    let crossDetail = '';
    if (lastCross) {
      const isGolden = lastCross.type === 'golden';
      const parts = lastCross.date?.split('-') || [];
      const dStr = parts.length === 3 ? `${parseInt(parts[2], 10)} ${THAI_MONTHS_SHORT[parseInt(parts[1], 10) - 1] || parts[1]}` : lastCross.date;
      crossDetail = `${isGolden ? 'Golden Cross' : 'Dead Cross'} (${dStr})`;
    }

    bannerEl.innerHTML = `
      <div class="signal-tag ${isBullish ? 'tag-buy' : 'tag-sell'}" title="${isBullish ? 'จังหวะเข้าสะสม (MACD เหนือ Signal)' : 'จังหวะชะลอ/พักเงิน (MACD ต่ำกว่า Signal)'}">
        ${isBullish ? '🟢 ซื้อ (สะสม)' : '🔴 ขาย (พักเงิน)'}
      </div>
      <div class="signal-metrics-row">
        ${crossDetail ? `<span class="signal-cross">${crossDetail}</span><span class="signal-sep">·</span>` : ''}
        <span class="signal-hist">Hist: <strong>${analysis.currentHist >= 0 ? '+' : ''}${analysis.currentHist.toFixed(4)}</strong></span>
        <span class="signal-sep">·</span>
        <span class="signal-rsi">RSI: <strong>${analysis.rsi.toFixed(1)}</strong></span>
      </div>
    `;
  }

  toggleSignalOverlay() {
    this.showSignalOverlay = !this.showSignalOverlay;
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('gpf_show_signals', String(this.showSignalOverlay));
    }
    const btn = this.container ? this.container.querySelector('#btn-toggle-signals') : null;
    if (btn) {
      if (this.showSignalOverlay) {
        btn.classList.add('is-active');
      } else {
        btn.classList.remove('is-active');
      }
    }
    this.updateMacdSignalBanner();
    if (this.chartEngine === 'tradingview') {
      this.renderTradingViewChart();
    } else {
      this.updateAnnotations();
    }
    if (this.showSignalOverlay) {
      showToast('🟢 แสดงจุดสัญญาณซื้อ/ขาย (Overlay) บนกราฟ');
    } else {
      showToast('⚪ ซ่อนจุดสัญญาณบนกราฟ');
    }
  }

  toggleChartEngine() {
    this.chartEngine = this.chartEngine === 'tradingview' ? 'apex' : 'tradingview';
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('gpf_chart_engine', this.chartEngine);
    }
    const btn = this.container ? this.container.querySelector('#btn-toggle-engine') : null;
    if (btn) {
      if (this.chartEngine === 'tradingview') {
        btn.classList.add('is-active');
      } else {
        btn.classList.remove('is-active');
      }
    }

    const apexArea = this.container ? this.container.querySelector('#apexcharts-area') : null;
    const tvArea = this.container ? this.container.querySelector('#tradingview-area') : null;

    if (this.chartEngine === 'tradingview') {
      if (apexArea) apexArea.style.display = 'none';
      if (tvArea) tvArea.style.display = 'block';
      this.renderTradingViewChart();
      showToast('📊 สลับไปใช้กราฟ TradingView เรียบร้อย');
    } else {
      if (tvArea) tvArea.style.display = 'none';
      if (apexArea) {
        apexArea.style.display = 'block';
        const targetHeight = this.calculateChartHeight();
        if (this.chart && typeof this.chart.updateOptions === 'function') {
          this.chart.updateOptions({ chart: { height: targetHeight } }, false, false);
        }
      }
      this.updateChartData(true);
      showToast('📈 สลับกลับมาใช้กราฟมาตรฐาน เรียบร้อย');
    }
  }

  renderTradingViewChart() {
    if (this.chartEngine !== 'tradingview') return;
    const tvArea = this.container ? this.container.querySelector('#tradingview-area') : null;
    if (!tvArea) return;

    if (!this.tvChart) {
      this.tvChart = new TradingViewChart(tvArea, {
        theme: this.currentTheme,
        mode: this.currentMode,
        timeframe: this.currentTimeframe,
        primaryPlan: this.primaryPlan,
        activePlans: this.activePlans,
        showSignals: this.showSignalOverlay,
        onDoubleTapPin: (plan, price) => {
          pinService.addPin(plan, price, 'ดับเบิลคลิกจาก TradingView');
          showToast(`📌 ปักหมุด ${plan} ที่ราคา ${price.toFixed(4)} เรียบร้อย`);
        }
      });
      this.tvChart.mount();
    }

    const targetPlan = this.primaryPlan || (this.activePlans && this.activePlans.size > 0 ? Array.from(this.activePlans)[0] : 'แผนเชิงรุก 35');
    const analysis = analyzePlanTechnical(this.chartData, targetPlan);
    const pins = pinService.getPinsForPlan(targetPlan);

    this.tvChart.updateData({
      chartData: this.chartData,
      historyData: this.historyData,
      summaryData: this.summaryData,
      activePlans: this.activePlans,
      primaryPlan: targetPlan,
      mode: this.currentMode,
      timeframe: this.currentTimeframe,
      theme: this.currentTheme,
      showSignals: this.showSignalOverlay,
      analysis,
      pins
    });

    const targetHeight = this.calculateChartHeight();
    tvArea.style.height = `${targetHeight}px`;
    const tvCanvas = tvArea.querySelector('.tv-render-canvas');
    if (tvCanvas) tvCanvas.style.height = `${targetHeight}px`;
    const tvWrap = tvArea.querySelector('.tv-wrapper');
    if (tvWrap) tvWrap.style.height = `${targetHeight}px`;
    if (this.tvChart && typeof this.tvChart.resize === 'function') {
      this.tvChart.resize(tvArea.clientWidth, targetHeight);
    }
  }

  // Alias for backward compatibility
  toggleMacdSubChart() {
    this.toggleSignalOverlay();
  }

  /**
   * Clean up chart and event listeners
   */
  destroy() {
    if (this.tvChart) {
      try {
        this.tvChart.destroy();
      } catch (err) {}
      this.tvChart = null;
    }

    if (this.container && this.container.querySelectorAll) {
      const btns = this.container.querySelectorAll('.timeframe-btn');
      if (btns && btns.length > 0) {
        btns.forEach(btn => {
          btn.removeEventListener('click', this._handleClick);
        });
      }
      const modeBtns = this.container.querySelectorAll('.mode-btn');
      if (modeBtns && modeBtns.length > 0) {
        modeBtns.forEach(btn => {
          btn.removeEventListener('click', this._handleClick);
        });
      }
    }

    if (this.chart && typeof this.chart.destroy === 'function') {
      this.chart.destroy();
    }
    this.chart = null;

    if (typeof document !== 'undefined' && this._handlePinsChanged) {
      document.removeEventListener('pins-changed', this._handlePinsChanged);
    }
  }
}

/**
 * Functional factory helper
 */
export function renderChartView(container, options = {}) {
  const instance = new ChartView(container, options);
  instance.init();
  return instance;
}

export default {
  ChartView,
  renderChartView,
  calculateCutoffDate,
  sliceSeriesData,
  buildApexOptions,
  getPlanColor,
  loadApexCharts,
  TIMEFRAMES,
  RANGE_DELTAS,
  DEFAULT_PLAN_COLORS,
  calcEMA,
  calcRSI,
  analyzePlanTechnical,
  buildMacdSubChartOptions
};
