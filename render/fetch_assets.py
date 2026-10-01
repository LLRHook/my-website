"""Download the pinned asset manifest, verifying cached files before reuse."""

import concurrent.futures
import hashlib
import json
import time
import urllib.request
from pathlib import Path, PurePosixPath

ROOT = Path(__file__).resolve().parent
ASSETS = ROOT / "assets"


def checksum(path: Path) -> str:
    """Calculate the MD5 supplied by Poly Haven for download integrity."""
    digest = hashlib.md5()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def download(spec: dict) -> bool:
    """Download one missing or corrupt asset atomically; return whether it changed."""
    relative = PurePosixPath(spec["path"])
    if relative.is_absolute() or ".." in relative.parts or ":" in str(relative):
        raise ValueError(f"Unsafe asset path: {relative}")
    destination = ASSETS.joinpath(*relative.parts)
    if destination.is_file() and checksum(destination) == spec["md5"]:
        return False
    destination.parent.mkdir(parents=True, exist_ok=True)
    temporary = destination.with_suffix(destination.suffix + ".part")
    request = urllib.request.Request(spec["url"], headers={"User-Agent": "VictorRoomRenderer/1.0"})
    for attempt in range(4):
        try:
            with (
                urllib.request.urlopen(request, timeout=120) as source,
                temporary.open("wb") as target,
            ):
                while chunk := source.read(1024 * 1024):
                    target.write(chunk)
            if checksum(temporary) != spec["md5"]:
                raise ValueError(f"Asset checksum mismatch: {relative}")
            temporary.replace(destination)
            print(f"FETCH {relative}", flush=True)
            return True
        except Exception:
            temporary.unlink(missing_ok=True)
            if attempt == 3:
                raise
            time.sleep(2**attempt)
    return False


def main() -> None:
    """Fetch only manifest assets used by the scene and publish the cache manifest."""
    manifest = json.loads((ROOT / "asset_manifest.json").read_text(encoding="utf-8"))
    if set(manifest["roles"].values()) != {a["id"] for a in manifest["assets"]}:
        raise ValueError("Asset manifest contains missing or unused assets")
    specs = {f["path"]: f for asset in manifest["assets"] for f in asset["files"]}
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
        changed = sum(pool.map(download, specs.values()))
    (ASSETS / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    print(
        f"FETCH COMPLETE: {len(manifest['assets'])} assets, {len(specs)} files, {changed} downloaded",
        flush=True,
    )


if __name__ == "__main__":
    main()
