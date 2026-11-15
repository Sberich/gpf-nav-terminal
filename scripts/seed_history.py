"""Historical Data Seeder for GPF NAV Dashboard.

Fetches the complete historical NAV dataset from the upstream Google Sheet
NAVDash CSV export, normalizes dates to ISO YYYY-MM-DD, cleans numeric plan
values, and writes public/data/nav_history.json sorted chronologically.
"""

import csv
import io
import json
import os
import re
import sys
from typing import Dict, List, Optional
import urllib.request

try:
    import requests
except ImportError:
    requests = None

DEFAULT_CSV_URL = (
    "https://docs.google.com/spreadsheets/d/1HRDD4uzIiFlyKZ_kPMU2FLlR8uY7NCcWjhH7PYK2qWw/"
    "export?format=csv&gid=1097910969"
)

DEFAULT_OUTPUT_PATH = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "public", "data", "nav_history.json")
)

TARGET_PLANS: List[str] = [
    "แผนเชิงรุก 20",
    "แผนเชิงรุก 35",
    "แผนเชิงรุก 65",
    "แผนเชิงรุก 75",
    "แผนเงินฝากและตราสารหนี้ระยะสั้น",
    "แผนตราสารหนี้",
    "แผนตราสารหนี้ต่างประเทศ",
    "แผนหุ้นไทย",
    "แผนหุ้นต่างประเทศ",
    "แผนกองทุนอสังหาริมทรัพย์ไทย",
    "แผนทองคำ",
    "แผนกองทุนรวมวายุภักษ์",
    "แผนการลงทุนตามหลักชะรีอะฮ์",
    "แผนลงทุนพื้นฐานทั่วไป",
    "แผนเกษียณสบายใจ 2569",
]


def normalize_date(date_str: str) -> str:
    """Normalize date strings to standard ISO YYYY-MM-DD format.

    Handles:
    - DD/MM/YYYY or DD-MM-YYYY
    - YYYY-MM-DD or YYYY/MM/DD
    - Buddhist Era (>2400) by subtracting 543 years
    """
    if not date_str:
        raise ValueError("Empty date string")

    cleaned = date_str.strip()
    if not cleaned:
        raise ValueError("Empty date string after strip")

    # Pattern 1: YYYY-MM-DD or YYYY/MM/DD
    m_iso = re.match(r"^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$", cleaned)
    if m_iso:
        year = int(m_iso.group(1))
        month = int(m_iso.group(2))
        day = int(m_iso.group(3))
        if year > 2400:
            year -= 543
        return f"{year:04d}-{month:02d}-{day:02d}"

    # Pattern 2: DD/MM/YYYY or DD-MM-YYYY
    m_dmy = re.match(r"^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$", cleaned)
    if m_dmy:
        day = int(m_dmy.group(1))
        month = int(m_dmy.group(2))
        year = int(m_dmy.group(3))
        if year > 2400:
            year -= 543
        return f"{year:04d}-{month:02d}-{day:02d}"

    raise ValueError(f"Unrecognized date format: '{date_str}'")


def fetch_google_sheet_csv(url: str = DEFAULT_CSV_URL, timeout: int = 30) -> str:
    """Fetch raw CSV text from the specified Google Sheet export URL."""
    if requests is not None:
        response = requests.get(url, timeout=timeout)
        response.raise_for_status()
        response.encoding = "utf-8"
        return response.text
    else:
        req = urllib.request.Request(url, headers={"User-Agent": "GPF-NAV-Seeder/1.0"})
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return resp.read().decode("utf-8")


def parse_csv_content(csv_text: str) -> List[Dict]:
    """Parse CSV text, extract normalized dates and the 15 target plans.

    Returns a list of dicts: [ {"date": "YYYY-MM-DD", "plans": {plan: float | None}} ]
    sorted chronologically.
    """
    reader = csv.reader(io.StringIO(csv_text))
    rows = list(reader)
    if not rows:
        return []

    headers = [h.strip() for h in rows[0]]

    # Locate date column
    date_col_idx = -1
    for idx, h in enumerate(headers):
        if h.lower() == "date" or "วันที่" in h:
            date_col_idx = idx
            break
    if date_col_idx == -1:
        date_col_idx = 0  # Default to first column

    # Map target plans to column indices
    plan_col_indices: Dict[str, int] = {}
    for plan in TARGET_PLANS:
        for idx, h in enumerate(headers):
            if h == plan:
                plan_col_indices[plan] = idx
                break

    records: List[Dict] = []
    seen_dates = set()

    for row_idx, row in enumerate(rows[1:], start=2):
        if not row or not any(field.strip() for field in row):
            continue

        if date_col_idx >= len(row):
            continue

        raw_date = row[date_col_idx].strip()
        if not raw_date:
            continue

        try:
            norm_date = normalize_date(raw_date)
        except ValueError:
            # Skip invalid header/summary rows if any
            continue

        if norm_date in seen_dates:
            # Avoid duplicate dates
            continue
        seen_dates.add(norm_date)

        plans_dict: Dict[str, Optional[float]] = {}
        for plan in TARGET_PLANS:
            col_idx = plan_col_indices.get(plan)
            if col_idx is not None and col_idx < len(row):
                val_str = row[col_idx].strip().replace(",", "")
                if val_str == "" or val_str.lower() in ("nan", "null", "-", "n/a"):
                    plans_dict[plan] = None
                else:
                    try:
                        plans_dict[plan] = round(float(val_str), 4)
                    except ValueError:
                        plans_dict[plan] = None
            else:
                plans_dict[plan] = None

        records.append({"date": norm_date, "plans": plans_dict})

    # Sort strictly chronologically
    records.sort(key=lambda r: r["date"])
    return records


def seed_history(
    csv_url: str = DEFAULT_CSV_URL,
    output_path: str = DEFAULT_OUTPUT_PATH,
    csv_content: Optional[str] = None,
) -> List[Dict]:
    """Fetch CSV, parse into standard JSON structure, and write to output file."""
    if csv_content is None:
        print(f"Fetching CSV from: {csv_url}")
        csv_content = fetch_google_sheet_csv(csv_url)

    records = parse_csv_content(csv_content)

    os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(records, f, ensure_ascii=False, indent=2)

    print(
        f"Successfully seeded {len(records)} records into: {output_path} "
        f"({records[0]['date'] if records else 'N/A'} to {records[-1]['date'] if records else 'N/A'})"
    )
    return records


def main():
    try:
        records = seed_history()
        print(f"Total historical records: {len(records)}")
    except Exception as e:
        print(f"Error seeding historical data: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
