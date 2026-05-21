"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { MonoLabel } from "@/components/ui/custom/MonoLabel";
import { CalendarDays, Check, X, Minus, Plus, Users, Clock, ChevronDown, ChevronUp } from "lucide-react";
import { useDevRole } from "@/hooks/useDevRole";

const DEV_MODE = process.env.NEXT_PUBLIC_DEV_MODE === "true";
const DEV_ESTABLISHMENT_ID = "dev-establishment";
const DEV_PROFILE_ID = "dev-user";

type VoteResponse = "yes" | "no" | "maybe";
type PollStatus = "open" | "closed";

interface Poll {
  id: string;
  establishment_id: string;
  created_by: string;
  title: string;
  description: string | null;
  proposed_date: string;
  proposed_time: string;
  status: PollStatus;
  created_at: string;
}

interface PollVote {
  id: string;
  poll_id: string;
  voter_id: string;
  response: VoteResponse;
  voter_name: string;
}

interface PollInvitee {
  poll_id: string;
  member_id: string;
  member_name: string;
}

interface PollWithDetails extends Poll {
  votes: PollVote[];
  invitees: PollInvitee[];
  creator_name: string;
}

interface TeamMember {
  id: string;
  profile_id: string;
  first_name: string | null;
  last_name: string | null;
}

const DEV_MEMBERS: TeamMember[] = [
  { id: "m1", profile_id: DEV_PROFILE_ID, first_name: "Dev", last_name: "Mode" },
  { id: "m2", profile_id: "profile-2", first_name: "Yasmine", last_name: "Benali" },
  { id: "m3", profile_id: "profile-3", first_name: "Rayan", last_name: "Dupont" },
];

const DEV_POLLS: PollWithDetails[] = [
  {
    id: "poll-1",
    establishment_id: DEV_ESTABLISHMENT_ID,
    created_by: DEV_PROFILE_ID,
    title: "Réunion équipe mai",
    description: "Point mensuel sur les objectifs",
    proposed_date: "2026-05-28",
    proposed_time: "14:00",
    status: "open",
    created_at: new Date(Date.now() - 86400000).toISOString(),
    creator_name: "Dev Mode",
    invitees: [
      { poll_id: "poll-1", member_id: DEV_PROFILE_ID, member_name: "Dev Mode" },
      { poll_id: "poll-1", member_id: "profile-2", member_name: "Yasmine Benali" },
      { poll_id: "poll-1", member_id: "profile-3", member_name: "Rayan Dupont" },
    ],
    votes: [
      { id: "v1", poll_id: "poll-1", voter_id: DEV_PROFILE_ID, response: "yes", voter_name: "Dev Mode" },
      { id: "v2", poll_id: "poll-1", voter_id: "profile-2", response: "yes", voter_name: "Yasmine Benali" },
    ],
  },
  {
    id: "poll-2",
    establishment_id: DEV_ESTABLISHMENT_ID,
    created_by: DEV_PROFILE_ID,
    title: "Formation hygiène HACCP",
    description: null,
    proposed_date: "2026-06-03",
    proposed_time: "09:30",
    status: "open",
    created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    creator_name: "Dev Mode",
    invitees: [
      { poll_id: "poll-2", member_id: "profile-2", member_name: "Yasmine Benali" },
      { poll_id: "poll-2", member_id: "profile-3", member_name: "Rayan Dupont" },
    ],
    votes: [
      { id: "v3", poll_id: "poll-2", voter_id: "profile-2", response: "yes", voter_name: "Yasmine Benali" },
      { id: "v4", poll_id: "poll-2", voter_id: "profile-3", response: "maybe", voter_name: "Rayan Dupont" },
    ],
  },
];

const VOTE_CONFIG: Record<VoteResponse, { label: string; icon: typeof Check; bg: string; color: string; border: string }> = {
  yes:   { label: "Oui",       icon: Check, bg: "rgba(16,185,129,0.12)", color: "#10b981", border: "rgba(16,185,129,0.3)" },
  maybe: { label: "Peut-être", icon: Minus, bg: "rgba(245,158,11,0.12)", color: "#f59e0b", border: "rgba(245,158,11,0.3)" },
  no:    { label: "Non",       icon: X,     bg: "rgba(239,68,68,0.12)",  color: "#ef4444", border: "rgba(239,68,68,0.3)" },
};

