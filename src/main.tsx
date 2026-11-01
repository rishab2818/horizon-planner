import { StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import type { Session } from "@supabase/supabase-js";
import { ArrowRight, Check, LoaderCircle, LockKeyhole, Mail, Sparkles, Trash2, UserRound, X } from "lucide-react";
import Planner from "../app/planner";
import { isConfigured, supabase } from "./supabase";
import "../app/globals.css";

function AuthScreen() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true); setMessage("");
    const result = mode === "signup"
      ? await supabase.auth.signUp({ email, password, options: { data: { name: name.trim() || email.split("@")[0] } } })
      : await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (result.error) return setMessage(result.error.message);
    if (mode === "signup" && !result.data.session) setMessage("Check your email to confirm your account, then sign in.");
  }
  async function resetPassword(){if(!email)return setMessage("Enter your email first.");setBusy(true);const {error}=await supabase.auth.resetPasswordForEmail(email,{redirectTo:window.location.origin});setBusy(false);setMessage(error?.message||"Password reset link sent.")}

  return <main className="auth-page">
    <section className="auth-story">
      <span className="auth-brand"><i/><i/><i/></span>
      <div><small>A CALMER WAY TO PLAN</small><h1>Make space for<br/><em>what matters.</em></h1><p>One quiet place for your tasks, goals, focus time and weekly rhythm—on every device.</p></div>
      <ul><li><Check/> Private by default</li><li><Check/> Works offline</li><li><Check/> Syncs across devices</li></ul>
    </section>
    <section className="auth-panel"><div className="auth-card">
      <span className="auth-icon"><Sparkles/></span>
      <small>{mode === "signup" ? "CREATE YOUR SPACE" : "WELCOME BACK"}</small>
      <h2>{mode === "signup" ? "Start gently." : "Your horizon awaits."}</h2>
      <p>{mode === "signup" ? "A minute to join. No clutter afterward." : "Sign in to continue where you left off."}</p>
      {!isConfigured && <div className="auth-message">Supabase environment variables have not been configured yet.</div>}
      <form onSubmit={submit}>
        {mode === "signup" && <label>Your name<div><Sparkles/><input value={name} onChange={e=>setName(e.target.value)} placeholder="What should we call you?" required/></div></label>}
        <label>Email<div><Mail/><input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" required/></div></label>
        <label>Password<div><LockKeyhole/><input type="password" minLength={8} value={password} onChange={e=>setPassword(e.target.value)} placeholder="At least 8 characters" required/></div></label>
        {message && <div className="auth-message">{message}</div>}
        <button disabled={busy || !isConfigured}>{busy ? <LoaderCircle className="spin"/> : <>{mode === "signup" ? "Create my account" : "Sign in"}<ArrowRight/></>}</button>
      </form>
      {mode==="signin"&&<button className="auth-switch secondary" onClick={resetPassword}>Forgot password?</button>}<button className="auth-switch" onClick={()=>{setMode(mode === "signup" ? "signin" : "signup");setMessage("")}}>{mode === "signup" ? "Already have an account? Sign in" : "New here? Create an account"}</button>
    </div></section>
  </main>;
}

function AccountSettings({session,onClose}:{session:Session;onClose:()=>void}){
  const [name,setName]=useState(String(session.user.user_metadata?.name||""));const [email,setEmail]=useState(session.user.email||"");const [password,setPassword]=useState("");const [confirm,setConfirm]=useState("");const [busy,setBusy]=useState(false);const [message,setMessage]=useState("");
  async function save(){setBusy(true);setMessage("");const changes:{email?:string;password?:string;data?:{name:string}}={data:{name:name.trim()}};if(email&&email!==session.user.email)changes.email=email;if(password)changes.password=password;const {error}=await supabase.auth.updateUser(changes);setBusy(false);setMessage(error?.message||"Account updated.");setPassword("")}
  async function remove(){if(confirm!=="DELETE")return;setBusy(true);const {error}=await supabase.rpc("delete_my_account");if(error){setMessage(`${error.message}. Run supabase/account-controls.sql once.`);setBusy(false);return}await supabase.auth.signOut()}
  return <div className="overlay"><section className="account-modal"><header><div><small>ACCOUNT & SECURITY</small><h2>Your Horizon account</h2></div><button onClick={onClose}><X/></button></header><div className="account-avatar"><UserRound/><div><b>{session.user.email}</b><small>Your planner data is protected by your Supabase account.</small></div></div><label>Name<input value={name} onChange={e=>setName(e.target.value)}/></label><label>Email<input type="email" value={email} onChange={e=>setEmail(e.target.value)}/></label><label>New password<input type="password" minLength={8} value={password} onChange={e=>setPassword(e.target.value)} placeholder="Leave blank to keep it"/></label>{message&&<div className="auth-message">{message}</div>}<button className="account-save" disabled={busy} onClick={save}>{busy?"Working…":"Save changes"}</button><section className="danger-zone"><div><Trash2/><div><b>Delete account</b><small>Permanently deletes your account and cloud planner data.</small></div></div><input value={confirm} onChange={e=>setConfirm(e.target.value)} placeholder="Type DELETE"/><button disabled={confirm!=="DELETE"||busy} onClick={remove}>Delete permanently</button></section></section></div>
}

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const [accountOpen,setAccountOpen]=useState(false);
  useEffect(()=>{
    supabase.auth.getSession().then(({data})=>{setSession(data.session);setReady(true)});
    const {data:{subscription}}=supabase.auth.onAuthStateChange((event,next)=>{setSession(next);setReady(true);if(event==="PASSWORD_RECOVERY")setAccountOpen(true)});
    return()=>subscription.unsubscribe();
  },[]);
  if(!ready) return <div className="loading"><span className="logo-lines"><i/><i/><i/></span><p>Opening your horizon…</p></div>;
  if(!session) return <AuthScreen/>;
  const email=session.user.email || "Planner";
  const name=String(session.user.user_metadata?.name || email.split("@")[0]);
  return <><Planner user={{name,email}} onSignOut={()=>supabase.auth.signOut()} onAccount={()=>setAccountOpen(true)}/>{accountOpen&&<AccountSettings session={session} onClose={()=>setAccountOpen(false)}/>}</>;
}

createRoot(document.getElementById("root")!).render(<StrictMode><App/></StrictMode>);
