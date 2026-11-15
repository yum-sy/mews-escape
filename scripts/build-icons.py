"""Raster counterparts of our original app.svg, including an opaque maskable background."""
from PIL import Image, ImageDraw
from pathlib import Path
for size in [180,192,512]:
 im=Image.new('RGB',(1024,1024),'#0b1522');d=ImageDraw.Draw(im)
 d.ellipse((208,208,816,816),fill='#172b3b',outline='#eab5d4',width=18)
 d.line([(308,536),(512,316),(716,536)],fill='#eab5d4',width=40,joint='curve')
 d.line([(512,336),(512,684)],fill='#eab5d4',width=40)
 d.line([(408,750),(616,750)],fill='#97d6c2',width=20)
 im.resize((size,size),Image.Resampling.LANCZOS).save(Path('public/icons')/f'app-{size}.png')
