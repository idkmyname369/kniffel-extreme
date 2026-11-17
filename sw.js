// Kniffel Extreme – Offline-Unterstützung: immer zuerst aus dem Netz laden, ohne Netz aus dem Zwischenspeicher
const CACHE='kx-v82';
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
// Einladungen als Mitteilung
self.addEventListener('push',e=>{let body='Du wurdest zu einer Runde eingeladen. Tippe, um beizutreten.';try{const t=e.data&&e.data.text();if(t)body=t}catch(x){}
  e.waitUntil(self.registration.showNotification('Kniffel Royale',{body,icon:'icon-192.png',badge:'icon-192.png',tag:'kx-invite',renotify:true}))});
self.addEventListener('notificationclick',e=>{e.notification.close();
  e.waitUntil(self.clients.matchAll({type:'window',includeUncontrolled:true}).then(cs=>{for(const c of cs){c.postMessage({kx:'inv'});if('focus' in c)return c.focus()}return self.clients.openWindow('./?inv=1')}))});
