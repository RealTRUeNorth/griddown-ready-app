import React, { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  BookOpen,
  Library,
  Users,
  DatabaseBackup,
  Map,
  TriangleAlert,
  Plus,
  Search,
  ChevronRight,
  ExternalLink,
  BookmarkPlus,
  Trash2,
  Copy,
  Upload,
  Download,
  FileDown,
  Phone,
  CheckCheck,
  Clock,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAppData } from '@/lib/store';
import { areaStudyProgress } from '@/lib/data/areaStudy';
import { defaultGuides } from '@/lib/data/guides';
import { kiwixCatalog, kiwixCategories } from '@/lib/data/kiwix';
import {
  getCheckInState,
  checkInStatusColor,
  checkInStatusLabel,
  formatTimeSince,
  overdueBy,
} from '@/lib/checkin';
import { TCard, SectionTitle, Chip, ProgressBar } from '@/components/tactical';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Field } from '@/pages/Prep';
import { cn } from '@/lib/utils';

type Tab = 'guides' | 'analysis' | 'library' | 'group' | 'backup';

const GUIDE_ICON_COLORS = ['#8B9A6A', '#F44336', '#4CAF50', '#D4822A', '#FFC107', '#42A5F5'];

export default function Intel() {
  const [params, setParams] = useSearchParams();
  const tab = (params.get('tab') as Tab) || 'guides';
  const setTab = (t: Tab) => setParams({ tab: t });

  const tabs: { key: Tab; label: string; icon: React.ElementType }[] = [
    { key: 'guides', label: 'GUIDES', icon: BookOpen },
    { key: 'analysis', label: 'ANALYSIS', icon: Map },
    { key: 'library', label: 'LIBRARY', icon: Library },
    { key: 'group', label: 'GROUP', icon: Users },
    { key: 'backup', label: 'BACKUP', icon: DatabaseBackup },
  ];

  return (
    <div>
      <h1 className="text-lg gd-label text-[#E8E4DC] mb-4">INTEL</h1>
      <div className="grid grid-cols-5 gap-1 bg-[#242824] border border-[#3A3F3A] rounded-xl p-1 mb-4">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={cn(
              'py-2 rounded-lg text-[10px] gd-label transition-colors flex flex-col items-center gap-1',
              tab === key ? 'bg-[#333833] text-[#E8A04A]' : 'text-[#9A9890] hover:text-[#E8E4DC]'
            )}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>
      {tab === 'guides' && <GuidesTab />}
      {tab === 'analysis' && <AnalysisTab />}
      {tab === 'library' && <LibraryTab />}
      {tab === 'group' && <GroupTab />}
      {tab === 'backup' && <BackupTab />}
    </div>
  );
}

/* ── Analysis: area study + threat register ───────────────── */

