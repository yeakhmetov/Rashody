// Офлайн-режим: приложение открывается мгновенно из копии на телефоне.
// Свежая версия проверяется в фоне; когда она скачана, приложение перезапускается само.
const VERSION='rashody-v14';
const CORE=['./','./index.html','./manifest.webmanifest','./icon-192.png','./icon-512.png','./icon-192-maskable.png','./icon-512-maskable.png','./apple-touch-icon.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(VERSION).then(c=>c.addAll(CORE.map(u=>new Request(u,{cache:'reload'})))).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==VERSION).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{
  const req=e.request;if(req.method!=='GET')return;
  const url=new URL(req.url);
  if(url.hostname.endsWith('fonts.googleapis.com')||url.hostname.endsWith('fonts.gstatic.com')){
    e.respondWith(caches.open(VERSION).then(async c=>{const hit=await c.match(req);if(hit)return hit;
      try{const ctrl=new AbortController();const t=setTimeout(()=>ctrl.abort(),2500);const r=await fetch(req,{signal:ctrl.signal});clearTimeout(t);if(r.ok||r.type==='opaque')c.put(req,r.clone());return r}catch(_){return new Response('',{status:503})}}));
    return;
  }
  if(url.origin!==location.origin)return;
  if(url.pathname.endsWith('/sw.js'))return;
  // Сначала копия на телефоне (без ожидания сети), сеть — только если копии нет
  e.respondWith(caches.open(VERSION).then(async c=>{
    const hit=await c.match(req,{ignoreSearch:true})||(req.mode==='navigate'?await c.match('./index.html'):null);
    if(hit)return hit;
    try{const r=await fetch(req);if(r.ok)c.put(req,r.clone());return r}catch(_){return new Response('Нет сети',{status:503})}
  }));
});
