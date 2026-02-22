#!/usr/bin/env python3
"""
Generate dp-engine/dp-examples.js from the examples/ folder.

Usage:
    python3 scripts/generate_examples.py

Run this script whenever you add, rename, or delete a .txt file in examples/.
The GitHub Actions workflow (.github/workflows/sync-examples.yml) runs it
automatically on every push to main that touches examples/.
"""

import os
import re

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
EXAMPLES_DIR = os.path.join(REPO_ROOT, "examples")
OUTPUT_FILE = os.path.join(REPO_ROOT, "dp-engine", "dp-examples.js")


def key_from_filename(filename):
    """'longest_edge_path.txt' -> 'longest_edge_path'"""
    return os.path.splitext(filename)[0]


def escape_template_literal(content):
    """Escape backticks and ${ sequences for embedding in a JS template literal."""
    content = content.replace("\\", "\\\\")
    content = content.replace("`", "\\`")
    content = content.replace("${", "\\${")
    return content


def main():
    txt_files = sorted(
        f for f in os.listdir(EXAMPLES_DIR) if f.endswith(".txt")
    )

    if not txt_files:
        print("No .txt files found in examples/")
        return

    entries = []
    for filename in txt_files:
        key = key_from_filename(filename)
        path = os.path.join(EXAMPLES_DIR, filename)
        with open(path, encoding="utf-8") as fh:
            content = fh.read().rstrip()
        entries.append((key, escape_template_literal(content)))

    lines = [
        "// AUTO-GENERATED — do not edit by hand.",
        "// Edit .txt files in examples/ and run: python3 scripts/generate_examples.py",
        "",
        "// =============================================",
        "// EXAMPLES",
        "// =============================================",
        "const EXAMPLES = {",
    ]

    for i, (key, content) in enumerate(entries):
        comma = "," if i < len(entries) - 1 else ""
        lines.append(f"  {key}: `{content}`{comma}")

    lines.append("};")
    lines.append("")

    output = "\n".join(lines)

    with open(OUTPUT_FILE, "w", encoding="utf-8") as fh:
        fh.write(output)

    print(f"Wrote {len(entries)} examples to {os.path.relpath(OUTPUT_FILE, REPO_ROOT)}")
    for key, _ in entries:
        print(f"  - {key}")


if __name__ == "__main__":
    main()
