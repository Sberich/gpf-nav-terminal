/**
 * PlanSelector Component - Watchlist Sidebar for GPF Investment Plans
 * Renders all 15 GPF investment plans in a clean, compact, un-nested list:
 *
 * Each row displays:
 * - Checkbox toggle for multi-series chart comparison
 * - Color swatch dot
 * - Plan name & primary tag
 * - Latest NAV price in monospace/tabular numerals (inline)
 * - 1D daily percentage change pill (+ / -) placed directly beside NAV
 * - Quick actions: "เลือกทั้งหมด", "ซ่อนทั้งหมด"
 */

export const PLAN_CATEGORIES = [
  {
    id: 'active',
    title: 'แผนเชิงรุก',
    subtitle: 'Active Allocation (4 แผน)',
    plans: ['แผนเชิงรุก 20', 'แผนเชิงรุก 35', 'แผนเชิงรุก 65', 'แผนเชิงรุก 75']
  },
  {
    id: 'fixed_income',
    title: 'ตลาดเงินและตราสารหนี้',
    subtitle: 'Fixed Income (3 แผน)',
    plans: ['แผนเงินฝากและตราสารหนี้ระยะสั้น', 'แผนตราสารหนี้', 'แผนตราสารหนี้ต่างประเทศ']
  },
  {
    id: 'equity',
    title: 'หุ้นและอสังหาริมทรัพย์',
    subtitle: 'Equities & Real Estate (3 แผน)',
    plans: ['แผนหุ้นไทย', 'แผนหุ้นต่างประเทศ', 'แผนกองทุนอสังหาริมทรัพย์ไทย']
  },
  {
    id: 'special',
    title: 'แผนพิเศษและทางเลือก',
    subtitle: 'Specialized Plans (5 แผน)',
    plans: [
      'แผนทองคำ',
      'แผนกองทุนรวมวายุภักษ์',
      'แผนการลงทุนตามหลักชะรีอะฮ์',
      'แผนลงทุนพื้นฐานทั่วไป',
      'แผนเกษียณสบายใจ 2569'
    ]
  }
];

export const ALL_PLANS = [
  'แผนเชิงรุก 20',
  'แผนเชิงรุก 35',
  'แผนเชิงรุก 65',
  'แผนเชิงรุก 75',
  'แผนเงินฝากและตราสารหนี้ระยะสั้น',
  'แผนตราสารหนี้',
  'แผนตราสารหนี้ต่างประเทศ',
  'แผนหุ้นไทย',
  'แผนหุ้นต่างประเทศ',
  'แผนกองทุนอสังหาริมทรัพย์ไทย',
  'แผนทองคำ',
  'แผนกองทุนรวมวายุภักษ์',
  'แผนการลงทุนตามหลักชะรีอะฮ์',
  'แผนลงทุนพื้นฐานทั่วไป',
  'แผนเกษียณสบายใจ 2569'
];

const WHATIF_ICON = `
<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <rect x="4" y="2" width="16" height="20" rx="2"></rect>
  <line x1="8" y1="6" x2="16" y2="6"></line>
  <line x1="16" y1="14" x2="16" y2="18"></line>
  <path d="M16 10h.01"></path>
  <path d="M12 10h.01"></path>
  <path d="M8 10h.01"></path>
  <path d="M12 14h.01"></path>
  <path d="M8 14h.01"></path>
  <path d="M12 18h.01"></path>
  <path d="M8 18h.01"></path>
</svg>
`;

const PIN_ICON = `
<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <line x1="12" y1="17" x2="12" y2="22"></line>
  <path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z"></path>
</svg>
`;

export class PlanSelector {
  constructor(container, options = {}) {
    this.container = typeof container === 'string' ? document.querySelector(container) : container;
    this.summaryData = options.summaryData || null;

    const savedPlan = (typeof localStorage !== 'undefined' && options.summaryData?.plans)
      ? localStorage.getItem('gpf_primary_plan')
      : null;
    this.primaryPlan = (savedPlan && options.summaryData?.plans?.[savedPlan])
      ? savedPlan
      : (options.defaultPlan || options.primaryPlan || 'แผนเชิงรุก 35');
    
    // Set of active plans for chart comparison
    const initial = options.activePlans || [this.primaryPlan];
    this.activePlans = new Set(initial);
    this.activePlans.add(this.primaryPlan);

    // Track collapsed categories (backward compatibility)
    this.collapsedCategories = new Set();

    this.render();
  }

