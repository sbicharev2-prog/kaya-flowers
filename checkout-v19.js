
(() => {
'use strict';
document.addEventListener('DOMContentLoaded',()=>{
  const $=(s,r=document)=>r.querySelector(s);
  const $$=(s,r=document)=>[...r.querySelectorAll(s)];
  const CART_KEY='kaya_cart_v1';
  let cart=[];
  try{cart=JSON.parse(localStorage.getItem(CART_KEY)||'[]')}catch(e){cart=[]}
  const money=v=>`${Math.round(Number(v)||0)} zł`;

  function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
  function toast(t){const e=$('#toast');e.textContent=t;e.classList.add('show');clearTimeout(toast._t);toast._t=setTimeout(()=>e.classList.remove('show'),1600)}

  function renderSide(){
    const box=$('#sideItems'), total=$('#sideTotal');
    box.innerHTML=cart.map(x=>`<div class="side-item"><div><b>${esc(x.name)}</b><small>${Number(x.qty||1)} × ${money(x.unitPrice||x.price)}</small></div><strong>${money(x.price)}</strong></div>`).join('');
    total.textContent=money(cart.reduce((s,x)=>s+Number(x.price||0),0));
  }

  if(!cart.length){
    $('#checkoutForm').classList.add('hidden');
    $('#emptyCheckout').classList.remove('hidden');
  }
  renderSide();

  const steps=$$('.step'), prog=$$('[data-progress]');
  function setStep(n){
    steps.forEach(s=>s.classList.toggle('active',Number(s.dataset.step)===n));
    prog.forEach(p=>p.classList.toggle('active',Number(p.dataset.progress)===n));
    if(n===3) renderFinal();
    window.scrollTo({top:0,behavior:'smooth'});
  }

  $$('input[name="delivery"]').forEach(r=>r.addEventListener('change',()=>{
    $$('.delivery-card').forEach(l=>l.classList.toggle('active',l.contains($('input[name="delivery"]:checked'))));
    const courier=$('input[name="delivery"]:checked').value.includes('Kurier');
    $('#addressWrap').classList.toggle('hidden',!courier);
  }));

  $('#isGift').addEventListener('change',e=>$('#recipientFields').classList.toggle('hidden',!e.target.checked));

  $$('[data-next]').forEach(b=>b.addEventListener('click',()=>{
    const n=Number(b.dataset.next);
    if(n===2){
      const method=$('input[name="delivery"]:checked').value;
      if(!$('#deliveryDate').value){toast('Wybierz datę');return}
      if(!$('#deliveryTime').value){toast('Wybierz godzinę');return}
      if(method.includes('Kurier')&&!$('#deliveryAddress').value.trim()){toast('Podaj adres dostawy');return}
    }
    if(n===3){
      if(!$('#customerName').value.trim()){toast('Podaj imię i nazwisko');return}
      if(!$('#customerPhone').value.trim()){toast('Podaj telefon');return}
      const mail=$('#customerEmail').value.trim();
      if(!mail||!mail.includes('@')){toast('Podaj poprawny e-mail');return}
      if($('#isGift').checked&&!$('#recipientName').value.trim()){toast('Podaj imię odbiorcy');return}
    }
    setStep(n);
  }));
  $$('[data-back]').forEach(b=>b.addEventListener('click',()=>setStep(Number(b.dataset.back))));

  $$('input[name="payment"]').forEach(r=>r.addEventListener('change',()=>{
    $$('.payment').forEach(l=>l.classList.toggle('active',l.contains($('input[name="payment"]:checked'))));
  }));

  function renderFinal(){
    const sum=cart.reduce((s,x)=>s+Number(x.price||0),0);
    const method=$('input[name="delivery"]:checked').value;
    const address=method.includes('Kurier')?$('#deliveryAddress').value:'Mleczarska 9E, Piaseczno';
    const recipient=$('#isGift').checked?($('#recipientName').value||'—'):$('#customerName').value;
    const note=$('#orderNote').value.trim()||'—';
    $('#finalSummary').innerHTML=
      cart.map(x=>`<div class="final-row"><span>${esc(x.name)} × ${Number(x.qty||1)}</span><b>${money(x.price)}</b></div>`).join('')+
      `<div class="final-row"><span>Dostawa</span><b>${esc(method)}</b></div>`+
      `<div class="final-row"><span>Adres / odbiór</span><b>${esc(address)}</b></div>`+
      `<div class="final-row"><span>Termin</span><b>${esc($('#deliveryDate').value)} • ${esc($('#deliveryTime').value)}</b></div>`+
      `<div class="final-row"><span>Odbiorca</span><b>${esc(recipient)}</b></div>`+
      `<div class="final-row"><span>Życzenia</span><b>${esc(note)}</b></div>`+
      `<div class="final-total"><span>Razem</span><strong>${money(sum)}</strong></div>`;
  }

  $('#checkoutForm').addEventListener('submit',e=>{
    e.preventDefault();
    if(!$('#terms').checked){toast('Zaakceptuj warunki zamówienia');return}
    localStorage.removeItem(CART_KEY);
    $('#success').classList.add('open');
  });
});
})();
