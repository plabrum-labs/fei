"""Convert a (possibly multi-column) academic PDF to clean markdown text for AI reading.

Column handling: on each page, blocks are split into "wide" (spanning most of
the page -- section headers, page footers, single-column body text) and
"narrow" (column content). Narrow blocks are clustered by x-position (a large
gap in x0 between blocks means a new column) rather than assumed to split at
the page midpoint, since layouts like this journal's title page pair a narrow
sidebar (~25% width) with a wider single main column (~62% width) rather than
two even halves. Narrow blocks are buffered per column and only flushed --
each column emitted top-to-bottom, columns left-to-right -- when a wide block
forces a break, reconstructing correct reading order without interleaving
column text mid-sentence.
"""

import re
import sys
from pathlib import Path

import pymupdf

SOFT_HYPHEN = "­"
WIDE_BLOCK_RATIO = 0.75
COLUMN_GAP_RATIO = 0.08


def clean_text(text: str) -> str:
    # join soft-hyphen line wraps first, before the hyphen marker is lost
    text = text.replace(SOFT_HYPHEN + "\n", "")
    text = text.replace(SOFT_HYPHEN, "")
    text = re.sub(r"-\n(?=[a-z])", "", text)  # rejoin hard-hyphen line wraps
    text = re.sub(r"\n+", " ", text)  # remaining newlines are just line wraps
    text = re.sub(r" {2,}", " ", text)
    return text.strip()


def cluster_columns(blocks: list, page_width: float) -> dict:
    """Map each narrow block's id() to a column index, ordered left to right."""
    gap = page_width * COLUMN_GAP_RATIO
    by_x0 = sorted(blocks, key=lambda b: b[0])
    columns = []  # list of (representative_x0, [blocks])
    for b in by_x0:
        if columns and b[0] - columns[-1][0] <= gap:
            columns[-1] = (columns[-1][0], columns[-1][1] + [b])
        else:
            columns.append((b[0], [b]))
    return {id(b): i for i, (_, col_blocks) in enumerate(columns) for b in col_blocks}


def extract_page(page: pymupdf.Page) -> str:
    blocks = [b for b in page.get_text("blocks") if b[6] == 0 and b[4].strip()]
    if not blocks:
        return ""

    blocks.sort(key=lambda b: b[1])  # top to bottom
    page_width = page.rect.width

    narrow = [b for b in blocks if (b[2] - b[0]) < page_width * WIDE_BLOCK_RATIO]
    col_of = cluster_columns(narrow, page_width)
    num_cols = len(set(col_of.values())) if col_of else 0

    buffers = [[] for _ in range(num_cols)]
    ordered = []

    def flush():
        for buf in buffers:
            buf.sort(key=lambda b: b[1])
            ordered.extend(buf)
            buf.clear()

    for b in blocks:
        if id(b) in col_of:
            buffers[col_of[id(b)]].append(b)
        else:
            flush()
            ordered.append(b)
    flush()

    return "\n\n".join(clean_text(b[4]) for b in ordered if b[4].strip())


def convert(pdf_path: Path, out_path: Path) -> None:
    doc = pymupdf.open(pdf_path)
    parts = []
    for i, page in enumerate(doc, start=1):
        parts.append(f"\n\n<!-- page {i} -->\n\n")
        parts.append(extract_page(page))
    out_path.write_text("".join(parts))


if __name__ == "__main__":
    pdf_path = Path(sys.argv[1])
    out_path = Path(sys.argv[2]) if len(sys.argv) > 2 else pdf_path.with_suffix(".md")
    convert(pdf_path, out_path)
    print(f"wrote {out_path}")
