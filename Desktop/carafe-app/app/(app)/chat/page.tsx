"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { MonoLabel } from "@/components/ui/custom/MonoLabel";
import { ChevronLeft, Send, Users, MessageCircle, Check, CheckCheck } from "lucide-react";

interface Msg {
  id: string;
  sender_id: string;
  sender_name: string;
  content: string;
  created_at: string;
}

interface Conv {
  id: string | null; // null = général
  name: string;
  initials: string;
  type: "general" | "direct";
  last_message: string;
  last_at: string;
  unread: number;
}

interface Member {
  id: string;
  name: string;
  initials: string;
  role: string;
}

function fmtTime(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 60_000) return "maintenant";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}min`;
  if (d.toDateString() === now.toDateString()) return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

function initials(name: string) {
  return name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
}

function Avatar({ name, size = 36, color }: { name: string; size?: number; color?: string }) {
  const bg = color ?? `hsl(${name.charCodeAt(0) * 7 % 360},45%,35%)`;
  return (
    <div className="rounded-full flex items-center justify-center flex-shrink-0 text-white font-semibold"
      style={{ width: size, height: size, background: bg, fontSize: size * 0.36 }}>
      {initials(name)}
    </div>
  );
}

/* ── Message bubble ─────────────────────────────────────────────────────────── */
function Bubble({ msg, isMe }: { msg: Msg; isMe: boolean }) {
  return (
    <div className={`flex items-end gap-2 ${isMe ? "flex-row-reverse" : "flex-row"}`}>
      {!isMe && <Avatar name={msg.sender_name} size={28} />}
      <div style={{ maxWidth: "72%" }}>
        {!isMe && <p className="text-[10px] mb-1 ml-1" style={{ color: "var(--foreground-dim)" }}>{msg.sender_name}</p>}
        <div className="px-3 py-2 rounded-2xl text-[13px] leading-snug"
          style={{
            background: isMe ? "var(--accent)" : "var(--background-elev)",
            color: isMe ? "#0a0a09" : "var(--foreground)",
            border: isMe ? "none" : "1px solid var(--border-soft)",
            borderBottomRightRadius: isMe ? 4 : undefined,
            borderBottomLeftRadius: !isMe ? 4 : undefined,
          }}>
          {msg.content}
        </div>
        <p className={`text-[9px] mt-0.5 ${isMe ? "text-right mr-1" : "ml-1"}`}
          style={{ color: "var(--foreground-dim)" }}>
          {fmtTime(msg.created_at)}
        </p>
      </div>
    </div>
  );
}

/* ── Thread ─────────────────────────────────────────────────────────────────── */
function Thread({
  conv, myId, estId, supabase, onBack,
}: {
  conv: Conv; myId: string; estId: string;
  supabase: ReturnType<typeof createClient>;
  onBack: () => void;
}) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [memberMap, setMemberMap] = useState<Record<string, string>>({});
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

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

    let q = supabase.from("messages").select("id,sender_id,content,created_at").eq("establishment_id", estId).order("created_at");
    if (conv.id === null) {
      q = q.is("recipient_id", null);
    } else {
      q = q.or(`and(sender_id.eq.${myId},recipient_id.eq.${conv.id}),and(sender_id.eq.${conv.id},recipient_id.eq.${myId})`);
    }
    const { data } = await q;
    setMessages((data ?? []).map((m: any) => ({ ...m, sender_name: map[m.sender_id] ?? "…" })));
  }, [supabase, estId, myId, conv.id]);

  useEffect(() => {
    fetchMessages();
    const channel = supabase.channel(`chat-${estId}-${conv.id ?? "general"}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, () => fetchMessages())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchMessages, supabase, estId, conv.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send() {
    const content = text.trim();
    if (!content || sending) return;
    setSending(true);
    setText("");
    await supabase.from("messages").insert({
      establishment_id: estId,
      sender_id: myId,
      recipient_id: conv.id ?? null,
      content,
    });
    setSending(false);
    inputRef.current?.focus();
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
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
          ? <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "rgba(6,182,212,0.12)", border: "1px solid rgba(6,182,212,0.25)" }}>
              <Users size={16} style={{ color: "var(--accent)" }} />
            </div>
          : <Avatar name={conv.name} size={36} />
        }
        <div>
          <p className="text-[14px] font-semibold" style={{ color: "var(--foreground)" }}>{conv.name}</p>
          {conv.id === null && <p className="text-[10px]" style={{ color: "var(--foreground-dim)" }}>Toute l'équipe</p>}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-32 gap-2">
            <MessageCircle size={28} style={{ color: "var(--foreground-dim)", opacity: 0.4 }} />
            <p className="text-[12px]" style={{ color: "var(--foreground-dim)" }}>Aucun message pour l'instant</p>
          </div>
        )}
        {messages.map(msg => (
          <Bubble key={msg.id} msg={msg} isMe={msg.sender_id === myId} />
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex items-end gap-2 px-4 py-3 flex-shrink-0"
        style={{ borderTop: "1px solid var(--border-soft)", background: "var(--background)" }}>
        <textarea
          ref={inputRef}
          value={text}
          onChange={e => { setText(e.target.value); e.target.style.height = "auto"; e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`; }}
          onKeyDown={onKeyDown}
          placeholder="Écrire un message…"
          rows={1}
          className="flex-1 resize-none rounded-xl px-3 py-2.5 text-[13px] outline-none"
          style={{ background: "var(--background-elev)", border: "1px solid var(--border)", color: "var(--foreground)", maxHeight: 120, lineHeight: 1.4 }}
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
  convs: Conv[]; selected: Conv | null;
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
            <button key={conv.id ?? "general"} onClick={() => onSelect(conv)}
              className="w-full flex items-center gap-3 px-4 py-3.5 transition-colors text-left"
              style={{
                background: active ? "rgba(6,182,212,0.06)" : "transparent",
                borderBottom: "1px solid var(--border-soft)",
                borderLeft: active ? "2px solid var(--accent)" : "2px solid transparent",
              }}>
              {conv.id === null
                ? <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "rgba(6,182,212,0.12)", border: "1px solid rgba(6,182,212,0.25)" }}>
                    <Users size={18} style={{ color: "var(--accent)" }} />
                  </div>
                : <Avatar name={conv.name} size={40} />
              }
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[13px] font-semibold truncate" style={{ color: "var(--foreground)" }}>{conv.name}</p>
                  {conv.last_at && <span className="text-[10px] flex-shrink-0" style={{ color: "var(--foreground-dim)" }}>{fmtTime(conv.last_at)}</span>}
                </div>
                <p className="text-[11px] truncate mt-0.5" style={{ color: "var(--foreground-dim)" }}>{conv.last_message || "Aucun message"}</p>
              </div>
              {conv.unread > 0 && (
                <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold"
                  style={{ background: "var(--accent)", color: "#0a0a09" }}>
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

  const loadConvs = useCallback(async (uid: string, eid: string, manager: boolean) => {
    // Fetch members
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
        return { id: m.profile_id, name, initials: initials(name), role: m.role };
      });

    // Build conversation list
    const list: Conv[] = [];

    // Général
    const { data: genMsgs } = await supabase
      .from("messages")
      .select("content,created_at")
      .eq("establishment_id", eid)
      .is("recipient_id", null)
      .order("created_at", { ascending: false })
      .limit(1);
    list.push({
      id: null,
      name: "Général",
      initials: "GÉ",
      type: "general",
      last_message: (genMsgs?.[0] as any)?.content ?? "",
      last_at: (genMsgs?.[0] as any)?.created_at ?? "",
      unread: 0,
    });

    // Direct convs
    const targets = manager
      ? allMembers
      : allMembers.filter(m => m.role === "owner" || m.role === "manager");

    for (const m of targets) {
      const { data: dmMsgs } = await supabase
        .from("messages")
        .select("content,created_at")
        .eq("establishment_id", eid)
        .or(`and(sender_id.eq.${uid},recipient_id.eq.${m.id}),and(sender_id.eq.${m.id},recipient_id.eq.${uid})`)
        .order("created_at", { ascending: false })
        .limit(1);
      list.push({
        id: m.id,
        name: m.name,
        initials: m.initials,
        type: "direct",
        last_message: (dmMsgs?.[0] as any)?.content ?? "",
        last_at: (dmMsgs?.[0] as any)?.created_at ?? "",
        unread: 0,
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
      const cookieMatch = typeof document !== "undefined" ? document.cookie.match(/(?:^|; )active_establishment_id=([^;]*)/) : null;
      const validActiveId = cookieMatch && uuidRe.test(cookieMatch[1]) ? cookieMatch[1] : null;
      let q = supabase.from("establishment_members").select("establishment_id, role").eq("profile_id", user.id).eq("is_active", true);
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

  // Realtime: refresh conv list on new message
  useEffect(() => {
    if (!estId || !myId) return;
    const ch = supabase.channel(`chat-list-${estId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, () => {
        loadConvs(myId, estId, isManager);
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [estId, myId, isManager, loadConvs, supabase]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "var(--accent)", borderTopColor: "transparent" }} />
      </div>
    );
  }

  return (
    /* Mobile: list or thread; Desktop: two-column */
    <div className="h-[calc(100dvh-64px)] lg:h-[calc(100dvh-0px)] flex overflow-hidden">

      {/* Left: conversation list */}
      <div className={`flex-shrink-0 ${selected ? "hidden lg:flex" : "flex"} flex-col w-full lg:w-80 xl:w-96`}
        style={{ borderRight: "1px solid var(--border-soft)" }}>
        <ConvList convs={convs} selected={selected} onSelect={setSelected} />
      </div>

      {/* Right: thread */}
      <div className={`flex-1 flex flex-col ${selected ? "flex" : "hidden lg:flex"}`}>
        {selected
          ? <Thread conv={selected} myId={myId} estId={estId} supabase={supabase} onBack={() => setSelected(null)} />
          : (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 opacity-40">
              <MessageCircle size={40} style={{ color: "var(--foreground-dim)" }} />
              <p className="text-[13px]" style={{ color: "var(--foreground-dim)" }}>Sélectionne une conversation</p>
            </div>
          )
        }
      </div>
    </div>
  );
}
