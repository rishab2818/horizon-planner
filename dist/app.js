import { taskDB, uid } from './db/storage.js';
import { parseNaturalTask, iso } from './utils/nlp.js';
import { taskCard, dayView, weekView, monthView, yearView, localISO } from './components/views.js';

const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];
const labelColors = ['#f06b43','#8a9d73','#6b8fb0','#ae79a5','#d4a94d','#7e79bf'];
const state = { tasks: [], view: 'day', cursor: new Date(), label: 'all', energy: 'all', draggedId: null, selectedId: null };

function toast(message) {
  const node = document.createElement('div'); node.className='toast'; node.textContent=message; $('#toastRegion').append(node);
  setTimeout(()=>node.remove(), 3000);
}

function colorFor(label='Personal') {
  let total=0; for(const c of label) total += c.charCodeAt(0); return labelColors[total % labelColors.length];
}

function dateLabel() {
  const d=state.cursor;
  if(state.view==='day') return d.toLocaleDateString([], {weekday:'long',month:'long',day:'numeric'});
  if(state.view==='week') { const s=new Date(d);s.setDate(d.getDate()-((d.getDay()+6)%7));const e=new Date(s);e.setDate(s.getDate()+6);return `${s.toLocaleDateString([],{month:'short',day:'numeric'})} – ${e.toLocaleDateString([],{month:'short',day:'numeric',year:'numeric'})}`; }
  if(state.view==='month') return d.toLocaleDateString([], {month:'long',year:'numeric'});
  return String(d.getFullYear());
}

function visibleTasks() {
  return state.tasks.map(task => ({...task, _filtered:(state.label!=='all'&&task.label!==state.label)||(state.energy!=='all'&&task.energy!==state.energy)}));
}

function render() {
  $('#eyebrow').textContent=dateLabel();
  const headlines={day:['Make space for','what matters.'],week:['Shape the week,','keep room to breathe.'],month:['See the rhythm,','not just the rush.'],year:['A wider view,','one gentle step.']};
  $('#periodTitle').innerHTML=`${headlines[state.view][0]}<br><em>${headlines[state.view][1]}</em>`;
  $$('.view-tab').forEach(button=>button.classList.toggle('active',button.dataset.view===state.view));
  const tasks=visibleTasks(); const container=$('#viewContainer'); container.style.animation='none'; void container.offsetWidth; container.style.animation='';
  if(state.view==='day') container.innerHTML=dayView(state.cursor,tasks);
  if(state.view==='week') container.innerHTML=weekView(state.cursor,tasks);
  if(state.view==='month') container.innerHTML=monthView(state.cursor,tasks);
  if(state.view==='year') container.innerHTML=yearView(state.cursor,tasks);
  renderSidebar(tasks); bindDynamic(); applyFilters(); updateNowLine();
  if(state.view==='day') setTimeout(()=>{ const hour=Math.max(0,new Date().getHours()-2); $('.timeline-scroll')?.scrollTo({top:hour*60,behavior:'smooth'}); },60);
}

function renderSidebar(tasks) {
  const backlog=tasks.filter(t=>!t.date&&!t.completed); $('#backlogCount').textContent=`${backlog.length} task${backlog.length===1?'':'s'}`;
  $('#backlog').innerHTML=backlog.map(t=>taskCard(t)).join('') || '<p class="empty-note">Drop a task here or add one below.</p>';
  const labels=[...new Set(state.tasks.map(t=>t.label).filter(Boolean))];
  $('#labelFilters').innerHTML=`<button class="filter-chip ${state.label==='all'?'active':''}" data-label="all">All</button>`+labels.map(label=>`<button class="filter-chip ${state.label===label?'active':''}" data-label="${label}"><i style="--chip:${colorFor(label)}"></i>${label}</button>`).join('');
}

