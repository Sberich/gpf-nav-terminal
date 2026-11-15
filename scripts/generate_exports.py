"""Export Generator for GPF NAV Dashboard.

Generates Excel (.xlsx) and CSV export files from public/data/nav_history.json
and public/data/nav_summary.json, sorted newest first with professional formatting.
"""

import argparse
import csv
import json
import os
import sys
from typing import Dict, List, Optional

try:
    import openpyxl
    from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
    from openpyxl.utils import get_column_letter
except ImportError:
    openpyxl = None

# Ensure scripts directory is on sys.path
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
if CURRENT_DIR not in sys.path:
    sys.path.insert(0, CURRENT_DIR)

from seed_history import TARGET_PLANS

DEFAULT_HISTORY_PATH = os.path.abspath(
    os.path.join(CURRENT_DIR, "..", "public", "data", "nav_history.json")
)
DEFAULT_SUMMARY_PATH = os.path.abspath(
    os.path.join(CURRENT_DIR, "..", "public", "data", "nav_summary.json")
)
DEFAULT_EXPORT_DIR = os.path.abspath(
    os.path.join(CURRENT_DIR, "..", "public", "export")
)
DEFAULT_CSV_EXPORT_PATH = os.path.join(DEFAULT_EXPORT_DIR, "gpf_nav_history.csv")
DEFAULT_XLSX_EXPORT_PATH = os.path.join(DEFAULT_EXPORT_DIR, "gpf_nav_history.xlsx")

CATEGORY_LABELS: Dict[str, str] = {
    "active": "เชิงรุก (Active)",
    "fixed_income": "ตราสารหนี้ (Fixed Income)",
    "equity": "ตราสารทุน (Equity)",
    "special": "ทางเลือกและเฉพาะทาง (Specialty)",
}

EXPORT_COLUMNS_SUMMARY: List[str] = [
    "แผนการลงทุน",
    "หมวดหมู่สินทรัพย์",
    "NAV ล่าสุด",
    "เปลี่ยนแปลง (฿)",
    "เปลี่ยนแปลง (%)",
    "1 เดือน (%)",
    "3 เดือน (%)",
    "6 เดือน (%)",
    "1 ปี (%)",
    "YTD (%)",
    "3 ปี (CAGR % ต่อปี)",
    "5 ปี (CAGR % ต่อปี)",
    "จุดสูงสุด (ATH)",
    "จุดต่ำสุด (ATL)",
]


