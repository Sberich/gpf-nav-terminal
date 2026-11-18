"""Data Parity Verification Script for GPF NAV Dashboard.

Verifies 100% parity between upstream Google Sheet CSV export and the
generated public/data/nav_history.json dataset. Compares every single date
and all 15 plan NAV values with floating-point tolerance (1e-4), validating
nulls and reporting any discrepancies.
"""

import argparse
from dataclasses import dataclass, field
import io
import json
import os
import sys
from typing import Dict, List, Optional
import urllib.request

try:
    import requests
except ImportError:
    requests = None

# Ensure scripts directory is on sys.path
SCRIPTS_DIR = os.path.dirname(os.path.abspath(__file__))
if SCRIPTS_DIR not in sys.path:
    sys.path.insert(0, SCRIPTS_DIR)

from seed_history import (
    DEFAULT_CSV_URL,
    DEFAULT_OUTPUT_PATH as DEFAULT_JSON_PATH,
    TARGET_PLANS,
    fetch_google_sheet_csv,
    normalize_date,
    parse_csv_content,
)


@dataclass
class ParityResult:
    """Result of data parity verification."""

    is_parity: bool
    rows_compared: int
    matching_fields: int
    total_fields: int
    discrepancies: List[str] = field(default_factory=list)
    summary: str = ""


def _compare_values(
    val1: Optional[float], val2: Optional[float], tolerance: float = 1e-4
) -> bool:
    """Compare two float / None values within numerical tolerance.
    Treats None, empty strings, and non-positive floats (<= 0.0) as unrecorded/None.
    """
    is_empty1 = val1 is None or (isinstance(val1, (int, float)) and val1 <= 0.0)
    is_empty2 = val2 is None or (isinstance(val2, (int, float)) and val2 <= 0.0)
    if is_empty1 and is_empty2:
        return True
    if is_empty1 or is_empty2:
        return False
    try:
        f1 = float(val1)
        f2 = float(val2)
        return abs(f1 - f2) < tolerance
    except (ValueError, TypeError):
        return False


def verify_parity(
    csv_content: str,
    json_records: List[Dict],
    tolerance: float = 1e-4,
    source_label: str = "CSV",
    target_label: str = "JSON",
) -> ParityResult:
    """Compare parsed CSV data against JSON records for 100% data parity.

    Args:
        csv_content: Raw CSV string.
        json_records: List of JSON records with format {"date": "...", "plans": {...}}.
        tolerance: Numerical tolerance for float comparison (default 1e-4).
        source_label: Label for the source dataset.
        target_label: Label for the target dataset.

    Returns:
        ParityResult with parity status, counts, discrepancies, and formatted summary.
    """
    csv_records = parse_csv_content(csv_content)

    discrepancies: List[str] = []

    # Map records by date
    csv_by_date: Dict[str, Dict[str, Optional[float]]] = {
        r["date"]: r.get("plans", {}) for r in csv_records
    }
    json_by_date: Dict[str, Dict[str, Optional[float]]] = {
        r["date"]: r.get("plans", {}) for r in json_records
    }

    csv_dates = set(csv_by_date.keys())
    json_dates = set(json_by_date.keys())
    max_csv_date = max(csv_dates) if csv_dates else ""
    newer_ahead_dates = sorted([d for d in (json_dates - csv_dates) if d > max_csv_date])
    historical_missing_in_csv = sorted([d for d in (json_dates - csv_dates) if d <= max_csv_date])

    # 1. Compare row counts (accounting for valid newer records ahead of Google Sheet CSV)
    if len(csv_records) + len(newer_ahead_dates) != len(json_records):
        discrepancies.append(
            f"Row count mismatch: {source_label} has {len(csv_records)} rows, "
            f"{target_label} has {len(json_records)} rows (expected {len(csv_records) + len(newer_ahead_dates)})."
        )

    # 2. Check for missing or extra dates
    missing_in_json = sorted(list(csv_dates - json_dates))
    if missing_in_json:
        for d in missing_in_json[:10]:
            discrepancies.append(f"Missing date {d} in {target_label} (present in {source_label})")
        if len(missing_in_json) > 10:
            discrepancies.append(f"... and {len(missing_in_json) - 10} more dates missing in {target_label}")

    if historical_missing_in_csv:
        for d in historical_missing_in_csv[:10]:
            discrepancies.append(f"Historical date {d} missing in {source_label} (present in {target_label})")
        if len(historical_missing_in_csv) > 10:
            discrepancies.append(f"... and {len(historical_missing_in_csv) - 10} more dates missing in {source_label}")

    if newer_ahead_dates:
        print(f"ℹ️ {target_label} contains {len(newer_ahead_dates)} newer dates ahead of {source_label}: {newer_ahead_dates} (ingested directly from official GPF API).")

    # 3. Check chronological ordering of JSON records
    json_date_list = [r["date"] for r in json_records]
    if json_date_list != sorted(json_date_list):
        discrepancies.append(f"{target_label} records are not sorted in strict chronological order.")

    # 4. Cell-by-cell comparison across common dates
    common_dates = sorted(list(csv_dates & json_dates))
    total_fields = 0
    matching_fields = 0

    for dt in common_dates:
        csv_plans = csv_by_date.get(dt, {})
        json_plans = json_by_date.get(dt, {})

        for plan in TARGET_PLANS:
            total_fields += 1
            csv_val = csv_plans.get(plan)
            json_val = json_plans.get(plan)

            if _compare_values(csv_val, json_val, tolerance=tolerance):
                matching_fields += 1
            else:
                diff_str = (
                    f"diff={abs(float(csv_val) - float(json_val)):.6f}"
                    if (csv_val is not None and json_val is not None)
                    else "one side is None"
                )
                discrepancies.append(
                    f"Discrepancy on {dt} for plan '{plan}': "
                    f"{source_label}={csv_val}, {target_label}={json_val} ({diff_str})"
                )

    rows_compared = len(common_dates)
    is_parity = (len(discrepancies) == 0) and (rows_compared == len(csv_records))

    # Construct summary
    summary_lines = [
        "=" * 64,
        "DATA PARITY VERIFICATION REPORT",
        "=" * 64,
        f"Rows compared: {rows_compared}",
        f"Plans checked per row: {len(TARGET_PLANS)}",
        f"Total fields checked: {total_fields}",
        f"Matching fields: {matching_fields} / {total_fields} "
        f"({(matching_fields / total_fields * 100.0) if total_fields else 0.0:.2f}%)",
        f"Discrepancies found: {len(discrepancies)}",
    ]

    if is_parity:
        summary_lines.append("")
        summary_lines.append(
            f"✅ 100% Parity Verified: {rows_compared} rows and {len(TARGET_PLANS)} plans match exactly."
        )
    else:
        summary_lines.append("")
        summary_lines.append(f"❌ Parity Check Failed: {len(discrepancies)} discrepancies found.")
        summary_lines.append("Discrepancy Details (first 20):")
        for d in discrepancies[:20]:
            summary_lines.append(f"  - {d}")
        if len(discrepancies) > 20:
            summary_lines.append(f"  ... and {len(discrepancies) - 20} more discrepancies.")

    summary_lines.append("=" * 64)
    summary = "\n".join(summary_lines)

    return ParityResult(
        is_parity=is_parity,
        rows_compared=rows_compared,
        matching_fields=matching_fields,
        total_fields=total_fields,
        discrepancies=discrepancies,
        summary=summary,
    )


