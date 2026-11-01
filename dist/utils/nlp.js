const dayNames = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];

const iso = date => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

export function parseNaturalTask(raw, now = new Date()) {
  let title = raw.trim();
  let date = null;
  let start = null;
  let energy = 'none';
  let label = null;

  const tag = title.match(/#([\w-]+)/);
  const labelPhrase = title.match(/\b(?:with\s+)?label\s+([\w-]+)/i);
  if (tag) label = tag[1];
  else if (labelPhrase) label = labelPhrase[1];

  if (/\b(high energy|energetic)\b/i.test(title)) energy = 'high';
  if (/\b(low energy|easy|light task)\b/i.test(title)) energy = 'low';

  const target = new Date(now);
  if (/\btoday\b/i.test(title)) date = iso(target);
  if (/\btomorrow\b/i.test(title)) { target.setDate(target.getDate() + 1); date = iso(target); }
  for (let i = 0; i < dayNames.length; i++) {
    if (new RegExp(`\\b${dayNames[i]}\\b`, 'i').test(title)) {
      const delta = (i - now.getDay() + 7) % 7 || 7;
      target.setTime(now.getTime()); target.setDate(now.getDate() + delta); date = iso(target); break;
    }
  }
  const explicitDate = title.match(/\b(\d{1,2})[\/-](\d{1,2})(?:[\/-](\d{2,4}))?\b/);
  if (explicitDate) {
    const year = explicitDate[3] ? Number(explicitDate[3].length === 2 ? `20${explicitDate[3]}` : explicitDate[3]) : now.getFullYear();
    date = iso(new Date(year, Number(explicitDate[2]) - 1, Number(explicitDate[1])));
  }

  const time = title.match(/\b(?:at\s*)?(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/i) || title.match(/\bat\s+(\d{1,2})(?::(\d{2}))?\b/i);
  if (time) {
    let hour = Number(time[1]); const minute = Number(time[2] || 0); const meridiem = time[3]?.toLowerCase();
    if (meridiem === 'pm' && hour < 12) hour += 12;
    if (meridiem === 'am' && hour === 12) hour = 0;
    start = hour * 60 + minute;
    if (!date) date = iso(now);
  }

  title = title
    .replace(/#([\w-]+)/g, '')
    .replace(/\b(?:with\s+)?label\s+[\w-]+/gi, '')
    .replace(/\b(high energy|low energy|energetic|light task)\b/gi, '')
    .replace(/\b(today|tomorrow|sunday|monday|tuesday|wednesday|thursday|friday|saturday)\b/gi, '')
    .replace(/\b(?:at\s*)?\d{1,2}(?::\d{2})?\s*(?:am|pm)\b/gi, '')
    .replace(/\s{2,}/g, ' ').replace(/\s+([,.])/g, '$1').trim().replace(/[,.-]+$/, '').trim();
  return { title: title || raw.trim(), date, start, label, energy, duration: 60 };
}

export { iso };
