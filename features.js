(function(){
'use strict';
const cfg = window.MANBAR_CONFIG || {};
const esc = encodeURIComponent;

function button(txt, href){
  let a = document.createElement('a');
  a.textContent = txt;
  a.href = href;
  a.target = '_blank';
  a.rel = 'noopener noreferrer';
  return a;
}

// 1. أزرار المشاركة + عداد قراءات المقال
function renderShares(holder, url, title, id){
  let el = document.getElementById(holder);
  if(!el) return;
  el.replaceChildren();

  let viewsBadge = document.createElement('div');
  viewsBadge.style.cssText = 'margin-bottom:12px;font-size:0.95rem;color:#d4af37;';
  viewsBadge.textContent = '👁 قراءات النص: جاري التحميل...';
  el.append(viewsBadge);

  fetch('https://api.counterapi.dev/v1/majallat-almanbar/post-' + esc(id || 'home') + '/up')
    .then(r => r.json())
    .then(d => {
      if(d && typeof d.count === 'number'){
        viewsBadge.textContent = '👁 قراءات هذا النص: ' + d.count.toLocaleString('ar') + ' قراءة';
      }
    })
    .catch(() => { viewsBadge.remove(); });

  let h = document.createElement('h3');
  h.textContent = 'شارك هذا النص';
  el.append(h);

  let share = [
    ['فيسبوك', 'https://www.facebook.com/sharer/sharer.php?u=' + esc(url)],
    ['واتساب', 'https://api.whatsapp.com/send?text=' + esc(title + ' ' + url)],
    ['منصة X', 'https://twitter.com/intent/tweet?url=' + esc(url) + '&text=' + esc(title)],
    ['تيليجرام', 'https://t.me/share/url?url=' + esc(url) + '&text=' + esc(title)]
  ];
  for(let [text, link] of share) el.append(button(text, link));

  let copy = document.createElement('button');
  copy.type = 'button';
  copy.textContent = 'نسخ الرابط';
  copy.onclick = async () => {
    try {
      await navigator.clipboard.writeText(url);
      copy.textContent = '✓ تم نسخ الرابط';
    } catch(_) {
      window.prompt('انسخ الرابط:', url);
    }
  };
  el.append(copy);

  if(navigator.share){
    let native = document.createElement('button');
    native.type = 'button';
    native.textContent = 'مشاركة عبر الهاتف';
    native.onclick = async () => {
      try { await navigator.share({title, url}); } catch(_){}
    };
    el.append(native);
  }
}

// 2. نظام التعليقات التفاعلي المباشر
function comments(target, url, id, title){
  let area = document.getElementById(target);
  if(!area) return;
  area.replaceChildren();

  if(cfg.disqusShortname){
    let thread = document.createElement('div');
    thread.id = 'disqus_thread';
    area.append(thread);
    window.disqus_config = function(){
      this.page.url = url;
      this.page.identifier = 'manbar-' + id;
    };
    let old = document.getElementById('manbar-disqus');
    if(old) old.remove();
    let sc = document.createElement('script');
    sc.id = 'manbar-disqus';
    sc.src = 'https://' + cfg.disqusShortname + '.disqus.com/embed.js';
    sc.async = true;
    sc.setAttribute('data-timestamp', String(Date.now()));
    document.body.append(sc);
    return;
  }

  const storageKey = 'manbar-comments-' + id;
  let listWrap = document.createElement('div');
  listWrap.style.cssText = 'display:grid;gap:12px;margin-bottom:18px;';

  function renderCommentItem(c){
    let item = document.createElement('div');
    item.style.cssText = 'padding:12px 16px;border-radius:8px;background:rgba(255,255,255,0.04);border-right:3px solid #d4af37;';
    let head = document.createElement('div');
    head.style.cssText = 'font-weight:bold;margin-bottom:6px;color:#d4af37;font-size:0.95rem;';
    head.textContent = c.name + ' • ' + (c.date || '');
    let body = document.createElement('p');
    body.style.cssText = 'margin:0;line-height:1.7;white-space:pre-wrap;';
    body.textContent = c.comment;
    item.append(head, body);
    return item;
  }

  async function loadComments(){
    listWrap.replaceChildren();
    let items = [];
    if(cfg.firebaseDatabaseURL){
      try {
        let r = await fetch(cfg.firebaseDatabaseURL.replace(/\/$/, '') + '/comments/' + esc(id) + '.json');
        let d = await r.json();
        if(d) items = Object.values(d);
      } catch(_){}
    }
    try {
      let local = JSON.parse(localStorage.getItem(storageKey) || '[]');
      if(!items.length) items = local;
    } catch(_){}

    if(!items.length){
      let empty = document.createElement('p');
      empty.className = 'comments-note';
      empty.textContent = 'كن أول من يشارك برأيه أو قراءته النقدية حول هذا النص.';
      listWrap.append(empty);
    } else {
      items.forEach(c => listWrap.append(renderCommentItem(c)));
    }
  }

  let form = document.createElement('form');
  form.style.cssText = 'display:grid;gap:10px;margin-top:12px;';

  let nameInput = document.createElement('input');
  nameInput.type = 'text';
  nameInput.required = true;
  nameInput.placeholder = 'الاسم الكريم *';
  nameInput.style.cssText = 'padding:10px 12px;border-radius:6px;border:1px solid rgba(212,175,55,0.35);background:rgba(255,255,255,0.06);color:inherit;font-family:inherit;';

  let textInput = document.createElement('textarea');
  textInput.required = true;
  textInput.rows = 3;
  textInput.placeholder = 'اكتب تعليقك أو انطباعك الأدبي هنا... *';
  textInput.style.cssText = 'padding:10px 12px;border-radius:6px;border:1px solid rgba(212,175,55,0.35);background:rgba(255,255,255,0.06);color:inherit;font-family:inherit;resize:vertical;';

  let submitBtn = document.createElement('button');
  submitBtn.type = 'submit';
  submitBtn.className = 'gold-btn';
  submitBtn.textContent = 'نشر التعليق ✦';
  submitBtn.style.justifySelf = 'start';

  let note = document.createElement('div');
  note.style.cssText = 'color:#d4af37;font-size:0.9rem;';

  form.append(nameInput, textInput, submitBtn, note);

  form.onsubmit = async (e) => {
    e.preventDefault();
    let name = nameInput.value.trim();
    let comment = textInput.value.trim();
    if(!name || !comment) return;
    submitBtn.disabled = true;

    let entry = { name, comment, date: new Date().toLocaleDateString('ar-EG') };

    try {
      let existing = JSON.parse(localStorage.getItem(storageKey) || '[]');
      existing.push(entry);
      localStorage.setItem(storageKey, JSON.stringify(existing));
    } catch(_){}

    if(cfg.firebaseDatabaseURL){
      try {
        await fetch(cfg.firebaseDatabaseURL.replace(/\/$/, '') + '/comments/' + esc(id) + '.json', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify(entry)
        });
      } catch(_){}
    }

    try {
      let fd = new URLSearchParams();
      fd.append('form-name', 'manbar-comments');
      fd.append('postId', String(id));
      fd.append('postTitle', String(title || ''));
      fd.append('name', name);
      fd.append('comment', comment);
      await fetch('/', {
        method: 'POST',
        headers: {'Content-Type': 'application/x-www-form-urlencoded'},
        body: fd.toString()
      });
    } catch(_){}

    nameInput.value = '';
    textInput.value = '';
    submitBtn.disabled = false;
    note.textContent = '✓ تم نشر تعليقك بنجاح.';
    loadComments();
  };

  area.append(listWrap, form);
  loadComments();
}

// 3. تفعيل عداد الزوار العام ونماذج الصفحة الرئيسية
function initMainPageFeatures(){
  let counterEl = document.getElementById('visitorCounter');
  if(counterEl){
    fetch('https://api.counterapi.dev/v1/majallat-almanbar/site-visits/up')
      .then(r => r.json())
      .then(d => {
        if(d && typeof d.count === 'number'){
          counterEl.textContent = d.count.toLocaleString('ar') + ' زيارة';
        }
      })
      .catch(() => { counterEl.textContent = 'مفعّل'; });
  }

  function bindAjaxForm(formId, msgId){
    let f = document.getElementById(formId);
    let m = document.getElementById(msgId);
    if(!f) return;
    f.addEventListener('submit', async (e) => {
      e.preventDefault();
      let fd = new URLSearchParams(new FormData(f));
      try {
        await fetch('/', {
          method: 'POST',
          headers: {'Content-Type': 'application/x-www-form-urlencoded'},
          body: fd.toString()
        });
        f.reset();
        if(m) m.hidden = false;
      } catch(_){
        f.submit();
      }
    });
  }

  bindAjaxForm('submissionForm', 'submissionMsg');
  bindAjaxForm('newsletterForm', 'newsletterMsg');
}

if(document.readyState === 'loading'){
  document.addEventListener('DOMContentLoaded', initMainPageFeatures);
} else {
  initMainPageFeatures();
}

window.ManbarFeatures = {
  render: (shareId, commentsId, url, title, id) => {
    renderShares(shareId, url, title, id);
    comments(commentsId, url, id, title);
  }
};
})();