def verify_parity_files(
    csv_path: Optional[str] = None,
    csv_url: Optional[str] = None,
    json_path: str = DEFAULT_JSON_PATH,
    tolerance: float = 1e-4,
) -> ParityResult:
    """Run parity verification by loading files or fetching live CSV."""
    if csv_path:
        source_label = f"CSV File ({os.path.basename(csv_path)})"
        with open(csv_path, "r", encoding="utf-8") as f:
            csv_content = f.read()
    else:
        url = csv_url or DEFAULT_CSV_URL
        source_label = f"Google Sheet CSV ({url})"
        csv_content = fetch_google_sheet_csv(url)

    if not os.path.exists(json_path):
        raise FileNotFoundError(f"Target JSON file not found: {json_path}")

    target_label = f"JSON File ({os.path.basename(json_path)})"
    with open(json_path, "r", encoding="utf-8") as f:
        json_records = json.load(f)

    return verify_parity(
        csv_content=csv_content,
        json_records=json_records,
        tolerance=tolerance,
        source_label=source_label,
        target_label=target_label,
    )


def main() -> int:
    """CLI entrypoint for parity verification."""
    parser = argparse.ArgumentParser(
        description="Verify parity between Google Sheet CSV export and public/data/nav_history.json"
    )
    parser.add_argument(
        "--csv-file",
        type=str,
        default=None,
        help="Path to local CSV file. If omitted, downloads from Google Sheet URL.",
    )
    parser.add_argument(
        "--csv-url",
        type=str,
        default=DEFAULT_CSV_URL,
        help=f"Google Sheet CSV export URL (default: {DEFAULT_CSV_URL})",
    )
    parser.add_argument(
        "--json-file",
        type=str,
        default=DEFAULT_JSON_PATH,
        help=f"Path to nav_history.json (default: {DEFAULT_JSON_PATH})",
    )
    parser.add_argument(
        "--tolerance",
        type=float,
        default=1e-4,
        help="Tolerance for floating point comparisons (default: 1e-4)",
    )

    args = parser.parse_args()

    print("Starting Data Parity Verification...")
    print(f"JSON Target: {args.json_file}")
    if args.csv_file:
        print(f"CSV Source: Local file -> {args.csv_file}")
    else:
        print(f"CSV Source: Live URL -> {args.csv_url}")
    print(f"Tolerance: {args.tolerance}")
    print()

    try:
        result = verify_parity_files(
            csv_path=args.csv_file,
            csv_url=args.csv_url,
            json_path=args.json_file,
            tolerance=args.tolerance,
        )
        print(result.summary)
        return 0 if result.is_parity else 1
    except Exception as e:
        print(f"❌ Error during parity verification: {e}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    sys.exit(main())
