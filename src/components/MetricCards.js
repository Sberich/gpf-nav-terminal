/**
 * MetricCards Component - Trading Terminal Financial Ticker HUD
 * Renders high-density financial metrics and momentum indicators for GPF investment plans:
 * 1. ข้อมูลล่าสุด (Latest date)
 * 2. NAV ล่าสุด & % เปลี่ยนแปลง 1 วัน (Selected plan price & 1D change)
 * 3. ดีสุดวันนี้ (Best performer of the day across all 15 plans)
 * 4. แย่สุดวันนี้ (Worst performer of the day across all 15 plans)
 * 5. YTD (ต้นปี) & อันดับใน 15 แผน (Year-to-date return & rank)
 * 6. High / Low ช่วงปี (52-week High/Low range)
 * 7. 📉 ย่อตัวจากจุดสูงสุด (% Drawdown from 52W High)
 * 8. 🎯 ตำแหน่งราคา (Price Zone % - Stochastic percentile in 52W range)
 * 9. 🚀 แนวโน้มระยะสั้น (SMA20 Trend indicator: NAV vs 20-day Simple Moving Average)
 * 10. ผลตอบแทนเฉลี่ยต่อปี (CAGR 3Y/5Y) & ราคาสูงสุดตลอดกาล (ATH)
 */

const THAI_MONTHS = [
  'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
  'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
];

/**
 * Format ISO date string (YYYY-MM-DD) to Thai Buddhist Era date
 * e.g. "2026-11-11" -> "11 พ.ย. 2569"
 */
export function formatThaiDate(isoDate) {
  if (!isoDate || typeof isoDate !== 'string') return '-';
  const parts = isoDate.split('-');
  if (parts.length < 3) return isoDate;
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  const bYear = year > 2400 ? year : year + 543;
  return `${day} ${THAI_MONTHS[month] || ''} ${bYear}`;
}

export function formatNav(value) {
  if (value == null || isNaN(value)) return '-';
  return Number(value).toFixed(4);
}

export function formatPct(value, showPlus = true) {
  if (value == null || isNaN(value)) return '-';
  const num = Number(value);
  const sign = num > 0 && showPlus ? '+' : '';
  return `${sign}${num.toFixed(2)}%`;
}

export function formatChange(value) {
  if (value == null || isNaN(value)) return '-';
  const num = Number(value);
  const sign = num > 0 ? '+' : '';
  return `${sign}${num.toFixed(4)} ฿`;
}

export class MetricCards {
  constructor(container, options = {}) {
    this.container = typeof container === 'string' ? document.querySelector(container) : container;
    this.summaryData = options.summaryData || null;
    this.historyData = options.historyData || null;
    this.activePlanKey = options.activePlanKey || 'แผนเชิงรุก 35';
    this.render();
  }

  setPlan(planKey) {
    if (!this.summaryData?.plans?.[planKey]) {
      console.warn(`[MetricCards] Plan not found: ${planKey}`);
      return;
    }
    this.activePlanKey = planKey;
    this.render();
  }

  setData(summaryData, planKey, historyData) {
    this.summaryData = summaryData;
    if (historyData) this.historyData = historyData;
    if (planKey) this.activePlanKey = planKey;
    this.render();
  }

