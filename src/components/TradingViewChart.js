/**
 * TradingView Lightweight Charts Integration Component
 * Provides high-performance Canvas-based financial charting for GPF NAV data
 */
import {
  createChart,
  AreaSeries,
  LineSeries,
  createSeriesMarkers,
  ColorType,
  LineStyle,
  CrosshairMode
} from 'lightweight-charts';
import {
  getPlanColor,
  parseDateUTC,
  calculateCutoffDate,
  formatISODate,
  THAI_MONTHS_SHORT
} from './ChartView.js';

export class TradingViewChart {
  constructor(container, options = {}) {
    this.container = typeof container === 'string'
      ? (typeof document !== 'undefined' ? document.querySelector(container) : null)
      : container;

    this.options = options;
    this.chart = null;
    this.primarySeries = null;
    this.secondarySeriesList = [];
    this.markersPrimitive = null;
    this.priceLines = [];
    this.legendEl = null;
    this.wrapperEl = null;
    this.renderEl = null;

    this.currentTheme = options.theme || 'dark';
    this.currentMode = options.mode || 'nav';
    this.currentTimeframe = options.timeframe || '1Y';
    this.primaryPlan = options.primaryPlan || 'แผนเชิงรุก 35';
    this.activePlans = new Set(options.activePlans || ['แผนเชิงรุก 35']);
    this.showSignals = options.showSignals !== false;

    this._lastClickTime = 0;
    this._onChartClick = this._onChartClick.bind(this);
    this._onCrosshairMove = this._onCrosshairMove.bind(this);
  }

  /**
   * Mount TradingView chart instance into DOM
   */
  mount() {
    if (!this.container || typeof document === 'undefined') return;

    // Build DOM container structure
    this.container.innerHTML = `
      <div class="tv-wrapper" style="position: relative; width: 100%; height: 100%; min-height: 480px;">
        <div class="tv-legend" style="
          position: absolute;
          top: 12px;
          left: 16px;
          z-index: 10;
          pointer-events: none;
          font-family: 'Sarabun', sans-serif;
          font-size: 12px;
          line-height: 1.5;
          display: flex;
          flex-direction: column;
          gap: 2px;
          background: rgba(17, 24, 39, 0.75);
          backdrop-filter: blur(4px);
          padding: 6px 10px;
          border-radius: 6px;
          border: 1px solid rgba(255, 255, 255, 0.08);
        "></div>
        <div class="tv-watermark" style="
          position: absolute;
          bottom: 30px;
          left: 16px;
          z-index: 5;
          pointer-events: none;
          font-family: 'Sarabun', sans-serif;
          font-size: 11px;
          font-weight: 600;
          color: rgba(156, 163, 175, 0.35);
          letter-spacing: 0.5px;
        ">TradingView · Lightweight Charts</div>
        <div class="tv-render-canvas" style="width: 100%; height: 100%; min-height: 480px;"></div>
      </div>
    `;

    this.wrapperEl = this.container.querySelector('.tv-wrapper');
    this.legendEl = this.container.querySelector('.tv-legend');
    this.renderEl = this.container.querySelector('.tv-render-canvas');

    const isDark = this.currentTheme === 'dark';
    const bg = isDark ? '#111827' : '#ffffff';
    const textColor = isDark ? '#9ca3af' : '#4b5563';
    const gridColor = isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.04)';
    const borderColor = isDark ? '#1f293d' : '#e5e7eb';

