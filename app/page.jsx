"use client";

import { useEffect, useMemo, useState } from "react";

function pad2(n) { return n.toString().padStart(2, "0"); }
function toKey(d) { return `${d.getFullYear()}-${pad2(d.getMonth()+1)}-${pad2(d.getDate())}`; }
function startOfDay(d){ const x=new Date(d); x.setHours(0,0,0,0); return x; }
function addMonths(d, m){ const x=new Date(d); x.setMonth(x.getMonth()+m); return x; }
function isSameDay(a,b){return a.getFullYear()===b.getFullYear()&&a.getMonth()===b.getMonth()&&a.getDate()===b.getDate();}
function short(str, n=10){ if(!str) return ""; return str.length>n ? str.slice(0,n)+"…" : str; }

const DURATION_OPTIONS = [30, 60, 120, 180];
const DEFAULT_DURATION = DURATION_OPTIONS[1];
const QUARTER_MINUTES = 15;
const MAX_TIME_MINUTES = 23 * 60 + 45;

const HOURS = Array.from({ length: 24 }, (_, i) => pad2(i));
const MINUTE_OPTIONS = ["00", "15", "30", "45"];

function splitTime(value) {
  if (!value) return { hour: "", minute: "" };
  const [hourRaw = "", minuteRaw = ""] = value.split(":");
  const hour = HOURS.includes(hourRaw) ? hourRaw : "";
  const minute = MINUTE_OPTIONS.includes(minuteRaw) ? minuteRaw : "";
  return { hour, minute };
}

function joinTime(hour, minute) {
  return hour && minute ? `${hour}:${minute}` : "";
}

function createEmptyForm() {
  return { time: "", title: "", service: "", duration: DEFAULT_DURATION, notes: "" };
}

function normalizeToQuarterHour(value, { fallbackToOriginal = true } = {}) {
  if (!value) return "";
  const parts = value.split(":");
  if (parts.length !== 2) return fallbackToOriginal ? value : "";
  const [hourStr, minuteStr] = parts;
  const hour = Number(hourStr);
  const minute = Number(minuteStr);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return fallbackToOriginal ? value : "";
  const totalMinutes = Math.max(0, Math.min(hour * 60 + minute, MAX_TIME_MINUTES));
  const rounded = Math.round(totalMinutes / QUARTER_MINUTES) * QUARTER_MINUTES;
  const clamped = Math.max(0, Math.min(rounded, MAX_TIME_MINUTES));
  return `${pad2(Math.floor(clamped / 60))}:${pad2(clamped % 60)}`;
}

// 曜日
const WEEKDAYS = ["日","月","火","水","木","金","土"];

// 祝日（2025年）
const HOLIDAYS_2025 = {
  "2025-01-01": "元日",
  "2025-01-13": "成人の日",
  "2025-02-11": "建国記念の日",
  "2025-02-23": "天皇誕生日",
  "2025-02-24": "振替休日",
  "2025-03-20": "春分の日",
  "2025-04-29": "昭和の日",
  "2025-05-03": "憲法記念日",
  "2025-05-04": "みどりの日",
  "2025-05-05": "こどもの日",
  "2025-05-06": "振替休日",
  "2025-07-21": "海の日",
  "2025-08-11": "山の日",
  "2025-09-15": "敬老の日",
  "2025-09-23": "秋分の日",
  "2025-10-13": "スポーツの日",
  "2025-11-03": "文化の日",
  "2025-11-23": "勤労感謝の日",
  "2025-11-24": "振替休日",
};
const holidayName = (d) => HOLIDAYS_2025[toKey(d)] || null;

const STORAGE_KEY = "appointments_v1";

function useLocalAppointments() {
  const [map, setMap] = useState({});
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setMap(JSON.parse(raw));
    } catch {}
  }, []);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(map)); } catch {}
  }, [map]);

  const add = (dateKey, appt) => {
    setMap(prev => {
      const list = prev[dateKey] ? [...prev[dateKey]] : [];
      const withId = { id: crypto.randomUUID(), ...appt };
      return { ...prev, [dateKey]: [...list, withId] };
    });
  };

  const update = (dateKey, id, patch) => {
    setMap(prev => {
      const list = prev[dateKey] || [];
      return { ...prev, [dateKey]: list.map(x => x.id === id ? { ...x, ...patch } : x) };
    });
  };

  const remove = (dateKey, id) => {
    setMap(prev => {
      const list = prev[dateKey] || [];
      return { ...prev, [dateKey]: list.filter(x => x.id !== id) };
    });
  };

  return { map, add, update, remove };
}

