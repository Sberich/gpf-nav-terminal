/**
 * What-If Simulation Modal Component & Calculation Engine
 * Simulates historical returns comparing Plan A vs Plan B with initial lump-sum
 * and monthly DCA contributions using exact daily NAV history.
 */

import navService, { fetchFullHistory, fetchSummary } from '../services/navService.js';
import { DEFAULT_PLAN_COLORS } from './ChartView.js';

/**
 * Format currency number in Thai Baht format
 */
export function formatCurrency(num) {
  if (num == null || isNaN(num)) return '฿0.00';
  return '฿' + Number(num).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/**
 * Format percentage string
 */
export function formatPercent(num) {
  if (num == null || isNaN(num)) return '0.00%';
  const sign = num > 0 ? '+' : '';
  return `${sign}${Number(num).toFixed(2)}%`;
}

/**
 * Simulate single plan investment over historical NAV records.
 * @param {Object} params
 * @param {Array} params.historyData - Chronological array of { date, plans }
 * @param {string} params.planKey - Plan identifier
 * @param {string} params.startDate - ISO date YYYY-MM-DD
 * @param {number} [params.initialCapital=100000] - Initial lump-sum deposit (฿)
 * @param {number} [params.monthlyContribution=5000] - Monthly DCA deposit (฿)
 * @param {number} [params.dcaDay=25] - Target day of month for monthly contribution
 * @returns {Object} Simulation outcome
 */
export function simulateInvestment({
  historyData = [],
  planKey,
  startDate,
  initialCapital = 100000,
  monthlyContribution = 5000,
  dcaDay = 25
}) {
  const cap = Math.max(0, Number(initialCapital) || 0);
  const monthly = Math.max(0, Number(monthlyContribution) || 0);

  if (!Array.isArray(historyData) || historyData.length === 0 || !planKey) {
    return {
      planKey,
      startDate,
      endDate: null,
      initialNav: 0,
      latestNav: 0,
      totalUnits: 0,
      totalCost: 0,
      finalValue: 0,
      totalProfit: 0,
      profitPct: 0,
      transactionsCount: 0,
      transactions: []
    };
  }

  // Filter history records >= startDate where plan NAV is valid
  const filtered = historyData.filter(row => {
    if (!row || !row.date) return false;
    if (startDate && row.date < startDate) return false;
    const nav = row.plans ? row.plans[planKey] : null;
    return typeof nav === 'number' && !isNaN(nav) && nav > 0;
  });

  if (filtered.length === 0) {
    return {
      planKey,
      startDate,
      endDate: null,
      initialNav: 0,
      latestNav: 0,
      totalUnits: 0,
      totalCost: 0,
      finalValue: 0,
      totalProfit: 0,
      profitPct: 0,
      transactionsCount: 0,
      transactions: []
    };
  }

  const transactions = [];
  let totalUnits = 0;
  let totalCost = 0;

  // 1. Initial Deposit
  const firstRow = filtered[0];
  const initialNav = firstRow.plans[planKey];

  if (cap > 0) {
    const unitsBought = cap / initialNav;
    totalUnits += unitsBought;
    totalCost += cap;
    transactions.push({
      date: firstRow.date,
      type: 'initial',
      amount: cap,
      nav: initialNav,
      units: unitsBought
    });
  }

  // 2. Monthly DCA Contributions
  if (monthly > 0) {
    // Group candidate records by Month (YYYY-MM)
    const monthGroups = new Map();
    for (const row of filtered) {
      const ym = row.date.slice(0, 7);
      if (!monthGroups.has(ym)) {
        monthGroups.set(ym, []);
      }
      monthGroups.get(ym).push(row);
    }

    for (const [_, daysInMonth] of monthGroups) {
      // Find the first trading day on or after target dcaDay (e.g. 25th)
      let dcaRow = daysInMonth.find(d => {
        const dayNum = parseInt(d.date.slice(8, 10), 10);
        return dayNum >= dcaDay;
      });

      // If no day >= dcaDay (e.g. data ends before 25th in a completed month), fallback to none
      if (dcaRow && dcaRow.date > firstRow.date) {
        const dcaNav = dcaRow.plans[planKey];
        if (typeof dcaNav === 'number' && dcaNav > 0) {
          const unitsBought = monthly / dcaNav;
          totalUnits += unitsBought;
          totalCost += monthly;
          transactions.push({
            date: dcaRow.date,
            type: 'dca',
            amount: monthly,
            nav: dcaNav,
            units: unitsBought
          });
        }
      }
    }
  }

  const lastRow = filtered[filtered.length - 1];
  const latestNav = lastRow.plans[planKey];
  const finalValue = totalUnits * latestNav;
  const totalProfit = finalValue - totalCost;
  const profitPct = totalCost > 0 ? (totalProfit / totalCost) * 100 : 0;

  return {
    planKey,
    startDate: firstRow.date,
    endDate: lastRow.date,
    initialNav: Number(initialNav.toFixed(4)),
    latestNav: Number(latestNav.toFixed(4)),
    totalUnits: Number(totalUnits.toFixed(4)),
    totalCost: Number(totalCost.toFixed(2)),
    finalValue: Number(finalValue.toFixed(2)),
    totalProfit: Number(totalProfit.toFixed(2)),
    profitPct: Number(profitPct.toFixed(2)),
    transactionsCount: transactions.length,
    transactions
  };
}

/**
 * Compare two plans using historical simulation.
 */
export function runWhatIfSimulation({
  historyData = [],
  planA,
  planB,
  startDate,
  initialCapital = 100000,
  monthlyContribution = 5000,
  dcaDay = 25
}) {
  const resultA = simulateInvestment({
    historyData,
    planKey: planA,
    startDate,
    initialCapital,
    monthlyContribution,
    dcaDay
  });

  const resultB = simulateInvestment({
    historyData,
    planKey: planB,
    startDate,
    initialCapital,
    monthlyContribution,
    dcaDay
  });

  const valueDiff = Number((resultB.finalValue - resultA.finalValue).toFixed(2));
  const profitDiff = Number((resultB.totalProfit - resultA.totalProfit).toFixed(2));
  const profitPctDiff = Number((resultB.profitPct - resultA.profitPct).toFixed(2));

  let betterPlan = 'equal';
  if (resultA.finalValue > resultB.finalValue) {
    betterPlan = planA;
  } else if (resultB.finalValue > resultA.finalValue) {
    betterPlan = planB;
  }

  return {
    startDate,
    planA: resultA,
    planB: resultB,
    difference: {
      valueDiff,
      profitDiff,
      profitPctDiff,
      betterPlan
    }
  };
}

/**
 * WhatIfModal Class Component
 */
export class WhatIfModal {
  constructor(container, options = {}) {
    this.container = typeof container === 'string'
      ? (typeof document !== 'undefined' ? document.querySelector(container) : null)
      : container;
    this.options = options;
    this.historyData = options.historyData || null;
    this.summaryData = options.summaryData || null;
    this.defaultPlanA = options.defaultPlanA || 'แผนเชิงรุก 35';
    this.defaultPlanB = options.defaultPlanB || 'แผนหุ้นต่างประเทศ';
    this.isOpen = false;

    this._handleKeyDown = this._handleKeyDown.bind(this);

    this.render();
    this.bindEvents();

    if (!this.historyData || !this.summaryData) {
      this.loadMissingData();
    }
  }

  async init() {
    if (!this.historyData || !this.summaryData) {
      await this.loadMissingData();
    }
    return this;
  }

  async loadMissingData() {
    try {
      if (!this.historyData) {
        this.historyData = await fetchFullHistory();
      }
      if (!this.summaryData) {
        this.summaryData = await fetchSummary();
      }
      this.updatePlanSelects();
    } catch (e) {
      console.warn('[WhatIfModal] Failed to fetch data:', e);
    }
  }

  updatePlanSelects() {
    if (!this.container) return;
    const planKeys = this.summaryData?.plans
      ? Object.keys(this.summaryData.plans)
      : Object.keys(DEFAULT_PLAN_COLORS);

    const selectA = this.container.querySelector('#whatif-plan-a');
    const selectB = this.container.querySelector('#whatif-plan-b');

    if (selectA) {
      const curA = selectA.value || this.defaultPlanA;
      selectA.innerHTML = planKeys.map(k => `
        <option value="${k}" ${k === curA ? 'selected' : ''}>${k}</option>
      `).join('');
    }
    if (selectB) {
      const curB = selectB.value || this.defaultPlanB;
      selectB.innerHTML = planKeys.map(k => `
        <option value="${k}" ${k === curB ? 'selected' : ''}>${k}</option>
      `).join('');
    }
  }

  getDefaultStartDate(yearsAgo = 3) {
    if (this.historyData && this.historyData.length > 0) {
      const latest = this.historyData[this.historyData.length - 1].date;
      const parts = latest.split('-');
      const y = parseInt(parts[0], 10) - yearsAgo;
      return `${y}-${parts[1]}-${parts[2]}`;
    }
    const d = new Date();
    d.setFullYear(d.getFullYear() - yearsAgo);
    return d.toISOString().slice(0, 10);
  }

  render() {
    if (!this.container) return;

    const planKeys = this.summaryData?.plans
      ? Object.keys(this.summaryData.plans)
      : Object.keys(DEFAULT_PLAN_COLORS);

    const defaultStartDate = this.getDefaultStartDate(3);

    const planAOptions = planKeys.map(k => `
      <option value="${k}" ${k === this.defaultPlanA ? 'selected' : ''}>${k}</option>
    `).join('');

    const planBOptions = planKeys.map(k => `
      <option value="${k}" ${k === this.defaultPlanB ? 'selected' : ''}>${k}</option>
    `).join('');

    const html = `
      <div id="whatif-modal" class="modal-backdrop" style="display: none;" role="dialog" aria-modal="true" aria-labelledby="whatif-title">
        <div class="modal-dialog modal-lg">
          <div class="modal-header">
            <div class="modal-title-group">
              <span class="modal-badge-icon">🔮</span>
              <div>
                <h3 id="whatif-title" class="modal-title">จำลองผลตอบแทนเปรียบเทียบ (What-If)</h3>
                <p class="modal-subtitle">เปรียบเทียบย้อนหลังจริงด้วยเงินก้อน (Lump-sum) และออมรายเดือน (DCA)</p>
              </div>
            </div>
            <button class="modal-close" id="btn-close-whatif" aria-label="ปิดหน้าต่าง">&times;</button>
          </div>

          <div class="modal-body">
            <div class="whatif-form-grid">
              <!-- Quick Timeframe & Date -->
              <div class="form-group full-width">
                <label class="form-label">ช่วงเวลาเริ่มต้นการลงทุน</label>
                <div class="timeframe-presets">
                  <button type="button" class="btn-preset" data-years="1">ย้อนหลัง 1 ปี</button>
                  <button type="button" class="btn-preset is-active" data-years="3">ย้อนหลัง 3 ปี</button>
                  <button type="button" class="btn-preset" data-years="5">ย้อนหลัง 5 ปี</button>
                </div>
                <input type="date" id="whatif-start-date" class="form-input" value="${defaultStartDate}">
              </div>

              <!-- Capital & Monthly -->
              <div class="form-group">
                <label class="form-label" for="whatif-capital">เงินลงทุนเริ่มต้น (฿)</label>
                <input type="number" id="whatif-capital" class="form-input" value="100000" min="0" step="10000">
                <span class="form-hint">ใส่ 0 หากต้องการออมรายเดือนอย่างเดียว</span>
              </div>

              <div class="form-group">
                <label class="form-label" for="whatif-monthly">เงินออมเพิ่มรายเดือน DCA (฿)</label>
                <input type="number" id="whatif-monthly" class="form-input" value="5000" min="0" step="1000">
                <span class="form-hint">ตัดเงินลงทุนทุกวันที่ 25 ของเดือน</span>
              </div>

              <!-- Plan A & Plan B -->
              <div class="form-group">
                <label class="form-label" for="whatif-plan-a">แผนการลงทุน A (แผนหลัก)</label>
                <select id="whatif-plan-a" class="form-select">
                  ${planAOptions}
                </select>
              </div>

              <div class="form-group">
                <label class="form-label" for="whatif-plan-b">แผนการลงทุน B (แผนเปรียบเทียบ)</label>
                <select id="whatif-plan-b" class="form-select">
                  ${planBOptions}
                </select>
              </div>
            </div>

            <div class="whatif-action-row">
              <button id="btn-run-whatif" class="btn-primary-action">
                <span>🚀</span> คำนวณผลตอบแทนเปรียบเทียบ
              </button>
            </div>

            <!-- Simulation Results Section -->
            <div id="whatif-results" class="whatif-results-area"></div>
          </div>
        </div>
      </div>
    `;

    this.container.insertAdjacentHTML('beforeend', html);
  }

  bindEvents() {
    const modalEl = this.container.querySelector('#whatif-modal');
    if (!modalEl) return;

    // Close button
    const closeBtn = modalEl.querySelector('#btn-close-whatif');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.close());
    }

    // Backdrop click
    modalEl.addEventListener('click', (e) => {
      if (e.target === modalEl) {
        this.close();
      }
    });

    // Preset buttons
    const presetBtns = modalEl.querySelectorAll('.btn-preset');
    presetBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        presetBtns.forEach(b => b.classList.remove('is-active'));
        btn.classList.add('is-active');
        const years = parseInt(btn.dataset.years || btn.getAttribute('data-years'), 10) || 3;
        const dateInput = modalEl.querySelector('#whatif-start-date');
        if (dateInput) {
          dateInput.value = this.getDefaultStartDate(years);
        }
      });
    });

    // Run button
    const runBtn = modalEl.querySelector('#btn-run-whatif');
    if (runBtn) {
      runBtn.addEventListener('click', () => this.runCalculation());
    }

    // Global listener for opening modal
    if (typeof document !== 'undefined') {
      document.addEventListener('open-whatif-modal', () => this.open());
    }
  }

  open() {
    const modalEl = this.container.querySelector('#whatif-modal');
    if (modalEl) {
      modalEl.style.display = 'flex';
      this.isOpen = true;
      if (typeof document !== 'undefined') {
        document.addEventListener('keydown', this._handleKeyDown);
      }
      this.runCalculation();
    }
  }

  close() {
    const modalEl = this.container.querySelector('#whatif-modal');
    if (modalEl) {
      modalEl.style.display = 'none';
      this.isOpen = false;
      if (typeof document !== 'undefined') {
        document.removeEventListener('keydown', this._handleKeyDown);
      }
    }
  }

  _handleKeyDown(e) {
    if (e.key === 'Escape' && this.isOpen) {
      this.close();
    }
  }

  runCalculation() {
    const modalEl = this.container.querySelector('#whatif-modal');
    if (!modalEl) return;

    const startDate = modalEl.querySelector('#whatif-start-date')?.value || this.getDefaultStartDate(3);
    const initialCapital = parseFloat(modalEl.querySelector('#whatif-capital')?.value) || 0;
    const monthlyContribution = parseFloat(modalEl.querySelector('#whatif-monthly')?.value) || 0;
    const planA = modalEl.querySelector('#whatif-plan-a')?.value || this.defaultPlanA;
    const planB = modalEl.querySelector('#whatif-plan-b')?.value || this.defaultPlanB;

    const results = runWhatIfSimulation({
      historyData: this.historyData,
      planA,
      planB,
      startDate,
      initialCapital,
      monthlyContribution
    });

    this.renderResults(results);
  }

  renderResults(res) {
    const resultsContainer = this.container.querySelector('#whatif-results');
    if (!resultsContainer) return;

    const { planA, planB, difference } = res;
    const isBBetter = difference.betterPlan === planB.planKey;
    const isABetter = difference.betterPlan === planA.planKey;
    const absDiff = Math.abs(difference.valueDiff);

    const bannerText = isABetter
      ? `🎉 <strong>${planA.planKey}</strong> ให้ผลตอบแทนดีกว่า <strong>${planB.planKey}</strong> อยู่ <strong>${formatCurrency(absDiff)}</strong>`
      : isBBetter
        ? `🎉 <strong>${planB.planKey}</strong> ให้ผลตอบแทนดีกว่า <strong>${planA.planKey}</strong> อยู่ <strong>${formatCurrency(absDiff)}</strong>`
        : `ทั้งสองแผนให้ผลตอบแทนใกล้เคียงกัน`;

    resultsContainer.innerHTML = `
      <div class="whatif-summary-banner">
        <span class="banner-icon">${isABetter || isBBetter ? '🏆' : '⚖️'}</span>
        <div class="banner-text">${bannerText}</div>
      </div>

      <div class="whatif-cards-grid">
        <!-- Card Plan A -->
        <div class="whatif-card ${isABetter ? 'is-winner' : ''}">
          <div class="whatif-card-header">
            <span class="plan-color-dot" style="background-color: ${DEFAULT_PLAN_COLORS[planA.planKey] || '#2196F3'}"></span>
            <h4 class="card-plan-name">${planA.planKey}</h4>
            ${isABetter ? '<span class="winner-badge">ผลงานดีกว่า</span>' : ''}
          </div>
          <div class="card-metric-row">
            <span class="metric-label">เงินลงทุนรวม:</span>
            <span class="metric-val">${formatCurrency(planA.totalCost)}</span>
          </div>
          <div class="card-metric-row highlight">
            <span class="metric-label">มูลค่าสิ้นสุด:</span>
            <span class="metric-val primary">${formatCurrency(planA.finalValue)}</span>
          </div>
          <div class="card-metric-row">
            <span class="metric-label">กำไร / ขาดทุนสุทธิ:</span>
            <span class="metric-val ${planA.totalProfit >= 0 ? 'text-up' : 'text-down'}">
              ${formatCurrency(planA.totalProfit)} (${formatPercent(planA.profitPct)})
            </span>
          </div>
          <div class="card-sub-info">
            <span>NAV: ${planA.initialNav.toFixed(4)} ➔ ${planA.latestNav.toFixed(4)}</span>
            <span>หน่วยสะสม: ${planA.totalUnits.toLocaleString('th-TH')} หน่วย (${planA.transactionsCount} รายการ)</span>
          </div>
        </div>

        <!-- Card Plan B -->
        <div class="whatif-card ${isBBetter ? 'is-winner' : ''}">
          <div class="whatif-card-header">
            <span class="plan-color-dot" style="background-color: ${DEFAULT_PLAN_COLORS[planB.planKey] || '#9C27B0'}"></span>
            <h4 class="card-plan-name">${planB.planKey}</h4>
            ${isBBetter ? '<span class="winner-badge">ผลงานดีกว่า</span>' : ''}
          </div>
          <div class="card-metric-row">
            <span class="metric-label">เงินลงทุนรวม:</span>
            <span class="metric-val">${formatCurrency(planB.totalCost)}</span>
          </div>
          <div class="card-metric-row highlight">
            <span class="metric-label">มูลค่าสิ้นสุด:</span>
            <span class="metric-val primary">${formatCurrency(planB.finalValue)}</span>
          </div>
          <div class="card-metric-row">
            <span class="metric-label">กำไร / ขาดทุนสุทธิ:</span>
            <span class="metric-val ${planB.totalProfit >= 0 ? 'text-up' : 'text-down'}">
              ${formatCurrency(planB.totalProfit)} (${formatPercent(planB.profitPct)})
            </span>
          </div>
          <div class="card-sub-info">
            <span>NAV: ${planB.initialNav.toFixed(4)} ➔ ${planB.latestNav.toFixed(4)}</span>
            <span>หน่วยสะสม: ${planB.totalUnits.toLocaleString('th-TH')} หน่วย (${planB.transactionsCount} รายการ)</span>
          </div>
        </div>
      </div>
    `;
  }
}

export function renderWhatIfModal(container, options = {}) {
  const instance = new WhatIfModal(container, options);
  instance.init();
  return instance;
}

export default {
  WhatIfModal,
  renderWhatIfModal,
  simulateInvestment,
  runWhatIfSimulation,
  formatCurrency,
  formatPercent
};