function applyFilters(){
  $$('[data-task-id]').forEach(node=>{const task=state.tasks.find(t=>t.id===node.dataset.taskId);if(!task)return;node.classList.toggle('filtered',(state.label!=='all'&&task.label!==state.label)||(state.energy!=='all'&&task.energy!==state.energy));node.classList.toggle('selected-task',state.selectedId===task.id);});
}

function bindDynamic(){
  $$('[draggable="true"]').forEach(node=>{
    node.addEventListener('dragstart',e=>{state.draggedId=node.dataset.taskId;node.classList.add('dragging');e.dataTransfer.effectAllowed='move';e.dataTransfer.setData('text/plain',state.draggedId);});
    node.addEventListener('dragend',()=>{node.classList.remove('dragging');state.draggedId=null;$$('.drag-over').forEach(x=>x.classList.remove('drag-over'));});
    node.addEventListener('click',e=>{if(e.target.closest('button'))return;state.selectedId=state.selectedId===node.dataset.taskId?null:node.dataset.taskId;applyFilters();if(state.selectedId&&matchMedia('(pointer:coarse)').matches)toast('Task picked up — tap a day or time to place it');});
  });
  $$('.dropzone').forEach(zone=>{
    zone.addEventListener('dragover',e=>{e.preventDefault();zone.classList.add('drag-over');});
    zone.addEventListener('dragleave',()=>zone.classList.remove('drag-over'));
    zone.addEventListener('drop',e=>{e.preventDefault();zone.classList.remove('drag-over');placeTask(state.draggedId||e.dataTransfer.getData('text/plain'),zone);});
    zone.addEventListener('click',e=>{if(state.selectedId&&!e.target.closest('[data-task-id]'))placeTask(state.selectedId,zone);});
  });
  $$('[data-action="complete"]').forEach(button=>button.onclick=()=>completeTask(button.closest('[data-task-id]').dataset.taskId));
  $$('[data-action="edit"]').forEach(button=>button.onclick=()=>openTask(button.closest('[data-task-id]').dataset.taskId));
  $$('[data-add-date]').forEach(button=>button.onclick=()=>openTask(null,button.dataset.addDate));
  $$('.filter-chip').forEach(button=>button.onclick=()=>{state.label=button.dataset.label;render();});
  const dayTab=$('[data-view="day"]');
  dayTab.ondragover=e=>e.preventDefault(); dayTab.ondragenter=()=>{if(state.view!=='day'){state.view='day';render();toast('Now drop it onto a time');}};
  $$('.resize-handle').forEach(handle=>handle.onpointerdown=startResize);
}

async function placeTask(id,zone){
  const task=state.tasks.find(t=>t.id===id);if(!task)return;
  if(zone.dataset.dropzone==='backlog'){task.date=null;task.start=null;}
  else {task.date=zone.dataset.date||zone.closest('[data-date]')?.dataset.date||localISO(state.cursor);if(zone.dataset.minute!=null)task.start=Number(zone.dataset.minute);else if(task.start==null)task.start=9*60;}
  task.updatedAt=Date.now();await taskDB.put(task);state.selectedId=null;render();toast(task.date?`Scheduled “${task.title}”`:`Moved “${task.title}” to backlog`);
}

function startResize(event){
  event.preventDefault();event.stopPropagation();const task=state.tasks.find(t=>t.id===event.currentTarget.closest('[data-task-id]').dataset.taskId);const startY=event.clientY;const original=task.duration||60;
  const move=e=>{task.duration=Math.max(15,Math.round((original+e.clientY-startY)/15)*15);event.currentTarget.closest('.timeline-task').style.setProperty('--height',`${task.duration}px`);};
  const end=async()=>{removeEventListener('pointermove',move);removeEventListener('pointerup',end);await taskDB.put(task);render();toast(`Duration set to ${task.duration} minutes`);};
  addEventListener('pointermove',move);addEventListener('pointerup',end);
}

async function completeTask(id){const task=state.tasks.find(t=>t.id===id);task.completed=!task.completed;task.updatedAt=Date.now();await taskDB.put(task);render();toast(task.completed?'Nicely done.':'Task restored.');}

