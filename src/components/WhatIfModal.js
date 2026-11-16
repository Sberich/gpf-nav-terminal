/**
 * What-If Simulation Modal Component & Calculation Engine
 * Simulates historical returns comparing Plan A vs Plan B with initial lump-sum
 * and monthly DCA contributions using exact daily NAV history.
 */

import navService, { fetchFullHistory, fetchSummary } from '../services/navService.js';
import { DEFAULT_PLAN_COLORS } from './ChartView.js';

/**
 * Toast notification fallback
 */
function showToast(message, duration = 3000) {
  if (typeof document === 'undefined') return;
  let container = document.getElementById('gpf-toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'gpf-toast-container';
    container.style.cssText = 'position:fixed;bottom:24px;right:24px;z-index:99999;display:flex;flex-direction:column;gap:8px;pointer-events:none;';
    document.body.appendChild(container);
  }
  const toast = document.createElement('div');
  toast.className = 'gpf-toast';
  toast.textContent = message;
  toast.style.cssText = 'background:rgba(22,27,34,0.95);color:#58a6ff;border:1px solid #388bfd;padding:10px 16px;border-radius:8px;font-size:13px;box-shadow:0 8px 24px rgba(0,0,0,0.5);';
  container.appendChild(toast);
  setTimeout(() => {
    toast.remove();
  }, duration);
}

/**
 * Calculate historical weighted return for a custom blended portfolio.
 * @param {Object} params
 * @param {Array} params.historyData - Chronological array of { date, plans }
 * @param {Array} params.allocations - Array of { planKey, weightPct }
 * @param {string} params.startDate - ISO string YYYY-MM-DD
 * @param {string} params.endDate - ISO string YYYY-MM-DD
 * @returns {Object|null}
 */
export function calculateBlendedReturn({
  historyData = [],
  allocations = [],
  startDate,
  endDate
}) {
  if (!Array.isArray(historyData) || historyData.length === 0 || !allocations || allocations.length === 0) return null;
  if (!startDate || !endDate || startDate >= endDate) return null;

  // Filter records in date range
  const rows = historyData.filter(d => d.date >= startDate && d.date <= endDate);
  if (rows.length < 2) return null;

  let totalReturnPct = 0;
  let totalWeight = 0;
  const breakdown = [];

  for (const item of allocations) {
    const planKey = item.planKey || item.key;
    const weightPct = parseFloat(item.weightPct ?? item.pct) || 0;
    if (weightPct <= 0) continue;
    const w = weightPct / 100;
    totalWeight += weightPct;

    // Find first valid NAV on or after startDate
    let startNav = null;
    let actualStartDate = null;
    for (let i = 0; i < rows.length; i++) {
      const val = rows[i].plans?.[planKey];
      if (typeof val === 'number' && val > 0) {
        startNav = val;
        actualStartDate = rows[i].date;
        break;
      }
    }

    // Find last valid NAV on or before endDate
    let endNav = null;
    let actualEndDate = null;
    for (let i = rows.length - 1; i >= 0; i--) {
      const val = rows[i].plans?.[planKey];
      if (typeof val === 'number' && val > 0) {
        endNav = val;
        actualEndDate = rows[i].date;
        break;
      }
    }

    if (startNav == null || endNav == null) {
      return null;
    }

    const planReturnPct = ((endNav - startNav) / startNav) * 100;
    const weightedContribution = planReturnPct * w;
    totalReturnPct += weightedContribution;

    breakdown.push({
      planKey,
      weightPct,
      startNav: Number(startNav.toFixed(4)),
      endNav: Number(endNav.toFixed(4)),
      actualStartDate,
      actualEndDate,
      planReturnPct: Number(planReturnPct.toFixed(2)),
      weightedContribution: Number(weightedContribution.toFixed(2))
    });
  }

  return {
    startDate,
    endDate,
    totalWeight: Number(totalWeight.toFixed(2)),
    totalReturnPct: Number(totalReturnPct.toFixed(2)),
    breakdown
  };
}

/**
 * Compare two blended portfolios (Port A vs Port B).
 */
