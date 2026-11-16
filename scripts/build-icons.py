"""Resize/crop user-supplied fan art; attribution in art-source/README.md."""
from PIL import Image
from pathlib import Path
source=Image.open('art-source/mew-mewtwo-hitofutarai.png').convert('RGBA')
faces=source.crop((0,0,350,350))
def icon(size,padding):
 out=Image.new('RGBA',(512,512),'#182336')
 art=faces.resize((512-padding*2,512-padding*2),Image.Resampling.LANCZOS)
 out.alpha_composite(art,(padding,padding))
 return out.convert('RGB').resize((size,size),Image.Resampling.LANCZOS)
for size in [180,192,512]:icon(size,24).save(f'public/icons/parent-{size}.png',optimize=True)
icon(512,112).save('public/icons/parent-maskable-512.png',optimize=True)
for size in [16,32,48]:icon(size,0).save(f'public/icons/favicon-{size}.png',optimize=True)
icon(256,0).save('public/icons/favicon.ico',sizes=[(16,16),(32,32),(48,48)])
