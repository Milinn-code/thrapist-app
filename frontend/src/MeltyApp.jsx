// @ts-nocheck
import { useState, useMemo, createContext, useContext, useEffect, useRef } from "react";

// ============================================================
// グローバル状態（予定・給料設定を全タブで共有）
// ============================================================
const AppCtx = createContext(null);

const INIT_SCHEDULE = [
  {id:1,date:"2026-03-06",type:"shift",title:"出勤",startTime:"19:00",endTime:"02:00",detail:""},
  {id:2,date:"2026-03-06",type:"visit",title:"伝説のIT社長様 来店予定",detail:"リシャール補充要確認",amount:80000},
  {id:3,date:"2026-03-10",type:"birthday",title:"夜ふかしの伯爵様 お誕生日🎂",detail:"アルマンド ロゼ 準備必須"},
  {id:4,date:"2026-03-13",type:"shift",title:"出勤",startTime:"20:00",endTime:"03:00",detail:""},
  {id:5,date:"2026-03-15",type:"shift",title:"出勤",startTime:"19:00",endTime:"02:00",detail:""},
  {id:6,date:"2026-03-19",type:"shift",title:"出勤",startTime:"20:00",endTime:"02:00",detail:""},
  {id:7,date:"2026-03-20",type:"visit",title:"気まぐれジョージ様 来店予定",detail:"山崎残量チェック",amount:35000},
  {id:8,date:"2026-03-25",type:"shift",title:"出勤",startTime:"19:00",endTime:"03:00",detail:""},
  {id:9,date:"2026-03-27",type:"birthday",title:"新規の田中様 お誕生日🎂",detail:""},
];

// カスタムイベント種別（追加可能）
const DEFAULT_TYPES = [
  {key:"visit",  label:"来店",   color:"#ec4899", emoji:"👤"},
  {key:"birthday",label:"誕生日", color:"#f43f5e", emoji:"🎂"},
];

// ============================================================
// モックデータ
// ============================================================
const mockCustomers = [
  {id:"1",name:"伝説のIT社長",kana:"デンセツノITシャチョウ",rank:"S",lastVisit:"2026-03-01",bottle:"リシャール（残りわずか）",birthday:"1980-08-15",memo:"ゴルフの話NG。最近猫を飼い始めたらしい（名前：タマ）。",group:"VIP",company:"大手IT企業 社長",totalSales:4500000,tags:["VIP","太客","猫好き"],visits:[{date:"2026-03-01",amount:350000,note:"リシャール x1, フルーツ盛り合わせ",type:"bottle"},{date:"2026-02-10",amount:120000,note:"同伴（寿司）からの来店",type:"call"},{date:"2026-01-25",amount:50000,note:"フリー指名",type:"bottle"}]},
  {id:"2",name:"夜ふかしの伯爵",kana:"ヨフカシノハクシャク",rank:"A",lastVisit:"2026-02-15",bottle:"アルマンド ロゼ",birthday:"1975-12-24",memo:"甘いおつまみ必須。終電前に帰る。",group:"常連",company:"外資系金融 部長",totalSales:980000,tags:["甘党","音楽好き","早帰り"],visits:[{date:"2026-02-15",amount:85000,note:"アルマンド ロゼ追加",type:"bottle"},{date:"2026-01-20",amount:60000,note:"知人紹介あり",type:"call"}]},
  {id:"3",name:"新規の田中様",kana:"シンキノタナカサマ",rank:"D",lastVisit:"2026-03-03",bottle:"なし",birthday:"1990-04-01",memo:"名刺もらった。次回ワイン聞き出す。",group:"新規",company:"IT系（詳細不明）",totalSales:25000,tags:["新規","IT系"],visits:[{date:"2026-03-03",amount:25000,note:"初来店・フリー",type:"bottle"}]},
  {id:"4",name:"気まぐれジョージ",kana:"キマグレジョージ",rank:"B",lastVisit:"2025-11-20",bottle:"山崎18年",birthday:"1988-02-10",memo:"3ヶ月ご無沙汰。音楽で盛り上がる。",group:"常連",company:"中堅商社 課長",totalSales:620000,tags:["音楽好き","ウイスキー党","ご無沙汰"],visits:[{date:"2025-11-20",amount:75000,note:"山崎ボトルキープ更新",type:"bottle"},{date:"2025-10-05",amount:50000,note:"接待同伴",type:"call"}]},
];

const RS = {S:{bg:"#ec4899",tx:"#fff"},A:{bg:"#ffe4e6",tx:"#e11d48"},B:{bg:"#ffedd5",tx:"#ea580c"},C:{bg:"#f1f5f9",tx:"#64748b"},D:{bg:"#dbeafe",tx:"#2563eb"}};

// ============================================================
// 勤務時間計算ユーティリティ
// ============================================================
function calcShiftHours(startTime, endTime) {
  if (!startTime || !endTime) return 0;
  const [sh, sm] = startTime.split(":").map(Number);
  const [eh, em] = endTime.split(":").map(Number);
  let start = sh * 60 + sm;
  let end = eh * 60 + em;
  if (end <= start) end += 24 * 60; // 深夜越え
  return (end - start) / 60;
}

function getMonthShiftHours(schedule, year, month) {
  const prefix = `${year}-${String(month).padStart(2,"0")}`;
  return schedule
    .filter(e => e.type === "shift" && e.date.startsWith(prefix))
    .reduce((sum, e) => sum + calcShiftHours(e.startTime, e.endTime), 0);
}

// ============================================================
// SVG アイコン
// ============================================================
const Ico = ({path,size=20,color="#94a3b8",w=1.8}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round">
    {(Array.isArray(path)?path:[path]).map((p,i)=><path key={i} d={p}/>)}
  </svg>
);
const P={
  users:["M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2","M9 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8z","M23 21v-2a4 4 0 0 0-3-3.87","M16 3.13a4 4 0 0 1 0 7.75"],
  cal:["M8 2v4","M16 2v4","M3 10h18","M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"],
  bar:["M18 20V10","M12 20V4","M6 20v-6"],
  cfg:["M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z","M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"],
  srch:["M21 21l-4.35-4.35","M17 11a6 6 0 1 0-12 0 6 6 0 0 0 12 0"],
  plus:["M12 5v14","M5 12h14"],
  back:["M15 18l-6-6 6-6"],
  fwd:["M9 18l6-6-6-6"],
  wine:["M18 8h1a4 4 0 0 1 0 8h-1","M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z","M6 1v3","M10 1v3","M14 1v3"],
  gift:["M20 12v10H4V12","M22 7H2v5h20V7z","M12 22V7","M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z","M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"],
  clk:["M12 22c5.52 0 10-4.48 10-10S17.52 2 12 2 2 6.48 2 12s4.48 10 10 10z","M12 6v6l4 2"],
  alrt:["M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z","M12 9v4","M12 17h.01"],
  brf:["M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z","M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"],
  edt:["M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7","M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"],
  bell:["M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9","M13.73 21a2 2 0 0 1-3.46 0"],
  star:["M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"],
  trnd:["M23 6l-9.5 9.5-5-5L1 18"],
  filter:["M22 3H2l8 9.46V19l4 2v-8.54L22 3z"],
  tag:["M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z","M7 7h.01"],
  x:["M18 6L6 18","M6 6l12 12"],
  pen:["M12 20h9","M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"],
  del:["M3 6h18","M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"],
  paint:["M12 2a10 10 0 1 0 10 10","M12 8v4l3 3"],
};

// ============================================================
// UI ユーティリティ
// ============================================================
const inputSt = {width:"100%",padding:"10px 14px",background:"#f8fafc",border:"1.5px solid #f1f5f9",borderRadius:12,fontSize:13,color:"#334155",outline:"none",boxSizing:"border-box"};

function Sheet({onClose,title,children}){
  return(
    <div style={{position:"absolute",inset:0,zIndex:100,background:"rgba(15,23,42,0.45)",display:"flex",alignItems:"flex-end"}} onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
      <div style={{width:"100%",background:"#fff",borderRadius:"24px 24px 0 0",padding:"20px 20px 28px",boxSizing:"border-box",maxHeight:"85%",overflowY:"auto"}}>
        <div style={{width:40,height:4,background:"#e2e8f0",borderRadius:99,margin:"0 auto 16px"}}/>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
          <span style={{fontSize:16,fontWeight:900,color:"#1e293b"}}>{title}</span>
          <button onClick={onClose} style={{background:"none",border:"none",cursor:"pointer"}}><Ico path={P.x} size={20} color="#94a3b8"/></button>
        </div>
        {children}
      </div>
    </div>
  );
}
function Fld({label,hint,children}){
  return(
    <div style={{marginBottom:13}}>
      <p style={{fontSize:11,fontWeight:800,color:"#94a3b8",marginBottom:hint?2:5}}>{label}</p>
      {hint&&<p style={{fontSize:10,color:"#cbd5e1",marginBottom:5}}>{hint}</p>}
      {children}
    </div>
  );
}
function PBtn({onClick,disabled,children,color}){
  const bg=disabled?"#e2e8f0":color||"linear-gradient(135deg,#ec4899,#f43f5e)";
  return(
    <button onClick={onClick} disabled={disabled} style={{width:"100%",padding:"13px 0",background:bg,color:disabled?"#94a3b8":"#fff",border:"none",borderRadius:16,fontWeight:900,fontSize:15,cursor:disabled?"default":"pointer",marginTop:4}}>
      {children}
    </button>
  );
}

