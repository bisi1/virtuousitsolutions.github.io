#!/usr/bin/env python3
from PIL import Image
from pathlib import Path

folders = [Path('assets/images/team'), Path('assets/images/clients')]

for folder in folders:
    if not folder.exists():
        continue
    for p in folder.iterdir():
        if p.suffix.lower() in ['.jpg', '.jpeg', '.png']:
            out = p.with_suffix('.webp')
            try:
                im = Image.open(p)
                im.save(out, 'WEBP', quality=80, method=6)
                print('created', out)
            except Exception as e:
                print('error', p, e)

