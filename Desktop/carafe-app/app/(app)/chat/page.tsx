"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  ChevronLeft, Send, Users, MessageCircle, Check, CheckCheck,
  CornerDownLeft, X, ChevronDown, Paperclip, FileText,
  Search, Pin, Trash2, Edit2, BarChart2, Plus, Hash, Trophy, ChevronRight,
} from "lucide-react";

/* ── Types ─────────────────────────────────────────────────────────────────── */
interface PollOption { id: string; label: string; }
interface PollData {
  question: string;
  options: PollOption[];
  votes: Record<string, string[]>;
}

interface Msg {
  id: string;
  sender_id: string;
  sender_name: string;
  sender_avatar_url?: string | null;
  content: string;
  created_at: string;
  edited_at: string | null;
  deleted_at: string | null;
  reply_to_id: string | null;
  reply_to_content?: string;
  reply_to_sender?: string;
  read_by: string[];
  attachment_url: string | null;
  reactions: Record<string, string[]>;
  is_pinned: boolean;
  poll: PollData | null;
}

interface Conv {
  id: string | null;
  name: string;
  avatar_url?: string | null;
  type: "general" | "direct" | "ranking";
  last_message: string;
  last_at: string;
  unread: number;
}

interface Member { id: string; name: string; role: string; avatar_url?: string | null; }

