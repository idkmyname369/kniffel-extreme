// Kniffel Extreme – Offline-Unterstützung: immer zuerst aus dem Netz laden, ohne Netz aus dem Zwischenspeicher
const CACHE='kx-v73';
self.addEventListener('install',e=>self.skipWaiting());
self.addEventListener('activate',e=>e.waitUntil(self.clients.claim()));
self.addEventListener('fetch',e=>{
  const r=e.request;if(r.method!=='GET')return;
  const u=new URL(r.url);
  if(/firebaseio|firebasedatabase|firestore\.googleapis|identitytoolkit|securetoken/.test(u.hostname))return;
  const cacheable=u.origin===self.location.origin||/gstatic\.com|fonts\.googleapis\.com/.test(u.hostname);
  if(!cacheable)return;
  e.respondWith(fetch(r).then(res=>{if(res&&res.ok){const cp=res.clone();caches.open(CACHE).then(c=>c.put(r,cp))}return res})
    .catch(()=>caches.match(r).then(m=>m||(r.mode==='navigate'?caches.match('./index.html').then(x=>x||caches.match('./')):undefined))));
});