// ============================================================
// フィルターモーダル
// ============================================================
function FilterModal({onClose,onApply,current}){
  const [rank,setRank]=useState(current.rank||"all");
  const [group,setGroup]=useState(current.group||"all");
  const [warn,setWarn]=useState(current.warn||false);
  return(
    <Sheet onClose={onClose} title="絞り込み">
      <Fld label="ランク">
        <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
          {["all","S","A","B","C","D"].map(r=>(
            <button key={r} onClick={()=>setRank(r)} style={{padding:"6px 14px",borderRadius:20,border:`1.5px solid ${rank===r?"#ec4899":"#e2e8f0"}`,background:rank===r?"#fdf2f8":"#fff",color:rank===r?"#ec4899":"#64748b",fontWeight:700,fontSize:12,cursor:"pointer"}}>
              {r==="all"?"全て":`Rank ${r}`}
            </button>
          ))}
        </div>
      </Fld>
      <Fld label="グループ">
        <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
          {["all","VIP","常連","新規"].map(g=>(
            <button key={g} onClick={()=>setGroup(g)} style={{padding:"6px 14px",borderRadius:20,border:`1.5px solid ${group===g?"#ec4899":"#e2e8f0"}`,background:group===g?"#fdf2f8":"#fff",color:group===g?"#ec4899":"#64748b",fontWeight:700,fontSize:12,cursor:"pointer"}}>
              {g==="all"?"全て":g}
            </button>
          ))}
        </div>
      </Fld>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 14px",background:"#fdf2f8",borderRadius:14,marginBottom:16}}>
        <span style={{fontSize:13,fontWeight:700,color:"#64748b"}}>⚠️ ご無沙汰（90日以上）のみ</span>
        <button onClick={()=>setWarn(!warn)} style={{width:44,height:24,borderRadius:99,border:"none",cursor:"pointer",position:"relative",background:warn?"linear-gradient(135deg,#ec4899,#f43f5e)":"#e2e8f0"}}>
          <div style={{position:"absolute",top:3,left:warn?22:3,width:18,height:18,borderRadius:"50%",background:"#fff",transition:"left 0.2s",boxShadow:"0 1px 4px rgba(0,0,0,0.15)"}}/>
        </button>
      </div>
      <PBtn onClick={()=>{onApply({rank,group,warn});onClose();}}>適用する</PBtn>
    </Sheet>
  );
}

// ============================================================
// 来店記録追加モーダル
// ============================================================
function AddVisitModal({onClose,onAdd}){
  const [date,setDate]=useState("2026-03-06");
  const [amount,setAmount]=useState("");
  const [note,setNote]=useState("");
  const [type,setType]=useState("bottle");
  return(
    <Sheet onClose={onClose} title="来店記録を追加">
      <Fld label="来店日"><input type="date" value={date} onChange={e=>setDate(e.target.value)} style={inputSt}/></Fld>
      <Fld label="売上金額（円）"><input type="number" placeholder="例: 80000" value={amount} onChange={e=>setAmount(e.target.value)} style={inputSt}/></Fld>
      <Fld label="種別">
        <div style={{display:"flex",gap:8}}>
          {[{v:"bottle",l:"🍷 ボトル"},{v:"call",l:"📞 同伴"},{v:"other",l:"✨ その他"}].map(t=>(
            <button key={t.v} onClick={()=>setType(t.v)} style={{flex:1,padding:"8px 0",borderRadius:12,border:`1.5px solid ${type===t.v?"#ec4899":"#e2e8f0"}`,background:type===t.v?"#fdf2f8":"#fff",color:type===t.v?"#ec4899":"#64748b",fontWeight:700,fontSize:11,cursor:"pointer"}}>{t.l}</button>
          ))}
        </div>
      </Fld>
      <Fld label="メモ">
        <textarea placeholder="例: リシャール x1" value={note} onChange={e=>setNote(e.target.value)} style={{...inputSt,minHeight:60,resize:"none",fontFamily:"inherit"}}/>
      </Fld>
      <PBtn onClick={()=>{if(amount&&note){onAdd({date,amount:parseInt(amount),note,type});onClose();}}} disabled={!amount||!note}>追加する</PBtn>
    </Sheet>
  );
}

// ============================================================
// 予定編集モーダル
// ============================================================
function EditEventModal({event,onClose,onSave,onDelete,customTypes}){
  const [title,setTitle]=useState(event.title||"");
  const [detail,setDetail]=useState(event.detail||"");
  const [startTime,setStartTime]=useState(event.startTime||"");
  const [endTime,setEndTime]=useState(event.endTime||"");
  const [amount,setAmount]=useState(event.amount?String(event.amount):"");
  return(
    <Sheet onClose={onClose} title="予定を編集">
      <Fld label="タイトル"><input value={title} onChange={e=>setTitle(e.target.value)} style={inputSt}/></Fld>
      {event.type==="shift"&&(
        <Fld label="時間">
          <div style={{display:"flex",gap:8,alignItems:"center"}}>
            <input type="time" value={startTime} onChange={e=>setStartTime(e.target.value)} style={{...inputSt,flex:1}}/>
            <span style={{color:"#94a3b8",fontSize:13}}>〜</span>
            <input type="time" value={endTime} onChange={e=>setEndTime(e.target.value)} style={{...inputSt,flex:1}}/>
          </div>
        </Fld>
      )}
      {event.type==="visit"&&(
        <Fld label="売上目標（円）"><input type="number" value={amount} onChange={e=>setAmount(e.target.value)} style={inputSt}/></Fld>
      )}
      <Fld label="メモ">
        <textarea value={detail} onChange={e=>setDetail(e.target.value)} style={{...inputSt,minHeight:52,resize:"none",fontFamily:"inherit"}}/>
      </Fld>
      <PBtn onClick={()=>{onSave({...event,title,detail,startTime,endTime,amount:amount?parseInt(amount):undefined});onClose();}}>保存する</PBtn>
      <button onClick={()=>{onDelete(event.id);onClose();}} style={{width:"100%",padding:"11px 0",background:"#fff",color:"#f43f5e",border:"1.5px solid #fecdd3",borderRadius:16,fontWeight:700,fontSize:14,cursor:"pointer",marginTop:8}}>
        この予定を削除
      </button>
    </Sheet>
  );
}

// ============================================================
// カスタムイベント種別管理モーダル
// ============================================================
const PRESET_COLORS = ["#3b82f6","#10b981","#f59e0b","#8b5cf6","#06b6d4","#ef4444","#f97316","#84cc16"];
const PRESET_EMOJIS = ["🌙","🍸","🚗","⭐","🎵","💙","🌸","🎯","💌","🎪"];

function ManageTypesModal({onClose,customTypes,setCustomTypes}){
  const [newLabel,setNewLabel]=useState("");
  const [newColor,setNewColor]=useState("#3b82f6");
  const [newEmoji,setNewEmoji]=useState("🌙");

  const add=()=>{
    if(!newLabel.trim()) return;
    const key="custom_"+Date.now();
    setCustomTypes(p=>[...p,{key,label:newLabel.trim(),color:newColor,emoji:newEmoji}]);
    setNewLabel("");
  };

  return(
    <Sheet onClose={onClose} title="イベント種別の管理">
      {/* 既存カスタム種別 */}
      {customTypes.length>0&&(
        <div style={{marginBottom:16}}>
          <p style={{fontSize:11,fontWeight:800,color:"#94a3b8",marginBottom:8}}>登録済みの種別</p>
          {customTypes.map(t=>(
            <div key={t.key} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 12px",background:"#f8fafc",borderRadius:12,marginBottom:6}}>
              <div style={{width:10,height:10,borderRadius:"50%",background:t.color,flexShrink:0}}/>
              <span style={{fontSize:14}}>{t.emoji}</span>
              <span style={{flex:1,fontSize:13,fontWeight:700,color:"#334155"}}>{t.label}</span>
              <button onClick={()=>setCustomTypes(p=>p.filter(x=>x.key!==t.key))} style={{background:"none",border:"none",cursor:"pointer"}}><Ico path={P.x} size={16} color="#f43f5e"/></button>
            </div>
          ))}
        </div>
      )}
      {/* 新規追加 */}
      <p style={{fontSize:11,fontWeight:800,color:"#94a3b8",marginBottom:8}}>新しい種別を追加</p>
      <Fld label="種別名">
        <input value={newLabel} onChange={e=>setNewLabel(e.target.value)} placeholder="例: アフター, 同伴" style={inputSt}/>
      </Fld>
      <Fld label="カレンダーの色">
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
          {PRESET_COLORS.map(c=>(
            <button key={c} onClick={()=>setNewColor(c)} style={{width:28,height:28,borderRadius:"50%",background:c,border:`3px solid ${newColor===c?"#334155":"transparent"}`,cursor:"pointer"}}/>
          ))}
        </div>
      </Fld>
      <Fld label="アイコン（絵文字）">
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
          {PRESET_EMOJIS.map(e=>(
            <button key={e} onClick={()=>setNewEmoji(e)} style={{width:36,height:36,borderRadius:10,border:`2px solid ${newEmoji===e?"#ec4899":"#e2e8f0"}`,background:newEmoji===e?"#fdf2f8":"#fff",fontSize:18,cursor:"pointer"}}>{e}</button>
          ))}
        </div>
      </Fld>
      <PBtn onClick={add} disabled={!newLabel.trim()}>追加する</PBtn>
    </Sheet>
  );
}

