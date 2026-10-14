(function(){
'use strict';
const cfg=window.MANBAR_CONFIG||{};
const base='https://majallat-almanbar.netlify.app';
const esc=encodeURIComponent;
function button(txt,href){let a=document.createElement('a');a.textContent=txt;a.href=href;a.target='_blank';a.rel='noopener noreferrer';return a}
function renderShares(holder,url,title){let el=document.getElementById(holder);if(!el)return;el.replaceChildren();let h=document.createElement('h3');h.textContent='شارك هذا النص';el.append(h);let share=[['فيسبوك','https://www.facebook.com/sharer/sharer.php?u='+esc(url)],['واتساب','https://api.whatsapp.com/send?text='+esc(title+' '+url)],['منصة X','https://twitter.com/intent/tweet?url='+esc(url)+'&text='+esc(title)],['تيليجرام','https://t.me/share/url?url='+esc(url)+'&text='+esc(title)]];for(let [text,link] of share)el.append(button(text,link));let copy=document.createElement('button');copy.type='button';copy.textContent='نسخ الرابط';copy.onclick=async()=>{try{await navigator.clipboard.writeText(url);copy.textContent='✓ تم نسخ الرابط'}catch(_){window.prompt('انسخ الرابط:',url)}};el.append(copy);if(navigator.share){let native=document.createElement('button');native.type='button';native.textContent='مشاركة عبر الهاتف';native.onclick=async()=>{try{await navigator.share({title,url})}catch(_){}};el.append(native)}}
function comments(target,url,id){let area=document.getElementById(target);if(!area)return;area.replaceChildren();if(!cfg.disqusShortname){let p=document.createElement('p');p.className='comments-note';p.textContent='التعليقات قيد التفعيل. سيتمكن القراء من التعليق مباشرة بعد ربط خدمة التعليقات بالمجلة.';area.append(p);return}
let thread=document.createElement('div');thread.id='disqus_thread';area.append(thread);
// Disqus identifies each historical page consistently by its permalink.
window.disqus_config=function(){this.page.url=url;this.page.identifier='manbar-'+id};let old=document.getElementById('manbar-disqus');if(old)old.remove();let sc=document.createElement('script');sc.id='manbar-disqus';sc.src='https://'+cfg.disqusShortname+'.disqus.com/embed.js';sc.async=true;sc.setAttribute('data-timestamp',String(Date.now()));document.body.append(sc);
}
window.ManbarFeatures={render:(shareId,commentsId,url,title,id)=>{renderShares(shareId,url,title);comments(commentsId,url,id)}};
})();