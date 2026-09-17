(function(){
  function addDeleteButtons(){
    const recent=document.getElementById('recent');
    if(!recent)return;
    recent.querySelectorAll('.recent-item').forEach(item=>{
      if(item.querySelector('.delete-saved'))return;
      const open=item.querySelector('button[onclick^="openSaved"]');
      if(!open)return;
      const m=open.getAttribute('onclick').match(/openSaved\('([^']+)',(\d+)\)/);
      if(!m)return;
      const btn=document.createElement('button');
      btn.className='btn danger delete-saved';
      btn.type='button';
      btn.textContent='🗑️ Eliminar';
      btn.title='Eliminar documento';
      btn.onclick=function(){deleteSaved(m[1],Number(m[2]));};
      let actions=item.querySelector('.recent-actions');
      if(!actions){
        actions=document.createElement('div');
        actions.className='recent-actions';
        item.appendChild(actions);
        actions.appendChild(open);
      }
      actions.appendChild(btn);
    });
  }
  window.deleteSaved=function(key,index){
    const names={edsReports:'informe',edsQuotes:'cotización'};
    if(!confirm('¿Seguro que deseas eliminar esta '+(names[key]||'documento')+'? Esta acción no se puede deshacer.'))return;
    let data=[];
    try{data=JSON.parse(localStorage.getItem(key)||'[]');}catch(e){data=[];}
    if(index<0||index>=data.length)return;
    data.splice(index,1);
    localStorage.setItem(key,JSON.stringify(data));
    if(typeof window.refreshHome==='function')window.refreshHome();
    addDeleteButtons();
  };
  const original=window.refreshHome;
  if(typeof original==='function'){
    window.refreshHome=function(){original();setTimeout(addDeleteButtons,0);};
  }
  document.addEventListener('DOMContentLoaded',addDeleteButtons);
})();