  setData(summaryData) {
    this.summaryData = summaryData;
    this.render();
  }

  setPrimaryPlan(planKey) {
    if (!planKey) return;
    this.primaryPlan = planKey;
    this.activePlans.add(planKey);
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('gpf_primary_plan', planKey);
      }
    } catch {
      // ignore
    }
    this.updateActiveStyles();
  }

  setActivePlans(plans) {
    if (!Array.isArray(plans)) return;
    this.activePlans = new Set(plans);
    if (this.primaryPlan) {
      this.activePlans.add(this.primaryPlan);
    }
    this.updateActiveStyles();
  }

  selectPlan(planKey) {
    if (!planKey) return;
    this.primaryPlan = planKey;
    this.activePlans.add(planKey);
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('gpf_primary_plan', planKey);
      }
    } catch {
      // ignore
    }
    this.dispatchChange(true);
    this.updateActiveStyles();
  }

  togglePlanSelection(planKey) {
    if (!planKey) return;
    if (this.activePlans.has(planKey)) {
      if (this.activePlans.size > 1) {
        this.activePlans.delete(planKey);
        // If deselected plan was primary, switch primary to another active plan
        if (this.primaryPlan === planKey) {
          this.primaryPlan = Array.from(this.activePlans)[0];
        }
      }
    } else {
      this.activePlans.add(planKey);
      if (!this.primaryPlan) {
        this.primaryPlan = planKey;
      }
    }
    this.dispatchChange(false);
    this.updateActiveStyles();
  }

  selectAll() {
    ALL_PLANS.forEach(name => this.activePlans.add(name));
    this.dispatchChange(false);
    this.updateActiveStyles();
  }

  deselectAll() {
    this.activePlans = new Set([this.primaryPlan]);
    this.dispatchChange(false);
    this.updateActiveStyles();
  }

  selectOnly(planKey) {
    if (!planKey) return;
    this.activePlans = new Set([planKey]);
    this.primaryPlan = planKey;
    this.dispatchChange(true);
    this.updateActiveStyles();
  }

  toggleCategory(catId) {
    if (this.collapsedCategories.has(catId)) {
      this.collapsedCategories.delete(catId);
    } else {
      this.collapsedCategories.add(catId);
    }
    this.render();
  }

  dispatchChange(isPrimaryChange = false) {
    const detail = {
      activePlans: Array.from(this.activePlans),
      primaryPlan: this.primaryPlan,
      isPrimaryChange
    };
    const event = new CustomEvent('plan-change', {
      detail,
      bubbles: true
    });
    if (this.container && typeof this.container.dispatchEvent === 'function') {
      this.container.dispatchEvent(event);
    }
  }

  updateActiveStyles() {
    const pills = this.container?.querySelectorAll ? this.container.querySelectorAll('.plan-pill') : [];
    if (pills && pills.length > 0) {
      pills.forEach(pill => {
        const planKey = pill.dataset?.plan || pill.getAttribute?.('data-plan');
        if (!planKey) return;
        const isSelected = this.activePlans.has(planKey);
        const isPrimary = this.primaryPlan === planKey;
        
        if (isSelected) {
          pill.classList.add('is-selected');
        } else {
          pill.classList.remove('is-selected');
        }

        if (isPrimary) {
          pill.classList.add('is-primary');
        } else {
          pill.classList.remove('is-primary');
        }

        const checkbox = pill.querySelector ? pill.querySelector('.plan-checkbox') : null;
        if (checkbox) {
          checkbox.checked = isSelected;
        }

        const primaryTag = pill.querySelector ? pill.querySelector('.primary-tag') : null;
        if (primaryTag && primaryTag.style) {
          primaryTag.style.display = isPrimary ? 'inline-block' : 'none';
        }

        const customCheck = pill.querySelector ? pill.querySelector('.custom-check') : null;
        if (customCheck && customCheck.style) {
          const planColor = pill.style?.getPropertyValue?.('--plan-color') || pill.style?.['--plan-color'];
          customCheck.style.backgroundColor = isSelected ? (planColor || 'var(--plan-color)') : 'transparent';
        }
      });

      const countEl = this.container.querySelector ? this.container.querySelector('.selected-count-badge') : null;
      if (countEl) {
        countEl.textContent = `${this.activePlans.size}/15 แผน`;
      }
    } else {
      this.render();
    }
  }

  render() {
    if (!this.container) return;

    const plansData = this.summaryData?.plans || {};

    let pillsHtml = '';
    for (const planName of ALL_PLANS) {
      const planInfo = plansData[planName] || {};
      const color = planInfo.color || '#2196F3';
      const isSelected = this.activePlans.has(planName);
      const isPrimary = this.primaryPlan === planName;
      
      // Latest NAV price & 1D change
      const navStr = planInfo.latestNav != null ? Number(planInfo.latestNav).toFixed(4) : '-';
      const chgVal = planInfo.changePct;
      const hasChg = chgVal != null && !isNaN(chgVal);
      const chgIsUp = hasChg && chgVal >= 0;
      const chgBadge = hasChg ? `${chgIsUp ? '+' : ''}${Number(chgVal).toFixed(2)}%` : '-';
      const chgClass = !hasChg ? 'neutral' : (chgIsUp ? 'up' : 'down');

      const catName = PLAN_CATEGORIES.find(c => c.plans.includes(planName))?.title || '';

      pillsHtml += `
        <div class="plan-pill ${isSelected ? 'is-selected' : ''} ${isPrimary ? 'is-primary' : ''}"
             data-plan="${planName}"
             data-category="${catName}"
             style="--plan-color: ${color}">
          <label class="plan-checkbox-wrapper" title="เปิด/ปิดการเปรียบเทียบในกราฟ">
            <input type="checkbox" class="plan-checkbox" data-plan="${planName}" ${isSelected ? 'checked' : ''} />
            <span class="custom-check" style="background-color: ${isSelected ? color : 'transparent'}; border-color: ${color}"></span>
          </label>
          <div class="plan-info" title="คลิกเพื่อเลือกแผนนี้เป็นแผนหลัก">
            <span class="plan-swatch" style="background-color: ${color}"></span>
            <div class="plan-name-wrap">
              <span class="plan-name" title="${planName}">${planName}</span>
              <span class="primary-tag" style="display: ${isPrimary ? 'inline-block' : 'none'}">หลัก</span>
            </div>
          </div>
          <div class="plan-price-col">
            <span class="plan-nav-val">${navStr}</span>
            <span class="plan-chg-pill ${chgClass}">${chgBadge}</span>
          </div>
        </div>
      `;
    }

    this.container.innerHTML = `
      <div class="plan-selector watchlist-sidebar-card animate-fade-in">
        <div class="watchlist-header">
          <div class="watchlist-title-row">
            <span class="watchlist-title">กระดานราคา (WATCHLIST)</span>
            <span class="selected-count-badge">${this.activePlans.size}/15 แผน</span>
          </div>
          <div class="watchlist-hint">คลิกชื่อเพื่อเปลี่ยนแผนหลัก หรือติ๊กถูกเพื่อเทียบกราฟ</div>
        </div>

        <div class="plan-categories-list watchlist-scroll-area plan-pills-list">
          ${pillsHtml}
        </div>

        <div class="watchlist-footer">
          <div class="watchlist-action-tools">
            <button id="btn-open-whatif" class="btn-sidebar-tool" title="จำลองผลตอบแทนเปรียบเทียบ (What-If)">
              ${WHATIF_ICON}
              <span>จำลองผลตอบแทน</span>
            </button>
            <button id="btn-open-pins" class="btn-sidebar-tool" title="ปักหมุดระดับราคาเป้าหมาย">
              ${PIN_ICON}
              <span>ปักหมุดราคา</span>
            </button>
          </div>
          <div class="selector-quick-actions">
            <button id="btn-select-all" class="btn-quick-action" title="เลือกแสดงผลทุกแผน">เลือกทั้งหมด</button>
            <button id="btn-select-default" class="btn-quick-action" title="ซ่อนแผนอื่น เหลือเฉพาะแผนหลัก">ซ่อนทั้งหมด</button>
          </div>
        </div>
      </div>
    `;

    this.bindEvents();
  }

  bindEvents() {
    if (!this.container || !this.container.querySelectorAll) return;

    // Sidebar action tool: What-If Modal
    const whatIfBtn = this.container.querySelector ? this.container.querySelector('#btn-open-whatif') : null;
    if (whatIfBtn && typeof whatIfBtn.addEventListener === 'function') {
      whatIfBtn.addEventListener('click', () => {
        const whatIfEvent = new CustomEvent('open-whatif-modal', { bubbles: true });
        document.dispatchEvent(whatIfEvent);
        if (typeof window !== 'undefined' && window.dispatchEvent) window.dispatchEvent(whatIfEvent);
      });
    }

    // Sidebar action tool: Pin Modal
    const pinBtn = this.container.querySelector ? this.container.querySelector('#btn-open-pins') : null;
    if (pinBtn && typeof pinBtn.addEventListener === 'function') {
      pinBtn.addEventListener('click', () => {
        const pinEvent = new CustomEvent('open-pin-modal', { bubbles: true });
        document.dispatchEvent(pinEvent);
        if (typeof window !== 'undefined' && window.dispatchEvent) window.dispatchEvent(pinEvent);
      });
    }

    // Quick action: Select All
    const selectAllBtn = this.container.querySelector ? this.container.querySelector('#btn-select-all') : null;
    if (selectAllBtn && typeof selectAllBtn.addEventListener === 'function') {
      selectAllBtn.addEventListener('click', () => this.selectAll());
    }

    // Quick action: Select Default / Deselect others
    const selectDefaultBtn = this.container.querySelector ? this.container.querySelector('#btn-select-default') : null;
    if (selectDefaultBtn && typeof selectDefaultBtn.addEventListener === 'function') {
      selectDefaultBtn.addEventListener('click', () => this.deselectAll());
    }

    // Category accordion toggle (backward compatibility)
    const catHeaders = this.container.querySelectorAll('.plan-category-header');
    if (catHeaders && catHeaders.length) {
      catHeaders.forEach(hdr => {
        if (typeof hdr.addEventListener === 'function') {
          hdr.addEventListener('click', () => {
            const catId = hdr.dataset?.toggleCat || hdr.getAttribute('data-toggle-cat');
            if (catId) this.toggleCategory(catId);
          });
        }
      });
    }

    // Plan pills click & checkbox events
    const pills = this.container.querySelectorAll('.plan-pill');
    if (pills && pills.length) {
      pills.forEach(pill => {
        const planKey = pill.dataset?.plan || pill.getAttribute('data-plan');

        // Clicking plan info or row sets it as primary
        const infoEl = pill.querySelector ? pill.querySelector('.plan-info') : null;
        if (infoEl && typeof infoEl.addEventListener === 'function') {
          infoEl.addEventListener('click', (e) => {
            e.stopPropagation();
            this.selectPlan(planKey);
          });
        }

        // Clicking price col also selects as primary
        const priceCol = pill.querySelector ? pill.querySelector('.plan-price-col') : null;
        if (priceCol && typeof priceCol.addEventListener === 'function') {
          priceCol.addEventListener('click', (e) => {
            e.stopPropagation();
            this.selectPlan(planKey);
          });
        }

        // Clicking checkbox toggles selection in activePlans
        const checkbox = pill.querySelector ? pill.querySelector('.plan-checkbox') : null;
        if (checkbox && typeof checkbox.addEventListener === 'function') {
          checkbox.addEventListener('click', (e) => {
            e.stopPropagation();
            this.togglePlanSelection(planKey);
          });
        }

        // Clicking "เฉพาะ" button selects only this plan
        const onlyBtn = pill.querySelector ? pill.querySelector('.btn-only-this') : null;
        if (onlyBtn && typeof onlyBtn.addEventListener === 'function') {
          onlyBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.selectOnly(planKey);
          });
        }
      });
    }
  }
}

export function renderPlanSelector(container, options) {
  return new PlanSelector(container, options);
}

export default {
  PlanSelector,
  renderPlanSelector,
  PLAN_CATEGORIES,
  ALL_PLANS,
};