// ============================================================
// 予定追加モーダル
// ============================================================
function AddEventModal({onClose,onAdd,defaultDate,allTypes}){
  const [type,setType]=useState(allTypes[0]?.key||"visit");
  const [title,setTitle]=useState("");
  const [date,setDate]=useState(defaultDate||"2026-03-06");
  const [detail,setDetail]=useState("");
  const [startTime,setStartTime]=useState("19:00");
  const [endTime,setEndTime]=useState("02:00");
  const [amount,setAmount]=useState("");

  const isShift=type==="shift";
  const isVisit=type==="visit";

  return(
    <Sheet onClose={onClose} title="予定を追加">
      <Fld label="種別">
        <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
          {[{key:"shift",label:"出勤",color:"#8b5cf6",emoji:"🌙"},...allTypes].map(t=>(
            <button key={t.key} onClick={()=>setType(t.key)}
              style={{display:"flex",alignItems:"center",gap:5,padding:"6px 12px",borderRadius:20,border:`1.5px solid ${type===t.key?t.color:"#e2e8f0"}`,background:type===t.key?"#faf5ff":"#fff",color:type===t.key?t.color:"#64748b",fontWeight:700,fontSize:11,cursor:"pointer"}}>
              <span>{t.emoji}</span>{t.label}
            </button>
          ))}
        </div>
      </Fld>
      {!isShift&&<Fld label="タイトル"><input value={title} onChange={e=>setTitle(e.target.value)} placeholder="例: ○○様 来店予定" style={inputSt}/></Fld>}
      <Fld label="日付"><input type="date" value={date} onChange={e=>setDate(e.target.value)} style={inputSt}/></Fld>
      {isShift&&(
        <Fld label="時間">
          <div style={{display:"flex",gap:8,alignItems:"center"}}>
            <input type="time" value={startTime} onChange={e=>setStartTime(e.target.value)} style={{...inputSt,flex:1}}/>
            <span style={{color:"#94a3b8",fontSize:13}}>〜</span>
            <input type="time" value={endTime} onChange={e=>setEndTime(e.target.value)} style={{...inputSt,flex:1}}/>
          </div>
        </Fld>
      )}
      {isVisit&&<Fld label="売上目標（円）"><input type="number" value={amount} onChange={e=>setAmount(e.target.value)} style={inputSt}/></Fld>}
      <Fld label="メモ（任意）">
        <textarea value={detail} onChange={e=>setDetail(e.target.value)} placeholder="備考など" style={{...inputSt,minHeight:52,resize:"none",fontFamily:"inherit"}}/>
      </Fld>
      <PBtn
        onClick={()=>{
          const base={id:Date.now(),date,type,detail};
          if(isShift) onAdd({...base,title:"出勤",startTime,endTime});
          else onAdd({...base,title:title||"予定",amount:amount?parseInt(amount):undefined});
          onClose();
        }}
        disabled={!isShift&&!title.trim()}
      >追加する</PBtn>
    </Sheet>
  );
}

// ============================================================
// 給料設定モーダル
// ============================================================
function SalarySettingsModal({onClose,settings,onSave}){
  const [s,setS]=useState({...settings});
  return(
    <Sheet onClose={onClose} title="給料計算の設定">
      <Fld label="バック率（%）" hint="売上に対するバック％"><input type="number" value={s.backRate} onChange={e=>setS(p=>({...p,backRate:Number(e.target.value)}))} style={inputSt}/></Fld>
      <Fld label="時給（円）" hint="出勤1時間あたりの給料"><input type="number" value={s.hourlyPay} onChange={e=>setS(p=>({...p,hourlyPay:Number(e.target.value)}))} style={inputSt}/></Fld>
      <Fld label="月間目標給料（円）" hint="目標とする月の手取り"><input type="number" value={s.target} onChange={e=>setS(p=>({...p,target:Number(e.target.value)}))} style={inputSt}/></Fld>
      <PBtn onClick={()=>{onSave(s);onClose();}}>保存する</PBtn>
    </Sheet>
  );
}

