
"use client";

import { Bell, Bot, Headphones, LogOut, Moon, Sparkles, UserCog, X } from "lucide-react";
import { useEffect, useState } from "react";
import type { Profile } from "@/lib/credits";
import { updateProfile } from "@/lib/profile";

export type PostySettings = {
  supporterName: string;
  supporterTone: string;
  preferredPersona: string;
  emojiLevel: string;
  sentenceLength: string;
  headingStyle: string;
  designStyle: string;
  recommendedPlatform: string;
  themeMode: "system" | "light" | "dark";
};

const settingsKey = "posty-ai-settings";
const defaultSettings: PostySettings = { supporterName: "Posty", supporterTone: "Friendly and practical", preferredPersona: "Default", emojiLevel: "Medium", sentenceLength: "Medium", headingStyle: "Icon headings", designStyle: "Clean blue", recommendedPlatform: "Naver Blog", themeMode: "system" };
const personaOptions = ["Default", "Friend", "Partner", "Health coach", "Professor", "Counselor", "Mom blogger", "Cafe lover", "Food lover", "Travel vlogger", "IT reviewer", "SEO expert", "Custom"];
const menuItems = [
  { key: "posty", label: "Posty settings", icon: Bot },
  { key: "role", label: "Role settings", icon: Sparkles },
  { key: "account", label: "Account", icon: UserCog },
  { key: "theme", label: "Theme", icon: Moon },
  { key: "notice", label: "Notices", icon: Bell },
  { key: "support", label: "Support", icon: Headphones },
  { key: "logout", label: "Logout", icon: LogOut },
] as const;

type MenuKey = (typeof menuItems)[number]["key"];
type Props = { open: boolean; profile: Profile | null; onClose: () => void; onLogout?: () => void | Promise<void>; onProfileUpdated?: (profile: Profile) => void };

