"""Automated Daily Ingestion Pipeline & Analytics Engine for GPF NAV Dashboard.

Fetches daily NAV updates from Google Sheet NAVDash CSV export, appends new
records without duplicating, computes financial analytics & period returns into
public/data/nav_summary.json, and generates synchronized multi-series chart data
into public/data/nav_chart.json.
"""

import argparse
import bisect
import datetime
import io
import json
import os
import sys
from typing import Dict, List, Optional, Tuple

# Ensure scripts directory is on sys.path
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
if CURRENT_DIR not in sys.path:
    sys.path.insert(0, CURRENT_DIR)

from seed_history import (
    DEFAULT_CSV_URL,
    TARGET_PLANS,
    fetch_google_sheet_csv,
    parse_csv_content,
)

DEFAULT_HISTORY_PATH = os.path.abspath(
    os.path.join(CURRENT_DIR, "..", "public", "data", "nav_history.json")
)
DEFAULT_SUMMARY_PATH = os.path.abspath(
    os.path.join(CURRENT_DIR, "..", "public", "data", "nav_summary.json")
)
DEFAULT_CHART_PATH = os.path.abspath(
    os.path.join(CURRENT_DIR, "..", "public", "data", "nav_chart.json")
)

PLAN_CATEGORIES: Dict[str, str] = {
    "แผนเชิงรุก 20": "active",
    "แผนเชิงรุก 35": "active",
    "แผนเชิงรุก 65": "active",
    "แผนเชิงรุก 75": "active",
    "แผนเงินฝากและตราสารหนี้ระยะสั้น": "fixed_income",
    "แผนตราสารหนี้": "fixed_income",
    "แผนตราสารหนี้ต่างประเทศ": "fixed_income",
    "แผนหุ้นไทย": "equity",
    "แผนหุ้นต่างประเทศ": "equity",
    "แผนกองทุนอสังหาริมทรัพย์ไทย": "equity",
    "แผนทองคำ": "special",
    "แผนกองทุนรวมวายุภักษ์": "special",
    "แผนการลงทุนตามหลักชะรีอะฮ์": "special",
    "แผนลงทุนพื้นฐานทั่วไป": "special",
    "แผนเกษียณสบายใจ 2569": "special",
}

PLAN_COLORS: Dict[str, str] = {
    "แผนเชิงรุก 20": "#00BCD4",
    "แผนเชิงรุก 35": "#2196F3",
    "แผนเชิงรุก 65": "#E91E63",
    "แผนเชิงรุก 75": "#8BC34A",
    "แผนเงินฝากและตราสารหนี้ระยะสั้น": "#607D8B",
    "แผนตราสารหนี้": "#FF9800",
    "แผนตราสารหนี้ต่างประเทศ": "#009688",
    "แผนหุ้นไทย": "#F44336",
    "แผนหุ้นต่างประเทศ": "#9C27B0",
    "แผนกองทุนอสังหาริมทรัพย์ไทย": "#FF5722",
    "แผนทองคำ": "#FFC107",
    "แผนกองทุนรวมวายุภักษ์": "#3F51B5",
    "แผนการลงทุนตามหลักชะรีอะฮ์": "#FF6F00",
    "แผนลงทุนพื้นฐานทั่วไป": "#4CAF50",
    "แผนเกษียณสบายใจ 2569": "#FF6F00",
}

LOOKBACK_DELTAS: Dict[str, int] = {
    "1M": 30,
    "3M": 91,
    "6M": 182,
    "1Y": 365,
    "3Y": 1095,
    "5Y": 1826,
}


def calculate_cagr(
    latest_nav: Optional[float], base_nav: Optional[float], years: float
) -> Optional[float]:
    """Calculate annualized Compound Annual Growth Rate (CAGR %) for n years.

    Formula: ((latest_nav / base_nav) ** (1.0 / years) - 1.0) * 100
    """
    if (
        latest_nav is None
        or base_nav is None
        or base_nav <= 0.0
        or latest_nav <= 0.0
        or years <= 0.0
    ):
        return None
    try:
        cagr = ((latest_nav / base_nav) ** (1.0 / years) - 1.0) * 100.0
        return round(cagr, 2)
    except (ZeroDivisionError, OverflowError, ValueError):
        return None


def find_baseline_record(
    records: List[Dict], target_date_str: str
) -> Optional[Dict]:
    """Find the latest trading day in records on or before target_date_str."""
    if not records:
        return None

    # Binary search since records is sorted chronologically by date
    dates = [r["date"] for r in records]
    idx = bisect.bisect_right(dates, target_date_str) - 1
    if idx < 0:
        return None
    return records[idx]


