#!/usr/bin/env python3
"""Isolated regression tests; never read the owner's PDFs or change site pages."""

import importlib.util
from io import BytesIO
import json
import os
from pathlib import Path
import tempfile
import unittest
from zipfile import ZipFile

SPEC = importlib.util.spec_from_file_location("career_bundle", Path(__file__).with_name("sync-career-bundle.py"))
bundle = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(bundle)


def sample_pdf(text):
    """Create a tiny, valid text-layer PDF using only the standard library."""
    stream = ("BT /F1 12 Tf 40 720 Td (" + text.replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)") + ") Tj ET").encode()
    objects = [
        b"<< /Type /Catalog /Pages 2 0 R >>",
        b"<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
        b"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
        b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
        b"<< /Length " + str(len(stream)).encode() + b" >>\nstream\n" + stream + b"\nendstream",
    ]
    output = bytearray(b"%PDF-1.4\n")
    offsets = [0]
    for index, obj in enumerate(objects, 1):
        offsets.append(len(output))
        output.extend(f"{index} 0 obj\n".encode() + obj + b"\nendobj\n")
    position = len(output)
    output.extend(b"xref\n0 6\n0000000000 65535 f \n")
    for offset in offsets[1:]:
        output.extend(f"{offset:010d} 00000 n \n".encode())
    output.extend(f"trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n{position}\n%%EOF\n".encode())
    return bytes(output)


SAFE_TEXT = "Fictional test document. " + "Readable public example text without personal details. " * 4


class BundleTests(unittest.TestCase):
    def setUp(self):
        # Tests stay inside ignored build/, not the site output or the owner's Disk.
        base = Path(__file__).resolve().parent.parent / "build"
        base.mkdir(exist_ok=True)
        self.temporary = tempfile.TemporaryDirectory(prefix="career-bundle-test-", dir=base)
        self.addCleanup(self.temporary.cleanup)
        self.root = Path(self.temporary.name) / "site"
        self.source = Path(self.temporary.name) / "sources"
        for page, prefix in bundle.PAGES:
            target = self.root / page
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_text("<!doctype html><html><body>\n" + bundle.render_block(None, prefix) + "\n</body></html>\n")
        for index, (relative, _) in enumerate(bundle.FILES):
            target = self.source / relative
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_bytes(sample_pdf(SAFE_TEXT + str(index)))

    def sync(self, check=False):
        return bundle.sync(self.source, self.root, check=check)

    def snapshot(self):
        return {str(path.relative_to(self.root)): (path.read_bytes(), path.stat().st_mtime_ns) for path in self.root.rglob("*") if path.is_file()}

    def test_missing_bundle_is_safe_fallback_but_not_fresh(self):
        self.assertIsNone(bundle.verify(self.root))
        with self.assertRaises(bundle.BundleError):
            self.sync(check=True)

    def test_exactly_two_pdfs_and_unchanged_bytes(self):
        self.sync()
        info = bundle.verify(self.root)
        archive = (self.root / "downloads" / bundle.ARCHIVE).read_bytes()
        with ZipFile(BytesIO(archive)) as z:
            self.assertEqual(z.namelist(), [name for _, name in bundle.FILES])
            for relative, name in bundle.FILES:
                self.assertEqual(z.read(name), (self.source / relative).read_bytes())
        self.assertEqual(info['bytes'], len(archive))
        self.assertNotIn(str(self.source), json.dumps(info))
        for page, prefix in bundle.PAGES:
            html = (self.root / page).read_text()
            self.assertIn(f'href="{prefix}downloads/{bundle.ARCHIVE}?v=', html)
            self.assertIn(' download=', html)

    def test_noop_and_mtime_only_change_do_not_rewrite(self):
        self.sync()
        before = self.snapshot()
        (self.source / bundle.FILES[0][0]).touch()
        self.assertEqual(self.sync(), "unchanged")
        self.assertEqual(self.sync(check=True), "unchanged")
        self.assertEqual(self.snapshot(), before)

    def test_either_pdf_change_rebuilds_entire_bundle(self):
        self.sync()
        for relative, _ in bundle.FILES:
            before = bundle.verify(self.root)
            (self.source / relative).write_bytes(sample_pdf(SAFE_TEXT + relative.encode().hex()))
            with self.assertRaises(bundle.BundleError):
                self.sync(check=True)
            self.assertEqual(self.sync(), "rebuilt")
            self.assertNotEqual(bundle.verify(self.root)['sha256'], before['sha256'])

    def test_same_size_and_mtime_content_change_is_detected(self):
        self.sync()
        source = self.source / bundle.FILES[0][0]
        original = source.stat()
        source.write_bytes(source.read_bytes().replace(b"Fictional", b"Technical"))
        os.utime(source, ns=(original.st_atime_ns, original.st_mtime_ns))
        self.assertEqual(source.stat().st_size, original.st_size)
        with self.assertRaises(bundle.BundleError):
            self.sync(check=True)
        self.assertEqual(self.sync(), "rebuilt")

    def test_deterministic_archive_and_recovery_after_corruption(self):
        self.sync()
        archive = self.root / "downloads" / bundle.ARCHIVE
        original = archive.read_bytes()
        archive.write_bytes(b"damaged archive")
        with self.assertRaises(bundle.BundleError):
            bundle.verify(self.root)
        self.sync()
        self.assertEqual(archive.read_bytes(), original)

    def test_missing_source_leaves_outputs_untouched(self):
        self.sync()
        before = self.snapshot()
        (self.source / bundle.FILES[0][0]).unlink()
        with self.assertRaises(OSError):
            self.sync()
        self.assertEqual(self.snapshot(), before)

    def test_incomplete_pdf_is_rejected(self):
        (self.source / bundle.FILES[0][0]).write_bytes(b"%PDF-1.7 incomplete")
        with self.assertRaises(bundle.BundleError):
            self.sync()
        self.assertIsNone(bundle.verify(self.root))

    def test_broken_page_marker_prevents_partial_outputs(self):
        (self.root / "index.html").write_text("no marker")
        with self.assertRaises(bundle.BundleError):
            self.sync()
        self.assertFalse((self.root / "downloads" / bundle.ARCHIVE).exists())

    def test_stale_links_fail_offline_verification_and_are_repaired(self):
        self.sync()
        path = self.root / "index.html"
        path.write_text(path.read_text().replace('?v=', '?old='))
        with self.assertRaises(bundle.BundleError):
            bundle.verify(self.root)
        self.sync()
        bundle.verify(self.root)

if __name__ == "__main__":
    unittest.main(verbosity=2)