def generate_csv(
    records: List[Dict],
    output_path: str = DEFAULT_CSV_EXPORT_PATH,
    target_plans: Optional[List[str]] = None,
) -> str:
    """Generate CSV file sorted newest first with UTF-8 BOM encoding for Excel compatibility."""
    if target_plans is None:
        target_plans = TARGET_PLANS

    os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)

    # Sort records newest first (reverse chronological)
    sorted_records = sorted(records, key=lambda r: r["date"], reverse=True)

    header = ["Date"] + target_plans

    with open(output_path, "w", encoding="utf-8-sig", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(header)

        for rec in sorted_records:
            date_str = rec["date"]
            plans_dict = rec.get("plans", {})
            row = [date_str]
            for plan in target_plans:
                val = plans_dict.get(plan)
                if val is not None and val != "":
                    try:
                        row.append(f"{float(val):.4f}")
                    except (ValueError, TypeError):
                        row.append(str(val))
                else:
                    row.append("")
            writer.writerow(row)

    return output_path


def generate_xlsx(
    records: List[Dict],
    summary: Dict,
    output_path: str = DEFAULT_XLSX_EXPORT_PATH,
    target_plans: Optional[List[str]] = None,
) -> str:
    """Generate professional Excel workbook with Summary sheet and Historical Data sheet."""
    if openpyxl is None:
        raise ImportError("openpyxl is required to generate Excel files. Install via 'pip install openpyxl'")

    if target_plans is None:
        target_plans = TARGET_PLANS

    os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)

    wb = openpyxl.Workbook()

    # Styling constants
    COLOR_HEADER_BG = "1A365D"  # Deep navy
    COLOR_HEADER_FG = "FFFFFF"  # White
    COLOR_ZEBRA_BG = "F7FAFC"   # Subtle off-white / light slate
    COLOR_BORDER = "E2E8F0"

    font_title = Font(name="Segoe UI", size=15, bold=True, color="1A365D")
    font_subtitle = Font(name="Segoe UI", size=9, italic=True, color="4A5568")
    font_header = Font(name="Segoe UI", size=10, bold=True, color=COLOR_HEADER_FG)
    font_body = Font(name="Segoe UI", size=10, color="1A202C")
    font_bold_body = Font(name="Segoe UI", size=10, bold=True, color="1A202C")

    fill_header = PatternFill(start_color=COLOR_HEADER_BG, end_color=COLOR_HEADER_BG, fill_type="solid")
    fill_zebra = PatternFill(start_color=COLOR_ZEBRA_BG, end_color=COLOR_ZEBRA_BG, fill_type="solid")
    fill_white = PatternFill(start_color="FFFFFF", end_color="FFFFFF", fill_type="solid")

    thin_border_side = Side(border_style="thin", color=COLOR_BORDER)
    border_cell = Border(
        left=thin_border_side,
        right=thin_border_side,
        top=thin_border_side,
        bottom=thin_border_side,
    )
    border_header = Border(
        left=Side(border_style="thin", color="CBD5E0"),
        right=Side(border_style="thin", color="CBD5E0"),
        top=Side(border_style="thin", color="CBD5E0"),
        bottom=Side(border_style="medium", color="CBD5E0"),
    )

    align_center = Alignment(horizontal="center", vertical="center", wrap_text=True)
    align_left = Alignment(horizontal="left", vertical="center")
    align_right = Alignment(horizontal="right", vertical="center")

    FORMAT_NAV = "#,##0.0000"
    FORMAT_CHANGE = "+#,##0.0000;-#,##0.0000;0.0000"
    FORMAT_PERCENT = "+0.00%;-0.00%;0.00%"

    # =========================================================================
    # Sheet 1: ภาพรวมและผลตอบแทน (Summary Sheet)
    # =========================================================================
    ws_summary = wb.active
    ws_summary.title = "ภาพรวมและผลตอบแทน"
    ws_summary.views.sheetView[0].showGridLines = True

    latest_date = summary.get("latestDate", "N/A")
    total_days = summary.get("totalTradingDays", len(records))
    updated_at = summary.get("updatedAt", "N/A")

    # Title block
    ws_summary.cell(
        row=1,
        column=1,
        value="ภาพรวมและผลตอบแทน แผนการลงทุน กบข. (GPF NAV Summary & Performance)",
    ).font = font_title
    ws_summary.row_dimensions[1].height = 28

    meta_text = f"ข้อมูล ณ วันที่: {latest_date}  |  จำนวนวันทำการ: {total_days:,} วัน  |  ปรับปรุงล่าสุด: {updated_at}"
    ws_summary.cell(row=2, column=1, value=meta_text).font = font_subtitle
    ws_summary.row_dimensions[2].height = 18

    # Blank row 3
    ws_summary.row_dimensions[3].height = 10

    # Header row 4
    header_row_idx = 4
    ws_summary.row_dimensions[header_row_idx].height = 30
    for col_idx, col_name in enumerate(EXPORT_COLUMNS_SUMMARY, start=1):
        c = ws_summary.cell(row=header_row_idx, column=col_idx, value=col_name)
        c.font = font_header
        c.fill = fill_header
        c.alignment = align_center
        c.border = border_header

    # Populate summary rows
    plans_dict = summary.get("plans", {})
    row_idx = header_row_idx + 1

    for plan in target_plans:
        p_data = plans_dict.get(plan, {})
        category_key = p_data.get("category", "")
        category_label = CATEGORY_LABELS.get(category_key, category_key)
        latest_nav = p_data.get("latestNav")
        change = p_data.get("change")
        change_pct = p_data.get("changePct")
        returns = p_data.get("returns", {})
        ath = p_data.get("ath", {})
        atl = p_data.get("atl", {})

        is_even = (row_idx - header_row_idx) % 2 == 0
        row_fill = fill_zebra if is_even else fill_white

        ws_summary.row_dimensions[row_idx].height = 22

        # 1. แผนการลงทุน
        c1 = ws_summary.cell(row=row_idx, column=1, value=plan)
        c1.font = font_bold_body
        c1.alignment = align_left

        # 2. หมวดหมู่สินทรัพย์
        c2 = ws_summary.cell(row=row_idx, column=2, value=category_label)
        c2.font = font_body
        c2.alignment = align_center

        # 3. NAV ล่าสุด
        c3 = ws_summary.cell(row=row_idx, column=3, value=float(latest_nav) if latest_nav is not None else None)
        c3.font = font_bold_body
        c3.alignment = align_right
        c3.number_format = FORMAT_NAV

        # 4. เปลี่ยนแปลง (฿)
        c4 = ws_summary.cell(row=row_idx, column=4, value=float(change) if change is not None else None)
        c4.font = font_body
        c4.alignment = align_right
        c4.number_format = FORMAT_CHANGE

        # Helper for percentage columns
        def set_pct_cell(col: int, val: Optional[float]):
            c = ws_summary.cell(row=row_idx, column=col)
            if val is not None:
                c.value = float(val) / 100.0
                c.number_format = FORMAT_PERCENT
            else:
                c.value = None
            c.font = font_body
            c.alignment = align_right
            c.fill = row_fill
            c.border = border_cell
            return c

        # 5. เปลี่ยนแปลง (%)
        set_pct_cell(5, change_pct)
        # 6. 1 เดือน (%)
        set_pct_cell(6, returns.get("1M"))
        # 7. 3 เดือน (%)
        set_pct_cell(7, returns.get("3M"))
        # 8. 6 เดือน (%)
        set_pct_cell(8, returns.get("6M"))
        # 9. 1 ปี (%)
        set_pct_cell(9, returns.get("1Y"))
        # 10. YTD (%)
        set_pct_cell(10, returns.get("YTD"))
        # 11. 3 ปี (CAGR % ต่อปี)
        set_pct_cell(11, returns.get("3Y_annualized"))
        # 12. 5 ปี (CAGR % ต่อปี)
        set_pct_cell(12, returns.get("5Y_annualized"))

        # 13. จุดสูงสุด (ATH)
        c13 = ws_summary.cell(
            row=row_idx, column=13, value=float(ath.get("nav")) if ath and ath.get("nav") is not None else None
        )
        c13.font = font_body
        c13.alignment = align_right
        c13.number_format = FORMAT_NAV

        # 14. จุดต่ำสุด (ATL)
        c14 = ws_summary.cell(
            row=row_idx, column=14, value=float(atl.get("nav")) if atl and atl.get("nav") is not None else None
        )
        c14.font = font_body
        c14.alignment = align_right
        c14.number_format = FORMAT_NAV

        # Apply fills and borders to non-pct cells
        for c in (c1, c2, c3, c4, c13, c14):
            c.fill = row_fill
            c.border = border_cell

        row_idx += 1

    # Freeze panes on summary sheet: freeze rows 1 to 4
    ws_summary.freeze_panes = "A5"

    # Auto-fit column widths for Summary Sheet
    for col in ws_summary.columns:
        col_letter = get_column_letter(col[0].column)
        max_len = 0
        # Only inspect from header row down to avoid title blowing out col 1
        for cell in col:
            if cell.row >= header_row_idx and cell.value is not None:
                val_str = str(cell.value)
                max_len = max(max_len, len(val_str))
        ws_summary.column_dimensions[col_letter].width = max(max_len + 4, 14)

    # =========================================================================
    # Sheet 2: ประวัติราคา NAV (Historical Data Sheet)
    # =========================================================================
    ws_history = wb.create_sheet(title="ประวัติราคา NAV")
    ws_history.views.sheetView[0].showGridLines = True

    hist_headers = ["Date"] + target_plans
    ws_history.row_dimensions[1].height = 28

    for col_idx, col_name in enumerate(hist_headers, start=1):
        c = ws_history.cell(row=1, column=col_idx, value=col_name)
        c.font = font_header
        c.fill = fill_header
        c.alignment = align_center
        c.border = border_header

    # Sort records newest first
    sorted_records = sorted(records, key=lambda r: r["date"], reverse=True)

    row_idx = 2
    for rec in sorted_records:
        date_str = rec["date"]
        p_dict = rec.get("plans", {})

        is_even = (row_idx % 2 == 0)
        row_fill = fill_zebra if is_even else fill_white
        ws_history.row_dimensions[row_idx].height = 20

        # Date column
        c_date = ws_history.cell(row=row_idx, column=1, value=date_str)
        c_date.font = font_body
        c_date.alignment = align_center
        c_date.fill = row_fill
        c_date.border = border_cell

        # Plan columns
        for col_idx, plan in enumerate(target_plans, start=2):
            val = p_dict.get(plan)
            c = ws_history.cell(row=row_idx, column=col_idx)
            if val is not None and val != "":
                try:
                    c.value = float(val)
                    c.number_format = FORMAT_NAV
                except (ValueError, TypeError):
                    c.value = str(val)
            else:
                c.value = None
            c.font = font_body
            c.alignment = align_right
            c.fill = row_fill
            c.border = border_cell

        row_idx += 1

    # Freeze panes on history sheet: freeze top row and Date column (B2)
    ws_history.freeze_panes = "B2"

    # Auto-fit column widths for History Sheet
    ws_history.column_dimensions["A"].width = 14
    for col_idx in range(2, len(hist_headers) + 1):
        col_letter = get_column_letter(col_idx)
        # Header length check
        header_len = len(hist_headers[col_idx - 1])
        ws_history.column_dimensions[col_letter].width = max(header_len + 3, 16)

    # Save workbook
    wb.save(output_path)

    # Re-read workbook to guarantee file validity
    wb_verify = openpyxl.load_workbook(output_path, read_only=True)
    wb_verify.close()

    return output_path