def calculate_returns(
    records: List[Dict], plan_name: str
) -> Dict[str, Optional[float]]:
    """Compute period returns (1D, 1M, 3M, 6M, 1Y, YTD, 3Y, 5Y, allTime).

    If the plan was not active on the baseline date, the return metric is None.
    """
    metrics: Dict[str, Optional[float]] = {
        "1D": None,
        "1M": None,
        "3M": None,
        "6M": None,
        "1Y": None,
        "YTD": None,
        "3Y_cumulative": None,
        "3Y_annualized": None,
        "5Y_cumulative": None,
        "5Y_annualized": None,
        "allTime": None,
    }

    if not records:
        return metrics

    latest_rec = records[-1]
    latest_nav = latest_rec["plans"].get(plan_name)
    if latest_nav is None or latest_nav <= 0.0:
        return metrics

    try:
        latest_date = datetime.date.fromisoformat(latest_rec["date"])
    except ValueError:
        return metrics

    # 1. 1D return (relative to immediately preceding trading day)
    if len(records) >= 2:
        prev_rec = records[-2]
        prev_nav = prev_rec["plans"].get(plan_name)
        if prev_nav is not None and prev_nav > 0.0:
            metrics["1D"] = round(((latest_nav - prev_nav) / prev_nav) * 100.0, 2)

    # 2. Lookback periods (1M, 3M, 6M, 1Y, 3Y, 5Y)
    for period, delta_days in LOOKBACK_DELTAS.items():
        target_dt = latest_date - datetime.timedelta(days=delta_days)
        base_rec = find_baseline_record(records, target_dt.isoformat())
        base_nav = base_rec["plans"].get(plan_name) if base_rec else None

        if base_nav is not None and base_nav > 0.0:
            cum_ret = round(((latest_nav - base_nav) / base_nav) * 100.0, 2)
            if period == "3Y":
                metrics["3Y_cumulative"] = cum_ret
                metrics["3Y_annualized"] = calculate_cagr(latest_nav, base_nav, 3.0)
            elif period == "5Y":
                metrics["5Y_cumulative"] = cum_ret
                metrics["5Y_annualized"] = calculate_cagr(latest_nav, base_nav, 5.0)
            else:
                metrics[period] = cum_ret

    # 3. YTD return (baseline is the last trading day of the previous calendar year)
    prev_year_end_str = f"{latest_date.year - 1}-12-31"
    ytd_base_rec = find_baseline_record(records, prev_year_end_str)
    ytd_base_nav = ytd_base_rec["plans"].get(plan_name) if ytd_base_rec else None
    if ytd_base_nav is not None and ytd_base_nav > 0.0:
        metrics["YTD"] = round(((latest_nav - ytd_base_nav) / ytd_base_nav) * 100.0, 2)

    # 4. allTime return (baseline is first non-null NAV in history)
    first_rec = next(
        (
            r
            for r in records
            if r["plans"].get(plan_name) is not None and r["plans"][plan_name] > 0.0
        ),
        None,
    )
    if first_rec is not None:
        first_nav = first_rec["plans"][plan_name]
        metrics["allTime"] = round(((latest_nav - first_nav) / first_nav) * 100.0, 2)

    return metrics


def generate_nav_summary(
    records: List[Dict], updated_at: Optional[str] = None
) -> Dict:
    """Generate financial analytics summary dictionary conforming to nav_summary.json schema."""
    if not records:
        return {
            "updatedAt": updated_at or datetime.datetime.now(datetime.timezone.utc).isoformat(),
            "latestDate": "",
            "totalTradingDays": 0,
            "plans": {},
        }

    latest_rec = records[-1]
    latest_date_str = latest_rec["date"]
    prev_rec = records[-2] if len(records) >= 2 else None

    plans_summary: Dict[str, Dict] = {}

    for plan in TARGET_PLANS:
        category = PLAN_CATEGORIES.get(plan, "special")
        color = PLAN_COLORS.get(plan, "#888888")

        latest_nav = latest_rec["plans"].get(plan)
        prev_nav = prev_rec["plans"].get(plan) if prev_rec else None

        change: Optional[float] = None
        change_pct: Optional[float] = None
        if latest_nav is not None and prev_nav is not None:
            change = round(latest_nav - prev_nav, 4)
            if prev_nav > 0.0:
                change_pct = round(((latest_nav - prev_nav) / prev_nav) * 100.0, 2)

        returns = calculate_returns(records, plan)

        # ATH / ATL calculations
        valid_items = [
            (r["date"], r["plans"][plan])
            for r in records
            if r["plans"].get(plan) is not None and r["plans"][plan] > 0.0
        ]

        if valid_items:
            max_date, max_nav = max(valid_items, key=lambda x: x[1])
            min_date, min_nav = min(valid_items, key=lambda x: x[1])
            ath = {"nav": round(float(max_nav), 4), "date": max_date}
            atl = {"nav": round(float(min_nav), 4), "date": min_date}
        else:
            ath = None
            atl = None

        plans_summary[plan] = {
            "key": plan,
            "category": category,
            "color": color,
            "latestNav": latest_nav,
            "prevNav": prev_nav,
            "change": change,
            "changePct": change_pct,
            "returns": returns,
            "ath": ath,
            "atl": atl,
        }

    return {
        "updatedAt": updated_at or datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "latestDate": latest_date_str,
        "totalTradingDays": len(records),
        "plans": plans_summary,
    }


