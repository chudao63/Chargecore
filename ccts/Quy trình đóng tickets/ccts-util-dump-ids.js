(function(){
  window.__pks = [];
  let timer = null;

  function autoDump(){
    const list = window.__pks.join('\n');
    console.log(`%c===== ${window.__pks.length} ID (đã copy clipboard) =====`, 'font-weight:bold;color:#16a34a');
    console.log(list);
    try{ copy(list); }catch(e){}
  }

  function harvest(text){
    try{
      const re = /"cctsTicketPk"\s*:\s*"?(\d{15,25})"?/g;
      let m, found=[];
      while((m=re.exec(text))) found.push(m[1]);
      if (found.length){
        const before = window.__pks.length;
        window.__pks = [...new Set([...window.__pks, ...found])];
        const added = window.__pks.length-before;
        if (added) console.log(`📥 +${added} (tổng ${window.__pks.length})`);
        clearTimeout(timer);
        timer = setTimeout(autoDump, 800);   // ngừng load 0.8s -> tự dump
      }
    }catch(e){}
  }
  function isList(u){ return typeof u==='string' && /findCCTSTicket\b/.test(u); }

  if (!window.__listHooked){
    window.__listHooked = true;
    const _f = window.fetch;
    window.fetch = async function(...a){
      const url = a[0] && (a[0].url||a[0]);
      const res = await _f.apply(this,a);
      if (isList(url)){ try{ harvest(await res.clone().text()); }catch(e){} }
      return res;
    };
    const _open = XMLHttpRequest.prototype.open;
    const _send = XMLHttpRequest.prototype.send;
    XMLHttpRequest.prototype.open = function(m,u){ this.__u=u; return _open.apply(this,arguments); };
    XMLHttpRequest.prototype.send = function(){
      this.addEventListener('load', ()=>{ if(isList(this.__u)){ try{ harvest(this.responseText); }catch(e){} } });
      return _send.apply(this,arguments);
    };
  }

  window.resetIds = function(){ window.__pks=[]; console.log('🧹 Đã xoá danh sách tạm'); };
  console.log('🔌 Đã gắn hook tự-dump. Cứ search / chuyển trang — list tự in ra & tự copy. (resetIds() để làm lại)');
})();