"""Convert an academic PDF to markdown (with real LaTeX equations, tables, and
figures) using Marker (https://github.com/datalab-to/marker) for AI reading and
reference while building a lecture's reproduction and presentation.

Figures are saved next to the markdown file in a `<stem>_assets/` folder.
Marker also extracts small decorative images (journal logos, watermarks) as
"Picture" blocks; these are dropped by a pixel-area threshold well below any
real figure/plot observed in practice (tens of thousands of px^2 vs a
photographed logo) rather than by Marker's own block-type label, since a
genuine small inline image could in principle also be labeled "Picture".
"""

import re
import sys
from pathlib import Path

from marker.converters.pdf import PdfConverter
from marker.models import create_model_dict
from marker.output import text_from_rendered

MIN_FIGURE_AREA = 200_000  # px^2; real figures were 900k+, logos were under 72k


def convert(pdf_path: Path, out_path: Path) -> None:
    converter = PdfConverter(artifact_dict=create_model_dict())
    rendered = converter(str(pdf_path))
    markdown, _, images = text_from_rendered(rendered)

    assets_dir = out_path.with_suffix("").parent / f"{out_path.stem}_assets"
    kept = set()
    for name, image in images.items():
        if image.width * image.height < MIN_FIGURE_AREA:
            continue
        assets_dir.mkdir(exist_ok=True)
        image.save(assets_dir / name)
        kept.add(name)

    def rewrite_or_drop_image(match: re.Match) -> str:
        name = match.group(1)
        return f"![]({assets_dir.name}/{name})" if name in kept else ""

    markdown = re.sub(r"!\[\]\(([^)]+)\)", rewrite_or_drop_image, markdown)
    markdown = re.sub(r"\n{3,}", "\n\n", markdown)  # collapse gaps left by dropped images
    out_path.write_text(markdown.strip() + "\n")


if __name__ == "__main__":
    pdf_path = Path(sys.argv[1])
    out_path = Path(sys.argv[2]) if len(sys.argv) > 2 else pdf_path.with_suffix(".md")
    convert(pdf_path, out_path)
    print(f"wrote {out_path}")