function openTask(id=null,date=null){
  const task=state.tasks.find(t=>t.id===id);$('#taskId').value=task?.id||'';$('#taskTitle').value=task?.title||'';$('#taskDate').value=task?.date||date||'';$('#taskTime').value=task?.start!=null?`${String(Math.floor(task.start/60)).padStart(2,'0')}:${String(task.start%60).padStart(2,'0')}`:'';$('#taskDuration').value=task?.duration||60;$('#taskLabel').value=task?.label||'';$('#taskEnergy').value=task?.energy||'none';$('#taskReminder').checked=!!task?.reminder;$('#deleteTaskBtn').style.visibility=task?'visible':'hidden';$('#taskDialog').showModal();setTimeout(()=>$('#taskTitle').focus(),50);
}

async function saveForm(event){
  event.preventDefault();const id=$('#taskId').value||uid();const existing=state.tasks.find(t=>t.id===id);const time=$('#taskTime').value;const label=$('#taskLabel').value.trim()||null;
  const task={...existing,id,title:$('#taskTitle').value.trim(),date:$('#taskDate').value||null,start:time?Number(time.split(':')[0])*60+Number(time.split(':')[1]):null,duration:Number($('#taskDuration').value),label,energy:$('#taskEnergy').value,reminder:$('#taskReminder').checked,color:colorFor(label||'Personal'),completed:existing?.completed||false,createdAt:existing?.createdAt||Date.now(),updatedAt:Date.now()};
  await taskDB.put(task);const index=state.tasks.findIndex(t=>t.id===id);if(index>=0)state.tasks[index]=task;else state.tasks.push(task);$('#taskDialog').close();render();toast(existing?'Task updated':'Task added');
}

async function deleteCurrent(){const id=$('#taskId').value;if(!id)return;await taskDB.delete(id);state.tasks=state.tasks.filter(t=>t.id!==id);$('#taskDialog').close();render();toast('Task deleted');}

async function quickAdd(raw){
  if(!raw.trim())return;const parsed=parseNaturalTask(raw);const task={id:uid(),...parsed,color:colorFor(parsed.label||'Personal'),reminder:false,completed:false,createdAt:Date.now(),updatedAt:Date.now()};state.tasks.push(task);await taskDB.put(task);$('#quickInput').value='';render();toast(parsed.date?`Added for ${parsed.date}`:'Added to backlog');
}

function moveCursor(direction){const d=state.cursor;if(state.view==='day')d.setDate(d.getDate()+direction);if(state.view==='week')d.setDate(d.getDate()+direction*7);if(state.view==='month')d.setMonth(d.getMonth()+direction);if(state.view==='year')d.setFullYear(d.getFullYear()+direction);render();}

function setupVoice(){
  const Recognition=window.SpeechRecognition||window.webkitSpeechRecognition;if(!Recognition){toast('Voice recognition is not available in this browser');return;}
  const recognition=new Recognition();recognition.lang=navigator.language||'en-US';recognition.interimResults=true;const button=$('#voiceBtn');button.classList.add('listening');
  recognition.onresult=e=>{const phrase=[...e.results].map(r=>r[0].transcript).join('');$('#quickInput').value=phrase;if(e.results[e.results.length-1].isFinal)quickAdd(phrase);};
  recognition.onerror=()=>toast('I could not hear that — try typing it instead');recognition.onend=()=>button.classList.remove('listening');recognition.start();
}

async function enableNotifications(){if(!('Notification'in window)){toast('Desktop notifications are not supported here');return;}const result=await Notification.requestPermission();toast(result==='granted'?'Reminders are enabled':'Notifications remain off');}

