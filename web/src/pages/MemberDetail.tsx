import React, { useState } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import {
  Phone,
  Clock,
  MapPin,
  CheckCheck,
  Trash2,
  Pencil,
  MessageSquare,
  Navigation,
} from 'lucide-react';
import { useAppData } from '@/lib/store';
import { GroupMember } from '@/lib/types';
import {
  getCheckInState,
  checkInStatusColor,
  checkInStatusLabel,
  formatTimeSince,
  overdueBy,
} from '@/lib/checkin';
import { TCard, PageHeader, Chip, SectionTitle } from '@/components/tactical';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Field } from '@/pages/Prep';
import { useGeolocation, vibrate } from '@/lib/device';

const STATUS_COLORS = { ready: '#4CAF50', unavailable: '#F44336', unknown: '#6A6860' };

export default function MemberDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { members, checkInIntervalHours, checkInMember, updateMember, removeMember, updateMemberLocation } = useAppData();
  const [editing, setEditing] = useState(false);
  const geo = useGeolocation();

  const member = members.find((m) => m.id === id);
  if (!member) return <Navigate to="/intel/group" replace />;

  const state = getCheckInState(member, checkInIntervalHours);
  const overdue = overdueBy(member, checkInIntervalHours);

  const setMyLocation = () => {
    geo.locate();
  };

  React.useEffect(() => {
    if (geo.coords) {
      updateMemberLocation(member.id, geo.coords);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [geo.coords]);

  const smsHref = member.phone ? `sms:${member.phone.replace(/[^\d+]/g, '')}` : undefined;

  return (
    <div>
      <PageHeader
        title={member.name.toUpperCase()}
        subtitle={`${member.role} · ${member.status.toUpperCase()}`}
        onBack={() => navigate('/intel/group')}
        action={
          <button
            onClick={() => setEditing(true)}
            className="p-2 rounded-lg bg-[#242824] border border-[#3A3F3A] text-[#9A9890] hover:text-[#E8A04A] transition-colors"
            aria-label="Edit member"
          >
            <Pencil className="w-4 h-4" />
          </button>
        }
      />

      <TCard className="p-4 mb-4 flex items-center gap-4">
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center text-xl gd-label border-2 shrink-0"
          style={{ color: STATUS_COLORS[member.status], borderColor: STATUS_COLORS[member.status], backgroundColor: `${STATUS_COLORS[member.status]}15` }}
        >
          {member.name.split(' ').map((p) => p[0]).slice(0, 2).join('')}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Chip label={member.status.toUpperCase()} color={STATUS_COLORS[member.status]} />
            <Chip label={overdue ?? checkInStatusLabel(state)} color={checkInStatusColor(state)} />
          </div>
          <div className="text-xs text-[#9A9890] mt-1.5">
            Last check-in: {member.lastCheckInAt ? formatTimeSince(member.lastCheckInAt) : 'never'}
          </div>
        </div>
        <button
          onClick={() => {
            vibrate(20);
            checkInMember(member.id);
          }}
          data-testid="check-in-button"
          className="shrink-0 px-4 py-2.5 rounded-lg bg-[#4CAF50] hover:bg-[#66BB6A] text-[#1A1D1A] text-[10px] gd-label flex items-center gap-1.5 transition-colors"
        >
          <CheckCheck className="w-4 h-4" /> CHECK IN
        </button>
      </TCard>

      {member.skills.length > 0 && (
        <>
          <SectionTitle>SKILLS</SectionTitle>
          <div className="flex flex-wrap gap-1.5">
            {member.skills.map((s) => (
              <span key={s} className="text-[11px] px-2.5 py-1 rounded-full bg-[#242824] border border-[#3A3F3A] text-[#9A9890]">
                {s}
              </span>
            ))}
          </div>
        </>
      )}

      <SectionTitle>CONTACT</SectionTitle>
      <TCard className="px-3">
        <div className="flex items-center gap-2 py-3 border-b border-[#3A3F3A]">
          <Phone className="w-4 h-4 text-[#8B9A6A]" />
          <span className="flex-1 text-[13px] font-semibold text-[#E8E4DC]">{member.phone || 'No phone on file'}</span>
        </div>
        <div className="flex items-center gap-2 py-3">
          <Clock className="w-4 h-4 text-[#8B9A6A]" />
          <span className="flex-1 text-[13px] font-semibold text-[#E8E4DC]">Expected every {checkInIntervalHours}h</span>
        </div>
      </TCard>

      <div className="flex gap-2 mt-3">
        {smsHref && (
          <a
            href={smsHref}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#242824] border border-[#3A3F3A] text-xs gd-label text-[#E8A04A] hover:border-[#D4822A] transition-colors"
          >
            <MessageSquare className="w-4 h-4" /> SEND TEXT
          </a>
        )}
        <button
          onClick={setMyLocation}
          disabled={geo.loading}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#242824] border border-[#3A3F3A] text-xs gd-label text-[#9A9890] hover:border-[#4A504A] transition-colors disabled:opacity-50"
        >
          <Navigation className="w-4 h-4" />
          {geo.loading ? 'LOCATING…' : 'SHARE MY COORDS'}
        </button>
      </div>
      {geo.error && <div className="text-[11px] text-[#FFC107] mt-2">{geo.error}</div>}

      {member.location && (
        <div className="flex items-center gap-1.5 text-[11px] text-[#6A6860] mt-3">
          <MapPin className="w-3 h-3" />
          {member.location.latitude.toFixed(4)}°, {member.location.longitude.toFixed(4)}°
          {member.locationUpdatedAt ? ` · ${formatTimeSince(member.locationUpdatedAt)}` : ''}
        </div>
      )}

      {member.notes && (
        <>
          <SectionTitle>NOTES</SectionTitle>
          <TCard className="p-4 text-[13px] text-[#9A9890] leading-relaxed">{member.notes}</TCard>
        </>
      )}

      <button
        onClick={() => {
          removeMember(member.id);
          navigate('/intel/group');
        }}
        className="w-full mt-6 py-2.5 rounded-xl text-xs gd-label text-[#6A6860] hover:text-[#F44336] transition-colors"
      >
        REMOVE MEMBER
      </button>

      <MemberEditDialog open={editing} member={member} onClose={() => setEditing(false)} />
    </div>
  );
}

function MemberEditDialog({ open, member, onClose }: { open: boolean; member: GroupMember; onClose: () => void }) {
  const { updateMember } = useAppData();
  const [name, setName] = useState(member.name);
  const [role, setRole] = useState(member.role);
  const [phone, setPhone] = useState(member.phone ?? '');
  const [status, setStatus] = useState(member.status);
  const [skills, setSkills] = useState(member.skills.join(', '));
  const [notes, setNotes] = useState(member.notes ?? '');

  React.useEffect(() => {
    if (open) {
      setName(member.name);
      setRole(member.role);
      setPhone(member.phone ?? '');
      setStatus(member.status);
      setSkills(member.skills.join(', '));
      setNotes(member.notes ?? '');
    }
  }, [open, member]);

  const save = () => {
    if (!name.trim()) return;
    updateMember({
      ...member,
      name: name.trim(),
      role: role.trim() || 'Member',
      phone: phone.trim() || undefined,
      status,
      skills: skills.split(',').map((s) => s.trim()).filter(Boolean),
      notes: notes.trim() || undefined,
    });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="bg-[#242824] border-[#3A3F3A] text-[#E8E4DC] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="gd-label text-sm">EDIT MEMBER</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Field label="NAME">
            <Input value={name} onChange={(e) => setName(e.target.value)} className="bg-[#1E221E] border-[#3A3F3A]" />
          </Field>
          <Field label="ROLE">
            <Input value={role} onChange={(e) => setRole(e.target.value)} className="bg-[#1E221E] border-[#3A3F3A]" />
          </Field>
          <Field label="PHONE">
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 555 000 0000" className="bg-[#1E221E] border-[#3A3F3A]" inputMode="tel" />
          </Field>
          <Field label="STATUS">
            <div className="flex gap-1.5">
              {(['ready', 'unavailable', 'unknown'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setStatus(s)}
                  className="flex-1 py-2 rounded-lg text-[9px] gd-label border transition-colors"
                  style={{
                    backgroundColor: status === s ? `${STATUS_COLORS[s]}22` : '#1E221E',
                    borderColor: status === s ? STATUS_COLORS[s] : '#3A3F3A',
                    color: status === s ? STATUS_COLORS[s] : '#9A9890',
                  }}
                >
                  {s.toUpperCase()}
                </button>
              ))}
            </div>
          </Field>
          <Field label="SKILLS (COMMA-SEPARATED)">
            <Input value={skills} onChange={(e) => setSkills(e.target.value)} placeholder="Medical, Ham radio…" className="bg-[#1E221E] border-[#3A3F3A]" />
          </Field>
          <Field label="NOTES">
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} className="bg-[#1E221E] border-[#3A3F3A]" />
          </Field>
          <Button onClick={save} className="w-full bg-[#D4822A] hover:bg-[#E8A04A] text-[#1A1D1A] font-bold gd-label text-xs">
            SAVE
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
