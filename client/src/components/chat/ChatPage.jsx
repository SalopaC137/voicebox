import { useState, useEffect, useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import { useApp }  from "../../context/AppContext";
import S from "../../utils/styles";
import { buildRooms, roleIcon, fmtDate, isAdminRole } from "../../utils/helpers";
import { ROLE_LABELS, YEAR_OF_STUDY } from "../../data/university";

// ── voice helper ──────────────────────────────────────────────────
const fmtSecs = s => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

export default function ChatPage() {
  const { currentUser } = useAuth();
  const { messages, addMessage, joinChatRoom, leaveChatRoom } = useApp();
  const r     = currentUser?.role;
  const [selectedProgramType, setSelectedProgramType] = useState("degree");
  const rooms = currentUser ? buildRooms(currentUser, selectedProgramType) : [];
  const canSelectYear = isAdminRole(r) || r === "staff";
  const canSelectProgramType = isAdminRole(r) || r === "staff";
  const isMobile = window.innerWidth < 768;

  const [room, setRoom] = useState("general");
  const [msg,  setMsg]  = useState("");
  const [anon, setAnon] = useState(false);
  const [selectedYear, setSelectedYear] = useState(null);
  const [debugInfo, setDebugInfo] = useState("");
  const [hiddenRooms, setHiddenRooms] = useState(() => {
    const saved = localStorage.getItem("hiddenChatRooms");
    return saved ? JSON.parse(saved) : [];
  });
  const [showRooms, setShowRooms] = useState(!isMobile); // On mobile, hide rooms by default
  const bottomRef = useRef(null);
  const prevRoomRef = useRef(null);

  // ── voice state (added) ───────────────────────────────────────────
  const [recording, setRecording] = useState(false);
  const [recSecs,   setRecSecs]   = useState(0);
  const [audioURL,  setAudioURL]  = useState(null);
  const [audioBlob, setAudioBlob] = useState(null);
  const mediaRecRef = useRef(null);
  const chunksRef   = useRef([]);
  const timerRef    = useRef(null);

  // cleanup mic on unmount
  useEffect(() => () => {
    clearInterval(timerRef.current);
    if (mediaRecRef.current && mediaRecRef.current.state !== "inactive")
      mediaRecRef.current.stop();
  }, []);

  // Compute effective room ID (add year suffix if admin/staff selected a year for a course room)
  const isCourseRoom = room.startsWith("course:");
  const effectiveRoom = (isCourseRoom && selectedYear && canSelectYear)
    ? `${room}:Y${selectedYear}`
    : room;
  const currentProgramType = r === "student" ? (currentUser?.programType || "degree") : selectedProgramType;

  // Initialize room when rooms become available
  useEffect(() => {
    console.log(`[ChatPage] rooms available:`, rooms.length, rooms);
    console.log(`[ChatPage] currentUser:`, currentUser?.role, currentUser?.school, currentUser?.department);
    if (rooms.length > 0 && room === "general") {
      const firstVisibleRoom = rooms.find(rm => !hiddenRooms.includes(rm.id));
      if (firstVisibleRoom) {
        setRoom(firstVisibleRoom.id);
        setDebugInfo(`Initialized to room: ${firstVisibleRoom.id}`);
      } else {
        setDebugInfo(`All rooms are hidden`);
      }
    } else if (rooms.length === 0 && currentUser) {
      setDebugInfo(`No rooms available for role: ${r}, school: ${currentUser.school}, dept: ${currentUser.department}`);
    }
  }, [rooms.length, currentUser, r, hiddenRooms]);

  useEffect(() => {
    if (r === "student") {
      setSelectedProgramType(currentUser?.programType || "degree");
    }
  }, [r, currentUser?.programType]);

  useEffect(() => {
    if (room !== "general" && !rooms.some((rm) => rm.id === room)) {
      const nextRoom = rooms.find((rm) => !hiddenRooms.includes(rm.id));
      if (nextRoom) setRoom(nextRoom.id);
    }
  }, [rooms, room, hiddenRooms]);

  const visibleRooms = rooms.filter(rm => !hiddenRooms.includes(rm.id));
  const roomMsgs = messages.filter(m => m.room === effectiveRoom);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:"smooth" }); }, [roomMsgs.length]);

  // Join/leave chat rooms
  useEffect(() => {
    if (effectiveRoom && effectiveRoom !== prevRoomRef.current) {
      if (prevRoomRef.current) {
        leaveChatRoom(prevRoomRef.current);
      }
      joinChatRoom(effectiveRoom);
      prevRoomRef.current = effectiveRoom;
    }
  }, [effectiveRoom, joinChatRoom, leaveChatRoom]);

  const toggleHideRoom = (roomId) => {
    const updated = hiddenRooms.includes(roomId)
      ? hiddenRooms.filter(r => r !== roomId)
      : [...hiddenRooms, roomId];
    setHiddenRooms(updated);
    localStorage.setItem("hiddenChatRooms", JSON.stringify(updated));
    
    // Switch to first visible room if current room is hidden
    if (updated.includes(room)) {
      const nextRoom = rooms.find(rm => !updated.includes(rm.id));
      if (nextRoom) {
        setRoom(nextRoom.id);
      }
    }
  };

  const handleRoomChange = (newRoom) => {
    setRoom(newRoom);
  };

  // ── voice recording functions (added) ─────────────────────────────
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      mediaRecRef.current = mr;
      chunksRef.current   = [];
      mr.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setAudioBlob(blob);
        setAudioURL(URL.createObjectURL(blob));
        stream.getTracks().forEach(t => t.stop());
      };
      mr.start();
      setRecording(true);
      setRecSecs(0);
      timerRef.current = setInterval(() => setRecSecs(s => s + 1), 1000);
    } catch {
      alert("Microphone access denied. Please allow microphone in your browser settings.");
    }
  };

  const stopRecording = () => {
    clearInterval(timerRef.current);
    mediaRecRef.current?.stop();
    setRecording(false);
  };

  const cancelVoice = () => {
    if (recording) { clearInterval(timerRef.current); mediaRecRef.current?.stop(); setRecording(false); }
    setAudioURL(null);
    setAudioBlob(null);
    setRecSecs(0);
  };

  const sendVoice = () => {
    if (!audioBlob) return;
    // Convert blob to base64 for transmission
    const reader = new FileReader();
    reader.onload = () => {
      const base64Audio = reader.result.split(",")[1]; // Remove data:audio/webm;base64, prefix
      addMessage({
        room: effectiveRoom,
        message:       "🎤 Voice message",
        isAnonymous:   anon,
        isVoice:       true,
        audioData:     base64Audio,
        audioDuration: recSecs,
      });
      setAudioURL(null);
      setAudioBlob(null);
      setRecSecs(0);
    };
    reader.readAsDataURL(audioBlob);
  };

  // ── text send (unchanged) ─────────────────────────────────────────
  const send = () => {
    if (!msg.trim()) return;
    addMessage({
      room: effectiveRoom,
      message:     msg,
      isAnonymous: anon,
    });
    setMsg("");
  };

  const bubbleBg = (m, isMe) => {
    if (m.isAnonymous) return "rgba(139,92,246,.12)";
    if (isMe)          return "rgba(13,148,136,.2)";
    return "rgba(255,255,255,.06)";
  };

  const avatarBg = (m) => ({
    school_admin: "rgba(245,158,11,.25)",
    dept_admin:   "rgba(168,85,247,.25)",
    staff:        "rgba(59,130,246,.25)",
    student:      "rgba(16,185,129,.25)",
  }[m.senderRole] || "rgba(255,255,255,.12)");

  return (
    <div style={{ ...S.page, display:"flex", flexDirection:"column", height:"calc(100vh - 56px)", paddingBottom:0 }}>
      <div style={{ fontSize:18, fontWeight:800, color:"white", marginBottom:14, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        💬 Chat Rooms
        {isMobile && (
          <button onClick={() => setShowRooms(!showRooms)} style={{ ...S.btn, ...S.btnGhost, fontSize:12, padding:"5px 10px" }}>
            {showRooms ? "Hide Rooms" : "Show Rooms"}
          </button>
        )}
      </div>

      {/* Year selector for staff/admins */}
      {canSelectYear && (
        <div style={{ marginBottom:14, display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
          <label style={{ fontSize:14, color:"rgba(255,255,255,.7)", fontWeight:600 }}>Select Year:</label>
          <select value={selectedYear || ""} onChange={e => setSelectedYear(e.target.value ? parseInt(e.target.value) : null)}
            style={{ ...S.input, fontSize:12, padding:"6px 10px", width: isMobile ? "100%" : 120 }}>
            <option value="">All Years</option>
            {YEAR_OF_STUDY.map(y => <option key={y.value} value={y.value}>{y.label}</option>)}
          </select>
        </div>
      )}

      {canSelectProgramType && (
        <div style={{ marginBottom:14, display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
          <label style={{ fontSize:14, color:"rgba(255,255,255,.7)", fontWeight:600 }}>Select Program:</label>
          <select
            value={selectedProgramType}
            onChange={e => {
              setSelectedProgramType(e.target.value);
              setSelectedYear(null);
            }}
            style={{ ...S.input, fontSize:12, padding:"6px 10px", width: isMobile ? "100%" : 140 }}
          >
            <option value="degree">Degree</option>
            <option value="diploma">Diploma</option>
          </select>
        </div>
      )}

      {!canSelectProgramType && r === "student" && (
        <div style={{ marginBottom:14, fontSize:12, color:"rgba(255,255,255,.45)" }}>
          Showing {currentProgramType === "diploma" ? "diploma" : "degree"} program chats only.
        </div>
      )}

      <div style={{ display:"flex", gap:14, flex:1, minHeight:0, flexDirection: isMobile ? "column" : "row" }}>

        {/* Room list */}
        {(!isMobile || showRooms) && (
          <div style={{ width: isMobile ? "100%" : 220, flexShrink:0, minHeight:0 }}>
            <div style={{ ...S.card, padding:10, maxHeight: isMobile ? 220 : "100%", overflowY:"auto", overflowX:"hidden" }}>
              {visibleRooms.length > 0 ? (
                <>
                  {visibleRooms.map(rm => (
                    <div key={rm.id} style={{ display:"flex", alignItems:"center", gap:6, marginBottom:2 }}>
                      <div onClick={() => handleRoomChange(rm.id)} style={{
                        flex:1, padding:"8px 10px", borderRadius:7, cursor:"pointer", fontSize:12, fontWeight:600,
                        background: room===rm.id ? "rgba(13,148,136,.13)" : "transparent",
                        borderLeft: room===rm.id ? "2px solid #2DD4BF" : "2px solid transparent",
                        color:      room===rm.id ? "#2DD4BF" : "rgba(255,255,255,.5)",
                        whiteSpace: "pre-wrap",
                        overflowWrap: "anywhere",
                        wordBreak: "break-word",
                      }}>
                        {rm.label}
                      </div>
                      <button onClick={(e) => { e.stopPropagation(); toggleHideRoom(rm.id); }} style={{
                        ...S.btn, ...S.btnDanger, padding:"4px 7px", fontSize:10, flexShrink:0, width:"auto"
                      }}>✕</button>
                    </div>
                  ))}
                  {hiddenRooms.length > 0 && (
                    <div style={{ fontSize:10, color:"rgba(255,255,255,.25)", padding:"8px 10px", textAlign:"center", marginTop:8, borderTop:"1px solid rgba(255,255,255,.05)" }}>
                      {hiddenRooms.length} room{hiddenRooms.length===1?"":"s"} hidden
                    </div>
                  )}
                </>
              ) : (
                <div style={{ fontSize:12, color:"rgba(255,255,255,.3)", padding:10, textAlign:"center" }}>
                  {rooms.length > 0 && hiddenRooms.length > 0 ? "All rooms hidden" : "No chat rooms available"}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Chat window */}
        {visibleRooms.length > 0 ? (
        <div style={{ flex:1, display:"flex", flexDirection:"column", minHeight:0 }}>
          <div style={{ ...S.card, flex:1, display:"flex", flexDirection:"column", padding:0, overflow:"hidden" }}>

            {/* Room header */}
            <div style={{ padding:"10px 14px", borderBottom:"1px solid rgba(255,255,255,.06)", background:"rgba(255,255,255,.02)", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div>
                <div style={{ fontSize:13, fontWeight:800, color:"white" }}>{visibleRooms.find(rm=>rm.id===room)?.label || room}</div>
                <div style={{ fontSize:10, color:"rgba(255,255,255,.3)", marginTop:1 }}>{roomMsgs.length} messages {selectedYear && isCourseRoom && `(Year ${selectedYear})`}</div>
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <div style={{ display:"flex", alignItems:"center", gap:5, fontSize:11, color:"#10B981" }}>
                  <div style={{ width:6, height:6, borderRadius:"50%", background:"#10B981" }} /> live
                </div>
              </div>
            </div>

            {/* Messages - only the bubble content block changed to support voice */}
            <div style={{ flex:1, overflowY:"auto", padding:14, display:"flex", flexDirection:"column", gap:9 }}>
              {roomMsgs.map(m => {
                const isMe = m.sender === currentUser._id;
                return (
                  <div key={m._id} style={{ display:"flex", gap:7, flexDirection:isMe?"row-reverse":"row" }}>
                    <div style={{ width:26, height:26, borderRadius:"50%", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, background:m.isAnonymous?"rgba(139,92,246,.25)":avatarBg(m), border:`1px solid ${m.isAnonymous?"rgba(139,92,246,.5)":"rgba(255,255,255,.15)"}` }}>
                      {m.isAnonymous ? "🎭" : roleIcon(m.senderRole)}
                    </div>
                    <div style={{ maxWidth:"60%" }}>
                      <div style={{ padding:"8px 11px", borderRadius:11, borderBottomLeftRadius:isMe?11:2, borderBottomRightRadius:isMe?2:11, background:bubbleBg(m,isMe), border:`1px solid ${m.isAnonymous?"rgba(139,92,246,.28)":isMe?"rgba(13,148,136,.3)":"rgba(255,255,255,.08)"}` }}>
                        {/* ↓ CHANGED: voice bubble or plain text */}
                        {m.isVoice && m.audioData
                          ? <VoiceBubble audioData={m.audioData} duration={m.audioDuration} />
                          : <div style={{ fontSize:12, color:"rgba(255,255,255,.85)", lineHeight:1.5 }}>{m.message}</div>
                        }
                      </div>
                      {isAdminRole(currentUser?.role) && m.isAnonymous && (
                        <div style={{ fontSize:9, color:"#8B5CF6", fontFamily:"monospace", marginTop:2, fontStyle:"italic" }}>
                          Anon Admin: {m.senderFirstName} {m.senderLastName} ({m.senderUid})
                        </div>
                      )}
                      <div style={{ fontSize:9.5, color:"rgba(255,255,255,.27)", marginTop:3, textAlign:isMe?"right":"left" }}>
                        {m.isAnonymous ? "Anonymous" : `${m.senderFirstName} ${m.senderLastName}`}
                        {" · "}{ROLE_LABELS[m.senderRole]?.label || m.senderRole}
                        {" · "}{fmtDate(m.createdAt)}
                      </div>
                    </div>
                  </div>
                );
              })}
              {roomMsgs.length === 0 && (
                <div style={{ textAlign:"center", color:"rgba(255,255,255,.25)", padding:28, fontSize:13 }}>No messages yet. Start the conversation!</div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input bar — CHANGED: now has 3 states (recording / preview / normal) */}
            <div style={{ borderTop:"1px solid rgba(255,255,255,.06)", padding:"8px 12px", background:"rgba(255,255,255,.02)" }}>

              {/* STATE 1 — mic is live */}
              {recording && (
                <RecordingBar secs={recSecs} onStop={stopRecording} onCancel={cancelVoice} />
              )}

              {/* STATE 2 — recorded, waiting to send */}
              {!recording && audioURL && (
                <VoicePreview audioURL={audioURL} secs={recSecs} onSend={sendVoice} onCancel={cancelVoice} />
              )}

              {/* STATE 3 — normal input (your original bar + mic button added) */}
              {!recording && !audioURL && (
                <div style={{ display:"flex", alignItems:"center", gap:7 }}>
                  {/* anon toggle — unchanged */}
                  <div onClick={() => setAnon(p=>!p)} style={{ display:"flex", alignItems:"center", gap:4, cursor:"pointer", fontSize:11, color:anon?"#C4B5FD":"rgba(255,255,255,.3)", flexShrink:0 }}>
                    <div style={{ width:26, height:14, borderRadius:100, display:"flex", alignItems:"center", padding:2, background:anon?"rgba(139,92,246,.4)":"rgba(255,255,255,.1)", border:`1px solid ${anon?"rgba(139,92,246,.5)":"rgba(255,255,255,.15)"}` }}>
                      <div style={{ width:10, height:10, borderRadius:"50%", background:anon?"#8B5CF6":"rgba(255,255,255,.35)", marginLeft:anon?"auto":0, transition:"all .15s" }} />
                    </div>
                    Anon
                  </div>

                  {/* text input — unchanged */}
                  <input value={msg} onChange={e=>setMsg(e.target.value)} onKeyDown={e=>e.key==="Enter"&&send()}
                    placeholder="Type a message..." style={{ ...S.input, flex:1, padding:"7px 11px" }} />

                  {/* 🎤 mic button — ADDED */}
                  <button onClick={startRecording} title="Record a voice message" style={{
                    ...S.btn, padding:"7px 11px", flexShrink:0, fontSize:15,
                    background:"rgba(239,68,68,.12)",
                    border:"1px solid rgba(239,68,68,.28)",
                    color:"#FCA5A5",
                  }}>🎤</button>

                  {/* send button — unchanged */}
                  <button onClick={send} style={{ ...S.btn, ...S.btnTeal, padding:"7px 13px", flexShrink:0 }}>➤</button>
                </div>
              )}
            </div>

          </div>
        </div>
        ) : (
        <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center" }}>
          <div style={{ textAlign:"center", color:"rgba(255,255,255,.3)" }}>
            <div style={{ fontSize:24, marginBottom:8 }}>💬</div>
            <div style={{ marginBottom: 12 }}>
              {rooms.length > 0 && hiddenRooms.length > 0 
                ? "All chat rooms are hidden. Remove the × to show them."
                : "Unable to load chat rooms"}
            </div>
            {debugInfo && <div style={{ fontSize:12, color:"rgba(255,255,255,.2)", marginTop:16, fontFamily:"monospace" }}>{debugInfo}</div>}
          </div>
        </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Voice sub-components — added below the main export
// ─────────────────────────────────────────────────────────────────

/** Animated red bar shown while the mic is live */
function RecordingBar({ secs, onStop, onCancel }) {
  const heights = [1, 1.6, 0.8, 1.3, 0.7, 1.5, 1];
  return (
    <div style={{ display:"flex", alignItems:"center", gap:10, padding:"6px 4px" }}>
      <style>{heights.map((_, i) => `
        @keyframes vbBar${i} {
          from { opacity:.3; transform:scaleY(.4); }
          to   { opacity:1;  transform:scaleY(1);  }
        }
      `).join("")}</style>

      {/* Waveform animation */}
      <div style={{ display:"flex", alignItems:"center", gap:3, flexShrink:0 }}>
        {heights.map((h, i) => (
          <div key={i} style={{
            width:3, borderRadius:2, background:"#F87171", height: 8 * h,
            animation:`vbBar${i} .7s ${i * 0.1}s ease-in-out infinite alternate`,
          }} />
        ))}
      </div>

      <span style={{ fontSize:11, color:"#F87171", fontWeight:700, fontFamily:"monospace" }}>
        ● REC {fmtSecs(secs)}
      </span>

      <div style={{ flex:1 }} />

      <button onClick={onStop} style={{ ...S.btn, padding:"5px 12px", fontSize:12, background:"rgba(16,185,129,.15)", border:"1px solid rgba(16,185,129,.35)", color:"#6EE7B7" }}>
        Stop
      </button>
      <button onClick={onCancel} style={{ ...S.btn, padding:"5px 10px", fontSize:12, background:"rgba(239,68,68,.1)", border:"1px solid rgba(239,68,68,.25)", color:"#FCA5A5" }}>
        ✕
      </button>
    </div>
  );
}

/** Preview bar — listen back before sending */
function VoicePreview({ audioURL, secs, onSend, onCancel }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:9, padding:"6px 4px" }}>
      <span style={{ fontSize:11, color:"rgba(255,255,255,.4)", flexShrink:0 }}>Preview:</span>
      <audio controls src={audioURL} style={{ flex:1, height:28, accentColor:"#0D9488", minWidth:0 }} />
      <span style={{ fontSize:11, fontFamily:"monospace", color:"rgba(255,255,255,.35)", flexShrink:0 }}>{fmtSecs(secs)}</span>
      <button onClick={onSend} style={{ ...S.btn, ...S.btnTeal, padding:"5px 14px", fontSize:12, flexShrink:0 }}>
        Send 🎤
      </button>
      <button onClick={onCancel} style={{ ...S.btn, padding:"5px 10px", fontSize:12, background:"rgba(239,68,68,.1)", border:"1px solid rgba(239,68,68,.25)", color:"#FCA5A5" }}>
        ✕
      </button>
    </div>
  );
}

/** Compact audio player inside a received/sent voice message bubble */
function VoiceBubble({ audioData, duration }) {
  const [playing,  setPlaying]  = useState(false);
  const [progress, setProgress] = useState(0);
  const [elapsed,  setElapsed]  = useState(0);
  const [audioURL, setAudioURL] = useState(null);
  const audioRef = useRef(null);

  // Convert base64 to blob URL on mount
  useEffect(() => {
    if (audioData) {
      try {
        const binaryString = atob(audioData);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: "audio/webm" });
        const url = URL.createObjectURL(blob);
        setAudioURL(url);
        return () => URL.revokeObjectURL(url);
      } catch (err) {
        console.error("Failed to decode audio:", err);
      }
    }
  }, [audioData]);

  const toggle = () => {
    if (!audioRef.current) return;
    if (playing) { audioRef.current.pause(); setPlaying(false); }
    else         { audioRef.current.play();  setPlaying(true);  }
  };

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    const onTime  = () => {
      setElapsed(Math.floor(a.currentTime));
      setProgress(a.duration ? (a.currentTime / a.duration) * 100 : 0);
    };
    const onEnded = () => { setPlaying(false); setProgress(0); setElapsed(0); };
    a.addEventListener("timeupdate", onTime);
    a.addEventListener("ended",      onEnded);
    return () => {
      a.removeEventListener("timeupdate", onTime);
      a.removeEventListener("ended",      onEnded);
    };
  }, []);

  return (
    <div style={{ display:"flex", alignItems:"center", gap:8, minWidth:170 }}>
      <audio ref={audioRef} src={audioURL} preload="metadata" style={{ display:"none" }} />

      <button onClick={toggle} style={{
        width:28, height:28, borderRadius:"50%", border:"none", cursor:"pointer", flexShrink:0,
        background:"rgba(13,148,136,.35)", color:"white", fontSize:11,
        display:"flex", alignItems:"center", justifyContent:"center",
      }}>
        {playing ? "⏸" : "▶"}
      </button>

      <div style={{ flex:1, display:"flex", flexDirection:"column", gap:4 }}>
        <div style={{ height:3, borderRadius:2, background:"rgba(255,255,255,.15)", overflow:"hidden" }}>
          <div style={{ height:"100%", width:`${progress}%`, background:"#2DD4BF", borderRadius:2, transition:"width .2s" }} />
        </div>
        <div style={{ fontSize:9, color:"rgba(255,255,255,.35)", fontFamily:"monospace" }}>
          {fmtSecs(elapsed)} / {fmtSecs(duration || 0)}
        </div>
      </div>

      <span style={{ fontSize:12 }}>🎤</span>
    </div>
  );
}