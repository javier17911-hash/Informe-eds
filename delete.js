(function(){
  function css(){
    if(document.getElementById('delete-fix-css'))return;
    const s=document.createElement('style');s.id='delete-fix-css';
    s.textContent='.delete-saved{display:inline-flex!important;visibility:visible!important;opacity:1!important;align-items:center;justify-content:center;gap:4px}.delete-manager{margin-top:12px}.delete-manager button{width:100%;font-size:16px;padding:13px}';
    document.head.appendChild(s);
  }
  function addDeleteButtons(){
    css();
    const recent=document.getElementById('recent');
    if(!recent)return;
    recent.querySelectorAll('.recent-item').forEach(item=>{
      if(item.querySelector('.delete-saved'))return;
      const buttons=[...item.querySelectorAll('button')];
      const open=buttons.find(b=>/openSaved/.test(b.getAttribute('onclick')||''));
      if(!open)return;
      const m=(open.getAttribute('onclick')||'').match(/openSaved\(['\"]([^'\"]+)['\"],\s*(\d+)\)/);
      if(!m)return;
      let actions=item.querySelector('.recent-actions');
      if(!actions){actions=document.createElement('div');actions.className='recent-actions';item.appendChild(actions);actions.appendChild(open);}
      const btn=document.createElement('button');
      btn.className='btn danger delete-saved';btn.type='button';btn.textContent='🗑️ Eliminar';btn.title='Eliminar documento';
      btn.addEventListener('click',function(){deleteSaved(m[1],Number(m[2]));});
      actions.appendChild(btn);
    });
  }
  window.deleteSaved=function(key,index){
    const names={edsReports:'informe',edsQuotes:'cotización'};
    let data=[];try{data=JSON.parse(localStorage.getItem(key)||'[]');}catch(e){}
    if(index<0||index>=data.length)return;
    if(!confirm('¿Seguro que deseas eliminar esta '+(names[key]||'documento')+'? Esta acción no se puede deshacer.'))return;
    data.splice(index,1);localStorage.setItem(key,JSON.stringify(data));
    if(typeof window.refreshHome==='function')window.refreshHome();
    setTimeout(addDeleteButtons,50);
  };
  function installManager(){
    if(document.getElementById('deleteManager'))return;
    const recent=document.getElementById('recent');
    if(!recent)return;
    const card=recent.closest('.card');if(!card)return;
    const box=document.createElement('div');box.id='deleteManager';box.className='delete-manager no-print';
    box.innerHTML='<button class="btn danger full" type="button">🗑️ GESTIONAR / ELIMINAR DOCUMENTOS</button>';
    box.querySelector('button').onclick=function(){
      const r=JSON.parse(localStorage.getItem('edsReports')||'[]');const q=JSON.parse(localStorage.getItem('edsQuotes')||'[]');
      if(!r.length&&!q.length){alert('No hay documentos guardados para eliminar.');return;}
      const choice=prompt('Escribe el número: 1 = eliminar último informe, 2 = eliminar última cotización, 3 = cancelar');
      if(choice==='1'&&r.length){if(confirm('¿Eliminar el último informe guardado?')){r.pop();localStorage.setItem('edsReports',JSON.stringify(r));refreshHome();}}
      if(choice==='2'&&q.length){if(confirm('¿Eliminar la última cotización guardada?')){q.pop();localStorage.setItem('edsQuotes',JSON.stringify(q));refreshHome();}}
      setTimeout(addDeleteButtons,50);
    };
    card.appendChild(box);
  }
  function run(){addDeleteButtons();installManager();}
  document.addEventListener('DOMContentLoaded',run);
  window.addEventListener('load',run);
  const oldRefresh=window.refreshHome;
  if(typeof oldRefresh==='function')window.refreshHome=function(){oldRefresh();setTimeout(run,50);};
  setInterval(addDeleteButtons,1000);
})();