function AnalysisTab() {
  const navigate = useNavigate();
  const { areaStudy, threats } = useAppData();
  const filled = areaStudyProgress(areaStudy).filled;
  const activeThreats = threats.filter((t) => t.status === 'active').length;

  return (
    <div className="space-y-2">
      <TCard onClick={() => navigate('/area-study')} className="p-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 bg-[#8B9A6A]/15">
          <Map className="w-5 h-5 text-[#8B9A6A]" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-bold text-[#E8E4DC]">Area Study Workbook</div>
          <div className="text-[11px] text-[#6A6860] mt-0.5">Terrain, people, routes, resources & the group plan</div>
          <div className="mt-1.5">
            <Chip label={`${filled}/8 SECTIONS`} color={filled === 8 ? '#4CAF50' : '#FFC107'} />
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-[#6A6860] shrink-0" />
      </TCard>

      <TCard onClick={() => navigate('/threats')} className="p-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 bg-[#F44336]/15">
          <TriangleAlert className="w-5 h-5 text-[#E85555]" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-bold text-[#E8E4DC]">Threat Register</div>
          <div className="text-[11px] text-[#6A6860] mt-0.5">Tracked hazards with severity, mitigations & alerts</div>
          {activeThreats > 0 && (
            <div className="mt-1.5">
              <Chip label={`${activeThreats} ACTIVE`} color="#F44336" />
            </div>
          )}
        </div>
        <ChevronRight className="w-4 h-4 text-[#6A6860] shrink-0" />
      </TCard>
    </div>
  );
}

/* ── Field Guides ─────────────────────────────────────────── */

function GuidesTab() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const filtered = defaultGuides.filter(
    (g) =>
      g.title.toLowerCase().includes(query.toLowerCase()) ||
      g.summary.toLowerCase().includes(query.toLowerCase()) ||
      g.category.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div>
      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6A6860]" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search field guides…"
          className="pl-9 bg-[#242824] border-[#3A3F3A] text-[#E8E4DC] placeholder:text-[#6A6860] text-sm"
        />
      </div>
      <div className="space-y-2">
        {filtered.map((g, i) => (
          <TCard key={g.id} onClick={() => navigate(`/guides/${g.id}`)} className="p-4 flex items-center gap-3" testId={`guide-${g.id}`}>
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
              style={{ backgroundColor: `${GUIDE_ICON_COLORS[i % GUIDE_ICON_COLORS.length]}22` }}
            >
              <BookOpen className="w-5 h-5" style={{ color: GUIDE_ICON_COLORS[i % GUIDE_ICON_COLORS.length] }} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold text-[#E8E4DC]">{g.title}</div>
              <div className="text-[11px] text-[#6A6860] mt-0.5 line-clamp-1">{g.summary}</div>
              <div className="mt-1.5">
                <Chip label={`${g.category.toUpperCase()} · ${g.sections.length} SECTIONS`} color={GUIDE_ICON_COLORS[i % GUIDE_ICON_COLORS.length]} />
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-[#6A6860] shrink-0" />
          </TCard>
        ))}
      </div>
      <div className="mt-6 text-[10px] text-[#6A6860] text-center">
        All guides stored on-device · Tap READ ALOUD on any guide to listen
      </div>
    </div>
  );
}

/* ── Offline Library (Kiwix catalog) ──────────────────────── */

function LibraryTab() {
  const navigate = useNavigate();
  const { kiwixLibrary, saveKiwixResource, removeKiwixResource } = useAppData();
  const [category, setCategory] = useState('all');
  const [query, setQuery] = useState('');
  const [resourceId, setResourceId] = useState<string | null>(null);

  const savedIds = useMemo(() => new Set(kiwixLibrary.map((r) => r.id)), [kiwixLibrary]);
  const filtered = kiwixCatalog
    .filter((r) => (category === 'all' ? true : r.category === category))
    .filter(
      (r) =>
        r.title.toLowerCase().includes(query.toLowerCase()) ||
        r.description.toLowerCase().includes(query.toLowerCase()) ||
        r.tags.some((t) => t.includes(query.toLowerCase()))
    );

  const resource = kiwixCatalog.find((r) => r.id === resourceId);

  return (
    <div>
      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6A6860]" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search offline resources…"
          className="pl-9 bg-[#242824] border-[#3A3F3A] text-[#E8E4DC] placeholder:text-[#6A6860] text-sm"
        />
      </div>

      <div className="flex gap-1.5 overflow-x-auto hide-scrollbar pb-1 mb-3">
        {kiwixCategories.map((c) => (
          <button
            key={c.key}
            onClick={() => setCategory(c.key)}
            className={cn(
              'shrink-0 text-[9px] gd-label rounded-full px-3 py-1.5 border transition-colors',
              category === c.key
                ? 'bg-[#8B5A1A] border-[#D4822A] text-[#E8A04A]'
                : 'bg-[#242824] border-[#3A3F3A] text-[#9A9890] hover:text-[#E8E4DC]'
            )}
          >
            {c.label.toUpperCase()}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {filtered.map((r) => {
          const saved = savedIds.has(r.id);
          return (
            <TCard key={r.id} onClick={() => setResourceId(r.id)} className="p-3.5" testId={`resource-${r.id}`}>
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-[#E8E4DC]">{r.title}</span>
                    {saved && <Chip label="IN LIBRARY" color="#4CAF50" />}
                  </div>
                  <div className="text-[11px] text-[#9A9890] mt-1 line-clamp-2">{r.description}</div>
                  <div className="text-[10px] text-[#6A6860] mt-1.5">
                    {r.sizeLabel} · {r.language} · updated {r.lastUpdated}
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-[#6A6860] shrink-0 mt-1" />
              </div>
            </TCard>
          );
        })}
      </div>

      {kiwixLibrary.length > 0 && (
        <>
          <SectionTitle>MY LIBRARY · {kiwixLibrary.length}</SectionTitle>
          <TCard className="px-3">
            {kiwixLibrary.map((r, i) => (
              <div key={r.id} className={`flex items-center gap-2 py-2.5 ${i < kiwixLibrary.length - 1 ? 'border-b border-[#3A3F3A]' : ''}`}>
                <Library className="w-4 h-4 text-[#4CAF50] shrink-0" />
                <span className="flex-1 text-[13px] font-semibold text-[#E8E4DC] truncate">{r.title}</span>
                <span className="text-[10px] text-[#6A6860]">{r.sizeLabel}</span>
                <button
                  onClick={() => removeKiwixResource(r.id)}
                  className="p-1.5 text-[#6A6860] hover:text-[#F44336] transition-colors"
                  aria-label="Remove from library"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </TCard>
        </>
      )}

      <Dialog open={resourceId !== null} onOpenChange={(o) => !o && setResourceId(null)}>
        <DialogContent className="bg-[#242824] border-[#3A3F3A] text-[#E8E4DC] max-h-[85vh] overflow-y-auto">
          {resource && (
            <>
              <DialogHeader>
                <DialogTitle className="gd-label text-sm leading-relaxed">{resource.title.toUpperCase()}</DialogTitle>
              </DialogHeader>
              <p className="text-[13px] text-[#9A9890] leading-relaxed">{resource.description}</p>
              <div className="flex flex-wrap gap-1.5">
                <Chip label={resource.sizeLabel} color="#D4822A" />
                <Chip label={resource.language.toUpperCase()} color="#8B9A6A" />
                <Chip label={`UPDATED ${resource.lastUpdated}`} color="#9A9890" />
              </div>
              <div className="bg-[#1E221E] border border-[#3A3F3A] rounded-lg p-3 text-[11px] text-[#9A9890] leading-relaxed">
                On desktop, the full ZIM archive can be downloaded and read in the Kiwix
                reader. The link below opens the free online version of this resource —
                you can also bookmark it for offline reading once loaded.
              </div>
              <div className="flex flex-col gap-2">
                {resource.infoUrl && (
                  <a
                    href={resource.infoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-center gap-2 py-2.5 rounded-lg bg-[#D4822A] hover:bg-[#E8A04A] text-[#1A1D1A] text-xs gd-label font-bold transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" /> OPEN READER
                  </a>
                )}
                <a
                  href={resource.downloadUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center gap-2 py-2.5 rounded-lg bg-[#242824] border border-[#3A3F3A] text-xs gd-label text-[#9A9890] hover:text-[#E8A04A] hover:border-[#4A504A] transition-colors"
                >
                  <Download className="w-4 h-4" /> DOWNLOAD ZIM ({resource.sizeLabel})
                </a>
                {savedIds.has(resource.id) ? (
                  <button
                    onClick={() => {
                      removeKiwixResource(resource.id);
                      toast('Removed from library');
                    }}
                    className="flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs gd-label text-[#6A6860] hover:text-[#F44336] transition-colors"
                  >
                    <Trash2 className="w-4 h-4" /> REMOVE FROM LIBRARY
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      saveKiwixResource(resource);
                      toast('Saved to library');
                    }}
                    data-testid="save-resource"
                    className="flex items-center justify-center gap-2 py-2.5 rounded-lg bg-[#242824] border border-[#4CAF50] text-xs gd-label text-[#4CAF50] hover:bg-[#4CAF50]/10 transition-colors"
                  >
                    <BookmarkPlus className="w-4 h-4" /> SAVE TO LIBRARY
                  </button>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ── Group roster ─────────────────────────────────────────── */

function GroupTab() {
  const navigate = useNavigate();
  const { members, checkInIntervalHours, checkInMember, addMember } = useAppData();
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [phone, setPhone] = useState('');

  const add = () => {
    if (!name.trim()) return;
    addMember({
      id: `mem-${Date.now()}`,
      name: name.trim(),
      role: role.trim() || 'Member',
      skills: [],
      status: 'unknown',
      phone: phone.trim() || undefined,
    });
    setName('');
    setRole('');
    setPhone('');
    setAdding(false);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-3">
        <div className="text-xs text-[#9A9890]">{members.length} members · every {checkInIntervalHours}h</div>
        <Button
          onClick={() => setAdding(true)}
          className="bg-[#D4822A] hover:bg-[#E8A04A] text-[#1A1D1A] font-bold gd-label text-[11px] gap-1.5"
          data-testid="add-member"
        >
          <Plus className="w-4 h-4" /> ADD
        </Button>
      </div>
      <div className="space-y-2">
        {members.map((m) => {
          const state = getCheckInState(m, checkInIntervalHours);
          const overdue = overdueBy(m, checkInIntervalHours);
          return (
            <TCard key={m.id} onClick={() => navigate(`/members/${m.id}`)} className="p-3.5 flex items-center gap-3" testId={`member-${m.id}`}>
              <div className="w-10 h-10 rounded-full bg-[#333833] border border-[#4A504A] flex items-center justify-center text-xs gd-label text-[#8B9A6A] shrink-0">
                {m.name.split(' ').map((p) => p[0]).slice(0, 2).join('')}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-[#E8E4DC] truncate">{m.name}</div>
                <div className="text-[11px] text-[#6A6860] truncate">{m.role}</div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Clock style={{ color: checkInStatusColor(state) }} className="w-3.5 h-3.5" />
                <Chip label={overdue ?? checkInStatusLabel(state)} color={checkInStatusColor(state)} />
              </div>
              <ChevronRight className="w-4 h-4 text-[#6A6860] shrink-0" />
            </TCard>
          );
        })}
      </div>

      <Dialog open={adding} onOpenChange={setAdding}>
        <DialogContent className="bg-[#242824] border-[#3A3F3A] text-[#E8E4DC]">
          <DialogHeader>
            <DialogTitle className="gd-label text-sm">ADD MEMBER</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Field label="NAME">
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" className="bg-[#1E221E] border-[#3A3F3A]" />
            </Field>
            <Field label="ROLE">
              <Input value={role} onChange={(e) => setRole(e.target.value)} placeholder="Medic, Comms, Scout…" className="bg-[#1E221E] border-[#3A3F3A]" />
            </Field>
            <Field label="PHONE (OPTIONAL)">
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 555 000 0000" inputMode="tel" className="bg-[#1E221E] border-[#3A3F3A]" />
            </Field>
            <Button onClick={add} className="w-full bg-[#D4822A] hover:bg-[#E8A04A] text-[#1A1D1A] font-bold gd-label text-xs" data-testid="save-member">
              ADD MEMBER
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ── Ops backup ───────────────────────────────────────────── */

function BackupTab() {
  const { exportOpsBackup, importOpsBackup } = useAppData();
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const copyToClipboard = async () => {
    const json = exportOpsBackup();
    try {
      await navigator.clipboard.writeText(json);
      toast('Ops backup copied to clipboard');
    } catch {
      toast.error('Clipboard unavailable');
    }
  };

  const downloadFile = () => {
    const json = exportOpsBackup();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `griddown-ops-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast('Backup file saved');
  };

  const importFile = async (file: File) => {
    const text = await file.text();
    if (importOpsBackup(text)) toast.success('Ops backup imported');
    else toast.error('Invalid backup file');
  };

  return (
    <div>
      <SectionTitle className="mt-2">OPS BACKUP</SectionTitle>
      <p className="text-[13px] text-[#9A9890] leading-relaxed mb-4">
        Export everything — members, supplies, checklists, POIs, routes, and comms
        plan — as a single ops backup you can copy, download, or re-import here.
      </p>
      <div className="space-y-2">
        <BackupButton
          icon={<Copy className="w-4 h-4" />}
          label="COPY BACKUP TO CLIPBOARD"
          onClick={copyToClipboard}
          testId="backup-copy"
        />
        <BackupButton
          icon={<FileDown className="w-4 h-4" />}
          label="SHARE BACKUP AS FILE"
          onClick={downloadFile}
          testId="backup-file"
        />
        <BackupButton
          icon={<Upload className="w-4 h-4" />}
          label="IMPORT FROM FILE"
          onClick={() => fileInputRef.current?.click()}
          testId="backup-import"
        />
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,application/json"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void importFile(file);
            e.target.value = '';
          }}
        />
      </div>
      <div className="mt-6 text-[10px] text-[#6A6860] text-center leading-relaxed">
        BACKUPS CONTAIN NO ACCOUNT DATA — EVERYTHING STAYS ON THIS DEVICE
      </div>
    </div>
  );
}

function BackupButton({ icon, label, onClick, testId }: { icon: React.ReactNode; label: string; onClick: () => void; testId?: string }) {
  return (
    <button
      onClick={onClick}
      data-testid={testId}
      className="w-full flex items-center gap-3 p-4 rounded-xl bg-[#242824] border border-[#3A3F3A] hover:border-[#4A504A] text-xs gd-label text-[#E8E4DC] transition-colors"
    >
      <span className="text-[#E8A04A]">{icon}</span>
      {label}
    </button>
  );
}
