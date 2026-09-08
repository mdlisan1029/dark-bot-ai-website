/* Dark Bot AI — referral attribution + Vercel event logging (no bot required). */
(function () {
  'use strict';
  var STORAGE_KEY='darkbot_affiliate_attribution_v1', VISITOR_KEY='darkbot_visitor_id_v1';
  function id(prefix){ if(window.crypto&&crypto.randomUUID)return prefix+'_'+crypto.randomUUID(); return prefix+'_'+Date.now()+'_'+Math.random().toString(36).slice(2,10); }
  function visitor(){ try{var x=localStorage.getItem(VISITOR_KEY);if(x)return x;x=id('visitor');localStorage.setItem(VISITOR_KEY,x);return x;}catch(_){return id('visitor');} }
  function ref(){ try{return new URLSearchParams(location.search).get('ref');}catch(_){return null;} }
  function get(){ try{var x=localStorage.getItem(STORAGE_KEY);return x?JSON.parse(x):null;}catch(_){return null;} }
  function save(code){ if(!code)return null; code=String(code).trim().toLowerCase();if(!/^[a-z0-9][a-z0-9-]{1,63}$/.test(code))return null;var p={referralCode:code,visitorId:visitor(),capturedAt:new Date().toISOString(),landingPath:location.pathname};try{localStorage.setItem(STORAGE_KEY,JSON.stringify(p));}catch(_){} return p; }
  function logEvent(type,a){ if(!a)return; try{navigator.sendBeacon&&navigator.sendBeacon('/api/referral',new Blob([JSON.stringify({referralCode:a.referralCode,visitorId:a.visitorId,landingPage:a.landingPath,eventType:type})],{type:'application/json'}));}catch(_){fetch('/api/referral',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({referralCode:a.referralCode,visitorId:a.visitorId,landingPage:a.landingPath,eventType:type}),keepalive:true}).catch(function(){});} }
  function update(a){ if(!a)return; document.querySelectorAll('a[href*="t.me/dark_bot_ai_hina"]').forEach(function(link){try{var u=new URL(link.href);var base=link.dataset.telegramBaseText||'Hello Dark Bot AI, I want to buy the $25 Lifetime Access.';link.dataset.telegramBaseText=base;u.searchParams.set('text',base+'\n\nReferral: '+a.referralCode+'\nReference: '+a.visitorId);link.href=u.toString();link.addEventListener('click',function(){logEvent('telegram_click',a);},{once:true});}catch(_){}});}
  var a=get(), r=ref(); if(r) a=save(r)||a; if(a) logEvent('visit',a);
  window.DarkBotAffiliate={getAttribution:get,getVisitorId:visitor};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',function(){update(a);});else update(a);
})();
