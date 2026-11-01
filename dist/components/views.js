const escapeHTML = value => String(value ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
const mins = value => `${String(Math.floor(value / 60)).padStart(2,'0')}:${String(value % 60).padStart(2,'0')}`;
const fmtTime = value => new Date(2000,0,1,Math.floor(value/60),value%60).toLocaleTimeString([], {hour:'numeric',minute:'2-digit'});
const addDays = (date, amount) => { const d = new Date(date); d.setDate(d.getDate() + amount); return d; };
const localISO = date => `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;

export function taskCard(task, compact = false) {
  const style = `--label:${task.color || '#ff754a'}`;
  return `<article class="task-card ${task.completed ? 'completed' : ''} ${compact ? 'compact' : ''}" style="${style}" draggable="true" data-task-id="${task.id}">
    <button class="check" data-action="complete" aria-label="Complete task">${task.completed ? '✓' : ''}</button>
    <div class="task-copy"><strong>${escapeHTML(task.title)}</strong><span>${task.start != null ? fmtTime(task.start) : task.label ? `#${escapeHTML(task.label)}` : 'Anytime'}${task.energy === 'high' ? ' · ⚡' : task.energy === 'low' ? ' · 🔋' : ''}</span></div>
    <button class="more" data-action="edit" aria-label="Edit task">•••</button>
  </article>`;
}

export function dayView(date, tasks) {
  const dateISO = localISO(date);
  const scheduled = tasks.filter(t => t.date === dateISO && t.start != null && !t.completed);
  const positioned = scheduled.map(task => {
    const top = task.start;
    const height = Math.max(30, task.duration || 60);
    return `<article class="timeline-task" draggable="true" data-task-id="${task.id}" style="--top:${top}px;--height:${height}px;--label:${task.color || '#ff754a'}">
      <button class="check" data-action="complete" aria-label="Complete task"></button><div><strong>${escapeHTML(task.title)}</strong><span>${fmtTime(task.start)} – ${fmtTime(task.start + (task.duration || 60))}${task.label ? ` · #${escapeHTML(task.label)}` : ''}</span></div><button class="more" data-action="edit">•••</button><i class="resize-handle" title="Drag to change duration"></i>
    </article>`;
  }).join('');
  return `<div class="day-head"><div><span class="kicker">Daily rhythm</span><strong>${scheduled.length} scheduled · ${Math.max(0, 24 * 60 - scheduled.reduce((s,t)=>s+(t.duration||60),0))} min open</strong></div><div class="day-legend"><i></i> Drag tasks into a time</div></div>
  <div class="timeline-scroll"><div class="timeline" data-date="${dateISO}">
    ${Array.from({length:24}, (_, hour) => `<div class="hour-row dropzone" data-minute="${hour*60}"><span>${hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour-12} PM`}</span><i></i></div>`).join('')}
    <div class="now-line" id="nowLine"><span>Now</span></div>${positioned}
  </div></div>`;
}

export function weekView(date, tasks) {
  const start = addDays(date, -((date.getDay()+6)%7));
  return `<div class="week-grid">${Array.from({length:7}, (_,i) => {
    const day = addDays(start,i); const key = localISO(day); const list = tasks.filter(t => t.date === key && !t.completed).sort((a,b)=>(a.start??9999)-(b.start??9999));
    return `<section class="week-day dropzone ${key===localISO(new Date())?'today':''}" data-date="${key}"><header><span>${day.toLocaleDateString([], {weekday:'short'})}</span><strong>${day.getDate()}</strong></header><div class="week-items">${list.map(t=>taskCard(t,true)).join('')}</div><button class="day-add" data-add-date="${key}">＋</button></section>`;
  }).join('')}</div>`;
}

export function monthView(date, tasks) {
  const first = new Date(date.getFullYear(), date.getMonth(), 1); const offset = (first.getDay()+6)%7; const gridStart = addDays(first,-offset);
  return `<div class="month-weekdays">${['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(x=>`<span>${x}</span>`).join('')}</div><div class="month-grid">${Array.from({length:42},(_,i)=>{
    const day=addDays(gridStart,i); const key=localISO(day); const list=tasks.filter(t=>t.date===key&&!t.completed); const muted=day.getMonth()!==date.getMonth();
    return `<section class="month-day dropzone ${muted?'muted':''} ${key===localISO(new Date())?'today':''}" data-date="${key}"><header>${day.getDate()}</header>${list.slice(0,3).map(t=>`<div class="month-task" draggable="true" data-task-id="${t.id}" style="--label:${t.color || '#ff754a'}"><i></i>${escapeHTML(t.title)}</div>`).join('')}${list.length>3?`<small>+${list.length-3} more</small>`:''}</section>`;
  }).join('')}</div>`;
}

export function yearView(date, tasks) {
  const year=date.getFullYear();
  return `<div class="year-intro"><div><span class="kicker">${year} overview</span><strong>Think big. Keep it light.</strong></div><p>Drag a commitment onto <b>Day</b> above, then choose its time.</p></div><div class="year-grid">${Array.from({length:12},(_,month)=>{
    const list=tasks.filter(t=>t.date && new Date(`${t.date}T12:00`).getFullYear()===year && new Date(`${t.date}T12:00`).getMonth()===month && !t.completed);
    return `<section class="year-month"><header><strong>${new Date(year,month,1).toLocaleDateString([], {month:'long'})}</strong><span>${list.length}</span></header><div>${list.slice(0,4).map(t=>`<article class="year-task" draggable="true" data-task-id="${t.id}" style="--label:${t.color||'#ff754a'}"><i></i><span>${escapeHTML(t.title)}</span></article>`).join('') || '<p>Open space</p>'}</div></section>`;
  }).join('')}</div>`;
}

export { localISO, mins };
