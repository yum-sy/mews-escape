"""Encode delivery copies only; preserve generated artwork and its alpha unchanged."""
from pathlib import Path
from PIL import Image
for name in ['lab-props-v3','techniques-v3']:
    source=Path('public/assets')/(name+'.png')
    Image.open(source).save(source.with_suffix('.webp'),format='WEBP',quality=90,method=6)
    print(name, source.with_suffix('.webp').stat().st_size)
