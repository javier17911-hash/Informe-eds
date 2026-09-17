(function(){
  function addDeleteButtons(){
    const recent=document.getElementById('recent');
    if(!recent)return;
    recent.querySelectorAll('.recent-item').forEach(item=>{
      const actions=item.querySelector('.recent-actions');
      if(!actions)return;
      if(actions.querySelector('.delete-btn,.delete-saved'))return;
      const open=[...actions.querySelectorAll('button')].find(b=>/openSaved/.test(b.getAttribute('onclick')||''));
      if(!open)return;
      const m=(open.getAttribute('onclick')||'').match(/openSaved\(['\"]([^'\"]+)['\"],\s*(\d+)\)/);
      if(!m)return;
      const btn=document.createElement('button');
      btn.className='btn danger delete-btn delete-saved';
      btn.type='button';
      btn.textContent='🗑️';
      btn.title='Eliminar documento';
      btn.addEventListener('click',function(){
        const key=m[1],index=Number(m[2]);
        let data=[];try{data=JSON.parse(localStorage.getItem(key)||'[]')}catch(e){}
        if(!data[index])return;
        if(!confirm('¿Eliminar este documento? Esta acción no se puede deshacer.'))return;
        data.splice(index,1);
        localStorage.setItem(key,JSON.stringify(data));
        if(typeof window.refreshHome==='function')window.refreshHome();
        setTimeout(addDeleteButtons,50);
      });
      actions.appendChild(btn);
    });
  }
  const run=()=>{addDeleteButtons();};
  document.addEventListener('DOMContentLoaded',run);
  window.addEventListener('load',run);
  new MutationObserver(run).observe(document.documentElement,{subtree:true,childList:true});
  setInterval(addDeleteButtons,1000);
})();