def generate_exports(
    history_path: str = DEFAULT_HISTORY_PATH,
    summary_path: str = DEFAULT_SUMMARY_PATH,
    export_dir: Optional[str] = None,
) -> Dict[str, str]:
    """Generate both CSV and XLSX exports from history and summary JSON files."""
    if not os.path.exists(history_path):
        raise FileNotFoundError(f"History file not found at: {history_path}")
    if not os.path.exists(summary_path):
        raise FileNotFoundError(f"Summary file not found at: {summary_path}")

    if export_dir is None:
        export_dir = os.path.abspath(os.path.join(os.path.dirname(history_path), "..", "export"))

    os.makedirs(export_dir, exist_ok=True)

    with open(history_path, "r", encoding="utf-8") as f:
        records = json.load(f)

    with open(summary_path, "r", encoding="utf-8") as f:
        summary = json.load(f)

    csv_path = os.path.join(export_dir, "gpf_nav_history.csv")
    xlsx_path = os.path.join(export_dir, "gpf_nav_history.xlsx")

    csv_res = generate_csv(records, csv_path)
    xlsx_res = generate_xlsx(records, summary, xlsx_path)

    return {
        "csv": csv_res,
        "xlsx": xlsx_res,
    }


def main():
    parser = argparse.ArgumentParser(description="GPF NAV Export Generator (CSV & Excel)")
    parser.add_argument("--history-file", default=DEFAULT_HISTORY_PATH, help="Path to nav_history.json")
    parser.add_argument("--summary-file", default=DEFAULT_SUMMARY_PATH, help="Path to nav_summary.json")
    parser.add_argument("--export-dir", default=DEFAULT_EXPORT_DIR, help="Export output directory")
    args = parser.parse_args()

    try:
        results = generate_exports(
            history_path=args.history_file,
            summary_path=args.summary_file,
            export_dir=args.export_dir,
        )
        print(f"Exports generated successfully:")
        print(f"  CSV:  {results['csv']} ({os.path.getsize(results['csv']):,} bytes)")
        print(f"  XLSX: {results['xlsx']} ({os.path.getsize(results['xlsx']):,} bytes)")
    except Exception as e:
        print(f"Error generating exports: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
