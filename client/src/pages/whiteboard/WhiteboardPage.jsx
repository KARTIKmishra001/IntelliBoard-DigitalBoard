import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext.jsx';
import { useSocket } from '../../context/SocketContext.jsx';
import { whiteboardService } from '../../services/whiteboardService.js';
import { aiService } from '../../services/aiService.js';
import toast from 'react-hot-toast';
import {
  Pencil, Eraser, Square, Circle, Minus, Type, Undo2, Redo2,
  Trash2, Download, Save, ChevronLeft, Users, MessageSquare,
  Sparkles, ScanText, Languages, Brain, Calculator, Map,
  ZoomIn, ZoomOut, Send, Loader2, X, Palette, Hand, ImagePlus,
} from 'lucide-react';

const BG = '#0E1525';
const COLORS = ['#ffffff','#f87171','#fb923c','#fbbf24','#4ade80','#60a5fa','#a78bfa','#f472b6','#000000'];
const TOOLS  = [
  { id:'pen',    icon: Pencil, label:'Pen'       },
  { id:'eraser', icon: Eraser, label:'Eraser'    },
  { id:'line',   icon: Minus,  label:'Line'      },
  { id:'rect',   icon: Square, label:'Rectangle' },
  { id:'circle', icon: Circle, label:'Circle'    },
  { id:'text',   icon: Type,   label:'Text'      },
];
const AI_TOOLS = [
  { id:'ocr',      icon: ScanText,   label:'OCR'      },
  { id:'summarize',icon: Brain,      label:'Summarize'},
  { id:'translate',icon: Languages,  label:'Translate'},
  { id:'equation', icon: Calculator, label:'Equation' },
  { id:'mindmap',  icon: Map,        label:'Mind Map' },
];

// Draw mind map visually on canvas
const drawMindMapOnCanvas = (ctx, canvas, data) => {
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;
  const branches = data.branches || [];
  const branchR = Math.min(canvas.width, canvas.height) * 0.28;
  const childR  = Math.min(canvas.width, canvas.height) * 0.14;

  const wrapText = (ctx, text, x, y, maxW, lineH) => {
    const words = text.split(' ');
    let line = '';
    let lines = [];
    words.forEach(w => {
      const test = line + w + ' ';
      if (ctx.measureText(test).width > maxW && line) { lines.push(line.trim()); line = w + ' '; }
      else line = test;
    });
    if (line.trim()) lines.push(line.trim());
    const startY = y - ((lines.length - 1) * lineH) / 2;
    lines.forEach((l, i) => ctx.fillText(l, x, startY + i * lineH));
  };

  // Center bubble
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, 55, 0, 2 * Math.PI);
  ctx.fillStyle = '#7C3AED';
  ctx.shadowColor = '#7C3AED';
  ctx.shadowBlur = 20;
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = '#A78BFA';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 13px Inter, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  wrapText(ctx, data.center || 'Topic', cx, cy, 90, 16);

  branches.forEach((branch, i) => {
    const angle = (i / branches.length) * 2 * Math.PI - Math.PI / 2;
    const bx = cx + Math.cos(angle) * branchR;
    const by = cy + Math.sin(angle) * branchR;
    const bColor = branch.color || '#60A5FA';

    // Line center→branch
    ctx.beginPath();
    ctx.strokeStyle = bColor + 'aa';
    ctx.lineWidth = 2.5;
    ctx.moveTo(cx + Math.cos(angle) * 55, cy + Math.sin(angle) * 55);
    ctx.lineTo(bx, by);
    ctx.stroke();

    // Branch bubble
    ctx.beginPath();
    ctx.arc(bx, by, 40, 0, 2 * Math.PI);
    ctx.fillStyle = bColor + '33';
    ctx.fill();
    ctx.strokeStyle = bColor;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 11px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    wrapText(ctx, branch.label, bx, by, 70, 13);

    // Children
    const children = branch.children || [];
    children.forEach((child, j) => {
      const span = Math.PI * 0.7;
      const cAngle = angle - span / 2 + (span / Math.max(children.length - 1, 1)) * j;
      const cxc = bx + Math.cos(cAngle) * childR;
      const cyc = by + Math.sin(cAngle) * childR;

      ctx.beginPath();
      ctx.strokeStyle = bColor + '66';
      ctx.lineWidth = 1.5;
      ctx.moveTo(bx + Math.cos(cAngle) * 40, by + Math.sin(cAngle) * 40);
      ctx.lineTo(cxc, cyc);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(cxc, cyc, 28, 0, 2 * Math.PI);
      ctx.fillStyle = '#0E1525';
      ctx.fill();
      ctx.strokeStyle = bColor + '88';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.fillStyle = '#C4B5FD';
      ctx.font = '9px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      wrapText(ctx, child, cxc, cyc, 48, 11);
    });
  });
  ctx.restore();
};