// ============================================================
// 顧客カード
// ============================================================
function CustCard({c,onClick}){
  const days=Math.floor((Date.now()-new Date(c.lastVisit))/86400000);
  const warn=days>90;
  const rs=RS[c.rank];
  const [hov,setHov]=useState(false);
  return(
    <div onClick={onClick} onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{cursor:"pointer",marginBottom:10,borderRadius:18,background:"#fff",boxShadow:hov?"0 6px 24px rgba(236,72,153,0.14)":"0 1px 8px rgba(0,0,0,0.06)",border:`1.5px solid ${hov?"#fce7f3":"#f1f5f9"}`,display:"flex",alignItems:"center",gap:12,padding:"12px 14px",transition:"all 0.18s"}}>
      <div style={{position:"relative",flexShrink:0}}>
        <img src={`https://api.dicebear.com/8.x/notionists/svg?seed=${c.id}&backgroundColor=ffdfeb`} style={{width:48,height:48,borderRadius:"50%",border:"2px solid #fce7f3",background:"#fce7f3",display:"block"}} alt=""/>
        <span style={{position:"absolute",bottom:-4,right:-6,fontSize:9,fontWeight:900,padding:"1px 6px",borderRadius:20,border:"1.5px solid #fff",background:rs.bg,color:rs.tx,whiteSpace:"nowrap"}}>{c.rank}</span>
      </div>
      <div style={{flex:1,minWidth:0}}>
        <span style={{fontWeight:800,fontSize:14,color:"#1e293b",display:"block",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",marginBottom:4}}>{c.name}</span>
        <div style={{display:"flex",gap:4,flexWrap:"wrap",marginBottom:5}}>
          {c.tags.slice(0,3).map(t=><span key={t} style={{fontSize:9,fontWeight:700,padding:"2px 7px",borderRadius:20,background:"#fdf2f8",color:"#ec4899",border:"1px solid #fce7f3"}}>{t}</span>)}
        </div>
        <span style={{display:"flex",alignItems:"center",gap:4,fontSize:11,color:warn?"#f43f5e":"#94a3b8",fontWeight:warn?700:400}}>
          <Ico path={warn?P.alrt:P.clk} size={11} color={warn?"#f43f5e":"#94a3b8"}/>
          {warn?`⚠️ ${days}日ご無沙汰`:`${days}日前`}
        </span>
      </div>
    </div>
  );
}

// ============================================================
// 顧客追加・編集フォーム
// ============================================================
const RANK_OPTIONS = ["S","A","B","C","D"];
const GROUP_OPTIONS = ["VIP","常連","新規","その他"];

function CustFormModal({onClose, onSave, initial}){
  const isEdit = !!initial;
  const [form, setForm] = useState(initial || {
    name:"", kana:"", rank:"D", group:"新規",
    company:"", birthday:"", bottle:"", memo:"",
    tags:"", totalSales:0,
  });
  const set = (k,v) => setForm(p=>({...p,[k]:v}));
  const valid = form.name.trim().length > 0;

  return(
    <Sheet onClose={onClose} title={isEdit?"顧客プロフィールを編集":"新規顧客を追加"}>
      <Fld label="お名前 *">
        <input value={form.name} onChange={e=>set("name",e.target.value)} placeholder="例: 山田 太郎" style={inputSt}/>
      </Fld>
      <Fld label="フリガナ">
        <input value={form.kana} onChange={e=>set("kana",e.target.value)} placeholder="例: ヤマダ タロウ" style={inputSt}/>
      </Fld>
      <Fld label="ランク">
        <div style={{display:"flex",gap:6}}>
          {RANK_OPTIONS.map(r=>{
            const rs=RS[r];
            return(
              <button key={r} onClick={()=>set("rank",r)}
                style={{flex:1,padding:"8px 0",borderRadius:12,border:`2px solid ${form.rank===r?rs.bg:"#e2e8f0"}`,background:form.rank===r?rs.bg:"#fff",color:form.rank===r?rs.tx:"#64748b",fontWeight:900,fontSize:13,cursor:"pointer",transition:"all 0.15s"}}>
                {r}
              </button>
            );
          })}
        </div>
      </Fld>
      <Fld label="グループ">
        <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
          {GROUP_OPTIONS.map(g=>(
            <button key={g} onClick={()=>set("group",g)}
              style={{padding:"6px 14px",borderRadius:20,border:`1.5px solid ${form.group===g?"#ec4899":"#e2e8f0"}`,background:form.group===g?"#fdf2f8":"#fff",color:form.group===g?"#ec4899":"#64748b",fontWeight:700,fontSize:12,cursor:"pointer"}}>
              {g}
            </button>
          ))}
        </div>
      </Fld>
      <Fld label="会社・役職">
        <input value={form.company} onChange={e=>set("company",e.target.value)} placeholder="例: 大手IT企業 部長" style={inputSt}/>
      </Fld>
      <Fld label="誕生日">
        <input type="date" value={form.birthday} onChange={e=>set("birthday",e.target.value)} style={inputSt}/>
      </Fld>
      <Fld label="ボトルキープ">
        <input value={form.bottle} onChange={e=>set("bottle",e.target.value)} placeholder="例: 山崎18年" style={inputSt}/>
      </Fld>
      <Fld label="タグ（カンマ区切り）">
        <input value={form.tags} onChange={e=>set("tags",e.target.value)} placeholder="例: VIP, 音楽好き, 太客" style={inputSt}/>
      </Fld>
      <Fld label="メモ">
        <textarea value={form.memo} onChange={e=>set("memo",e.target.value)} placeholder="接客時のメモ、好み、話題など..." style={{...inputSt,minHeight:70,resize:"none",fontFamily:"inherit"}}/>
      </Fld>
      <PBtn onClick={()=>{
        const tags = form.tags ? form.tags.split(",").map(t=>t.trim()).filter(Boolean) : (initial?.tags||[]);
        onSave({
          ...form,
          id: initial?.id || String(Date.now()),
          tags,
          totalSales: initial?.totalSales || 0,
          visits: initial?.visits || [],
        });
        onClose();
      }} disabled={!valid}>
        {isEdit?"保存する":"追加する"}
      </PBtn>
    </Sheet>
  );
}

// ============================================================
// 顧客詳細
// ============================================================
function CustDetail({c:init,onBack}){
  const [c,setC]=useState(init);
  const [showAdd,setShowAdd]=useState(false);
  const [showEdit,setShowEdit]=useState(false);
  const rs=RS[c.rank];
  const vIcon=t=>t==="bottle"?{bg:"#fdf2f8",e:"🍷"}:t==="call"?{bg:"#f0fdf4",e:"📞"}:{bg:"#f8fafc",e:"✨"};
  return(
    <div style={{paddingBottom:100,position:"relative"}}>
      {showAdd&&<AddVisitModal onClose={()=>setShowAdd(false)} onAdd={v=>setC(p=>({...p,visits:[v,...p.visits]}))}/>}
      {showEdit&&<CustFormModal onClose={()=>setShowEdit(false)} initial={{...c, tags:c.tags.join(", ")}} onSave={updated=>setC({...updated, tags: Array.isArray(updated.tags)?updated.tags:updated.tags.split(",").map(t=>t.trim()).filter(Boolean)})}/>}
      <div style={{position:"sticky",top:0,zIndex:20,background:"rgba(255,255,255,0.93)",backdropFilter:"blur(10px)",borderBottom:"1px solid #f1f5f9",padding:"12px 16px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <button onClick={onBack} style={{background:"none",border:"none",cursor:"pointer",display:"flex",alignItems:"center",gap:4,color:"#ec4899",fontWeight:700,fontSize:14}}><Ico path={P.back} size={20} color="#ec4899" w={2.5}/> 戻る</button>
        <span style={{fontWeight:800,fontSize:14,color:"#334155"}}>顧客プロフィール</span>
        <button onClick={()=>setShowEdit(true)} style={{background:"none",border:"none",cursor:"pointer",display:"flex",alignItems:"center",gap:4,color:"#ec4899",fontWeight:700,fontSize:13}}><Ico path={P.edt} size={14} color="#ec4899"/> 編集</button>
      </div>
      <div style={{background:"linear-gradient(180deg,#fdf2f8 0%,#fff 100%)",padding:"20px 20px 18px"}}>
        <div style={{display:"flex",alignItems:"flex-start",gap:16,marginBottom:14}}>
          <div style={{position:"relative",flexShrink:0}}>
            <img src={`https://api.dicebear.com/8.x/notionists/svg?seed=${c.id}&backgroundColor=ffdfeb`} style={{width:76,height:76,borderRadius:"50%",border:"3px solid #fff",boxShadow:"0 4px 16px rgba(0,0,0,0.1)",display:"block"}} alt=""/>
            <span style={{position:"absolute",bottom:-6,left:"50%",transform:"translateX(-50%)",fontSize:10,fontWeight:900,padding:"2px 8px",borderRadius:20,border:"2px solid #fff",background:rs.bg,color:rs.tx,whiteSpace:"nowrap"}}>Rank {c.rank}</span>
          </div>
          <div style={{flex:1,paddingTop:4}}>
            <h2 style={{fontSize:19,fontWeight:900,color:"#1e293b",marginBottom:4}}>{c.name}</h2>
            <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:6}}>
              {c.tags.map(t=><span key={t} style={{fontSize:10,fontWeight:700,padding:"2px 9px",borderRadius:20,background:"#fdf2f8",color:"#ec4899",border:"1px solid #fce7f3"}}>{t}</span>)}
            </div>
            <p style={{fontSize:12,color:"#64748b",fontWeight:700}}>累計売上: <span style={{color:"#ec4899",fontSize:14,fontWeight:900}}>¥{c.totalSales.toLocaleString()}</span></p>
          </div>
        </div>
        <div style={{background:"rgba(253,242,248,0.7)",borderRadius:16,padding:"12px 16px",fontSize:13,color:"#64748b",lineHeight:1.7,marginBottom:14,border:"1px solid #fce7f3"}}>{c.memo}</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          {[{icon:P.wine,label:"ボトル",val:c.bottle||"なし"},{icon:P.gift,label:"誕生日",val:c.birthday},{icon:P.brf,label:"会社・役職",val:c.company},{icon:P.tag,label:"グループ",val:c.group}].map((r,i)=>(
            <div key={i} style={{background:"#fff",borderRadius:14,padding:"12px 14px",border:"1.5px solid #f1f5f9",boxShadow:"0 1px 6px rgba(0,0,0,0.04)"}}>
              <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:4}}>
                <div style={{background:"#fdf2f8",borderRadius:8,padding:5,display:"flex"}}><Ico path={r.icon} size={12} color="#f472b6"/></div>
                <span style={{fontSize:10,color:"#94a3b8",fontWeight:700}}>{r.label}</span>
              </div>
              <span style={{fontSize:12,fontWeight:700,color:"#334155"}}>{r.val}</span>
            </div>
          ))}
        </div>
      </div>
      <div style={{padding:"0 16px 16px"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14,paddingTop:8}}>
          <div style={{display:"flex",alignItems:"center",gap:8}}><Ico path={P.cal} size={16} color="#ec4899"/><span style={{fontSize:14,fontWeight:900,color:"#1e293b"}}>来店・売上履歴</span></div>
          <button onClick={()=>setShowAdd(true)} style={{display:"flex",alignItems:"center",gap:5,padding:"6px 14px",background:"linear-gradient(135deg,#ec4899,#f43f5e)",color:"#fff",border:"none",borderRadius:20,fontWeight:800,fontSize:12,cursor:"pointer"}}>
            <Ico path={P.plus} size={13} color="#fff" w={2.5}/> 記録を追加
          </button>
        </div>
        <div style={{position:"relative"}}>
          <div style={{position:"absolute",left:20,top:0,bottom:0,width:2,background:"linear-gradient(180deg,#fce7f3,#f8fafc)",borderRadius:99,zIndex:0}}/>
          {c.visits.map((v,i)=>{
            const cf=vIcon(v.type);
            return(
              <div key={i} style={{display:"flex",gap:14,marginBottom:14,position:"relative",zIndex:1}}>
                <div style={{width:40,height:40,borderRadius:"50%",background:cf.bg,border:"2px solid #fff",boxShadow:"0 2px 8px rgba(236,72,153,0.18)",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16}}>{cf.e}</div>
                <div style={{flex:1,background:"#fff",borderRadius:16,border:"1.5px solid #f1f5f9",padding:"12px 14px",boxShadow:"0 1px 6px rgba(0,0,0,0.05)"}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                    <span style={{fontSize:11,color:"#94a3b8",fontWeight:600}}>{v.date}</span>
                    <span style={{fontSize:14,fontWeight:900,color:"#ec4899"}}>¥{v.amount.toLocaleString()}</span>
                  </div>
                  <p style={{fontSize:13,color:"#334155",fontWeight:600,lineHeight:1.5}}>{v.note}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// 顧客タブ
// ============================================================
function CustTab({onSelect}){
  const [q,setQ]=useState("");
  const [filter,setFilter]=useState({rank:"all",group:"all",warn:false});
  const [showFilter,setShowFilter]=useState(false);
  const [showAddCust,setShowAddCust]=useState(false);
  const [customers,setCustomers]=useState(mockCustomers);
  const hasF=filter.rank!=="all"||filter.group!=="all"||filter.warn;
  const list=useMemo(()=>customers.filter(c=>{
    const mq=c.name.includes(q)||c.kana.includes(q);
    const mr=filter.rank==="all"||c.rank===filter.rank;
    const mg=filter.group==="all"||c.group===filter.group;
    const days=Math.floor((Date.now()-new Date(c.lastVisit))/86400000);
    return mq&&mr&&mg&&(!filter.warn||days>90);
  }),[q,filter,customers]);
  return(
    <div style={{paddingBottom:100,position:"relative"}}>
      {showFilter&&<FilterModal onClose={()=>setShowFilter(false)} onApply={setFilter} current={filter}/>}
      {showAddCust&&<CustFormModal onClose={()=>setShowAddCust(false)} onSave={c=>setCustomers(p=>[c,...p])}/>}
      <div style={{position:"sticky",top:0,zIndex:20,background:"rgba(255,255,255,0.95)",backdropFilter:"blur(12px)",borderBottom:"1px solid #f1f5f9",padding:"14px 16px 12px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
          <div>
            <h1 style={{fontSize:26,fontWeight:900,background:"linear-gradient(135deg,#ec4899,#f43f5e)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",lineHeight:1.1}}>Melty+</h1>
            <p style={{fontSize:10,color:"#94a3b8",marginTop:1}}>顧客管理 · 水商売専用</p>
          </div>
          <button style={{background:"none",border:"none",cursor:"pointer",padding:6}}><Ico path={P.bell} size={20} color="#94a3b8"/></button>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <div style={{position:"relative",flex:1}}>
            <div style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)"}}><Ico path={P.srch} size={15} color="#94a3b8"/></div>
            <input value={q} onChange={e=>setQ(e.target.value)} placeholder="名前・フリガナで検索..." style={{width:"100%",padding:"9px 12px 9px 36px",background:"#f8fafc",border:"none",borderRadius:12,fontSize:13,color:"#334155",outline:"none",boxSizing:"border-box"}}/>
          </div>
          <button onClick={()=>setShowFilter(true)} style={{flexShrink:0,width:40,height:38,borderRadius:12,border:`1.5px solid ${hasF?"#ec4899":"#e2e8f0"}`,background:hasF?"#fdf2f8":"#fff",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",position:"relative"}}>
            <Ico path={P.filter} size={16} color={hasF?"#ec4899":"#94a3b8"}/>
            {hasF&&<div style={{position:"absolute",top:-3,right:-3,width:8,height:8,background:"#ec4899",borderRadius:"50%",border:"1.5px solid #fff"}}/>}
          </button>
        </div>
      </div>
      <div style={{padding:"12px 16px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
          <span style={{fontSize:10,fontWeight:800,color:"#94a3b8",textTransform:"uppercase",letterSpacing:"0.08em"}}>お客様一覧</span>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <span style={{fontSize:10,color:"#94a3b8"}}>{list.length}名</span>
            <button onClick={()=>setShowAddCust(true)} style={{width:28,height:28,borderRadius:"50%",background:"linear-gradient(135deg,#ec4899,#f43f5e)",border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 2px 8px rgba(236,72,153,0.35)"}}>
              <Ico path={P.plus} size={14} color="#fff" w={2.5}/>
            </button>
          </div>
        </div>
        {hasF&&(
          <div style={{display:"flex",gap:6,marginBottom:10,flexWrap:"wrap",alignItems:"center"}}>
            <span style={{fontSize:10,color:"#ec4899",fontWeight:700}}>絞り込み中:</span>
            {filter.rank!=="all"&&<span style={{fontSize:10,padding:"2px 8px",background:"#fdf2f8",color:"#ec4899",borderRadius:20,fontWeight:700}}>Rank {filter.rank}</span>}
            {filter.group!=="all"&&<span style={{fontSize:10,padding:"2px 8px",background:"#fdf2f8",color:"#ec4899",borderRadius:20,fontWeight:700}}>{filter.group}</span>}
            {filter.warn&&<span style={{fontSize:10,padding:"2px 8px",background:"#fdf2f8",color:"#ec4899",borderRadius:20,fontWeight:700}}>ご無沙汰のみ</span>}
            <button onClick={()=>setFilter({rank:"all",group:"all",warn:false})} style={{fontSize:10,color:"#94a3b8",background:"none",border:"none",cursor:"pointer",textDecoration:"underline"}}>リセット</button>
          </div>
        )}
        {list.length>0?list.map(c=><CustCard key={c.id} c={c} onClick={()=>onSelect(c)}/>)
          :<div style={{textAlign:"center",padding:"60px 0",color:"#cbd5e1"}}><div style={{fontSize:36,marginBottom:8}}>🔍</div><p style={{fontSize:13}}>見つかりませんでした</p></div>}
      </div>
    </div>
  );
}

// ============================================================
// カレンダータブ
// ============================================================
function CalTab(){
  const {schedule,setSchedule,customTypes,setCustomTypes}=useContext(AppCtx);
  const [year,setYear]=useState(2026);
  const [month,setMonth]=useState(3);
  const [sel,setSel]=useState(`2026-03-06`);
  const [editEv,setEditEv]=useState(null);
  const [showAdd,setShowAdd]=useState(false);
  const [showManage,setShowManage]=useState(false);

  // すべてのイベント種別（出勤 + デフォルト + カスタム）
  const allTypes=[...DEFAULT_TYPES,...customTypes];

  const daysInMonth=new Date(year,month,0).getDate();
  const monthStr=`${year}-${String(month).padStart(2,"0")}`;
  const getEvts=d=>schedule.filter(e=>e.date===d);
  const selEvts=getEvts(sel);
  const dows=["日","月","火","水","木","金","土"];

  // 各日付の出勤回数
  const shiftCountMap=useMemo(()=>{
    const m={};
    schedule.filter(e=>e.type==="shift"&&e.date.startsWith(monthStr)).forEach(e=>{
      m[e.date]=(m[e.date]||0)+1;
    });
    return m;
  },[schedule,monthStr]);

  const prevMonth=()=>{
    if(month===1){setYear(y=>y-1);setMonth(12);}else setMonth(m=>m-1);
    setSel(`${year}-${String(month===1?12:month-1).padStart(2,"0")}-01`);
  };
  const nextMonth=()=>{
    if(month===12){setYear(y=>y+1);setMonth(1);}else setMonth(m=>m+1);
    setSel(`${year}-${String(month===12?1:month+1).padStart(2,"0")}-01`);
  };

  const typeOf=key=>[{key:"shift",label:"出勤",color:"#8b5cf6",emoji:"🌙"},...allTypes].find(t=>t.key===key)||{color:"#94a3b8",emoji:"❓",label:key};

  return(
    <div style={{padding:"20px 16px 100px",position:"relative"}}>
      {editEv&&<EditEventModal event={editEv} onClose={()=>setEditEv(null)} onSave={u=>setSchedule(p=>p.map(e=>e.id===u.id?u:e))} onDelete={id=>setSchedule(p=>p.filter(e=>e.id!==id))} customTypes={customTypes}/>}
      {showAdd&&<AddEventModal onClose={()=>setShowAdd(false)} onAdd={e=>setSchedule(p=>[...p,e])} defaultDate={sel} allTypes={allTypes}/>}
      {showManage&&<ManageTypesModal onClose={()=>setShowManage(false)} customTypes={customTypes} setCustomTypes={setCustomTypes}/>}

      {/* ヘッダー */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <button onClick={prevMonth} style={{background:"#f8fafc",border:"none",borderRadius:10,width:32,height:32,cursor:"pointer",fontSize:16,color:"#64748b",fontWeight:700}}>‹</button>
          <h2 style={{fontSize:17,fontWeight:900,color:"#1e293b"}}>{year}年{month}月</h2>
          <button onClick={nextMonth} style={{background:"#f8fafc",border:"none",borderRadius:10,width:32,height:32,cursor:"pointer",fontSize:16,color:"#64748b",fontWeight:700}}>›</button>
        </div>
        <button onClick={()=>setShowAdd(true)} style={{display:"flex",alignItems:"center",gap:5,padding:"7px 14px",background:"linear-gradient(135deg,#ec4899,#f43f5e)",color:"#fff",border:"none",borderRadius:20,fontWeight:800,fontSize:12,cursor:"pointer",boxShadow:"0 3px 10px rgba(236,72,153,0.28)"}}>
          <Ico path={P.plus} size={13} color="#fff" w={2.5}/> 追加
        </button>
      </div>

      {/* カレンダー */}
      <div style={{background:"#fff",borderRadius:20,border:"1.5px solid #f1f5f9",boxShadow:"0 1px 8px rgba(0,0,0,0.05)",padding:12,marginBottom:12}}>
        <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",marginBottom:6}}>
          {dows.map((d,i)=><div key={d} style={{textAlign:"center",fontSize:10,fontWeight:800,color:i===0?"#f43f5e":i===6?"#38bdf8":"#94a3b8",paddingBottom:4}}>{d}</div>)}
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:"2px"}}>
          {Array.from({length:daysInMonth},(_,i)=>{
            const day=i+1;
            const ds=`${year}-${String(month).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
            const evts=getEvts(ds);
            const isToday=ds==="2026-03-06";
            const isSel=ds===sel;
            const shiftCount=shiftCountMap[ds]||0;
            // 出勤以外のイベント
            const nonShift=evts.filter(e=>e.type!=="shift");

            // 出勤がある日は: 日付数字自体を紫丸で囲んで表示。他のイベントはその下にドット
            const isShiftDay = shiftCount > 0;
            return(
              <button key={day} onClick={()=>setSel(ds)}
                style={{background:isSel?"linear-gradient(135deg,#ec4899,#f43f5e)":isToday&&!isShiftDay?"#fdf2f8":"transparent",border:"none",borderRadius:10,padding:"3px 1px 4px",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:1,minHeight:42}}>
                {/* 日付：出勤日は紫丸で囲む、選択中はピンク丸 */}
                {isShiftDay&&!isSel
                  ? <div style={{width:24,height:24,borderRadius:"50%",background:"linear-gradient(135deg,#f472b6,#db2777)",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 2px 6px rgba(219,39,119,0.45)"}}>
                      <span style={{fontSize:11,fontWeight:900,color:"#fff",lineHeight:1}}>{day}</span>
                    </div>
                  : <span style={{fontSize:12,fontWeight:isSel||isToday?800:500,color:isSel?"#fff":isToday?"#ec4899":"#334155",lineHeight:"24px"}}>{day}</span>
                }
                {/* 出勤以外のイベントドット（出勤日でも表示） */}
                <div style={{display:"flex",alignItems:"center",gap:2,justifyContent:"center",minHeight:7}}>
                  {nonShift.slice(0,2).map((e,j)=>{
                    const t=typeOf(e.type);
                    return <div key={j} style={{width:5,height:5,borderRadius:"50%",background:isSel?"rgba(255,255,255,0.7)":t.color}}/>;
                  })}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 凡例 + 種別管理ボタン */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
        <div style={{display:"flex",gap:10,flexWrap:"wrap",alignItems:"center"}}>
          {/* 出勤凡例 */}
          <div style={{display:"flex",alignItems:"center",gap:4}}>
            <div style={{width:18,height:18,borderRadius:"50%",background:"linear-gradient(135deg,#f472b6,#db2777)",display:"flex",alignItems:"center",justifyContent:"center"}}>
              <span style={{fontSize:9,fontWeight:900,color:"#fff"}}>6</span>
            </div>
            <span style={{fontSize:10,color:"#94a3b8"}}>出勤</span>
          </div>
          {allTypes.map(t=>(
            <div key={t.key} style={{display:"flex",alignItems:"center",gap:4}}>
              <div style={{width:8,height:8,borderRadius:"50%",background:t.color}}/>
              <span style={{fontSize:10,color:"#94a3b8"}}>{t.label}</span>
            </div>
          ))}
        </div>
        {/* 種別追加ボタン */}
        <button onClick={()=>setShowManage(true)} style={{display:"flex",alignItems:"center",gap:4,padding:"5px 10px",background:"#f8fafc",border:"1.5px solid #e2e8f0",borderRadius:20,cursor:"pointer"}}>
          <Ico path={P.pen} size={12} color="#64748b"/>
          <span style={{fontSize:10,fontWeight:700,color:"#64748b"}}>管理</span>
        </button>
      </div>

      {/* 選択日の予定 */}
      <p style={{fontSize:10,fontWeight:800,color:"#94a3b8",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:10}}>{sel} の予定</p>
      {selEvts.length===0
        ?<div style={{textAlign:"center",padding:"28px 0",color:"#cbd5e1"}}><div style={{fontSize:28,marginBottom:6}}>🌸</div><p style={{fontSize:13}}>予定なし・ゆっくり休んで💕</p></div>
        :selEvts.map((ev,i)=>{
          const isShiftEv=ev.type==="shift";
          const tc=typeOf(ev.type);
          // ★ 出勤は全幅バナー型の特別デザイン
          if(isShiftEv) return(
            <div key={i} style={{marginBottom:12,position:"relative",borderRadius:20,overflow:"hidden"}}>
              {/* 背景グラデーション */}
              <div style={{background:"linear-gradient(135deg,#db2777,#be185d,#9d174d)",padding:"14px 16px 16px"}}>
                {/* ヘッダー行 */}
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
                  <div style={{display:"flex",alignItems:"center",gap:8}}>
                    {/* ピン/固定アイコン */}
                    <div style={{background:"rgba(255,255,255,0.2)",borderRadius:8,padding:"3px 8px",display:"flex",alignItems:"center",gap:4}}>
                      <span style={{fontSize:10}}>📌</span>
                      <span style={{fontSize:10,fontWeight:900,color:"rgba(255,255,255,0.9)",letterSpacing:"0.06em"}}>出勤</span>
                    </div>
                  </div>
                  <button onClick={()=>setEditEv(ev)} style={{background:"rgba(255,255,255,0.15)",border:"1px solid rgba(255,255,255,0.3)",borderRadius:8,padding:"4px 10px",cursor:"pointer",display:"flex",alignItems:"center",gap:3}}>
                    <Ico path={P.pen} size={11} color="rgba(255,255,255,0.85)"/>
                    <span style={{fontSize:10,color:"rgba(255,255,255,0.85)",fontWeight:700}}>編集</span>
                  </button>
                </div>
                {/* 時間表示（大きく中央に） */}
                <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:12,marginBottom:ev.detail?10:0}}>
                  <div style={{textAlign:"center"}}>
                    <p style={{fontSize:10,color:"rgba(255,255,255,0.6)",fontWeight:700,marginBottom:2}}>開始</p>
                    <p style={{fontSize:28,fontWeight:900,color:"#fff",lineHeight:1,letterSpacing:"-0.02em"}}>{ev.startTime}</p>
                  </div>
                  <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:3}}>
                    <div style={{width:40,height:1.5,background:"rgba(255,255,255,0.3)",borderRadius:99}}/>
                    <span style={{fontSize:9,color:"rgba(255,255,255,0.5)"}}>〜</span>
                    <div style={{width:40,height:1.5,background:"rgba(255,255,255,0.3)",borderRadius:99}}/>
                  </div>
                  <div style={{textAlign:"center"}}>
                    <p style={{fontSize:10,color:"rgba(255,255,255,0.6)",fontWeight:700,marginBottom:2}}>終了</p>
                    <p style={{fontSize:28,fontWeight:900,color:"#fff",lineHeight:1,letterSpacing:"-0.02em"}}>{ev.endTime}</p>
                  </div>
                </div>
                {ev.detail&&<p style={{fontSize:11,color:"rgba(255,255,255,0.65)",marginTop:6,textAlign:"center"}}>{ev.detail}</p>}
              </div>
              {/* 底面のキラキラ装飾 */}
              <div style={{position:"absolute",top:-20,right:-20,width:80,height:80,borderRadius:"50%",background:"rgba(255,255,255,0.05)",pointerEvents:"none"}}/>
              <div style={{position:"absolute",bottom:-10,left:10,width:50,height:50,borderRadius:"50%",background:"rgba(255,255,255,0.04)",pointerEvents:"none"}}/>
            </div>
          );
          // 通常イベント
          return(
            <div key={i} style={{background:"#fff",borderRadius:18,border:"1.5px solid #f1f5f9",padding:"14px 16px",marginBottom:10,display:"flex",gap:12,alignItems:"flex-start",boxShadow:"0 1px 6px rgba(0,0,0,0.04)"}}>
              <div style={{width:40,height:40,borderRadius:12,background:`${tc.color}18`,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,border:`1.5px solid ${tc.color}30`}}>{tc.emoji}</div>
              <div style={{flex:1}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                  <div style={{flex:1}}>
                    <p style={{fontSize:13,fontWeight:800,color:"#1e293b",marginBottom:2}}>{ev.title}</p>
                    {ev.detail&&<p style={{fontSize:11,color:"#94a3b8"}}>{ev.detail}</p>}
                    {ev.amount&&<p style={{fontSize:12,fontWeight:800,color:"#ec4899",marginTop:4}}>売上目標: ¥{ev.amount.toLocaleString()}</p>}
                  </div>
                  <button onClick={()=>setEditEv(ev)} style={{background:"#f8fafc",border:"1px solid #e2e8f0",borderRadius:8,padding:"5px 8px",cursor:"pointer",display:"flex",alignItems:"center",gap:3,flexShrink:0,marginLeft:8}}>
                    <Ico path={P.pen} size={12} color="#94a3b8"/>
                    <span style={{fontSize:10,color:"#94a3b8",fontWeight:700}}>編集</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })
      }
    </div>
  );
}

// ============================================================
// 成績タブ
// ============================================================
function SalesTab(){
  const {schedule,salary,setSalary}=useContext(AppCtx);
  const [showSetting,setShowSetting]=useState(false);
  const [viewYear,setViewYear]=useState(2026);
  const [viewMonth,setViewMonth]=useState(3);
  // アニメーション用state
  const [barAnimated,setBarAnimated]=useState(false);
  const [rankAnimated,setRankAnimated]=useState(false);
  const [pressedCard,setPressedCard]=useState(null);
  const [pressChart,setPressChart]=useState(false);
  const [hovBar,setHovBar]=useState(null);

  const monthStr=`${viewYear}-${String(viewMonth).padStart(2,"0")}`;

  // 予定から勤務時間を自動計算
  const workHours=useMemo(()=>getMonthShiftHours(schedule,viewYear,viewMonth),[schedule,viewYear,viewMonth]);
  const workHoursDisp=Number(workHours.toFixed(1));

  // 今月の売上（仮データ）
  const monthlySalesData={
    "2026-01":420000,"2026-02":510000,"2026-03":180000,
  };
  const thisMonthSales=monthlySalesData[monthStr]||0;

  const backIncome=Math.floor(thisMonthSales*(salary.backRate/100));
  const hourlyIncome=Math.floor(workHours*salary.hourlyPay);
  const earned=backIncome+hourlyIncome;

  // 今日までの見込み
  const today=new Date("2026-03-06");
  const isCurrentMonth=viewYear===today.getFullYear()&&viewMonth===today.getMonth()+1;
  const dayOfMonth=isCurrentMonth?today.getDate():new Date(viewYear,viewMonth,0).getDate();
  const daysInMonth=new Date(viewYear,viewMonth,0).getDate();
  const monthlyEst=dayOfMonth>0?Math.floor(earned/dayOfMonth*daysInMonth):earned;

  // 年間データ
  const yearMonths=Array.from({length:12},(_,i)=>{
    const m=i+1;
    const key=`${viewYear}-${String(m).padStart(2,"0")}`;
    return {m:`${m}月`,a:monthlySalesData[key]||0};
  });
  const yearTotal=yearMonths.reduce((s,d)=>s+d.a,0);
  const maxA=Math.max(...yearMonths.map(d=>d.a),1);

  // SVGゲージ
  const size=196,sw=15;
  const r1=(size-sw)/2,r2=r1-sw-5;
  const c1=2*Math.PI*r1,c2=2*Math.PI*r2;
  const cx=size/2,cy=size/2;
  const ep=Math.min(earned/Math.max(salary.target,1),1);
  const mp=Math.min(monthlyEst/Math.max(salary.target,1),1);

  const ranking=[{name:"伝説のIT社長",amount:120000},{name:"夜ふかしの伯爵",amount:45000},{name:"気まぐれジョージ",amount:15000}];
  const medals=["🥇","🥈","🥉"];

  const prevM=()=>{if(viewMonth===1){setViewYear(y=>y-1);setViewMonth(12);}else setViewMonth(m=>m-1);};
  const nextM=()=>{if(viewMonth===12){setViewYear(y=>y+1);setViewMonth(1);}else setViewMonth(m=>m+1);};

  // 月が変わるたびにアニメーションリセット
  useEffect(()=>{
    setBarAnimated(false);
    setRankAnimated(false);
    const t1=setTimeout(()=>setBarAnimated(true),80);
    const t2=setTimeout(()=>setRankAnimated(true),120);
    return()=>{clearTimeout(t1);clearTimeout(t2);};
  },[viewMonth,viewYear]);

  return(
    <div style={{padding:"20px 16px 100px",position:"relative"}}>
      {showSetting&&<SalarySettingsModal onClose={()=>setShowSetting(false)} settings={salary} onSave={s=>{setSalary(s);setShowSetting(false);}}/>}

      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
        <h2 style={{fontSize:18,fontWeight:900,color:"#1e293b"}}>収入・成績</h2>
        <button onClick={()=>setShowSetting(true)} style={{display:"flex",alignItems:"center",gap:5,padding:"6px 12px",background:"#f8fafc",border:"1.5px solid #e2e8f0",borderRadius:20,cursor:"pointer"}}>
          <Ico path={P.cfg} size={13} color="#64748b"/>
          <span style={{fontSize:11,fontWeight:700,color:"#64748b"}}>給料設定</span>
        </button>
      </div>

      {/* ★ 給料ゲージカード（月切り替え矢印付き） */}
      <div style={{background:"#fff",borderRadius:22,border:"1.5px solid #f1f5f9",padding:"18px 16px 16px",marginBottom:14,boxShadow:"0 2px 16px rgba(0,0,0,0.06)"}}>
        {/* 月切り替えヘッダー */}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
          <div style={{display:"flex",alignItems:"center",gap:6}}>
            <p style={{fontSize:13,fontWeight:800,color:"#334155"}}>{viewYear}年{viewMonth}月</p>
            <span style={{fontSize:10,color:"#94a3b8",fontWeight:700}}>月間目標: <span style={{color:"#ec4899"}}>¥{salary.target.toLocaleString()}</span></span>
            <button onClick={()=>setShowSetting(true)} style={{background:"none",border:"none",cursor:"pointer",padding:2}}><Ico path={P.pen} size={11} color="#94a3b8"/></button>
          </div>
          <div style={{textAlign:"right"}}>
            <p style={{fontSize:10,color:"#94a3b8"}}>勤務時間</p>
            <p style={{fontSize:14,fontWeight:900,color:"#334155"}}>{workHoursDisp}h</p>
          </div>
        </div>

        {/* ゲージ＋左右矢印 */}
        <div style={{display:"flex",alignItems:"center",gap:0}}>
          {/* 左矢印 */}
          <button onClick={prevM} style={{flexShrink:0,width:32,height:32,borderRadius:"50%",background:"#f8fafc",border:"1.5px solid #e2e8f0",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>
            <Ico path={P.back} size={16} color="#64748b" w={2.5}/>
          </button>

          {/* SVGゲージ */}
          <div style={{position:"relative",flex:1,display:"flex",justifyContent:"center"}}>
            <div style={{position:"relative",width:size,height:size}}>
              <svg width={size} height={size} style={{transform:"rotate(-90deg)"}}>
                <circle cx={cx} cy={cy} r={r1} fill="none" stroke="#f1f5f9" strokeWidth={sw}/>
                <circle cx={cx} cy={cy} r={r1} fill="none" stroke="#fce7f3" strokeWidth={sw} strokeDasharray={`${c1*mp} ${c1}`} strokeLinecap="round"/>
                <circle cx={cx} cy={cy} r={r2} fill="none" stroke="#f3e8ff" strokeWidth={sw-4}/>
                <circle cx={cx} cy={cy} r={r2} fill="none" stroke="#ec4899" strokeWidth={sw-4} strokeDasharray={`${c2*ep} ${c2}`} strokeLinecap="round"/>
              </svg>
              <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:6}}>
                <div style={{background:"#fff",border:"2px solid #fce7f3",borderRadius:12,padding:"7px 12px",textAlign:"center",boxShadow:"0 2px 8px rgba(236,72,153,0.1)"}}>
                  <div style={{display:"flex",alignItems:"center",gap:4,marginBottom:2}}>
                    <div style={{width:7,height:7,borderRadius:"50%",background:"#ec4899"}}/>
                    <span style={{fontSize:9,color:"#94a3b8",fontWeight:700}}>給料実績</span>
                  </div>
                  <span style={{fontSize:earned>0?20:16,fontWeight:900,color:"#1e293b"}}>¥{earned.toLocaleString()}</span>
                </div>
                <div style={{background:"#fdf2f8",border:"1.5px solid #fce7f3",borderRadius:9,padding:"5px 12px",textAlign:"center"}}>
                  <div style={{display:"flex",alignItems:"center",gap:4,marginBottom:1}}>
                    <div style={{width:6,height:6,borderRadius:"50%",background:"#f9a8d4"}}/>
                    <span style={{fontSize:9,color:"#94a3b8",fontWeight:700}}>給料見込</span>
                  </div>
                  <span style={{fontSize:14,fontWeight:900,color:"#ec4899"}}>¥{monthlyEst.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* 右矢印 */}
          <button onClick={nextM} style={{flexShrink:0,width:32,height:32,borderRadius:"50%",background:"#f8fafc",border:"1.5px solid #e2e8f0",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>
            <Ico path={P.fwd} size={16} color="#64748b" w={2.5}/>
          </button>
        </div>

        {/* 内訳 */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginTop:10}}>
          {[{l:"バック収入",v:`¥${backIncome.toLocaleString()}`,c:"#ec4899"},{l:"時給収入",v:`¥${hourlyIncome.toLocaleString()}`,c:"#8b5cf6"},{l:"月間見込み",v:`¥${monthlyEst.toLocaleString()}`,c:"#f59e0b"}].map((item,i)=>(
            <div key={i} style={{background:"#f8fafc",borderRadius:12,padding:"8px 6px",textAlign:"center"}}>
              <p style={{fontSize:9,color:"#94a3b8",fontWeight:700,marginBottom:3}}>{item.l}</p>
              <p style={{fontSize:11,fontWeight:900,color:item.c}}>{item.v}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 今月 / 今年 */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:14}}>
        <div
          onMouseDown={()=>setPressedCard("month")} onMouseUp={()=>setPressedCard(null)} onMouseLeave={()=>setPressedCard(null)}
          style={{borderRadius:18,padding:16,background:"linear-gradient(135deg,#ec4899,#f43f5e)",cursor:"pointer",
            transform:pressedCard==="month"?"translateY(-4px) scale(1.03)":"translateY(0) scale(1)",
            boxShadow:pressedCard==="month"?"0 12px 28px rgba(236,72,153,0.4)":"0 4px 14px rgba(236,72,153,0.28)",
            transition:"all 0.2s cubic-bezier(0.34,1.56,0.64,1)"}}>
          <p style={{fontSize:10,color:"rgba(255,255,255,0.8)",marginBottom:4,fontWeight:700}}>{viewMonth}月の売上</p>
          <p style={{fontSize:18,fontWeight:900,color:"#fff"}}>¥{thisMonthSales.toLocaleString()}</p>
          <p style={{fontSize:10,color:"rgba(255,255,255,0.65)",marginTop:4}}>{viewYear}年{viewMonth}月</p>
        </div>
        <div
          onMouseDown={()=>setPressedCard("year")} onMouseUp={()=>setPressedCard(null)} onMouseLeave={()=>setPressedCard(null)}
          style={{borderRadius:18,padding:16,background:"#fff",border:"1.5px solid #f1f5f9",cursor:"pointer",
            transform:pressedCard==="year"?"translateY(-4px) scale(1.03)":"translateY(0) scale(1)",
            boxShadow:pressedCard==="year"?"0 12px 28px rgba(0,0,0,0.12)":"0 1px 8px rgba(0,0,0,0.05)",
            transition:"all 0.2s cubic-bezier(0.34,1.56,0.64,1)"}}>
          <p style={{fontSize:10,color:"#94a3b8",marginBottom:4,fontWeight:700}}>今年の売上</p>
          <p style={{fontSize:18,fontWeight:900,color:"#1e293b"}}>¥{yearTotal.toLocaleString()}</p>
          <p style={{fontSize:10,color:"#94a3b8",marginTop:4}}>{viewYear}年（累計）</p>
        </div>
      </div>

      {/* 棒グラフ（アニメーション付き） */}
      <div
        onMouseDown={()=>setPressChart(true)} onMouseUp={()=>setPressChart(false)} onMouseLeave={()=>setPressChart(false)}
        style={{background:"#fff",borderRadius:18,border:"1.5px solid #f1f5f9",padding:16,marginBottom:14,cursor:"pointer",
          transform:pressChart?"translateY(-3px)":"translateY(0)",
          boxShadow:pressChart?"0 10px 28px rgba(236,72,153,0.15)":"0 1px 8px rgba(0,0,0,0.05)",
          transition:"all 0.2s cubic-bezier(0.34,1.56,0.64,1)"}}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14}}>
          <Ico path={P.trnd} size={16} color="#ec4899"/>
          <span style={{fontSize:13,fontWeight:800,color:"#334155"}}>月別売上（{viewYear}年）</span>
        </div>
        <div style={{display:"flex",alignItems:"flex-end",gap:3,height:104}}>
          {yearMonths.map((d,i)=>{
            const targetH=d.a>0?Math.round((d.a/maxA)*80):4;
            const h=barAnimated?targetH:0;
            const cur=i===viewMonth-1;
            const isHov=hovBar===i;
            return(
              <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:3}}
                onMouseEnter={()=>setHovBar(i)} onMouseLeave={()=>setHovBar(null)}>
                <span style={{fontSize:7,color:cur||isHov?"#ec4899":"#94a3b8",transition:"color 0.15s, opacity 0.3s",opacity:barAnimated&&d.a>0?1:0,transitionDelay:`${i*30}ms`}}>
                  {d.a>0?`¥${(d.a/10000).toFixed(0)}万`:"\u00a0"}
                </span>
                <div style={{
                  width:"100%",height:h,borderRadius:"5px 5px 0 0",
                  background:isHov?"linear-gradient(180deg,#f472b6,#ec4899)":cur?"#fce7f3":d.a>0?"linear-gradient(180deg,#ec4899,#f43f5e)":"#f1f5f9",
                  transition:`height 0.55s cubic-bezier(0.34,1.2,0.64,1) ${i*40}ms, background 0.15s`,
                  transform:isHov?"scaleY(1.05)":"scaleY(1)",transformOrigin:"bottom",
                }}/>
                <span style={{fontSize:8,color:cur?"#ec4899":"#94a3b8",fontWeight:cur?800:600}}>{d.m}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ランキング */}
      <div style={{background:"#fff",borderRadius:18,border:"1.5px solid #f1f5f9",padding:16,boxShadow:"0 1px 8px rgba(0,0,0,0.05)"}}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14}}>
          <Ico path={P.star} size={16} color="#ec4899"/>
          <span style={{fontSize:13,fontWeight:800,color:"#334155"}}>お客様ランキング（{viewMonth}月）</span>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          {ranking.map((r,i)=>(
            <div key={i} style={{display:"flex",alignItems:"center",gap:10}}>
              <div style={{width:28,height:28,borderRadius:"50%",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:900,fontSize:12,boxShadow:"0 2px 6px rgba(0,0,0,0.12)",background:[
                "linear-gradient(135deg,#fbbf24,#f59e0b)",
                "linear-gradient(135deg,#94a3b8,#64748b)",
                "linear-gradient(135deg,#fb923c,#ea580c)",
              ][i]||"#e2e8f0"}}>
                {i+1}
              </div>
              <div style={{flex:1}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                  <span style={{fontSize:12,fontWeight:700,color:"#334155"}}>{r.name}</span>
                  <span style={{fontSize:12,fontWeight:800,color:"#ec4899"}}>¥{r.amount.toLocaleString()}</span>
                </div>
                <div style={{height:5,background:"#f1f5f9",borderRadius:99,overflow:"hidden"}}>
                  <div style={{height:"100%",width:rankAnimated?`${(r.amount/ranking[0].amount)*100}%`:"0%",background:"linear-gradient(90deg,#ec4899,#f43f5e)",borderRadius:99,transition:`width 0.65s cubic-bezier(0.34,1.2,0.64,1) ${i*110}ms`}}/>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// 設定タブ
// ============================================================
const CFG_GROUPS = [
  {
    label: "セキュリティ",
    items: [
      { key:"passcode", title:"パスコードロック", sub:"アプリ起動時に認証", iconPath:["M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"], iconColor:"#8b5cf6", iconBg:"#f5f3ff", badge:"OFF", badgeColor:"#94a3b8", badgeBg:"#f1f5f9" },
    ],
  },
  {
    label: "連携",
    items: [
      { key:"line", title:"LINE連携設定", sub:"3アカウント連携済み", iconPath:["M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"], iconColor:"#10b981", iconBg:"#f0fdf4", badge:"連携中", badgeColor:"#10b981", badgeBg:"#dcfce7" },
    ],
  },
  {
    label: "計算・集計",
    items: [
      { key:"closing", title:"締め日設定", sub:"毎月25日", iconPath:["M8 2v4","M16 2v4","M3 10h18","M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"], iconColor:"#f59e0b", iconBg:"#fffbeb", badge:"25日", badgeColor:"#f59e0b", badgeBg:"#fef3c7" },
    ],
  },
  {
    label: "サポート",
    items: [
      { key:"help", title:"ヘルプ", sub:"使い方・よくある質問", iconPath:["M12 22c5.52 0 10-4.48 10-10S17.52 2 12 2 2 6.48 2 12s4.48 10 10 10z","M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3","M12 17h.01"], iconColor:"#3b82f6", iconBg:"#eff6ff", badge:null },
      { key:"contact", title:"お問い合わせ", sub:"開発チームへ送信", iconPath:["M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z","M22 6l-10 7L2 6"], iconColor:"#ec4899", iconBg:"#fdf2f8", badge:null },
    ],
  },
];

function CfgTab(){
  const [hov,setHov]=useState(null);
  return(
    <div style={{padding:"20px 16px 100px"}}>
      {/* ヘッダー */}
      <div style={{marginBottom:22}}>
        <h2 style={{fontSize:20,fontWeight:900,color:"#1e293b",marginBottom:2}}>設定</h2>
        <p style={{fontSize:11,color:"#94a3b8"}}>アプリの各種設定を管理する</p>
      </div>

      {/* グループ別リスト */}
      {CFG_GROUPS.map((grp,gi)=>(
        <div key={gi} style={{marginBottom:20}}>
          <p style={{fontSize:10,fontWeight:900,color:"#94a3b8",letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:8,paddingLeft:2}}>
            {grp.label}
          </p>
          <div style={{background:"#fff",borderRadius:18,border:"1.5px solid #f1f5f9",overflow:"hidden",boxShadow:"0 1px 8px rgba(0,0,0,0.05)"}}>
            {grp.items.map((item,ii)=>(
              <div key={item.key}
                onMouseEnter={()=>setHov(item.key)}
                onMouseLeave={()=>setHov(null)}
                style={{
                  display:"flex",alignItems:"center",gap:14,padding:"13px 16px",
                  cursor:"pointer",
                  background:hov===item.key?"#fafafa":"#fff",
                  borderBottom:ii<grp.items.length-1?"1px solid #f8fafc":"none",
                  transition:"background 0.12s",
                }}>
                {/* SVGアイコンボックス */}
                <div style={{width:40,height:40,borderRadius:12,background:item.iconBg,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center"}}>
                  <Ico path={item.iconPath} size={18} color={item.iconColor} w={2}/>
                </div>
                {/* テキスト */}
                <div style={{flex:1,minWidth:0}}>
                  <p style={{fontSize:13,fontWeight:700,color:"#1e293b",marginBottom:1}}>{item.title}</p>
                  <p style={{fontSize:11,color:"#94a3b8"}}>{item.sub}</p>
                </div>
                {/* バッジ＋矢印 */}
                <div style={{display:"flex",alignItems:"center",gap:8,flexShrink:0}}>
                  {item.badge&&(
                    <span style={{fontSize:10,fontWeight:800,padding:"3px 9px",borderRadius:20,background:item.badgeBg,color:item.badgeColor}}>
                      {item.badge}
                    </span>
                  )}
                  <Ico path={P.back} size={15} color="#d1d5db"/>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* フッター */}
      <div style={{marginTop:8,borderRadius:18,padding:"14px 20px",background:"linear-gradient(135deg,#fdf2f8,#fff0f6)",border:"1.5px solid #fce7f3",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div>
          <p style={{fontSize:13,fontWeight:900,color:"#ec4899"}}>Melty+</p>
          <p style={{fontSize:10,color:"#f9a8d4",marginTop:1}}>水商売専用の顧客管理アプリ</p>
        </div>
        <span style={{fontSize:11,fontWeight:700,color:"#f9a8d4",background:"#fff",border:"1px solid #fce7f3",borderRadius:20,padding:"3px 10px"}}>v1.0.0</span>
      </div>
    </div>
  );
}

// ============================================================
// メインアプリ（グローバル状態をここで管理）
// ============================================================
export default function App(){
  const [tab,setTab]=useState("customers");
  const [sel,setSel]=useState(null);

  // グローバル共有状態
  const [schedule,setSchedule]=useState(INIT_SCHEDULE);
  const [customTypes,setCustomTypes]=useState([
    {key:"after",label:"アフター",color:"#3b82f6",emoji:"🍸"},
  ]);
  const [salary,setSalary]=useState({backRate:10,hourlyPay:3000,target:300000});

  const ctx={schedule,setSchedule,customTypes,setCustomTypes,salary,setSalary};

  const nav=[{id:"customers",label:"顧客",icon:P.users},{id:"calendar",label:"予定",icon:P.cal},{id:"sales",label:"成績",icon:P.bar},{id:"settings",label:"設定",icon:P.cfg}];

  const body=()=>{
    if(tab==="customers") return sel?<CustDetail c={sel} onBack={()=>setSel(null)}/>:<CustTab onSelect={setSel}/>;
    if(tab==="calendar") return <CalTab/>;
    if(tab==="sales") return <SalesTab/>;
    return <CfgTab/>;
  };

  return(
    <AppCtx.Provider value={ctx}>
      <div style={{minHeight:"100vh",background:"#f8fafc",display:"flex",flexDirection:"column",fontFamily:"'Hiragino Sans','Noto Sans JP',sans-serif"}}>
        {/* Content */}
        <div style={{flex:1,overflowY:"auto",overflowX:"hidden"}}>{body()}</div>
        {/* Bottom Nav */}
        <div style={{background:"rgba(255,255,255,0.97)",backdropFilter:"blur(20px)",borderTop:"1px solid #f1f5f9",padding:"8px 4px 18px",display:"flex",justifyContent:"space-around",alignItems:"center",flexShrink:0}}>
          {nav.map(({id,label,icon})=>{
            const active=tab===id;
            return(
              <button key={id} onClick={()=>{setTab(id);setSel(null);}} style={{background:"none",border:"none",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:3,padding:"4px 10px",borderRadius:16}}>
                <div style={{padding:active?"7px 12px":"7px 7px",background:active?"#fdf2f8":"transparent",borderRadius:14}}>
                  <Ico path={icon} size={22} color={active?"#ec4899":"#94a3b8"} w={active?2.5:1.8}/>
                </div>
                <span style={{fontSize:10,fontWeight:active?800:500,color:active?"#ec4899":"#94a3b8"}}>{label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </AppCtx.Provider>
  );
}
