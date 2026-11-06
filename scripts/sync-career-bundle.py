#!/usr/bin/env python3
"""Build an unchanged pair of reviewed PDFs; never publish or edit the sources."""

import argparse
from hashlib import sha256
from html import escape
from io import BytesIO
import json
import os
from pathlib import Path
import re
import sys
import tempfile
from zipfile import BadZipFile, ZIP_DEFLATED, ZipFile, ZipInfo

ROOT = Path(__file__).resolve().parent.parent
ARCHIVE = "nikolai-karpov-resume-portfolio.zip"
MANIFEST = "career-bundle.json"
FILES = (
    ("Руководитель_направления_AI-решений.pdf", "Nikolai_Karpov_Resume.pdf"),
    ("Портфолио/dist/Николай_Карпов_AI_портфолио.pdf", "Nikolai_Karpov_Portfolio.pdf"),
)
PAGES = (("index.html", ""), ("site-pages/contacts.html", "../"))
MARKER = re.compile(
    r"(?P<indent>^[ \t]*)<!-- career-bundle:start -->.*?<!-- career-bundle:end -->",
    re.MULTILINE | re.DOTALL,
)


class BundleError(Exception):
    pass


def digest(data):
    return sha256(data).hexdigest()


def render_block(info=None, prefix=""):
    if info:
        size = f"{info['bytes'] / (1024 * 1024):.1f}".replace(".", ",")
        detail = f"Два PDF одним архивом: резюме и портфолио. ZIP, {size} МБ."
        href = f"{prefix}downloads/{ARCHIVE}?v={info['sha256'][:16]}"
        attributes = f' download="{ARCHIVE}" aria-label="Скачать резюме и портфолио (ZIP)"'
        label = "Скачать комплект"
    else:
        detail = "Резюме и портфолио в PDF. Комплект пока доступен по запросу."
        href = "mailto:i@nikolai-karpov.ru?subject=Resume%20and%20portfolio"
        attributes = ""
        label = "Запросить комплект"
    return "\n".join((
        "<!-- career-bundle:start -->",
        '<div class="career-bundle">',
        '  <p class="career-bundle__title"><strong>Резюме и портфолио</strong></p>',
        f'  <p class="career-bundle__details" id="career-bundle-details">{detail}</p>',
        f'  <a class="btn btn--ghost career-bundle__link" href="{escape(href, quote=True)}"{attributes} aria-describedby="career-bundle-details">{label}</a>',
        "</div>",
        "<!-- career-bundle:end -->",
    ))


def page_updates(root, info):
    updates = []
    for name, prefix in PAGES:
        path = root / name
        content = path.read_text(encoding="utf-8")
        matches = list(MARKER.finditer(content))
        if len(matches) != 1:
            raise BundleError(f"Expected one career-bundle block in {name}")
        match = matches[0]
        replacement = "\n".join(match['indent'] + line for line in render_block(info, prefix).splitlines())
        updated = content[:match.start()] + replacement + content[match.end():]
        if updated != content:
            updates.append((path, updated.encode("utf-8")))
    return updates


def atomic_write(path, data):
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = None
    try:
        with tempfile.NamedTemporaryFile(dir=path.parent, suffix=".tmp", delete=False) as handle:
            temporary = Path(handle.name)
            handle.write(data)
        temporary.chmod(0o644)
        temporary.replace(path)
    finally:
        if temporary:
            temporary.unlink(missing_ok=True)


def read_sources(source):
    documents = []
    for relative, name in FILES:
        path = source / relative
        before = path.stat()
        data = path.read_bytes()
        after = path.stat()
        if (before.st_size, before.st_mtime_ns) != (after.st_size, after.st_mtime_ns):
            raise BundleError(f"Source changed while reading: {name}; retry after synchronization")
        if not data.startswith(b"%PDF-") or b"%%EOF" not in data[-1024:]:
            raise BundleError(f"Invalid or incomplete PDF: {name}")
        documents.append((name, data))
    return documents


