#!/usr/bin/env python3
"""Verifies a ?shot=play frame as a player and a judge see it, with the picture's own data.

The frame writes the spots it hides into #shot-info, so this does not have to guess them:

  1. both panels are painted, and are identical outside the hidden spots,
  2. every hidden difference really shows: a cluster of changed pixels at its spot, big enough to see,
  3. nothing changed anywhere else (the two pictures are the same scene, not two different drawings),
  4. every found-marker sits on the spot it claims.

Run: python3 test/check_shot.py            (renders the frame itself with headless Chrome)
     CHROME=/path/to/chrome python3 test/check_shot.py
"""
import json
import os
import re
import subprocess
import sys
import tempfile
from collections import deque
from pathlib import Path

from PIL import Image, ImageChops

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent
SERVE_PORT = int(os.environ.get("SPOT_PORT", "8099"))
PANEL_A = (28, 130, 628, 558)
PANEL_B = (652, 130, 1252, 558)
MARKER_GREEN = (92, 225, 160)
TOLERANCE = 24
MIN_AREA = 90     # changed pixels a spot must show, in total, inside its own radius
CLUSTER_MIN = 20  # a thin detail (a gull, a wire) splits into small clusters; each still counts
SPOT_RADIUS = 46
GLOW_RADIUS = 96  # a lamp lights a wide area: its cluster may spill past its own spot
CHROME = os.environ.get("CHROME") or str(Path.home() / ".cache/ms-playwright/chromium-1248/chrome-linux64/chrome")


def changed_mask(a, b, tolerance=TOLERANCE):
    diff = ImageChops.difference(a.convert("RGB"), b.convert("RGB"))
    width, height = diff.size
    pixels = diff.load()
    mask = [[False] * width for _ in range(height)]
    for y in range(height):
        row = mask[y]
        for x in range(width):
            r, g, bl = pixels[x, y]
            if r > tolerance or g > tolerance or bl > tolerance:
                row[x] = True
    return mask


def clusters(mask, min_area=40):
    height = len(mask)
    width = len(mask[0]) if height else 0
    seen = [[False] * width for _ in range(height)]
    found = []
    for y in range(height):
        for x in range(width):
            if not mask[y][x] or seen[y][x]:
                continue
            queue = deque([(x, y)])
            seen[y][x] = True
            area = 0
            sx = sy = 0
            min_x = max_x = x
            min_y = max_y = y
            while queue:
                cx, cy = queue.popleft()
                area += 1
                sx += cx
                sy += cy
                min_x, max_x = min(min_x, cx), max(max_x, cx)
                min_y, max_y = min(min_y, cy), max(max_y, cy)
                for nx, ny in ((cx + 1, cy), (cx - 1, cy), (cx, cy + 1), (cx, cy - 1)):
                    if 0 <= nx < width and 0 <= ny < height and mask[ny][nx] and not seen[ny][nx]:
                        seen[ny][nx] = True
                        queue.append((nx, ny))
            if area >= min_area:
                found.append({"area": area, "cx": sx / area, "cy": sy / area, "bbox": (min_x, min_y, max_x, max_y)})
    return sorted(found, key=lambda c: -c["area"])


def green_marks(image):
    """Hollow green rings about 46px across: the found-markers, told apart from green scene objects."""
    pixels = image.load()
    width, height = image.size
    hits = [[False] * width for _ in range(height)]
    for y in range(height):
        for x in range(width):
            r, g, b = pixels[x, y][:3]
            if abs(r - MARKER_GREEN[0]) < 45 and abs(g - MARKER_GREEN[1]) < 40 and abs(b - MARKER_GREEN[2]) < 45:
                hits[y][x] = True
    rings = []
    for cluster in clusters(hits, min_area=60):
        min_x, min_y, max_x, max_y = cluster["bbox"]
        box_w = max_x - min_x + 1
        box_h = max_y - min_y + 1
        if 32 <= box_w <= 64 and 32 <= box_h <= 64 and cluster["area"] / float(box_w * box_h) < 0.46:
            rings.append(cluster)
    return rings


