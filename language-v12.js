/* Reader language control. Translation depends on an external provider; original Arabic is preserved. */
(function(){
const langs={ar:'العربية',en:'English',fr:'Français',es:'Español',de:'Deutsch',it:'Italiano',tr:'Türkçe',pt:'🇧🇷 Português (Brasil)',ru:'Русский',fa:'فارسی',zh:'中文'};
function init(){
 const nav=document.querySelector('.nav-inner')||document.querySelector('header')||document.body;
 const wrap=document.createElement('div');wrap.className='manbar-language';wrap.setAttribute('translate','no');
 const label=document.createElement('label');label.textContent='🌐 ';label.htmlFor='manbar-lang';
 const sel=document.createElement('select');sel.id='manbar-lang';sel.setAttribute('aria-label','Language / اللغة');
 Object.entries(langs).forEach(([code,name])=>{let o=document.createElement('option');o.value=code;o.textContent=name;sel.append(o)});
 label.append(sel);wrap.append(label);nav.append(wrap);
 const holder=document.createElement('div');holder.id='google_translate_element';holder.style.cssText='position:absolute;left:-9999px;top:-9999px';document.body.append(holder);
 const saved=localStorage.getItem('manbar-reader-language')||'ar';sel.value=langs[saved]?saved:'ar';
 sel.onchange=()=>{const target=sel.value;localStorage.setItem('manbar-reader-language',target);
   if(target==='ar'){document.cookie='googtrans=/ar/ar;path=/';document.cookie='googtrans=/ar/ar;path=/;domain='+location.hostname;location.reload();return}
   let gt=document.querySelector('.goog-te-combo');
   if(gt){gt.value=target;gt.dispatchEvent(new Event('change',{bubbles:true}));return}
   // Provider blocked: let the reader use Google's page translation proxy without exposing tokens.
   const u='https://translate.google.com/translate?sl=ar&tl='+encodeURIComponent(target)+'&u='+encodeURIComponent(location.href);
   window.open(u,'_blank','noopener');
 };
 window.manbarGoogleTranslateInit=function(){
   if(!(window.google&&google.translate&&google.translate.TranslateElement))return;
   new google.translate.TranslateElement({pageLanguage:'ar',includedLanguages:Object.keys(langs).filter(x=>x!=='ar').join(','),autoDisplay:false},'google_translate_element');
   if(saved!=='ar')setTimeout(()=>{const gt=document.querySelector('.goog-te-combo');if(gt){gt.value=saved;gt.dispatchEvent(new Event('change',{bubbles:true}))}},1800);
 };
 let s=document.createElement('script');s.src='https://translate.google.com/translate_a/element.js?cb=manbarGoogleTranslateInit';s.async=true;document.head.append(s);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
