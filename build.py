import json,os,shutil,html,re
from pathlib import Path
root=Path(__file__).parent;dist=root/'dist';shutil.rmtree(dist,ignore_errors=True);dist.mkdir()
for p in root.iterdir():
 if p.name in ('dist','.git','README-v9.txt','build.py','netlify.toml','.github','__pycache__'):continue
 if p.is_dir():shutil.copytree(p,dist/p.name)
 else:shutil.copy2(p,dist/p.name)
base=json.loads((root/'archive.json').read_text());extra=json.loads((root/'new-posts.json').read_text());(dist/'archive.json').write_text(json.dumps(extra+base,ensure_ascii=False))
for p in extra:
 ident=re.sub(r'[^a-zA-Z0-9-]','',str(p['id']));d=dist/'p'/ident;d.mkdir(parents=True,exist_ok=True)
 title=html.escape(p['title']);author=html.escape(p.get('author',''));body='<p>'.join(html.escape(t).replace('\\n','<br>') for t in p.get('text','').split('\\n\\n'));url='https://majallat-almanbar.netlify.app/p/'+ident+'/'
 img=p.get('image') or 'https://majallat-almanbar.netlify.app/featured-ahmed-bayad-landscape.jpg';img=html.escape(img,quote=True)
 page=f"""<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>{title} | مجلة المنبر</title><meta property="og:type" content="article"><meta property="og:title" content="{title} – {author} | مجلة المنبر"><meta property="og:image" content="{img}"><meta property="og:url" content="{url}"><meta name="twitter:card" content="summary_large_image"><link rel="stylesheet" href="/article.css"><script src="/site-config.js" defer></script><script src="/features.js" defer></script></head><body><main style="max-width:780px;margin:auto;padding:25px;font-family:serif;line-height:2"><a href="/">الرئيسية</a><h1>{title}</h1><p>{author}</p><img src="{img}" style="max-width:100%;max-height:420px;object-fit:contain"><article style="white-space:pre-line;font-size:1.2rem">{html.escape(p.get('text',''))}</article><section id="share-{ident}" class="share-tools"></section><section class="comment-area"><h3>تعليقات القراء</h3><div id="comments-{ident}"></div></section><script>window.addEventListener('load',()=>{{if(window.ManbarFeatures)ManbarFeatures.render('share-{ident}','comments-{ident}','{url}',{json.dumps(p['title'],ensure_ascii=False)},{json.dumps(ident)})}})</script></main></body></html>"""
 (d/'index.html').write_text(page)
print('Built',len(base)+len(extra),'articles')
