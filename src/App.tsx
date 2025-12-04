import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, onSnapshot, setDoc, serverTimestamp } from 'firebase/firestore';
import { Heart, Camera, MapPin, Send, LogOut, Loader2, Image as ImageIcon, X, PenTool, Type, Lock, Maximize2, Trophy, Swords } from 'lucide-react';

// --- CONFIGURATION ---
const firebaseConfig = {
  apiKey: "AIzaSyBw5oZKTpok2YwkZV7XFNCftpwFwyK3mYA",
  authDomain: "lovesync-1ceef.firebaseapp.com",
  projectId: "lovesync-1ceef",
  storageBucket: "lovesync-1ceef.firebasestorage.app",
  messagingSenderId: "137181195082",
  appId: "1:137181195082:web:e1da74eafa463c3b676fb3",
  measurementId: "G-CYZF1B9R13"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// --- OUTILS ---
const compressImage = (file) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800;
        const scaleSize = MAX_WIDTH / img.width;
        canvas.width = MAX_WIDTH;
        canvas.height = img.height * scaleSize;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };
    };
  });
};

const DrawingCanvas = ({ onSave, onCancel }) => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width; canvas.height = rect.height;
    ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.strokeStyle = '#374151'; 
  }, []);
  const getPos = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return { x: clientX - rect.left, y: clientY - rect.top };
  };
  const start = (e) => { e.preventDefault(); setIsDrawing(true); };
  const move = (e) => {
    if (!isDrawing) return; e.preventDefault();
    const { x, y } = getPos(e);
    const ctx = canvasRef.current.getContext('2d');
    ctx.lineTo(x, y); ctx.stroke(); ctx.beginPath(); ctx.moveTo(x, y);
  };
  const end = () => { setIsDrawing(false); canvasRef.current.getContext('2d').beginPath(); };
  return (
    <div className="flex flex-col gap-2 h-full animate-in fade-in">
      <div className="flex-1 bg-white rounded-xl border-2 border-dashed border-gray-300 overflow-hidden touch-none relative h-48 cursor-crosshair">
        <canvas ref={canvasRef} className="w-full h-full touch-none" onMouseDown={start} onMouseMove={move} onMouseUp={end} onMouseLeave={end} onTouchStart={start} onTouchMove={move} onTouchEnd={end} />
        <div className="absolute top-2 right-2 text-[10px] text-gray-300 pointer-events-none select-none">Dessine ici</div>
      </div>
      <div className="flex justify-between items-center">
         <button onClick={onCancel} className="text-xs text-gray-400">Annuler</button>
         <button onClick={()=>onSave(canvasRef.current.toDataURL('image/png'))} className="px-4 py-1.5 text-xs bg-yellow-400 rounded-lg font-bold flex gap-1 items-center"><Send className="w-3 h-3"/> Envoyer</button>
      </div>
    </div>
  );
};

const EMOJIS_CATEGORIES = {
  "Amour & Humeur": ["❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💔", "❤️‍🔥", "❤️‍🩹", "💕", "💞", "💓", "💗", "💖", "💘", "😊", "🥰", "😘", "😍", "🤩", "🤪", "🥺", "😎", "😴", "🤔", "😭", "😤", "🤯", "🫠", "😷", "🤠", "🥳", "🥴", "😈", "🤡", "💩", "👻", "🙂", "🙃", "😉", "😋", "😛", "😜", "🤓", "🧐", "😕", "😟", "🙁", "😮", "😯", "😲", "😳", "😓", "😥", "😢", "😨", "😱", "😖", "😣", "😞"],
  "Gestes": ["👍", "👎", "👊", "✊", "🤛", "🤜", "🤞", "✌️", "🤟", "🤘", "👌", "🤌", "🤏", "👈", "👉", "👆", "👇", "☝️", "✋", "🤚", "🖐️", "🖖", "👋", "🤙", "💪", "🙏", "💅", "🤳", "👀", "🧠", "👄", "💋"],
  "Miam & Activités": ["☕", "🍵", "🍻", "🥂", "🍷", "🥃", "🍸", "🍹", "🍾", "🍔", "🍟", "🍕", "🌭", "🥪", "🌮", "🌯", "🥗", "🥘", "🍝", "🍜", "🍲", "🍛", "🍣", "🍱", "🎮", "🕹️", "🎲", "⚽", "🏀", "🏈", "⚾", "🎾", "🏐", "🏉", "🎱", "🏓", "🏸", "🥊", "🥋", "🛹", "🎿", "🏂", "🏋️", "🏊", "🚗", "✈️", "🚀", "🏠", "💻", "📱", "💸", "💊", "🚬", "🛌", "🚿"],
  "Nature & Animaux": ["🐶", "🐱", "🐭", "🐹", "🐰", "🦊", "🐻", "🐼", "🐻‍❄️", "🐨", "🐯", "🦁", "🐮", "🐷", "🐽", "🐸", "🐵", "🙈", "🙉", "🙊", "🐒", "🐔", "🐧", "🐦", "🐤", "🐣", "🐥", "🦆", "🦅", "🦉", "🦇", "🐺", "🐗", "🐴", "🦄", "🐝", "🪱", "🐛", "🦋", "🐌", "🐞", "🐜", "🪰", "🪲", "🪳", "🌸", "🏵️", "🌹", "🥀", "🌺", "🌻", "🌼", "🌷", "🌱", "🪴", "🌲", "🌳", "🌴", "🌵", "🌾", "🌿", "☘️", "🍀", "🍁", "🍂", "🍃", "☀️", "🌝", "🌚", "🌙", "☁️", "⛈️", "🔥", "💧", "✨", "🌈", "🌊"]
};

