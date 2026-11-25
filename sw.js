// Kniffel Extreme – Offline-Unterstützung: immer zuerst aus dem Netz laden, ohne Netz aus dem Zwischenspeicher
const CACHE='kx-v143';
self.addEventListener('install',e=>self.skipWaiting());
self.addEventListener('activate',e=>e.waitUntil(self.clients.claim()));
self.addEventListener('fetch',e=>{
  const r=e.request;if(r.method!=='GET')return;
  const u=new URL(r.url);
  if(/firebaseio|firebasedatabase|firestore\.googleapis|identitytoolkit|securetoken/.test(u.hostname))return;
  const cacheable=u.origin===self.location.origin||/gstatic\.com|fonts\.googleapis\.com/.test(u.hostname);
  if(!cacheable)return;
  if(/gstatic\.com|fonts\.googleapis\.com/.test(u.hostname)){e.respondWith(caches.match(r).then(m=>m||fetch(r).then(res=>{if(res&&res.ok){const cp=res.clone();caches.open(CACHE).then(c=>c.put(r,cp))}return res})));return}
  e.respondWith(fetch(r).then(res=>{if(res&&res.ok){const cp=res.clone();caches.open(CACHE).then(c=>c.put(r,cp))}return res})
    .catch(()=>caches.match(r).then(m=>m||(r.mode==='navigate'?caches.match('./index.html').then(x=>x||caches.match('./')):undefined))));
});
// Mitteilungen (Einladungen, „Du bist dran“)
self.addEventListener('push',e=>{let body='Du wurdest zu einer Runde eingeladen. Tippe, um beizutreten.',url='./?inv=1',tag='kx-invite';
  try{const t=e.data&&e.data.text();if(t){if(t.charAt(0)==='{'){const j=JSON.parse(t);body=j.b||body;url=j.u||url;tag=j.g||tag}else body=t}}catch(x){}
  e.waitUntil(self.registration.showNotification('Kniffel Royale',{body,icon:'icon-192.png',badge:'icon-192.png',tag,renotify:true,data:{url}}))});
self.addEventListener('notificationclick',e=>{e.notification.close();const url=(e.notification.data&&e.notification.data.url)||'./?inv=1';
  const q=new URL(url,self.registration.scope).searchParams,msg=q.get('game')?{kx:'game',code:q.get('game')}:{kx:'inv'};
  e.waitUntil(self.clients.matchAll({type:'window',includeUncontrolled:true}).then(cs=>{for(const c of cs){c.postMessage(msg);if('focus' in c)return c.focus()}return self.clients.openWindow(url)}))});