export function SettingsModal({ open, profile, onClose, onLogout, onProfileUpdated }: Props) {
  const [active, setActive] = useState<MenuKey>("posty");
  const [settings, setSettings] = useState<PostySettings>(defaultSettings);
  const [status, setStatus] = useState("");
  useEffect(() => { if (open) setSettings(loadPostySettings()); }, [open]);
  useEffect(() => applyTheme(settings.themeMode), [settings.themeMode]);
  if (!open) return null;
  function patch(partial: Partial<PostySettings>) { const next = { ...settings, ...partial }; setSettings(next); savePostySettings(next); }
  async function saveProfileTone() { setStatus(""); try { const updated = await updateProfile({ preferred_tone: `${settings.supporterTone} / ${settings.preferredPersona}` }); onProfileUpdated?.(updated); setStatus("Settings saved."); } catch (error) { setStatus(error instanceof Error ? error.message : "Failed to save settings."); } }
  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center bg-slate-950/45 px-0 sm:items-center sm:px-4">
      <section className="max-h-[92vh] w-full max-w-3xl overflow-hidden rounded-t-[2rem] bg-white shadow-2xl sm:rounded-[2rem]">
        <header className="flex items-center justify-between border-b border-slate-100 px-5 py-4"><div><p className="text-xs font-black text-blue-600">Posty AI Settings</p><h2 className="text-xl font-black text-slate-950">Settings</h2></div><button type="button" onClick={onClose} className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-50 text-slate-500" aria-label="Close"><X size={20} /></button></header>
        <div className="grid max-h-[78vh] grid-cols-1 overflow-hidden sm:grid-cols-[220px_1fr]"><nav className="flex gap-2 overflow-x-auto border-b border-slate-100 bg-slate-50 p-3 sm:block sm:space-y-1 sm:overflow-visible sm:border-b-0 sm:border-r">{menuItems.map((item) => { const Icon = item.icon; return <button key={item.key} type="button" onClick={() => setActive(item.key)} className={`flex min-h-11 shrink-0 items-center gap-2 rounded-2xl px-3 text-sm font-black ${active === item.key ? "bg-blue-600 text-white" : "bg-white text-slate-600 sm:bg-transparent"}`}><Icon size={17} /> {item.label}</button>; })}</nav>
          <div className="overflow-y-auto p-5">
            {active === "posty" && <Panel title="Posty settings" description="Choose how Posty AI supports your content work."><TextInput label="Supporter name" value={settings.supporterName} onChange={(value) => patch({ supporterName: value })} /><TextInput label="Supporter tone" value={settings.supporterTone} onChange={(value) => patch({ supporterTone: value })} /><div className="rounded-3xl bg-blue-50 p-4 text-sm leading-6 text-blue-800">Memory management will use your tone and content preferences to personalize future drafts.</div><button type="button" onClick={saveProfileTone} className="min-h-11 rounded-2xl bg-blue-600 px-4 text-sm font-black text-white">Save to profile</button></Panel>}
            {active === "role" && <Panel title="Role settings" description="Set the default AI role and output style."><div className="grid grid-cols-2 gap-2">{personaOptions.map((item) => <button key={item} type="button" onClick={() => patch({ preferredPersona: item })} className={`min-h-11 rounded-2xl px-3 text-sm font-black ${settings.preferredPersona === item ? "bg-blue-600 text-white" : "bg-slate-50 text-slate-600"}`}>{item}</button>)}</div><SelectInput label="Emoji level" value={settings.emojiLevel} options={["Low", "Medium", "High"]} onChange={(value) => patch({ emojiLevel: value })} /><SelectInput label="Sentence length" value={settings.sentenceLength} options={["Short", "Medium", "Long"]} onChange={(value) => patch({ sentenceLength: value })} /><SelectInput label="Heading style" value={settings.headingStyle} options={["Icon headings", "Plain headings", "SEO headings", "Emotional headings"]} onChange={(value) => patch({ headingStyle: value })} /><SelectInput label="Design style" value={settings.designStyle} options={["Clean blue", "Diary", "Cafe mood", "Professional review", "Detail page"]} onChange={(value) => patch({ designStyle: value })} /><SelectInput label="Recommended platform" value={settings.recommendedPlatform} options={["Naver Blog", "Tistory", "Threads", "Review", "Detail page"]} onChange={(value) => patch({ recommendedPlatform: value })} /></Panel>}
            {active === "account" && <Panel title="Account" description="Check your profile and plan."><InfoRow label="Name" value={profile?.display_name || "Posty Creator"} /><InfoRow label="Email" value={profile?.email || "-"} /><InfoRow label="Plan" value={profile?.plan || "free"} /><InfoRow label="Credits" value={`${profile?.credits ?? 0}`} /></Panel>}
            {active === "theme" && <Panel title="Theme" description="Choose the app appearance."><div className="grid grid-cols-3 gap-2">{(["system", "light", "dark"] as const).map((mode) => <button key={mode} type="button" onClick={() => patch({ themeMode: mode })} className={`min-h-12 rounded-2xl text-sm font-black ${settings.themeMode === mode ? "bg-blue-600 text-white" : "bg-slate-50 text-slate-600"}`}>{mode}</button>)}</div><div className="rounded-3xl bg-slate-50 p-4 text-sm font-bold text-slate-500">Dark mode is available as a beta UI setting.</div></Panel>}
            {active === "notice" && <Panel title="Notices" description="Read Posty AI updates."><a href="/notices" className="rounded-2xl bg-blue-50 px-4 py-3 text-sm font-black text-blue-700">Open notices</a></Panel>}
            {active === "support" && <Panel title="Support" description="Send feedback or report an issue."><a href="/support" className="rounded-2xl bg-blue-50 px-4 py-3 text-sm font-black text-blue-700">Open support</a></Panel>}
            {active === "logout" && <Panel title="Logout" description="Sign out of this account."><button type="button" onClick={() => void onLogout?.()} className="min-h-11 rounded-2xl bg-slate-950 px-4 text-sm font-black text-white">Logout</button></Panel>}
            {status && <p className="mt-4 rounded-2xl bg-blue-50 px-4 py-3 text-sm font-bold text-blue-700">{status}</p>}
          </div>
        </div>
      </section>
    </div>
  );
}
function Panel({ title, description, children }: { title: string; description: string; children: React.ReactNode }) { return <div className="space-y-4"><div><h3 className="text-xl font-black text-slate-950">{title}</h3><p className="mt-1 text-sm leading-6 text-slate-500">{description}</p></div>{children}</div>; }
function TextInput({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) { return <label className="block"><span className="text-xs font-black text-slate-400">{label}</span><input value={value} onChange={(event) => onChange(event.target.value)} className="mt-2 h-11 w-full rounded-2xl bg-slate-50 px-3 text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-200" /></label>; }
function SelectInput({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) { return <label className="block"><span className="text-xs font-black text-slate-400">{label}</span><select value={value} onChange={(event) => onChange(event.target.value)} className="mt-2 h-11 w-full rounded-2xl bg-slate-50 px-3 text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-200">{options.map((item) => <option key={item}>{item}</option>)}</select></label>; }
function InfoRow({ label, value }: { label: string; value: string }) { return <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3"><span className="text-xs font-black text-slate-400">{label}</span><span className="text-sm font-black text-slate-800">{value}</span></div>; }
export function loadPostySettings(): PostySettings { if (typeof window === "undefined") return defaultSettings; try { return { ...defaultSettings, ...JSON.parse(window.localStorage.getItem(settingsKey) || "{}") }; } catch { return defaultSettings; } }
export function savePostySettings(settings: PostySettings) { if (typeof window === "undefined") return; window.localStorage.setItem(settingsKey, JSON.stringify(settings)); applyTheme(settings.themeMode); }
export function applyTheme(mode: PostySettings["themeMode"]) { if (typeof document === "undefined") return; const root = document.documentElement; root.classList.remove("posty-dark", "posty-light"); if (mode === "dark") root.classList.add("posty-dark"); if (mode === "light") root.classList.add("posty-light"); }
