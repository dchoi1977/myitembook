"use strict";
/* MIB CBT · data layer — Supabase (auth, Postgres with RLS, storage) + mib-api Edge Function */
const sb=supabase.createClient(MIB_CONFIG.url,MIB_CONFIG.key,{auth:{persistSession:true,autoRefreshToken:true,storageKey:"mib-cbt-auth",detectSessionInUrl:false}});
const kstDay=(d=new Date())=>new Date(d.getTime()+9*3600e3).toISOString().slice(0,10);
function cbtDay(joinedAt){if(!joinedAt)return 1;return Math.max(1,daysBetween(kstDay(new Date(joinedAt)),kstDay())+1)}
const Err=(code,extra)=>Object.assign({code},extra||{});
async function Q(p){const {data,error}=await p;if(error)throw Err(error.code||"db_error",{message:error.message});return data}
function dataUrlToBlob(u){const [h,b]=u.split(",");const mime=(h.match(/data:([^;]+)/)||[])[1]||"image/jpeg";const bin=atob(b);const arr=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)arr[i]=bin.charCodeAt(i);return new Blob([arr],{type:mime})}
function parseJSON(text){const t=String(text||"").replace(/```(?:json)?/gi,"");const a=t.indexOf("{"),b=t.lastIndexOf("}");if(a<0||b<=a)throw Err("invalid_json");const body=t.slice(a,b+1);try{return JSON.parse(body)}catch(e){}
 try{return JSON.parse(body.replace(/[\u201c\u201d]/g,'"').replace(/,\s*([}\]])/g,"$1").replace(/[\u0000-\u001f]+/g," "))}catch(e){throw Err("invalid_json")}}

const api={
 sb,
 async session(){const {data}=await sb.auth.getSession();return data.session},
 onAuth(cb){return sb.auth.onAuthStateChange((ev,s)=>cb(ev,s)).data.subscription},
 async call(action,body,{auth=true,signal,url}={}){
  const h={"Content-Type":"application/json",apikey:MIB_CONFIG.key};
  if(auth){const s=await this.session();if(!s)throw Err("unauthorized");h.Authorization="Bearer "+s.access_token}
  let r;try{r=await fetch(url||MIB_CONFIG.fn,{method:"POST",headers:h,body:JSON.stringify({action,...body}),signal})}catch(e){if(e&&e.name==="AbortError")throw Err("cancelled");throw Err("network")}
  const j=await r.json().catch(()=>null);
  if(!r.ok||!j||j.error)throw Err((j&&j.error)||"upstream_error",j||{});
  return j;
 },
 // ── auth
 async join(f){return this.call("join",f,{auth:false})},
 async login(email,password){const {data,error}=await sb.auth.signInWithPassword({email:String(email).trim().toLowerCase(),password});if(error)throw Err(error.code||"invalid_credentials",{message:error.message});return data.session},
 async logout(){try{await sb.auth.signOut()}catch(e){}},
 async changePassword(pw){const {error}=await sb.auth.updateUser({password:pw});if(error)throw Err(error.code||"weak_password",{message:error.message})},
 async me(uid){return Q(sb.from("profiles").select("id,nickname,role,quiet_view,joined_at,avatar,avatar_scope,avatar_v").eq("id",uid).maybeSingle())},
 async setAvatar(uid,patch){return Q(sb.from("profiles").update(patch).eq("id",uid).select("id,nickname,role,quiet_view,joined_at,avatar,avatar_scope,avatar_v").single())},
 async uploadAvatar(uid,dataUrl){return Q(sb.storage.from("avatars").upload(`${uid}/avatar.jpg`,dataUrlToBlob(dataUrl),{upsert:true,contentType:"image/jpeg"}))},
 async removeAvatarPhoto(uid){return Q(sb.storage.from("avatars").remove([`${uid}/avatar.jpg`]))},
 async avatarUrls(ids){ids=[...new Set(ids)];if(!ids.length)return {};const {data}=await sb.storage.from("avatars").createSignedUrls(ids.map(i=>`${i}/avatar.jpg`),3600);const m={};(data||[]).forEach(x=>{const id=(x.path||"").split("/")[0];if(id)m[id]=x.signedUrl||null});return m},
 async setQuiet(uid,v){return Q(sb.from("profiles").update({quiet_view:v}).eq("id",uid))},
 // ── private state
 async loadState(uid){const r=await Q(sb.from("app_state").select("data").eq("user_id",uid).maybeSingle());return r?r.data:null},
 async loadStateRow(uid){return Q(sb.from("app_state").select("data,updated_at").eq("user_id",uid).maybeSingle())},
 async stateStamp(uid){const r=await Q(sb.from("app_state").select("updated_at").eq("user_id",uid).maybeSingle());return r?r.updated_at:null},
 async saveState(uid,data){const r=await Q(sb.from("app_state").upsert({user_id:uid,data},{onConflict:"user_id"}).select("updated_at").maybeSingle());return r?r.updated_at:null},
 async loadItems(uid){const r=await Q(sb.from("items").select("id,data,created_at,shared").eq("user_id",uid).order("created_at",{ascending:false}));return r.map(x=>({...x.data,id:x.id,_shared:!!x.shared}))},
 async setItemShared(uid,id,shared){return Q(sb.from("items").update({shared}).eq("id",id).eq("user_id",uid))},
 // someone else's shared shelf: RLS returns only items they share, and only while their card is visible to me
 async sharedShelf(owner){const r=await Q(sb.from("items").select("id,data,created_at").eq("user_id",owner).eq("shared",true).order("created_at",{ascending:false}));const items=(r||[]).map(x=>({...x.data,id:x.id}));const paths=items.flatMap(i=>[i.thumbPath,i.photoPath]).filter(Boolean);let m={};if(paths.length){try{const u=await Q(sb.storage.from("item-photos").createSignedUrls(paths,3600));(u||[]).forEach(x=>{if(x.signedUrl)m[x.path]=x.signedUrl})}catch(e){}}return items.map(i=>({...i,thumbUrl:m[i.thumbPath]||null,photoUrl:m[i.photoPath]||null}))},
 async saveItem(uid,item){
  const body={...item};const v=Date.now();
  if(body.photo&&body.photo.startsWith("data:")){
   const p=`${uid}/${item.id}.jpg`,t=`${uid}/${item.id}_t.jpg`;
   await Q(sb.storage.from("item-photos").upload(p,dataUrlToBlob(body.photo),{upsert:true,contentType:"image/jpeg"}));
   if(body.thumb&&body.thumb.startsWith("data:"))await Q(sb.storage.from("item-photos").upload(t,dataUrlToBlob(body.thumb),{upsert:true,contentType:"image/jpeg"}));
   body.photoPath=p;body.thumbPath=t;body.photoV=v;
  }
  if(body._removePhoto){try{await sb.storage.from("item-photos").remove([`${uid}/${item.id}.jpg`,`${uid}/${item.id}_t.jpg`])}catch(e){}delete body.photoPath;delete body.thumbPath;delete body.photoV}
  delete body._removePhoto;delete body._shared;
  delete body.photo;delete body.thumb;delete body.photoUrl;delete body.thumbUrl;
  await Q(sb.from("items").upsert({id:item.id,user_id:uid,data:body},{onConflict:"id"}));
  return body;
 },
 async deleteItem(uid,item){const paths=[item.photoPath,item.thumbPath].filter(Boolean);if(paths.length)await sb.storage.from("item-photos").remove(paths);return Q(sb.from("items").delete().eq("id",item.id).eq("user_id",uid))},
 async signedUrls(paths){paths=paths.filter(Boolean);if(!paths.length)return {};const r=await Q(sb.storage.from("item-photos").createSignedUrls(paths,3600));const m={};(r||[]).forEach(x=>{if(x.signedUrl)m[x.path]=x.signedUrl});return m},
 // ── public card
 async publishCard(uid,data,visibility){const up=await Q(sb.from("cards").update({data,visibility}).eq("user_id",uid).select("user_id"));if(!up||!up.length)await Q(sb.from("cards").insert({user_id:uid,data,visibility}))},
 async unpublishCard(uid){return Q(sb.from("cards").delete().eq("user_id",uid))},
 async listCards(){return Q(sb.from("cards").select("user_id,data,visibility,updated_at").order("updated_at",{ascending:false}).limit(80))},
 async getCard(id){return Q(sb.from("cards").select("user_id,data,visibility,updated_at,hidden").eq("user_id",id).maybeSingle())},
 // ── people
 async profiles(ids){ids=[...new Set(ids.filter(Boolean))];if(!ids.length)return {};const r=await Q(sb.from("profiles").select("id,nickname,joined_at,role,avatar,avatar_scope,avatar_v").in("id",ids));const m={};r.forEach(p=>m[p.id]=p);return m},
 async searchProfiles(q){q=String(q||"").trim().replace(/[%_,()]/g,"");if(!q)return [];return Q(sb.from("profiles").select("id,nickname,joined_at,role,avatar,avatar_scope,avatar_v").ilike("nickname",`%${q}%`).limit(12))},
 async profileByNickname(n){return Q(sb.from("profiles").select("id,nickname,joined_at,role,avatar,avatar_scope,avatar_v").eq("nickname",n).maybeSingle())},
 async pulse(uid,fids){const ids=(fids||[]).filter(Boolean);const [c,f]=await Promise.all([ids.length?Q(sb.from("cards").select("user_id,updated_at").in("user_id",ids).order("updated_at",{ascending:false}).limit(1)):Promise.resolve([]),Q(sb.from("feed_events").select("created_at").neq("user_id",uid).order("created_at",{ascending:false}).limit(1))]);return {card:c&&c[0]?Date.parse(c[0].updated_at):0,feed:f&&f[0]?Date.parse(f[0].created_at):0}},
 async social(uid){
  const [fr,wTo,wFrom,rTo,rFrom,fb]=await Promise.all([
   Q(sb.from("friendships").select("*").or(`requester.eq.${uid},addressee.eq.${uid}`)),
   Q(sb.from("words").select("from_id,word,created_at").eq("to_id",uid)),
   Q(sb.from("words").select("to_id,word").eq("from_id",uid)),
   Q(sb.from("reactions").select("id,from_id,kind,target,ref,created_at").eq("to_id",uid).order("created_at",{ascending:false}).limit(300)),
   Q(sb.from("reactions").select("id,to_id,kind,target,ref").eq("from_id",uid).limit(500)),
   Q(sb.from("feedback").select("kind,payload,created_at").eq("user_id",uid))]);
  return {friendships:fr,wordsTo:wTo,wordsFrom:wFrom,reactTo:rTo,reactFrom:rFrom,feedback:fb};
 },
 async friendRequest(to){return Q(sb.from("friendships").insert({addressee:to}))},
 async friendAccept(from,uid){return Q(sb.from("friendships").update({status:"accepted"}).eq("requester",from).eq("addressee",uid))},
 async friendRemove(a,b){await Q(sb.from("friendships").delete().eq("requester",a).eq("addressee",b));await Q(sb.from("friendships").delete().eq("requester",b).eq("addressee",a))},
 async react(to,kind,target="card",ref=""){return Q(sb.from("reactions").insert({to_id:to,kind,target,ref}))},
 async unreact(id){return Q(sb.from("reactions").delete().eq("id",id))},
 async shapeSave(uid,data,noRole){return Q(sb.from("gem_shapes").upsert({user_id:uid,data,no_role:!!noRole,updated_at:new Date().toISOString()},{onConflict:"user_id"}))},
 async shapeGet(id){return Q(sb.from("gem_shapes").select("user_id,data,no_role").eq("user_id",id).maybeSingle())},
 async roleList(){return Q(sb.from("role_models").select("*").order("created_at"))},
 async roleAdd(row){return Q(sb.from("role_models").insert(row).select().single())},
 async roleUpdate(id,patch){return Q(sb.from("role_models").update(patch).eq("id",id))},
 async roleDel(id){return Q(sb.from("role_models").delete().eq("id",id))},
 async roleFollowers(){return Q(sb.rpc("my_role_followers"))},
 async heartSend(to,kind,body,ctx){return Q(sb.from("heart_notes").insert({to_id:to,kind,body:String(body).slice(0,60),ctx:ctx?String(ctx).slice(0,60):null}))},
 async heartInbox(uid){return Q(sb.from("heart_notes").select("id,from_id,kind,body,ctx,created_at").eq("to_id",uid).order("created_at",{ascending:true}).limit(200))},
 async heartClear(ids){if(!ids.length)return;return Q(sb.from("heart_notes").delete().in("id",ids))},
 async word(uid,to,w){return Q(sb.from("words").upsert({from_id:uid,to_id:to,word:w},{onConflict:"from_id,to_id"}))},
 async cardWords(id){return Q(sb.rpc("card_words",{owner:id}))},
 async recordView(id){try{await sb.rpc("record_view",{owner:id})}catch(e){}},
 async visitors(){return Q(sb.rpc("my_visitors"))},
 async reach(){return Q(sb.rpc("my_reach"))},
 async addMyPlace(row){return Q(sb.from("my_places").insert(row).select("id").single())},
 async askStatus(){return Q(sb.rpc("ask_status"))},
 async asksForMe(){return Q(sb.rpc("asks_for_me"))},
 async askSend(qid,friends){return Q(sb.rpc("ask_send",{qid,friends}))},
 async askAnswer(rid,ans){return Q(sb.rpc("ask_answer",{rid,ans}))},
 async bondPropose(other,name){return Q(sb.rpc("bond_propose",{other,name}))},
 async bondRespond(other,accept){return Q(sb.rpc("bond_respond",{other,accept}))},
 async bondCancel(other){return Q(sb.rpc("bond_cancel",{other}))},
 async requestCard(id){return Q(sb.rpc("request_card",{target:id}))},
 async friendsOf(id){return Q(sb.rpc("friends_of",{target:id}))},
 async report(target,reason){return Q(sb.from("reports").insert({target_id:target,reason}))},
 // ── feed & inbox
 async feed(){return Q(sb.from("feed_events").select("id,user_id,kind,payload,created_at").order("created_at",{ascending:false}).limit(80))},
 async postFeed(kind,payload){try{await sb.from("feed_events").insert({kind,payload:payload||{}})}catch(e){}},
 async notifications(){return Q(sb.from("notifications").select("id,kind,actor_id,payload,read_at,created_at").order("created_at",{ascending:false}).limit(60))},
 async markRead(ids){if(!ids.length)return;return Q(sb.from("notifications").update({read_at:new Date().toISOString()}).in("id",ids))},
 async announcements(){return Q(sb.from("announcements").select("id,title,body,created_at").order("created_at",{ascending:false}).limit(20))},
 async cohort(){return Q(sb.rpc("cohort_summary"))},
 // ── CBT ops
 async feedback(row){return Q(sb.from("feedback").insert(row))},
 async uploadShot(uid,dataUrl){const p=`${uid}/${Date.now()}.jpg`;await Q(sb.storage.from("feedback-shots").upload(p,dataUrlToBlob(dataUrl),{contentType:"image/jpeg"}));return p},
 async supportUrl(){try{const r=await Q(sb.from("settings").select("value").eq("key","support_url").maybeSingle());return (r&&typeof r.value==="string")?r.value:""}catch(e){return ""}},
 async youtube(channel){return this.call("youtube",{channel})},
 async link(kind,ref){const pub=typeof linkSvc==="function"&&linkSvc(kind).pub;return this.call("fetch",{kind,ref},{url:pub?MIB_CONFIG.fnPub:MIB_CONFIG.fnLink})},
 async googleClientId(){try{const r=await Q(sb.from("settings").select("value").eq("key","google_client_id").maybeSingle());return (r&&typeof r.value==="string")?r.value.trim():""}catch(e){return ""}},
 async ai({task,prompt,images,signal}){const r=await this.call("ai",{task,prompt,images:images||[]},{signal});return r},
 async aiJSON(o){const r=await this.ai(o);try{return parseJSON(r.text)}catch(e){if(r.truncated){/* 끊기면 한 번만 더 — 깊게 읽는 모델(한도 8000)로 */if(o.task!=="read"&&!o._retry){track("ai_retry",{why:"too_long"});const r2=await this.ai({...o,task:"read",_retry:true});try{return parseJSON(r2.text)}catch(e2){throw Err(r2.truncated?"too_long":"invalid_json")}}throw Err("too_long")}throw e}},
 async deleteMe(){return this.call("delete_me",{})},
 // ── admin
 admin:{
  overview:()=>Q(sb.rpc("admin_overview")),
  createInvites:(n,prefix,label,uses)=>Q(sb.rpc("admin_create_invites",{n,prefix,lbl:label,uses})),
  setInviteActive:(code,active)=>Q(sb.from("invites").update({active}).eq("code",code)),
  announce:(title,body)=>Q(sb.from("announcements").insert({title,body})),
  delAnnouncement:id=>Q(sb.from("announcements").delete().eq("id",id)),
  feedback:()=>Q(sb.from("feedback").select("*").order("created_at",{ascending:false}).limit(2000)),
  reports:()=>Q(sb.from("reports").select("*").order("created_at",{ascending:false}).limit(200)),
  resolveReport:id=>Q(sb.from("reports").update({resolved:true}).eq("id",id)),
  hideCard:(uid,flag)=>Q(sb.rpc("admin_set_card_hidden",{target:uid,flag})),
  clearAvatar:uid=>Q(sb.rpc("admin_clear_avatar",{target:uid})),
  avatars:()=>Q(sb.from("profiles").select("id,avatar")),
  resetPassword:(uid,pw)=>api.call("admin_reset_password",{user_id:uid,password:pw}),
  setSetting:(key,value)=>Q(sb.from("settings").update({value}).eq("key",key)),
  errors:()=>Q(sb.rpc("admin_errors")),
  askQuestions:()=>Q(sb.from("ask_questions").select("*").order("ord")),
  addAskQuestion:row=>Q(sb.from("ask_questions").insert(row)),
  setAskQuestion:(id,patch)=>Q(sb.from("ask_questions").update(patch).eq("id",id)),
  alertConfig:()=>Q(sb.rpc("admin_alert_config")),
  setAlert:(email,enabled)=>Q(sb.rpc("admin_set_alert",{p_email:email,p_enabled:enabled})),
  alertTest:()=>api.call("alert_test",{}),
  shotUrls:async paths=>{paths=paths.filter(Boolean);if(!paths.length)return {};const r=await Q(sb.storage.from("feedback-shots").createSignedUrls(paths,3600));const m={};(r||[]).forEach(x=>{if(x.signedUrl)m[x.path]=x.signedUrl});return m},
  events:()=>Q(sb.from("events").select("user_id,name,props,day,created_at").order("id",{ascending:true}).limit(20000)),
  ping:()=>api.call("ping",{},{auth:false})
 }
};

/* event log for CBT metrics — batched, never blocks the UI */
const tracker={q:[],t:null,uid:null,
 push(name,props){if(!this.uid)return;this.q.push({name:String(name).slice(0,40),props:props||{}});if(this.q.length>=20)this.flush();else{clearTimeout(this.t);this.t=setTimeout(()=>this.flush(),4000)}},
 async flush(){if(!this.q.length||!this.uid)return;const rows=this.q.splice(0,50);try{await sb.from("events").insert(rows)}catch(e){}}
};
const track=(n,p)=>tracker.push(n,p);
try{document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="hidden")tracker.flush()})}catch(e){}
