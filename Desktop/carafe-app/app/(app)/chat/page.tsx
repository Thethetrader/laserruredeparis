"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { MonoLabel } from "@/components/ui/custom/MonoLabel";
import {
  ChevronLeft, Send, Users, MessageCircle, Check, CheckCheck,
  CornerDownLeft, X, ChevronDown,
} from "lucide-react";

/* ── Types ─────────────────────────────────────────────────────────────────── */
interface Msg {
  id: string;
  sender_id: string;
  sender_name: string;
  content: string;
  created_at: string;
  reply_to_id: string | null;
  reply_to_content?: string;
  reply_to_sender?: string;
  read_by: string[];
}

interface Conv {
  id: string | null;
  name: string;
  type: "general" | "direct";
  last_message: string;
  last_at: string;
  unread: number;
}

interface Member {
  id: string;
  name: string;
  role: string;
}

/* ── Utils ──────────────────────────────────────────────────────────────────── */
function initials(name: string) {
  return name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
}

function fmtTime(iso: string) {
  if (!iso) return "";
  const d = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 60_000) return "maintenant";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}min`;
  if (d.toDateString() === now.toDateString()) return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

function fmtMsgTime(iso: string) {
  return new Date(iso).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

function dateSeparatorLabel(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (d.toDateString() === now.toDateString()) return "Aujourd'hui";
  if (d.toDateString() === yesterday.toDateString()) return "Hier";
  return d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
}

function sameDay(a: string, b: string) {
  return new Date(a).toDateString() === new Date(b).toDateString();
}

function avatarColor(name: string) {
  return `hsl(${(name.charCodeAt(0) * 7 + name.charCodeAt(1) * 13) % 360},40%,32%)`;
}

/* ── Avatar ─────────────────────────────────────────────────────────────────── */
function Avatar({ name, size = 36 }: { name: string; size?: number }) {
  return (
    <div
      className="rounded-full flex items-center justify-center flex-shrink-0 text-white font-semibold"
      style={{ width: size, height: size, background: avatarColor(name), fontSize: size * 0.36 }}
    >
      {initials(name)}
    </div>
  );
}

/* ── Read receipt icon ──────────────────────────────────────────────────────── */
function Receipt({ msg, myId, memberCount }: { msg: Msg; myId: string; memberCount: number }) {
  if (msg.sender_id !== myId) return null;
  const readers = (msg.read_by ?? []).filter(id => id !== myId).length;
  const allRead = readers >= memberCount - 1;
  if (allRead) return <CheckCheck size={11} style={{ color: "#3b82f6", flexShrink: 0 }} />;
  if (readers > 0) return <CheckCheck size={11} style={{ color: "var(--foreground-dim)", flexShrink: 0 }} />;
  return <Check size={11} style={{ color: "var(--foreground-dim)", flexShrink: 0 }} />;
}

/* ── Reply preview (in input) ───────────────────────────────────────────────── */
function ReplyPreview({ msg, onCancel }: { msg: Msg; onCancel: () => void }) {
  return (
    <div className="flex items-center gap-2 px-4 py-2 flex-shrink-0"
      style={{ borderTop: "1px solid var(--border-soft)", background: "var(--background-elev)" }}>
      <CornerDownLeft size={13} style={{ color: "var(--accent)", flexShrink: 0 }} />
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-semibold" style={{ color: "var(--accent)" }}>{msg.sender_name}</p>
        <p className="text-[11px] truncate" style={{ color: "var(--foreground-dim)" }}>{msg.content}</p>
      </div>
      <button onClick={onCancel} className="p-0.5">
        <X size={14} style={{ color: "var(--foreground-dim)" }} />
      </button>
    </div>
  );
}

/* ── Quoted reply bubble ────────────────────────────────────────────────────── */
function QuotedBubble({ content, sender, isMe }: { content: string; sender: string; isMe: boolean }) {
  return (
    <div className="rounded-lg px-2.5 py-1.5 mb-1.5 text-left"
      style={{
        background: isMe ? "rgba(0,0,0,0.15)" : "rgba(6,182,212,0.08)",
        borderLeft: `3px solid ${isMe ? "rgba(255,255,255,0.4)" : "var(--accent)"}`,
      }}>
      <p className="text-[10px] font-semibold mb-0.5" style={{ color: isMe ? "rgba(255,255,255,0.7)" : "var(--accent)" }}>
        {sender}
      </p>
      <p className="text-[11px] line-clamp-2" style={{ color: isMe ? "rgba(255,255,255,0.75)" : "var(--foreground-dim)" }}>
        {content}
      </p>
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

/* ── Message bubble ─────────────────────────────────────────────────────────── */
function Bubble({
  msg, isMe, showAvatar, showName, memberCount, myId, onReply,
}: {
  msg: Msg; isMe: boolean; showAvatar: boolean; showName: boolean;
  memberCount: number; myId: string;
  onReply: (m: Msg) => void;
}) {
  const [pressed, setPressed] = useState(false);

  return (
    <div
      className={`flex items-end gap-2 ${isMe ? "flex-row-reverse" : "flex-row"}`}
      style={{ paddingLeft: !isMe && !showAvatar ? 40 : 0 }}
    >
      {!isMe && (
        <div style={{ width: 28, flexShrink: 0 }}>
          {showAvatar && <Avatar name={msg.sender_name} size={28} />}
        </div>
      )}

      <div
        style={{ maxWidth: "72%" }}
        onDoubleClick={() => onReply(msg)}
        onTouchStart={() => setPressed(true)}
        onTouchEnd={() => { if (pressed) { onReply(msg); setPressed(false); } }}
      >
        {showName && !isMe && (
          <p className="text-[10px] mb-1 ml-1 font-semibold" style={{ color: avatarColor(msg.sender_name) }}>
            {msg.sender_name}
          </p>
        )}

        <div
          className="px-3 py-2 rounded-2xl text-[13px] leading-snug"
          style={{
            background: isMe ? "var(--accent)" : "var(--background-elev)",
            color: isMe ? "#0a0a09" : "var(--foreground)",
            border: isMe ? "none" : "1px solid var(--border-soft)",
            borderBottomRightRadius: isMe ? 4 : undefined,
            borderBottomLeftRadius: !isMe ? 4 : undefined,
          }}
        >
          {msg.reply_to_content && (
            <QuotedBubble
              content={msg.reply_to_content}
              sender={msg.reply_to_sender ?? "…"}
              isMe={isMe}
            />
          )}
          {msg.content}
        </div>

        <div className={`flex items-center gap-1 mt-0.5 ${isMe ? "justify-end mr-1" : "ml-1"}`}>
          <span className="text-[9px]" style={{ color: "var(--foreground-dim)" }}>
            {fmtMsgTime(msg.created_at)}
          </span>
          <Receipt msg={msg} myId={myId} memberCount={memberCount} />
        </div>
      </div>
    </div>
  );
}

/* ── Typing indicator ───────────────────────────────────────────────────────── */
function TypingDot() {
  return (
    <div className="flex items-end gap-2">
      <div style={{ width: 28 }} />
      <div className="px-3 py-2.5 rounded-2xl rounded-bl-sm flex items-center gap-1"
        style={{ background: "var(--background-elev)", border: "1px solid var(--border-soft)" }}>
        {[0, 1, 2].map(i => (
          <div key={i} className="w-1.5 h-1.5 rounded-full animate-bounce"
            style={{ background: "var(--foreground-dim)", animationDelay: `${i * 0.15}s` }} />
        ))}
      </div>
    </div>
  );
}

/* ── Thread ─────────────────────────────────────────────────────────────────── */
function Thread({
  conv, myId, estId, supabase, onBack, memberCount,
}: {
  conv: Conv; myId: string; estId: string;
  supabase: ReturnType<typeof createClient>;
  onBack: () => void;
  memberCount: number;
}) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [memberMap, setMemberMap] = useState<Record<string, string>>({});
  const [replyTo, setReplyTo] = useState<Msg | null>(null);
  const [typing, setTyping] = useState(false);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  /* fetch & mark read */
  const fetchMessages = useCallback(async () => {
    const { data: members } = await supabase
      .from("establishment_members")
      .select("profile_id, profiles(first_name, last_name)")
      .eq("establishment_id", estId)
      .eq("is_active", true);

    const map: Record<string, string> = {};
    (members ?? []).forEach((m: any) => {
      const p = m.profiles as { first_name: string | null; last_name: string | null } | null;
      map[m.profile_id] = `${p?.first_name ?? ""} ${p?.last_name ?? ""}`.trim() || "Inconnu";
    });
    setMemberMap(map);

    let q = supabase
      .from("messages")
      .select("id,sender_id,content,created_at,reply_to_id,read_by")
      .eq("establishment_id", estId)
      .order("created_at");

    if (conv.id === null) {
      q = q.is("recipient_id", null);
    } else {
      q = q.or(
        `and(sender_id.eq.${myId},recipient_id.eq.${conv.id}),and(sender_id.eq.${conv.id},recipient_id.eq.${myId})`
      );
    }

    const { data } = await q;
    const rawMsgs: Msg[] = (data ?? []).map((m: any) => ({
      ...m,
      sender_name: map[m.sender_id] ?? "…",
      read_by: m.read_by ?? [],
    }));

    // Resolve reply_to content
    const replyIds = [...new Set(rawMsgs.filter(m => m.reply_to_id).map(m => m.reply_to_id as string))];
    let replyMap: Record<string, { content: string; sender_id: string }> = {};
    if (replyIds.length > 0) {
      const { data: replies } = await supabase
        .from("messages")
        .select("id,content,sender_id")
        .in("id", replyIds);
      (replies ?? []).forEach((r: any) => { replyMap[r.id] = r; });
    }

    const resolved = rawMsgs.map(m => ({
      ...m,
      reply_to_content: m.reply_to_id ? replyMap[m.reply_to_id]?.content : undefined,
      reply_to_sender: m.reply_to_id ? map[replyMap[m.reply_to_id]?.sender_id] : undefined,
    }));

    setMessages(resolved);

    // Mark unread messages as read (add myId to read_by)
    const unread = (data ?? []).filter(
      (m: any) => m.sender_id !== myId && !(m.read_by ?? []).includes(myId)
    );
    for (const m of unread) {
      await supabase
        .from("messages")
        .update({ read_by: [...(m.read_by ?? []), myId] })
        .eq("id", m.id);
    }
  }, [supabase, estId, myId, conv.id]);

  /* auto-scroll management */
  const isNearBottom = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return true;
    return el.scrollHeight - el.scrollTop - el.clientHeight < 80;
  }, []);

  const scrollToBottom = useCallback((smooth = true) => {
    bottomRef.current?.scrollIntoView({ behavior: smooth ? "smooth" : "instant" });
  }, []);

  useEffect(() => {
    fetchMessages().then(() => scrollToBottom(false));
  }, [conv.id]);

  useEffect(() => {
    const channel = supabase
      .channel(`chat-${estId}-${conv.id ?? "general"}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, () => {
        const wasNear = isNearBottom();
        fetchMessages().then(() => { if (wasNear) scrollToBottom(); });
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "messages" }, () => {
        fetchMessages();
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
  }, [fetchMessages, supabase, estId, conv.id, myId, isNearBottom, scrollToBottom]);

  useEffect(() => {
    if (typing) scrollToBottom();
  }, [typing, scrollToBottom]);

  function onScroll() {
    setShowScrollBtn(!isNearBottom());
  }

  /* send typing broadcast */
  function onInput(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setText(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
    channelRef.current?.send({ type: "broadcast", event: "typing", payload: { user_id: myId } });
  }

  async function send() {
    const content = text.trim();
    if (!content || sending) return;
    setSending(true);
    setText("");
    if (inputRef.current) { inputRef.current.style.height = "auto"; }
    const payload: any = {
      establishment_id: estId,
      sender_id: myId,
      recipient_id: conv.id ?? null,
      content,
      read_by: [myId],
    };
    if (replyTo) payload.reply_to_id = replyTo.id;
    setReplyTo(null);
    await supabase.from("messages").insert(payload);
    setSending(false);
    inputRef.current?.focus();
    scrollToBottom();
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  }

  /* group messages: show avatar/name only when sender changes or new day */
  function isGroupStart(i: number) {
    if (i === 0) return true;
    const prev = messages[i - 1];
    const cur = messages[i];
    return prev.sender_id !== cur.sender_id || !sameDay(prev.created_at, cur.created_at);
  }

  return (
    <div className="flex flex-col h-full relative">
      {/* Header */}
      <div
        className="flex items-center gap-3 px-4 py-3 flex-shrink-0"
        style={{ borderBottom: "1px solid var(--border-soft)", background: "var(--background)" }}
      >
        <button onClick={onBack} className="lg:hidden p-1.5 rounded-lg -ml-1" style={{ color: "var(--foreground-dim)" }}>
          <ChevronLeft size={20} />
        </button>
        {conv.id === null ? (
          <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: "rgba(6,182,212,0.12)", border: "1px solid rgba(6,182,212,0.25)" }}>
            <Users size={16} style={{ color: "var(--accent)" }} />
          </div>
        ) : (
          <Avatar name={conv.name} size={36} />
        )}
        <div>
          <p className="text-[14px] font-semibold" style={{ color: "var(--foreground)" }}>{conv.name}</p>
          {conv.id === null && (
            <p className="text-[10px]" style={{ color: "var(--foreground-dim)" }}>Toute l'équipe</p>
          )}
        </div>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        onScroll={onScroll}
        className="flex-1 overflow-y-auto px-4 py-3"
        style={{ display: "flex", flexDirection: "column", gap: 2 }}
      >
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center flex-1 gap-2 opacity-40">
            <MessageCircle size={28} style={{ color: "var(--foreground-dim)" }} />
            <p className="text-[12px]" style={{ color: "var(--foreground-dim)" }}>Aucun message pour l'instant</p>
          </div>
        )}

        {messages.map((msg, i) => {
          const showSep = i === 0 || !sameDay(messages[i - 1].created_at, msg.created_at);
          const groupStart = isGroupStart(i);
          const isMe = msg.sender_id === myId;

          return (
            <div key={msg.id} style={{ marginTop: groupStart && i > 0 ? 8 : 2 }}>
              {showSep && <DateSep label={dateSeparatorLabel(msg.created_at)} />}
              <Bubble
                msg={msg}
                isMe={isMe}
                showAvatar={groupStart && !isMe}
                showName={groupStart && !isMe && conv.id === null}
                memberCount={memberCount}
                myId={myId}
                onReply={setReplyTo}
              />
            </div>
          );
        })}

        {typing && <TypingDot />}
        <div ref={bottomRef} />
      </div>

      {/* Scroll-to-bottom button */}
      {showScrollBtn && (
        <button
          onClick={() => scrollToBottom()}
          className="absolute right-4 flex items-center justify-center w-9 h-9 rounded-full shadow-lg transition-opacity"
          style={{ bottom: replyTo ? 128 : 72, background: "var(--background-elev)", border: "1px solid var(--border)" }}
        >
          <ChevronDown size={18} style={{ color: "var(--foreground-dim)" }} />
        </button>
      )}

      {/* Reply preview */}
      {replyTo && <ReplyPreview msg={replyTo} onCancel={() => setReplyTo(null)} />}

      {/* Input */}
      <div
        className="flex items-end gap-2 px-4 py-3 flex-shrink-0"
        style={{ borderTop: "1px solid var(--border-soft)", background: "var(--background)" }}
      >
        <textarea
          ref={inputRef}
          value={text}
          onChange={onInput}
          onKeyDown={onKeyDown}
          placeholder="Écrire un message…"
          rows={1}
          className="flex-1 resize-none rounded-xl px-3 py-2.5 text-[13px] outline-none"
          style={{
            background: "var(--background-elev)",
            border: "1px solid var(--border)",
            color: "var(--foreground)",
            maxHeight: 120,
            lineHeight: 1.4,
          }}
        />
        <button
          onClick={send}
          disabled={!text.trim() || sending}
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-opacity"
          style={{ background: "var(--accent)", opacity: !text.trim() ? 0.4 : 1 }}
        >
          <Send size={15} style={{ color: "#0a0a09" }} />
        </button>
      </div>
    </div>
  );
}