/* ── Utils ──────────────────────────────────────────────────────────────────── */
function initials(name: string) {
  return name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
}
function fmtTime(iso: string) {
  if (!iso) return "";
  const d = new Date(iso), now = new Date(), diff = now.getTime() - d.getTime();
  if (diff < 60_000) return "maintenant";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}min`;
  if (d.toDateString() === now.toDateString()) return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}
function fmtMsgTime(iso: string) {
  return new Date(iso).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}
function dateSeparatorLabel(iso: string) {
  const d = new Date(iso), now = new Date(), yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (d.toDateString() === now.toDateString()) return "Aujourd'hui";
  if (d.toDateString() === yesterday.toDateString()) return "Hier";
  return d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
}
function sameDay(a: string, b: string) { return new Date(a).toDateString() === new Date(b).toDateString(); }
function avatarColor(name: string) {
  const hues = [210, 280, 340, 30, 160, 50, 190];
  const idx = (name.charCodeAt(0) + (name.charCodeAt(1) || 0)) % hues.length;
  return `hsl(${hues[idx]},55%,40%)`;
}

const QUICK_EMOJIS = ["👍", "❤️", "😂", "🔥", "👀", "✅"];

/* ── Avatar ─────────────────────────────────────────────────────────────────── */
function Avatar({ name, size = 36, online, avatarUrl }: { name: string; size?: number; online?: boolean; avatarUrl?: string | null }) {
  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      {avatarUrl ? (
        <img src={avatarUrl} alt={name} className="rounded-full w-full h-full object-cover" />
      ) : (
        <div className="rounded-full flex items-center justify-center w-full h-full font-bold text-white"
          style={{ background: avatarColor(name), fontSize: size * 0.38, letterSpacing: "-0.02em" }}>
          {initials(name)}
        </div>
      )}
      {online && (
        <div className="absolute bottom-0 right-0 rounded-full border-2"
          style={{ width: size * 0.3, height: size * 0.3, background: "#22c55e", borderColor: "var(--background)" }} />
      )}
    </div>
  );
}

/* ── Read receipt ────────────────────────────────────────────────────────────── */
function Receipt({ msg, myId, memberCount }: { msg: Msg; myId: string; memberCount: number }) {
  if (msg.sender_id !== myId) return null;
  const readers = (msg.read_by ?? []).filter(id => id !== myId).length;
  const allRead = readers >= memberCount - 1;
  if (allRead) return <CheckCheck size={12} style={{ color: "rgba(255,255,255,0.9)", flexShrink: 0 }} />;
  if (readers > 0) return <CheckCheck size={12} style={{ color: "rgba(255,255,255,0.5)", flexShrink: 0 }} />;
  return <Check size={12} style={{ color: "rgba(255,255,255,0.5)", flexShrink: 0 }} />;
}

/* ── Reply preview (input bar) ──────────────────────────────────────────────── */
function ReplyPreview({ msg, onCancel }: { msg: Msg; onCancel: () => void }) {
  return (
    <div className="flex items-center gap-3 px-4 py-2.5 flex-shrink-0"
      style={{ background: "var(--background-elev)", borderTop: "1px solid var(--border-soft)" }}>
      <div className="w-0.5 rounded-full self-stretch" style={{ background: "var(--accent)" }} />
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-semibold mb-0.5" style={{ color: "var(--accent)" }}>{msg.sender_name}</p>
        <p className="text-[11px] truncate" style={{ color: "var(--foreground-dim)" }}>{msg.content || "📎 Fichier"}</p>
      </div>
      <button onClick={onCancel} className="p-1 rounded-full" style={{ background: "var(--background)" }}>
        <X size={13} style={{ color: "var(--foreground-dim)" }} />
      </button>
    </div>
  );
}

/* ── Quoted reply in bubble ─────────────────────────────────────────────────── */
function QuotedBubble({ content, sender, isMe }: { content: string; sender: string; isMe: boolean }) {
  return (
    <div className="rounded-xl px-3 py-2 mb-2 flex gap-2"
      style={{ background: isMe ? "rgba(0,0,0,0.15)" : "rgba(6,182,212,0.06)", borderLeft: `3px solid ${isMe ? "rgba(255,255,255,0.4)" : "var(--accent)"}` }}>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-bold mb-0.5" style={{ color: isMe ? "rgba(255,255,255,0.8)" : "var(--accent)" }}>{sender}</p>
        <p className="text-[11px] line-clamp-2" style={{ color: isMe ? "rgba(255,255,255,0.65)" : "var(--foreground-dim)" }}>{content || "📎 Fichier"}</p>
      </div>
    </div>
  );
}

/* ── Date separator ─────────────────────────────────────────────────────────── */
function DateSep({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 my-4">
      <div className="flex-1 h-px" style={{ background: "var(--border-soft)" }} />
      <span className="text-[10px] font-semibold px-3 py-1 rounded-full flex-shrink-0 uppercase tracking-wide"
        style={{ color: "var(--foreground-dim)", background: "var(--background-elev)", border: "1px solid var(--border-soft)" }}>
        {label}
      </span>
      <div className="flex-1 h-px" style={{ background: "var(--border-soft)" }} />
    </div>
  );
}

/* ── Attachment ─────────────────────────────────────────────────────────────── */
function AttachmentView({ url, isMe }: { url: string; isMe: boolean }) {
  const isImage = /\.(jpe?g|png|gif|webp)(\?|$)/i.test(url);
  const filename = decodeURIComponent(url.split("/").pop()?.split("?")[0] ?? "fichier");
  if (isImage) {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" className="block">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={url} alt="Photo" className="w-full object-cover" style={{ maxHeight: 220, display: "block" }}
          onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
      </a>
    );
  }
  return (
    <a href={url} target="_blank" rel="noopener noreferrer"
      className="flex items-center gap-2.5 px-3 py-2.5"
      style={{ color: isMe ? "rgba(255,255,255,0.9)" : "var(--foreground)", textDecoration: "none" }}>
      <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: isMe ? "rgba(255,255,255,0.15)" : "rgba(6,182,212,0.1)" }}>
        <FileText size={17} style={{ color: isMe ? "white" : "var(--accent)" }} />
      </div>
      <span className="text-[12px] font-medium underline truncate">{filename}</span>
    </a>
  );
}

/* ── Emoji picker ────────────────────────────────────────────────────────────── */
function EmojiPicker({ onPick, onClose, alignRight }: { onPick: (e: string) => void; onClose: () => void; alignRight?: boolean }) {
  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="absolute bottom-full mb-2 z-50 flex gap-1 p-2 rounded-2xl shadow-xl"
        style={{
          background: "var(--background)",
          border: "1px solid var(--border)",
          boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
          ...(alignRight ? { right: 0 } : { left: 0 }),
        }}>
        {QUICK_EMOJIS.map(e => (
          <button key={e} onClick={() => { onPick(e); onClose(); }}
            className="w-9 h-9 flex items-center justify-center rounded-xl text-[18px] transition-colors hover:bg-black/10">
            {e}
          </button>
        ))}
      </div>
    </>
  );
}

/* ── Reaction bar ────────────────────────────────────────────────────────────── */
function ReactionBar({ reactions, myId, onToggle }: { reactions: Record<string, string[]>; myId: string; onToggle: (e: string) => void }) {
  const entries = Object.entries(reactions).filter(([, u]) => u.length > 0);
  if (!entries.length) return null;
  return (
    <div className="flex flex-wrap gap-1 mt-1.5">
      {entries.map(([emoji, users]) => (
        <button key={emoji} onClick={() => onToggle(emoji)}
          className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[12px] transition-all"
          style={{
            background: users.includes(myId) ? "rgba(6,182,212,0.15)" : "var(--background-elev)",
            border: `1px solid ${users.includes(myId) ? "rgba(6,182,212,0.5)" : "var(--border-soft)"}`,
            transform: users.includes(myId) ? "scale(1.05)" : "scale(1)",
          }}>
          <span>{emoji}</span>
          <span className="font-semibold" style={{ color: users.includes(myId) ? "var(--accent)" : "var(--foreground-dim)" }}>{users.length}</span>
        </button>
      ))}
    </div>
  );
}

/* ── Context menu ────────────────────────────────────────────────────────────── */
function ContextMenu({ msg, myId, isManager, x, y, onClose, onReply, onEdit, onDelete, onPin }: {
  msg: Msg; myId: string; isManager: boolean; x: number; y: number;
  onClose: () => void; onReply: () => void; onEdit: () => void; onDelete: () => void; onPin: () => void;
}) {
  const canEdit = msg.sender_id === myId && !msg.deleted_at && (Date.now() - new Date(msg.created_at).getTime()) < 5 * 60_000;
  const canDelete = msg.sender_id === myId || isManager;
  const [pos, setPos] = useState({ x, y });

  useEffect(() => {
    setPos({
      x: Math.min(x, window.innerWidth - 180),
      y: Math.min(y, window.innerHeight - 200),
    });
  }, [x, y]);

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="fixed z-50 rounded-2xl shadow-2xl py-1.5 min-w-[160px] overflow-hidden"
        style={{ left: pos.x, top: pos.y, background: "var(--background)", border: "1px solid var(--border)", boxShadow: "0 8px 32px rgba(0,0,0,0.25)" }}>
        {[
          { icon: CornerDownLeft, label: "Répondre", action: onReply, show: true, danger: false },
          { icon: Edit2, label: "Modifier", action: onEdit, show: canEdit, danger: false },
          { icon: Pin, label: msg.is_pinned ? "Désépingler" : "Épingler", action: onPin, show: isManager, danger: false },
          { icon: Trash2, label: "Supprimer", action: onDelete, show: canDelete, danger: true },
        ].filter(i => i.show).map((item, idx, arr) => (
          <button key={item.label} onClick={() => { item.action(); onClose(); }}
            className="flex items-center gap-3 w-full px-4 py-2.5 text-[13px] transition-colors hover:bg-black/5"
            style={{ color: item.danger ? "#ef4444" : "var(--foreground)", borderTop: idx > 0 ? "1px solid var(--border-soft)" : "none" }}>
            <item.icon size={14} style={{ opacity: 0.7 }} />
            {item.label}
          </button>
        ))}
      </div>
    </>
  );
}

/* ── Poll bubble ─────────────────────────────────────────────────────────────── */
function PollBubble({ poll, myId, isMe, onVote }: { poll: PollData; myId: string; isMe: boolean; onVote: (id: string) => void }) {
  const totalVotes = Object.values(poll.votes).reduce((s, v) => s + v.length, 0);
  const myVote = Object.entries(poll.votes).find(([, u]) => u.includes(myId))?.[0];
  return (
    <div className="flex flex-col gap-2">
      <p className="text-[13px] font-bold" style={{ color: isMe ? "white" : "var(--foreground)" }}>{poll.question}</p>
      {poll.options.map(opt => {
        const votes = poll.votes[opt.id] ?? [];
        const pct = totalVotes > 0 ? Math.round((votes.length / totalVotes) * 100) : 0;
        const voted = myVote === opt.id;
        return (
          <button key={opt.id} onClick={() => onVote(opt.id)}
            className="relative rounded-xl px-3 py-2.5 text-left overflow-hidden transition-all"
            style={{ background: voted ? (isMe ? "rgba(0,0,0,0.18)" : "rgba(6,182,212,0.12)") : (isMe ? "rgba(0,0,0,0.08)" : "var(--background)"), border: `1px solid ${voted ? "rgba(6,182,212,0.5)" : "var(--border-soft)"}` }}>
            {totalVotes > 0 && <div className="absolute inset-y-0 left-0 rounded-xl" style={{ width: `${pct}%`, background: isMe ? "rgba(255,255,255,0.08)" : "rgba(6,182,212,0.06)", transition: "width 0.4s ease" }} />}
            <div className="relative flex items-center justify-between gap-2">
              <span className="text-[12px] font-medium" style={{ color: isMe ? "rgba(255,255,255,0.9)" : "var(--foreground)" }}>{opt.label}</span>
              {votes.length > 0 && <span className="text-[11px] flex-shrink-0 font-semibold" style={{ color: isMe ? "rgba(255,255,255,0.6)" : "var(--accent)" }}>{pct}%</span>}
            </div>
          </button>
        );
      })}
      <p className="text-[10px] font-medium" style={{ color: isMe ? "rgba(255,255,255,0.5)" : "var(--foreground-dim)" }}>
        {totalVotes} vote{totalVotes !== 1 ? "s" : ""}
      </p>
    </div>
  );
}

/* ── Poll creator ────────────────────────────────────────────────────────────── */
function PollCreator({ onSend, onClose }: { onSend: (p: PollData) => void; onClose: () => void }) {
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["Oui", "Non"]);
  function submit() {
    if (!question.trim() || options.filter(o => o.trim()).length < 2) return;
    onSend({ question: question.trim(), options: options.filter(o => o.trim()).map((label, i) => ({ id: String(i), label })), votes: {} });
  }
  return (
    <div className="fixed inset-0 z-50 flex items-end lg:items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}>
      <div className="w-full max-w-sm rounded-3xl p-6 flex flex-col gap-4" style={{ background: "var(--background)", border: "1px solid var(--border)", boxShadow: "0 24px 48px rgba(0,0,0,0.3)" }}>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-bold text-[16px]">Nouveau sondage</p>
            <p className="text-[11px] mt-0.5" style={{ color: "var(--foreground-dim)" }}>Posez une question à l'équipe</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full" style={{ background: "var(--background-elev)" }}>
            <X size={15} style={{ color: "var(--foreground-dim)" }} />
          </button>
        </div>
        <input value={question} onChange={e => setQuestion(e.target.value)} placeholder="Votre question…"
          className="rounded-2xl px-4 py-3 text-[13px] outline-none font-medium"
          style={{ background: "var(--background-elev)", border: "1px solid var(--border)", color: "var(--foreground)" }} />
        <div className="flex flex-col gap-2">
          {options.map((opt, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full border-2 flex-shrink-0" style={{ borderColor: "var(--border)" }} />
              <input value={opt} onChange={e => setOptions(o => o.map((x, j) => j === i ? e.target.value : x))}
                placeholder={`Option ${i + 1}`} className="flex-1 rounded-xl px-3 py-2 text-[13px] outline-none"
                style={{ background: "var(--background-elev)", border: "1px solid var(--border)", color: "var(--foreground)" }} />
              {options.length > 2 && <button onClick={() => setOptions(o => o.filter((_, j) => j !== i))}><X size={13} style={{ color: "var(--foreground-dim)" }} /></button>}
            </div>
          ))}
          {options.length < 5 && (
            <button onClick={() => setOptions(o => [...o, ""])} className="flex items-center gap-1.5 text-[12px] px-3 py-2 rounded-xl font-medium" style={{ color: "var(--accent)", background: "rgba(6,182,212,0.06)", border: "1px dashed rgba(6,182,212,0.3)" }}>
              <Plus size={13} /> Ajouter une option
            </button>
          )}
        </div>
        <button onClick={submit} disabled={!question.trim() || options.filter(o => o.trim()).length < 2}
          className="rounded-2xl py-3 text-[13px] font-bold transition-opacity"
          style={{ background: "var(--accent)", color: "white", opacity: !question.trim() ? 0.4 : 1 }}>
          Envoyer le sondage
        </button>
      </div>
    </div>
  );
}

/* ── Pinned banner ───────────────────────────────────────────────────────────── */
function PinnedBanner({ msg, onClick }: { msg: Msg; onClick: () => void }) {
  return (
    <button onClick={onClick} className="w-full flex items-center gap-3 px-4 py-2.5 text-left flex-shrink-0 transition-colors hover:bg-cyan-50/5"
      style={{ background: "rgba(6,182,212,0.05)", borderBottom: "1px solid rgba(6,182,212,0.12)" }}>
      <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "rgba(6,182,212,0.12)" }}>
        <Pin size={11} style={{ color: "var(--accent)" }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-wide mb-0.5" style={{ color: "var(--accent)" }}>Message épinglé</p>
        <p className="text-[12px] truncate" style={{ color: "var(--foreground-dim)" }}>{msg.content || "📎 Fichier"}</p>
      </div>
      <ChevronDown size={13} style={{ color: "var(--foreground-dim)", transform: "rotate(-90deg)" }} />
    </button>
  );
}

/* ── Typing indicator ────────────────────────────────────────────────────────── */
function TypingDot() {
  return (
    <div className="flex items-end gap-2 mt-1">
      <div style={{ width: 32 }} />
      <div className="px-4 py-3 rounded-2xl rounded-bl-sm flex items-center gap-1.5"
        style={{ background: "var(--background-elev)", border: "1px solid var(--border-soft)" }}>
        {[0, 1, 2].map(i => (
          <div key={i} className="w-1.5 h-1.5 rounded-full animate-bounce"
            style={{ background: "var(--foreground-dim)", animationDelay: `${i * 0.15}s`, animationDuration: "0.9s" }} />
        ))}
      </div>
    </div>
  );
}

/* ── Inline edit input ───────────────────────────────────────────────────────── */
function EditInput({ msg, onSave, onCancel, supabase }: { msg: Msg; onSave: () => void; onCancel: () => void; supabase: ReturnType<typeof createClient> }) {
  const [val, setVal] = useState(msg.content);
  async function save() {
    if (!val.trim()) return;
    await supabase.from("messages").update({ content: val.trim(), edited_at: new Date().toISOString() }).eq("id", msg.id);
    onSave();
  }
  return (
    <div className="flex items-center gap-2 mt-2">
      <input value={val} onChange={e => setVal(e.target.value)}
        onKeyDown={e => { if (e.key === "Enter") save(); if (e.key === "Escape") onCancel(); }}
        autoFocus className="flex-1 rounded-xl px-3 py-2 text-[13px] outline-none"
        style={{ background: "var(--background-elev)", border: "1px solid var(--accent)", color: "var(--foreground)" }} />
      <button onClick={save} className="text-[11px] font-bold px-2 py-1 rounded-lg" style={{ color: "var(--accent)", background: "rgba(6,182,212,0.1)" }}>OK</button>
      <button onClick={onCancel} className="text-[11px] px-2 py-1 rounded-lg" style={{ color: "var(--foreground-dim)", background: "var(--background-elev)" }}>✕</button>
    </div>
  );
}

/* ── Message bubble ──────────────────────────────────────────────────────────── */
function Bubble({ msg, isMe, showAvatar, showName, memberCount, myId, isManager, isEditing,
  onReply, onReaction, onContextMenu, onVote, onEditDone, onEditClose, onDelete, supabase }: {
  msg: Msg; isMe: boolean; showAvatar: boolean; showName: boolean;
  memberCount: number; myId: string; isManager: boolean; isEditing: boolean;
  onReply: (m: Msg) => void;
  onReaction: (id: string, emoji: string) => void;
  onContextMenu: (e: React.MouseEvent | React.TouchEvent, m: Msg) => void;
  onVote: (msgId: string, optId: string) => void;
  onEditDone: () => void;
  onEditClose: () => void;
  onDelete: (m: Msg) => void;
  supabase: ReturnType<typeof createClient>;
}) {
  const [showEmoji, setShowEmoji] = useState(false);
  const touchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  if (msg.deleted_at) {
    return (
      <div className={`flex items-center gap-2 ${isMe ? "justify-end" : "justify-start"}`}>
        {!isMe && <div style={{ width: 32 }} />}
        <p className="text-[11px] italic px-3 py-1.5 rounded-xl"
          style={{ color: "var(--foreground-dim)", background: "var(--background-elev)", border: "1px solid var(--border-soft)" }}>
          Message supprimé
        </p>
      </div>
    );
  }

  return (
    <div className={`flex items-end gap-2.5 group ${isMe ? "flex-row-reverse" : "flex-row"}`}>
      {!isMe && (
        <div style={{ width: 32, flexShrink: 0 }}>
          {showAvatar && <Avatar name={msg.sender_name} size={32} avatarUrl={msg.sender_avatar_url} />}
        </div>
      )}

      <div style={{ maxWidth: "74%", position: "relative" }}
        onDoubleClick={() => onReply(msg)}
        onContextMenu={e => { e.preventDefault(); onContextMenu(e, msg); }}
        onTouchStart={() => { touchTimer.current = setTimeout(() => onContextMenu({ touches: [{ clientX: 0, clientY: 200 }] } as any, msg), 500); }}
        onTouchEnd={() => { if (touchTimer.current) clearTimeout(touchTimer.current); }}>

        {showName && !isMe && (
          <p className="text-[11px] mb-1 ml-1 font-bold" style={{ color: avatarColor(msg.sender_name) }}>{msg.sender_name}</p>
        )}

        {/* Hover actions */}
        <div className={`absolute -top-4 ${isMe ? "left-0" : "right-0"} z-20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1`}>
          <div style={{ position: "relative" }}>
            <button onClick={() => setShowEmoji(p => !p)}
              className="w-7 h-7 flex items-center justify-center rounded-full text-[13px] transition-all hover:scale-110"
              style={{ background: "var(--background)", border: "1px solid var(--border-soft)", boxShadow: "0 2px 8px rgba(0,0,0,0.12)" }}>
              😊
            </button>
            {showEmoji && <EmojiPicker
              onPick={e => { onReaction(msg.id, e); setShowEmoji(false); }}
              onClose={() => setShowEmoji(false)}
              alignRight={!isMe}
            />}
          </div>
          <button onClick={() => onReply(msg)}
            className="w-7 h-7 flex items-center justify-center rounded-full transition-all hover:scale-110"
            style={{ background: "var(--background)", border: "1px solid var(--border-soft)", boxShadow: "0 2px 8px rgba(0,0,0,0.12)" }}>
            <CornerDownLeft size={12} style={{ color: "var(--foreground-dim)" }} />
          </button>
          {(isMe || isManager) && (
            <button onClick={() => onDelete(msg)}
              className="w-7 h-7 flex items-center justify-center rounded-full transition-all hover:scale-110"
              style={{ background: "var(--background)", border: "1px solid var(--border-soft)", boxShadow: "0 2px 8px rgba(0,0,0,0.12)" }}>
              <Trash2 size={12} style={{ color: "#ef4444" }} />
            </button>
          )}
        </div>

        <div className="rounded-2xl text-[13px] leading-relaxed overflow-hidden"
          style={{
            background: isMe
              ? "linear-gradient(135deg, var(--accent) 0%, color-mix(in srgb, var(--accent) 80%, #0ea5e9) 100%)"
              : "var(--background-elev)",
            color: isMe ? "white" : "var(--foreground)",
            border: isMe ? "none" : "1px solid var(--border-soft)",
            borderBottomRightRadius: isMe ? 6 : undefined,
            borderBottomLeftRadius: !isMe ? 6 : undefined,
            boxShadow: isMe ? "0 2px 12px rgba(6,182,212,0.25)" : "0 1px 4px rgba(0,0,0,0.06)",
          }}>

          {msg.attachment_url && <AttachmentView url={msg.attachment_url} isMe={isMe} />}
          {(msg.reply_to_content || msg.content || msg.poll) && (
            <div className="px-3.5 py-2.5">
              {msg.reply_to_content && <QuotedBubble content={msg.reply_to_content} sender={msg.reply_to_sender ?? "…"} isMe={isMe} />}
              {msg.poll
                ? <PollBubble poll={msg.poll} myId={myId} isMe={isMe} onVote={id => onVote(msg.id, id)} />
                : <span>{msg.content}{msg.edited_at && <span className="text-[9px] ml-1.5 opacity-50 font-medium">(modifié)</span>}</span>}
            </div>
          )}
        </div>

        {isEditing && <EditInput msg={msg} supabase={supabase} onSave={() => { onEditClose(); onEditDone(); }} onCancel={onEditClose} />}

        <ReactionBar reactions={msg.reactions} myId={myId} onToggle={e => onReaction(msg.id, e)} />

        <div className={`flex items-center gap-1.5 mt-1 ${isMe ? "justify-end mr-1" : "ml-1"}`}>
          <span suppressHydrationWarning className="text-[10px]" style={{ color: "var(--foreground-dim)" }}>{fmtMsgTime(msg.created_at)}</span>
          <Receipt msg={msg} myId={myId} memberCount={memberCount} />
        </div>
      </div>
    </div>
  );
}

/* ── Detection Bubble ───────────────────────────────────────────────────────── */
type DetectionState = {
  msgId: string;
  status: "analyzing" | "detected" | "confirmed" | "dismissed";
  data?: {
    request_type: string;
    dates: string[];
    time: string | null;
    reason: string | null;
    summary: string;
  };
};

const REQ_TYPE_LABELS: Record<string, string> = {
  leave: "Congé",
  unavailability: "Indisponibilité",
  late: "Retard",
  early_leave: "Départ anticipé",
  shift_swap: "Échange de service",
  other: "Demande",
};

const REQ_TYPE_OPTIONS = [
  { value: "leave", label: "Congé" },
  { value: "unavailability", label: "Indisponibilité" },
  { value: "late", label: "Retard" },
  { value: "early_leave", label: "Départ anticipé" },
  { value: "shift_swap", label: "Échange de service" },
  { value: "other", label: "Autre" },
];

function DetectionBubble({ detection, onConfirm, onDismiss }: {
  detection: DetectionState;
  onConfirm: (data: NonNullable<DetectionState['data']>) => Promise<void>;
  onDismiss: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [editType, setEditType] = useState(detection.data?.request_type ?? "other");
  const [editDates, setEditDates] = useState((detection.data?.dates ?? []).join(", "));
  const [editReason, setEditReason] = useState(detection.data?.reason ?? "");
  const [confirming, setConfirming] = useState(false);

  if (detection.status === "dismissed") return null;

  if (detection.status === "analyzing") {
    return (
      <div className="ml-12 mb-2 flex items-center gap-2 px-3 py-2 rounded-xl w-fit"
        style={{ background: "rgba(6,182,212,0.05)", border: "1px solid rgba(6,182,212,0.15)" }}>
        <div className="flex gap-0.5">
          {[0, 1, 2].map(i => (
            <div key={i} className="w-1 h-1 rounded-full animate-bounce"
              style={{ background: "var(--accent)", animationDelay: `${i * 0.12}s` }} />
          ))}
        </div>
        <span className="text-[11px]" style={{ color: "var(--accent)" }}>Analyse en cours…</span>
      </div>
    );
  }

  if (detection.status === "confirmed") {
    return (
      <div className="ml-12 mb-2 flex items-center gap-2 px-3 py-2 rounded-xl w-fit"
        style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)" }}>
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M2 6l3 3 5-5" stroke="var(--success)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span className="text-[11px] font-semibold" style={{ color: "var(--success)" }}>
          Demande envoyée au manager
        </span>
      </div>
    );
  }

  const { data } = detection;
  if (!data) return null;

  const handleConfirm = async () => {
    setConfirming(true);
    const parsedDates = editDates.trim()
      ? editDates.split(/[,\s]+/).map(d => d.trim()).filter(d => /^\d{4}-\d{2}-\d{2}$/.test(d))
      : [];
    await onConfirm({
      request_type: editType,
      dates: parsedDates.length ? parsedDates : (data.dates ?? []),
      time: data.time ?? null,
      reason: editReason.trim() || null,
      summary: data.summary,
    });
  };

  const typeLabel = REQ_TYPE_LABELS[data.request_type] ?? "Demande";
  const datesStr = data.dates?.length
    ? data.dates.map(d => new Date(d + "T12:00:00").toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" })).join(", ")
    : null;

  return (
    <div className="ml-12 mb-3 rounded-2xl overflow-hidden w-fit max-w-[300px]"
      style={{
        background: "rgba(6,182,212,0.05)",
        border: "1px solid rgba(6,182,212,0.2)",
        borderLeft: "3px solid var(--accent)",
      }}>
      <div className="px-3 pt-3 pb-2">
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <div className="flex items-center gap-1.5">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M6 1v4M6 8v.5" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" />
              <circle cx="6" cy="6" r="5" stroke="var(--accent)" strokeWidth="1" />
            </svg>
            <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--accent)" }}>
              Demande détectée
            </span>
          </div>
          <button
            onClick={() => setEditing(e => !e)}
            className="text-[10px] font-medium px-2 py-0.5 rounded-lg transition-all"
            style={{ background: editing ? "rgba(6,182,212,0.15)" : "rgba(6,182,212,0.06)", color: "var(--accent)" }}>
            {editing ? "Annuler" : "Modifier"}
          </button>
        </div>

        {!editing ? (
          <p className="font-mono text-[12px] font-semibold" style={{ color: "var(--foreground)" }}>
            {typeLabel}{datesStr ? ` · ${datesStr}` : ""}{data.reason ? ` · ${data.reason}` : ""}
          </p>
        ) : (
          <div className="space-y-2 mt-1">
            <select
              value={editType}
              onChange={e => setEditType(e.target.value)}
              className="w-full text-[11px] rounded-lg px-2 py-1.5 outline-none"
              style={{ background: "var(--background)", border: "1px solid var(--border)", color: "var(--foreground)" }}>
              {REQ_TYPE_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <input
              type="text"
              value={editDates}
              onChange={e => setEditDates(e.target.value)}
              placeholder="Dates (AAAA-MM-JJ, ...)"
              className="w-full text-[11px] rounded-lg px-2 py-1.5 outline-none"
              style={{ background: "var(--background)", border: "1px solid var(--border)", color: "var(--foreground)" }} />
            <input
              type="text"
              value={editReason}
              onChange={e => setEditReason(e.target.value)}
              placeholder="Motif (optionnel)"
              className="w-full text-[11px] rounded-lg px-2 py-1.5 outline-none"
              style={{ background: "var(--background)", border: "1px solid var(--border)", color: "var(--foreground)" }} />
          </div>
        )}
      </div>
      <div className="flex border-t" style={{ borderColor: "rgba(6,182,212,0.15)" }}>
        <button
          onClick={handleConfirm}
          disabled={confirming}
          className="flex-1 py-2.5 text-[11px] font-bold transition-all hover:opacity-80"
          style={{ background: "rgba(6,182,212,0.08)", color: "var(--accent)", borderRight: "1px solid rgba(6,182,212,0.15)", opacity: confirming ? 0.6 : 1 }}>
          ✓ Oui, enregistre
        </button>
        <button
          onClick={onDismiss}
          className="flex-1 py-2.5 text-[11px] font-medium transition-all hover:opacity-80"
          style={{ color: "var(--foreground-dim)" }}>
          ✗ Juste un message
        </button>
      </div>
    </div>
  );
}

/* ── Thread ──────────────────────────────────────────────────────────────────── */
function Thread({ conv, myId, estId, supabase, onBack, memberCount, isManager, onlineUsers }: {
  conv: Conv; myId: string; estId: string; supabase: ReturnType<typeof createClient>;
  onBack: () => void; memberCount: number; isManager: boolean; onlineUsers: Set<string>;
}) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [replyTo, setReplyTo] = useState<Msg | null>(null);
  const [typing, setTyping] = useState(false);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [uploadPreview, setUploadPreview] = useState<{ file: File; previewUrl: string } | null>(null);
  const [contextMenu, setContextMenu] = useState<{ msg: Msg; x: number; y: number } | null>(null);
  const [editingMsgId, setEditingMsgId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [showPollCreator, setShowPollCreator] = useState(false);
  const [detection, setDetection] = useState<DetectionState | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const needsScrollRef = useRef(false);
  const msgRefs = useRef<Record<string, HTMLDivElement>>({});

  const pinnedMsg = messages.find(m => m.is_pinned && !m.deleted_at) ?? null;
  const visibleMessages = messages.filter(m => !m.deleted_at);
  const filtered = searchQuery.trim()
    ? visibleMessages.filter(m => m.content.toLowerCase().includes(searchQuery.toLowerCase()))
    : visibleMessages;

  const fetchMessages = useCallback(async () => {
    const { data: members } = await supabase
      .from("establishment_members").select("profile_id, profiles(first_name, last_name, avatar_url)")
      .eq("establishment_id", estId).eq("is_active", true);
    const map: Record<string, string> = {};
    const avatarMap: Record<string, string | null> = {};
    (members ?? []).forEach((m: any) => {
      const p = m.profiles as any;
      map[m.profile_id] = `${p?.first_name ?? ""} ${p?.last_name ?? ""}`.trim() || "Inconnu";
      avatarMap[m.profile_id] = p?.avatar_url ?? null;
    });

    let q = supabase.from("messages")
      .select("id,sender_id,content,created_at,edited_at,deleted_at,reply_to_id,read_by,attachment_url,reactions,is_pinned,poll")
      .eq("establishment_id", estId).order("created_at");
    if (conv.id === null) { q = q.is("recipient_id", null); }
    else { q = q.or(`and(sender_id.eq.${myId},recipient_id.eq.${conv.id}),and(sender_id.eq.${conv.id},recipient_id.eq.${myId})`); }

    const { data } = await q;
    const replyIds = [...new Set((data ?? []).filter((m: any) => m.reply_to_id).map((m: any) => m.reply_to_id as string))];
    let replyMap: Record<string, any> = {};
    if (replyIds.length > 0) {
      const { data: replies } = await supabase.from("messages").select("id,content,sender_id").in("id", replyIds);
      (replies ?? []).forEach((r: any) => { replyMap[r.id] = r; });
    }

    const resolved: Msg[] = (data ?? []).map((m: any) => ({
      ...m,
      sender_name: map[m.sender_id] ?? "…",
      sender_avatar_url: avatarMap[m.sender_id] ?? null,
      read_by: m.read_by ?? [],
      reactions: m.reactions ?? {},
      attachment_url: m.attachment_url ?? null,
      is_pinned: m.is_pinned ?? false,
      poll: m.poll ?? null,
      reply_to_content: m.reply_to_id ? replyMap[m.reply_to_id]?.content : undefined,
      reply_to_sender: m.reply_to_id ? map[replyMap[m.reply_to_id]?.sender_id] : undefined,
    }));
    setMessages(resolved);

    const unread = (data ?? []).filter((m: any) => m.sender_id !== myId && !(m.read_by ?? []).includes(myId));
    for (const m of unread) {
      await supabase.from("messages").update({ read_by: [...(m.read_by ?? []), myId] }).eq("id", m.id);
    }
  }, [supabase, estId, myId, conv.id]);

  const fetchMessagesRef = useRef(fetchMessages);
  useEffect(() => { fetchMessagesRef.current = fetchMessages; }, [fetchMessages]);

  const isNearBottom = useCallback(() => {
    const el = scrollRef.current;
    return !el || el.scrollHeight - el.scrollTop - el.clientHeight < 80;
  }, []);
  const scrollToBottom = useCallback((smooth = true) => {
    bottomRef.current?.scrollIntoView({ behavior: smooth ? "smooth" : "instant" });
  }, []);

  useEffect(() => {
    if (needsScrollRef.current) {
      needsScrollRef.current = false;
      scrollToBottom(false);
    }
  }, [messages, scrollToBottom]);

  useEffect(() => {
    needsScrollRef.current = true;
    fetchMessages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conv.id]);

  useEffect(() => {
    const channel = supabase.channel(`chat-${estId}-${conv.id ?? "general"}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, () => {
        const near = isNearBottom();
        fetchMessagesRef.current().then(() => { if (near) scrollToBottom(); });
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "messages" }, () => {
        fetchMessagesRef.current();
      })
      .on("broadcast", { event: "typing" }, (payload: any) => {
        if (payload.payload?.user_id === myId) return;
        setTyping(true);
        if (typingTimer.current) clearTimeout(typingTimer.current);
        typingTimer.current = setTimeout(() => setTyping(false), 3000);
      })
      .subscribe();
    channelRef.current = channel;
    return () => { supabase.removeChannel(channel); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [estId, conv.id, myId]);

  useEffect(() => { if (typing) scrollToBottom(); }, [typing, scrollToBottom]);

  function onInput(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setText(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
    channelRef.current?.send({ type: "broadcast", event: "typing", payload: { user_id: myId } });
  }

  async function send(pollData?: PollData) {
    const content = text.trim();
    if ((!content && !uploadPreview && !pollData) || sending) return;
    setSending(true);
    setText("");
    if (inputRef.current) inputRef.current.style.height = "auto";

    let attachment_url: string | null = null;
    if (uploadPreview) {
      const file = uploadPreview.file;
      const ext = file.name.split(".").pop();
      const path = `${estId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { data: upData } = await supabase.storage.from("chat-media").upload(path, file);
      if (upData) {
        const { data: urlData } = supabase.storage.from("chat-media").getPublicUrl(path);
        attachment_url = urlData.publicUrl;
      }
      URL.revokeObjectURL(uploadPreview.previewUrl);
      setUploadPreview(null);
    }

    const payload: any = { establishment_id: estId, sender_id: myId, recipient_id: conv.id ?? null, content, read_by: [myId], attachment_url };
    if (replyTo) payload.reply_to_id = replyTo.id;
    if (pollData) payload.poll = pollData;
    setReplyTo(null);
    const { data: inserted } = await supabase.from("messages").insert(payload).select("id").single();
    await fetchMessages();
    scrollToBottom(false);

    // AI request detection — only for employee, text-only, general channel
    if (!isManager && content && !pollData && inserted?.id) {
      const newMsgId = inserted.id as string;
      setDetection({ msgId: newMsgId, status: "analyzing" });
      fetch("/api/requests/analyze-message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message_id: newMsgId,
          message_content: content,
          establishment_id: estId,
          sent_at: new Date().toISOString(),
        }),
      })
        .then(r => r.json())
        .then(result => {
          if (result.is_request) {
            setDetection({ msgId: newMsgId, status: "detected", data: result });
          } else {
            setDetection(null);
          }
        })
        .catch(() => setDetection(null));
    }

    const senderName = (await supabase.from("profiles").select("first_name,last_name").eq("id", myId).maybeSingle()).data;
    const senderDisplay = senderName ? `${senderName.first_name ?? ""} ${senderName.last_name ?? ""}`.trim() : "Nouveau message";
    const notifBody = pollData ? `📊 ${pollData.question}` : attachment_url ? "📎 Fichier" : content;
    const notifPayload: Record<string, string | undefined> = {
      establishmentId: estId,
      title: conv.id === null ? `${senderDisplay} — Général` : senderDisplay,
      body: notifBody,
      url: "/chat",
    };
    if (conv.id !== null) notifPayload.targetProfileId = conv.id;
    (notifPayload as any).senderProfileId = myId;
    fetch("/api/push/send-to-profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(notifPayload),
    }).catch(() => {});

    setSending(false);
    inputRef.current?.focus();
    scrollToBottom();
  }

  function compressImage(file: File): Promise<File> {
    return new Promise(resolve => {
      const img = new Image();
      const blobUrl = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(blobUrl);
        const MAX = 1280;
        let w = img.width, h = img.height;
        if (w > MAX || h > MAX) {
          if (w >= h) { h = Math.round(h * MAX / w); w = MAX; }
          else { w = Math.round(w * MAX / h); h = MAX; }
        }
        const canvas = document.createElement("canvas");
        canvas.width = w; canvas.height = h;
        canvas.getContext("2d")!.drawImage(img, 0, 0, w, h);
        canvas.toBlob(blob => {
          if (!blob) { resolve(file); return; }
          resolve(new File([blob], file.name.replace(/\.[^.]+$/, ".jpg"), { type: "image/jpeg" }));
        }, "image/jpeg", 0.82);
      };
      img.onerror = () => { URL.revokeObjectURL(blobUrl); resolve(file); };
      img.src = blobUrl;
    });
  }

  async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const processed = file.type.startsWith("image/") ? await compressImage(file) : file;
    setUploadPreview({ file: processed, previewUrl: URL.createObjectURL(processed) });
    e.target.value = "";
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  }

  async function toggleReaction(msgId: string, emoji: string) {
    const msg = messages.find(m => m.id === msgId);
    if (!msg) return;
    const current = { ...msg.reactions };
    const users = current[emoji] ?? [];
    const next = users.includes(myId) ? users.filter(id => id !== myId) : [...users, myId];
    if (next.length === 0) delete current[emoji]; else current[emoji] = next;
    await supabase.from("messages").update({ reactions: current }).eq("id", msgId);
  }

  async function togglePin(msg: Msg) {
    await supabase.from("messages").update({ is_pinned: !msg.is_pinned }).eq("id", msg.id);
  }

  async function deleteMsg(msg: Msg) {
    await supabase.from("messages").update({ deleted_at: new Date().toISOString() }).eq("id", msg.id);
    await fetchMessages();
  }

  async function voteOnPoll(msgId: string, optionId: string) {
    const msg = messages.find(m => m.id === msgId);
    if (!msg?.poll) return;
    const poll: PollData = { ...msg.poll, votes: {} };
    for (const opt of msg.poll.options) poll.votes[opt.id] = (msg.poll.votes[opt.id] ?? []).filter(id => id !== myId);
    const wasVoted = (msg.poll.votes[optionId] ?? []).includes(myId);
    if (!wasVoted) poll.votes[optionId] = [...(poll.votes[optionId] ?? []), myId];
    await supabase.from("messages").update({ poll }).eq("id", msgId);
  }

  function openContextMenu(e: React.MouseEvent | React.TouchEvent, msg: Msg) {
    let x = 100, y = 200;
    if ("clientX" in e) { x = e.clientX; y = e.clientY; }
    else if (e.touches?.[0]) { x = e.touches[0].clientX; y = e.touches[0].clientY; }
    setContextMenu({ msg, x, y });
  }

  function isGroupStart(i: number) {
    if (i === 0) return true;
    return filtered[i - 1].sender_id !== filtered[i].sender_id || !sameDay(filtered[i - 1].created_at, filtered[i].created_at);
  }

  const isOnline = conv.id ? onlineUsers.has(conv.id) : false;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 flex-shrink-0"
        style={{ borderBottom: "1px solid var(--border-soft)", background: "var(--background)", backdropFilter: "blur(12px)" }}>
        <button onClick={onBack} className="lg:hidden p-2 rounded-xl -ml-1 transition-colors hover:bg-black/5" style={{ color: "var(--foreground-dim)" }}>
          <ChevronLeft size={20} />
        </button>
        <div style={{ position: "relative" }}>
          {conv.id === null
            ? <div className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: "linear-gradient(135deg, rgba(6,182,212,0.2), rgba(6,182,212,0.08))", border: "1px solid rgba(6,182,212,0.25)" }}>
                <Hash size={18} style={{ color: "var(--accent)" }} />
              </div>
            : <Avatar name={conv.name} size={40} online={isOnline} avatarUrl={conv.avatar_url} />
          }
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[15px] font-bold" style={{ color: "var(--foreground)" }}>{conv.name}</p>
          {conv.id === null
            ? <p className="text-[11px]" style={{ color: "var(--foreground-dim)" }}>Toute l'équipe</p>
            : isOnline
              ? <p className="text-[11px] font-semibold flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />En ligne</p>
              : null
          }
        </div>
        <button onClick={() => { setShowSearch(s => !s); setSearchQuery(""); }}
          className="p-2 rounded-xl transition-all"
          style={{ color: showSearch ? "var(--accent)" : "var(--foreground-dim)", background: showSearch ? "rgba(6,182,212,0.1)" : "transparent" }}>
          <Search size={17} />
        </button>
      </div>

      {/* Search */}
      {showSearch && (
        <div className="px-4 py-3 flex-shrink-0" style={{ borderBottom: "1px solid var(--border-soft)", background: "var(--background-elev)" }}>
          <div className="flex items-center gap-2 rounded-2xl px-3 py-2" style={{ background: "var(--background)", border: "1px solid var(--border)" }}>
            <Search size={14} style={{ color: "var(--foreground-dim)", flexShrink: 0 }} />
            <input autoFocus value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              placeholder="Rechercher dans la conversation…"
              className="flex-1 text-[13px] outline-none bg-transparent"
              style={{ color: "var(--foreground)" }} />
            {searchQuery && <button onClick={() => setSearchQuery("")}><X size={13} style={{ color: "var(--foreground-dim)" }} /></button>}
          </div>
          {searchQuery && <p className="text-[10px] mt-2 font-medium" style={{ color: "var(--foreground-dim)" }}>{filtered.length} résultat{filtered.length !== 1 ? "s" : ""}</p>}
        </div>
      )}

      {/* Pinned */}
      {pinnedMsg && <PinnedBanner msg={pinnedMsg} onClick={() => msgRefs.current[pinnedMsg.id]?.scrollIntoView({ behavior: "smooth", block: "center" })} />}

      {/* Messages */}
      <div ref={scrollRef} onScroll={() => setShowScrollBtn(!isNearBottom())} className="flex-1 overflow-y-auto overflow-x-hidden px-4 py-4"
        style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center flex-1 gap-3 opacity-30">
            <div className="w-16 h-16 rounded-3xl flex items-center justify-center" style={{ background: "var(--background-elev)" }}>
              <MessageCircle size={28} style={{ color: "var(--foreground-dim)" }} />
            </div>
            <p className="text-[12px] font-medium" style={{ color: "var(--foreground-dim)" }}>
              {searchQuery ? "Aucun résultat" : "Aucun message pour l'instant"}
            </p>
          </div>
        )}
        {filtered.map((msg, i) => {
          const showSep = i === 0 || !sameDay(filtered[i - 1].created_at, msg.created_at);
          const groupStart = isGroupStart(i);
          const hasDetection = detection?.msgId === msg.id && detection.status !== "dismissed";
          return (
            <div key={msg.id} ref={el => { if (el) msgRefs.current[msg.id] = el; }} style={{ marginTop: groupStart && i > 0 ? 10 : 2 }}>
              {showSep && <DateSep label={dateSeparatorLabel(msg.created_at)} />}
              <Bubble
                msg={msg} isMe={msg.sender_id === myId}
                showAvatar={groupStart && msg.sender_id !== myId}
                showName={groupStart && msg.sender_id !== myId && conv.id === null}
                memberCount={memberCount} myId={myId} isManager={isManager}
                isEditing={editingMsgId === msg.id}
                onReply={setReplyTo}
                onReaction={toggleReaction}
                onContextMenu={openContextMenu}
                onVote={voteOnPoll}
                onEditDone={fetchMessages}
                onEditClose={() => setEditingMsgId(null)}
                onDelete={deleteMsg}
                supabase={supabase}
              />
              {hasDetection && detection && (
                <DetectionBubble
                  detection={detection}
                  onConfirm={async (editedData) => {
                    const msgId = detection.msgId;
                    setDetection(d => d ? { ...d, status: "confirmed", data: editedData } : null);
                    // Optimistically hide the original message
                    setMessages(prev => prev.map(m => m.id === msgId ? { ...m, deleted_at: new Date().toISOString() } : m));
                    await (supabase.from as any)("staff_requests").insert({
                      establishment_id: estId,
                      profile_id: myId,
                      chat_message_id: msgId,
                      request_type: editedData.request_type ?? "other",
                      dates: editedData.dates?.length ? editedData.dates : null,
                      time_requested: editedData.time ?? null,
                      reason: editedData.reason ?? null,
                      summary: editedData.summary ?? msg.content.slice(0, 80),
                      original_message: msg.content,
                      status: "pending_manager",
                      confirmed_by_employee_at: new Date().toISOString(),
                    });
                    // Soft-delete the message from the chat
                    await supabase.from("messages").update({ deleted_at: new Date().toISOString() }).eq("id", msgId);
                    setTimeout(() => setDetection(null), 2000);
                  }}
                  onDismiss={() => setDetection(d => d ? { ...d, status: "dismissed" } : null)}
                />
              )}
            </div>
          );
        })}
        {typing && <TypingDot />}
        <div ref={bottomRef} />
      </div>

      {/* Scroll to bottom button */}
      {showScrollBtn && (
        <button onClick={() => scrollToBottom()} className="absolute right-4 w-10 h-10 rounded-2xl shadow-lg flex items-center justify-center transition-all hover:scale-105"
          style={{ bottom: replyTo || uploadPreview ? 130 : 80, background: "var(--background)", border: "1px solid var(--border)", boxShadow: "0 4px 16px rgba(0,0,0,0.15)" }}>
          <ChevronDown size={18} style={{ color: "var(--foreground-dim)" }} />
        </button>
      )}

      {/* Context menu */}
      {contextMenu && (
        <ContextMenu msg={contextMenu.msg} myId={myId} isManager={isManager} x={contextMenu.x} y={contextMenu.y}
          onClose={() => setContextMenu(null)}
          onReply={() => setReplyTo(contextMenu.msg)}
          onEdit={() => setEditingMsgId(contextMenu.msg.id)}
          onDelete={() => deleteMsg(contextMenu.msg)}
          onPin={() => togglePin(contextMenu.msg)} />
      )}

      {/* Poll creator */}
      {showPollCreator && <PollCreator onSend={p => { send(p); setShowPollCreator(false); }} onClose={() => setShowPollCreator(false)} />}

      {replyTo && <ReplyPreview msg={replyTo} onCancel={() => setReplyTo(null)} />}

      {uploadPreview && (
        <div className="flex items-center gap-3 px-4 py-3 flex-shrink-0" style={{ borderTop: "1px solid var(--border-soft)", background: "var(--background-elev)" }}>
          {uploadPreview.file.type.startsWith("image/")
            // eslint-disable-next-line @next/next/no-img-element
            ? <img src={uploadPreview.previewUrl} alt="preview" className="w-14 h-14 object-cover rounded-2xl" style={{ border: "2px solid var(--border)" }} />
            : <div className="w-14 h-14 rounded-2xl flex flex-col items-center justify-center gap-1" style={{ background: "rgba(6,182,212,0.08)", border: "1px solid var(--border)" }}>
                <FileText size={20} style={{ color: "var(--accent)" }} />
                <span className="text-[8px] font-bold uppercase" style={{ color: "var(--accent)" }}>PDF</span>
              </div>
          }
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-semibold truncate">{uploadPreview.file.name}</p>
            <p className="text-[10px] mt-0.5" style={{ color: "var(--foreground-dim)" }}>{(uploadPreview.file.size / 1024).toFixed(0)} ko</p>
          </div>
          <button onClick={() => { URL.revokeObjectURL(uploadPreview.previewUrl); setUploadPreview(null); }}
            className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: "var(--background)" }}>
            <X size={13} style={{ color: "var(--foreground-dim)" }} />
          </button>
        </div>
      )}

      {/* Input bar */}
      <div className="px-3 py-2 flex-shrink-0"
        style={{ borderTop: "1px solid var(--border-soft)", background: "var(--background)" }}>
        <input ref={fileRef} type="file" accept="image/*,application/pdf,video/mp4" className="hidden" onChange={onFileChange} />
        <div className="flex items-end gap-2 rounded-2xl px-3 py-2"
          style={{ background: "var(--background-elev)", border: "1px solid var(--border)" }}>
          <button onClick={() => fileRef.current?.click()} className="w-8 h-8 flex items-center justify-center rounded-xl flex-shrink-0 transition-all hover:scale-110" style={{ color: "var(--foreground-dim)" }}>
            <Paperclip size={16} />
          </button>
          <button onClick={() => setShowPollCreator(true)} className="w-8 h-8 flex items-center justify-center rounded-xl flex-shrink-0 transition-all hover:scale-110" style={{ color: "var(--foreground-dim)" }}>
            <BarChart2 size={16} />
          </button>
          <textarea ref={inputRef} value={text} onChange={onInput} onKeyDown={onKeyDown}
            placeholder="Écrire un message…" rows={1}
            className="flex-1 resize-none text-[13px] outline-none bg-transparent py-1"
            style={{ color: "var(--foreground)", maxHeight: 120, lineHeight: 1.5 }} />
          <button onClick={() => send()} disabled={(!text.trim() && !uploadPreview) || sending}
            className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-all"
            style={{
              background: (!text.trim() && !uploadPreview) ? "transparent" : "var(--accent)",
              color: (!text.trim() && !uploadPreview) ? "var(--foreground-dim)" : "white",
              transform: (!text.trim() && !uploadPreview) ? "scale(1)" : "scale(1.05)",
            }}>
            <Send size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Conversation list ───────────────────────────────────────────────────────── */
/* ── Ranking View ────────────────────────────────────────────────────────────── */
function RankingView({ estId, supabase, onBack }: {
  estId: string;
  supabase: ReturnType<typeof createClient>;
  onBack: () => void;
}) {
  const [offset, setOffset] = useState(0);
  const [entries, setEntries] = useState<{ profile_id: string; name: string; avatar_url: string | null; score: number }[]>([]);
  const [loading, setLoading] = useState(true);

  const getMonthBounds = (off: number) => {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() + off);
    const start = new Date(d.getFullYear(), d.getMonth(), 1).toISOString();
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59).toISOString();
    return { start, end, label: d.toLocaleDateString("fr-FR", { month: "long", year: "numeric" }) };
  };

  const load = useCallback(async (off: number) => {
    setLoading(true);
    const { start, end } = getMonthBounds(off);
    const [{ data: members }, { data: events }] = await Promise.all([
      supabase.from("establishment_members")
        .select("profile_id, profiles(first_name, last_name, avatar_url)")
        .eq("establishment_id", estId).eq("is_active", true),
      supabase.from("score_events")
        .select("profile_id, points")
        .eq("establishment_id", estId)
        .gte("created_at", start).lte("created_at", end),
    ]);
    const scoreMap: Record<string, number> = {};
    (events ?? []).forEach((e: any) => { scoreMap[e.profile_id] = (scoreMap[e.profile_id] ?? 0) + e.points; });
    const ranked = (members ?? [])
      .map((m: any) => {
        const p = m.profiles as any;
        return {
          profile_id: m.profile_id,
          name: `${p?.first_name ?? ""} ${p?.last_name ?? ""}`.trim() || "Inconnu",
          avatar_url: p?.avatar_url ?? null,
          score: scoreMap[m.profile_id] ?? 0,
        };
      })
      .sort((a, b) => b.score - a.score);
    setEntries(ranked);
    setLoading(false);
  }, [estId, supabase]);

  useEffect(() => { load(offset); }, [offset, load]);

  const { label } = getMonthBounds(offset);
  const BADGE_COLORS = ["#F59E0B", "#9CA3AF", "#CD7F32"];

  function avatarBg(name: string) {
    const hues = [210, 280, 340, 30, 160, 50, 190];
    return `hsl(${hues[(name.charCodeAt(0) + (name.charCodeAt(1) || 0)) % hues.length]},55%,40%)`;
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3.5 flex-shrink-0"
        style={{ borderBottom: "1px solid var(--border-soft)", background: "var(--background)" }}>
        <button onClick={onBack} className="p-1.5 rounded-xl lg:hidden" style={{ color: "var(--foreground-dim)" }}>
          <ChevronLeft size={20} />
        </button>
        <Trophy size={16} style={{ color: "#F59E0B" }} />
        <p className="text-[15px] font-bold flex-1" style={{ color: "var(--foreground)" }}>Classement</p>
      </div>

      {/* Month nav */}
      <div className="flex items-center justify-between px-4 py-3 flex-shrink-0"
        style={{ borderBottom: "1px solid var(--border-soft)", background: "var(--background-elev)" }}>
        <button onClick={() => setOffset(o => o - 1)}
          className="p-2 rounded-xl transition-all active:scale-95"
          style={{ background: "var(--background)", border: "1px solid var(--border)", color: "var(--foreground-muted)" }}>
          <ChevronLeft size={14} />
        </button>
        <p className="text-[13px] font-semibold capitalize" style={{ color: "var(--foreground)" }}>{label}</p>
        <button onClick={() => setOffset(o => Math.min(0, o + 1))}
          disabled={offset === 0}
          className="p-2 rounded-xl transition-all active:scale-95"
          style={{
            background: "var(--background)",
            border: "1px solid var(--border)",
            color: offset === 0 ? "var(--border)" : "var(--foreground-muted)",
          }}>
          <ChevronRight size={14} />
        </button>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="w-6 h-6 rounded-full border-2 animate-spin"
              style={{ borderColor: "var(--accent)", borderTopColor: "transparent" }} />
          </div>
        ) : entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 opacity-30">
            <p className="text-[13px]" style={{ color: "var(--foreground-dim)" }}>Aucun point ce mois</p>
          </div>
        ) : (
          entries.map((e, i) => {
            const badgeColor = BADGE_COLORS[i] ?? null;
            return (
              <div key={e.profile_id} className="flex items-center gap-3 px-4 py-3.5"
                style={{ borderBottom: i < entries.length - 1 ? "1px solid var(--border-soft)" : "none" }}>
                {/* Rank */}
                <div className="w-7 text-center flex-shrink-0">
                  {badgeColor
                    ? <div className="w-6 h-6 rounded-full mx-auto flex items-center justify-center text-[9px] font-black"
                        style={{ background: `${badgeColor}22`, color: badgeColor, border: `1.5px solid ${badgeColor}` }}>
                        {i + 1}
                      </div>
                    : <span className="text-[12px] font-mono" style={{ color: "var(--foreground-dim)" }}>{i + 1}</span>
                  }
                </div>
                {/* Avatar */}
                {e.avatar_url
                  ? <img src={e.avatar_url} alt={e.name} className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
                  : <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-[11px] font-bold text-white"
                      style={{ background: avatarBg(e.name) }}>
                      {e.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()}
                    </div>
                }
                {/* Name */}
                <p className="flex-1 text-[13px] font-semibold truncate" style={{ color: "var(--foreground)" }}>{e.name}</p>
                {/* Score */}
                <div className="text-right flex-shrink-0">
                  <p className="text-[16px] font-bold" style={{ color: badgeColor ?? "var(--foreground)" }}>{e.score}</p>
                  <p className="text-[8px] font-mono" style={{ color: "var(--foreground-dim)" }}>pts</p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function ConvList({ convs, selected, onSelect, onlineUsers }: {
  convs: Conv[]; selected: Conv | null;
  onSelect: (c: Conv) => void;
  onlineUsers: Set<string>;
}) {
  const [search, setSearch] = useState("");
  const filtered = search.trim()
    ? convs.filter(c => c.name.toLowerCase().includes(search.toLowerCase()))
    : convs;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-5 pt-5 pb-4 flex-shrink-0">
        <p className="text-[11px] font-bold uppercase tracking-widest mb-1" style={{ color: "var(--accent)" }}>Messages</p>
        <h1 className="text-[22px] font-bold mb-3" style={{ color: "var(--foreground)" }}>Chat équipe</h1>
        <div className="flex items-center gap-2 rounded-2xl px-3 py-2.5"
          style={{ background: "var(--background-elev)", border: "1px solid var(--border)" }}>
          <Search size={14} style={{ color: "var(--foreground-dim)", flexShrink: 0 }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher…"
            className="flex-1 text-[13px] outline-none bg-transparent"
            style={{ color: "var(--foreground)" }} />
          {search && <button onClick={() => setSearch("")}><X size={12} style={{ color: "var(--foreground-dim)" }} /></button>}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {filtered.map((conv, idx) => {
          const active = selected?.id === conv.id;
          const isOnline = conv.id ? onlineUsers.has(conv.id) : false;
          const hasUnread = conv.unread > 0;
          return (
            <button key={conv.id ?? "general"} onClick={() => onSelect(conv)}
              className="w-full flex items-center gap-3 px-4 py-3.5 text-left transition-all"
              style={{
                background: active ? "rgba(6,182,212,0.07)" : "transparent",
                borderBottom: idx < filtered.length - 1 ? "1px solid var(--border-soft)" : "none",
                borderLeft: `3px solid ${active ? "var(--accent)" : "transparent"}`,
              }}>
              {conv.type === "ranking"
                ? <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
                    style={{ background: active ? "rgba(245,158,11,0.15)" : "rgba(245,158,11,0.08)", border: `1px solid ${active ? "rgba(245,158,11,0.35)" : "rgba(245,158,11,0.15)"}` }}>
                    <Trophy size={18} style={{ color: "#F59E0B" }} />
                  </div>
                : conv.id === null
                  ? <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
                      style={{ background: active ? "rgba(6,182,212,0.15)" : "rgba(6,182,212,0.08)", border: `1px solid ${active ? "rgba(6,182,212,0.35)" : "rgba(6,182,212,0.15)"}` }}>
                      <Hash size={18} style={{ color: "var(--accent)" }} />
                    </div>
                  : <Avatar name={conv.name} size={44} online={isOnline} avatarUrl={conv.avatar_url} />
              }
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-0.5">
                  <p className="text-[13px] truncate" style={{ fontWeight: hasUnread ? 700 : 600, color: "var(--foreground)" }}>{conv.name}</p>
                  {conv.last_at && <span suppressHydrationWarning className="text-[10px] flex-shrink-0 font-medium" style={{ color: hasUnread ? "var(--accent)" : "var(--foreground-dim)" }}>{fmtTime(conv.last_at)}</span>}
                </div>
                <p className="text-[12px] truncate" style={{ color: hasUnread ? "var(--foreground)" : "var(--foreground-dim)", fontWeight: hasUnread ? 500 : 400 }}>
                  {conv.last_message || "Aucun message"}
                </p>
              </div>
              {conv.unread > 0 && (
                <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold"
                  style={{ background: "var(--accent)", color: "white" }}>
                  {conv.unread > 9 ? "9+" : conv.unread}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ── Main ────────────────────────────────────────────────────────────────────── */
export default function ChatPage() {
  const supabaseRef = useRef(createClient());
  const supabase = supabaseRef.current;

  const [myId, setMyId] = useState("");
  const [estId, setEstId] = useState("");
  const [isManager, setIsManager] = useState(false);
  const [convs, setConvs] = useState<Conv[]>([]);
  const [selected, setSelected] = useState<Conv | null>(null);
  const [loading, setLoading] = useState(true);
  const [memberCount, setMemberCount] = useState(1);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());

  const loadConvs = useCallback(async (uid: string, eid: string, manager: boolean) => {
    const { data: members } = await supabase.from("establishment_members")
      .select("profile_id, role, profiles(first_name, last_name, avatar_url)")
      .eq("establishment_id", eid).eq("is_active", true);

    const allMembers: Member[] = (members ?? []).filter((m: any) => m.profile_id !== uid).map((m: any) => {
      const p = m.profiles as any;
      const name = `${p?.first_name ?? ""} ${p?.last_name ?? ""}`.trim() || "Inconnu";
      return { id: m.profile_id, name, role: m.role, avatar_url: p?.avatar_url ?? null };
    });
    setMemberCount((members ?? []).length);

    const list: Conv[] = [];

    list.push({
      id: "__ranking__", name: "Classement", type: "ranking",
      last_message: "Classement mensuel du staff",
      last_at: "", unread: 0,
    });

    const { data: genMsgs } = await supabase.from("messages").select("content,created_at,sender_id,read_by")
      .eq("establishment_id", eid).is("recipient_id", null).order("created_at", { ascending: false }).limit(50);
    list.push({
      id: null, name: "Général", type: "general",
      last_message: (genMsgs?.[0] as any)?.content ?? "",
      last_at: (genMsgs?.[0] as any)?.created_at ?? "",
      unread: (genMsgs ?? []).filter((m: any) => m.sender_id !== uid && !(m.read_by ?? []).includes(uid)).length,
    });

    const targets = manager ? allMembers : allMembers.filter(m => m.role === "owner" || m.role === "manager");
    for (const m of targets) {
      const { data: dms } = await supabase.from("messages").select("content,created_at,sender_id,read_by")
        .eq("establishment_id", eid)
        .or(`and(sender_id.eq.${uid},recipient_id.eq.${m.id}),and(sender_id.eq.${m.id},recipient_id.eq.${uid})`)
        .order("created_at", { ascending: false }).limit(50);
      list.push({
        id: m.id, name: m.name, avatar_url: m.avatar_url ?? null, type: "direct",
        last_message: (dms?.[0] as any)?.content ?? "",
        last_at: (dms?.[0] as any)?.created_at ?? "",
        unread: (dms ?? []).filter((msg: any) => msg.sender_id !== uid && !(msg.read_by ?? []).includes(uid)).length,
      });
    }
    setConvs(list);
  }, [supabase]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || cancelled) return;
        setMyId(user.id);
        const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        const cookieMatch = typeof document !== "undefined" ? document.cookie.match(/(?:^|; )active_establishment_id=([^;]*)/) : null;
        const validActiveId = cookieMatch && uuidRe.test(cookieMatch[1]) ? cookieMatch[1] : null;
        let q = supabase.from("establishment_members").select("establishment_id, role").eq("profile_id", user.id).eq("is_active", true);
        if (validActiveId) q = q.eq("establishment_id", validActiveId);
        const { data: member } = await q.limit(1).maybeSingle();
        if (!member || cancelled) return;
        const eid = member.establishment_id;
        const manager = member.role === "owner" || member.role === "manager";
        setEstId(eid);
        setIsManager(manager);
        await loadConvs(user.id, eid, manager);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!estId || !myId) return;
    const ch = supabase.channel(`chat-list-${estId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, () => loadConvs(myId, estId, isManager))
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "messages" }, () => loadConvs(myId, estId, isManager))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [estId, myId, isManager]);

  useEffect(() => {
    if (!estId || !myId) return;
    const ch = supabase.channel(`presence-${estId}`)
      .on("presence", { event: "sync" }, () => {
        const state = ch.presenceState();
        const online = new Set(Object.values(state).flat().map((p: any) => p.user_id));
        setOnlineUsers(online);
      })
      .subscribe(async status => {
        if (status === "SUBSCRIBED") await ch.track({ user_id: myId });
      });
    return () => { supabase.removeChannel(ch); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [estId, myId]);

  function selectConv(conv: Conv) {
    setSelected(conv);
    setConvs(prev => prev.map(c => c.id === conv.id ? { ...c, unread: 0 } : c));
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 rounded-full border-2 animate-spin"
          style={{ borderColor: "var(--accent)", borderTopColor: "transparent" }} />
      </div>
    );
  }

  return (
    <div className="chat-fullscreen">
      <div className={`flex-shrink-0 ${selected ? "hidden lg:flex" : "flex"} flex-col w-full lg:w-80 xl:w-96`}
        style={{ borderRight: "1px solid var(--border-soft)" }}>
        <ConvList convs={convs} selected={selected} onSelect={selectConv} onlineUsers={onlineUsers} />
      </div>
      <div className={`flex-1 flex flex-col ${selected ? "flex" : "hidden lg:flex"} overflow-hidden`}>
        {selected?.type === "ranking"
          ? <RankingView estId={estId} supabase={supabase} onBack={() => setSelected(null)} />
          : selected
            ? <Thread conv={selected} myId={myId} estId={estId} supabase={supabase} onBack={() => setSelected(null)}
                memberCount={memberCount} isManager={isManager} onlineUsers={onlineUsers} />
            : <div className="flex-1 flex flex-col items-center justify-center gap-4 opacity-25">
                <div className="w-20 h-20 rounded-3xl flex items-center justify-center" style={{ background: "var(--background-elev)" }}>
                  <MessageCircle size={36} style={{ color: "var(--foreground-dim)" }} />
                </div>
                <div className="text-center">
                  <p className="text-[14px] font-semibold" style={{ color: "var(--foreground)" }}>Aucune conversation sélectionnée</p>
                  <p className="text-[12px] mt-1" style={{ color: "var(--foreground-dim)" }}>Choisissez une conversation à gauche</p>
                </div>
              </div>
        }
      </div>
    </div>
  );
}
