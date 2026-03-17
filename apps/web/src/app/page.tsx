import React from "react";

const navItems = [
  {
    title: "League setup",
    description: "Create or join a league with the engine defaults.",
    links: ["Create league", "Join via invite code", "Resume last save"],
  },
  {
    title: "Roster & cap",
    description: "See 53-man status, IR, and cap flexibility at a glance.",
    links: ["Roster board", "Cap sheet", "Contract decisions"],
  },
  {
    title: "Draft room",
    description: "Prep your board, view pick values, and queue targets.",
    links: ["Big board", "Trade picks", "Combine & pro days"],
  },
];

const capHighlights = [
  { label: "Cap space", value: "$48.2M", note: "projected post-June" },
  { label: "Dead money", value: "$6.4M", note: "after pending cuts" },
  { label: "Tag window", value: "Open", note: "franchise/transition" },
];

const rosterNeeds = [
  { slot: "QB2", urgency: "High", note: "No vetted backup" },
  { slot: "CB3", urgency: "Medium", note: "Zone-heavy scheme" },
  { slot: "IDL Depth", urgency: "Low", note: "Practice squad candidates" },
];

const draftChecklist = [
  "Lock scouts and regional assignments",
  "Generate AI draft board for AI teams",
  "Review trade-down offers for RD1 pick 12",
  "Queue targets for day 2 (edge/CB/WR)",
];

function SectionCard({
  title,
  eyebrow,
  actions,
  children,
}: {
  title: string;
  eyebrow?: string;
  actions?: string[];
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-lg shadow-black/20 backdrop-blur">
      <div className="mb-3 flex items-center gap-3">
        {eyebrow ? (
          <span className="rounded-full bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-200">
            {eyebrow}
          </span>
        ) : null}
        <h2 className="text-lg font-semibold text-white">{title}</h2>
      </div>
      <div className="space-y-4 text-sm text-slate-200">{children}</div>
      {actions && (
        <div className="mt-4 flex flex-wrap gap-2">
          {actions.map((action) => (
            <button
              key={action}
              className="rounded-full border border-white/20 bg-white/5 px-4 py-2 text-xs font-semibold text-white transition hover:-translate-y-0.5 hover:border-emerald-300 hover:text-emerald-50"
              type="button"
            >
              {action}
            </button>
          ))}
        </div>
      )}
    </section>
  );
}