function checkReminders(){
  if(!('Notification'in window)||Notification.permission!=='granted')return;const now=new Date();const today=iso(now);const minute=now.getHours()*60+now.getMinutes();
  state.tasks.filter(t=>t.reminder&&t.date===today&&!t.completed&&t.start!=null&&!t.notified&&t.start-minute<=10&&t.start-minute>=0).forEach(async task=>{new Notification(`Up next: ${task.title}`,{body:`Starts in ${Math.max(0,task.start-minute)} minutes`});task.notified=today;await taskDB.put(task);});
}

function updateNowLine(){const line=$('#nowLine');if(!line)return;if(localISO(state.cursor)!==localISO(new Date())){line.style.display='none';return;}const now=new Date();line.style.display='block';line.style.top=`${now.getHours()*60+now.getMinutes()}px`;}

async function seedIfNeeded(){
  state.tasks=await taskDB.all();if(state.tasks.length)return;const today=localISO(new Date());const tomorrow=localISO(new Date(Date.now()+86400000));const base=Math.min(18,Math.max(8,new Date().getHours()))*60;state.tasks=[
    {id:uid(),title:'Focus on the one important thing',date:today,start:base,duration:90,label:'Work',energy:'high',color:colorFor('Work'),completed:false,createdAt:Date.now()},
    {id:uid(),title:'Walk and reset',date:today,start:Math.min(22*60,base+150),duration:45,label:'Health',energy:'low',color:colorFor('Health'),completed:false,createdAt:Date.now()},
    {id:uid(),title:'Weekly reflection',date:tomorrow,start:17*60,duration:30,label:'Personal',energy:'low',color:colorFor('Personal'),completed:false,createdAt:Date.now()},
    {id:uid(),title:'Sketch launch ideas',date:null,start:null,duration:60,label:'Work',energy:'high',color:colorFor('Work'),completed:false,createdAt:Date.now()},
    {id:uid(),title:'Book dentist',date:null,start:null,duration:30,label:'Personal',energy:'low',color:colorFor('Personal'),completed:false,createdAt:Date.now()}
  ];await taskDB.bulkPut(state.tasks);
}

$$('.view-tab').forEach(button=>button.onclick=()=>{state.view=button.dataset.view;render();});
$('#prevBtn').onclick=()=>moveCursor(-1);$('#nextBtn').onclick=()=>moveCursor(1);$('#todayBtn').onclick=()=>{state.cursor=new Date();render();};
$('#quickInput').onkeydown=e=>{if(e.key==='Enter')quickAdd(e.currentTarget.value);};$('#voiceBtn').onclick=setupVoice;$('#notifyBtn').onclick=enableNotifications;
$('#themeBtn').onclick=()=>{const next=document.documentElement.dataset.theme==='dark'?'light':'dark';document.documentElement.dataset.theme=next;localStorage.setItem('horizon-theme',next);};
$('#addBtn').onclick=()=>openTask();$('#sideAddBtn').onclick=()=>openTask();$('#taskForm').addEventListener('submit',saveForm);$('#deleteTaskBtn').onclick=deleteCurrent;
$('#collapseBtn').onclick=()=>{$('#sidebar').classList.remove('open');if(innerWidth>900){$('#sidebar').classList.toggle('collapsed');$('.content-grid').classList.toggle('sidebar-hidden');}};$('#mobileBacklogBtn').onclick=()=>$('#sidebar').classList.toggle('open');
$('#energyFilter').onclick=e=>{const button=e.target.closest('button');if(!button)return;state.energy=button.dataset.energy;$$('#energyFilter button').forEach(b=>b.classList.toggle('active',b===button));render();};
document.addEventListener('keydown',e=>{if((e.key==='n'||e.key==='N')&&!['INPUT','SELECT','TEXTAREA'].includes(e.target.tagName))openTask();if(e.key==='Escape')$('#sidebar').classList.remove('open');});

document.documentElement.dataset.theme=localStorage.getItem('horizon-theme')||'light';
await seedIfNeeded();render();setInterval(()=>{updateNowLine();checkReminders();},30000);checkReminders();
