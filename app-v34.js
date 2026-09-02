
(() => {
'use strict';

document.addEventListener('DOMContentLoaded', () => {
  const $ = (s, root=document) => root.querySelector(s);
  const $$ = (s, root=document) => [...root.querySelectorAll(s)];

  const STORAGE_KEY = 'kaya_products_v1';
  const CART_KEY = 'kaya_cart_v1';
  const WISH_KEY = 'kaya_wishlist_v1';
  const DEFAULT_PRODUCTS = window.KAYA_DEFAULT_PRODUCTS || [];

  const clone = x => JSON.parse(JSON.stringify(x));
  const money = v => `${Math.round(Number(v) || 0)} zł`;

  function getProducts(){
    try{
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : clone(DEFAULT_PRODUCTS);
    }catch(e){ return clone(DEFAULT_PRODUCTS); }
  }
  function getCart(){
    try{return JSON.parse(localStorage.getItem(CART_KEY) || '[]')}catch(e){return []}
  }
  function saveCart(){ localStorage.setItem(CART_KEY, JSON.stringify(cart)); }
  function getWish(){
    try{return JSON.parse(localStorage.getItem(WISH_KEY) || '[]')}catch(e){return []}
  }
  function saveWish(ids){ localStorage.setItem(WISH_KEY, JSON.stringify(ids)); }

  function ensureSizes(p){
    if(Array.isArray(p.sizes) && p.sizes.length) return p.sizes;
    const b = Number(p.price) || 0;
    return [
      {name:'Small',price:b},
      {name:'Medium',price:b+45},
      {name:'Large',price:b+90},
      {name:'Grande',price:b+140}
    ];
  }

  function toast(text){
    const el = $('#toast');
    if(!el) return;
    el.textContent = text;
    el.classList.add('show');
    clearTimeout(toast._t);
    toast._t = setTimeout(()=>el.classList.remove('show'),1700);
  }

  // Elements
  const header = $('#header'), nav = $('#nav');
  const cartEl = $('#cart'), shade = $('#shade');
  const customModal = $('#modal');
  const productModal = $('#productModal'), wishlistDrawer = $('#wishlistDrawer');
  const successModal = $('#orderSuccess'), searchModal = $('#searchModal');
  const lightbox = $('#lightbox');

  // Overlay management
  function closeCart(){ cartEl?.classList.remove('open'); shade?.classList.remove('show'); }
  function closeCustom(){ customModal?.classList.remove('open'); }
  function closeCheckout(){}
  function closeProduct(){ productModal?.classList.remove('open'); }
  function closeWishlist(){ wishlistDrawer?.classList.remove('open'); }
  function closeSuccess(){ successModal?.classList.remove('open'); }
  function closeSearch(){ searchModal?.classList.remove('open'); searchModal?.setAttribute('aria-hidden','true'); }
  function closeAll(){
    closeCart(); closeCustom(); closeProduct(); closeWishlist(); closeSuccess(); closeSearch();
    lightbox?.classList.remove('open');
  }
  function openCart(){
    closeCustom(); closeCheckout(); closeProduct(); closeWishlist(); closeSearch();
    renderCart();
    cartEl?.classList.add('open'); shade?.classList.add('show');
  }
  function openCustom(){
    closeCart(); closeCheckout(); closeProduct(); closeWishlist(); closeSearch();
    customModal?.classList.add('open');
  }

  // Header/nav
  if(header) window.addEventListener('scroll',()=>header.classList.toggle('scrolled',window.scrollY>25),{passive:true});
  $('#menuBtn')?.addEventListener('click',()=>nav?.classList.toggle('open'));
  $$('nav a').forEach(a=>a.addEventListener('click',()=>nav?.classList.remove('open')));
  $('#shopNowBtn')?.addEventListener('click',()=>$('#oferta')?.scrollIntoView({behavior:'smooth'}));
  $('#deliveryShopBtn')?.addEventListener('click',()=>$('#oferta')?.scrollIntoView({behavior:'smooth'}));

  // Cart
  let cart = getCart();
  function renderCart(){
    const items=$('#cartItems'), count=$('#cartCount'), total=$('#cartTotal');
    const qtyTotal=cart.reduce((n,x)=>n+Number(x.qty||1),0);
    if(count) count.textContent=qtyTotal;
    if(!items || !total) return;
    if(!cart.length){
      items.innerHTML='<p class="cart-empty">Koszyk jest pusty.</p>';
      total.textContent='0 zł';
      return;
    }
    items.innerHTML=cart.map((x,i)=>`
      <div class="cart-item">
        <div>
          <b>${escapeHtml(x.name)}</b>
          <small>${Number(x.qty||1)} × ${money(x.unitPrice||x.price)}</small>
        </div>
        <div class="cart-item-right">
          <strong>${money(x.price)}</strong>
          <button type="button" data-remove="${i}">Usuń</button>
        </div>
      </div>`).join('');
    total.textContent=money(cart.reduce((s,x)=>s+Number(x.price||0),0));
    $$('[data-remove]',items).forEach(b=>b.addEventListener('click',()=>{
      cart.splice(Number(b.dataset.remove),1); saveCart(); renderCart();
    }));
  }
  $('#cartBtn')?.addEventListener('click',openCart);
  $('#closeCart')?.addEventListener('click',closeCart);
  shade?.addEventListener('click',closeCart);

  // Products
  let activeFilter='all', activeProduct=null, activeSizeIndex=0, pdQty=1;
  function renderProducts(){
    const grid=$('#productsGrid');
    if(!grid) return;
    const list=getProducts()
      .filter(p=>p.available!==false)
      .filter(p=>activeFilter==='all'||p.category===activeFilter);

    if(!list.length){
      grid.innerHTML='<div class="products-empty">Brak produktów w tej kategorii.</div>';
      return;
    }
    grid.innerHTML=list.map(p=>`
      <article class="card" data-id="${escapeAttr(p.id)}">
        <div class="pic">
          <img class="js-product-open" src="${escapeAttr(p.image)}" alt="${escapeAttr(p.name)}">
          ${p.badge?`<span>${escapeHtml(p.badge)}</span>`:''}
          <button class="heart js-card-wish" type="button" aria-label="Dodaj do ulubionych">♡</button>
        </div>
        <div class="meta">
          <div><h3 class="js-product-open">${escapeHtml(p.name)}</h3><p>${escapeHtml(p.description||'')}</p></div>
          <strong>od ${money(ensureSizes(p)[0].price)}</strong>
        </div>
        <button class="add js-product-open" type="button">WYBIERZ OPCJE</button>
      </article>`).join('');

    $$('.js-product-open',grid).forEach(el=>el.addEventListener('click',()=>{
      openProductDetail(el.closest('.card').dataset.id);
    }));
    $$('.js-card-wish',grid).forEach(btn=>btn.addEventListener('click',e=>{
      e.stopPropagation();
      toggleWish(btn.closest('.card').dataset.id);
      toast('Zmieniono ulubione');
    }));
  }

  $$('.filter').forEach(f=>f.addEventListener('click',()=>{
    $$('.filter').forEach(x=>x.classList.remove('active'));
    f.classList.add('active');
    activeFilter=f.dataset.filter||'all';
    renderProducts();
  }));

  // Wishlist
  function toggleWish(id){
    let ids=getWish();
    ids=ids.includes(id)?ids.filter(x=>x!==id):[...ids,id];
    saveWish(ids); renderWishCount();
    if(activeProduct && String(activeProduct.id)===String(id) && $('#pdWish')){
      $('#pdWish').textContent=ids.includes(id)?'♥':'♡';
    }
  }
  function renderWishCount(){
    if($('#wishlistCount')) $('#wishlistCount').textContent=getWish().length;
  }
  function renderWishlist(){
    renderWishCount();
    const box=$('#wishlistItems');
    if(!box) return;
    const products=getProducts();
    const list=getWish().map(id=>products.find(p=>String(p.id)===String(id))).filter(Boolean);
    box.innerHTML=list.length?list.map(p=>`
      <div class="wish-row" data-id="${escapeAttr(p.id)}">
        <img src="${escapeAttr(p.image)}" alt="${escapeAttr(p.name)}">
        <div><b>${escapeHtml(p.name)}</b><small>od ${money(ensureSizes(p)[0].price)}</small></div>
        <button class="wish-open" type="button">Zobacz</button>
        <button class="wish-remove" type="button" aria-label="Usuń">×</button>
      </div>`).join(''):'<p class="cart-empty">Brak ulubionych produktów.</p>';
    $$('.wish-open',box).forEach(b=>b.addEventListener('click',()=>{
      const id=b.closest('.wish-row').dataset.id; closeWishlist(); openProductDetail(id);
    }));
    $$('.wish-remove',box).forEach(b=>b.addEventListener('click',()=>{
      const id=b.closest('.wish-row').dataset.id;
      saveWish(getWish().filter(x=>String(x)!==String(id))); renderWishlist();
    }));
  }
  $('#wishlistBtn')?.addEventListener('click',()=>{
    closeCart(); closeCustom(); closeCheckout(); closeProduct(); closeSearch();
    renderWishlist(); wishlistDrawer?.classList.add('open');
  });
  $('#wishlistClose')?.addEventListener('click',closeWishlist);

  // Product detail
  function updatePdPrice(){
    if(!activeProduct) return;
    const base=Number(ensureSizes(activeProduct)[activeSizeIndex]?.price||0);
    const add=$$('.addon-options input:checked').reduce((s,i)=>s+Number(i.dataset.price||0),0);
    if($('#pdPrice')) $('#pdPrice').textContent=money((base+add)*pdQty);
  }
  function openProductDetail(id){
    activeProduct=getProducts().find(p=>String(p.id)===String(id));
    if(!activeProduct) return;
    closeCart(); closeCustom(); closeCheckout(); closeWishlist(); closeSearch();

    activeSizeIndex=0; pdQty=1;
    $('#pdImage').src=activeProduct.image;
    $('#pdImage').alt=activeProduct.name;
    $('#pdName').textContent=activeProduct.name;
    $('#pdDescription').textContent=activeProduct.description||'';
    $('#qtyValue').textContent='1';

    const sizes=ensureSizes(activeProduct);
    $('#pdSizes').innerHTML=sizes.map((s,i)=>`
      <button type="button" data-size="${i}" class="${i===0?'active':''}">
        ${escapeHtml(s.name)}<small>${money(s.price)}</small>
      </button>`).join('');
    $$('[data-size]',$('#pdSizes')).forEach(b=>b.addEventListener('click',()=>{
      activeSizeIndex=Number(b.dataset.size);
      $$('[data-size]',$('#pdSizes')).forEach(x=>x.classList.toggle('active',x===b));
      updatePdPrice();
    }));
    $$('.addon-options input').forEach(i=>{i.checked=false;i.onchange=updatePdPrice});
    $('#pdWish').textContent=getWish().includes(activeProduct.id)?'♥':'♡';
    productModal?.classList.add('open');
    updatePdPrice();
  }
  $('#productModalClose')?.addEventListener('click',closeProduct);
  productModal?.addEventListener('click',e=>{if(e.target===productModal)closeProduct()});
  $('#qtyMinus')?.addEventListener('click',()=>{pdQty=Math.max(1,pdQty-1);$('#qtyValue').textContent=pdQty;updatePdPrice()});
  $('#qtyPlus')?.addEventListener('click',()=>{pdQty+=1;$('#qtyValue').textContent=pdQty;updatePdPrice()});
  $('#pdWish')?.addEventListener('click',()=>{if(activeProduct)toggleWish(activeProduct.id)});
  $('#pdAddCart')?.addEventListener('click',()=>{
    if(!activeProduct) return;
    const size=ensureSizes(activeProduct)[activeSizeIndex];
    const addons=$$('.addon-options input:checked').map(i=>({name:i.value,price:Number(i.dataset.price||0)}));
    const unit=Number(size.price)+addons.reduce((s,a)=>s+a.price,0);
    const itemName=`${activeProduct.name} — ${size.name}${addons.length?' + '+addons.map(a=>a.name).join(', '):''}`;
    cart.push({name:itemName,unitPrice:unit,qty:pdQty,price:unit*pdQty});
    saveCart(); renderCart(); closeProduct(); openCart(); toast('Dodano do koszyka ✓');
  });

  // Custom order
  $$('.js-custom').forEach(b=>b.addEventListener('click',openCustom));
  $('.modal .close')?.addEventListener('click',closeCustom);
  customModal?.addEventListener('click',e=>{if(e.target===customModal)closeCustom()});
  $('#customForm')?.addEventListener('submit',e=>{e.preventDefault();closeCustom();toast('Zapytanie zapisane w wersji demo ✓')});
  $('#contactForm')?.addEventListener('submit',e=>{e.preventDefault();toast('Wiadomość zapisana w wersji demo ✓')});


  // Checkout is a separate page in v19. No modal logic here.

  // Search
  function openSearch(){
    closeCart();closeCustom();closeCheckout();closeProduct();closeWishlist();
    searchModal?.classList.add('open'); searchModal?.setAttribute('aria-hidden','false');
    const input=$('#globalSearchInput');
    if(input){input.value=''; renderSearch(''); setTimeout(()=>input.focus(),50);}
  }
  function renderSearch(q){
    const box=$('#globalSearchResults');
    if(!box) return;
    const query=(q||'').trim().toLowerCase();
    const list=getProducts().filter(p=>p.available!==false).filter(p=>!query || `${p.name} ${p.description||''}`.toLowerCase().includes(query));
    box.innerHTML=list.slice(0,8).map(p=>`
      <button type="button" class="search-result" data-search-id="${escapeAttr(p.id)}">
        <img src="${escapeAttr(p.image)}" alt="">
        <span><b>${escapeHtml(p.name)}</b><small>od ${money(ensureSizes(p)[0].price)}</small></span>
      </button>`).join('') || '<p class="cart-empty">Brak wyników.</p>';
    $$('[data-search-id]',box).forEach(b=>b.addEventListener('click',()=>{closeSearch();openProductDetail(b.dataset.searchId)}));
  }
  $('#searchBtn')?.addEventListener('click',openSearch);
  $('#searchClose')?.addEventListener('click',closeSearch);
  searchModal?.addEventListener('click',e=>{if(e.target===searchModal)closeSearch()});
  $('#globalSearchInput')?.addEventListener('input',e=>renderSearch(e.target.value));

  // Gallery
  const lbImg=lightbox?.querySelector('img');
  $$('.g').forEach(g=>g.addEventListener('click',()=>{if(lightbox&&lbImg){lbImg.src=g.dataset.src;lightbox.classList.add('open')}}));
  lightbox?.querySelector('button')?.addEventListener('click',()=>lightbox.classList.remove('open'));
  lightbox?.addEventListener('click',e=>{if(e.target===lightbox)lightbox.classList.remove('open')});

  // Esc and cross-tab
  document.addEventListener('keydown',e=>{if(e.key==='Escape')closeAll()});
  window.addEventListener('storage',e=>{
    if(e.key===STORAGE_KEY) renderProducts();
    if(e.key===WISH_KEY) renderWishCount();
    if(e.key===CART_KEY){cart=getCart();renderCart();}
  });

  function escapeHtml(v){
    return String(v??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  }
  function escapeAttr(v){ return escapeHtml(v); }

  renderProducts();
  renderCart();
  renderWishCount();
});
})();


document.addEventListener('DOMContentLoaded',()=>{
  const click = id => document.getElementById(id)?.click();
  document.getElementById('v30Wishlist')?.addEventListener('click',()=>click('wishlistBtn'));
  document.getElementById('v30Search')?.addEventListener('click',()=>click('searchBtn'));
  document.getElementById('v30Cart')?.addEventListener('click',()=>click('cartBtn'));
});
