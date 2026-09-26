// Офлайн-режим: приложение целиком хранится на телефоне.
const VERSION='rashody-v4';
const CORE=['./','./index.html','./manifest.webmanifest','./icon-192.png','./icon-512.png','./icon-192-maskable.png','./icon-512-maskable.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(VERSION).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==VERSION).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{
  const req=e.request;if(req.method!=='GET')return;
  const url=new URL(req.url);
  // Шрифты Google: берём из кэша, при первом запуске с интернетом докачиваем
  if(url.hostname.endsWith('fonts.googleapis.com')||url.hostname.endsWith('fonts.gstatic.com')){
    e.respondWith(caches.open(VERSION).then(async c=>{const hit=await c.match(req);if(hit)return hit;try{const r=await fetch(req);if(r.ok||r.type==='opaque')c.put(req,r.clone());return r}catch(_){return new Response('',{status:503})}}));
    return;
  }
  if(url.origin!==location.origin)return;
  // Файлы приложения: сначала кэш (мгновенно и без сети), обновление в фоне
  e.respondWith(caches.open(VERSION).then(async c=>{
    const hit=await c.match(req,{ignoreSearch:true})||(req.mode==='navigate'?await c.match('./index.html'):null);
    const net=fetch(req).then(r=>{if(r.ok)c.put(req,r.clone());return r}).catch(()=>null);
    return hit||(await net)||new Response('Нет сети',{status:503});
  }));
});