function Pill({ label }: { label: string }) {
  return (
    <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-semibold text-slate-100">
      {label}
    </span>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100">
      <div className="mx-auto flex max-w-6xl flex-col gap-10 px-6 pb-16 pt-12">
        <header className="flex flex-col gap-4 border-b border-white/10 pb-6 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.2em] text-emerald-200/80">Viridian GM Console</p>
            <h1 className="text-3xl font-semibold text-white sm:text-4xl">
              Run the front office. Let the coaches handle Sundays.
            </h1>
            <p className="max-w-3xl text-sm text-slate-300">
              This dashboard is your single pane of glass for league setup, roster and cap moves, and draft prep. Wiring to Supabase and the engine will land after the Phase 3 AI GM drop.
            </p>
            <div className="flex flex-wrap gap-2">
              <Pill label="GM-only scope" />
              <Pill label="Deterministic sim" />
              <Pill label="Phase 3: AI GM" />
            </div>
          </div>
          <div className="flex flex-col items-start gap-2 rounded-2xl border border-white/10 bg-white/5 p-4 text-xs text-slate-200">
            <span className="text-emerald-200">Release track</span>
            <ul className="space-y-1">
              <li>1. AI GM engine integration</li>
              <li>2. Supabase wiring</li>
              <li>3. GM dashboard polish</li>
            </ul>
          </div>
        </header>

        <div className="grid gap-4 md:grid-cols-3">
          {navItems.map((item) => (
            <div
              key={item.title}
              className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-md shadow-black/30 backdrop-blur"
            >
              <p className="text-xs uppercase tracking-[0.18em] text-emerald-200/80">{item.title}</p>
              <h3 className="mt-2 text-lg font-semibold text-white">{item.description}</h3>
              <ul className="mt-3 space-y-2 text-sm text-slate-300">
                {item.links.map((link) => (
                  <li key={link} className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
                    {link}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <SectionCard
            title="Create or join a league"
            eyebrow="Onboarding"
            actions={["Create league", "Join with code", "Import save"]}
          >
            <p>
              Stand up a fresh league with default rules or join an existing one. We'll soon hook this to Supabase auth and persistence; for now, these controls are placeholders to anchor the flow.
            </p>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1">
                <label className="text-xs uppercase tracking-wide text-slate-400">League name</label>
                <input
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-emerald-300 focus:outline-none"
                  placeholder="e.g. Viridian Prime"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs uppercase tracking-wide text-slate-400">Team preference</label>
                <input
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-emerald-300 focus:outline-none"
                  placeholder="city or nickname"
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs uppercase tracking-wide text-slate-400">Invite code</label>
              <input
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-emerald-300 focus:outline-none"
                placeholder="Enter code to join existing league"
              />
            </div>
          </SectionCard>

          <SectionCard
            title="Roster & cap overview"
            eyebrow="Front office"
            actions={["Open roster", "View cap sheet", "Schedule cuts"]}
          >
            <div className="grid grid-cols-3 gap-3 text-sm">
              {capHighlights.map((item) => (
                <div key={item.label} className="rounded-lg border border-white/10 bg-white/5 p-3">
                  <p className="text-xs uppercase tracking-wide text-slate-400">{item.label}</p>
                  <p className="text-lg font-semibold text-white">{item.value}</p>
                  <p className="text-[11px] text-slate-400">{item.note}</p>
                </div>
              ))}
            </div>
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Immediate needs</p>
              <ul className="space-y-2">
                {rosterNeeds.map((need) => (
                  <li key={need.slot} className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm">
                    <div className="flex items-center gap-2 text-slate-100">
                      <span className="h-2 w-2 rounded-full bg-emerald-300" />
                      {need.slot}
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-semibold text-emerald-200">{need.urgency}</p>
                      <p className="text-[11px] text-slate-400">{need.note}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </SectionCard>
        </div>

        <SectionCard
          title="Draft room"
          eyebrow="April board"
          actions={["Open draft board", "Run trade sims", "Export scouting"]}
        >
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-lg border border-white/10 bg-white/5 p-3">
              <p className="text-xs uppercase tracking-wide text-slate-400">Next pick</p>
              <p className="text-lg font-semibold text-white">Round 1, Pick 12</p>
              <p className="text-[11px] text-slate-400">Trade value: 1150</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/5 p-3">
              <p className="text-xs uppercase tracking-wide text-slate-400">Board status</p>
              <p className="text-lg font-semibold text-white">82 prospects ranked</p>
              <p className="text-[11px] text-slate-400">Archetype-aware once AI GM lands</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/5 p-3">
              <p className="text-xs uppercase tracking-wide text-slate-400">Trade chatter</p>
              <p className="text-lg font-semibold text-white">3 offers pending</p>
              <p className="text-[11px] text-slate-400">Package picks 12 + 76</p>
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Checklist</p>
              <ul className="space-y-1 text-sm text-slate-200">
                {draftChecklist.map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-300" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">AI GM handoff</p>
              <p>
                Once the AI GM module ships, AI teams will generate boards and actions deterministically. This section will surface their pick logic, trade tendencies, and conflicts so you can plan around them.
              </p>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Operations" eyebrow="Day-to-day" actions={["News feed", "Delegation", "Settings"]}>
          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-lg border border-white/10 bg-white/5 p-3 text-sm">
              <p className="text-xs uppercase tracking-wide text-slate-400">Today</p>
              <p className="text-white">Sign backup QB or elevate practice squad.</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/5 p-3 text-sm">
              <p className="text-xs uppercase tracking-wide text-slate-400">Coming up</p>
              <p className="text-white">Coaching interviews close Friday (3 candidates).</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/5 p-3 text-sm">
              <p className="text-xs uppercase tracking-wide text-slate-400">Risks</p>
              <p className="text-white">Cap check before tendering RFAs; avoid triggering void years.</p>
            </div>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