def render(shot, seed, level=None):
    """Runs the local server and headless Chrome on the shot, returning (image, frame info)."""
    server = subprocess.Popen(["node", str(ROOT / "serve.ts")], cwd=str(ROOT),
                              env={**os.environ, "PORT": str(SERVE_PORT)},
                              stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    import time
    import urllib.request
    for _ in range(50):
        try:
            urllib.request.urlopen(f"http://localhost:{SERVE_PORT}/", timeout=0.5).read(1)
            break
        except Exception:
            time.sleep(0.1)
    query = f"?shot={shot}&seed={seed}" + (f"&level={level}" if level is not None else "")
    url = f"http://localhost:{SERVE_PORT}/{query}"
    try:
        png = subprocess.run([CHROME, "--headless=new", "--disable-gpu", "--no-sandbox", "--hide-scrollbars",
                              "--force-device-scale-factor=1", "--window-size=1280,720",
                              "--virtual-time-budget=3000", f"--screenshot={tempfile.gettempdir()}/spot-check.png",
                              url], capture_output=True, text=True, timeout=90)
        dom = subprocess.run([CHROME, "--headless=new", "--disable-gpu", "--no-sandbox",
                              "--virtual-time-budget=3000", "--dump-dom", url],
                             capture_output=True, text=True, timeout=90).stdout
        image = Image.open(f"{tempfile.gettempdir()}/spot-check.png").convert("RGB")
    finally:
        server.terminate()
        try:
            server.wait(timeout=5)
        except subprocess.TimeoutExpired:
            server.kill()
    match = re.search(r'<pre id="shot-info" hidden="">(.*?)</pre>', dom, re.S)
    if not match:
        raise SystemExit("the frame wrote no #shot-info: did the module fail to load? " + png.stderr[:400])
    return image, json.loads(match.group(1).replace("&quot;", '"'))


def main(shot="play", seed=7, level=None):
    image, info = render(shot, seed, level)
    a = image.crop(PANEL_A)
    b = image.crop(PANEL_B)
    problems = []

    for name, panel in (("A", a), ("B", b)):
        low, high = panel.convert("L").getextrema()
        if high - low < 20:
            problems.append(f"panel {name} is blank or one flat colour")

    diffs = clusters(changed_mask(a, b), min_area=CLUSTER_MIN)
    marks = green_marks(a)
    spots = info["differences"]

    print(f"frame: shot={shot} level={info['level']} differences={len(spots)} found={len(info['found'])}")
    print(f"signal: {len(diffs)} changed regions, {len(marks)} markers on panel A\n")

    covered = {}
    for index, spot in enumerate(spots):
        near = [c for c in diffs if ((c["cx"] - spot["x"]) ** 2 + (c["cy"] - spot["y"]) ** 2) ** 0.5 <= SPOT_RADIUS]
        area = sum(c["area"] for c in near)
        covered[index] = near
        print(f"  {spot['mutation']:8s} {spot['tag']:10s} at ({spot['x']:3d},{spot['y']:3d})  changed {area:5d}px in {len(near)} region(s)")
        if area < MIN_AREA:
            problems.append(f"the {spot['mutation']} {spot['tag']} at ({spot['x']},{spot['y']}) does not show: {area}px changed")

    for cluster in diffs:
        nearest = min((((cluster["cx"] - s["x"]) ** 2 + (cluster["cy"] - s["y"]) ** 2) ** 0.5 for s in spots), default=9999)
        if nearest > GLOW_RADIUS and cluster["area"] >= MIN_AREA:
            problems.append(f"unexplained change of {cluster['area']}px at ({cluster['cx']:.0f},{cluster['cy']:.0f}), {nearest:.0f}px from any difference")

    if len(marks) != len(info["found"]):
        problems.append(f"{len(info['found'])} found-markers expected, {len(marks)} drawn")

    for mark in marks:
        nearest = min((((m["cx"] - f["x"]) ** 2 + (m["cy"] - f["y"]) ** 2) ** 0.5 for m in [mark] for f in info["found"]), default=9999)
        print(f"  marker at ({mark['cx']:.0f},{mark['cy']:.0f}) sits {nearest:.0f}px from a found spot")
        if nearest > 26:
            problems.append(f"marker at ({mark['cx']:.0f},{mark['cy']:.0f}) is {nearest:.0f}px from the spot it marks")

    if problems:
        print("\nFAIL")
        for problem in problems:
            print(f"  - {problem}")
        return 1
    print("\nPASS: both panels painted, every hidden difference visible, no change elsewhere, markers on their spots")
    return 0


def sweep(seeds_per_level=8):
    """Every level, several seeds each: the check that catches a spot no player could ever find."""
    failures = []
    for level in range(3):
        for seed in range(1, seeds_per_level + 1):
            print(f"\n--- level {level + 1}, seed {seed}")
            if main("level", seed, level) != 0:
                failures.append((level + 1, seed))
    print("\n" + "=" * 70)
    if failures:
        print(f"SWEEP FAILED on {len(failures)} frame(s): {failures}")
        return 1
    print(f"SWEEP PASSED: 3 levels x {seeds_per_level} seeds, every hidden difference visible and fair")
    return 0


if __name__ == "__main__":
    args = [arg for arg in sys.argv[1:] if not arg.startswith("-")]
    if "--sweep" in sys.argv:
        sys.exit(sweep(int(args[0]) if args else 8))
    sys.exit(main(args[0] if args else "play", int(args[1]) if len(args) > 1 else 7,
                  int(args[2]) if len(args) > 2 else None))
