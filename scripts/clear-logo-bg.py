from pathlib import Path

from PIL import Image

root = Path(__file__).resolve().parents[1]
brand = root / "public" / "brand"
backup = brand / "logo.blackbg.png"
logo = brand / "logo.png"

if not backup.exists():
    logo.replace(backup)

img = Image.open(backup).convert("RGBA")
pixels = img.load()
w, h = img.size
threshold = 28
removed = 0
for y in range(h):
    for x in range(w):
        r, g, b, a = pixels[x, y]
        if a > 0 and r <= threshold and g <= threshold and b <= threshold:
            pixels[x, y] = (0, 0, 0, 0)
            removed += 1

img.save(logo, "PNG")
print(f"saved {logo} removed={removed} bytes={logo.stat().st_size}")


def save_square(size: int, path: Path) -> None:
    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    resized = img.resize((size, size), Image.Resampling.LANCZOS)
    canvas.paste(resized, (0, 0), resized)
    canvas.save(path, "PNG")
    print(f"saved {path}")


public = root / "public"
save_square(32, public / "favicon-32.png")
save_square(48, public / "favicon.png")
save_square(180, public / "apple-touch-icon.png")

icons = []
for size in (16, 32, 48):
    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    resized = img.resize((size, size), Image.Resampling.LANCZOS)
    canvas.paste(resized, (0, 0), resized)
    icons.append(canvas)
icons[0].save(
    public / "favicon.ico",
    format="ICO",
    sizes=[(16, 16), (32, 32), (48, 48)],
    append_images=icons[1:],
)
print(f"saved {public / 'favicon.ico'}")
