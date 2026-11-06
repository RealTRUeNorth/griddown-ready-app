import React, { useState } from 'react';
import { Shield, TriangleAlert, Users } from 'lucide-react';
import { useAppData } from '@/lib/store';
import { AlertLevel } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Field } from '@/pages/Prep';
import { cn } from '@/lib/utils';

const LEVEL_OPTIONS: { level: AlertLevel; label: string; description: string; color: string }[] = [
  { level: 'green', label: 'ALL CLEAR', description: 'Normal operations', color: '#4CAF50' },
  { level: 'amber', label: 'ELEVATED', description: 'Heightened awareness', color: '#FFC107' },
  { level: 'red', label: 'RED ALERT', description: 'Emergency protocols', color: '#F44336' },
];

export default function Onboarding() {
  const { completeOnboarding } = useAppData();
  const [step, setStep] = useState(0);
  const [acknowledged, setAcknowledged] = useState(false);
  const [groupName, setGroupName] = useState('My Group');
  const [level, setLevel] = useState<AlertLevel>('green');

  const finish = () => completeOnboarding(groupName, level);

  return (
    <div className="fixed inset-0 z-50 bg-[#1A1D1A] gd-grid-bg flex flex-col">
      <div className="flex-1 overflow-y-auto px-6 py-10 max-w-md w-full mx-auto flex flex-col">
        {/* Progress dots */}
        <div className="flex gap-1.5 mb-8">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={cn('h-1 flex-1 rounded-full transition-colors', i <= step ? 'bg-[#D4822A]' : 'bg-[#3A3F3A]')}
            />
          ))}
        </div>

        {step === 0 && (
          <div className="flex-1 flex flex-col">
            <div className="w-16 h-16 rounded-2xl bg-[#333833] border border-[#4A504A] flex items-center justify-center mb-6">
              <Shield className="w-8 h-8 text-[#D4822A]" />
            </div>
            <h1 className="text-2xl font-bold text-[#E8E4DC] gd-label leading-tight">GRIDDOWN</h1>
            <p className="text-sm text-[#9A9890] mt-1.5 tracking-widest">TACTICAL PREPAREDNESS PLANNER</p>
            <div className="mt-8 space-y-4 text-[13px] text-[#9A9890] leading-relaxed">
              <p>Plan and coordinate with your family or group when infrastructure fails:</p>
              <ul className="space-y-2.5">
                <li className="flex gap-2.5"><Shield className="w-4 h-4 text-[#8B9A6A] shrink-0 mt-0.5" /> Group roster with check-in cadence and overdue alerts</li>
                <li className="flex gap-2.5"><Users className="w-4 h-4 text-[#8B9A6A] shrink-0 mt-0.5" /> Supply inventory with expiry tracking, offline field guides</li>
                <li className="flex gap-2.5"><TriangleAlert className="w-4 h-4 text-[#8B9A6A] shrink-0 mt-0.5" /> Rally points, evacuation routes, and a comms plan — all stored locally on this device</li>
              </ul>
            </div>
            <div className="flex-1" />
            <Button onClick={() => setStep(1)} className="mt-8 h-12 bg-[#D4822A] hover:bg-[#E8A04A] text-[#1A1D1A] font-bold gd-label text-sm">
              GET STARTED
            </Button>
          </div>
        )}

        {step === 1 && (
          <div className="flex-1 flex flex-col">
            <div className="w-16 h-16 rounded-2xl bg-[#3d1414] border border-[#F44336]/40 flex items-center justify-center mb-6">
              <TriangleAlert className="w-8 h-8 text-[#F44336]" />
            </div>
            <h1 className="text-xl font-bold text-[#E8E4DC] gd-label">IMPORTANT NOTICE</h1>
            <div className="mt-6 space-y-4 text-[12px] text-[#9A9890] leading-relaxed">
              <p>
                GRIDDOWN is a <strong className="text-[#E8E4DC]">preparedness planner, not an emergency service</strong>.
                It does not contact responders, dispatch help, or monitor anyone's safety.
              </p>
              <p>
                In a real emergency, call <strong className="text-[#E8E4DC]">911 (US)</strong> or your local
                emergency number immediately.
              </p>
              <p>
                Guides summarize public guidance for education only — they are not medical advice.
                Always defer to trained professionals and official authorities.
              </p>
            </div>
            <div className="flex-1" />
            <label className="flex items-start gap-3 mt-8 cursor-pointer" data-testid="onboarding-ack">
              <input
                type="checkbox"
                checked={acknowledged}
                onChange={(e) => setAcknowledged(e.target.checked)}
                className="mt-0.5 w-4 h-4 accent-[#D4822A] shrink-0"
              />
              <span className="text-[12px] text-[#E8E4DC] leading-relaxed">
                I understand this app is not an emergency service and does not replace calling 911.
              </span>
            </label>
            <Button
              onClick={() => acknowledged && setStep(2)}
              disabled={!acknowledged}
              className="mt-4 h-12 bg-[#D4822A] hover:bg-[#E8A04A] disabled:opacity-40 text-[#1A1D1A] font-bold gd-label text-sm"
            >
              I UNDERSTAND
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="flex-1 flex flex-col">
            <div className="w-16 h-16 rounded-2xl bg-[#242824] border border-[#4A504A] flex items-center justify-center mb-6">
              <Users className="w-8 h-8 text-[#8B9A6A]" />
            </div>
            <h1 className="text-xl font-bold text-[#E8E4DC] gd-label">SET UP YOUR GROUP</h1>
            <div className="mt-6 space-y-5">
              <Field label="GROUP NAME">
                <Input value={groupName} onChange={(e) => setGroupName(e.target.value)} placeholder="My Group" className="bg-[#242824] border-[#3A3F3A] text-[#E8E4DC]" data-testid="onboarding-group-name" />
              </Field>
              <div>
                <span className="text-[9px] gd-label text-[#6A6860] block mb-2">CURRENT ALERT LEVEL</span>
                <div className="space-y-2">
                  {LEVEL_OPTIONS.map((opt) => (
                    <button
                      key={opt.level}
                      onClick={() => setLevel(opt.level)}
                      data-testid={`onboarding-level-${opt.level}`}
                      className={cn(
                        'w-full flex items-center gap-3 p-3.5 rounded-xl border transition-colors text-left',
                        level === opt.level ? 'bg-[#333833]' : 'bg-[#242824] hover:bg-[#2A2F2A]'
                      )}
                      style={{ borderColor: level === opt.level ? opt.color : '#3A3F3A' }}
                    >
                      <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: opt.color }} />
                      <div>
                        <div className="text-xs gd-label text-[#E8E4DC]">{opt.label}</div>
                        <div className="text-[11px] text-[#9A9890]">{opt.description}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex-1" />
            <Button onClick={finish} className="mt-8 h-12 bg-[#D4822A] hover:bg-[#E8A04A] text-[#1A1D1A] font-bold gd-label text-sm" data-testid="onboarding-finish">
              ENTER GRIDDOWN
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