function formatDate(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
}

function PollCard({ poll, currentUserId, onVote, isManager }: {
  poll: PollWithDetails;
  currentUserId: string;
  onVote: (pollId: string, response: VoteResponse) => void;
  isManager: boolean;
}) {
  const [expanded, setExpanded] = useState(true);
  const totalInvitees = poll.invitees.length;
  const totalVotes = poll.votes.length;
  const allVoted = totalVotes >= totalInvitees && totalInvitees > 0;
  const myVote = poll.votes.find(v => v.voter_id === currentUserId)?.response;
  const amInvited = poll.invitees.some(i => i.member_id === currentUserId);

  const counts = { yes: 0, no: 0, maybe: 0 };
  poll.votes.forEach(v => counts[v.response]++);

  return (
    <div className="rounded-xl overflow-hidden" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
      {/* Header */}
      <button className="w-full flex items-start gap-3 p-4 text-left" onClick={() => setExpanded(e => !e)}>
        <div className="w-10 h-10 rounded-xl flex flex-col items-center justify-center flex-shrink-0" style={{ background: "rgba(6,182,212,0.08)", border: "1px solid rgba(6,182,212,0.15)" }}>
          <span className="font-mono text-[10px] font-bold leading-none" style={{ color: "var(--accent)" }}>
            {new Date(poll.proposed_date + "T00:00:00").getDate()}
          </span>
          <span className="font-mono text-[8px] leading-none" style={{ color: "var(--foreground-dim)" }}>
            {new Date(poll.proposed_date + "T00:00:00").toLocaleDateString("fr-FR", { month: "short" }).toUpperCase()}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className="font-semibold text-sm" style={{ color: "var(--foreground)" }}>{poll.title}</p>
            {allVoted && (
              <span className="flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full" style={{ background: "rgba(16,185,129,0.12)", color: "#10b981", border: "1px solid rgba(16,185,129,0.25)" }}>
                <Check size={9} strokeWidth={2.5} /> Tout le monde a voté
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-xs" style={{ color: "var(--foreground-dim)" }}>
              <Clock size={11} /> {poll.proposed_time}
            </span>
            <span className="flex items-center gap-1 text-xs" style={{ color: "var(--foreground-dim)" }}>
              <Users size={11} /> {totalVotes}/{totalInvitees} ont voté
            </span>
          </div>
          {poll.description && (
            <p className="text-xs mt-1" style={{ color: "var(--foreground-dim)" }}>{poll.description}</p>
          )}
        </div>
        <div style={{ color: "var(--foreground-dim)", flexShrink: 0 }}>
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </button>

      {expanded && (
        <div style={{ borderTop: "1px solid var(--border)" }}>
          {/* Vote counts */}
          <div className="flex gap-2 px-4 py-3">
            {(["yes","no","maybe"] as VoteResponse[]).map(r => {
              const cfg = VOTE_CONFIG[r];
              return (
                <div key={r} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-sm" style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}>
                  <cfg.icon size={12} strokeWidth={2} style={{ color: cfg.color }} />
                  <span className="font-semibold" style={{ color: cfg.color }}>{counts[r]}</span>
                  <span className="text-xs" style={{ color: cfg.color }}>{cfg.label}</span>
                </div>
              );
            })}
          </div>

          {/* Who voted what */}
          <div className="px-4 pb-3 space-y-1.5">
            {poll.invitees.map(inv => {
              const vote = poll.votes.find(v => v.voter_id === inv.member_id);
              const initials = inv.member_name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
              const cfg = vote ? VOTE_CONFIG[vote.response] : null;
              return (
                <div key={inv.member_id} className="flex items-center gap-2.5 py-1.5 px-3 rounded-lg" style={{ background: "var(--background-soft)", border: "1px solid var(--border)" }}>
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold flex-shrink-0" style={{ background: "rgba(6,182,212,0.12)", color: "var(--accent)", border: "1px solid rgba(6,182,212,0.2)" }}>
                    {initials}
                  </div>
                  <span className="flex-1 text-sm" style={{ color: "var(--foreground-muted)" }}>{inv.member_name}</span>
                  {cfg ? (
                    <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full" style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>
                      <cfg.icon size={9} strokeWidth={2.5} /> {cfg.label}
                    </span>
                  ) : (
                    <span className="text-xs" style={{ color: "var(--foreground-dim)" }}>En attente…</span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Vote buttons for invitees */}
          {amInvited && (
            <div className="px-4 pb-4" style={{ borderTop: "1px solid var(--border)", paddingTop: 12 }}>
              <p className="text-xs mb-2.5" style={{ color: "var(--foreground-dim)" }}>Ton vote</p>
              <div className="flex gap-2">
                {(["yes","maybe","no"] as VoteResponse[]).map(r => {
                  const cfg = VOTE_CONFIG[r];
                  const selected = myVote === r;
                  return (
                    <button
                      key={r}
                      onClick={() => onVote(poll.id, r)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-all"
                      style={{
                        background: selected ? cfg.bg : "var(--background-soft)",
                        color: selected ? cfg.color : "var(--foreground-dim)",
                        border: `1.5px solid ${selected ? cfg.border : "var(--border)"}`,
                        transform: selected ? "scale(1.02)" : "scale(1)",
                      }}
                    >
                      <cfg.icon size={13} strokeWidth={2} />
                      {cfg.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function CreatePollForm({ members, onSubmit, onCancel }: {
  members: TeamMember[];
  onSubmit: (data: { title: string; description: string; date: string; time: string; invitees: string[] }) => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("14:00");
  const [selectedMembers, setSelectedMembers] = useState<string[]>(members.map(m => m.profile_id));

  const toggle = (profileId: string) => {
    setSelectedMembers(prev =>
      prev.includes(profileId) ? prev.filter(id => id !== profileId) : [...prev, profileId]
    );
  };

  const canSubmit = title.trim() && date && time && selectedMembers.length > 0;

  return (
    <div className="rounded-xl p-5 space-y-4" style={{ background: "var(--card)", border: "1px solid rgba(6,182,212,0.25)" }}>
      <div className="flex items-center justify-between">
        <h3 className="font-semibold" style={{ color: "var(--foreground)" }}>Nouveau vote RDV</h3>
        <button onClick={onCancel} style={{ color: "var(--foreground-dim)" }}><X size={16} /></button>
      </div>

      {/* Title */}
      <div>
        <label className="block text-xs font-mono uppercase tracking-wider mb-1.5" style={{ color: "var(--foreground-dim)" }}>Objet *</label>
        <input
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Ex: Réunion équipe, Formation hygiène…"
          className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
          style={{ background: "var(--background-soft)", border: "1px solid var(--border)", color: "var(--foreground)" }}
        />
      </div>

      {/* Date + Time */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-mono uppercase tracking-wider mb-1.5" style={{ color: "var(--foreground-dim)" }}>Date *</label>
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
            style={{ background: "var(--background-soft)", border: "1px solid var(--border)", color: "var(--foreground)", colorScheme: "dark" }}
          />
        </div>
        <div>
          <label className="block text-xs font-mono uppercase tracking-wider mb-1.5" style={{ color: "var(--foreground-dim)" }}>Heure *</label>
          <input
            type="time"
            value={time}
            onChange={e => setTime(e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
            style={{ background: "var(--background-soft)", border: "1px solid var(--border)", color: "var(--foreground)", colorScheme: "dark" }}
          />
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="block text-xs font-mono uppercase tracking-wider mb-1.5" style={{ color: "var(--foreground-dim)" }}>Description (optionnel)</label>
        <input
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="Infos supplémentaires…"
          className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
          style={{ background: "var(--background-soft)", border: "1px solid var(--border)", color: "var(--foreground)" }}
        />
      </div>

      {/* Invitees */}
      <div>
        <label className="block text-xs font-mono uppercase tracking-wider mb-2" style={{ color: "var(--foreground-dim)" }}>Qui inviter *</label>
        <div className="space-y-1.5">
          {members.map(m => {
            const name = [m.first_name, m.last_name].filter(Boolean).join(" ") || m.profile_id;
            const initials = name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
            const selected = selectedMembers.includes(m.profile_id);
            return (
              <button
                key={m.profile_id}
                onClick={() => toggle(m.profile_id)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-left"
                style={{ background: selected ? "rgba(6,182,212,0.06)" : "var(--background-soft)", border: `1px solid ${selected ? "rgba(6,182,212,0.25)" : "var(--border)"}` }}
              >
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-[9px] font-bold flex-shrink-0" style={{ background: "rgba(6,182,212,0.12)", color: "var(--accent)", border: "1px solid rgba(6,182,212,0.2)" }}>
                  {initials}
                </div>
                <span className="flex-1 text-sm" style={{ color: selected ? "var(--foreground)" : "var(--foreground-muted)" }}>{name}</span>
                <div className="w-4 h-4 rounded flex items-center justify-center" style={{ background: selected ? "var(--accent)" : "transparent", border: `1.5px solid ${selected ? "var(--accent)" : "var(--border)"}` }}>
                  {selected && <Check size={10} strokeWidth={3} style={{ color: "#09090B" }} />}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <button
        onClick={() => canSubmit && onSubmit({ title: title.trim(), description: description.trim(), date, time, invitees: selectedMembers })}
        disabled={!canSubmit}
        className="w-full py-3 rounded-xl text-sm font-semibold transition-opacity"
        style={{ background: canSubmit ? "var(--accent)" : "var(--border)", color: canSubmit ? "#09090B" : "var(--foreground-dim)", opacity: canSubmit ? 1 : 0.5 }}
      >
        Envoyer le vote
      </button>
    </div>
  );
}

export default function SchedulePage() {
  const supabase = createClient();
  const [devRole] = useDevRole();
  const [role, setRole] = useState<string>("manager");
  const [profileId, setProfileId] = useState<string>(DEV_MODE ? DEV_PROFILE_ID : "");
  const [establishmentId, setEstablishmentId] = useState<string>(DEV_MODE ? DEV_ESTABLISHMENT_ID : "");
  const [polls, setPolls] = useState<PollWithDetails[]>(DEV_MODE ? DEV_POLLS : []);
  const [members, setMembers] = useState<TeamMember[]>(DEV_MODE ? DEV_MEMBERS : []);
  const [loading, setLoading] = useState(!DEV_MODE);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const isManager = role === "manager" || role === "owner";

  useEffect(() => {
    if (DEV_MODE) {
      setRole(devRole);
      return;
    }
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setProfileId(user.id);
      const { data: member } = await supabase
        .from("establishment_members")
        .select("role, establishment_id")
        .eq("profile_id", user.id)
        .single();
      if (!member) return;
      setRole(member.role);
      setEstablishmentId(member.establishment_id);
      await fetchData(member.establishment_id, user.id);
      setLoading(false);
    }
    load();
  }, [devRole]);

  async function fetchData(estId: string, userId: string) {
    const { data: pollRows } = await supabase
      .from("schedule_polls")
      .select("*")
      .eq("establishment_id", estId)
      .order("proposed_date", { ascending: true });

    if (!pollRows) return;

    const pollIds = pollRows.map(p => p.id);
    const [{ data: votes }, { data: invitees }, { data: allMembers }] = await Promise.all([
      supabase.from("schedule_votes").select("*, profiles(first_name,last_name)").in("poll_id", pollIds),
      supabase.from("schedule_poll_invitees").select("*, profiles(first_name,last_name)").in("poll_id", pollIds),
      supabase.from("establishment_members").select("id, profile_id, profiles(first_name,last_name)").eq("establishment_id", estId).eq("is_active", true),
    ]);

    const getName = (p: { first_name: string | null; last_name: string | null } | null) =>
      p ? [p.first_name, p.last_name].filter(Boolean).join(" ") || "?" : "?";

    const pollsWithDetails: PollWithDetails[] = pollRows.map(p => ({
      ...p,
      creator_name: "Manager",
      votes: (votes || []).filter(v => v.poll_id === p.id).map(v => ({
        id: v.id,
        poll_id: v.poll_id,
        voter_id: v.voter_id,
        response: v.response as VoteResponse,
        voter_name: getName((v as any).profiles),
      })),
      invitees: (invitees || []).filter(i => i.poll_id === p.id).map(i => ({
        poll_id: i.poll_id,
        member_id: i.member_id,
        member_name: getName((i as any).profiles),
      })),
    }));

    setPolls(pollsWithDetails);
    setMembers((allMembers || []).map(m => ({
      id: m.id,
      profile_id: m.profile_id,
      first_name: (m as any).profiles?.first_name ?? null,
      last_name: (m as any).profiles?.last_name ?? null,
    })));
  }

  async function handleVote(pollId: string, response: VoteResponse) {
    if (DEV_MODE) {
      setPolls(prev => prev.map(p => {
        if (p.id !== pollId) return p;
        const existingIdx = p.votes.findIndex(v => v.voter_id === profileId);
        const newVote: PollVote = { id: `v-${Date.now()}`, poll_id: pollId, voter_id: profileId, response, voter_name: "Dev Mode" };
        const votes = existingIdx >= 0
          ? p.votes.map((v, i) => i === existingIdx ? newVote : v)
          : [...p.votes, newVote];
        return { ...p, votes };
      }));
      return;
    }
    await supabase.from("schedule_votes").upsert({ poll_id: pollId, voter_id: profileId, response }, { onConflict: "poll_id,voter_id" });
    await fetchData(establishmentId, profileId);
  }

  async function handleCreate(data: { title: string; description: string; date: string; time: string; invitees: string[] }) {
    setSubmitting(true);
    if (DEV_MODE) {
      const newPoll: PollWithDetails = {
        id: `poll-${Date.now()}`,
        establishment_id: DEV_ESTABLISHMENT_ID,
        created_by: DEV_PROFILE_ID,
        title: data.title,
        description: data.description || null,
        proposed_date: data.date,
        proposed_time: data.time,
        status: "open",
        created_at: new Date().toISOString(),
        creator_name: "Dev Mode",
        votes: [],
        invitees: data.invitees.map(mid => {
          const m = members.find(mb => mb.profile_id === mid);
          const name = m ? [m.first_name, m.last_name].filter(Boolean).join(" ") : mid;
          return { poll_id: `poll-${Date.now()}`, member_id: mid, member_name: name };
        }),
      };
      setPolls(prev => [newPoll, ...prev]);
      setShowForm(false);
      setSubmitting(false);
      return;
    }
    const { data: poll } = await supabase
      .from("schedule_polls")
      .insert({ establishment_id: establishmentId, created_by: profileId, title: data.title, description: data.description || null, proposed_date: data.date, proposed_time: data.time, status: "open" })
      .select()
      .single();
    if (poll) {
      await supabase.from("schedule_poll_invitees").insert(data.invitees.map(mid => ({ poll_id: poll.id, member_id: mid })));
      await fetchData(establishmentId, profileId);
    }
    setShowForm(false);
    setSubmitting(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-5 h-5 rounded-full border-2 animate-spin" style={{ borderColor: "var(--accent)", borderTopColor: "transparent" }} />
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <MonoLabel>VOTE RDV</MonoLabel>
          <h1 className="text-2xl font-semibold mt-1" style={{ color: "var(--foreground)", letterSpacing: "-0.03em" }}>
            Proposer un créneau
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--foreground-dim)" }}>
            Choisis les gens, le créneau, et soumet — tout le monde vote.
          </p>
        </div>
        {isManager && !showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold"
            style={{ background: "var(--accent)", color: "#09090B" }}
          >
            <Plus size={15} strokeWidth={2.5} />
            Nouveau
          </button>
        )}
      </div>

      {/* Create form */}
      {showForm && (
        <CreatePollForm
          members={members}
          onSubmit={handleCreate}
          onCancel={() => setShowForm(false)}
        />
      )}

      {/* Polls list */}
      {polls.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4" style={{ background: "rgba(6,182,212,0.08)", border: "1px solid rgba(6,182,212,0.15)" }}>
            <CalendarDays size={22} strokeWidth={1.5} style={{ color: "var(--accent)" }} />
          </div>
          <p className="font-semibold mb-1" style={{ color: "var(--foreground)" }}>Aucun vote en cours</p>
          <p className="text-sm" style={{ color: "var(--foreground-dim)" }}>
            {isManager ? "Crée un vote pour proposer un créneau à l'équipe." : "Aucun créneau à voter pour l'instant."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {polls.map(poll => (
            <PollCard
              key={poll.id}
              poll={poll}
              currentUserId={profileId}
              onVote={handleVote}
              isManager={isManager}
            />
          ))}
        </div>
      )}
    </div>
  );
}