def downsample_unified_indices(
    y_values: List[Optional[float]], threshold: int = 2000
) -> List[int]:
    """LTTB (Largest Triangle Three Buckets) downsampler returning sampled indices.

    Guarantees:
    - Exactly threshold points (if len >= threshold)
    - Always includes index 0 and index n - 1
    - Strictly increasing indices
    """
    n = len(y_values)
    if threshold >= n or threshold < 3:
        return list(range(n))

    sampled: List[int] = [0]
    bucket_size = (n - 2) / (threshold - 2)
    a = 0

    for i in range(threshold - 2):
        range_start = int((i + 1) * bucket_size) + 1
        range_end = min(int((i + 2) * bucket_size) + 1, n)

        avg_x = 0.0
        avg_y = 0.0
        cnt = range_end - range_start
        for j in range(range_start, range_end):
            avg_x += j
            avg_y += y_values[j] or 0.0
        if cnt > 0:
            avg_x /= cnt
            avg_y /= cnt

        bucket_start = int(i * bucket_size) + 1
        bucket_end = range_start

        max_area = -1.0
        max_idx = bucket_start

        y_a = y_values[a] or 0.0
        for j in range(bucket_start, bucket_end):
            y_j = y_values[j] or 0.0
            area = abs((a - avg_x) * (y_j - y_a) - (a - j) * (avg_y - y_a)) * 0.5
            if area > max_area:
                max_area = area
                max_idx = j

        sampled.append(max_idx)
        a = max_idx

    sampled.append(n - 1)
    return sampled


def generate_nav_chart(
    records: List[Dict], max_points: int = 2000
) -> Dict:
    """Generate synchronized multi-series chart dictionary where all plans share identical dates."""
    if not records:
        return {"dates": [], "series": [], "count": 0}

    # Use 'แผนลงทุนพื้นฐานทั่วไป' or first plan with complete data as reference for LTTB
    ref_plan = "แผนลงทุนพื้นฐานทั่วไป"
    ref_y = [r["plans"].get(ref_plan) for r in records]
    if any(v is None for v in ref_y):
        ref_plan = "แผนเชิงรุก 35"
        ref_y = [r["plans"].get(ref_plan) for r in records]

    sampled_indices = downsample_unified_indices(ref_y, threshold=max_points)

    dates = [records[i]["date"] for i in sampled_indices]
    series: List[Dict] = []

    for plan in TARGET_PLANS:
        data = [records[i]["plans"].get(plan) for i in sampled_indices]
        series.append({"name": plan, "data": data})

    return {
        "dates": dates,
        "series": series,
        "count": len(dates),
    }


def ingest_new_records(
    existing_records: List[Dict], csv_content: str
) -> Tuple[List[Dict], int]:
    """Parse upstream CSV and append only records with dates strictly newer than existing latest date."""
    parsed_records = parse_csv_content(csv_content)
    if not parsed_records:
        return existing_records, 0

    if not existing_records:
        return parsed_records, len(parsed_records)

    latest_existing_date = existing_records[-1]["date"]
    new_candidates = [r for r in parsed_records if r["date"] > latest_existing_date]

    if not new_candidates:
        return existing_records, 0

    updated = list(existing_records) + new_candidates
    updated.sort(key=lambda r: r["date"])
    return updated, len(new_candidates)


