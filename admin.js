
(() => {
'use strict';
document.addEventListener('DOMContentLoaded',()=>{
  const $=s=>document.querySelector(s);
  const KEY='kaya_products_v1', SESSION='kaya_admin_demo_session';
  const DEFAULTS=window.KAYA_DEFAULT_PRODUCTS||[];
  const clone=x=>JSON.parse(JSON.stringify(x));
  let editingImage='';

  function loadProducts(){
    try{const x=localStorage.getItem(KEY);return x?JSON.parse(x):clone(DEFAULTS)}
    catch(e){return clone(DEFAULTS)}
  }
  function saveProducts(p){localStorage.setItem(KEY,JSON.stringify(p));}
  function toast(t){const e=$('#toast');e.textContent=t;e.classList.add('show');clearTimeout(toast._t);toast._t=setTimeout(()=>e.classList.remove('show'),1600)}
  function showPanel(){ $('#loginView').classList.add('hidden');$('#panelView').classList.remove('hidden');render(); }
  if(sessionStorage.getItem(SESSION)==='1') showPanel();

  $('#loginForm').addEventListener('submit',e=>{
    e.preventDefault();
    if($('#login').value==='kaya'&&$('#password').value==='demo2026'){
      sessionStorage.setItem(SESSION,'1');$('#loginError').textContent='';showPanel();
    }else $('#loginError').textContent='Nieprawidłowy login lub hasło.';
  });
  $('#logout').addEventListener('click',()=>{sessionStorage.removeItem(SESSION);location.reload()});
  $('#search').addEventListener('input',render);

  function render(){
    const all=loadProducts();
    const q=$('#search').value.trim().toLowerCase();
    const shown=all.filter(p=>`${p.name} ${p.description||''}`.toLowerCase().includes(q));
    $('#productCount').textContent=`${all.length} produktów`;
    $('#productList').innerHTML=shown.map(p=>`
      <div class="row">
        <img src="${p.image}" alt="">
        <div><h3>${esc(p.name)}</h3><p>${esc(p.description||'')}</p></div>
        <div class="price">${Number(p.price||0).toFixed(0)} zł</div>
        <div class="row-actions"><button data-edit="${p.id}" type="button">Edytuj</button><button class="delete" data-delete="${p.id}" type="button">Usuń</button></div>
      </div>`).join('')||'<p>Brak wyników.</p>';
    document.querySelectorAll('[data-edit]').forEach(b=>b.addEventListener('click',()=>openEditor(b.dataset.edit)));
    document.querySelectorAll('[data-delete]').forEach(b=>b.addEventListener('click',()=>removeProduct(b.dataset.delete)));
  }

  function openEditor(id){
    const p=id?loadProducts().find(x=>String(x.id)===String(id)):null;
    $('#editorTitle').textContent=p?'Edytuj produkt':'Dodaj produkt';
    $('#productId').value=p?.id||'';
    $('#name').value=p?.name||'';
    $('#price').value=p?.price||'';
    $('#description').value=p?.description||'';
    $('#category').value=p?.category||'bukiety';
    $('#badge').value=p?.badge||'';
    $('#available').value=String(p?.available!==false);
    const sz=p?.sizes||[];
    $('#sizeSmall').value=sz[0]?.price??p?.price??'';
    $('#sizeMedium').value=sz[1]?.price??'';
    $('#sizeLarge').value=sz[2]?.price??'';
    $('#sizeGrande').value=sz[3]?.price??'';
    $('#imageUrl').value=p?.image||'';
    $('#imageFile').value='';
    editingImage=p?.image||'';
    $('#previewImg').src=editingImage;
    $('#editorModal').classList.add('open');
  }
  function closeEditor(){ $('#editorModal').classList.remove('open');$('#editorForm').reset();editingImage='';$('#previewImg').removeAttribute('src'); }
  $('#addProduct').addEventListener('click',()=>openEditor());
  $('#closeEditor').addEventListener('click',closeEditor);
  $('#editorModal').addEventListener('click',e=>{if(e.target===$('#editorModal'))closeEditor()});
  $('#imageUrl').addEventListener('input',e=>{editingImage=e.target.value;$('#previewImg').src=editingImage});
  $('#imageFile').addEventListener('change',e=>{
    const file=e.target.files[0];if(!file)return;
    if(file.size>2.5*1024*1024){toast('Zdjęcie jest za duże — max 2,5 MB');e.target.value='';return}
    const r=new FileReader();
    r.onload=()=>{editingImage=r.result;$('#previewImg').src=editingImage;$('#imageUrl').value=''};
    r.readAsDataURL(file);
  });
  $('#editorForm').addEventListener('submit',e=>{
    e.preventDefault();
    let products=loadProducts();
    const id=$('#productId').value||`p${Date.now()}`;
    const base=Number($('#price').value);
    const item={
      id,name:$('#name').value.trim(),price:base,description:$('#description').value.trim(),
      category:$('#category').value,badge:$('#badge').value.trim(),available:$('#available').value==='true',
      image:editingImage||$('#imageUrl').value.trim(),
      sizes:[
        {name:'Small',price:Number($('#sizeSmall').value||base)},
        {name:'Medium',price:Number($('#sizeMedium').value||base)},
        {name:'Large',price:Number($('#sizeLarge').value||base)},
        {name:'Grande',price:Number($('#sizeGrande').value||base)}
      ]
    };
    if(!item.image){toast('Dodaj zdjęcie produktu');return}
    const ix=products.findIndex(x=>String(x.id)===String(id));
    if(ix>=0)products[ix]=item;else products.unshift(item);
    try{saveProducts(products)}catch(err){toast('Nie udało się zapisać — zdjęcie może być za duże');return}
    closeEditor();render();toast('Produkt zapisany ✓');
  });
  function removeProduct(id){
    const p=loadProducts().find(x=>String(x.id)===String(id));
    if(!confirm(`Usunąć produkt "${p?.name||''}"?`))return;
    saveProducts(loadProducts().filter(x=>String(x.id)!==String(id)));render();toast('Produkt usunięty');
  }
  document.addEventListener('keydown',e=>{if(e.key==='Escape')closeEditor()});
  function esc(v){return String(v??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]))}
});
})();
