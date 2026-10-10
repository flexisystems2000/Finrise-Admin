import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const cors={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type","Access-Control-Allow-Methods":"POST, OPTIONS","Content-Type":"application/json"};
const reply=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:cors});
Deno.serve(async(req)=>{if(req.method==="OPTIONS")return new Response("ok",{headers:cors});if(req.method!=="POST")return reply({error:"Method not allowed"},405);
 const url=Deno.env.get("SUPABASE_URL")!;const anon=Deno.env.get("SUPABASE_ANON_KEY")||Deno.env.get("SUPABASE_PUBLISHABLE_KEY")||"";const service=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")||Deno.env.get("FINRISE_SERVICE_ROLE_KEY")||"";if(!service||!anon)return reply({error:"Admin API secrets are not configured"},500);
 const auth=req.headers.get("Authorization")||"";if(!auth.startsWith("Bearer "))return reply({error:"Authentication required"},401);
 const userClient=createClient(url,anon,{global:{headers:{Authorization:auth}},auth:{persistSession:false}});const {data:{user},error:ue}=await userClient.auth.getUser();if(ue||!user)return reply({error:"Invalid or expired session"},401);
 const admin=createClient(url,service,{auth:{persistSession:false,autoRefreshToken:false}});const {data:role,error:re}=await admin.from("admin_roles").select("role").eq("user_id",user.id).maybeSingle();if(re||!role)return reply({error:"Administrator access required"},403);
 let body;try{body=await req.json()}catch{return reply({error:"Invalid JSON"},400)}const action=body.action;
 const profileMap=async rows=>{const ids=[...new Set((rows||[]).map(x=>x.user_id).filter(Boolean))];if(!ids.length)return rows||[];const {data:profiles}=await admin.from("profiles").select("id,full_name,username").in("id",ids);const map=new Map((profiles||[]).map(p=>[p.id,p]));return (rows||[]).map(x=>({...x,full_name:map.get(x.user_id)?.full_name||map.get(x.user_id)?.username||x.user_id}))};
 try{
 if(action==="overview"){
  const [profiles,wallets,deposits,withdrawals,investments,ledger,audit,refs]=await Promise.all([
   admin.from("profiles").select("id,full_name,username,created_at").order("created_at",{ascending:false}).limit(500),admin.from("wallets").select("user_id,available_balance,locked_balance"),admin.from("deposits").select("*").order("created_at",{ascending:false}).limit(300),admin.from("withdrawals").select("*").order("created_at",{ascending:false}).limit(300),admin.from("investments").select("*").order("started_at",{ascending:false}).limit(300),admin.from("ledger_entries").select("*").order("created_at",{ascending:false}).limit(500),admin.from("audit_logs").select("*").order("created_at",{ascending:false}).limit(100),admin.from("referrals").select("id,referrer_id,referred_user_id,referral_code,created_at").limit(500)]);
  for(const x of [profiles,wallets,deposits,withdrawals,investments,ledger,audit,refs])if(x.error)throw x.error;
  const walletMap=new Map((wallets.data||[]).map(w=>[w.user_id,w]));const investmentTotals=new Map();for(const i of investments.data||[])investmentTotals.set(i.user_id,(investmentTotals.get(i.user_id)||0)+Number(i.principal||0));const refTotals=new Map();for(const r of refs.data||[])refTotals.set(r.referrer_id,(refTotals.get(r.referrer_id)||0)+1);
  const users=(profiles.data||[]).map(p=>({...p,email:null,available_balance:walletMap.get(p.id)?.available_balance||0,locked_balance:walletMap.get(p.id)?.locked_balance||0,invested:investmentTotals.get(p.id)||0,referrals:refTotals.get(p.id)||0}));
  const ds=await profileMap(deposits.data||[]),ws=await profileMap(withdrawals.data||[]),is=await profileMap(investments.data||[]),ls=await profileMap(ledger.data||[]);
  const plans=await admin.from("investment_plans").select("id,name");if(plans.error)throw plans.error;const pmap=new Map((plans.data||[]).map(p=>[p.id,p.name]));for(const i of is)i.plan_name=pmap.get(i.plan_id)||"Plan";
  return reply({stats:{users:profiles.data.length,depositTotal:(deposits.data||[]).filter(x=>x.status==='approved').reduce((s,x)=>s+Number(x.amount||0),0),withdrawalTotal:(withdrawals.data||[]).filter(x=>x.status==='completed').reduce((s,x)=>s+Number(x.amount||0),0),investedTotal:(investments.data||[]).filter(x=>x.status==='active').reduce((s,x)=>s+Number(x.principal||0),0),pendingDeposits:(deposits.data||[]).filter(x=>x.status==='pending').length,pendingWithdrawals:(withdrawals.data||[]).filter(x=>x.status==='pending').length},users,deposits:ds,withdrawals:ws,investments:is,ledger:ls,audit:audit.data||[],activity:[...(ledger.data||[]).slice(0,5),...(audit.data||[]).slice(0,5)].sort((a,b)=>new Date(b.created_at)-new Date(a.created_at))});
 }
 if(action==="transaction-action"){
  const {type,decision,id,reason}=body;if(!id||!['deposit','withdrawal'].includes(type))return reply({error:"Invalid transaction request"},400);let rpc;
  if(type==='deposit'&&decision==='approve')rpc='admin_approve_deposit';else if(type==='deposit'&&decision==='reject')rpc='admin_reject_deposit';else if(type==='withdrawal'&&decision==='complete')rpc='admin_complete_withdrawal';else if(type==='withdrawal'&&decision==='reject')rpc='admin_reject_withdrawal';else return reply({error:"Unsupported action"},400);
  const arg=type==='deposit'?{p_deposit_id:id}:{p_withdrawal_id:id};
  // These SQL routines validate is_admin(auth.uid()); invoke with the signed-in user's JWT.
  const result=await userClient.rpc(rpc,arg);
  if(result.error)throw result.error;
  if(result.data !== true)throw new Error('The transaction action was not confirmed by the database. Refresh and check its status.');
  return reply({ok:true,result:true});
 }
 if(action==='settings-get')return reply({settings:{platform_name:'Finriseassets'}});
 return reply({error:'Unknown action'},400);
 }catch(e){console.error('finrise-admin-api',e);return reply({error:e?.message||'Internal server error'},500)}
});