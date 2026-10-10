/* PWA install prompt: uses the browser's native install flow when available. */
(function(){
 let deferredPrompt=null, shown=false;
 const key='finriseAdminInstallChoice';
 const isStandalone=()=>window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone===true;
 function showInstallModal(canNative){
   if(shown||isStandalone()||localStorage.getItem(key)==='dismissed')return;
   shown=true;
   const wrap=document.createElement('div');wrap.id='finriseInstallModal';
   wrap.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.78);z-index:20000;display:grid;place-items:center;padding:20px;font-family:Arial,sans-serif';
   const box=document.createElement('div');box.style.cssText='width:min(420px,100%);background:#111;border:1px solid #D4AF37;border-radius:18px;padding:24px;color:#fff;box-shadow:0 20px 70px #000';
   box.innerHTML='<div style="width:54px;height:54px;display:grid;place-items:center;background:#D4AF37;color:#080808;border-radius:14px;font-size:32px;font-weight:900;margin-bottom:16px">F</div><h2 style="margin:0 0 8px;font-size:21px">Install Finrise Admin?</h2><p style="color:#c7c0ad;line-height:1.55;font-size:14px">Add the admin panel to your home screen for quicker access and an app-like experience on this device.</p><p id="finriseInstallHelp" style="color:#d9c98f;font-size:12px;line-height:1.5"></p><div style="display:flex;gap:10px;margin-top:20px"><button id="finriseInstallLater" style="flex:1;padding:12px;border-radius:9px;border:1px solid #54451c;background:#17150f;color:#eee">Not now</button><button id="finriseInstallNow" style="flex:1;padding:12px;border:0;border-radius:9px;background:#D4AF37;color:#080808;font-weight:800">Install app</button></div>';
   wrap.appendChild(box);document.body.appendChild(wrap);
   const install=box.querySelector('#finriseInstallNow'), help=box.querySelector('#finriseInstallHelp');
   if(!canNative){install.textContent='How to install';help.textContent=/iPhone|iPad|iPod/i.test(navigator.userAgent)?'On iPhone/iPad: tap Share in Safari, then “Add to Home Screen”.':'If your browser supports installation, open its menu (⋮) and choose “Install app” or “Add to Home screen”.';}
   box.querySelector('#finriseInstallLater').onclick=()=>{localStorage.setItem(key,'dismissed');wrap.remove()};
   install.onclick=async()=>{if(deferredPrompt){deferredPrompt.prompt();try{await deferredPrompt.userChoice}catch(_){}deferredPrompt=null;wrap.remove();localStorage.setItem(key,'handled')}else{help.textContent=/iPhone|iPad|iPod/i.test(navigator.userAgent)?'Open this page in Safari, tap Share, then Add to Home Screen.':'Open your browser menu and choose Install app / Add to Home screen, if available.';install.textContent='Got it';install.onclick=()=>{wrap.remove();localStorage.setItem(key,'handled')}}};
 }
 window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferredPrompt=e;setTimeout(()=>showInstallModal(true),900)});
 window.addEventListener('appinstalled',()=>{localStorage.setItem(key,'installed');const m=document.getElementById('finriseInstallModal');if(m)m.remove()});
 // Browser-native prompt is not exposed on iOS Safari; show a small how-to modal on first mobile visit.
 window.addEventListener('load',()=>{if(isStandalone()||localStorage.getItem(key))return;const mobile=/Android|iPhone|iPad|iPod/i.test(navigator.userAgent);if(mobile)setTimeout(()=>{if(!deferredPrompt)showInstallModal(false)},1800)});
})();
