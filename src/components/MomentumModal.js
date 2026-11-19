/**
 * Momentum Leaderboard Modal Component
 * Ranks all 15 GPF investment plans by multi-timeframe relative strength (3M, 6M, 12M)
 * and composite momentum score to track cross-asset rotation.
 */
import { getPlanColor, THAI_MONTHS_SHORT, parseDateUTC } from './ChartView.js';

export const ASSET_CATEGORIES = {
  'แผนเชิงรุก 20': { label: 'ผสมเชิงรุก', type: 'active' },
  'แผนเชิงรุก 35': { label: 'ผสมเชิงรุก', type: 'active' },
  'แผนเชิงรุก 65': { label: 'ผสมเชิงรุก', type: 'active' },
  'แผนสมดุลตามอายุ': { label: 'ตามอายุ', type: 'life-path' },
  'แผนผสมหุ้นทวี': { label: 'ผสมเชิงรุก', type: 'active' },
  'แผนตราสารทุนไทย': { label: 'หุ้นไทย', type: 'equity' },
  'แผนหุ้นต่างประเทศ': { label: 'หุ้นโลก', type: 'equity' },
  'แผนทองคำ': { label: 'ทางเลือก', type: 'commodity' },
  'แผนอสังหาริมทรัพย์ไทย': { label: 'ทางเลือก', type: 'reit' },
  'แผนตลาดเงิน': { label: 'พักเงิน', type: 'cash' },
  'แผนเงินฝากและตราสารหนี้ระยะสั้น': { label: 'พักเงิน', type: 'cash' },
  'แผนตราสารหนี้': { label: 'ตราสารหนี้', type: 'bond' },
  'แผนตราสารหนี้ต่างประเทศ': { label: 'ตราสารหนี้', type: 'bond' },
  'แผนดัชนีหุ้นต่างประเทศ': { label: 'หุ้นโลก', type: 'equity' },
  'แผนตราสารหนี้ไทย': { label: 'ตราสารหนี้', type: 'bond' }
};

export class MomentumModal {
  constructor(container, options = {}) {
    this.container = typeof container === 'string'
      ? (typeof document !== 'undefined' ? document.querySelector(container) : null)
      : container;

    this.options = options;
    this.summaryData = options.summaryData || null;
    this.chartData = options.chartData || null;
    this.onSelectPlan = options.onSelectPlan || null;

    this.isOpen = false;
    this.sortBy = 'composite'; // 'composite' | '3M' | '6M' | '1Y'
    this.sortDir = 'desc';

    this._handleKeyDown = this._handleKeyDown.bind(this);
    this._handleClickOutside = this._handleClickOutside.bind(this);

    this.render();
  }

  setData(summaryData, chartData) {
    this.summaryData = summaryData;
    if (chartData) this.chartData = chartData;
    if (this.isOpen) {
      this.renderTable();
    }
  }

