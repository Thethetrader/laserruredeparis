"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { MonoLabel } from "@/components/ui/custom/MonoLabel";
import {
  ChevronLeft, Send, Users, MessageCircle, Check, CheckCheck,
  CornerDownLeft, X, ChevronDown, Paperclip, FileText,
  Search, Pin, Trash2, Edit2, BarChart2, Plus,
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
  type: "general" | "direct";
  last_message: string;
  last_at: string;
  unread: number;
}

interface Member { id: string; name: string; role: string; }

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
  return `hsl(${(name.charCodeAt(0) * 7 + (name.charCodeAt(1) || 0) * 13) % 360},40%,32%)`;
}

const QUICK_EMOJIS = ["👍", "❤️", "😂", "🔥", "👀", "✅"];

/* ── Avatar ─────────────────────────────────────────────────────────────────── */
function Avatar({ name, size = 36, online }: { name: string; size?: number; online?: boolean }) {
  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <div className="rounded-full flex items-center justify-center w-full h-full text-white font-semibold"
        style={{ background: avatarColor(name), fontSize: size * 0.36 }}>
        {initials(name)}
      </div>
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
  if (allRead) return <CheckCheck size={11} style={{ color: "#60a5fa", flexShrink: 0 }} />;
  if (readers > 0) return <CheckCheck size={11} style={{ color: "rgba(255,255,255,0.6)", flexShrink: 0 }} />;
  return <Check size={11} style={{ color: "rgba(255,255,255,0.6)", flexShrink: 0 }} />;
}

/* ── Reply preview (input bar) ──────────────────────────────────────────────── */
function ReplyPreview({ msg, onCancel }: { msg: Msg; onCancel: () => void }) {
  return (
    <div className="flex items-center gap-2 px-4 py-2 flex-shrink-0"
      style={{ borderTop: "1px solid var(--border-soft)", background: "var(--background-elev)" }}>
      <CornerDownLeft size={13} style={{ color: "var(--accent)", flexShrink: 0 }} />
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-semibold" style={{ color: "var(--accent)" }}>{msg.sender_name}</p>
        <p className="text-[11px] truncate" style={{ color: "var(--foreground-dim)" }}>{msg.content || "📎 Fichier"}</p>
      </div>
      <button onClick={onCancel}><X size={14} style={{ color: "var(--foreground-dim)" }} /></button>
    </div>
  );
}

/* ── Quoted reply in bubble ─────────────────────────────────────────────────── */
function QuotedBubble({ content, sender, isMe }: { content: string; sender: string; isMe: boolean }) {
  return (
    <div className="rounded-lg px-2.5 py-1.5 mb-1.5"
      style={{ background: isMe ? "rgba(0,0,0,0.18)" : "rgba(6,182,212,0.08)", borderLeft: `3px solid ${isMe ? "rgba(255,255,255,0.4)" : "var(--accent)"}` }}>
      <p className="text-[10px] font-semibold mb-0.5" style={{ color: isMe ? "rgba(255,255,255,0.75)" : "var(--accent)" }}>{sender}</p>
      <p className="text-[11px] line-clamp-2" style={{ color: isMe ? "rgba(255,255,255,0.7)" : "var(--foreground-dim)" }}>{content || "📎 Fichier"}</p>
    </div>
  );
}

/* ── Date separator ─────────────────────────────────────────────────────────── */
function DateSep({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 my-3">
      <div className="flex-1 h-px" style={{ background: "var(--border-soft)" }} />
      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full flex-shrink-0"
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
        <img src={url} alt="Photo" className="w-full object-cover" style={{ maxHeight: 240, display: "block" }}
          onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
      </a>
    );
  }
  return (
    <a href={url} target="_blank" rel="noopener noreferrer"
      className="flex items-center gap-2 px-3 py-2.5"
      style={{ color: isMe ? "rgba(255,255,255,0.9)" : "var(--foreground)", textDecoration: "none" }}>
      <FileText size={18} style={{ flexShrink: 0, opacity: 0.7 }} />
      <span className="text-[12px] underline truncate">{filename}</span>
    </a>
  );
}

