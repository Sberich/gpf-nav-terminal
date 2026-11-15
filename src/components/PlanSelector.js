/**
 * PlanSelector Component - Watchlist Sidebar for GPF Investment Plans
 * Renders all 15 GPF investment plans vertically across 4 financial categories:
 * 1. แผนเชิงรุก (Active Allocation)
 * 2. ตลาดเงินและตราสารหนี้ (Fixed Income & Money Market)
 * 3. หุ้นและอสังหาริมทรัพย์ (Equities & Real Estate)
 * 4. แผนพิเศษและทางเลือก (Specialized & Alternative Plans)
 *
 * Each row displays:
 * - Color swatch dot
 * - Checkbox toggle for multi-series chart comparison
 * - Plan name & primary tag
 * - Latest NAV price in monospace/tabular numerals
 * - 1D daily percentage change pill (+ / -)
 * - Quick actions: "เลือกทั้งหมด", "ซ่อนทั้งหมด", and "เฉพาะ" (Solo view)
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

    // Track collapsed categories
    this.collapsedCategories = new Set();

    this.render();
  }

  setData(summaryData) {
    this.summaryData = summaryData;
    this.render();
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
    this.dispatchChange();
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
      this.primaryPlan = planKey;
    }
    this.dispatchChange();
    this.updateActiveStyles();
  }

  selectAll() {
    PLAN_CATEGORIES.forEach(cat => {
      cat.plans.forEach(name => this.activePlans.add(name));
    });
    this.dispatchChange();
    this.updateActiveStyles();
  }

  deselectAll() {
    this.activePlans = new Set([this.primaryPlan]);
    this.dispatchChange();
    this.updateActiveStyles();
  }

  selectOnly(planKey) {
    if (!planKey) return;
    this.activePlans = new Set([planKey]);
    this.primaryPlan = planKey;
    this.dispatchChange();
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

  dispatchChange() {
    const detail = {
      activePlans: Array.from(this.activePlans),
      primaryPlan: this.primaryPlan
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

    let categoriesHtml = '';
    for (const cat of PLAN_CATEGORIES) {
      const isCollapsed = this.collapsedCategories.has(cat.id);
      const chevron = isCollapsed ? '▶' : '▼';

      let pillsHtml = '';
      for (const planName of cat.plans) {
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

        pillsHtml += `
          <div class="plan-pill ${isSelected ? 'is-selected' : ''} ${isPrimary ? 'is-primary' : ''}"
               data-plan="${planName}"
               style="--plan-color: ${color}">
            <label class="plan-checkbox-wrapper" title="เปิด/ปิดการเปรียบเทียบในกราฟ">
              <input type="checkbox" class="plan-checkbox" data-plan="${planName}" ${isSelected ? 'checked' : ''} />
              <span class="custom-check" style="background-color: ${isSelected ? color : 'transparent'}; border-color: ${color}"></span>
            </label>
            <div class="plan-info" title="คลิกเพื่อเลือกแผนนี้เป็นแผนอ้างอิง">
              <span class="plan-swatch" style="background-color: ${color}"></span>
              <div class="plan-name-wrap">
                <span class="plan-name">${planName}</span>
                <span class="primary-tag" style="display: ${isPrimary ? 'inline-block' : 'none'}">หลัก</span>
              </div>
            </div>
            <div class="plan-price-col">
              <span class="plan-nav-val">${navStr}</span>
              <span class="plan-chg-pill ${chgClass}">${chgBadge}</span>
            </div>
            <button class="btn-only-this" data-only="${planName}" title="เลือกดูเฉพาะแผนนี้">เฉพาะ</button>
          </div>
        `;
      }

      categoriesHtml += `
        <div class="plan-category-group ${isCollapsed ? 'collapsed' : ''}" data-cat="${cat.id}">
          <div class="plan-category-header" data-toggle-cat="${cat.id}">
            <div class="cat-title-wrap">
              <span class="cat-chevron">${chevron}</span>
              <span class="cat-title">${cat.title}</span>
            </div>
            <span class="cat-count-badge">${cat.plans.length}</span>
          </div>
          <div class="plan-pills-container ${isCollapsed ? 'hidden' : ''}">
            <div class="plan-pills">
              ${pillsHtml}
            </div>
          </div>
        </div>
      `;
    }

    this.container.innerHTML = `
      <div class="plan-selector watchlist-sidebar-card animate-fade-in">
        <div class="watchlist-header">
          <div class="watchlist-title-row">
            <span class="watchlist-title">กระดานราคา (Watchlist)</span>
            <span class="selected-count-badge">${this.activePlans.size}/15 แผน</span>
          </div>
          <div class="watchlist-hint">คลิกชื่อเพื่อเปลี่ยนแผนหลัก หรือติ๊กถูกเพื่อเทียบกราฟ</div>
        </div>

        <div class="plan-categories-list watchlist-scroll-area">
          ${categoriesHtml}
        </div>

        <div class="watchlist-footer">
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

    // Category accordion toggle
    const catHeaders = this.container.querySelectorAll('.plan-category-header');
    if (catHeaders && catHeaders.length) {
      catHeaders.forEach(hdr => {
        if (typeof hdr.addEventListener === 'function') {
          hdr.addEventListener('click', (e) => {
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
};