/* ── Conversation list ──────────────────────────────────────────────────────── */
function ConvList({ convs, selected, onSelect }: {
  convs: Conv[];
  selected: Conv | null;
  onSelect: (c: Conv) => void;
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
          return (
            <button
              key={conv.id ?? "general"}
              onClick={() => onSelect(conv)}
              className="w-full flex items-center gap-3 px-4 py-3.5 transition-colors text-left"
              style={{
                background: active ? "rgba(6,182,212,0.06)" : "transparent",
                borderBottom: "1px solid var(--border-soft)",
                borderLeft: active ? "2px solid var(--accent)" : "2px solid transparent",
              }}
            >
              {conv.id === null ? (
                <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: "rgba(6,182,212,0.12)", border: "1px solid rgba(6,182,212,0.25)" }}>
                  <Users size={18} style={{ color: "var(--accent)" }} />
                </div>
              ) : (
                <Avatar name={conv.name} size={40} />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[13px] font-semibold truncate" style={{ color: "var(--foreground)" }}>
                    {conv.name}
                  </p>
                  {conv.last_at && (
                    <span className="text-[10px] flex-shrink-0" style={{ color: "var(--foreground-dim)" }}>
                      {fmtTime(conv.last_at)}
                    </span>
                  )}
                </div>
                <p className="text-[11px] truncate mt-0.5" style={{ color: "var(--foreground-dim)" }}>
                  {conv.last_message || "Aucun message"}
                </p>
              </div>
              {conv.unread > 0 && (
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold"
                  style={{ background: "var(--accent)", color: "#0a0a09" }}
                >
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

/* ── Main ───────────────────────────────────────────────────────────────────── */
export default function ChatPage() {
  const supabase = createClient();
  const [myId, setMyId] = useState("");
  const [estId, setEstId] = useState("");
  const [isManager, setIsManager] = useState(false);
  const [convs, setConvs] = useState<Conv[]>([]);
  const [selected, setSelected] = useState<Conv | null>(null);
  const [loading, setLoading] = useState(true);
  const [memberCount, setMemberCount] = useState(1);

  const loadConvs = useCallback(async (uid: string, eid: string, manager: boolean) => {
    const { data: members } = await supabase
      .from("establishment_members")
      .select("profile_id, role, profiles(first_name, last_name)")
      .eq("establishment_id", eid)
      .eq("is_active", true);

    const allMembers: Member[] = (members ?? [])
      .filter((m: any) => m.profile_id !== uid)
      .map((m: any) => {
        const p = m.profiles as { first_name: string | null; last_name: string | null } | null;
        const name = `${p?.first_name ?? ""} ${p?.last_name ?? ""}`.trim() || "Inconnu";
        return { id: m.profile_id, name, role: m.role };
      });

    setMemberCount((members ?? []).length);

    const list: Conv[] = [];

    // Général
    const { data: genMsgs } = await supabase
      .from("messages")
      .select("content,created_at,sender_id,read_by")
      .eq("establishment_id", eid)
      .is("recipient_id", null)
      .order("created_at", { ascending: false })
      .limit(50);

    const genUnread = (genMsgs ?? []).filter(
      (m: any) => m.sender_id !== uid && !(m.read_by ?? []).includes(uid)
    ).length;

    list.push({
      id: null,
      name: "Général",
      type: "general",
      last_message: (genMsgs?.[0] as any)?.content ?? "",
      last_at: (genMsgs?.[0] as any)?.created_at ?? "",
      unread: genUnread,
    });

    // Direct convs — managers see all members, employees see only managers
    const targets = manager
      ? allMembers
      : allMembers.filter(m => m.role === "owner" || m.role === "manager");

    for (const m of targets) {
      const { data: dmMsgs } = await supabase
        .from("messages")
        .select("content,created_at,sender_id,read_by")
        .eq("establishment_id", eid)
        .or(
          `and(sender_id.eq.${uid},recipient_id.eq.${m.id}),and(sender_id.eq.${m.id},recipient_id.eq.${uid})`
        )
        .order("created_at", { ascending: false })
        .limit(50);

      const dmUnread = (dmMsgs ?? []).filter(
        (msg: any) => msg.sender_id !== uid && !(msg.read_by ?? []).includes(uid)
      ).length;

      list.push({
        id: m.id,
        name: m.name,
        type: "direct",
        last_message: (dmMsgs?.[0] as any)?.content ?? "",
        last_at: (dmMsgs?.[0] as any)?.created_at ?? "",
        unread: dmUnread,
      });
    }

    setConvs(list);
  }, [supabase]);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setMyId(user.id);
      const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      const cookieMatch =
        typeof document !== "undefined"
          ? document.cookie.match(/(?:^|; )active_establishment_id=([^;]*)/)
          : null;
      const validActiveId =
        cookieMatch && uuidRe.test(cookieMatch[1]) ? cookieMatch[1] : null;
      let q = supabase
        .from("establishment_members")
        .select("establishment_id, role")
        .eq("profile_id", user.id)
        .eq("is_active", true);
      if (validActiveId) q = q.eq("establishment_id", validActiveId);
      const { data: member } = await q.limit(1).maybeSingle();
      if (!member) { setLoading(false); return; }
      const eid = member.establishment_id;
      const manager = member.role === "owner" || member.role === "manager";
      setEstId(eid);
      setIsManager(manager);
      await loadConvs(user.id, eid, manager);
      setLoading(false);
    })();
  }, [supabase, loadConvs]);

  useEffect(() => {
    if (!estId || !myId) return;
    const ch = supabase
      .channel(`chat-list-${estId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, () => {
        loadConvs(myId, estId, isManager);
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "messages" }, () => {
        loadConvs(myId, estId, isManager);
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [estId, myId, isManager, loadConvs, supabase]);

  function selectConv(conv: Conv) {
    setSelected(conv);
    // optimistically clear unread badge
    setConvs(prev => prev.map(c => (c.id === conv.id ? { ...c, unread: 0 } : c)));
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div
          className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
          style={{ borderColor: "var(--accent)", borderTopColor: "transparent" }}
        />
      </div>
    );
  }

  return (
    <div className="h-[calc(100dvh-64px)] lg:h-[calc(100dvh-0px)] flex overflow-hidden">
      {/* Left: conversation list */}
      <div
        className={`flex-shrink-0 ${selected ? "hidden lg:flex" : "flex"} flex-col w-full lg:w-80 xl:w-96`}
        style={{ borderRight: "1px solid var(--border-soft)" }}
      >
        <ConvList convs={convs} selected={selected} onSelect={selectConv} />
      </div>

      {/* Right: thread */}
      <div className={`flex-1 flex flex-col ${selected ? "flex" : "hidden lg:flex"}`}>
        {selected ? (
          <Thread
            conv={selected}
            myId={myId}
            estId={estId}
            supabase={supabase}
            onBack={() => setSelected(null)}
            memberCount={memberCount}
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 opacity-40">
            <MessageCircle size={40} style={{ color: "var(--foreground-dim)" }} />
            <p className="text-[13px]" style={{ color: "var(--foreground-dim)" }}>
              Sélectionne une conversation
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
