/* Dark Bot AI — Admin portal */
(function () {
  'use strict';

  function esc(v){return String(v==null?'':v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');}
  function money(v){return '$'+Number(v||0).toFixed(2);}
  function pill(status){
    var good=['active','paid','approved','received'];
    var bad=['suspended','cancelled','refunded','failed'];
    var cls=good.indexOf(status)>=0?'good':(bad.indexOf(status)>=0?'bad':'warn');
    return '<span class="status-pill '+cls+'">'+esc(String(status||'').replace(/_/g,' '))+'</span>';
  }
  function msg(text,type){var e=document.getElementById('admin-message'); if(e){e.textContent=text||'';e.className='portal-message '+(type||'');}}
  function val(id){return document.getElementById(id).value.trim();}

  async function run(){
    try{
      var auth=window.DarkBotAffiliateAuth;
      var sb=auth.getClient();
      var sr=await sb.auth.getSession();
      var session=sr.data&&sr.data.session;
      if(!session){location.href='admin-login.html';return;}

      var pr=await sb.from('profiles').select('full_name,role').eq('id',session.user.id).maybeSingle();
      if(pr.error) throw pr.error;
      if(!pr.data||pr.data.role!=='admin') throw new Error('This account is not an admin account.');

      document.getElementById('admin-email').textContent=session.user.email||'';
      document.getElementById('logout-btn').addEventListener('click',async function(){await sb.auth.signOut();location.href='admin-login.html';});

      async function load(){
        msg('Loading…');
        var a=await sb.from('affiliates').select('id,user_id,affiliate_code,name,brand_name,email,telegram_username,platform,commission_rate,status,joined_at,created_at').order('created_at',{ascending:false});
        var c=await sb.from('customers').select('id,customer_code,affiliate_id,referral_code,full_name,telegram_username,telegram_reference,plan_name,revenue,payment_status,status,paid_at,activated_at,created_at').order('created_at',{ascending:false});
        var cm=await sb.from('commissions').select('id,affiliate_id,customer_id,revenue_amount,commission_rate,commission_amount,status,approved_at,paid_at,notes,created_at').order('created_at',{ascending:false});
        var r=await sb.from('referral_events').select('id,affiliate_id,event_type,visitor_id,referral_code,landing_page,created_at').order('created_at',{ascending:false}).limit(2000);
        if(a.error)throw a.error;if(c.error)throw c.error;if(cm.error)throw cm.error;if(r.error)throw r.error;
        var affiliates=a.data||[], customers=c.data||[], commissions=cm.data||[], refs=r.data||[];
        window._adminData={affiliates:affiliates,customers:customers,commissions:commissions,refs:refs};
        var sel=document.getElementById('customer-affiliate'); if(sel){ sel.innerHTML='<option value="">Direct / Unassigned</option>'+affiliates.filter(function(x){return x.status==='active'}).map(function(x){return '<option value="'+esc(x.id)+'">'+esc(x.name)+' · '+esc(x.affiliate_code)+'</option>';}).join(''); }
        var paid=customers.filter(function(x){return x.payment_status==='received';});
        var revenue=paid.reduce(function(s,x){return s+Number(x.revenue||0)},0);
        var pending=commissions.filter(function(x){return x.status==='pending'||x.status==='approved'}).reduce(function(s,x){return s+Number(x.commission_amount||0)},0);
        var paidComm=commissions.filter(function(x){return x.status==='paid'}).reduce(function(s,x){return s+Number(x.commission_amount||0)},0);
        document.getElementById('stat-affiliates').textContent=String(affiliates.length);
        document.getElementById('stat-active').textContent=String(affiliates.filter(function(x){return x.status==='active'}).length);
        document.getElementById('stat-customers').textContent=String(customers.length);
        document.getElementById('stat-revenue').textContent=money(revenue);
        document.getElementById('stat-pending').textContent=money(pending);
        document.getElementById('stat-paid').textContent=money(paidComm);
        document.getElementById('stat-clicks').textContent=String(refs.filter(function(x){return x.event_type==='visit'}).length);
        document.getElementById('stat-telegram').textContent=String(refs.filter(function(x){return x.event_type==='telegram_click'}).length);

        var amap={};affiliates.forEach(function(x){amap[x.id]=x});
        document.getElementById('affiliates-body').innerHTML=affiliates.length?affiliates.map(function(x){return '<tr><td><strong>'+esc(x.name)+'</strong><br><span class="table-muted">'+esc(x.brand_name||'')+'</span></td><td><code>'+esc(x.affiliate_code)+'</code></td><td>'+esc(x.email||'—')+'</td><td>'+Number(x.commission_rate||0).toFixed(2)+'%</td><td>'+pill(x.status)+'</td><td>'+esc(x.telegram_username||'—')+'</td></tr>'}).join(''):'<tr><td colspan="6">No affiliates yet.</td></tr>';
        document.getElementById('customers-body').innerHTML=customers.length?customers.map(function(x){var a=amap[x.affiliate_id];return '<tr><td><strong>'+esc(x.customer_code)+'</strong><br><span class="table-muted">'+esc(x.full_name||'')+'</span></td><td>'+esc(a?a.name:'Direct / Unassigned')+'</td><td>'+esc(x.telegram_reference||'—')+'</td><td>'+money(x.revenue)+'</td><td>'+pill(x.payment_status)+'</td><td>'+pill(x.status)+'</td></tr>'}).join(''):'<tr><td colspan="7">No customers yet.</td></tr>';
        document.getElementById('commissions-body').innerHTML=commissions.length?commissions.map(function(x){var a=amap[x.affiliate_id];return '<tr><td>'+esc(a?a.name:'—')+'</td><td>'+esc(x.customer_id)+'</td><td>'+money(x.commission_amount)+'</td><td>'+pill(x.status)+'</td><td><button class="btn btn-small btn-ghost edit-comm" data-id="'+esc(x.id)+'">Manage</button></td></tr>'}).join(''):'<tr><td colspan="5">No commissions yet.</td></tr>';
        document.getElementById('refs-body').innerHTML=refs.slice(0,150).map(function(x){var a=amap[x.affiliate_id];return '<tr><td>'+esc(a?a.name:'—')+'</td><td><code>'+esc(x.referral_code)+'</code></td><td>'+pill(x.event_type)+'</td><td>'+esc(x.visitor_id||'—')+'</td><td>'+new Date(x.created_at).toLocaleString()+'</td></tr>'}).join('')||'<tr><td colspan="5">No referral events recorded yet.</td></tr>';
        msg('Dashboard loaded.','ok');
      }

      document.getElementById('affiliate-form').addEventListener('submit',async function(e){
        e.preventDefault();
        try{
          var payload={user_id:val('affiliate-user-id')||null,affiliate_code:val('affiliate-code').toLowerCase(),name:val('affiliate-name'),brand_name:val('affiliate-brand')||null,email:val('affiliate-email')||null,telegram_username:val('affiliate-telegram')||null,platform:val('affiliate-platform')||null,profile_url:val('affiliate-profile')||null,commission_rate:Number(val('affiliate-rate')||30),status:'active',joined_at:new Date().toISOString()};
          if(!payload.affiliate_code||!payload.name)throw new Error('Affiliate name and code are required.');
          var q=await sb.from('affiliates').insert(payload).select().single();if(q.error)throw q.error;
          this.reset();msg('Affiliate created.','ok');await load();
        }catch(err){msg(err.message||'Unable to create affiliate.','error')}
      });

      document.getElementById('customer-form').addEventListener('submit',async function(e){
        e.preventDefault();
        try{
          var aid=val('customer-affiliate')||null;
          var ref=val('customer-referral')||null;
          var code='CUS-'+Date.now().toString(36).toUpperCase();
          var revenue=Number(val('customer-revenue')||0);
          var payment=val('customer-payment');
          var status=val('customer-status');
          var insert={customer_code:code,affiliate_id:aid,referral_code:ref,full_name:val('customer-name')||null,telegram_username:val('customer-telegram')||null,telegram_reference:val('customer-reference')||null,plan_name:val('customer-plan')||'Lifetime Access',revenue:revenue,payment_status:payment,status:status};
          if(payment==='received')insert.paid_at=new Date().toISOString();
          var q=await sb.from('customers').insert(insert).select().single();if(q.error)throw q.error;
          if(aid&&payment==='received'&&revenue>0){
            var af=window._adminData.affiliates.find(function(x){return x.id===aid});
            var rate=Number(af&&af.commission_rate||30);
            var cq=await sb.from('commissions').insert({affiliate_id:aid,customer_id:q.data.id,revenue_amount:revenue,commission_rate:rate,commission_amount:revenue*rate/100,status:'pending'});
            if(cq.error)throw cq.error;
          }
          this.reset();msg('Customer created and commission recorded where applicable.','ok');await load();
        }catch(err){msg(err.message||'Unable to create customer.','error')}
      });

      document.getElementById('commission-form').addEventListener('submit',async function(e){
        e.preventDefault();
        try{var id=val('commission-id');var status=val('commission-status');var data={status:status};if(status==='approved')data.approved_at=new Date().toISOString();if(status==='paid')data.paid_at=new Date().toISOString();var q=await sb.from('commissions').update(data).eq('id',id);if(q.error)throw q.error;this.reset();msg('Commission updated.','ok');await load();}catch(err){msg(err.message||'Unable to update commission.','error')}
      });

      document.getElementById('refresh-btn').addEventListener('click',load);
      await load();
    }catch(err){msg(err.message||'Unable to load admin dashboard.','error')}
  }
  run();
})();