// --- APP ---
export default function App() {
  const [user, setUser] = useState(null); const [roomData, setRoomData] = useState(null); const [loading, setLoading] = useState(true);
  const [inputCode, setInputCode] = useState(""); const [authError, setAuthError] = useState("");
  const [creds, setCreds] = useState(null); const [view, setView] = useState('loading');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false); const [viewingPhoto, setViewingPhoto] = useState(null);
  const [noteMode, setNoteMode] = useState('text'); const [noteInput, setNoteInput] = useState(""); const fileInputRef = useRef(null);
  
  const bottomRef = useRef(null);

  useEffect(() => {
    const init = async () => { try { await signInAnonymously(auth); } catch (e) { console.error(e); } };
    init();
    const saved = localStorage.getItem('lovesync_vivien_anais_final');
    if (saved) { try { setCreds(JSON.parse(saved)); setView('app'); } catch(e) { setView('login'); } } else { setView('login'); }
    return onAuthStateChanged(auth, u => { setUser(u); setLoading(false); });
  }, []);

  useEffect(() => {
    if (!user || view !== 'app' || !creds) return;
    const roomRef = doc(db, 'amoureux', 'notre_espace_secret');
    const unsub = onSnapshot(roomRef, (snap) => {
      if (snap.exists()) setRoomData(snap.data()); else setDoc(roomRef, { created: serverTimestamp() }, { merge: true });
    });
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(pos => {
        setDoc(roomRef, { [`${creds.role}_geo`]: { lat: pos.coords.latitude, lng: pos.coords.longitude }, [`${creds.role}_name`]: creds.name, last_active: serverTimestamp() }, { merge: true }).catch(e => {});
      });
    }
    return () => unsub();
  }, [user, view, creds]);

  const handleSmartLogin = () => {
    const code = inputCode.trim().toLowerCase();
    let userCreds = null;
    if (code === 'vivienessec') userCreds = { name: 'Vivien', role: 'p1' };
    else if (code === 'anaisefb') userCreds = { name: 'Anaïs', role: 'p2' };
    else { setAuthError("Code incorrect !"); return; }
    localStorage.setItem('lovesync_vivien_anais_final', JSON.stringify(userCreds)); setCreds(userCreds); setView('app'); setAuthError("");
  };

  const logout = () => { if(confirm("Se déconnecter ?")) { localStorage.removeItem('lovesync_vivien_anais_final'); setCreds(null); setInputCode(""); setView('login'); } };
  const updateDB = async (data) => { if (!user) return; const roomRef = doc(db, 'amoureux', 'notre_espace_secret'); await setDoc(roomRef, data, { merge: true }); };
  const setMood = (emoji) => { setShowEmojiPicker(false); updateDB({ [`${creds.role}_mood`]: emoji, [`${creds.role}_mood_ts`]: Date.now() }); };
  
  const uploadPhoto = async (e) => {
    const file = e.target.files[0]; if (!file) return;
    try {
      const compressedBase64 = await compressImage(file);
      await updateDB({ [`${creds.role}_photo`]: compressedBase64, [`${creds.role}_photo_ts`]: Date.now() });
    } catch(err) { alert("Erreur photo"); }
  };

  const sendNote = async () => { 
    if (!noteInput.trim()) return; 
    await updateDB({ shared_note: noteInput, shared_sketch: null, note_author: creds.name, note_ts: Date.now() }); 
    setNoteInput("");
    setTimeout(() => { window.scrollTo(0, 0); }, 100);
  };
  const sendSketch = async (base64) => { await updateDB({ shared_sketch: base64, shared_note: null, note_author: creds.name, note_ts: Date.now() }); setNoteMode('text'); };
  
  const scrollToBottom = () => { setTimeout(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }); }, 300); };

  // --- LOGIQUE SHIFUMI ---
  const playShifumi = (move) => {
    updateDB({ [`game_${creds.role}_move`]: move });
  };

  const resetGame = (winnerRole) => {
    const newScore = (roomData?.[`game_${winnerRole}_score`] || 0) + 1;
    // On calcule le résultat texte
    const p1M = roomData?.game_p1_move;
    const p2M = roomData?.game_p2_move;
    const resultText = `${myDisplayName} (${p1M}) vs ${partnerDisplayName} (${p2M})`;

    updateDB({
      game_p1_move: null,
      game_p2_move: null,
      [`game_${winnerRole}_score`]: newScore,
      game_last_result: resultText,
      game_last_winner: winnerRole === creds.role ? 'Moi' : partnerDisplayName
    });
  };

  const getShifumiResult = (m1, m2) => {
    if (!m1 || !m2) return null;
    if (m1 === m2) return 'draw';
    if ((m1 === '🪨' && m2 === '✂️') || (m1 === '📄' && m2 === '🪨') || (m1 === '✂️' && m2 === '📄')) return 'p1';
    return 'p2';
  };

  const getDist = (l1, n1, l2, n2) => {
    if(!l1 || !n1 || !l2 || !n2) return null;
    const R=6371, dLat=(l2-l1)*Math.PI/180, dLon=(n2-n1)*Math.PI/180;
    const a=Math.sin(dLat/2)*Math.sin(dLat/2)+Math.cos(l1*Math.PI/180)*Math.cos(l2*Math.PI/180)*Math.sin(dLon/2)*Math.sin(dLon/2);
    return (R*2*Math.atan2(Math.sqrt(a), Math.sqrt(1-a))).toFixed(1);
  };
  const isExp = (ts, h) => !ts || (Date.now()-ts)>(3*3600000); 
  const fmtTime = (ts) => ts ? new Date(ts).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}) : "";
  
  const otherRole = creds?.role === 'p1' ? 'p2' : 'p1';
  const myDisplayName = creds?.role === 'p1' ? 'Vivien' : 'Anaïs';
  const partnerDisplayName = creds?.role === 'p1' ? 'Anaïs' : 'Vivien';

  const myData = { mood: roomData?.[`${creds?.role}_mood`], moodTs: roomData?.[`${creds?.role}_mood_ts`], photo: roomData?.[`${creds?.role}_photo`], photoTs: roomData?.[`${creds?.role}_photo_ts`], geo: roomData?.[`${creds?.role}_geo`] };
  const pData = { mood: roomData?.[`${otherRole}_mood`], moodTs: roomData?.[`${otherRole}_mood_ts`], photo: roomData?.[`${otherRole}_photo`], photoTs: roomData?.[`${otherRole}_photo_ts`], geo: roomData?.[`${otherRole}_geo`] };
  const dist = getDist(myData.geo?.lat, myData.geo?.lng, pData.geo?.lat, pData.geo?.lng);

  // SHIFUMI DATA
  const myMove = roomData?.[`game_${creds?.role}_move`];
  const partnerMove = roomData?.[`game_${otherRole}_move`];
  const winner = getShifumiResult(roomData?.game_p1_move, roomData?.game_p2_move);

  if (loading || view === 'loading') return <div className="fixed inset-0 bg-pink-50 flex items-center justify-center"><Loader2 className="animate-spin text-pink-400" /></div>;
  if (view === 'login') {
    return (
      <div className="fixed inset-0 bg-pink-50 flex flex-col items-center justify-center p-6">
        <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-sm text-center">
          <Heart className="w-12 h-12 text-pink-500 mx-auto mb-4 animate-bounce" />
          <h1 className="text-2xl font-bold text-gray-800 mb-2">LoveSync</h1>
          <p className="text-xs text-gray-400 mb-6 uppercase tracking-wider">Espace Vivien & Anaïs</p>
          <div className="relative">
             <Lock className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
             <input className="w-full mb-2 p-3 pl-10 rounded-xl bg-gray-50 border-none outline-none focus:ring-2 focus:ring-pink-200 transition text-gray-900 placeholder-gray-400" placeholder="Mot de passe..." type="password" value={inputCode} onChange={e=>setInputCode(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSmartLogin()} />
          </div>
          {authError && <p className="text-red-500 text-xs mb-3 font-bold animate-pulse">{authError}</p>}
          <button onClick={handleSmartLogin} className="w-full bg-pink-500 text-white py-3 rounded-xl font-bold hover:bg-pink-600 transition shadow-md mt-2">Entrer</button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-slate-50 font-sans overflow-hidden">
      {viewingPhoto && <div className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in" onClick={() => setViewingPhoto(null)}><img src={viewingPhoto} className="max-w-full max-h-full rounded-xl shadow-2xl object-contain animate-in zoom-in-95 duration-200" /><button className="absolute top-6 right-6 p-2 bg-white/20 rounded-full text-white backdrop-blur hover:bg-white/40"><X className="w-6 h-6"/></button></div>}
      
      {showEmojiPicker && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in" onClick={()=>setShowEmojiPicker(false)}>
           <div className="bg-white w-full max-w-sm rounded-3xl p-4 shadow-xl flex flex-col max-h-[80vh]" onClick={e=>e.stopPropagation()}>
             <div className="flex justify-between mb-2 border-b pb-2"><h3 className="font-bold text-gray-700">Choisis ton mood</h3><X className="cursor-pointer text-gray-400" onClick={()=>setShowEmojiPicker(false)}/></div>
             <div className="overflow-y-auto flex-1 p-1">
                {Object.entries(EMOJIS_CATEGORIES).map(([catName, emojis]) => (
                  <div key={catName} className="mb-4">
                    <h4 className="text-xs font-bold text-gray-400 uppercase mb-2 sticky top-0 bg-white py-1">{catName}</h4>
                    <div className="grid grid-cols-6 gap-2">
                      {emojis.map(e => <button key={e} onClick={(evt) => { evt.stopPropagation(); setMood(e); }} className="text-3xl p-1 hover:bg-gray-100 active:bg-pink-100 rounded-lg cursor-pointer transition-transform hover:scale-110 active:scale-90 flex items-center justify-center">{e}</button>)}
                    </div>
                  </div>
                ))}
             </div>
           </div>
        </div>
      )}

      {/* HEADER */}
      <div className="absolute top-0 left-0 right-0 p-6 bg-white flex justify-between items-center z-10 shadow-sm h-20">
        <div><h2 className="font-bold text-lg text-gray-800">{creds.name}</h2><div className="flex items-center text-xs text-gray-500 font-medium"><MapPin className="w-3 h-3 mr-1 text-pink-500 fill-current"/>{dist ? `${dist} km` : "Recherche..."}</div></div>
        <button onClick={logout} className="p-2 rounded-full hover:bg-gray-100 transition"><LogOut className="w-5 h-5 text-gray-400"/></button>
      </div>

      {/* CONTENU */}
      <div ref={mainRef} className="absolute top-20 bottom-0 left-0 right-0 overflow-y-auto p-4 space-y-5 pb-32 overscroll-none">
        
        {/* MOODS */}
        <div className="grid grid-cols-2 gap-4">
          <div onClick={()=>setShowEmojiPicker(true)} className="bg-white p-4 rounded-[2rem] shadow-sm text-center border-b-4 border-blue-100 cursor-pointer active:scale-95 transition hover:shadow-md relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-200 to-cyan-200"></div><div className="text-[10px] font-bold text-blue-400 mb-2 uppercase tracking-wider">Moi ({myDisplayName})</div>
            {isExp(myData.moodTs, 3) ? <span className="text-4xl grayscale opacity-20 filter blur-[0.5px]">😶</span> : <span className="text-5xl drop-shadow-sm">{myData.mood}</span>}
            <div className="text-[10px] text-gray-400 mt-2 font-mono">{fmtTime(myData.moodTs)}</div>
          </div>
          <div className="bg-white p-4 rounded-[2rem] shadow-sm text-center border-b-4 border-pink-100 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-pink-200 to-rose-200"></div><div className="text-[10px] font-bold text-pink-400 mb-2 uppercase tracking-wider truncate px-2">{partnerDisplayName}</div>
            {isExp(pData.moodTs, 3) ? <div className="text-4xl grayscale opacity-20 filter blur-[0.5px]">😴</div> : <div className="text-5xl animate-bounce-slow drop-shadow-sm">{pData.mood}</div>}
            <div className="text-[10px] text-gray-400 mt-2 font-mono">{fmtTime(pData.moodTs)}</div>
          </div>
        </div>

        {/* PHOTOS */}
        <div className="bg-white p-5 rounded-[2.5rem] shadow-sm relative">
          <h3 className="text-xs font-bold text-gray-400 mb-4 flex items-center uppercase tracking-widest"><Camera className="w-4 h-4 mr-2 text-gray-600"/> Live (3h)</h3>
          <div className="grid grid-cols-2 gap-4">
             <div className="aspect-square bg-gray-50 rounded-2xl relative overflow-hidden group shadow-inner">
               {myData.photo && !isExp(myData.photoTs, 3) ? <img src={myData.photo} className="w-full h-full object-cover"/> : <div className="w-full h-full flex items-center justify-center text-gray-300"><ImageIcon className="w-8 h-8 opacity-20"/></div>}
               <label className="absolute inset-0 flex items-center justify-center bg-black/5 active:bg-black/20 transition cursor-pointer"><div className="bg-white p-2 rounded-full shadow-lg transform active:scale-90 transition"><Camera className="w-5 h-5 text-gray-700"/></div>
               <input type="file" accept="image/*" capture="user" ref={fileInputRef} onChange={uploadPhoto} className="hidden" />
               </label>
             </div>
             <div className="aspect-square bg-gray-50 rounded-2xl relative overflow-hidden border-2 border-dashed border-gray-200 cursor-pointer hover:border-pink-200 transition" onClick={() => { if(pData.photo && !isExp(pData.photoTs, 3)) setViewingPhoto(pData.photo); }}>
               {pData.photo && !isExp(pData.photoTs, 3) ? <><img src={pData.photo} className="w-full h-full object-cover"/><div className="absolute top-2 right-2 p-1 bg-black/20 rounded-full text-white backdrop-blur-sm"><Maximize2 className="w-3 h-3"/></div><div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-sm text-white text-[10px] px-2 py-0.5 rounded-full font-mono">{fmtTime(pData.photoTs)}</div></> : <div className="w-full h-full flex items-center justify-center text-gray-300"><ImageIcon className="w-8 h-8 opacity-20"/></div>}
             </div>
          </div>
        </div>

        {/* NOTES */}
        <div className="bg-[#fffdf5] p-5 rounded-[2.5rem] shadow-sm border border-yellow-100 relative min-h-[160px]">
          <div className="flex justify-between mb-3 items-center">
            <span className="text-[10px] font-bold text-yellow-600 uppercase tracking-widest bg-yellow-100 px-2 py-1 rounded-lg">Frigo</span>
            <div className="flex bg-yellow-50 rounded-lg p-0.5 border border-yellow-100">
               <button onClick={()=>setNoteMode('text')} className={`p-1.5 rounded-md transition ${noteMode==='text'?'bg-white shadow-sm text-yellow-700':'text-yellow-400'}`}><Type className="w-3 h-3"/></button>
               <button onClick={()=>setNoteMode('draw')} className={`p-1.5 rounded-md transition ${noteMode==='draw'?'bg-white shadow-sm text-yellow-700':'text-yellow-400'}`}><PenTool className="w-3 h-3"/></button>
            </div>
          </div>
          <div className="mb-4 min-h-[2rem]">
             {roomData?.shared_sketch ? (
               <div className="bg-white rounded-xl border border-gray-100 overflow-hidden p-2 shadow-sm rotate-1"><img src={roomData.shared_sketch} alt="Dessin" className="w-full h-auto max-h-[250px] object-contain" /><div className="text-[10px] text-right mt-1 text-gray-300 italic">Dessiné par {roomData.note_author}</div></div>
             ) : (
               <div className="font-handwriting text-lg whitespace-pre-wrap leading-relaxed text-gray-800 pl-1">{roomData?.shared_note || "..."}<div className="text-[10px] text-right mt-2 text-gray-400 font-sans italic">{roomData?.note_ts ? `— ${roomData.note_author} (${fmtTime(roomData.note_ts)})` : ''}</div></div>
             )}
          </div>
          {noteMode === 'text' ? (
            <div className="flex gap-2 bg-white p-1 rounded-xl shadow-sm border border-yellow-50">
              <input className="flex-1 rounded-xl border-none outline-none px-3 text-sm bg-transparent placeholder-gray-300 text-gray-900" placeholder="Un petit mot..." value={noteInput} onFocus={scrollToBottom} onChange={e=>setNoteInput(e.target.value)} />
              <button onClick={sendNote} className="bg-yellow-400 active:bg-yellow-500 text-yellow-900 p-2.5 rounded-lg transition active:scale-95 shadow-sm"><Send className="w-4 h-4"/></button>
            </div>
          ) : ( <DrawingCanvas onSave={sendSketch} onCancel={() => setNoteMode('text')} /> )}
        </div>

        {/* --- JEU SHIFUMI --- */}
        <div className="bg-purple-50 p-5 rounded-[2.5rem] shadow-sm border border-purple-100 relative">
          <div className="flex justify-between items-center mb-4">
             <h3 className="text-xs font-bold text-purple-600 uppercase tracking-widest flex items-center gap-2">
               <Swords className="w-4 h-4"/> Duel Shifumi
             </h3>
             <div className="flex gap-2 text-[10px] font-bold">
               <span className="bg-white px-2 py-1 rounded-lg text-purple-800 border border-purple-100">Moi: {roomData?.[`game_${creds?.role}_score`] || 0}</span>
               <span className="bg-white px-2 py-1 rounded-lg text-purple-800 border border-purple-100">Lui/Elle: {roomData?.[`game_${otherRole}_score`] || 0}</span>
             </div>
          </div>

          <div className="text-center">
            {/* ETAT 1 : JEU EN COURS (LES DEUX ONT JOUÉ) */}
            {myMove && partnerMove ? (
              <div className="animate-in zoom-in duration-300">
                <div className="text-sm font-bold text-gray-600 mb-2">Résultat du duel !</div>
                <div className="flex justify-center items-center gap-4 text-4xl mb-4">
                  <div className="bg-white p-2 rounded-2xl shadow-sm">{myMove}</div>
                  <div className="text-lg font-bold text-purple-300">VS</div>
                  <div className="bg-white p-2 rounded-2xl shadow-sm">{partnerMove}</div>
                </div>
                <div className="text-lg font-bold text-purple-600 mb-3">
                  {winner === 'draw' ? "Égalité ! 🤝" : (winner === creds.role ? "Tu as gagné ! 🎉" : "Perdu... 😭")}
                </div>
                <button 
                  onClick={() => resetGame(winner === 'draw' ? 'draw' : winner)}
                  className="bg-purple-600 text-white px-6 py-2 rounded-xl font-bold shadow-lg hover:bg-purple-700 active:scale-95 transition"
                >
                  {winner === 'draw' ? "Rejouer" : "Valider le point & Rejouer"}
                </button>
              </div>
            ) : (
              /* ETAT 2 : EN ATTENTE DE COUP */
              <>
                {myMove ? (
                  <div className="py-4">
                    <div className="text-4xl mb-2 animate-bounce">⏳</div>
                    <p className="text-sm text-gray-500 font-medium">En attente de {partnerDisplayName}...</p>
                    <p className="text-xs text-gray-400 mt-1">(Tu as joué {myMove})</p>
                  </div>
                ) : (
                  <div className="flex justify-around py-2">
                    {['🪨', '📄', '✂️'].map(m => (
                      <button 
                        key={m}
                        onClick={() => playShifumi(m)}
                        className="text-4xl bg-white p-4 rounded-2xl shadow-sm border border-purple-50 hover:scale-110 active:scale-90 transition"
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
            
            {/* HISTORIQUE DERNIER MATCH */}
            {roomData?.game_last_result && !myMove && !partnerMove && (
              <div className="mt-4 pt-3 border-t border-purple-100 text-xs text-gray-400">
                Dernier : {roomData.game_last_result} ({roomData.game_last_winner} a gagné)
              </div>
            )}
          </div>
        </div>

        {/* Élément invisible pour le scroll */}
        <div ref={bottomRef} className="h-4"></div>
      </div>
    </div>
  );
}