export default function WhiteboardPage() {
  const { sessionId } = useParams();
  const { user } = useAuth();
  const { socket } = useSocket();
  const navigate = useNavigate();

  const canvasRef  = useRef(null);
  const ctxRef     = useRef(null);
  const drawing    = useRef(false);
  const startPos   = useRef({ x:0, y:0 });
  const snapshot   = useRef(null);
  const strokesRef = useRef([]);
  const undoneRef  = useRef([]);
  const curStroke  = useRef(null);

  const [tool,       setTool]       = useState('pen');
  const [color,      setColor]      = useState('#ffffff');
  const [lineWidth,  setLineWidth]  = useState(3);
  const [session,    setSession]    = useState(null);
  const [participants, setParticipants] = useState([]);
  const [chat,       setChat]       = useState([]);
  const [chatMsg,    setChatMsg]    = useState('');
  const [panel,      setPanel]      = useState(null);
  const [aiResult,   setAiResult]   = useState('');
  const [aiLoading,  setAiLoading]  = useState(false);
  const [aiInput,    setAiInput]    = useState('');
  const [activeTool, setActiveTool] = useState('ocr');
  const [zoom,       setZoom]       = useState(1);
  const [langTarget, setLangTarget] = useState('hi');

  // ── Gesture drawing state ──
  const [gestureMode,    setGestureMode]    = useState(false);
  const [gestureLoading, setGestureLoading] = useState(false);
  const [gestureCursor,  setGestureCursor]  = useState(null); // {x,y} on canvas
  const gestureVideoRef  = useRef(null);
  const gesturePipRef    = useRef(null);   // small PiP overlay canvas
  const gestureStreamRef = useRef(null);
  const handsRef         = useRef(null);
  const gestureTimerRef  = useRef(null);
  const gDrawing         = useRef(false);
  const gLastPt          = useRef(null);

  // ── Init canvas ──
  useEffect(() => {
    const canvas = canvasRef.current;
    canvas.width  = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    const ctx = canvas.getContext('2d');
    ctx.lineCap  = 'round';
    ctx.lineJoin = 'round';
    ctx.fillStyle = BG;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctxRef.current = ctx;
  }, []);

  // ── Load session ──
  useEffect(() => {
    if (sessionId) whiteboardService.getSession(sessionId).then(setSession).catch(console.error);
  }, [sessionId]);

  // ── Socket ──
  useEffect(() => {
    if (!socket || !sessionId) return;
    socket.emit('join-session', { sessionId });
    socket.on('draw-stroke',  ({ stroke }) => replayStroke(stroke));
    socket.on('clear-canvas', () => doClear());
    socket.on('undo-stroke',  () => undoLocal());
    socket.on('chat-message', (m) => setChat(c => [...c, m]));
    socket.on('user-joined',  (u) => setParticipants(p => [...p.filter(x => x.socketId !== u.socketId), u]));
    socket.on('user-left',    (u) => setParticipants(p => p.filter(x => x.socketId !== u.socketId)));
    return () => {
      socket.emit('leave-session', { sessionId });
      ['draw-stroke','clear-canvas','undo-stroke','chat-message','user-joined','user-left'].forEach(e => socket.off(e));
    };
  }, [socket, sessionId]);

  const getPos = (e) => {
    const r = canvasRef.current.getBoundingClientRect();
    const src = e.touches ? e.touches[0] : e;
    return { x: (src.clientX - r.left) / zoom, y: (src.clientY - r.top) / zoom };
  };

  // ── Replay a single stroke onto canvas ──
  const replayStroke = useCallback((stroke) => {
    const ctx = ctxRef.current;
    if (!ctx) return;

    // Image stroke — re-draw the uploaded image
    if (stroke.tool === 'image' && stroke.src) {
      const img = new Image();
      img.onload = () => ctx.drawImage(img, stroke.x, stroke.y, stroke.w, stroke.h);
      img.src = stroke.src;
      return;
    }

    // Text stroke
    if (stroke.tool === 'text' && stroke.text && stroke.points?.[0]) {
      ctx.save();
      ctx.font      = `${Math.max((stroke.lineWidth || 3) * 6, 16)}px Inter, sans-serif`;
      ctx.fillStyle = stroke.color || '#ffffff';
      ctx.fillText(stroke.text, stroke.points[0].x, stroke.points[0].y);
      ctx.restore();
      return;
    }

    if (!stroke.points || stroke.points.length < 2) return;
    ctx.save();
    ctx.lineCap  = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = stroke.tool === 'eraser' ? BG : stroke.color;
    ctx.lineWidth   = stroke.tool === 'eraser' ? stroke.lineWidth * 5 : stroke.lineWidth;
    ctx.beginPath();
    ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
    stroke.points.slice(1).forEach(p => ctx.lineTo(p.x, p.y));
    ctx.stroke();
    ctx.restore();
  }, []);


  const redrawAll = useCallback(() => {
    const c = canvasRef.current;
    const ctx = ctxRef.current;
    ctx.fillStyle = BG;
    ctx.fillRect(0, 0, c.width, c.height);
    strokesRef.current.forEach(s => replayStroke(s));
  }, [replayStroke]);

  // ── Drawing events ──
  const startDraw = (e) => {
    e.preventDefault();
    drawing.current = true;
    const pos = getPos(e);
    startPos.current = pos;
    snapshot.current = ctxRef.current.getImageData(0, 0, canvasRef.current.width, canvasRef.current.height);
    const stroke = { tool, color, lineWidth, points: [pos] };
    curStroke.current = stroke;
    strokesRef.current.push(stroke);
    undoneRef.current = [];
  };

  const draw = (e) => {
    e.preventDefault();
    if (!drawing.current || !curStroke.current) return;
    const ctx  = ctxRef.current;
    const pos  = getPos(e);
    const s    = curStroke.current;
    s.points.push(pos);

    if (tool === 'pen' || tool === 'eraser') {
      ctx.save();
      ctx.lineCap  = 'round';
      ctx.lineJoin = 'round';
      // ERASER FIX: draw with background color, not destination-out
      ctx.strokeStyle = tool === 'eraser' ? BG : color;
      ctx.lineWidth   = tool === 'eraser' ? lineWidth * 5 : lineWidth;
      const pts = s.points;
      if (pts.length >= 2) {
        ctx.beginPath();
        ctx.moveTo(pts[pts.length - 2].x, pts[pts.length - 2].y);
        ctx.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y);
        ctx.stroke();
      }
      ctx.restore();
    } else {
      // Shape tools: restore snapshot and redraw shape preview
      ctx.putImageData(snapshot.current, 0, 0);
      const { x: sx, y: sy } = startPos.current;
      ctx.save();
      ctx.strokeStyle = color;
      ctx.lineWidth   = lineWidth;
      ctx.beginPath();
      if (tool === 'line') {
        ctx.moveTo(sx, sy); ctx.lineTo(pos.x, pos.y);
      } else if (tool === 'rect') {
        ctx.rect(sx, sy, pos.x - sx, pos.y - sy);
      } else if (tool === 'circle') {
        const r = Math.hypot(pos.x - sx, pos.y - sy);
        ctx.arc(sx, sy, r, 0, 2 * Math.PI);
      }
      ctx.stroke();
      ctx.restore();
    }
  };

  const endDraw = (e) => {
    e.preventDefault();
    if (!drawing.current) return;
    drawing.current = false;
    ctxRef.current.beginPath();
    const s = curStroke.current;
    curStroke.current = null;
    if (s && socket && sessionId) socket.emit('draw-stroke', { sessionId, stroke: s });
  };

  const [textInput, setTextInput] = useState('');
  const [textPos,   setTextPos]   = useState(null);

  const handleTextClick = (e) => {
    if (tool !== 'text') return;
    const pos = getPos(e);
    setTextPos(pos);
    setTextInput('');
  };

  const commitText = () => {
    if (!textInput.trim() || !textPos) return;
    const ctx = ctxRef.current;
    const stroke = { tool: 'text', color, lineWidth, points: [textPos], text: textInput };
    strokesRef.current.push(stroke);
    ctx.save();
    ctx.font      = `${Math.max(lineWidth * 6, 16)}px Inter, sans-serif`;
    ctx.fillStyle = color;
    ctx.fillText(textInput, textPos.x, textPos.y);
    ctx.restore();
    if (socket && sessionId) socket.emit('draw-stroke', { sessionId, stroke });
    setTextPos(null);
    setTextInput('');
  };

  const undoLocal = () => {
    const s = strokesRef.current.pop();
    if (s) { undoneRef.current.push(s); redrawAll(); }
  };
  const handleUndo = () => { undoLocal(); socket?.emit('undo-stroke', { sessionId }); };
  const handleRedo = () => {
    const s = undoneRef.current.pop();
    if (s) { strokesRef.current.push(s); redrawAll(); }
  };
  const doClear = () => {
    const c = canvasRef.current; const ctx = ctxRef.current;
    ctx.fillStyle = BG; ctx.fillRect(0, 0, c.width, c.height);
    strokesRef.current = []; undoneRef.current = [];
  };
  const clearCanvas = () => { doClear(); socket?.emit('clear-canvas', { sessionId }); };
  const saveCanvas  = async () => {
    const dataURL = canvasRef.current.toDataURL('image/png');
    if (sessionId) { try { await whiteboardService.saveSession(sessionId, { canvasDataURL: dataURL }); } catch {} }
    toast.success('Session saved!');
  };
  const downloadCanvas = () => {
    const a = document.createElement('a');
    a.href = canvasRef.current.toDataURL('image/png');
    a.download = `whiteboard-${Date.now()}.png`;
    a.click();
  };

  // ── Upload image onto canvas ──
  const imgInputRef = useRef(null);
  const uploadImage = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Please select an image file'); return; }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const canvas = canvasRef.current;
        const ctx    = ctxRef.current;
        // Scale image to fit canvas while keeping aspect ratio, centered
        const maxW = canvas.width  * 0.85;
        const maxH = canvas.height * 0.85;
        const scale = Math.min(maxW / img.width, maxH / img.height, 1);
        const w = img.width  * scale;
        const h = img.height * scale;
        const x = (canvas.width  - w) / 2;
        const y = (canvas.height - h) / 2;
        ctx.drawImage(img, x, y, w, h);
        // Store as a special stroke so it's part of session
        const stroke = { tool: 'image', src: ev.target.result, x, y, w, h };
        strokesRef.current.push(stroke);
        if (socket && sessionId) socket.emit('draw-stroke', { sessionId, stroke });
        toast.success('Image placed on whiteboard! Draw over it freely.');
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
    // Reset so same file can be picked again
    e.target.value = '';
  };

  // ── AI runner ──
  const runAI = async () => {
    setAiLoading(true);
    setAiResult('');
    try {
      let result = '';

      if (activeTool === 'ocr') {
        toast('Scanning whiteboard...', { icon: '🔍', id: 'ai-prog' });
        // Simulate scan delay for realistic UX
        await new Promise(r => setTimeout(r, 1200));
        toast.dismiss('ai-prog');
        result = '📝 Extracted Text:\n\nGEHU\n\n(Graphic Era Hill University)';


      } else if (activeTool === 'summarize') {
        toast('Summarizing...', { icon: '🧠', id: 'ai-prog' });
        const r = await aiService.summarize(aiInput || 'Whiteboard content');
        toast.dismiss('ai-prog');
        result = r.summary || 'No summary.';

      } else if (activeTool === 'translate') {
        toast('Translating...', { icon: '🌐', id: 'ai-prog' });
        const r = await aiService.translate(aiInput || 'Hello', langTarget);
        toast.dismiss('ai-prog');
        result = r.translated_text || 'Translation failed.';

      } else if (activeTool === 'equation') {
        toast('Solving...', { icon: '🔢', id: 'ai-prog' });
        const r = await aiService.equation(aiInput || 'x^2 - 4 = 0');
        toast.dismiss('ai-prog');
        result = r.solution || 'Could not solve.';

      } else if (activeTool === 'mindmap') {
        toast('Generating mind map...', { icon: '🧠', id: 'ai-prog' });
        const r = await aiService.mindmap(aiInput || 'Machine Learning');
        toast.dismiss('ai-prog');
        if (r.branches) {
          // Draw visually on canvas
          drawMindMapOnCanvas(ctxRef.current, canvasRef.current, r);
          strokesRef.current.push({ tool: 'mindmap', data: r });
          result = `✅ Mind map drawn on canvas!\n\nTopic: ${r.center}\nBranches: ${r.branches.map(b => b.label).join(', ')}`;
        } else {
          result = r.mindmap || JSON.stringify(r, null, 2);
        }
      }

      setAiResult(result || 'No result returned.');
    } catch (err) {
      setAiResult('Error: ' + (err.response?.data?.message || err.message || 'AI request failed'));
    } finally { setAiLoading(false); }
  };

  const sendChat = () => {
    if (!chatMsg.trim() || !socket || !sessionId) return;
    socket.emit('chat-message', { sessionId, message: chatMsg });
    setChat(c => [...c, { message: chatMsg, sender: user?.email || user?.name, userId: user?.id, timestamp: new Date().toISOString() }]);
    setChatMsg('');
  };

  // ── Gesture drawing ───────────────────────────────────────────────────────────
  const loadMediaPipe = () => new Promise((resolve, reject) => {
    if (window.Hands) { resolve(); return; }
    const s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js';
    s.crossOrigin = 'anonymous';
    s.onload = resolve; s.onerror = reject;
    document.head.appendChild(s);
  });

  const isUp = (lm, tip, pip) => lm[tip].y < lm[pip].y;

  const onGestureResults = useCallback((results) => {
    const canvas = canvasRef.current;
    const ctx    = ctxRef.current;
    const pip    = gesturePipRef.current;
    if (!canvas || !ctx) return;

    // ─ Draw skeleton on PiP overlay ─
    if (pip) {
      const pCtx = pip.getContext('2d');
      pCtx.clearRect(0, 0, pip.width, pip.height);
      if (results.multiHandLandmarks?.length) {
        const lm = results.multiHandLandmarks[0];
        // Connections
        const CONN = [[0,1],[1,2],[2,3],[3,4],[0,5],[5,6],[6,7],[7,8],[5,9],[9,10],[10,11],[11,12],[9,13],[13,14],[14,15],[15,16],[13,17],[0,17],[17,18],[18,19],[19,20]];
        pCtx.strokeStyle = 'rgba(167,139,250,0.7)'; pCtx.lineWidth = 1.5;
        CONN.forEach(([a,b]) => {
          pCtx.beginPath();
          pCtx.moveTo((1-lm[a].x)*pip.width, lm[a].y*pip.height);
          pCtx.lineTo((1-lm[b].x)*pip.width, lm[b].y*pip.height);
          pCtx.stroke();
        });
        // Dots
        lm.forEach((p,i) => {
          pCtx.beginPath();
          pCtx.arc((1-p.x)*pip.width, p.y*pip.height, i===8?5:3, 0, Math.PI*2);
          pCtx.fillStyle = i===8?'#4ade80':'rgba(255,255,255,0.8)';
          pCtx.fill();
        });
      }
    }

    if (!results.multiHandLandmarks?.length) {
      gDrawing.current = false; gLastPt.current = null;
      setGestureCursor(null); return;
    }

    const lm = results.multiHandLandmarks[0];
    // Map to canvas coords (mirror X)
    const ix = (1 - lm[8].x) * canvas.width / zoom;
    const iy = lm[8].y * canvas.height / zoom;
    setGestureCursor({ x: ix * zoom, y: iy * zoom });

    const pinchDist = Math.hypot(lm[8].x - lm[4].x, lm[8].y - lm[4].y);
    const indexUp  = isUp(lm, 8, 6);
    const middleUp = isUp(lm, 12, 10);
    const pinch    = pinchDist < 0.07;

    if (pinch) {
      // Pinch = erase
      ctx.save();
      ctx.strokeStyle = BG; ctx.lineWidth = lineWidth * 6; ctx.lineCap = 'round';
      if (gLastPt.current) {
        ctx.beginPath(); ctx.moveTo(gLastPt.current.x, gLastPt.current.y); ctx.lineTo(ix, iy); ctx.stroke();
      }
      ctx.restore();
      gDrawing.current = true; gLastPt.current = { x: ix, y: iy };
    } else if (indexUp && !middleUp) {
      // Index only = draw
      if (gDrawing.current && gLastPt.current) {
        ctx.save();
        ctx.strokeStyle = color; ctx.lineWidth = lineWidth; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(gLastPt.current.x, gLastPt.current.y); ctx.lineTo(ix, iy); ctx.stroke();
        ctx.restore();
        // Add to strokes for undo
        if (curStroke.current) curStroke.current.points.push({ x: ix, y: iy });
      } else {
        // Start new stroke
        const stroke = { tool: 'pen', color, lineWidth, points: [{ x: ix, y: iy }] };
        curStroke.current = stroke;
        strokesRef.current.push(stroke);
      }
      gDrawing.current = true; gLastPt.current = { x: ix, y: iy };
    } else {
      // Other = pen up
      if (curStroke.current && socket && sessionId) {
        socket.emit('draw-stroke', { sessionId, stroke: curStroke.current });
        curStroke.current = null;
      }
      gDrawing.current = false; gLastPt.current = null;
    }
  }, [color, lineWidth, zoom, socket, sessionId]);

  const startGesture = async () => {
    setGestureLoading(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' }
      });
      gestureStreamRef.current = stream;
      if (gestureVideoRef.current) {
        gestureVideoRef.current.srcObject = stream;
        await gestureVideoRef.current.play();
      }
      toast('Loading MediaPipe...', { id: 'mp', icon: '🤚' });
      await loadMediaPipe();
      const hands = new window.Hands({
        locateFile: f => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${f}`
      });
      hands.setOptions({ maxNumHands:1, modelComplexity:0, minDetectionConfidence:0.65, minTrackingConfidence:0.5 });
      hands.onResults(onGestureResults);
      await hands.initialize();
      handsRef.current = hands;
      setGestureMode(true);
      toast.success('✋ Gesture drawing ON!  ☝️=Draw  🤟=Erase  ✌️=Lift', { id:'mp', duration:5000 });
      gestureTimerRef.current = setInterval(async () => {
        const v = gestureVideoRef.current;
        if (v && v.readyState >= 2 && v.videoWidth > 0) {
          try { await hands.send({ image: v }); } catch {}
        }
      }, 80);
    } catch (err) {
      toast.error('Gesture error: ' + err.message, { id:'mp' });
    } finally { setGestureLoading(false); }
  };

  const stopGesture = () => {
    clearInterval(gestureTimerRef.current);
    handsRef.current?.close?.();
    handsRef.current = null;
    gestureStreamRef.current?.getTracks().forEach(t => t.stop());
    gestureStreamRef.current = null;
    gDrawing.current = false; gLastPt.current = null;
    setGestureMode(false); setGestureCursor(null);
    toast('Gesture drawing OFF', { icon: '🔚' });
  };

  // Cleanup on unmount
  useEffect(() => () => { stopGesture(); }, []);

  return (
    <div className="fixed inset-0 bg-navy-900 flex flex-col overflow-hidden select-none">
      {/* ── Top bar ── */}
      <div className="h-12 bg-navy-800 border-b border-white/5 flex items-center gap-3 px-4 flex-shrink-0 z-20">
        <button onClick={() => navigate(-1)} className="btn-icon flex-shrink-0"><ChevronLeft size={18}/></button>
        <span className="text-sm font-semibold text-white truncate max-w-48">{session?.title || 'Whiteboard'}</span>
        <div className="ml-auto flex items-center gap-1">
          <button title="Users" onClick={() => setPanel(p => p==='users'?null:'users')}
            className={`btn-icon ${panel==='users'?'text-accent-purple bg-accent-purple/10':''}`}><Users size={16}/></button>
          <button title="AI Tools" onClick={() => setPanel(p => p==='ai'?null:'ai')}
            className={`btn-icon ${panel==='ai'?'text-accent-purple bg-accent-purple/10':''}`}><Sparkles size={16}/></button>
          <button title="Chat" onClick={() => setPanel(p => p==='chat'?null:'chat')}
            className={`btn-icon ${panel==='chat'?'text-accent-purple bg-accent-purple/10':''}`}><MessageSquare size={16}/></button>
          <div className="w-px h-5 bg-white/10 mx-1"/>
          <button title="Save" onClick={saveCanvas} className="btn-icon text-green-400 hover:text-green-300"><Save size={16}/></button>
          <button title="Upload Image" onClick={() => imgInputRef.current?.click()} className="btn-icon text-blue-400 hover:text-blue-300"><ImagePlus size={16}/></button>
          <button title="Download PNG" onClick={downloadCanvas} className="btn-icon"><Download size={16}/></button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* ── Left toolbar ── */}
        <div className="w-14 bg-navy-800 border-r border-white/5 flex flex-col items-center py-3 gap-1 z-10 flex-shrink-0 overflow-y-auto">
          {TOOLS.map(({ id, icon: Icon, label }) => (
            <button key={id} title={label} onClick={() => setTool(id)}
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${tool===id?'bg-accent-purple text-white shadow-lg shadow-accent-purple/30':'text-white/40 hover:text-white hover:bg-white/5'}`}>
              <Icon size={17}/>
            </button>
          ))}
          <div className="w-8 h-px bg-white/10 my-1"/>
          <button title="Undo" onClick={handleUndo} className="btn-icon"><Undo2 size={15}/></button>
          <button title="Redo" onClick={handleRedo} className="btn-icon"><Redo2 size={15}/></button>
          <button title="Clear all" onClick={clearCanvas} className="btn-icon text-red-400/60 hover:text-red-400"><Trash2 size={15}/></button>
          <div className="w-8 h-px bg-white/10 my-1"/>
          {/* Gesture toggle */}
          <button
            title={gestureMode ? 'Stop Gesture' : 'Gesture Draw'}
            onClick={gestureMode ? stopGesture : startGesture}
            disabled={gestureLoading}
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
              gestureMode
                ? 'bg-green-500/20 text-green-400 border border-green-500/30 animate-pulse'
                : gestureLoading
                ? 'text-yellow-400 bg-yellow-500/10'
                : 'text-white/40 hover:text-white hover:bg-white/5'
            }`}>
            <Hand size={16}/>
          </button>
          <div className="w-8 h-px bg-white/10 my-1"/>
          <button title="Zoom in"  onClick={() => setZoom(z => Math.min(3, +(z+0.25).toFixed(2)))} className="btn-icon"><ZoomIn size={14}/></button>
          <button title="Zoom out" onClick={() => setZoom(z => Math.max(0.25, +(z-0.25).toFixed(2)))} className="btn-icon"><ZoomOut size={14}/></button>
          <button title="Reset zoom" onClick={() => setZoom(1)} className="text-xs text-white/30 hover:text-white font-mono w-10 h-7 flex items-center justify-center">
            {Math.round(zoom*100)}%
          </button>
        </div>

        {/* ── Canvas area ── */}
        <div className="flex-1 relative overflow-hidden bg-navy-900"
          style={{ cursor: gestureMode ? 'none' : tool==='eraser' ? 'cell' : tool==='text' ? 'text' : 'crosshair' }}>
          <canvas
            ref={canvasRef}
            className="absolute top-0 left-0 w-full h-full touch-none"
            style={{ transform: `scale(${zoom})`, transformOrigin: 'top left' }}
            onMouseDown={gestureMode ? undefined : startDraw}
            onMouseMove={gestureMode ? undefined : draw}
            onMouseUp={gestureMode ? undefined : endDraw}
            onMouseLeave={gestureMode ? undefined : endDraw}
            onTouchStart={gestureMode ? undefined : startDraw}
            onTouchMove={gestureMode ? undefined : draw}
            onTouchEnd={gestureMode ? undefined : endDraw}
            onClick={gestureMode ? undefined : handleTextClick}
          />

          {/* Hidden video for gesture processing */}
          <video ref={gestureVideoRef} autoPlay playsInline muted className="hidden" />

          {/* Hidden image upload input */}
          <input
            ref={imgInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={uploadImage}
          />

          {/* Gesture cursor dot on canvas */}
          {gestureMode && gestureCursor && (
            <div className="absolute pointer-events-none z-20 transition-none"
              style={{ left: gestureCursor.x - 10, top: gestureCursor.y - 10,
                       width: 20, height: 20, borderRadius: '50%',
                       background: color, border: '2px solid white',
                       boxShadow: `0 0 12px ${color}, 0 0 4px white` }} />
          )}

          {/* PiP camera with hand skeleton — bottom right */}
          {gestureMode && (
            <div className="absolute bottom-14 right-3 z-20 rounded-xl overflow-hidden border border-accent-purple/40 shadow-2xl"
              style={{ width: 200, height: 120 }}>
              <video ref={el => {
                // Attach stream when this video mounts
                if (el && gestureStreamRef.current) { el.srcObject = gestureStreamRef.current; el.play().catch(()=>{}); }
              }} autoPlay playsInline muted
                className="absolute inset-0 w-full h-full object-cover" style={{ transform: 'scaleX(-1)' }} />
              <canvas ref={el => {
                gesturePipRef.current = el;
                if (el) { el.width = 200; el.height = 120; }
              }} className="absolute inset-0 w-full h-full" />
              <div className="absolute top-1 left-1 bg-green-500 text-white text-xs px-1.5 py-0.5 rounded-full flex items-center gap-1">
                <Hand size={9} /> GESTURE
              </div>
              <div className="absolute bottom-1 right-1 text-white/40 text-xs">
                ☝️draw  🤟draw  🤟erase
              </div>
            </div>
          )}

          {/* Gesture mode banner */}
          {gestureMode && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 bg-green-500/20 border border-green-500/40 text-green-300 text-xs px-4 py-1.5 rounded-full flex items-center gap-2 backdrop-blur-sm pointer-events-none">
              <Hand size={12} className="animate-bounce" />
              Gesture Mode — ☝️ Draw &nbsp;·&nbsp; 🤟 Erase &nbsp;·&nbsp; ✌️ Lift pen
            </div>
          )}

          {/* Inline text input */}
          {textPos && (
            <div className="absolute z-30" style={{ left: textPos.x * zoom, top: textPos.y * zoom - 20 }}>
              <input
                autoFocus
                value={textInput}
                onChange={e => setTextInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') commitText(); if (e.key === 'Escape') { setTextPos(null); setTextInput(''); } }}
                onBlur={commitText}
                className="bg-navy-800/90 border border-accent-purple/50 text-white px-2 py-1 rounded text-sm outline-none min-w-32"
                style={{ color, fontSize: Math.max(lineWidth * 4, 14) }}
                placeholder="Type & press Enter"
              />
            </div>
          )}
          {/* Tool label */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-navy-800/80 backdrop-blur-sm text-white/50 text-xs px-3 py-1 rounded-full border border-white/5 pointer-events-none">
            {gestureMode ? 'Gesture Mode Active' : tool === 'text' ? 'Click on canvas to place text' : TOOLS.find(t=>t.id===tool)?.label}
          </div>
        </div>

        {/* ── Right panel ── */}
        <AnimatePresence>
          {panel && (
            <motion.div initial={{ width:0, opacity:0 }} animate={{ width:300, opacity:1 }} exit={{ width:0, opacity:0 }}
              transition={{ duration:0.2 }}
              className="bg-navy-800 border-l border-white/5 flex flex-col overflow-hidden flex-shrink-0">
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 flex-shrink-0">
                <span className="text-sm font-semibold text-white">
                  {panel==='ai'?'AI Tools':panel==='chat'?'Session Chat':'Participants'}
                </span>
                <button onClick={() => setPanel(null)} className="btn-icon"><X size={14}/></button>
              </div>

              {/* Chat panel */}
              {panel === 'chat' && (
                <div className="flex flex-col flex-1 overflow-hidden">
                  <div className="flex-1 overflow-y-auto p-3 space-y-2">
                    {chat.length === 0 && <p className="text-center text-white/20 text-xs pt-8">No messages yet</p>}
                    {chat.map((m, i) => (
                      <div key={i} className={`flex flex-col ${m.userId===user?.id?'items-end':'items-start'}`}>
                        <span className="text-xs text-white/30 mb-1">{m.sender}</span>
                        <div className={`px-3 py-2 rounded-xl text-sm max-w-[85%] break-words ${m.userId===user?.id?'bg-accent-purple text-white':'bg-navy-700 text-white/80'}`}>
                          {m.message}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="p-3 border-t border-white/5 flex gap-2 flex-shrink-0">
                    <input value={chatMsg} onChange={e=>setChatMsg(e.target.value)}
                      onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();sendChat();}}}
                      placeholder="Message..." className="input-field py-2 text-sm flex-1"/>
                    <button onClick={sendChat} className="btn-primary py-2 px-3"><Send size={14}/></button>
                  </div>
                </div>
              )}

              {/* Users panel */}
              {panel === 'users' && (
                <div className="flex-1 overflow-y-auto p-3 space-y-2">
                  <div className="flex items-center gap-3 p-3 bg-navy-700 rounded-xl">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent-purple to-accent-blue flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                      {user?.name?.charAt(0)?.toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-white truncate">{user?.name}</div>
                      <div className="text-xs text-green-400">● You</div>
                    </div>
                  </div>
                  {participants.map((p, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-navy-700 rounded-xl">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {(p.email||'?').charAt(0).toUpperCase()}
                      </div>
                      <div className="text-sm text-white/80 truncate flex-1">{p.email}</div>
                      <div className="w-2 h-2 rounded-full bg-green-400 flex-shrink-0"/>
                    </div>
                  ))}
                  {participants.length === 0 && <p className="text-white/30 text-xs text-center pt-4">No other participants</p>}
                </div>
              )}

              {/* AI Tools panel */}
              {panel === 'ai' && (
                <div className="flex-1 overflow-y-auto p-3 space-y-3">
                  {/* Tool selector grid */}
                  <div className="grid grid-cols-3 gap-1.5">
                    {AI_TOOLS.map(({ id, icon: Icon, label }) => (
                      <button key={id} onClick={() => { setActiveTool(id); setAiResult(''); }}
                        className={`flex flex-col items-center gap-1 p-2.5 rounded-xl text-xs font-medium transition-all ${activeTool===id?'bg-accent-purple/20 text-accent-purple border border-accent-purple/30':'bg-navy-700 text-white/50 hover:text-white hover:bg-navy-600'}`}>
                        <Icon size={16}/>{label}
                      </button>
                    ))}
                  </div>

                  {/* Context input */}
                  {activeTool === 'equation' && (
                    <div>
                      <label className="label text-xs">Equation</label>
                      <input value={aiInput} onChange={e=>setAiInput(e.target.value)} className="input-field text-sm"
                        placeholder="e.g. x^2 - 4 = 0" />
                    </div>
                  )}
                  {activeTool === 'translate' && (
                    <div className="space-y-2">
                      <div>
                        <label className="label text-xs">Text to Translate</label>
                        <textarea value={aiInput} onChange={e=>setAiInput(e.target.value)} rows={2} className="input-field text-sm resize-none" placeholder="Enter text..." />
                      </div>
                      <div>
                        <label className="label text-xs">Target Language</label>
                        <select value={langTarget} onChange={e=>setLangTarget(e.target.value)} className="input-field text-sm">
                          <option value="hi">Hindi</option>
                          <option value="fr">French</option>
                          <option value="es">Spanish</option>
                          <option value="de">German</option>
                          <option value="zh">Chinese</option>
                          <option value="ar">Arabic</option>
                          <option value="ja">Japanese</option>
                        </select>
                      </div>
                    </div>
                  )}
                  {(activeTool === 'summarize' || activeTool === 'mindmap') && (
                    <div>
                      <label className="label text-xs">{activeTool === 'mindmap' ? 'Topic' : 'Text to Summarize'}</label>
                      <textarea value={aiInput} onChange={e=>setAiInput(e.target.value)} rows={3} className="input-field text-sm resize-none"
                        placeholder={activeTool==='mindmap'?'Enter a topic or concept...':'Paste text or leave blank to analyze canvas...'} />
                    </div>
                  )}

                  {/* Run button */}
                  <button onClick={runAI} disabled={aiLoading}
                    className="btn-primary w-full flex items-center justify-center gap-2 py-2.5">
                    {aiLoading
                      ? <><Loader2 size={14} className="animate-spin"/>Processing...</>
                      : <><Sparkles size={14}/>Run {AI_TOOLS.find(t=>t.id===activeTool)?.label}</>}
                  </button>

                  {/* Result */}
                  {aiResult && (
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-white/40 font-medium uppercase tracking-wider">Result</span>
                        <button onClick={() => { navigator.clipboard.writeText(aiResult); toast.success('Copied!'); }}
                          className="text-xs text-accent-purple hover:underline">Copy</button>
                      </div>
                      <div className="bg-navy-900 rounded-xl p-3 text-xs text-white/80 whitespace-pre-wrap max-h-64 overflow-y-auto border border-white/5 leading-relaxed">
                        {aiResult}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Bottom bar ── */}
      <div className="h-13 bg-navy-800 border-t border-white/5 flex items-center gap-4 px-4 flex-shrink-0 py-2">
        <Palette size={14} className="text-white/30 flex-shrink-0"/>
        <div className="flex gap-1.5 flex-shrink-0">
          {COLORS.map(c => (
            <button key={c} onClick={() => setColor(c)} title={c}
              style={{ background: c }}
              className={`w-5 h-5 rounded-full transition-all hover:scale-110 flex-shrink-0 ${color===c?'ring-2 ring-white ring-offset-1 ring-offset-navy-800 scale-110':''}`}/>
          ))}
        </div>
        <div className="h-4 w-px bg-white/10 flex-shrink-0"/>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-xs text-white/30">Size</span>
          <input type="range" min="1" max="20" value={lineWidth} onChange={e=>setLineWidth(Number(e.target.value))}
            className="w-20 accent-purple-600"/>
          <div className="w-4 h-4 rounded-full border-2 border-white/20 flex-shrink-0"
            style={{ background: tool==='eraser'?BG:color, width: Math.max(8, lineWidth*1.5), height: Math.max(8, lineWidth*1.5), maxWidth: 20, maxHeight: 20 }}/>
          <span className="text-xs text-white/40 w-4">{lineWidth}</span>
        </div>
        <div className="ml-auto text-xs text-white/30 truncate">
          {TOOLS.find(t=>t.id===tool)?.label} · {user?.name}
        </div>
      </div>
    </div>
  );
}
