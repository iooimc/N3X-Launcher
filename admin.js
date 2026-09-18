'use strict';
const REPO='iooimc/N3X-Launcher';
const API='https://api.github.com';
const PAGES='https://iooimc.github.io/N3X-Launcher';
const REG_PREFIX='[N3X REGISTER]';
let token='';
let catalog={schemaVersion:2,updatedAt:'',capes:[]};
let userIndex={schemaVersion:2,updatedAt:'',users:[]};
let pending=[];
const $=id=>document.getElementById(id);

function setStatus(message,type=''){
  const el=$('status'); el.textContent=message; el.className='status'+(type?' '+type:'');
}
function esc(value){return String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function normalizeUuid(value){
  const s=String(value||'').replace(/-/g,'').toLowerCase();
  if(!/^[0-9a-f]{32}$/.test(s)) throw new Error('UUID muss aus 32 Hex-Zeichen bestehen.');
  return `${s.slice(0,8)}-${s.slice(8,12)}-${s.slice(12,16)}-${s.slice(16,20)}-${s.slice(20)}`;
}
function slug(value){return String(value||'cape').normalize('NFKD').replace(/[^a-zA-Z0-9 _-]/g,'').trim().replace(/\s+/g,'-').replace(/-+/g,'-').toLowerCase().slice(0,64)||'cape';}
function bytesToB64(bytes){let out='';const step=0x8000;for(let i=0;i<bytes.length;i+=step)out+=String.fromCharCode(...bytes.subarray(i,i+step));return btoa(out);}
function b64ToBytes(value){const raw=atob(String(value||'').replace(/\n/g,''));const out=new Uint8Array(raw.length);for(let i=0;i<raw.length;i++)out[i]=raw.charCodeAt(i);return out;}
function textToB64(value){return bytesToB64(new TextEncoder().encode(value));}
function b64ToText(value){return new TextDecoder().decode(b64ToBytes(value));}

async function gh(url,options={}){
  const headers={Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28',...(options.headers||{})};
  if(token) headers.Authorization=`Bearer ${token}`;
  const res=await fetch(url.startsWith('http')?url:API+url,{...options,headers});
  const data=await res.json().catch(()=>null);
  if(!res.ok){const error=new Error(data?.message||`GitHub HTTP ${res.status}`);error.status=res.status;throw error;}
  return data;
}
async function readContent(path,optional=false){
  try{const row=await gh(`/repos/${REPO}/contents/${encodeURI(path)}`);return{sha:row.sha,bytes:b64ToBytes(row.content),text:b64ToText(row.content)};}
  catch(error){if(optional&&error.status===404)return null;throw error;}
}
async function putBytes(path,bytes,message){
  const old=await readContent(path,true);const body={message,content:bytesToB64(bytes),branch:'main'};if(old?.sha)body.sha=old.sha;
  return gh(`/repos/${REPO}/contents/${encodeURI(path)}`,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
}
async function putText(path,text,message){return putBytes(path,new TextEncoder().encode(text),message);}
async function deletePath(path,message){
  const old=await readContent(path,true);if(!old)return false;
  await gh(`/repos/${REPO}/contents/${encodeURI(path)}`,{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({message,sha:old.sha,branch:'main'})});return true;
}
async function readJson(path,fallback){const row=await readContent(path,true);if(!row)return structuredClone(fallback);return JSON.parse(row.text);}
async function writeCatalog(message='Update N3X cape catalog'){catalog.updatedAt=new Date().toISOString();await putText('network/capes/catalog.json',JSON.stringify(catalog,null,2)+'\n',message);}
async function writeUsers(message='Update N3X user index'){userIndex.updatedAt=new Date().toISOString();await putText('network/users/index.json',JSON.stringify(userIndex,null,2)+'\n',message);}

function parseRegistration(issue){
  const body=String(issue.body||'');
  const name=(body.match(/Minecraft Name:\s*([^\r\n]+)/i)||[])[1]?.trim()||String(issue.title||'').replace(REG_PREFIX,'').trim();
  const uuid=(body.match(/Minecraft UUID:\s*([0-9a-fA-F-]{32,36})/i)||[])[1]?.trim()||'';
  try{return{name,uuid:normalizeUuid(uuid),issue:issue.number,url:issue.html_url};}catch{return{name,uuid:'',issue:issue.number,url:issue.html_url};}
}
async function loadIssues(){
  const rows=await gh(`/repos/${REPO}/issues?state=open&per_page=100&sort=created&direction=desc`);
  pending=rows.filter(x=>!x.pull_request&&String(x.title||'').startsWith(REG_PREFIX)).map(parseRegistration);
}
async function loadAll(){
  [catalog,userIndex]=await Promise.all([
    readJson('network/capes/catalog.json',{schemaVersion:2,updatedAt:'',capes:[]}),
    readJson('network/users/index.json',{schemaVersion:2,updatedAt:'',users:[]})
  ]);
  if(!Array.isArray(catalog.capes))catalog.capes=[];
  if(!Array.isArray(userIndex.users))userIndex.users=[];
  await loadIssues();renderAll();
}
function renderAll(){renderPending();renderUsers();renderCapes();}
function renderPending(){
  const box=$('pending');box.replaceChildren();
  if(!pending.length){box.innerHTML='<div class="empty">Keine offenen Registrierungen.</div>';return;}
  for(const req of pending){
    const item=document.createElement('div');item.className='item';
    item.innerHTML=`<div><strong>${esc(req.name||'Unbekannt')}</strong><small>${esc(req.uuid||'Ungültige UUID')} · Issue #${req.issue}</small><span class="tag warn">WARTET AUF FREIGABE</span></div><div class="pending-actions"><button class="btn good">Freigeben</button><a class="btn" target="_blank" rel="noopener" href="${esc(req.url)}">Issue</a></div>`;
    item.querySelector('button').onclick=()=>approveRegistration(req,item.querySelector('button'));
    box.append(item);
  }
}
function renderUsers(){
  const box=$('users');box.replaceChildren();
  if(!userIndex.users.length){box.innerHTML='<div class="empty">Noch keine freigeschalteten Spieler.</div>';return;}
  const capesWithAsset=catalog.capes.filter(c=>c.texturePath||c.textureUrl);
  for(const user of [...userIndex.users].sort((a,b)=>String(a.name).localeCompare(String(b.name),'de'))){
    const item=document.createElement('div');item.className='item';
    const options=['<option value="">Kein Network-Cape</option>',...capesWithAsset.map(c=>`<option value="${esc(c.id)}" ${user.assignedCape===c.id?'selected':''}>${esc(c.name)}</option>`)].join('');
    item.innerHTML=`<div><strong>${esc(user.name)}</strong><small>${esc(user.uuid)}</small><span class="tag ${user.assignedCape?'ok':''}">${user.assignedCape?`CAPE · ${esc(catalog.capes.find(c=>c.id===user.assignedCape)?.name||user.assignedCape)}`:'KEIN CAPE'}</span><div class="user-detail"><div class="cape-select"><select>${options}</select><button class="btn primary">Zuweisen</button></div></div></div><div class="user-actions"><button class="btn danger">Spieler entfernen</button></div>`;
    const select=item.querySelector('select');
    const [assign,remove]=item.querySelectorAll('button');
    assign.onclick=()=>assignCape(user,select.value,assign);
    remove.onclick=()=>removeUser(user,remove);
    box.append(item);
  }
}
function renderCapes(){
  const box=$('capes');box.replaceChildren();
  if(!catalog.capes.length){box.innerHTML='<div class="empty">Noch keine Capes.</div>';return;}
  for(const cape of catalog.capes){
    const hasAsset=Boolean(cape.texturePath||cape.textureUrl);
    const item=document.createElement('div');item.className='item';
    item.innerHTML=`<div><strong>${esc(cape.name)}</strong><small>${esc(cape.id)}${cape.width&&cape.height?` · ${cape.width}×${cape.height}`:''}</small><span class="tag ${hasAsset?'ok':'warn'}">${hasAsset?'ASSET BEREIT':'ASSET FEHLT'}</span></div><div>${hasAsset?`<a class="btn" target="_blank" rel="noopener" href="${esc(cape.textureUrl||PAGES+'/'+cape.texturePath)}">PNG</a>`:''}</div>`;
    box.append(item);
  }
}

async function upsertUser(name,uuid){
  uuid=normalizeUuid(uuid);name=String(name||'').trim();if(!name)throw new Error('Minecraft Name fehlt.');
  const now=new Date().toISOString();
  let user=userIndex.users.find(u=>u.uuid===uuid);
  if(!user){user={name,uuid,registeredAt:now,approved:true,assignedCape:null,updatedAt:now};userIndex.users.push(user);}else{user.name=name;user.approved=true;user.updatedAt=now;}
  const detail={schemaVersion:2,...user,capeUrl:user.assignedCape?`${PAGES}/network/v1/capes/${uuid}.png`:null};
  await putText(`network/users/${uuid}.json`,JSON.stringify(detail,null,2)+'\n',`Register N3X player ${name}`);
  await writeUsers(`Register N3X player ${name}`);
  return user;
}
async function approveRegistration(req,button){
  if(!req.uuid)return setStatus(`Issue #${req.issue} hat keine gültige UUID.`,'err');
  button.disabled=true;setStatus(`Registriere ${req.name} …`);
  try{
    await upsertUser(req.name,req.uuid);
    await gh(`/repos/${REPO}/issues/${req.issue}`,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({state:'closed'})});
    pending=pending.filter(x=>x.issue!==req.issue);renderAll();setStatus(`${req.name} wurde freigeschaltet.`,'ok');
  }catch(error){setStatus(error.message,'err');button.disabled=false;}
}
async function assignCape(user,capeId,button){
  button.disabled=true;setStatus(`${user.name}: Cape wird aktualisiert …`);
  try{
    const uuid=normalizeUuid(user.uuid);const now=new Date().toISOString();
    if(!capeId){
      await deletePath(`network/v1/capes/${uuid}.png`,`Remove cape assignment from ${user.name}`);
      user.assignedCape=null;user.updatedAt=now;
    }else{
      const cape=catalog.capes.find(c=>c.id===capeId);if(!cape)throw new Error('Cape nicht gefunden.');
      const source=cape.texturePath||`network/capes/${cape.id}.png`;
      const asset=await readContent(source,true);if(!asset)throw new Error('Für dieses Cape fehlt die PNG im Network. Lade sie zuerst hoch.');
      await putBytes(`network/v1/capes/${uuid}.png`,asset.bytes,`Assign ${cape.name} to ${user.name}`);
      user.assignedCape=cape.id;user.updatedAt=now;
    }
    const detail={schemaVersion:2,...user,capeUrl:user.assignedCape?`${PAGES}/network/v1/capes/${uuid}.png`:null};
    await putText(`network/users/${uuid}.json`,JSON.stringify(detail,null,2)+'\n',`Update cape assignment for ${user.name}`);
    await writeUsers(`Update cape assignment for ${user.name}`);
    renderUsers();setStatus(user.assignedCape?`${user.name} hat jetzt ${catalog.capes.find(c=>c.id===user.assignedCape)?.name||user.assignedCape}.`:`Cape von ${user.name} entfernt.`,'ok');
  }catch(error){setStatus(error.message,'err');}finally{button.disabled=false;}
}
async function removeUser(user,button){
  if(!confirm(`${user.name} wirklich aus dem N3X Network entfernen?`))return;
  button.disabled=true;setStatus(`${user.name} wird entfernt …`);
  try{
    await deletePath(`network/v1/capes/${normalizeUuid(user.uuid)}.png`,`Remove N3X cape for ${user.name}`);
    await deletePath(`network/users/${normalizeUuid(user.uuid)}.json`,`Remove N3X player ${user.name}`);
    userIndex.users=userIndex.users.filter(x=>x.uuid!==user.uuid);await writeUsers(`Remove N3X player ${user.name}`);
    renderUsers();setStatus(`${user.name} wurde entfernt.`,'ok');
  }catch(error){setStatus(error.message,'err');button.disabled=false;}
}

async function imageSize(file){
  const url=URL.createObjectURL(file);try{return await new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve({width:img.naturalWidth,height:img.naturalHeight,url});img.onerror=()=>reject(new Error('PNG konnte nicht gelesen werden.'));img.src=url;});}catch(e){URL.revokeObjectURL(url);throw e;}
}
let chosenCapeInfo=null;
$('cape-file').onchange=async()=>{
  chosenCapeInfo=null;const file=$('cape-file').files[0];const preview=$('cape-preview');preview.innerHTML='<span class="mini">Prüfe PNG …</span>';if(!file)return;
  try{
    if(file.type!=='image/png'||file.size>1024*1024)throw new Error('Cape muss eine PNG unter 1 MB sein.');
    const info=await imageSize(file);const valid=(info.width===64&&info.height===32)||(info.width===128&&info.height===64)||(info.width===256&&info.height===128);if(!valid)throw new Error('Erlaubt: 64×32, 128×64 oder 256×128.');
    chosenCapeInfo={file,width:info.width,height:info.height};preview.innerHTML=`<img src="${info.url}" alt="Cape preview">`;
    if(!$('cape-name').value)$('cape-name').value=file.name.replace(/\.png$/i,'').replace(/[-_]+/g,' ');
    if(!$('cape-id').value)$('cape-id').value=slug($('cape-name').value);
  }catch(error){preview.innerHTML=`<span class="mini">${esc(error.message)}</span>`;setStatus(error.message,'err');}
};
$('cape-name').oninput=()=>{if(!$('cape-id').dataset.manual)$('cape-id').value=slug($('cape-name').value);};
$('cape-id').oninput=()=>{$('cape-id').dataset.manual='1';};
$('cape-upload').onclick=async()=>{
  if(!chosenCapeInfo)return setStatus('Wähle zuerst eine gültige Cape-PNG.','err');
  const name=$('cape-name').value.trim();const id=slug($('cape-id').value||name);if(!name)return setStatus('Cape Name fehlt.','err');
  const btn=$('cape-upload');btn.disabled=true;setStatus(`${name} wird hochgeladen …`);
  try{
    const bytes=new Uint8Array(await chosenCapeInfo.file.arrayBuffer());const path=`network/capes/${id}.png`;
    await putBytes(path,bytes,`Upload N3X cape ${name}`);
    const row={id,name,source:'N3X',texturePath:path,textureUrl:`${PAGES}/${path}`,previewUrl:`${PAGES}/${path}`,width:chosenCapeInfo.width,height:chosenCapeInfo.height,bundled:false,updatedAt:new Date().toISOString()};
    const i=catalog.capes.findIndex(c=>c.id===id);if(i>=0)catalog.capes[i]={...catalog.capes[i],...row};else catalog.capes.push(row);
    catalog.capes.sort((a,b)=>a.name.localeCompare(b.name,'de'));await writeCatalog(`Add N3X cape ${name}`);
    renderCapes();setStatus(`${name} ist jetzt im N3X Network und kann Spielern zugewiesen werden.`,'ok');
  }catch(error){setStatus(error.message,'err');}finally{btn.disabled=false;}
};

$('manual-add').onclick=async()=>{
  const btn=$('manual-add');btn.disabled=true;try{const user=await upsertUser($('manual-name').value,$('manual-uuid').value);renderUsers();$('manual-name').value='';$('manual-uuid').value='';setStatus(`${user.name} wurde freigeschaltet.`,'ok');}catch(error){setStatus(error.message,'err');}finally{btn.disabled=false;}
};
$('connect').onclick=async()=>{
  token=$('token').value.trim();if(!token)return setStatus('GitHub Token fehlt.','err');
  $('connect').disabled=true;setStatus('Prüfe GitHub-Zugriff …');
  try{
    const me=await gh('/user');
    const repo=await gh(`/repos/${REPO}`);if(!repo.permissions?.push)throw new Error('Dieser Token hat keinen Schreibzugriff auf das N3X-Repository.');
    await loadAll();$('dashboard').classList.remove('hidden');$('token').value='';setStatus(`Admin verbunden als ${me.login}. Token bleibt nur in diesem Tab.`,'ok');
  }catch(error){token='';setStatus(error.message,'err');}finally{$('connect').disabled=false;}
};
