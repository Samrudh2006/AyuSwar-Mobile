#!/usr/bin/env python3
"""
AyuSwar AI - PMBJP official product-list fetcher.

Queries the live PMBI (Pharmaceuticals & Medical Devices Bureau of India)
product search at https://www.pmbi.co.in/ProductList.aspx for the salts that
appear in the app's demonstration formulary (src/data/pmbjpFormulary.js),
and writes the matched official entries to src/data/pmbjpOfficialProducts.js
with source provenance (page URL + fetch date).

Standard library only. Read-only against the PMBI site: one GET to establish
the ASP.NET session, then one search POST per salt. Please re-run sparingly;
this is a government site, so requests are spaced.

The output is product identity + MRP reference data only. It is NOT medical,
dosage, or substitution guidance, and the app must present it that way.
"""

import html
import json
import re
import sys
import time
import urllib.parse
import urllib.request
from http.cookiejar import CookieJar

SOURCE_URL = "https://www.pmbi.co.in/ProductList.aspx"
REQUEST_GAP_SECONDS = 0.6
TIMEOUT_SECONDS = 60

# formularyId -> query spec.
#   term:     primary salt as PMBI indexes it (aliases tried in order)
#   strength: expected strength number, matched with a unit word boundary
#   combo:    True when the formulary entry is itself a fixed-dose
#             combination, so multi-salt official products are acceptable
FORMULARY_QUERIES = {
    "pmbjp-cv-001": {"term": "Telmisartan", "strength": "40", "combo": False},
    "pmbjp-cv-002": {"term": "Amlodipine", "strength": "5", "combo": False},
    "pmbjp-cv-003": {"term": "Atorvastatin", "strength": "10", "combo": False},
    "pmbjp-cv-004": {"term": "Rosuvastatin", "strength": "10", "combo": False},
    "pmbjp-cv-005": {"term": "Clopidogrel", "strength": "75", "combo": False},
    "pmbjp-cv-006": {"term": "Aspirin", "strength": "75", "combo": False},
    "pmbjp-cv-007": {"term": "Enalapril", "strength": "5", "combo": False},
    "pmbjp-cv-008": {"term": "Metoprolol", "strength": "25", "combo": False},
    "pmbjp-db-001": {"term": "Metformin", "strength": "500", "combo": False},
    "pmbjp-db-002": {"term": "Glimepiride", "strength": "1", "combo": False},
    "pmbjp-db-003": {"term": "Glimepiride", "strength": "2", "combo": True},
    "pmbjp-db-004": {"term": "Vildagliptin", "strength": "50", "combo": False},
    "pmbjp-db-005": {"term": "Dapagliflozin", "strength": "10", "combo": False},
    "pmbjp-rs-001": {"term": "Budesonide", "strength": "200", "combo": False},
    "pmbjp-rs-002": {"term": "Salbutamol", "strength": "100", "combo": False, "form": "inhal"},
    "pmbjp-rs-003": {"term": "Montelukast", "strength": "10", "combo": True},
    "pmbjp-rs-004": {"term": "Acebrophylline", "strength": "100", "combo": False},
    "pmbjp-gi-001": {"term": "Pantoprazole", "strength": "40", "combo": False},
    "pmbjp-gi-002": {"term": "Pantoprazole", "strength": "40", "combo": True},
    "pmbjp-gi-003": {"term": "Omeprazole", "strength": "20", "combo": False},
    "pmbjp-gi-004": {"term": "Oral Rehydration", "strength": None, "combo": False},
    "pmbjp-gi-005": {"term": "Ondansetron", "strength": "4", "combo": False},
    "pmbjp-an-001": {"term": "Paracetamol", "strength": "650", "combo": False},
    "pmbjp-an-002": {"term": "Paracetamol", "strength": "500", "combo": False},
    "pmbjp-an-003": {"term": "Aceclofenac", "strength": "100", "combo": True},
    "pmbjp-an-004": {"term": "Ibuprofen", "strength": "400", "combo": False},
    "pmbjp-am-001": {"term": "Amoxicillin", "aliases": ["Amoxycillin"], "strength": "500", "combo": True},
    "pmbjp-am-002": {"term": "Azithromycin", "strength": "500", "combo": False},
    "pmbjp-am-003": {"term": "Cefixime", "strength": "200", "combo": False},
    "pmbjp-am-004": {"term": "Ciprofloxacin", "strength": "500", "combo": False},
    "pmbjp-am-005": {"term": "Metronidazole", "strength": "400", "combo": False},
    "pmbjp-ah-001": {"term": "Cetirizine", "strength": "10", "combo": False},
    "pmbjp-ah-002": {"term": "Levocetirizine", "strength": "5", "combo": False},
    "pmbjp-nu-001": {"term": "Ferrous Ascorbate", "strength": None, "combo": True},
    "pmbjp-nu-002": {"term": "Calcium Carbonate", "strength": "500", "combo": True},
    "pmbjp-nu-003": {"term": "Vitamin B-Complex", "strength": None, "combo": True},
    "pmbjp-nu-004": {"term": "Cholecalciferol", "strength": "60000", "combo": False},
    "pmbjp-en-001": {"term": "Levothyroxine", "aliases": ["Thyroxine"], "strength": "50", "combo": False},
    "pmbjp-en-002": {"term": "Levothyroxine", "aliases": ["Thyroxine"], "strength": "100", "combo": False},
}


def _open(opener, request):
    with opener.open(request, timeout=TIMEOUT_SECONDS) as resp:
        return resp.read().decode("utf-8", errors="replace")


def _hidden(page, field):
    m = re.search(r'name="%s"[^>]*value="([^"]*)"' % re.escape(field), page)
    return m.group(1) if m else ""


