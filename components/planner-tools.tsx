import { useMemo, useState } from "react";
import { CalendarClock, Check, ChevronRight, Flame, Plus, Search, Sparkles, X } from "lucide-react";
import type { Goal, Task } from "../app/planner";

export function PlanDayModal({tasks,onClose,onPlan}:{tasks:Task[];onClose:()=>void;onPlan:(ids:string[])=>void}){
  const choices=useMemo(()=>tasks.filter(t=>!t.completed&&(!t.date||t.priority)).sort((a,b)=>Number(b.priority)-Number(a.priority)).slice(0,10),[tasks]);
  const [selected,setSelected]=useState<string[]>(()=>choices.slice(0,3).map(t=>t.id));
  const toggle=(id:string)=>setSelected(s=>s.includes(id)?s.filter(x=>x!==id):s.length<3?[...s,id]:s);
  return <div className="overlay"><section className="tool-modal"><header><div><small>PLAN MY DAY</small><h2>Choose three things.</h2><p>Horizon will find calm, open spaces for them today.</p></div><button onClick={onClose}><X/></button></header><div className="choice-list">{choices.map(task=><button className={selected.includes(task.id)?"selected":""} onClick={()=>toggle(task.id)} key={task.id}><span>{selected.includes(task.id)?<Check/>:<Plus/>}</span><div><b>{task.title}</b><small>{task.duration} min · #{task.label}</small></div>{task.priority&&<Flame/>}</button>)}{!choices.length&&<p className="empty">Your day is already beautifully clear.</p>}</div><footer><span>{selected.length}/3 selected</span><button disabled={!selected.length} onClick={()=>onPlan(selected)}><Sparkles/> Plan these</button></footer></section></div>
}

export function MissedTasksModal({tasks,onClose,onAction}:{tasks:Task[];onClose:()=>void;onAction:(id:string,action:"today"|"tomorrow"|"backlog"|"delete")=>void}){
  return <div className="overlay"><section className="tool-modal missed"><header><div><small>A FRESH START</small><h2>What should move forward?</h2><p>No guilt—just give yesterday’s loose ends a new home.</p></div><button onClick={onClose}><X/></button></header><div className="missed-list">{tasks.map(task=><article key={task.id}><div><b>{task.title}</b><small>Was planned for {new Date(`${task.date}T12:00`).toLocaleDateString([],{month:"short",day:"numeric"})}</small></div><div><button onClick={()=>onAction(task.id,"today")}>Today</button><button onClick={()=>onAction(task.id,"tomorrow")}>Tomorrow</button><button onClick={()=>onAction(task.id,"backlog")}>Backlog</button><button className="remove" onClick={()=>onAction(task.id,"delete")}>×</button></div></article>)}</div></section></div>
}

const templates=[
  {id:"morning",icon:"☀️",title:"Morning reset",description:"Plan, stretch and start intentionally",count:3},
  {id:"workout",icon:"🏃",title:"Workout rhythm",description:"Warm up, train and recover",count:3},
  {id:"study",icon:"📚",title:"Study sprint",description:"Prepare, focus and review",count:3},
  {id:"review",icon:"✨",title:"Weekly review",description:"Reflect, clear and choose priorities",count:3},
];
export function TemplatesModal({onClose,onApply}:{onClose:()=>void;onApply:(id:string)=>void}){return <div className="overlay"><section className="tool-modal"><header><div><small>GENTLE ROUTINES</small><h2>Start from a rhythm.</h2><p>Add a useful routine without building it step by step.</p></div><button onClick={onClose}><X/></button></header><div className="template-grid">{templates.map(item=><button key={item.id} onClick={()=>onApply(item.id)}><span>{item.icon}</span><div><b>{item.title}</b><small>{item.description} · {item.count} tasks</small></div><ChevronRight/></button>)}</div></section></div>}

export function CommandPalette({tasks,goals,onClose,onTask,onGoal,onNew,onPlan}:{tasks:Task[];goals:Goal[];onClose:()=>void;onTask:(t:Task)=>void;onGoal:()=>void;onNew:()=>void;onPlan:()=>void}){
  const [query,setQuery]=useState("");const q=query.toLowerCase();const results=tasks.filter(t=>!q||t.title.toLowerCase().includes(q)||t.label.toLowerCase().includes(q)).slice(0,8);const goalResults=goals.filter(g=>q&&g.title.toLowerCase().includes(q)).slice(0,3);
  return <div className="command-overlay" onMouseDown={e=>{if(e.target===e.currentTarget)onClose()}}><section className="command-box"><div className="command-input"><Search/><input autoFocus value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search tasks, goals or labels…"/><kbd>esc</kbd></div>{!query&&<div className="command-actions"><button onClick={onNew}><Plus/>New task</button><button onClick={onPlan}><CalendarClock/>Plan my day</button><button onClick={onGoal}><Flame/>Open goals</button></div>}<div className="command-results">{results.map(task=><button key={task.id} onClick={()=>onTask(task)}><span className={task.completed?"done":""}>{task.completed?<Check/>:<i/>}</span><div><b>{task.title}</b><small>#{task.label}{task.date?` · ${task.date}`:" · Backlog"}</small></div><ChevronRight/></button>)}{goalResults.map(goal=><button key={goal.id} onClick={onGoal}><span><Flame/></span><div><b>{goal.title}</b><small>Goal</small></div><ChevronRight/></button>)}{query&&!results.length&&!goalResults.length&&<p className="empty">Nothing found.</p>}</div></section></div>
}