  render() {
    if (!this.container || typeof document === 'undefined') return;

    // Check if element already exists
    let modalEl = this.container.querySelector('#momentum-modal');
    if (!modalEl) {
      modalEl = document.createElement('div');
      modalEl.id = 'momentum-modal';
      modalEl.className = 'custom-modal-backdrop';
      modalEl.style.display = 'none';
      this.container.appendChild(modalEl);
    }

    modalEl.innerHTML = `
      <div class="custom-modal-dialog momentum-dialog" role="dialog" aria-modal="true">
        <div class="custom-modal-header">
          <div class="modal-title-wrap">
            <h3 class="custom-modal-title">
              <span class="modal-title-icon">🏆</span>
              ตารางจัดอันดับโมเมนตัม 15 แผน กบข.
            </h3>
            <span class="modal-title-sub">
              เปรียบเทียบความแข็งแกร่งของราคา (Relative Strength 3M / 6M / 12M) เพื่อตรวจจับกระแสเงินไหลเวียน (Asset Rotation)
            </span>
          </div>
          <button class="custom-modal-close" id="btn-close-momentum" title="ปิดหน้าต่าง">&times;</button>
        </div>

        <div class="momentum-highlight-cards" id="momentum-highlights"></div>

        <div class="momentum-controls">
          <div class="momentum-sort-label">จัดเรียงตาม:</div>
          <div class="momentum-sort-buttons" role="group">
            <button class="sort-chip is-active" data-sort="composite">✨ คะแนนรวม (Composite)</button>
            <button class="sort-chip" data-sort="3M">3 เดือน (3M)</button>
            <button class="sort-chip" data-sort="6M">6 เดือน (6M)</button>
            <button class="sort-chip" data-sort="1Y">1 ปี (12M)</button>
          </div>
        </div>

        <div class="momentum-table-wrapper">
          <table class="momentum-table">
            <thead>
              <tr>
                <th class="th-rank">อันดับ</th>
                <th class="th-plan">แผนการลงทุน</th>
                <th class="th-cat">กลุ่มสินทรัพย์</th>
                <th class="th-nav">NAV ล่าสุด</th>
                <th class="th-ret" data-col="3M">3 เดือน</th>
                <th class="th-ret" data-col="6M">6 เดือน</th>
                <th class="th-ret" data-col="1Y">1 ปี</th>
                <th class="th-score" data-col="composite">คะแนนโมเมนตัม</th>
                <th class="th-act">กราฟ</th>
              </tr>
            </thead>
            <tbody id="momentum-table-body"></tbody>
          </table>
        </div>

        <div class="custom-modal-footer">
          <div class="modal-footer-note">
            💡 <strong>สูตรคำนวณคะแนนโมเมนตัม:</strong> ถ่วงน้ำหนักผลตอบแทน 3 เดือน (40%) + 6 เดือน (30%) + 1 ปี (30%) เพื่อสะท้อนทั้งแรงขับเคลื่อนระยะสั้นและเทรนด์ระยะกลาง
          </div>
          <button class="btn btn-secondary" id="btn-close-momentum-footer">ปิดหน้าต่าง</button>
        </div>
      </div>
    `;

    this.bindEvents(modalEl);
  }

  bindEvents(modalEl) {
    const closeBtn = modalEl.querySelector('#btn-close-momentum');
    if (closeBtn) closeBtn.addEventListener('click', () => this.close());

    const footerClose = modalEl.querySelector('#btn-close-momentum-footer');
    if (footerClose) footerClose.addEventListener('click', () => this.close());

    modalEl.addEventListener('click', this._handleClickOutside);

    // Sort buttons
    const chips = modalEl.querySelectorAll('.sort-chip');
    chips.forEach(chip => {
      chip.addEventListener('click', () => {
        chips.forEach(c => c.classList.remove('is-active'));
        chip.classList.add('is-active');
        this.sortBy = chip.getAttribute('data-sort');
        this.renderTable();
      });
    });
  }

  _handleClickOutside(e) {
    if (e.target && e.target.id === 'momentum-modal') {
      this.close();
    }
  }

  _handleKeyDown(e) {
    if (e.key === 'Escape' && this.isOpen) {
      this.close();
    }
  }

  computeRankings() {
    if (!this.summaryData || !this.summaryData.plans) return [];

    const planKeys = Object.keys(this.summaryData.plans);
    const rows = [];

    for (const key of planKeys) {
      const p = this.summaryData.plans[key];
      const rets = p.returns || {};
      const r3M = typeof rets['3M'] === 'number' ? rets['3M'] : null;
      const r6M = typeof rets['6M'] === 'number' ? rets['6M'] : null;
      const r1Y = typeof rets['1Y'] === 'number' ? rets['1Y'] : (typeof rets['12M'] === 'number' ? rets['12M'] : null);

      // Composite Momentum Score calculation: 40% 3M + 30% 6M + 30% 1Y
      let score = null;
      if (r3M !== null && r6M !== null && r1Y !== null) {
        score = (r3M * 0.40) + (r6M * 0.30) + (r1Y * 0.30);
      } else if (r3M !== null && r6M !== null) {
        score = (r3M * 0.55) + (r6M * 0.45);
      } else if (r3M !== null) {
        score = r3M;
      }

      const meta = ASSET_CATEGORIES[key] || { label: 'ทั่วไป', type: 'general' };
      const color = p.color || getPlanColor(key, this.summaryData);

      rows.push({
        key,
        color,
        category: meta.label,
        catType: meta.type,
        latestNav: p.latestNav,
        r3M,
        r6M,
        r1Y,
        score: score !== null ? Number(score.toFixed(2)) : -9999
      });
    }

    // Sort based on current sortBy
    rows.sort((a, b) => {
      let valA, valB;
      if (this.sortBy === '3M') {
        valA = a.r3M ?? -9999;
        valB = b.r3M ?? -9999;
      } else if (this.sortBy === '6M') {
        valA = a.r6M ?? -9999;
        valB = b.r6M ?? -9999;
      } else if (this.sortBy === '1Y') {
        valA = a.r1Y ?? -9999;
        valB = b.r1Y ?? -9999;
      } else {
        valA = a.score;
        valB = b.score;
      }
      return this.sortDir === 'desc' ? (valB - valA) : (valA - valB);
    });

    return rows;
  }