function MonthGrid({ current, apptsByDay, onSelectDay, selected }) {
  const year = current.getFullYear();
  const month = current.getMonth();
  const first = new Date(year, month, 1);
  const startWeekday = first.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const days = [];
  // prev month padding
  for (let i = 0; i < startWeekday; i++) {
    const d = new Date(year, month, -i);
    days.unshift({ date: d, current: false });
  }
  // current month days
  for (let i = 1; i <= daysInMonth; i++) {
    days.push({ date: new Date(year, month, i), current: true });
  }
  // tail to complete full weeks
  while (days.length % 7 !== 0) {
    const last = days[days.length - 1].date;
    days.push({ date: new Date(last.getFullYear(), last.getMonth(), last.getDate() + 1), current: false });
  }

  const today = startOfDay(new Date());

  return (
    <div className="calendar-wrap panel">
      <div className="weekdays">
        {WEEKDAYS.map((w) => (
          <div key={w} className={`${w === '日' ? 'sun' : ''} ${w === '土' ? 'sat' : ''}`}>{w}</div>
        ))}
      </div>
      <div className="grid" style={{ padding: 8 }}>
        {days.map(({ date, current: isCurrent }) => {
          const key = toKey(date);
          const list = (apptsByDay && apptsByDay[key]) || [];
          const isToday = isSameDay(date, today);
          const isSelected = selected && isSameDay(date, selected);
          const dw = date.getDay();
          const isSun = dw === 0;
          const isSat = dw === 6;
          const isHol = !!holidayName(date);
          return (
            <div
              key={key}
              className={`day-cell ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''} ${isHol ? 'holiday' : ''} ${isSun ? 'sunday' : ''} ${isSat ? 'saturday' : ''} ${isCurrent ? '' : 'other-month'}`}
              onClick={() => onSelectDay(date)}
            >
              <div className="day-num">{date.getDate()}</div>
              {list.length > 0 && (
                <div className="titles" aria-label={`${list.length}件の予定`}>
                  {list
                    .slice()
                    .sort((a,b)=> (a.time||"").localeCompare(b.time||""))
                    .slice(0,2)
                    .map((x)=> (
                      <div key={x.id} className="title" title={`${x.time||''} ${x.title||''}`}>{short(x.title||'', 10)}</div>
                  ))}
                  {list.length > 2 && <div className="more">+{list.length-2}</div>}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DaySheet({ open, date, list, onClose, onAdd, onUpdate, onDelete }){
  const [form, setForm] = useState(() => createEmptyForm());
  const [timeSelection, setTimeSelection] = useState(() => splitTime(""));
  const [editingId, setEditingId] = useState(null);
  useEffect(() => { if (open) { setForm(createEmptyForm()); setTimeSelection(splitTime("")); setEditingId(null); } }, [open]);
  const sortedList = useMemo(() => (list || []).slice().sort((a,b)=> (a.time||"").localeCompare(b.time||"")), [list]);
  if (!open || !date) return null;
  const key = toKey(date);
  const onSubmit = (e) => {
    e.preventDefault();
    if (!form.time || !form.title) return;
    const normalizedTime = normalizeToQuarterHour(form.time, { fallbackToOriginal: false });
    if (!normalizedTime) return;
    const normalizedDuration = DURATION_OPTIONS.includes(form.duration) ? form.duration : DEFAULT_DURATION;
    const payload = { ...form, time: normalizedTime, duration: normalizedDuration };
    if (editingId) { onUpdate(key, editingId, payload); }
    else { onAdd(key, payload); }
    setForm(createEmptyForm());
    setTimeSelection(splitTime(""));
    setEditingId(null);
  };
  const startEdit = (appt) => {
    const candidateDuration = Number(appt.duration);
    const nextDuration = DURATION_OPTIONS.includes(candidateDuration) ? candidateDuration : DEFAULT_DURATION;
    const normalizedTime = normalizeToQuarterHour(appt.time || "");
    setForm({
      time: normalizedTime,
      title: appt.title || "",
      service: appt.service || "",
      duration: nextDuration,
      notes: appt.notes || "",
    });
    setTimeSelection(splitTime(normalizedTime));
    setEditingId(appt.id);
  };

  return (
    <div className="bottom-sheet" role="dialog" aria-modal="true">
      <div className="drag-handle" />
      <div className="row" style={{marginBottom: 8}}>
        <div style={{fontWeight:700}}>{key} の予定</div>
        <div className="space" />
        <button className="secondary" onClick={onClose}>閉じる</button>
      </div>

      <div className="list" style={{marginBottom: 12}}>
        {sortedList.length === 0 && (
          <div className="item" style={{opacity:.8}}>まだ予定はありません</div>
        )}
        {sortedList.map((x) => (
          <div className="item" key={x.id}>
            <div className="row" style={{gap: 10}}>
              <div className="chip" style={{background: "var(--chip-bg)", borderColor: "var(--chip-border)"}}>{x.time}</div>
              <div style={{fontWeight:600, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap"}}>{x.title}</div>
              <div className="space" />
              <button className="ghost" onClick={() => startEdit(x)}>編集</button>
              <button className="ghost" onClick={() => onDelete(key, x.id)} style={{color:"var(--danger)"}}>削除</button>
            </div>
            {(x.service || x.duration || x.notes) && (
              <div className="meta" style={{marginTop:6}}>
                {x.service ? `メニュー: ${x.service} ` : ''}
                {x.duration ? `/ ${x.duration}分` : ''}
                {x.notes ? `\nメモ: ${x.notes}` : ''}
              </div>
            )}
          </div>
        ))}
      </div>

      <form className="form" onSubmit={onSubmit}>
        <div className="grid-2">
          <label>
            <div className="meta">開始時間</div>
            <div className="row" style={{gap: 8}}>
              <select
                value={timeSelection.hour}
                onChange={(e) => {
                  const nextHour = e.target.value;
                  setTimeSelection((prev) => {
                    if (!nextHour) {
                      setForm((v) => ({ ...v, time: "" }));
                      return { hour: "", minute: "" };
                    }
                    const updated = { ...prev, hour: nextHour };
                    setForm((v) => ({ ...v, time: joinTime(updated.hour, updated.minute) }));
                    return updated;
                  });
                }}
                required
              >
                <option value="">--</option>
                {HOURS.map((hour) => (
                  <option key={hour} value={hour}>{`${hour}時`}</option>
                ))}
              </select>
              <select
                value={timeSelection.minute}
                onChange={(e) => {
                  const nextMinute = e.target.value;
                  setTimeSelection((prev) => {
                    const updated = { ...prev, minute: nextMinute };
                    setForm((v) => ({ ...v, time: joinTime(updated.hour, updated.minute) }));
                    return updated;
                  });
                }}
                required
                disabled={!timeSelection.hour}
              >
                <option value="">--</option>
                {MINUTE_OPTIONS.map((minute) => (
                  <option key={minute} value={minute}>{`${minute}分`}</option>
                ))}
              </select>
            </div>
          </label>
          <div />
        </div>
        <label>
          <div className="meta">予定名</div>
          <input placeholder="例: 山田様 ジェル" value={form.title} onChange={e=>setForm(v=>({...v,title:e.target.value}))} required />
        </label>
        <div className="grid-2">
          <label>
            <div className="meta">メニュー</div>
            <input placeholder="例: ワンカラー" value={form.service} onChange={e=>setForm(v=>({...v,service:e.target.value}))} />
          </label>
          <label>
            <div className="meta">所要時間</div>
            <select
              value={String(form.duration)}
              onChange={(e) => {
                const value = Number(e.target.value);
                setForm((v) => ({ ...v, duration: DURATION_OPTIONS.includes(value) ? value : DEFAULT_DURATION }));
              }}
            >
              {DURATION_OPTIONS.map((minutes) => (
                <option key={minutes} value={minutes}>{minutes}分</option>
              ))}
            </select>
          </label>
        </div>
        <label>
          <div className="meta">メモ</div>
          <textarea rows={3} placeholder="オプション、注意点など" value={form.notes} onChange={e=>setForm(v=>({...v,notes:e.target.value}))} />
        </label>
        <div className="row" style={{justifyContent:"flex-end"}}>
          {editingId && <button type="button" className="ghost" onClick={()=>{ setForm(createEmptyForm()); setTimeSelection(splitTime("")); setEditingId(null); }}>キャンセル</button>}
          <button type="submit">{editingId ? '保存' : '追加'}</button>
        </div>
      </form>
    </div>
  );
}

export default function Page() {
  const [current, setCurrent] = useState(startOfDay(new Date()));
  const [selected, setSelected] = useState(null);
  const { map, add, update, remove } = useLocalAppointments();

  const apptsByDay = map;

  const monthLabel = `${current.getFullYear()}年 ${current.getMonth()+1}月`;

  const openDay = (d) => setSelected(d);
  const closeDay = () => setSelected(null);

  return (
    <main>
      <div className="panel" style={{marginBottom: 12}}>
        <div className="calendar-header">
          <button className="secondary" onClick={() => setCurrent(addMonths(current, -1))}>◀︎</button>
          <div className="month-title" style={{minWidth: 140, textAlign: "center"}}>{monthLabel}</div>
          <button className="secondary" onClick={() => setCurrent(addMonths(current, 1))}>▶︎</button>
          <div className="space" />
          <button className="ghost" onClick={() => { const t = startOfDay(new Date()); setCurrent(t); setSelected(t); }}>今日</button>
        </div>
      </div>

      <MonthGrid current={current} apptsByDay={apptsByDay} onSelectDay={openDay} selected={selected} />

      <DaySheet
        open={!!selected}
        date={selected}
        list={selected ? map[toKey(selected)] : []}
        onClose={closeDay}
        onAdd={add}
        onUpdate={update}
        onDelete={remove}
      />
    </main>
  );
}