/* ── Emoji picker ────────────────────────────────────────────────────────────── */
function EmojiPicker({ onPick, onClose, alignRight }: { onPick: (e: string) => void; onClose: () => void; alignRight?: boolean }) {
  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="absolute bottom-full mb-1 z-50 flex gap-1 p-1.5 rounded-xl shadow-lg"
        style={{
          background: "var(--background)",
          border: "1px solid var(--border)",
          ...(alignRight ? { right: 0 } : { left: 0 }),
        }}>
        {QUICK_EMOJIS.map(e => (
          <button key={e} onClick={() => { onPick(e); onClose(); }}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-lg hover:bg-black/10 transition-colors">
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
    <div className="flex flex-wrap gap-1 mt-1">
      {entries.map(([emoji, users]) => (
        <button key={emoji} onClick={() => onToggle(emoji)}
          className="flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[11px]"
          style={{ background: users.includes(myId) ? "rgba(6,182,212,0.18)" : "var(--background-elev)", border: `1px solid ${users.includes(myId) ? "rgba(6,182,212,0.4)" : "var(--border-soft)"}` }}>
          <span>{emoji}</span>
          <span style={{ color: "var(--foreground-dim)" }}>{users.length}</span>
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
      <div className="fixed z-50 rounded-xl shadow-xl py-1 min-w-[148px]"
        style={{ left: pos.x, top: pos.y, background: "var(--background)", border: "1px solid var(--border)" }}>
        {[
          { icon: CornerDownLeft, label: "Répondre", action: onReply, show: true, danger: false },
          { icon: Edit2, label: "Modifier", action: onEdit, show: canEdit, danger: false },
          { icon: Pin, label: msg.is_pinned ? "Désépingler" : "Épingler", action: onPin, show: isManager, danger: false },
          { icon: Trash2, label: "Supprimer", action: onDelete, show: canDelete, danger: true },
        ].filter(i => i.show).map(item => (
          <button key={item.label} onClick={() => { item.action(); onClose(); }}
            className="flex items-center gap-2.5 w-full px-3 py-2 text-[13px] hover:bg-black/10 transition-colors"
            style={{ color: item.danger ? "#ef4444" : "var(--foreground)" }}>
            <item.icon size={13} />
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
      <p className="text-[13px] font-semibold" style={{ color: isMe ? "white" : "var(--foreground)" }}>{poll.question}</p>
      {poll.options.map(opt => {
        const votes = poll.votes[opt.id] ?? [];
        const pct = totalVotes > 0 ? Math.round((votes.length / totalVotes) * 100) : 0;
        const voted = myVote === opt.id;
        return (
          <button key={opt.id} onClick={() => onVote(opt.id)}
            className="relative rounded-lg px-3 py-2 text-left overflow-hidden"
            style={{ background: voted ? (isMe ? "rgba(0,0,0,0.2)" : "rgba(6,182,212,0.15)") : (isMe ? "rgba(0,0,0,0.1)" : "var(--background)"), border: `1px solid ${voted ? "rgba(6,182,212,0.5)" : "var(--border-soft)"}` }}>
            {totalVotes > 0 && <div className="absolute inset-y-0 left-0" style={{ width: `${pct}%`, background: isMe ? "rgba(0,0,0,0.08)" : "rgba(6,182,212,0.08)", transition: "width 0.3s" }} />}
            <div className="relative flex items-center justify-between gap-2">
              <span className="text-[12px]" style={{ color: isMe ? "rgba(255,255,255,0.9)" : "var(--foreground)" }}>{opt.label}</span>
              {votes.length > 0 && <span className="text-[11px] flex-shrink-0" style={{ color: isMe ? "rgba(255,255,255,0.6)" : "var(--foreground-dim)" }}>{pct}% · {votes.length}</span>}
            </div>
          </button>
        );
      })}
      <p className="text-[10px]" style={{ color: isMe ? "rgba(255,255,255,0.6)" : "var(--foreground-dim)" }}>
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
    <div className="fixed inset-0 z-50 flex items-end lg:items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)" }}>
      <div className="w-full max-w-sm rounded-2xl p-5 flex flex-col gap-4" style={{ background: "var(--background)", border: "1px solid var(--border)" }}>
        <div className="flex items-center justify-between">
          <p className="font-semibold text-[15px]">Créer un sondage</p>
          <button onClick={onClose}><X size={18} style={{ color: "var(--foreground-dim)" }} /></button>
        </div>
        <input value={question} onChange={e => setQuestion(e.target.value)} placeholder="Votre question…"
          className="rounded-xl px-3 py-2.5 text-[13px] outline-none"
          style={{ background: "var(--background-elev)", border: "1px solid var(--border)", color: "var(--foreground)" }} />
        <div className="flex flex-col gap-2">
          {options.map((opt, i) => (
            <div key={i} className="flex items-center gap-2">
              <input value={opt} onChange={e => setOptions(o => o.map((x, j) => j === i ? e.target.value : x))}
                placeholder={`Option ${i + 1}`} className="flex-1 rounded-xl px-3 py-2 text-[13px] outline-none"
                style={{ background: "var(--background-elev)", border: "1px solid var(--border)", color: "var(--foreground)" }} />
              {options.length > 2 && <button onClick={() => setOptions(o => o.filter((_, j) => j !== i))}><X size={14} style={{ color: "var(--foreground-dim)" }} /></button>}
            </div>
          ))}
          {options.length < 5 && (
            <button onClick={() => setOptions(o => [...o, ""])} className="flex items-center gap-1.5 text-[12px] px-2 py-1.5" style={{ color: "var(--accent)" }}>
              <Plus size={13} /> Ajouter une option
            </button>
          )}
        </div>
        <button onClick={submit} disabled={!question.trim() || options.filter(o => o.trim()).length < 2}
          className="rounded-xl py-2.5 text-[13px] font-semibold transition-opacity"
          style={{ background: "var(--accent)", color: "white", opacity: !question.trim() ? 0.4 : 1 }}>
          Envoyer
        </button>
      </div>
    </div>
  );
}

/* ── Pinned banner ───────────────────────────────────────────────────────────── */
function PinnedBanner({ msg, onClick }: { msg: Msg; onClick: () => void }) {
  return (
    <button onClick={onClick} className="w-full flex items-center gap-2 px-4 py-2 text-left flex-shrink-0"
      style={{ background: "rgba(6,182,212,0.06)", borderBottom: "1px solid rgba(6,182,212,0.15)" }}>
      <Pin size={12} style={{ color: "var(--accent)", flexShrink: 0 }} />
      <div className="flex-1 min-w-0">
        <p className="text-[9px] font-semibold" style={{ color: "var(--accent)" }}>Message épinglé</p>
        <p className="text-[11px] truncate" style={{ color: "var(--foreground-dim)" }}>{msg.content || "📎 Fichier"}</p>
      </div>
    </button>
  );
}

/* ── Typing indicator ────────────────────────────────────────────────────────── */
function TypingDot() {
  return (
    <div className="flex items-end gap-2">
      <div style={{ width: 28 }} />
      <div className="px-3 py-2.5 rounded-2xl rounded-bl-sm flex items-center gap-1"
        style={{ background: "var(--background-elev)", border: "1px solid var(--border-soft)" }}>
        {[0, 1, 2].map(i => <div key={i} className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: "var(--foreground-dim)", animationDelay: `${i * 0.15}s` }} />)}
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
    <div className="flex items-center gap-2 mt-1">
      <input value={val} onChange={e => setVal(e.target.value)}
        onKeyDown={e => { if (e.key === "Enter") save(); if (e.key === "Escape") onCancel(); }}
        autoFocus className="flex-1 rounded-xl px-3 py-1.5 text-[13px] outline-none"
        style={{ background: "var(--background-elev)", border: "1px solid var(--accent)", color: "var(--foreground)" }} />
      <button onClick={save} className="text-[11px] font-semibold" style={{ color: "var(--accent)" }}>OK</button>
      <button onClick={onCancel} className="text-[11px]" style={{ color: "var(--foreground-dim)" }}>✕</button>
    </div>
  );
}

/* ── Message bubble ──────────────────────────────────────────────────────────── */
function Bubble({ msg, isMe, showAvatar, showName, memberCount, myId, isManager, isEditing,
  onReply, onReaction, onContextMenu, onVote, onEditDone, onEditClose, supabase }: {
  msg: Msg; isMe: boolean; showAvatar: boolean; showName: boolean;
  memberCount: number; myId: string; isManager: boolean; isEditing: boolean;
  onReply: (m: Msg) => void;
  onReaction: (id: string, emoji: string) => void;
  onContextMenu: (e: React.MouseEvent | React.TouchEvent, m: Msg) => void;
  onVote: (msgId: string, optId: string) => void;
  onEditDone: () => void;
  onEditClose: () => void;
  supabase: ReturnType<typeof createClient>;
}) {
  const [showEmoji, setShowEmoji] = useState(false);
  const touchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  if (msg.deleted_at) {
    return (
      <div className={`flex items-center gap-2 ${isMe ? "justify-end" : "justify-start"}`} style={{ paddingLeft: !isMe && !showAvatar ? 40 : 0 }}>
        {!isMe && <div style={{ width: 28 }} />}
        <p className="text-[11px] italic px-3 py-1.5 rounded-xl"
          style={{ color: "var(--foreground-dim)", background: "var(--background-elev)", border: "1px solid var(--border-soft)" }}>
          Message supprimé
        </p>
      </div>
    );
  }

  return (
    <div className={`flex items-end gap-2 group ${isMe ? "flex-row-reverse" : "flex-row"}`}
      style={{ paddingLeft: !isMe && !showAvatar ? 40 : 0 }}>
      {!isMe && <div style={{ width: 28, flexShrink: 0 }}>{showAvatar && <Avatar name={msg.sender_name} size={28} />}</div>}

      <div style={{ maxWidth: "72%", position: "relative" }}
        onDoubleClick={() => onReply(msg)}
        onContextMenu={e => { e.preventDefault(); onContextMenu(e, msg); }}
        onTouchStart={() => { touchTimer.current = setTimeout(() => onContextMenu({ touches: [{ clientX: 0, clientY: 200 }] } as any, msg), 500); }}
        onTouchEnd={() => { if (touchTimer.current) clearTimeout(touchTimer.current); }}>

        {showName && !isMe && (
          <p className="text-[10px] mb-1 ml-1 font-semibold" style={{ color: avatarColor(msg.sender_name) }}>{msg.sender_name}</p>
        )}

        {/* Emoji shortcut button — OUTSIDE overflow:hidden bubble */}
        <div className={`absolute -top-3 ${isMe ? "left-1" : "right-1"} z-20 opacity-0 group-hover:opacity-100 transition-opacity`}
          style={{ position: "absolute" }}>
          <div style={{ position: "relative" }}>
            <button onClick={() => setShowEmoji(p => !p)}
              className="w-6 h-6 flex items-center justify-center rounded-full text-[11px]"
              style={{ background: "var(--background)", border: "1px solid var(--border-soft)", boxShadow: "0 1px 4px rgba(0,0,0,0.15)" }}>
              😊
            </button>
            {showEmoji && <EmojiPicker
              onPick={e => { onReaction(msg.id, e); setShowEmoji(false); }}
              onClose={() => setShowEmoji(false)}
              alignRight={isMe}
            />}
          </div>
        </div>

        <div className="rounded-2xl text-[13px] leading-snug overflow-hidden"
          style={{
            background: isMe ? "var(--accent)" : "var(--background-elev)",
            color: isMe ? "white" : "var(--foreground)",
            border: isMe ? "none" : "1px solid var(--border-soft)",
            borderBottomRightRadius: isMe ? 4 : undefined,
            borderBottomLeftRadius: !isMe ? 4 : undefined,
          }}>

          {msg.attachment_url && <AttachmentView url={msg.attachment_url} isMe={isMe} />}
          {(msg.reply_to_content || msg.content || msg.poll) && (
            <div className="px-3 py-2">
              {msg.reply_to_content && <QuotedBubble content={msg.reply_to_content} sender={msg.reply_to_sender ?? "…"} isMe={isMe} />}
              {msg.poll
                ? <PollBubble poll={msg.poll} myId={myId} isMe={isMe} onVote={id => onVote(msg.id, id)} />
                : <span style={{ color: isMe ? "white" : "var(--foreground)" }}>{msg.content}{msg.edited_at && <span className="text-[9px] ml-1 opacity-60">(modifié)</span>}</span>}
            </div>
          )}
        </div>

        {isEditing && <EditInput msg={msg} supabase={supabase} onSave={() => { onEditClose(); onEditDone(); }} onCancel={onEditClose} />}

        <ReactionBar reactions={msg.reactions} myId={myId} onToggle={e => onReaction(msg.id, e)} />

        <div className={`flex items-center gap-1 mt-0.5 ${isMe ? "justify-end mr-1" : "ml-1"}`}>
          <span suppressHydrationWarning className="text-[9px]" style={{ color: "var(--foreground-dim)" }}>{fmtMsgTime(msg.created_at)}</span>
          <Receipt msg={msg} myId={myId} memberCount={memberCount} />
        </div>
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

  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const msgRefs = useRef<Record<string, HTMLDivElement>>({});

  const pinnedMsg = messages.find(m => m.is_pinned && !m.deleted_at) ?? null;
  const filtered = searchQuery.trim()
    ? messages.filter(m => m.content.toLowerCase().includes(searchQuery.toLowerCase()))
    : messages;

  const fetchMessages = useCallback(async () => {
    const { data: members } = await supabase
      .from("establishment_members").select("profile_id, profiles(first_name, last_name)")
      .eq("establishment_id", estId).eq("is_active", true);
    const map: Record<string, string> = {};
    (members ?? []).forEach((m: any) => {
      const p = m.profiles as any;
      map[m.profile_id] = `${p?.first_name ?? ""} ${p?.last_name ?? ""}`.trim() || "Inconnu";
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

  // Keep a ref to fetchMessages so the subscription closure doesn't go stale
  const fetchMessagesRef = useRef(fetchMessages);
  useEffect(() => { fetchMessagesRef.current = fetchMessages; }, [fetchMessages]);

  const isNearBottom = useCallback(() => {
    const el = scrollRef.current;
    return !el || el.scrollHeight - el.scrollTop - el.clientHeight < 80;
  }, []);
  const scrollToBottom = useCallback((smooth = true) => {
    bottomRef.current?.scrollIntoView({ behavior: smooth ? "smooth" : "instant" });
  }, []);

  // Load messages when conversation changes
  useEffect(() => {
    fetchMessages().then(() => scrollToBottom(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conv.id]);

  // Realtime subscription — only recreated when the conversation changes
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
    await supabase.from("messages").insert(payload);

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

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadPreview({ file, previewUrl: URL.createObjectURL(file) });
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

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 flex-shrink-0"
        style={{ borderBottom: "1px solid var(--border-soft)", background: "var(--background)" }}>
        <button onClick={onBack} className="lg:hidden p-1.5 rounded-lg -ml-1" style={{ color: "var(--foreground-dim)" }}>
          <ChevronLeft size={20} />
        </button>
        {conv.id === null
          ? <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "rgba(6,182,212,0.12)", border: "1px solid rgba(6,182,212,0.25)" }}><Users size={16} style={{ color: "var(--accent)" }} /></div>
          : <Avatar name={conv.name} size={36} online={conv.id ? onlineUsers.has(conv.id) : false} />
        }
        <div className="flex-1 min-w-0">
          <p className="text-[14px] font-semibold" style={{ color: "var(--foreground)" }}>{conv.name}</p>
          {conv.id === null
            ? <p className="text-[10px]" style={{ color: "var(--foreground-dim)" }}>Toute l'équipe</p>
            : conv.id && onlineUsers.has(conv.id) ? <p className="text-[10px]" style={{ color: "#22c55e" }}>En ligne</p> : null
          }
        </div>
        <button onClick={() => { setShowSearch(s => !s); setSearchQuery(""); }}
          className="p-2 rounded-lg" style={{ color: showSearch ? "var(--accent)" : "var(--foreground-dim)" }}>
          <Search size={16} />
        </button>
      </div>

      {/* Search */}
      {showSearch && (
        <div className="px-4 py-2 flex-shrink-0" style={{ borderBottom: "1px solid var(--border-soft)", background: "var(--background-elev)" }}>
          <input autoFocus value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            placeholder="Rechercher dans la conversation…"
            className="w-full rounded-xl px-3 py-2 text-[13px] outline-none"
            style={{ background: "var(--background)", border: "1px solid var(--border)", color: "var(--foreground)" }} />
          {searchQuery && <p className="text-[10px] mt-1" style={{ color: "var(--foreground-dim)" }}>{filtered.length} résultat{filtered.length !== 1 ? "s" : ""}</p>}
        </div>
      )}

      {/* Pinned */}
      {pinnedMsg && <PinnedBanner msg={pinnedMsg} onClick={() => msgRefs.current[pinnedMsg.id]?.scrollIntoView({ behavior: "smooth", block: "center" })} />}

      {/* Messages */}
      <div ref={scrollRef} onScroll={() => setShowScrollBtn(!isNearBottom())} className="flex-1 overflow-y-auto px-4 py-3"
        style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center flex-1 gap-2 opacity-40">
            <MessageCircle size={28} style={{ color: "var(--foreground-dim)" }} />
            <p className="text-[12px]" style={{ color: "var(--foreground-dim)" }}>{searchQuery ? "Aucun résultat" : "Aucun message pour l'instant"}</p>
          </div>
        )}
        {filtered.map((msg, i) => {
          const showSep = i === 0 || !sameDay(filtered[i - 1].created_at, msg.created_at);
          const groupStart = isGroupStart(i);
          return (
            <div key={msg.id} ref={el => { if (el) msgRefs.current[msg.id] = el; }} style={{ marginTop: groupStart && i > 0 ? 8 : 2 }}>
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
                supabase={supabase}
              />
            </div>
          );
        })}
        {typing && <TypingDot />}
        <div ref={bottomRef} />
      </div>

      {/* Scroll to bottom button */}
      {showScrollBtn && (
        <button onClick={() => scrollToBottom()} className="absolute right-4 w-9 h-9 rounded-full shadow-lg flex items-center justify-center"
          style={{ bottom: replyTo || uploadPreview ? 120 : 72, background: "var(--background-elev)", border: "1px solid var(--border)" }}>
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
        <div className="flex items-center gap-2 px-4 py-2 flex-shrink-0" style={{ borderTop: "1px solid var(--border-soft)", background: "var(--background-elev)" }}>
          {uploadPreview.file.type.startsWith("image/")
            // eslint-disable-next-line @next/next/no-img-element
            ? <img src={uploadPreview.previewUrl} alt="preview" className="w-14 h-14 object-cover rounded-lg" />
            : <div className="flex items-center gap-2"><FileText size={20} style={{ color: "var(--accent)" }} /><span className="text-[12px] truncate max-w-[160px]">{uploadPreview.file.name}</span></div>
          }
          <button onClick={() => { URL.revokeObjectURL(uploadPreview.previewUrl); setUploadPreview(null); }} className="ml-auto"><X size={14} style={{ color: "var(--foreground-dim)" }} /></button>
        </div>
      )}

      {/* Input bar */}
      <div className="flex items-end gap-2 px-4 py-3 flex-shrink-0"
        style={{ borderTop: "1px solid var(--border-soft)", background: "var(--background)", paddingBottom: "max(12px, env(safe-area-inset-bottom))" }}>
        <input ref={fileRef} type="file" accept="image/*,application/pdf,video/mp4" className="hidden" onChange={onFileChange} />
        <button onClick={() => fileRef.current?.click()} className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "var(--background-elev)", border: "1px solid var(--border)" }}>
          <Paperclip size={15} style={{ color: "var(--foreground-dim)" }} />
        </button>
        <button onClick={() => setShowPollCreator(true)} className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "var(--background-elev)", border: "1px solid var(--border)" }}>
          <BarChart2 size={15} style={{ color: "var(--foreground-dim)" }} />
        </button>
        <textarea ref={inputRef} value={text} onChange={onInput} onKeyDown={onKeyDown}
          placeholder="Écrire un message…" rows={1}
          className="flex-1 resize-none rounded-xl px-3 py-2.5 text-[13px] outline-none"
          style={{ background: "var(--background-elev)", border: "1px solid var(--border)", color: "var(--foreground)", maxHeight: 120, lineHeight: 1.4 }} />
        <button onClick={() => send()} disabled={(!text.trim() && !uploadPreview) || sending}
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-opacity"
          style={{ background: "var(--accent)", opacity: (!text.trim() && !uploadPreview) ? 0.4 : 1 }}>
          <Send size={15} style={{ color: "white" }} />
        </button>
      </div>
    </div>
  );
}

/* ── Conversation list ───────────────────────────────────────────────────────── */
function ConvList({ convs, selected, onSelect, onlineUsers }: {
  convs: Conv[]; selected: Conv | null;
  onSelect: (c: Conv) => void;
  onlineUsers: Set<string>;
}) {
  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-4 flex-shrink-0" style={{ borderBottom: "1px solid var(--border-soft)" }}>
        <MonoLabel size="xs" className="mb-1 block">Messages</MonoLabel>
        <h1 className="text-[20px] font-semibold" style={{ color: "var(--foreground)" }}>Chat équipe</h1>
      </div>
      <div className="flex-1 overflow-y-auto">
        {convs.map(conv => {
          const active = selected?.id === conv.id;
          const isOnline = conv.id && onlineUsers.has(conv.id);
          return (
            <button key={conv.id ?? "general"} onClick={() => onSelect(conv)}
              className="w-full flex items-center gap-3 px-4 py-3.5 text-left"
              style={{ background: active ? "rgba(6,182,212,0.06)" : "transparent", borderBottom: "1px solid var(--border-soft)", borderLeft: active ? "2px solid var(--accent)" : "2px solid transparent" }}>
              {conv.id === null
                ? <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "rgba(6,182,212,0.12)", border: "1px solid rgba(6,182,212,0.25)" }}><Users size={18} style={{ color: "var(--accent)" }} /></div>
                : <Avatar name={conv.name} size={40} online={!!isOnline} />
              }
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[13px] font-semibold truncate" style={{ color: "var(--foreground)" }}>{conv.name}</p>
                  {conv.last_at && <span suppressHydrationWarning className="text-[10px] flex-shrink-0" style={{ color: "var(--foreground-dim)" }}>{fmtTime(conv.last_at)}</span>}
                </div>
                <p className="text-[11px] truncate mt-0.5" style={{ color: "var(--foreground-dim)" }}>{conv.last_message || "Aucun message"}</p>
              </div>
              {conv.unread > 0 && (
                <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold" style={{ background: "var(--accent)", color: "white" }}>
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
  // Stable supabase instance — createClient() would change every render otherwise
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
      .select("profile_id, role, profiles(first_name, last_name)")
      .eq("establishment_id", eid).eq("is_active", true);

    const allMembers: Member[] = (members ?? []).filter((m: any) => m.profile_id !== uid).map((m: any) => {
      const p = m.profiles as any;
      const name = `${p?.first_name ?? ""} ${p?.last_name ?? ""}`.trim() || "Inconnu";
      return { id: m.profile_id, name, role: m.role };
    });
    setMemberCount((members ?? []).length);

    const list: Conv[] = [];

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
        id: m.id, name: m.name, type: "direct",
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

  // Realtime conv list refresh
  useEffect(() => {
    if (!estId || !myId) return;
    const ch = supabase.channel(`chat-list-${estId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, () => loadConvs(myId, estId, isManager))
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "messages" }, () => loadConvs(myId, estId, isManager))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [estId, myId, isManager]);

  // Presence (online status)
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
    <div className="flex overflow-hidden" style={{ height: "calc(100dvh - 60px)" }}>
      <div className={`flex-shrink-0 ${selected ? "hidden lg:flex" : "flex"} flex-col w-full lg:w-80 xl:w-96`}
        style={{ borderRight: "1px solid var(--border-soft)" }}>
        <ConvList convs={convs} selected={selected} onSelect={selectConv} onlineUsers={onlineUsers} />
      </div>
      <div className={`flex-1 flex flex-col ${selected ? "flex" : "hidden lg:flex"} overflow-hidden`}>
        {selected
          ? <Thread conv={selected} myId={myId} estId={estId} supabase={supabase} onBack={() => setSelected(null)}
              memberCount={memberCount} isManager={isManager} onlineUsers={onlineUsers} />
          : <div className="flex-1 flex flex-col items-center justify-center gap-3 opacity-40">
              <MessageCircle size={40} style={{ color: "var(--foreground-dim)" }} />
              <p className="text-[13px]" style={{ color: "var(--foreground-dim)" }}>Sélectionne une conversation</p>
            </div>
        }
      </div>
    </div>
  );
}
