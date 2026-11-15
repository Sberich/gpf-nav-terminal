/**
 * Interactive Multi-Series ApexCharts Component - Trading Terminal Edition
 * Displays GPF NAV historical trends with timeframe range filtering,
 * synchronized timeline, custom tooltip, active plan filtering, theme reactivity,
 * and dual mode: "NAV จริง (฿)" vs "% เปลี่ยนแปลง (%)" (Base 0% comparison).
 */

import navService, { fetchChartData, fetchFullHistory, fetchSummary } from '../services/navService.js';
import pinService from '../services/pinService.js';

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
  'แผนการลงทุนตามหลักชะรีอะฮ์': '#FF6F00',
  'แผนลงทุนพื้นฐานทั่วไป': '#4CAF50',
  'แผนเกษียณสบายใจ 2569': '#FF6F00'
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
  mode = 'nav'
}) {
  const isDark = themeMode === 'dark';
  const textColor = isDark ? '#8b949e' : '#57606a';
  const borderColor = isDark ? '#1f293d' : '#d0d7de';
  const isPct = mode === 'pct';

  // Merge custom annotations with zero-line in pct mode
  const mergedAnnotations = annotations ? { ...annotations } : { yaxis: [] };
  if (!mergedAnnotations.yaxis) mergedAnnotations.yaxis = [];
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
            <div class="chart-tooltip-header">${dateHeader}</div>
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
    this.ApexCharts = options.ApexCharts || null;
    this._handleClick = this._handleClick.bind(this);
    this._handlePinsChanged = this._handlePinsChanged.bind(this);
    this._handleChartDblClick = this._handleChartDblClick.bind(this);
  }

  setPrimaryPlan(planName) {
    if (planName) {
      this.primaryPlan = planName;
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
          <div class="chart-title-area">
            <h3 class="chart-title">เปรียบเทียบมูลค่าหน่วยลงทุน (NAV)</h3>
            <span class="chart-subtitle">แสดงข้อมูลย้อนหลังตามช่วงเวลาและเปรียบเทียบผลตอบแทน · ดับเบิลคลิกบนกราฟเพื่อปักหมุด</span>
          </div>
          <div class="chart-toolbar">
            <!-- Mode Toggle: NAV จริง vs % เปลี่ยนแปลง -->
            <div class="chart-mode-group" role="group" aria-label="โหมดการแสดงผล">
              <button class="mode-btn ${this.currentMode === 'nav' ? 'is-active' : ''}" data-mode="nav" title="แสดงมูลค่าหน่วยลงทุนจริง (บาท)">NAV จริง</button>
              <button class="mode-btn ${this.currentMode === 'pct' ? 'is-active' : ''}" data-mode="pct" title="เปรียบเทียบผลตอบแทนแบบ % (Base 0% จากวันแรกของช่วงที่เลือก)">% เปลี่ยนแปลง</button>
            </div>

            <!-- Timeframe Group -->
            <div class="timeframe-group" role="group" aria-label="ช่วงเวลาแสดงผล">
              ${btnsHtml}
            </div>

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

        <div class="chart-render-area" id="apexcharts-area"></div>

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
  }

  _handleClick(e) {
    const target = e.target || e;
    const btn = target.closest ? target.closest('.timeframe-btn, .mode-btn, #btn-chart-autofit') : target;
    if (!btn) return;

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
    // Only show absolute price pins when in 'nav' mode
    if (this.currentMode === 'nav') {
      const activeList = Array.from(this.activePlans);
      for (const planName of activeList) {
        const pins = pinService.getPinsForPlan(planName);
        const color = getPlanColor(planName, this.summaryData);
        for (const pin of pins) {
          const noteStr = pin.note ? ` (${pin.note})` : '';
          yaxis.push({
            y: pin.value,
            borderColor: color,
            strokeDashArray: 4,
            label: {
              text: `📌 ${planName} ${pin.value.toFixed(4)}${noteStr}`,
              borderColor: color,
              position: 'left',
              textAnchor: 'start',
              offsetX: 8,
              offsetY: 0,
              style: {
                color: '#ffffff',
                background: color,
                fontSize: '11px',
                fontWeight: 600,
                fontFamily: 'Sarabun, sans-serif'
              }
            }
          });
        }
      }
    }
    return { yaxis };
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
      mode: this.currentMode
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

    if (this.isAutoFit) {
      showToast('⛶ ขยายกราฟเต็มพื้นที่หน้าจอเรียบร้อย');
    } else {
      showToast('↕ ปรับความสูงกราฟเป็นขนาดมาตรฐาน (450px)');
    }
  }

  calculateChartHeight() {
    if (this.isAutoFit && typeof window !== 'undefined' && window.innerHeight) {
      if (window.innerWidth > 1024) {
        const remaining = window.innerHeight - 230;
        return Math.max(500, remaining);
      }
    }
    return this.chartHeight || 450;
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
    this.updateAnnotations();
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

  /**
   * Re-slice data and update ApexCharts series & colors
   */
  updateChartData(fullOptionsUpdate = false) {
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
        mode: this.currentMode
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
  }

  /**
   * Update theme (dark / light)
   */
  setTheme(themeMode) {
    if (!themeMode || this.currentTheme === themeMode) return;
    this.currentTheme = themeMode;

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

  /**
   * Clean up chart and event listeners
   */
  destroy() {
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
  DEFAULT_PLAN_COLORS
};