    this.chart = createChart(this.renderEl, {
      autoSize: true,
      layout: {
        background: { type: ColorType.Solid, color: bg },
        textColor: textColor,
        fontFamily: "'Sarabun', sans-serif"
      },
      grid: {
        vertLines: { color: gridColor },
        horzLines: { color: gridColor }
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: {
          color: isDark ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.25)',
          width: 1,
          style: LineStyle.Dashed
        },
        horzLine: {
          color: isDark ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.25)',
          width: 1,
          style: LineStyle.Dashed
        }
      },
      rightPriceScale: {
        borderColor: borderColor,
        scaleMargins: {
          top: 0.1,
          bottom: 0.1
        }
      },
      timeScale: {
        borderColor: borderColor,
        timeVisible: true,
        secondsVisible: false,
        fixLeftEdge: false,
        fixRightEdge: false
      },
      localization: {
        locale: 'th-TH',
        dateFormat: 'dd MMM yyyy'
      }
    });

    this.chart.subscribeCrosshairMove(this._onCrosshairMove);
    this.chart.subscribeClick(this._onChartClick);
  }

  /**
   * Set and update chart datasets, series and indicators
   */
  updateData({
    chartData,
    historyData,
    summaryData,
    activePlans,
    primaryPlan,
    mode = 'nav',
    timeframe = '1Y',
    theme = 'dark',
    showSignals = true,
    analysis = null,
    pins = []
  }) {
    if (!this.chart || !chartData || !chartData.series || !chartData.dates) return;

    this.currentMode = mode;
    this.currentTimeframe = timeframe;
    this.currentTheme = theme;
    this.primaryPlan = primaryPlan || this.primaryPlan;
    this.activePlans = activePlans ? new Set(activePlans) : this.activePlans;
    this.showSignals = showSignals;
    this.cachedAnalysis = analysis;
    this.cachedPins = pins;
    this.chartData = chartData;
    this.summaryData = summaryData;

    // Remove previous series if any
    if (this.primarySeries) {
      try { this.chart.removeSeries(this.primarySeries); } catch (e) {}
      this.primarySeries = null;
    }
    for (const sec of this.secondarySeriesList) {
      try { this.chart.removeSeries(sec); } catch (e) {}
    }
    this.secondarySeriesList = [];
    this.markersPrimitive = null;
    this.priceLines = [];

    // 1. Prepare Primary Plan Series Data
    const primarySeriesInfo = chartData.series.find(s => s.name === this.primaryPlan);
    if (!primarySeriesInfo || !primarySeriesInfo.data) return;

    const primaryColor = getPlanColor(this.primaryPlan, summaryData);
    const isPct = mode === 'pct';

    // Build raw data points
    const rawPoints = [];
    for (let i = 0; i < chartData.dates.length; i++) {
      const val = primarySeriesInfo.data[i];
      if (val !== null && val !== undefined && val > 0) {
        rawPoints.push({
          time: chartData.dates[i],
          val: Number(val)
        });
      }
    }

    if (rawPoints.length === 0) return;

    // Filter to selected timeframe if needed, or get base for pct calculation
    let refDate = rawPoints[rawPoints.length - 1].time;
    const cutoff = calculateCutoffDate(this.currentTimeframe, parseDateUTC(refDate));
    const cutoffStr = cutoff ? formatISODate(cutoff) : null;

    let baseVal = rawPoints[0].val;
    if (isPct && cutoffStr) {
      const match = rawPoints.find(p => p.time >= cutoffStr);
      if (match) baseVal = match.val;
    }

    const primaryData = rawPoints.map(p => ({
      time: p.time,
      value: isPct ? Number((((p.val - baseVal) / baseVal) * 100).toFixed(4)) : Number(p.val.toFixed(4))
    }));

    // Add Primary Series as AreaSeries
    this.primarySeries = this.chart.addSeries(AreaSeries, {
      topColor: this._hexToRgba(primaryColor, 0.32),
      bottomColor: this._hexToRgba(primaryColor, 0.01),
      lineColor: primaryColor,
      lineWidth: 2,
      priceFormat: {
        type: isPct ? 'percent' : 'price',
        precision: isPct ? 2 : 4,
        minMove: isPct ? 0.01 : 0.0001
      }
    });
    this.primarySeries.setData(primaryData);

    // 2. Add Secondary Active Plans (if selected in Watchlist)
    const activeList = Array.from(this.activePlans).filter(p => p !== this.primaryPlan);
    for (const planName of activeList) {
      const sInfo = chartData.series.find(s => s.name === planName);
      if (!sInfo || !sInfo.data) continue;

      const planColor = getPlanColor(planName, summaryData);
      const secPoints = [];
      for (let i = 0; i < chartData.dates.length; i++) {
        const val = sInfo.data[i];
        if (val !== null && val !== undefined && val > 0) {
          secPoints.push({ time: chartData.dates[i], val: Number(val) });
        }
      }
      if (secPoints.length === 0) continue;

      let secBase = secPoints[0].val;
      if (isPct && cutoffStr) {
        const match = secPoints.find(p => p.time >= cutoffStr);
        if (match) secBase = match.val;
      }

      const secData = secPoints.map(p => ({
        time: p.time,
        value: isPct ? Number((((p.val - secBase) / secBase) * 100).toFixed(4)) : Number(p.val.toFixed(4))
      }));

      const secSeries = this.chart.addSeries(LineSeries, {
        color: planColor,
        lineWidth: 2,
        lineStyle: LineStyle.Solid,
        priceFormat: {
          type: isPct ? 'percent' : 'price',
          precision: isPct ? 2 : 4,
          minMove: isPct ? 0.01 : 0.0001
        }
      });
      secSeries.setData(secData);
      this.secondarySeriesList.push(secSeries);
    }

    // 3. Add Tactical Signal Markers (Overlay)
    if (this.showSignals && analysis && analysis.crosses && analysis.crosses.length > 0 && !analysis.isLowVol) {
      const markers = [];
      const crossDates = new Set(primaryData.map(d => d.time));

      for (const cross of analysis.crosses) {
        if (!crossDates.has(cross.date)) continue;
        const isGolden = cross.type === 'golden';
        markers.push({
          time: cross.date,
          position: isGolden ? 'belowBar' : 'aboveBar',
          color: isGolden ? '#10B981' : '#EF4444',
          shape: isGolden ? 'arrowUp' : 'arrowDown',
          text: isGolden ? 'ซื้อ' : 'ขาย',
          size: 1.2
        });
      }

      markers.sort((a, b) => (a.time > b.time ? 1 : -1));
      if (markers.length > 0) {
        try {
          this.markersPrimitive = createSeriesMarkers(this.primarySeries, markers);
        } catch (err) {
          console.warn('[TradingViewChart] Markers create error:', err);
        }
      }
    }

    // 4. Add Price Pins (only in 'nav' mode)
    if (!isPct && pins && pins.length > 0) {
      for (const pin of pins) {
        if (pin.plan === this.primaryPlan && pin.value > 0) {
          const pLine = this.primarySeries.createPriceLine({
            price: pin.value,
            color: primaryColor,
            lineWidth: 1,
            lineStyle: LineStyle.Dashed,
            axisLabelVisible: true,
            title: `📌 ${pin.value.toFixed(4)}`
          });
          this.priceLines.push(pLine);
        }
      }
    }

    // 5. Set Timeframe Visible Range
    this.applyTimeframeRange(timeframe, cutoffStr, refDate);

    // 6. Update Floating Legend to default latest state
    const latestItem = primaryData[primaryData.length - 1];
    this.updateLegend(latestItem ? latestItem.time : null, latestItem ? latestItem.value : null);
  }

  /**
   * Apply timeframe visible range on TradingView time scale
   */
  applyTimeframeRange(timeframe, cutoffStr = null, refDate = null) {
    if (!this.chart) return;
    const timeScale = this.chart.timeScale();

    if (timeframe === 'ALL' || !cutoffStr) {
      timeScale.fitContent();
      return;
    }

    const latest = refDate || (this.chartData?.dates ? this.chartData.dates[this.chartData.dates.length - 1] : null);
    if (cutoffStr && latest) {
      try {
        timeScale.setVisibleRange({
          from: cutoffStr,
          to: latest
        });
      } catch (e) {
        timeScale.fitContent();
      }
    } else {
      timeScale.fitContent();
    }
  }

  /**
   * Crosshair move handler to update floating legend
   */
  _onCrosshairMove(param) {
    if (!this.legendEl) return;

    if (!param || !param.time || !param.seriesData || !this.primarySeries) {
      // Revert to latest data point
      if (this.chartData && this.chartData.dates) {
        const lastDate = this.chartData.dates[this.chartData.dates.length - 1];
        const pSeries = this.chartData.series?.find(s => s.name === this.primaryPlan);
        const lastVal = pSeries?.data?.[pSeries.data.length - 1];
        this.updateLegend(lastDate, lastVal);
      }
      return;
    }

    const data = param.seriesData.get(this.primarySeries);
    const dateStr = typeof param.time === 'string' ? param.time : null;
    const val = data?.value ?? null;
    this.updateLegend(dateStr, val);
  }

  /**
   * Format and render floating legend overlay
   */
  updateLegend(dateStr, val) {
    if (!this.legendEl) return;
    const primaryColor = getPlanColor(this.primaryPlan, this.summaryData);
    const isPct = this.currentMode === 'pct';

    let dateFormatted = '';
    if (dateStr) {
      const d = parseDateUTC(dateStr);
      if (!isNaN(d.getTime())) {
        const day = d.getUTCDate();
        const m = THAI_MONTHS_SHORT[d.getUTCMonth()];
        const y = (d.getUTCFullYear() + 543) % 100;
        dateFormatted = `${day} ${m} ${y}`;
      }
    }

    let valFormatted = '-';
    if (val !== null && val !== undefined) {
      valFormatted = isPct
        ? `${val >= 0 ? '+' : ''}${val.toFixed(2)}%`
        : `${val.toFixed(4)} ฿`;
    }

    // Check if this date had a tactical cross
    let crossBadge = '';
    if (this.cachedAnalysis?.crosses && dateStr) {
      const c = this.cachedAnalysis.crosses.find(x => x.date === dateStr);
      if (c) {
        const isGolden = c.type === 'golden';
        crossBadge = `<span style="
          margin-left: 6px;
          padding: 1px 6px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 600;
          background: ${isGolden ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'};
          color: ${isGolden ? '#10B981' : '#EF4444'};
          border: 1px solid ${isGolden ? '#10B981' : '#EF4444'};
        ">${isGolden ? '🟢 Golden Cross (ซื้อ)' : '🔴 Dead Cross (ขาย)'}</span>`;
      }
    }

    this.legendEl.innerHTML = `
      <div style="display: flex; align-items: center; gap: 6px;">
        <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: ${primaryColor};"></span>
        <strong style="color: #ffffff;">${this.primaryPlan}</strong>
        ${crossBadge}
      </div>
      <div style="color: var(--terminal-muted, #9ca3af); font-size: 11px;">
        ราคา: <strong style="color: ${primaryColor}; font-size: 13px;">${valFormatted}</strong>
        ${dateFormatted ? ` · วันที่: <span>${dateFormatted}</span>` : ''}
      </div>
    `;
  }

  /**
   * Handle double-click pin placement on chart
   */
  _onChartClick(param) {
    if (!param || !param.point || !this.primarySeries || this.currentMode === 'pct') return;

    const now = Date.now();
    const isDblClick = (now - this._lastClickTime) < 350;
    this._lastClickTime = now;

    if (isDblClick) {
      const price = this.primarySeries.coordinateToPrice(param.point.y);
      if (price !== null && !isNaN(price) && price > 0 && typeof this.options.onDoubleTapPin === 'function') {
        this.options.onDoubleTapPin(this.primaryPlan, Number(price.toFixed(4)));
      }
    }
  }

  /**
   * Update theme styling
   */
  setTheme(themeMode) {
    if (!this.chart || this.currentTheme === themeMode) return;
    this.currentTheme = themeMode;

    const isDark = themeMode === 'dark';
    const bg = isDark ? '#111827' : '#ffffff';
    const textColor = isDark ? '#9ca3af' : '#4b5563';
    const gridColor = isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.04)';
    const borderColor = isDark ? '#1f293d' : '#e5e7eb';

    this.chart.applyOptions({
      layout: {
        background: { type: ColorType.Solid, color: bg },
        textColor: textColor
      },
      grid: {
        vertLines: { color: gridColor },
        horzLines: { color: gridColor }
      },
      rightPriceScale: {
        borderColor: borderColor
      },
      timeScale: {
        borderColor: borderColor
      }
    });

    if (this.legendEl) {
      this.legendEl.style.background = isDark ? 'rgba(17, 24, 39, 0.8)' : 'rgba(255, 255, 255, 0.85)';
      this.legendEl.style.borderColor = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)';
    }
  }

  /**
   * Resize chart to specific dimensions
   */
  resize(width, height) {
    if (this.chart && width > 0 && height > 0) {
      this.chart.applyOptions({ width, height });
    }
  }

  /**
   * Helper to convert HEX color to RGBA
   */
  _hexToRgba(hex, alpha = 1) {
    if (!hex || typeof hex !== 'string') return `rgba(59, 130, 246, ${alpha})`;
    const clean = hex.replace('#', '');
    const bigint = parseInt(clean, 16);
    if (isNaN(bigint)) return `rgba(59, 130, 246, ${alpha})`;
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  /**
   * Destroy and clean up chart
   */
  destroy() {
    if (this.chart) {
      try {
        this.chart.unsubscribeCrosshairMove(this._onCrosshairMove);
        this.chart.unsubscribeClick(this._onChartClick);
        this.chart.remove();
      } catch (err) {}
      this.chart = null;
    }
    if (this.container) {
      this.container.innerHTML = '';
    }
  }
}

export default TradingViewChart;
