"""Remove neutral light matte only in the outer 3px alpha band. Preserve source/RGB."""
from pathlib import Path
from PIL import Image, ImageFilter, ImageChops
import numpy as np
src=Path('art-source/mew-mewtwo-hitofutarai.png')
im=Image.open(src).convert('RGBA');a=np.array(im)
alpha=im.getchannel('A')
# A narrow boundary band prevents reaching pale skin enclosed by dark outlines.
inside=np.array(alpha.filter(ImageFilter.MinFilter(7)))
band=(inside<16)&(a[:,:,3]>0)
rgb=a[:,:,:3].astype(float);low=rgb.min(axis=2);high=rgb.max(axis=2)
neutral=(high-low)<45
# Fully remove near-white fringe; feather gray matte instead of eroding line art.
reachable=a[:,:,3]<16
candidate=neutral&(low>165)&band
for _ in range(4):
 adjacent=np.array(Image.fromarray((reachable*255).astype('uint8')).filter(ImageFilter.MaxFilter(3)))>0
 reachable |= adjacent&candidate
strength=np.clip((low-165)/40,0,1)*reachable*band
clean=a.copy();clean[:,:,3]=np.round(a[:,:,3]*(1-strength)).astype('uint8')
# RGB is untouched; transparent pixels never gain opacity.
assert np.array_equal(clean[:,:,:3],a[:,:,:3])
assert np.all(clean[:,:,3]<=a[:,:,3])
assert np.array_equal(clean[:,:,3][~band],a[:,:,3][~band])
Image.fromarray(clean).save(src.with_name('mew-mewtwo-hitofutarai-clean.png'))
preview=Image.new('RGB',(974,476),'#182336')
preview.paste(im,(0,0),im);out=Image.fromarray(clean);preview.paste(out,(487,0),out)
Path('evidence').mkdir(exist_ok=True);preview.save('evidence/icon-matte-comparison.png')
print('Changed alpha pixels:',np.count_nonzero(clean[:,:,3]!=a[:,:,3]))
