import json,os,shutil,html,re
from pathlib import Path
root=Path(__file__).parent;dist=root/'dist';shutil.rmtree(dist,ignore_errors=True);dist.mkdir()
for p in root.iterdir():
 if p.name in ('dist','.git','README-v9.txt','build.py','netlify.toml','.github','__pycache__'):continue
 if p.is_dir():shutil.copytree(p,dist/p.name)
 else:shutil.copy2(p,dist/p.name)
base=json.loads((root/'archive.json').read_text());extra=json.loads((root/'new-posts.json').read_text())
edits=json.loads((root/'edits.json').read_text());deleted=set(map(str,json.loads((root/'deleted-posts.json').read_text())))
allposts=[]
for p in extra+base:
 if str(p['id']) in deleted: continue
 if str(p['id']) in edits:
  p={**p,**edits[str(p['id'])]}
  p['_edited']=True
 allposts.append(p)
(dist/'archive.json').write_text(json.dumps(allposts,ensure_ascii=False))
for ident in deleted:
 safe=re.sub(r'[^a-zA-Z0-9-]','',ident)
 if safe:
  shutil.rmtree(dist/'p'/safe,ignore_errors=True)
for p in allposts:
 if not p.get('_edited'):continue
 ident=re.sub(r'[^a-zA-Z0-9-]','',str(p['id']))
 if not ident:continue
 d=dist/'p'/ident;d.mkdir(parents=True,exist_ok=True)
 title=html.escape(p['title']);author=html.escape(p.get('author',''));body=html.escape(p.get('text','')).replace('\\n','<br>')
 url='https://majallat-almanbar.netlify.app/p/'+ident+'/'
 image=p.get('image') or 'featured-ahmed-bayad-landscape.jpg'
 if image.startswith('/'): image='https://majallat-almanbar.netlify.app'+image
 elif not image.startswith('http'):image='https://majallat-almanbar.netlify.app/'+image
 img=html.escape(image,quote=True)
 page=f'''<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>{title} | مجلة المنبر</title><meta property="og:type" content="article"><meta property="og:title" content="{title} — {author}"><meta property="og:image" content="{img}"><meta property="og:url" content="{url}"><meta name="twitter:card" content="summary_large_image"><link rel="stylesheet" href="/article.css"><script src="/site-config.js" defer></script><script src="/features.js" defer></script></head><body><main style="max-width:780px;margin:auto;padding:25px;font-family:serif;line-height:2"><a href="/">الرئيسية</a><h1>{title}</h1><p>{author}</p><img src="{img}" style="max-width:100%;max-height:420px;object-fit:contain"><article style="white-space:pre-line;font-size:1.2rem">{html.escape(p.get('text',''))}</article><div id="share" class="share-tools"></div><section class="comment-area"><h3>تعليقات القراء</h3><div id="comments"></div></section><script>window.addEventListener('load',()=>{{if(window.ManbarFeatures)ManbarFeatures.render('share','comments',{json.dumps(url)},{json.dumps(p['title'],ensure_ascii=False)},{json.dumps(ident)})}})</script></main><script src="/language-v12.js"></script></body></html>'''
 (d/'index.html').write_text(page)

for p in extra:
 if str(p['id']) in deleted or str(p['id']) in edits: continue
 ident=re.sub(r'[^a-zA-Z0-9-]','',str(p['id']));d=dist/'p'/ident;d.mkdir(parents=True,exist_ok=True)
 title=html.escape(p['title']);author=html.escape(p.get('author',''));body='<p>'.join(html.escape(t).replace('\\n','<br>') for t in p.get('text','').split('\\n\\n'));url='https://majallat-almanbar.netlify.app/p/'+ident+'/'
 img=p.get('image') or 'https://majallat-almanbar.netlify.app/featured-ahmed-bayad-landscape.jpg';img=('https://majallat-almanbar.netlify.app'+img if img.startswith('/') else img);img=html.escape(img,quote=True)
 page=f"""<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>{title} | مجلة المنبر</title><meta property="og:type" content="article"><meta property="og:title" content="{title} – {author} | مجلة المنبر"><meta property="og:image" content="{img}"><meta property="og:url" content="{url}"><meta name="twitter:card" content="summary_large_image"><link rel="stylesheet" href="/article.css"><script src="/site-config.js" defer></script><script src="/features.js" defer></script></head><body><main style="max-width:780px;margin:auto;padding:25px;font-family:serif;line-height:2"><a href="/">الرئيسية</a><h1>{title}</h1><p>{author}</p><img src="{img}" style="max-width:100%;max-height:420px;object-fit:contain"><article style="white-space:pre-line;font-size:1.2rem">{html.escape(p.get('text',''))}</article><section id="share-{ident}" class="share-tools"></section><section class="comment-area"><h3>تعليقات القراء</h3><div id="comments-{ident}"></div></section><script>window.addEventListener('load',()=>{{if(window.ManbarFeatures)ManbarFeatures.render('share-{ident}','comments-{ident}','{url}',{json.dumps(p['title'],ensure_ascii=False)},{json.dumps(ident)})}})</script></main><script src="/language-v12.js"></script></body></html>"""
 (d/'index.html').write_text(page)
# Enable the reader's language menu on older archive article pages too.
# These files were imported as static HTML before the language feature existed.
for old_page in (dist/'p').glob('*/index.html'):
 page_html=old_page.read_text(encoding='utf-8')
 if '/language-v12.js' not in page_html:
  if '</body>' in page_html:
   page_html=page_html.replace('</body>', '<script src="/language-v12.js" defer></script></body>', 1)
  else:
   page_html += '<script src="/language-v12.js" defer></script>'
  old_page.write_text(page_html,encoding='utf-8')

# Generate Google-compatible sitemap from all published article URLs.
# Rebuilt on every deployment so new/edited/deleted posts are reflected automatically.
from xml.sax.saxutils import escape as xml_escape
site_url='https://majallat-almanbar.netlify.app'
locs=[site_url+'/']
seen=set(locs)
for post in allposts:
 ident=re.sub(r'[^a-zA-Z0-9-]','',str(post['id']))
 if not ident or not (dist/'p'/ident/'index.html').is_file():
  continue
 loc=site_url+'/p/'+ident+'/'
 if loc not in seen:
  locs.append(loc);seen.add(loc)
xml=['<?xml version="1.0" encoding="UTF-8"?>','<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
xml.extend('  <url><loc>'+xml_escape(u)+'</loc></url>' for u in locs)
xml.append('</urlset>')
(dist/'sitemap.xml').write_text('\n'.join(xml)+'\n',encoding='utf-8')
(dist/'robots.txt').write_text('User-agent: *\nAllow: /\nSitemap: '+site_url+'/sitemap.xml\n',encoding='utf-8')
print('Generated sitemap with',len(locs),'URLs')
print('Built',len(allposts),'articles')
