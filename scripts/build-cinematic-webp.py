"""Delivery copies; preserve original artwork and source/license records."""
from pathlib import Path
from PIL import Image
names=['forest-cinematic-v1','lab-cinematic-v1','lab-intact-v2','capture-operative-v2','containment-v2','researcher-v2','fleeing-researcher-v2']
for name in names:
 p=Path('public/assets')/(name+'.png')
 Image.open(p).save(p.with_suffix('.webp'),format='WEBP',quality=90,method=6)
print(sum((Path('public/assets')/(n+'.webp')).stat().st_size for n in names))