export function compareBlendedPortfolios({
  historyData = [],
  portA = { allocations: [], startDate: '', endDate: '' },
  portB = { allocations: [], startDate: '', endDate: '' }
}) {
  const resA = calculateBlendedReturn({
    historyData,
    allocations: portA.allocations,
    startDate: portA.startDate,
    endDate: portA.endDate
  });

  const resB = calculateBlendedReturn({
    historyData,
    allocations: portB.allocations,
    startDate: portB.startDate,
    endDate: portB.endDate
  });

  if (!resA || !resB) return null;

  const diffPct = Number((resB.totalReturnPct - resA.totalReturnPct).toFixed(2));
  let winner = 'equal';
  if (resB.totalReturnPct > resA.totalReturnPct + 0.001) {
    winner = 'B';
  } else if (resA.totalReturnPct > resB.totalReturnPct + 0.001) {
    winner = 'A';
  }

  return {
    portA: resA,
    portB: resB,
    diffPct,
    winner
  };
}

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

  getDefaultEndDate() {
    if (this.historyData && this.historyData.length > 0) {
      return this.historyData[this.historyData.length - 1].date;
    }
    return new Date().toISOString().slice(0, 10);
  }

  render() {
    if (!this.container) return;

    const planKeys = this.summaryData?.plans
      ? Object.keys(this.summaryData.plans)
      : Object.keys(DEFAULT_PLAN_COLORS);

    const defaultStartDate = this.getDefaultStartDate(3);
    const defaultEndDate = this.getDefaultEndDate();
    const defaultMixStart = this.getDefaultStartDate(1);

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
                <p class="modal-subtitle">เปรียบเทียบย้อนหลังจริงด้วยเงินก้อน (Lump-sum), ออมรายเดือน (DCA) หรือจัดพอร์ตผสม DIY</p>
              </div>
            </div>
            <button class="modal-close" id="btn-close-whatif" aria-label="ปิดหน้าต่าง">&times;</button>
          </div>

          <div class="modal-body">
            <!-- Mode Switch Tabs -->
            <div class="whatif-tab-nav" role="tablist">
              <button type="button" class="whatif-tab-btn is-active" id="tab-btn-single" data-whatif-tab="single">
                📊 แผนเดี่ยว + ออม DCA
              </button>
              <button type="button" class="whatif-tab-btn" id="tab-btn-mix" data-whatif-tab="mix">
                ⚖️ เปรียบเทียบพอร์ตผสม DIY (Port A vs Port B)
              </button>
            </div>

            <!-- Tab 1 Panel: Single Plan + DCA -->
            <div id="whatif-single-panel" class="whatif-tab-panel is-active">
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

            <!-- Tab 2 Panel: Blended Mix Port A vs Port B (New) -->
            <div id="whatif-mix-panel" class="whatif-tab-panel" style="display: none;">
              <div class="cmp-mix-subtitle">
                กำหนดช่วงวันที่และสัดส่วนแต่ละแผน (รวมแต่ละ Port ต้องเท่ากับ 100%) แล้วกดคำนวณเพื่อเปรียบเทียบผลตอบแทน
              </div>

              <div class="cmp-ports-grid">
                <!-- Port A Card -->
                <div class="cmp-port-card" id="cmp-port-a">
                  <div class="cmp-port-header">
                    <span class="cmp-port-title" style="color: #388bfd;">พอร์ตเดิม ก่อนเปลี่ยน (Port A)</span>
                    <span class="cmp-port-badge" id="cmp-a-sum">รวม 0%</span>
                  </div>
                  <div class="cmp-date-row">
                    <span class="cmp-date-label">เริ่ม</span>
                    <input type="date" class="form-input cmp-date-input" id="cmp-a-start" value="${defaultMixStart}">
                    <span class="cmp-date-sep">→</span>
                    <span class="cmp-date-label">สิ้นสุด</span>
                    <input type="date" class="form-input cmp-date-input" id="cmp-a-end" value="${defaultEndDate}">
                  </div>
                  <div id="cmp-a-rows" class="cmp-rows-list"></div>
                  <button type="button" class="cmp-add-btn" id="btn-add-cmp-a">+ เพิ่มแผนลงทุน</button>
                </div>

                <!-- Port B Card -->
                <div class="cmp-port-card" id="cmp-port-b">
                  <div class="cmp-port-header">
                    <span class="cmp-port-title" style="color: #FF9800;">พอร์ตใหม่ หลังเปลี่ยน (Port B)</span>
                    <span class="cmp-port-badge" id="cmp-b-sum">รวม 0%</span>
                  </div>
                  <div class="cmp-date-row">
                    <span class="cmp-date-label">เริ่ม</span>
                    <input type="date" class="form-input cmp-date-input" id="cmp-b-start" value="${defaultMixStart}">
                    <span class="cmp-date-sep">→</span>
                    <span class="cmp-date-label">สิ้นสุด</span>
                    <input type="date" class="form-input cmp-date-input" id="cmp-b-end" value="${defaultEndDate}">
                  </div>
                  <div id="cmp-b-rows" class="cmp-rows-list"></div>
                  <button type="button" class="cmp-add-btn" id="btn-add-cmp-b">+ เพิ่มแผนลงทุน</button>
                </div>
              </div>

              <div class="cmp-mix-actions">
                <button type="button" id="btn-run-cmp-mix" class="btn-primary-action">
                  <span>🚀</span> คำนวณผลตอบแทนพอร์ตผสม
                </button>
                <button type="button" id="btn-save-cmp-mix" class="btn-secondary-action">
                  <span>💾</span> บันทึกสัดส่วนนี้ไว้
                </button>
              </div>

              <!-- Mix Results Section -->
              <div id="cmp-mix-results" class="cmp-mix-results-area"></div>
            </div>
          </div>
        </div>
      </div>
    `;

    this.container.insertAdjacentHTML('beforeend', html);
    this.loadCmpFromStorage();
  }

  switchTab(tab) {
    const singleTabBtn = this.container?.querySelector('#tab-btn-single');
    const mixTabBtn = this.container?.querySelector('#tab-btn-mix');
    const singlePanel = this.container?.querySelector('#whatif-single-panel');
    const mixPanel = this.container?.querySelector('#whatif-mix-panel');

    if (tab === 'mix') {
      singleTabBtn?.classList.remove('is-active');
      mixTabBtn?.classList.add('is-active');
      if (singlePanel) singlePanel.style.display = 'none';
      if (mixPanel) mixPanel.style.display = 'block';
      this.updateCmpSum('a');
      this.updateCmpSum('b');
    } else {
      mixTabBtn?.classList.remove('is-active');
      singleTabBtn?.classList.add('is-active');
      if (mixPanel) mixPanel.style.display = 'none';
      if (singlePanel) singlePanel.style.display = 'block';
    }
  }

  addCmpRow(ab, planKey = '', weight = 0) {
    const rowsEl = this.container?.querySelector(`#cmp-${ab}-rows`);
    if (!rowsEl) return;

    const planKeys = this.summaryData?.plans
      ? Object.keys(this.summaryData.plans)
      : Object.keys(DEFAULT_PLAN_COLORS);

    const defaultKey = planKey || (planKeys.length > 0 ? planKeys[0] : 'แผนเชิงรุก 35');
    const optionsHtml = planKeys.map(k => `
      <option value="${k}" ${k === defaultKey ? 'selected' : ''}>${k}</option>
    `).join('');

    const row = document.createElement('div');
    row.className = 'cmp-row-item';
    row.innerHTML = `
      <select class="form-select cmp-row-select">${optionsHtml}</select>
      <div class="cmp-row-input-wrap">
        <input type="number" class="form-input cmp-row-input" min="0" max="100" step="5" value="${weight > 0 ? weight : ''}" placeholder="0">
        <span class="cmp-row-pct">%</span>
      </div>
      <button type="button" class="cmp-row-del" title="ลบแผนนี้">&times;</button>
    `;

    const delBtn = row.querySelector('.cmp-row-del');
    if (delBtn) {
      delBtn.addEventListener('click', () => {
        row.remove();
        this.updateCmpSum(ab);
      });
    }

    const inp = row.querySelector('.cmp-row-input');
    if (inp) {
      if (weight > 0) inp.value = String(weight);
      inp.addEventListener('input', () => {
        this.updateCmpSum(ab);
      });
    }

    rowsEl.appendChild(row);
    this.updateCmpSum(ab);
  }

  updateCmpSum(ab) {
    const rowsEl = this.container?.querySelector(`#cmp-${ab}-rows`);
    if (!rowsEl) return 0;
    const inputs = rowsEl.querySelectorAll ? rowsEl.querySelectorAll('.cmp-row-input') : [];
    let sum = 0;
    inputs.forEach(inp => {
      sum += parseFloat(inp.value) || 0;
    });

    const badge = this.container?.querySelector ? this.container.querySelector(`#cmp-${ab}-sum`) : null;
    if (badge) {
      badge.textContent = `รวม ${sum.toFixed(0)}%`;
      if (Math.abs(sum - 100) < 0.01) {
        badge.style.color = '#3fb950';
        badge.style.borderColor = '#3fb950';
        badge.style.background = 'rgba(63, 185, 80, 0.15)';
      } else if (sum > 100) {
        badge.style.color = '#f85149';
        badge.style.borderColor = '#f85149';
        badge.style.background = 'rgba(248, 81, 73, 0.15)';
      } else {
        badge.style.color = '#8b949e';
        badge.style.borderColor = 'var(--border)';
        badge.style.background = 'var(--bg2)';
      }
    }
    return sum;
  }

  saveCmpToStorage() {
    const getPortData = (ab) => {
      const rowsEl = this.container?.querySelector(`#cmp-${ab}-rows`);
      const rows = rowsEl ? rowsEl.querySelectorAll('.cmp-row-item') : [];
      return {
        start: this.container?.querySelector(`#cmp-${ab}-start`)?.value || '',
        end: this.container?.querySelector(`#cmp-${ab}-end`)?.value || '',
        rows: Array.from(rows).map(row => ({
          key: row.querySelector('.cmp-row-select')?.value || '',
          pct: parseFloat(row.querySelector('.cmp-row-input')?.value) || 0
        }))
      };
    };

    try {
      if (typeof localStorage !== 'undefined') {
        const data = { a: getPortData('a'), b: getPortData('b') };
        localStorage.setItem('gpf_cmp_v2', JSON.stringify(data));
      }
    } catch (e) {
      console.warn('Failed to save cmp ports:', e);
    }
  }

  loadCmpFromStorage() {
    let saved = null;
    try {
      if (typeof localStorage !== 'undefined') {
        const raw = localStorage.getItem('gpf_cmp_v2');
        if (raw) saved = JSON.parse(raw);
      }
    } catch (e) {}

    const defaultEndDate = this.getDefaultEndDate();
    const defaultStartDate = this.getDefaultStartDate(1);

    const initPort = (ab, defaultRows) => {
      const rowsEl = this.container?.querySelector(`#cmp-${ab}-rows`);
      if (!rowsEl) return;
      rowsEl.innerHTML = '';

      const portData = saved?.[ab];
      const startInput = this.container?.querySelector(`#cmp-${ab}-start`);
      const endInput = this.container?.querySelector(`#cmp-${ab}-end`);

      if (startInput) startInput.value = portData?.start || defaultStartDate;
      if (endInput) endInput.value = portData?.end || defaultEndDate;

      const rows = (portData?.rows && portData.rows.length > 0) ? portData.rows : defaultRows;
      rows.forEach(r => this.addCmpRow(ab, r.key, r.pct));
    };

    // Sensible defaults
    initPort('a', [
      { key: 'แผนหุ้นไทย', pct: 50 },
      { key: 'แผนตราสารหนี้', pct: 50 }
    ]);
    initPort('b', [
      { key: 'แผนหุ้นต่างประเทศ', pct: 70 },
      { key: 'แผนทองคำ', pct: 30 }
    ]);
  }

  runMixCalculation() {
    const sumA = this.updateCmpSum('a');
    const sumB = this.updateCmpSum('b');

    if (Math.abs(sumA - 100) > 0.01 || Math.abs(sumB - 100) > 0.01) {
      showToast(`⚠️ สัดส่วนแต่ละ Port ต้องรวมได้ 100% (ปัจจุบัน Port A: ${sumA.toFixed(0)}%, Port B: ${sumB.toFixed(0)}%)`);
      return;
    }

    const aStart = this.container?.querySelector('#cmp-a-start')?.value;
    const aEnd = this.container?.querySelector('#cmp-a-end')?.value;
    const bStart = this.container?.querySelector('#cmp-b-start')?.value;
    const bEnd = this.container?.querySelector('#cmp-b-end')?.value;

    if (!aStart || !aEnd || !bStart || !bEnd) {
      showToast('⚠️ กรุณาระบุวันที่เริ่มและสิ้นสุดให้ครบทั้งสอง Port');
      return;
    }

    if (aStart >= aEnd) {
      showToast('⚠️ Port A: วันที่เริ่มต้นต้องน้อยกว่าวันที่สิ้นสุด');
      return;
    }

    if (bStart >= bEnd) {
      showToast('⚠️ Port B: วันที่เริ่มต้นต้องน้อยกว่าวันที่สิ้นสุด');
      return;
    }

    const getRows = (ab) => {
      const rowsEl = this.container?.querySelector(`#cmp-${ab}-rows`);
      const items = rowsEl ? rowsEl.querySelectorAll('.cmp-row-item') : [];
      return Array.from(items).map(item => ({
        planKey: item.querySelector('.cmp-row-select')?.value,
        weightPct: parseFloat(item.querySelector('.cmp-row-input')?.value) || 0
      }));
    };

    const portA = { allocations: getRows('a'), startDate: aStart, endDate: aEnd };
    const portB = { allocations: getRows('b'), startDate: bStart, endDate: bEnd };

    const comp = compareBlendedPortfolios({
      historyData: this.historyData,
      portA,
      portB
    });

    if (!comp || !comp.portA || !comp.portB) {
      showToast('⚠️ ข้อมูล NAV ไม่ครบถ้วนในช่วงเวลาที่เลือก กรุณาปรับช่วงวันที่');
      return;
    }

    this.saveCmpToStorage();
    this.renderMixResults(comp, aStart, aEnd, bStart, bEnd);
  }

  renderMixResults(comp, aStart, aEnd, bStart, bEnd) {
    const resultsContainer = this.container?.querySelector('#cmp-mix-results');
    if (!resultsContainer) return;

    const { portA, portB, diffPct, winner } = comp;
    const retA = portA.totalReturnPct;
    const retB = portB.totalReturnPct;

    const fmt = (d) => {
      try {
        const parts = d.split('-');
        if (parts.length === 3) {
          return `${parts[2]}/${parts[1]}/${parseInt(parts[0], 10) + 543}`;
        }
      } catch (e) {}
      return d;
    };

    const isWinnerA = winner === 'A';
    const isWinnerB = winner === 'B';
    const winnerText = isWinnerB
      ? `🎉 Port B (พอร์ตใหม่) ให้ผลตอบแทน สูงกว่า Port A: +${diffPct.toFixed(2)}%`
      : isWinnerA
      ? `ℹ️ Port A (พอร์ตเดิม) ให้ผลตอบแทน สูงกว่า Port B: +${Math.abs(diffPct).toFixed(2)}%`
      : `🤝 ผลตอบแทนทั้งสอง Port เท่ากัน (ผลต่าง 0.00%)`;

    const renderTable = (breakdown, portColor) => `
      <table class="cmp-breakdown-table">
        <thead>
          <tr>
            <th>แผนลงทุน</th>
            <th>สัดส่วน</th>
            <th>NAV เริ่ม → ปลาย</th>
            <th>ผลตอบแทน</th>
            <th>ช่วยพอร์ต</th>
          </tr>
        </thead>
        <tbody>
          ${breakdown.map(b => {
            const planColor = DEFAULT_PLAN_COLORS[b.planKey] || portColor;
            return `
              <tr>
                <td>
                  <span class="plan-color-dot" style="background-color:${planColor}"></span>
                  <span class="cmp-tbl-name">${b.planKey}</span>
                </td>
                <td class="text-bold">${b.weightPct}%</td>
                <td class="text-muted">${b.startNav.toFixed(4)} → ${b.endNav.toFixed(4)}</td>
                <td class="${b.planReturnPct >= 0 ? 'text-up' : 'text-down'} text-bold">
                  ${b.planReturnPct >= 0 ? '+' : ''}${b.planReturnPct.toFixed(2)}%
                </td>
                <td class="${b.weightedContribution >= 0 ? 'text-up' : 'text-down'} text-bold">
                  ${b.weightedContribution >= 0 ? '+' : ''}${b.weightedContribution.toFixed(2)}%
                </td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    `;

    resultsContainer.innerHTML = `
      <div class="whatif-summary-banner ${isWinnerB ? 'is-b-winner' : ''}">
        <span class="banner-icon">${isWinnerB ? '🏆' : isWinnerA ? '📌' : '⚖️'}</span>
        <div class="banner-text">
          <div style="font-weight:700; font-size:14px; margin-bottom:2px;">${winnerText}</div>
          <div style="font-size:12px; opacity:0.85;">
            ช่วงเวลา Port A: ${fmt(aStart)} → ${fmt(aEnd)} · ช่วงเวลา Port B: ${fmt(bStart)} → ${fmt(bEnd)}
          </div>
        </div>
      </div>

      <div class="whatif-cards-grid">
        <!-- Port A Card -->
        <div class="whatif-card ${isWinnerA ? 'is-winner' : ''}">
          <div class="whatif-card-header">
            <span class="plan-color-dot" style="background-color: #388bfd;"></span>
            <h4 class="card-plan-name" style="color:#388bfd;">พอร์ตเดิม ก่อนเปลี่ยน (Port A)</h4>
            ${isWinnerA ? '<span class="winner-badge">ผลงานดีกว่า</span>' : ''}
          </div>
          <div class="card-metric-row highlight">
            <span class="metric-label">ผลตอบแทนรวมเฉลี่ย:</span>
            <span class="metric-val ${retA >= 0 ? 'text-up' : 'text-down'}" style="font-size:18px;">
              ${retA >= 0 ? '+' : ''}${retA.toFixed(2)}%
            </span>
          </div>
          <div class="cmp-breakdown-wrapper">
            ${renderTable(portA.breakdown, '#388bfd')}
          </div>
        </div>

        <!-- Port B Card -->
        <div class="whatif-card ${isWinnerB ? 'is-winner' : ''}">
          <div class="whatif-card-header">
            <span class="plan-color-dot" style="background-color: #FF9800;"></span>
            <h4 class="card-plan-name" style="color:#FF9800;">พอร์ตใหม่ หลังเปลี่ยน (Port B)</h4>
            ${isWinnerB ? '<span class="winner-badge">ผลงานดีกว่า</span>' : ''}
          </div>
          <div class="card-metric-row highlight">
            <span class="metric-label">ผลตอบแทนรวมเฉลี่ย:</span>
            <span class="metric-val ${retB >= 0 ? 'text-up' : 'text-down'}" style="font-size:18px;">
              ${retB >= 0 ? '+' : ''}${retB.toFixed(2)}%
            </span>
          </div>
          <div class="cmp-breakdown-wrapper">
            ${renderTable(portB.breakdown, '#FF9800')}
          </div>
        </div>
      </div>
    `;
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

    // Mode tab buttons
    const tabBtns = modalEl.querySelectorAll('.whatif-tab-btn');
    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const targetTab = btn.getAttribute('data-whatif-tab');
        this.switchTab(targetTab);
      });
    });

    // Single run button
    const runBtn = modalEl.querySelector('#btn-run-whatif');
    if (runBtn) {
      runBtn.addEventListener('click', () => this.runCalculation());
    }

    // Mix buttons
    const addABtn = modalEl.querySelector('#btn-add-cmp-a');
    if (addABtn) {
      addABtn.addEventListener('click', () => this.addCmpRow('a'));
    }

    const addBBtn = modalEl.querySelector('#btn-add-cmp-b');
    if (addBBtn) {
      addBBtn.addEventListener('click', () => this.addCmpRow('b'));
    }

    const runMixBtn = modalEl.querySelector('#btn-run-cmp-mix');
    if (runMixBtn) {
      runMixBtn.addEventListener('click', () => this.runMixCalculation());
    }

    const saveMixBtn = modalEl.querySelector('#btn-save-cmp-mix');
    if (saveMixBtn) {
      saveMixBtn.addEventListener('click', () => {
        this.saveCmpToStorage();
        showToast('💾 บันทึกสัดส่วนพอร์ตผสมเรียบร้อยแล้ว');
      });
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
  calculateBlendedReturn,
  compareBlendedPortfolios,
  formatCurrency,
  formatPercent
};