def update_nav(
    csv_url: str = DEFAULT_CSV_URL,
    csv_file: Optional[str] = None,
    history_path: str = DEFAULT_HISTORY_PATH,
    summary_path: str = DEFAULT_SUMMARY_PATH,
    chart_path: str = DEFAULT_CHART_PATH,
    max_chart_points: int = 2000,
    force: bool = False,
) -> Dict:
    """Run full ingestion, analytics, and chart synchronization pipeline."""
    # 1. Load existing history
    existing_records: List[Dict] = []
    if os.path.exists(history_path):
        with open(history_path, "r", encoding="utf-8") as f:
            try:
                existing_records = json.load(f)
            except Exception as e:
                print(f"Warning: Could not parse existing history file: {e}", file=sys.stderr)
                existing_records = []

    # 2. Fetch / Read upstream CSV
    if csv_file is not None:
        print(f"Reading upstream CSV from file: {csv_file}")
        with open(csv_file, "r", encoding="utf-8") as f:
            csv_content = f.read()
    else:
        print(f"Fetching upstream CSV from: {csv_url}")
        csv_content = fetch_google_sheet_csv(csv_url)

    # 3. Ingest and deduplicate
    updated_records, count_added = ingest_new_records(existing_records, csv_content)

    if count_added > 0:
        print(f"Ingested {count_added} new records (latest: {updated_records[-1]['date']}).")
        os.makedirs(os.path.dirname(os.path.abspath(history_path)), exist_ok=True)
        with open(history_path, "w", encoding="utf-8") as f:
            json.dump(updated_records, f, ensure_ascii=False, indent=2)
    else:
        latest_date = updated_records[-1]["date"] if updated_records else "N/A"
        print(f"NAV history is already up to date. Latest date: {latest_date}.")

    # Idempotency check: If no new data rows detected and not forced, skip overwriting files
    if count_added == 0 and not force and os.path.exists(summary_path):
        print("ℹ️ No new data rows detected. Files unchanged.")
        chart_count = 0
        if os.path.exists(chart_path):
            try:
                with open(chart_path, "r", encoding="utf-8") as f:
                    chart_count = json.load(f).get("count", 0)
            except Exception:
                pass
        return {
            "status": "success",
            "records_added": 0,
            "total_records": len(updated_records),
            "latest_date": updated_records[-1]["date"] if updated_records else None,
            "chart_points": chart_count,
        }

    # 4. Generate summary and chart JSON
    summary_data = generate_nav_summary(updated_records)
    os.makedirs(os.path.dirname(os.path.abspath(summary_path)), exist_ok=True)
    with open(summary_path, "w", encoding="utf-8") as f:
        json.dump(summary_data, f, ensure_ascii=False, indent=2)
    print(f"Successfully wrote NAV summary to: {summary_path}")

    chart_data = generate_nav_chart(updated_records, max_points=max_chart_points)
    os.makedirs(os.path.dirname(os.path.abspath(chart_path)), exist_ok=True)
    with open(chart_path, "w", encoding="utf-8") as f:
        json.dump(chart_data, f, ensure_ascii=False, indent=2)
    print(f"Successfully wrote NAV chart data ({chart_data['count']} points) to: {chart_path}")

    # 5. Optionally invoke export generator if available
    try:
        from generate_exports import generate_exports
        export_dir = os.path.abspath(os.path.join(os.path.dirname(history_path), "..", "export"))
        export_res = generate_exports(
            history_path=history_path, summary_path=summary_path, export_dir=export_dir
        )
        print(f"Successfully generated exports: CSV={export_res['csv']}, XLSX={export_res['xlsx']}")
    except ImportError:
        pass
    except Exception as e:
        print(f"Warning: Failed to generate exports: {e}", file=sys.stderr)

    return {
        "status": "success",
        "records_added": count_added,
        "total_records": len(updated_records),
        "latest_date": updated_records[-1]["date"] if updated_records else None,
        "chart_points": chart_data["count"],
    }


def main():
    parser = argparse.ArgumentParser(description="GPF NAV Ingestion & Analytics Engine")
    parser.add_argument("--csv-url", default=DEFAULT_CSV_URL, help="Upstream Google Sheet CSV URL")
    parser.add_argument("--csv-file", default=None, help="Local CSV file path (for testing/offline)")
    parser.add_argument("--history-file", default=DEFAULT_HISTORY_PATH, help="Path to nav_history.json")
    parser.add_argument("--summary-file", default=DEFAULT_SUMMARY_PATH, help="Path to nav_summary.json")
    parser.add_argument("--chart-file", default=DEFAULT_CHART_PATH, help="Path to nav_chart.json")
    parser.add_argument(
        "--max-chart-points", type=int, default=2000, help="Max points for synchronized chart"
    )
    parser.add_argument("--force", action="store_true", help="Force recalculation and export")
    args = parser.parse_args()

    try:
        res = update_nav(
            csv_url=args.csv_url,
            csv_file=args.csv_file,
            history_path=args.history_file,
            summary_path=args.summary_file,
            chart_path=args.chart_file,
            max_chart_points=args.max_chart_points,
            force=args.force,
        )
        print(f"Update completed successfully: {res}")
    except Exception as e:
        print(f"Error executing update_nav: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
