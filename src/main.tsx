import { StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import type { Session } from "@supabase/supabase-js";
import { ArrowRight, Check, LoaderCircle, LockKeyhole, Mail, Sparkles } from "lucide-react";
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
      <button className="auth-switch" onClick={()=>{setMode(mode === "signup" ? "signin" : "signup");setMessage("")}}>{mode === "signup" ? "Already have an account? Sign in" : "New here? Create an account"}</button>
    </div></section>
  </main>;
}

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  useEffect(()=>{
    supabase.auth.getSession().then(({data})=>{setSession(data.session);setReady(true)});
    const {data:{subscription}}=supabase.auth.onAuthStateChange((_event,next)=>{setSession(next);setReady(true)});
    return()=>subscription.unsubscribe();
  },[]);
  if(!ready) return <div className="loading"><span className="logo-lines"><i/><i/><i/></span><p>Opening your horizon…</p></div>;
  if(!session) return <AuthScreen/>;
  const email=session.user.email || "Planner";
  const name=String(session.user.user_metadata?.name || email.split("@")[0]);
  return <Planner user={{name,email}} onSignOut={()=>supabase.auth.signOut()}/>;
}

createRoot(document.getElementById("root")!).render(<StrictMode><App/></StrictMode>);