  renderTable() {
    const modalEl = this.container ? this.container.querySelector('#momentum-modal') : null;
    if (!modalEl) return;

    const tbody = modalEl.querySelector('#momentum-table-body');
    const highlightsEl = modalEl.querySelector('#momentum-highlights');
    if (!tbody) return;

    const rankings = this.computeRankings();
    if (rankings.length === 0) {
      tbody.innerHTML = `<tr><td colspan="9" style="text-align: center; padding: 24px; color: var(--terminal-muted);">ไม่พบข้อมูลสรุปผลตอบแทน</td></tr>`;
      return;
    }

    // Top 3 Highlights
    if (highlightsEl) {
      const top1 = rankings[0];
      const top2 = rankings[1];
      const top3 = rankings[2];

      highlightsEl.innerHTML = `
        <div class="momentum-card card-gold">
          <div class="momentum-card-badge">🥇 ผู้นำอันดับ 1</div>
          <div class="momentum-card-title" style="color: ${top1.color};">${top1.key}</div>
          <div class="momentum-card-score">+${top1.score.toFixed(2)} pts</div>
          <div class="momentum-card-sub">3M: <span class="${top1.r3M >= 0 ? 'text-up' : 'text-down'}">${top1.r3M >= 0 ? '+' : ''}${top1.r3M?.toFixed(2)}%</span> · 1Y: <span class="${top1.r1Y >= 0 ? 'text-up' : 'text-down'}">${top1.r1Y >= 0 ? '+' : ''}${top1.r1Y?.toFixed(2)}%</span></div>
        </div>
        <div class="momentum-card card-silver">
          <div class="momentum-card-badge">🥈 อันดับ 2</div>
          <div class="momentum-card-title" style="color: ${top2.color};">${top2.key}</div>
          <div class="momentum-card-score">+${top2.score.toFixed(2)} pts</div>
          <div class="momentum-card-sub">3M: <span class="${top2.r3M >= 0 ? 'text-up' : 'text-down'}">${top2.r3M >= 0 ? '+' : ''}${top2.r3M?.toFixed(2)}%</span> · 1Y: <span class="${top2.r1Y >= 0 ? 'text-up' : 'text-down'}">${top2.r1Y >= 0 ? '+' : ''}${top2.r1Y?.toFixed(2)}%</span></div>
        </div>
        <div class="momentum-card card-bronze">
          <div class="momentum-card-badge">🥉 อันดับ 3</div>
          <div class="momentum-card-title" style="color: ${top3.color};">${top3.key}</div>
          <div class="momentum-card-score">+${top3.score.toFixed(2)} pts</div>
          <div class="momentum-card-sub">3M: <span class="${top3.r3M >= 0 ? 'text-up' : 'text-down'}">${top3.r3M >= 0 ? '+' : ''}${top3.r3M?.toFixed(2)}%</span> · 1Y: <span class="${top3.r1Y >= 0 ? 'text-up' : 'text-down'}">${top3.r1Y >= 0 ? '+' : ''}${top3.r1Y?.toFixed(2)}%</span></div>
        </div>
      `;
    }

    // Max score for relative bar length
    const maxScore = Math.max(...rankings.map(r => Math.abs(r.score)), 1);

    tbody.innerHTML = rankings.map((r, idx) => {
      const rank = idx + 1;
      let rankBadge = `${rank}`;
      if (rank === 1) rankBadge = '🥇 1';
      else if (rank === 2) rankBadge = '🥈 2';
      else if (rank === 3) rankBadge = '🥉 3';

      const fmtRet = (val) => {
        if (val === null || val === undefined || isNaN(val)) return '<span class="ret-null">-</span>';
        const isPos = val >= 0;
        return `<span class="ret-pill ${isPos ? 'ret-up' : 'ret-down'}">${isPos ? '+' : ''}${val.toFixed(2)}%</span>`;
      };

      const barWidth = Math.min(Math.round((Math.abs(r.score) / maxScore) * 100), 100);
      const isPosScore = r.score >= 0;

      return `
        <tr class="momentum-row" data-plan="${r.key}">
          <td class="td-rank">
            <span class="rank-badge ${rank <= 3 ? `top-${rank}` : ''}">${rankBadge}</span>
          </td>
          <td class="td-plan">
            <div class="plan-name-wrap">
              <span class="plan-color-dot" style="background: ${r.color};"></span>
              <strong class="plan-name">${r.key}</strong>
            </div>
          </td>
          <td class="td-cat">
            <span class="cat-tag cat-${r.catType}">${r.category}</span>
          </td>
          <td class="td-nav">
            ${r.latestNav ? Number(r.latestNav).toFixed(4) : '-'}
          </td>
          <td class="td-ret">${fmtRet(r.r3M)}</td>
          <td class="td-ret">${fmtRet(r.r6M)}</td>
          <td class="td-ret">${fmtRet(r.r1Y)}</td>
          <td class="td-score">
            <div class="score-bar-wrap">
              <span class="score-val ${isPosScore ? 'text-up' : 'text-down'}">${isPosScore ? '+' : ''}${r.score.toFixed(2)}</span>
              <div class="score-progress-bg">
                <div class="score-progress-fill ${isPosScore ? 'fill-up' : 'fill-down'}" style="width: ${barWidth}%;"></div>
              </div>
            </div>
          </td>
          <td class="td-act">
            <button class="btn-view-chart" data-plan="${r.key}" title="เปิดดูกราฟแผนนี้">
              📈 ดูกราฟ
            </button>
          </td>
        </tr>
      `;
    }).join('');

    // Attach click listeners to rows & view chart buttons
    const viewBtns = tbody.querySelectorAll('.btn-view-chart');
    viewBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const targetPlan = btn.getAttribute('data-plan');
        this.selectPlan(targetPlan);
      });
    });

    const rowsEls = tbody.querySelectorAll('.momentum-row');
    rowsEls.forEach(row => {
      row.addEventListener('click', () => {
        const targetPlan = row.getAttribute('data-plan');
        this.selectPlan(targetPlan);
      });
    });
  }

  selectPlan(planName) {
    if (!planName) return;

    if (typeof this.onSelectPlan === 'function') {
      this.onSelectPlan(planName);
    }

    if (typeof document !== 'undefined') {
      const ev = new CustomEvent('select-primary-plan', {
        bubbles: true,
        detail: { plan: planName }
      });
      document.dispatchEvent(ev);
    }

    this.close();
  }

  open() {
    const modalEl = this.container ? this.container.querySelector('#momentum-modal') : null;
    if (!modalEl) return;

    this.renderTable();
    modalEl.style.display = 'flex';
    this.isOpen = true;

    if (typeof document !== 'undefined') {
      document.addEventListener('keydown', this._handleKeyDown);
    }
  }

  close() {
    const modalEl = this.container ? this.container.querySelector('#momentum-modal') : null;
    if (modalEl) {
      modalEl.style.display = 'none';
      this.isOpen = false;
      if (typeof document !== 'undefined') {
        document.removeEventListener('keydown', this._handleKeyDown);
      }
    }
  }

  destroy() {
    if (typeof document !== 'undefined') {
      document.removeEventListener('keydown', this._handleKeyDown);
    }
    const modalEl = this.container ? this.container.querySelector('#momentum-modal') : null;
    if (modalEl && modalEl.parentNode) {
      modalEl.parentNode.removeChild(modalEl);
    }
  }
}

export function renderMomentumModal(container, options = {}) {
  const instance = new MomentumModal(container, options);
  return instance;
}

export default MomentumModal;