  render() {
    if (!this.container) return;

    const plan = this.summaryData?.plans?.[this.activePlanKey];
    if (!plan) {
      this.container.innerHTML = `
        <div class="metric-cards-empty">
          <p>กำลังโหลดข้อมูลสถิติหรือไม่มีข้อมูลแผน ${this.activePlanKey}</p>
        </div>
      `;
      return;
    }

    const latestDate = this.summaryData.latestDate || '';
    const thaiDate = formatThaiDate(latestDate);
    
    // 1D Change
    const hasChange = plan.change != null && !isNaN(plan.change);
    const isUp = hasChange && Number(plan.change) >= 0;
    const arrow = !hasChange ? '' : (isUp ? '▲' : '▼');
    const trendClass = !hasChange ? 'trend-neutral' : (isUp ? 'trend-up' : 'trend-down');

    // 1. Best & Worst performer across all 15 plans
    let bestPlan = null;
    let worstPlan = null;
    if (this.summaryData?.plans) {
      for (const [key, p] of Object.entries(this.summaryData.plans)) {
        const chg = p.changePct;
        if (chg != null && !isNaN(chg)) {
          if (!bestPlan || chg > bestPlan.changePct) {
            bestPlan = { name: key, changePct: chg };
          }
          if (!worstPlan || chg < worstPlan.changePct) {
            worstPlan = { name: key, changePct: chg };
          }
        }
      }
    }

    // 2. YTD Return & Rank in 15 plans
    const ytdVal = plan.returns?.YTD;
    const hasYtd = ytdVal != null && !isNaN(ytdVal);
    const ytdIsUp = hasYtd && Number(ytdVal) >= 0;
    const ytdTrendClass = !hasYtd ? 'trend-neutral' : (ytdIsUp ? 'trend-up' : 'trend-down');
    const ytdBadgeClass = !hasYtd ? 'badge-neutral' : ytdTrendClass;
    const ytdBadgeText = !hasYtd ? '-' : (ytdIsUp ? '▲ กำไร' : '▼ ขาดทุน');

    let ytdRank = null;
    let totalRanked = 0;
    if (this.summaryData?.plans) {
      const ranked = Object.entries(this.summaryData.plans)
        .map(([key, p]) => ({ key, ytd: p.returns?.YTD }))
        .filter(x => x.ytd != null && !isNaN(x.ytd))
        .sort((a, b) => b.ytd - a.ytd);
      totalRanked = ranked.length;
      const idx = ranked.findIndex(x => x.key === this.activePlanKey);
      if (idx !== -1) ytdRank = idx + 1;
    }

    // 3. Technical SMA20 (20 trading days moving average)
    let smaInfo = null;
    if (this.historyData && Array.isArray(this.historyData)) {
      const records = this.historyData
        .map(r => ({ date: r.date, val: r.plans?.[this.activePlanKey] }))
        .filter(r => r.val != null && !isNaN(r.val));
      if (records.length >= 20) {
        const last20 = records.slice(-20);
        const sum = last20.reduce((acc, r) => acc + r.val, 0);
        const sma = sum / 20;
        const lastVal = last20[last20.length - 1].val;
        const diffPct = ((lastVal - sma) / sma) * 100;
        const above = lastVal >= sma;
        smaInfo = { sma, lastVal, diffPct, above };
      }
    }

    // 4. 52-Week Range, Drawdown from High, and Price Zone %
    let highVal = plan.ath?.nav || plan.latestNav;
    let lowVal = plan.atl?.nav || plan.latestNav;
    let drawdownPct = null;
    let zonePct = null;

    if (this.historyData && Array.isArray(this.historyData)) {
      const records = this.historyData
        .map(r => ({ date: r.date, val: r.plans?.[this.activePlanKey] }))
        .filter(r => r.val != null && !isNaN(r.val));
      if (records.length > 0) {
        const lastDate = records[records.length - 1].date;
        const cutoffDate = new Date(new Date(lastDate).getTime() - 365 * 86400000).toISOString().split('T')[0];
        const pastYear = records.filter(r => r.date >= cutoffDate);
        const vals = pastYear.map(r => r.val);
        if (vals.length > 0) {
          highVal = Math.max(...vals);
          lowVal = Math.min(...vals);
          const currentVal = vals[vals.length - 1];
          if (highVal > 0) {
            drawdownPct = ((currentVal - highVal) / highVal) * 100;
          }
          if (highVal > lowVal) {
            zonePct = ((currentVal - lowVal) / (highVal - lowVal)) * 100;
          } else {
            zonePct = 50;
          }
        }
      }
    } else if (plan.ath?.nav != null && plan.latestNav != null) {
      highVal = plan.ath.nav;
      lowVal = plan.atl?.nav ?? plan.latestNav;
      drawdownPct = ((plan.latestNav - highVal) / highVal) * 100;
      zonePct = highVal > lowVal ? ((plan.latestNav - lowVal) / (highVal - lowVal)) * 100 : 50;
    }

    // Drawdown badge logic
    let ddBadgeClass = 'badge-neutral';
    let ddSub = 'เทียบ High รอบปี';
    if (drawdownPct != null) {
      if (drawdownPct > -1) {
        ddBadgeClass = 'badge-danger';
        ddSub = '🚨 ระวังการย่อตัว';
      } else if (drawdownPct > -5) {
        ddBadgeClass = 'badge-neutral';
        ddSub = 'รอย่อตัวเพิ่ม';
      } else {
        ddBadgeClass = 'badge-success';
        ddSub = '🛒 ย่อตัวลึก ทยอยสะสม';
      }
    }

    // Price Zone badge logic
    let zoneBadgeClass = 'badge-neutral';
    let zoneSub = 'ตำแหน่งในกรอบปี';
    if (zonePct != null) {
      if (zonePct >= 80) {
        zoneBadgeClass = 'badge-danger';
        zoneSub = '🚨 โซนแพง ระวังจุดสูงสุด';
      } else if (zonePct >= 40) {
        zoneBadgeClass = 'badge-neutral';
        zoneSub = 'โซนกลางๆ';
      } else {
        zoneBadgeClass = 'badge-success';
        zoneSub = '🛒 โซนถูก น่าสะสม';
      }
    }

    // SMA20 badge logic
    let smaTitle = '—';
    let smaSub = 'ข้อมูลไม่พอ';
    let smaBadgeClass = 'badge-neutral';
    if (smaInfo) {
      if (Math.abs(smaInfo.diffPct) < 0.05) {
        smaTitle = '➖ ไซด์เวย์';
        smaSub = `ไม่มีเทรนด์ชัด (${smaInfo.diffPct >= 0 ? '+' : ''}${smaInfo.diffPct.toFixed(2)}%)`;
        smaBadgeClass = 'badge-neutral';
      } else {
        smaTitle = smaInfo.above ? '📈 ขาขึ้น' : '📉 ขาลง';
        smaSub = `NAV ${smaInfo.above ? '>' : '<'} SMA20 (${smaInfo.diffPct >= 0 ? '+' : ''}${smaInfo.diffPct.toFixed(2)}%)`;
        smaBadgeClass = smaInfo.above ? 'badge-success' : 'badge-danger';
      }
    }

    // 1Y Return: Handle null explicitly
    const oneYearVal = plan.returns?.['1Y'];
    const has1Y = oneYearVal != null && !isNaN(oneYearVal);
    const oneYearIsUp = has1Y && Number(oneYearVal) >= 0;
    const oneYearTrendClass = !has1Y ? 'trend-neutral' : (oneYearIsUp ? 'trend-up' : 'trend-down');
    const oneYearBadgeClass = !has1Y ? 'badge-neutral' : oneYearTrendClass;
    const oneYearBadgeText = !has1Y ? '-' : (oneYearIsUp ? '▲ บวกรอบปี' : '▼ ลบรอบปี');

    // CAGR (3Y / 5Y)
    const cagr3Y = plan.returns?.['3Y_annualized'];
    const cagr5Y = plan.returns?.['5Y_annualized'];
    const cum3Y = plan.returns?.['3Y_cumulative'];
    const cum5Y = plan.returns?.['5Y_cumulative'];

    // ATH / ATL
    const athNav = formatNav(plan.ath?.nav);
    const athDate = formatThaiDate(plan.ath?.date);
    const atlNav = formatNav(plan.atl?.nav);

    this.container.innerHTML = `
      <div class="terminal-hud-container terminal-ticker-bar animate-fade-in">
        <!-- โซน 1: Hero เด่นสุด (แผนที่เลือก + ราคา NAV ล่าสุด + % เปลี่ยนแปลง + วันที่) -->
        <div class="hud-zone hud-zone-hero">
          <div class="metric-card ticker-card card-latest-nav hero-card">
            <div class="hero-top-row">
              <div class="stat-label">
                <span class="plan-color-dot" style="background-color: ${plan.color}"></span>
                <span class="plan-key-text">${plan.key} (อ้างอิง)</span>
              </div>
              <div class="stat-date-badge card-date" title="วันทำการล่าสุด">
                <span class="date-val">${thaiDate}</span>
              </div>
            </div>
            <div class="hero-price-row">
              <div class="stat-val nav-value ${trendClass}">
                <span class="nav-number">${formatNav(plan.latestNav)}</span>
                <span class="nav-unit">฿</span>
              </div>
              <div class="stat-sub hero-change ${trendClass}">
                ${arrow} ${formatChange(plan.change)} (${formatPct(plan.changePct)})
              </div>
            </div>
          </div>
        </div>

        <!-- โซน 2: สถิติเทคนิค & แนวโน้ม (YTD, High/Low, ย่อตัว, โซนราคา, แนวโน้ม) -->
        <div class="hud-zone hud-zone-metrics">
          <!-- 5. YTD (ต้นปี) & อันดับ -->
          <div class="metric-card ticker-card card-ytd">
            <div class="stat-label">YTD (ผลตอบแทนปีนี้)</div>
            <div class="stat-val ${ytdTrendClass}">
              ${formatPct(ytdVal)}
            </div>
            <div class="stat-sub ${ytdBadgeClass}">
              ${ytdRank ? `อันดับ ${ytdRank}/${totalRanked} ใน 15 แผน` : (hasYtd ? ytdBadgeText : '-')}
            </div>
          </div>

          <!-- 6. High / Low ช่วงปี -->
          <div class="metric-card ticker-card card-range">
            <div class="stat-label">High / Low (ช่วงปี)</div>
            <div class="stat-val stat-val-dual">
              <span class="range-high">▲ ${formatNav(highVal)}</span>
              <span class="range-low">▼ ${formatNav(lowVal)}</span>
            </div>
            <div class="stat-sub">สถิติ 1 ปีย้อนหลัง</div>
          </div>

          <!-- 7. 📉 ย่อตัวจากจุดสูงสุด -->
          <div class="metric-card ticker-card card-drawdown">
            <div class="stat-label">📉 ย่อตัวจากจุดสูงสุด</div>
            <div class="stat-val ${drawdownPct != null && drawdownPct >= 0 ? 'trend-up' : 'trend-down'}">
              ${drawdownPct != null ? `${drawdownPct.toFixed(2)}%` : '-'}
            </div>
            <div class="stat-sub ${ddBadgeClass}">
              ${ddSub}
            </div>
          </div>

          <!-- 8. 🎯 ตำแหน่งราคา -->
          <div class="metric-card ticker-card card-zone">
            <div class="stat-label">🎯 ตำแหน่งราคา</div>
            <div class="stat-val">
              ${zonePct != null ? `${zonePct.toFixed(0)}%` : '-'}
            </div>
            <div class="stat-sub ${zoneBadgeClass}">
              ${zoneSub}
            </div>
          </div>

          <!-- 9. 🚀 แนวโน้มระยะสั้น (SMA20) -->
          <div class="metric-card ticker-card card-trend">
            <div class="stat-label">🚀 แนวโน้มระยะสั้น</div>
            <div class="stat-val">
              ${smaTitle}
            </div>
            <div class="stat-sub ${smaBadgeClass}">
              ${smaSub}
            </div>
          </div>
        </div>

        <!-- โซน 3: ภาพรวมตลาด & ระยะยาว (ดีสุด, แย่สุด, CAGR & ATH) -->
        <div class="hud-zone hud-zone-context">
          <!-- 3. ดีสุดวันนี้ -->
          <div class="metric-card ticker-card card-best">
            <div class="stat-label">ดีสุดวันนี้</div>
            <div class="stat-val text-truncate" title="${bestPlan?.name || '-'}">
              ${bestPlan?.name || '-'}
            </div>
            <div class="stat-sub trend-up">
              ${bestPlan?.changePct != null ? `+${Number(bestPlan.changePct).toFixed(2)}%` : '-'}
            </div>
          </div>

          <!-- 4. แย่สุดวันนี้ -->
          <div class="metric-card ticker-card card-worst">
            <div class="stat-label">แย่สุดวันนี้</div>
            <div class="stat-val text-truncate" title="${worstPlan?.name || '-'}">
              ${worstPlan?.name || '-'}
            </div>
            <div class="stat-sub trend-down">
              ${worstPlan?.changePct != null ? `${Number(worstPlan.changePct).toFixed(2)}%` : '-'}
            </div>
          </div>

          <!-- 10. ผลตอบแทนเฉลี่ยต่อปี (CAGR) & ATH -->
          <div class="metric-card ticker-card card-cagr-ath">
            <div class="stat-label">เฉลี่ยต่อปี (CAGR) & ATH</div>
            <div class="stat-val stat-val-dual">
              <span title="CAGR 3 ปี">3Y: ${cagr3Y != null ? formatPct(cagr3Y) : '-'}</span>
              <span title="CAGR 5 ปี">5Y: ${cagr5Y != null ? formatPct(cagr5Y) : '-'}</span>
            </div>
            <div class="stat-sub">
              ATH สูงสุด: ${athNav} ฿
            </div>
          </div>
        </div>
      </div>
    `;
  }
}

export function renderMetricCards(container, options) {
  return new MetricCards(container, options);
}

export default {
  MetricCards,
  renderMetricCards,
  formatThaiDate,
  formatNav,
  formatPct,
  formatChange,
};