def fetch_grid(opener, term):
    """POST one search and return raw result-row HTML."""
    page = _open(opener, urllib.request.Request(SOURCE_URL))
    payload = {
        "__VIEWSTATE": _hidden(page, "__VIEWSTATE"),
        "__VIEWSTATEGENERATOR": _hidden(page, "__VIEWSTATEGENERATOR"),
        "__EVENTVALIDATION": _hidden(page, "__EVENTVALIDATION"),
        "ctl00$Bppi_body$txtSearch": term,
        "ctl00$Bppi_body$btnSearch": "Search",
    }
    req = urllib.request.Request(
        SOURCE_URL,
        data=urllib.parse.urlencode(payload).encode("utf-8"),
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )
    return _open(opener, req)


def parse_rows(page):
    """Grid renders data cells as <th>; headers are the only <td> cells."""
    rows = []
    for tr in re.findall(r"<tr[^>]*>(.*?)</tr>", page, re.S):
        cells = [
            html.unescape(re.sub(r"<[^>]+>", "", c).replace("\xa0", " ")).strip()
            for c in re.findall(r"<th[^>]*>(.*?)</th>", tr, re.S)
        ]
        if len(cells) == 5 and cells[0].isdigit():
            rows.append(
                {
                    "srNo": int(cells[0]),
                    "drugCode": cells[1],
                    "genericName": cells[2],
                    "unitSize": cells[3],
                    # PMBI states zero-MRP products are "under process"; represent as unknown
                    "mrpInr": (float(cells[4]) if float(cells[4]) > 0 else None) if re.match(r"^\d+(\.\d+)?$", cells[4]) else None,
                    "mrpNote": ("zero MRP on PMBI: under process, price not published" if re.match(r"^0(\.0+)?$", cells[4]) else None),
                }
            )
    return rows


COMBO_MARKERS = re.compile(r"\band\b|,|\+", re.I)


def _is_combo(name):
    return bool(COMBO_MARKERS.search(name))


ORAL_SOLID = re.compile(r"tablet|capsule|sachet|granule", re.I)


def pick_match(rows, term, strength, combo, form=None):
    salt = re.escape(term.split()[0].lower())
    salt_re = re.compile(r"\b%s\b" % salt)
    candidates = [r for r in rows if salt_re.search(r["genericName"].lower())]
    if combo:
        # combination formulary entries should match combination products
        combo_rows = [r for r in candidates if _is_combo(r["genericName"])]
        if combo_rows:
            candidates = combo_rows
    else:
        candidates = [r for r in candidates if not _is_combo(r["genericName"])]
    if not candidates:
        return None, "not-found"
    # the demo formulary is mostly oral-solid; prefer tablets/capsules over
    # injections, syrups and strips when both exist, unless the formulary
    # entry names another form (e.g. an inhaler)
    if form:
        formed = [r for r in candidates if form.lower() in r["genericName"].lower()]
        if formed:
            candidates = formed
    else:
        oral = [r for r in candidates if ORAL_SOLID.search(r["genericName"])]
        if oral:
            candidates = oral
    if strength:
        # lookbehind keeps "5" from matching the 5 in "2.5 mg"
        strength_re = re.compile(
            r"(?<![\d.])%s\s*(mg|mcg|gm|iu|ml)\b" % re.escape(strength), re.I
        )
        exact = [r for r in candidates if strength_re.search(r["genericName"])]
        if exact:
            return exact[0], "exact-strength"
        return candidates[0], "same-salt-different-strength"
    return candidates[0], "salt-only"


def main():
    jar = CookieJar()
    opener = urllib.request.build_opener(
        urllib.request.HTTPCookieProcessor(jar)
    )
    opener.addheaders = [("User-Agent", "AyuSwar-research-script/1.0 (student prototype)")]

    results = {}
    cache = {}

    def rows_for(term):
        if term not in cache:
            try:
                cache[term] = parse_rows(fetch_grid(opener, term))
            except Exception as exc:  # network failures must not fabricate data
                print(f"[!] fetch failed for {term}: {exc}", file=sys.stderr)
                cache[term] = []
            time.sleep(REQUEST_GAP_SECONDS)
        return cache[term]

    for formulary_id, spec in sorted(FORMULARY_QUERIES.items()):
        terms = [spec["term"]] + list(spec.get("aliases", []))
        match, match_type = None, "not-found"
        for term in terms:
            match, match_type = pick_match(
                rows_for(term), term, spec["strength"], spec["combo"], spec.get("form")
            )
            if match:
                break
        results[formulary_id] = {"matchType": match_type, "official": match}
        print(f"{formulary_id}: {match_type} -> {(match or {}).get('genericName', '-')}")

    from datetime import date

    doc = {
        "source": SOURCE_URL,
        "sourceTitle": "PMBI Jan Aushadhi live product search",
        "fetchedAt": date.today().isoformat(),
        "entries": results,
    }
    js = (
        "/**\n"
        " * AyuSwar AI - PMBJP official product reference (auto-generated).\n"
        " *\n"
        f" * Source: {SOURCE_URL} (PMBI live product search)\n"
        f" * Fetched: {doc['fetchedAt']} by scripts/fetch_pmbjp_products.py\n"
        " *\n"
        " * Product identity and MRP reference only. Not medical, dosage, or\n"
        " * substitution guidance. Re-run the fetch script to refresh; prices\n"
        " * and availability on pmbi.co.in change without notice.\n"
        " */\n\n"
        "export const PMBJP_OFFICIAL_PRODUCTS = "
        + json.dumps(doc, indent=2, ensure_ascii=False)
        + ";\n"
    )
    out = "src/data/pmbjpOfficialProducts.js"
    with open(out, "w", encoding="utf-8") as fh:
        fh.write(js)
    print(f"wrote {out}")


if __name__ == "__main__":
    main()
