import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Power, Siren, Flashlight } from 'lucide-react';
import { TCard } from '@/components/tactical';
import { vibrate, vibrateSos } from '@/lib/device';
import { useAppData } from '@/lib/store';
import { cn } from '@/lib/utils';

type Mode = 'off' | 'steady' | 'sos';

const MORSE_SOS = [
  200, 200, 200, 200, 200, 200, 200, 600, // S
  600, 200, 600, 200, 600, 200, 600, 600, // O
  200, 200, 200, 200, 200, 200, 200, 600, // S
];

export default function Lantern() {
  const { updateAlertLevel } = useAppData();
  const [mode, setMode] = useState<Mode>('off');
  const [color, setColor] = useState<'white' | 'red'>('white');
  const [brightness, setBrightness] = useState(100);
  const [flashOn, setFlashOn] = useState(true);
  const timeoutsRef = useRef<number[]>([]);

  const clearTimers = useCallback(() => {
    timeoutsRef.current.forEach((t) => window.clearTimeout(t));
    timeoutsRef.current = [];
  }, []);

  useEffect(() => clearTimers, [clearTimers]);

  const startSos = () => {
    setMode('sos');
    setFlashOn(true);
    vibrateSos();
    // Schedule one full SOS cycle, then re-arm itself while in SOS mode.
    const runCycle = () => {
      let t = 0;
      for (const duration of MORSE_SOS) {
        t += duration;
        const idx = MORSE_SOS.indexOf(duration);
        timeoutsRef.current.push(
          window.setTimeout(() => setFlashOn(idx % 2 === 0), t)
        );
      }
      timeoutsRef.current.push(window.setTimeout(runCycle, t + 1200));
    };
    runCycle();
  };

  const lightOn = mode === 'steady' || (mode === 'sos' && flashOn);
  const lightStyle = {
    background: lightOn
      ? color === 'white'
        ? `radial-gradient(circle, rgba(255,255,255,${brightness / 100}) 0%, rgba(255,255,255,${brightness / 300}) 60%, transparent 100%)`
        : `radial-gradient(circle, rgba(244,67,54,${brightness / 100}) 0%, rgba(244,67,54,${brightness / 300}) 60%, transparent 100%)`
      : 'transparent',
  };

  return (
    <div className="relative">
      <div
        className={cn(
          'relative rounded-xl overflow-hidden border transition-colors h-[55vh] min-h-80 flex items-center justify-center',
          lightOn ? (color === 'white' ? 'bg-[#F5F2E8]' : 'bg-[#3d1414]') : 'bg-[#141714] border-[#3A3F3A]'
        )}
        data-testid="lantern-stage"
      >
        <div className="absolute inset-0 pointer-events-none" style={lightStyle} />
        {!lightOn && (
          <div className="text-center relative z-10">
            <Flashlight className="w-10 h-10 text-[#6A6860] mx-auto mb-3" />
            <div className="gd-label text-xs text-[#6A6860]">LANTERN OFF</div>
          </div>
        )}
        {mode === 'sos' && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-[10px] gd-label text-[#F44336] bg-[#1A1D1A]/80 px-3 py-1.5 rounded-full border border-[#F44336]/40">
            SOS SIGNALING · {color === 'red' ? 'RED' : 'WHITE'}
          </div>
        )}
      </div>

      <TCard className="p-4 mt-3">
        <div className="grid grid-cols-3 gap-2 mb-3">
          <button
            onClick={() => {
              clearTimers();
              setMode('off');
            }}
            className={cn('py-3 rounded-lg text-[10px] gd-label border transition-colors flex flex-col items-center gap-1',
              mode === 'off' ? 'bg-[#333833] border-[#4A504A] text-[#E8E4DC]' : 'bg-[#1E221E] border-[#3A3F3A] text-[#9A9890]')}
          >
            <Power className="w-4 h-4" /> OFF
          </button>
          <button
            onClick={() => {
              clearTimers();
              setMode('steady');
              vibrate(15);
            }}
            data-testid="lantern-steady"
            className={cn('py-3 rounded-lg text-[10px] gd-label border transition-colors flex flex-col items-center gap-1',
              mode === 'steady' ? 'bg-[#E8C04A] border-[#E8C04A] text-[#1A1D1A]' : 'bg-[#1E221E] border-[#3A3F3A] text-[#9A9890]')}
          >
            <Flashlight className="w-4 h-4" /> STEADY
          </button>
          <button
            onClick={() => {
              if (mode === 'sos') {
                clearTimers();
                setMode('off');
              } else {
                startSos();
              }
            }}
            data-testid="lantern-sos"
            className={cn('py-3 rounded-lg text-[10px] gd-label border transition-colors flex flex-col items-center gap-1',
              mode === 'sos' ? 'bg-[#F44336] border-[#F44336] text-white animate-pulse' : 'bg-[#1E221E] border-[#3A3F3A] text-[#9A9890]')}
          >
            <Siren className="w-4 h-4" /> SOS
          </button>
        </div>

        {lightOn && (
          <>
            <div className="flex gap-2 mb-3">
              {(['white', 'red'] as const).map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={cn('flex-1 py-2 rounded-lg text-[10px] gd-label border transition-colors',
                    color === c ? 'bg-[#333833] border-[#4A504A] text-[#E8E4DC]' : 'bg-[#1E221E] border-[#3A3F3A] text-[#9A9890]')}
                >
                  {c.toUpperCase()} LIGHT
                </button>
              ))}
            </div>
            <label className="block">
              <span className="text-[9px] gd-label text-[#6A6860] block mb-1">BRIGHTNESS</span>
              <input
                type="range"
                min={20}
                max={100}
                value={brightness}
                onChange={(e) => setBrightness(parseInt(e.target.value, 10))}
                className="w-full accent-[#D4822A]"
              />
            </label>
            <p className="text-[10px] text-[#6A6860] mt-2 leading-relaxed">
              Browser torch hardware isn't accessible from the web — use the screen
              at full brightness as your light source. Red mode preserves night vision.
            </p>
          </>
        )}
      </TCard>

      {mode === 'sos' && (
        <button
          onClick={() => {
            updateAlertLevel('red');
            navigator.vibrate?.([100, 50, 100]);
          }}
          className="w-full mt-3 py-3 rounded-xl bg-[#F44336] text-white text-xs gd-label font-bold"
          data-testid="lantern-escalate"
        >
          ESCALATE GROUP TO RED ALERT
        </button>
      )}
    </div>
  );
}