def verify(root):
    archive = root / "downloads" / ARCHIVE
    manifest_path = root / "downloads" / MANIFEST
    if not archive.exists() and not manifest_path.exists():
        if page_updates(root, None):
            raise BundleError("No archive: pages must use the request fallback, not a broken download")
        return None
    if not archive.exists() or not manifest_path.exists():
        raise BundleError("Archive and manifest must be present together")
    info = json.loads(manifest_path.read_text(encoding="utf-8"))
    if not isinstance(info, dict) or not isinstance(info.get("files"), list) or not all(isinstance(entry, dict) for entry in info["files"]):
        raise BundleError("Invalid bundle manifest structure")
    data = archive.read_bytes()
    expected_names = [name for _, name in FILES]
    if info.get("version") != 1 or info.get("archive") != ARCHIVE:
        raise BundleError("Unsupported bundle manifest")
    if info.get("bytes") != len(data) or info.get("sha256") != digest(data):
        raise BundleError("Archive checksum/size mismatch")
    if [entry.get("name") for entry in info.get("files", [])] != expected_names:
        raise BundleError("Manifest must describe exactly the two expected PDFs")
    with ZipFile(BytesIO(data)) as bundle:
        if bundle.namelist() != expected_names or bundle.testzip() is not None:
            raise BundleError("Archive must contain exactly the two valid PDF entries")
        for entry in info["files"]:
            document = bundle.read(entry["name"])
            if len(document) != entry.get("bytes") or digest(document) != entry.get("sha256"):
                raise BundleError(f"PDF checksum mismatch: {entry['name']}")
    if page_updates(root, info):
        raise BundleError("Download links/size/version do not match the bundle; run bundle:sync")
    return info


def sync(source, root=ROOT, check=False):
    documents = read_sources(source)
    metadata = [{"name": name, "bytes": len(data), "sha256": digest(data)} for name, data in documents]
    try:
        current = verify(root)
    except (BundleError, ValueError, OSError, BadZipFile):
        current = None
    if current and current["files"] == metadata:
        print("Career bundle unchanged; archive and pages left untouched.")
        return "unchanged"
    if check:
        raise BundleError("Career bundle missing, stale or damaged; run npm run bundle:sync")
    buffer = BytesIO()
    with ZipFile(buffer, "w", ZIP_DEFLATED, compresslevel=6) as bundle:
        for name, data in documents:
            entry = ZipInfo(name, date_time=(1980, 1, 1, 0, 0, 0))
            entry.compress_type = ZIP_DEFLATED
            entry.external_attr = 0o100644 << 16
            bundle.writestr(entry, data)
    archive = buffer.getvalue()
    info = {"version": 1, "archive": ARCHIVE, "bytes": len(archive), "sha256": digest(archive), "files": metadata}
    updates = page_updates(root, info)
    # Prepare everything before replacing outputs; any interrupted update fails offline verification.
    atomic_write(root / "downloads" / ARCHIVE, archive)
    atomic_write(root / "downloads" / MANIFEST, (json.dumps(info, indent=2) + "\n").encode())
    for path, data in updates:
        atomic_write(path, data)
    verify(root)
    print(f"Career bundle rebuilt: downloads/{ARCHIVE} ({len(archive)} bytes, exactly 2 PDFs).")
    return "rebuilt"


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source-dir", type=Path, help="Directory containing the two source PDFs")
    mode = parser.add_mutually_exclusive_group()
    mode.add_argument("--check", action="store_true", help="Check source freshness without writing")
    mode.add_argument("--verify", action="store_true", help="Verify site artifacts without Yandex Disk access")
    args = parser.parse_args()
    try:
        if args.verify:
            info = verify(ROOT)
            print("Career bundle verified." if info else "No public bundle: request fallback verified.")
        else:
            source = args.source_dir or Path(os.environ.get(
                "CAREER_BUNDLE_SOURCE_DIR",
                str(Path.home() / "Yandex.Disk.localized/Трудоустройство/Резюме/IT"),
            ))
            sync(source.expanduser(), check=args.check)
    except (BundleError, OSError, ValueError, BadZipFile) as error:
        print(f"Career bundle: {error}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
