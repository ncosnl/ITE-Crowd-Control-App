import type { ReactNode } from 'react';
import { Icon } from '../icons';
import type { IconName } from '../icons';
import { hapticTap } from '../native';

export type ScreenKey = 'home' | 'places' | 'predictions' | 'assistant';

const NAV: { key: ScreenKey; label: string; icon: IconName }[] = [
  { key: 'home', label: 'Home', icon: 'home' },
  { key: 'places', label: 'Places', icon: 'pin' },
  { key: 'predictions', label: 'Predictions', icon: 'chart' },
  { key: 'assistant', label: 'Assistant', icon: 'chat' },
];

function StatusBar() {
  return (
    <div className="flex items-center justify-between px-5 pt-[5px] h-7 text-[var(--ink)]">
      <span className="text-[11.5px] font-semibold tracking-[0.01em]">9:41</span>
      <div className="flex items-center gap-3">
        <Icon name="signal" size={15} strokeWidth={2.1} />
        <Icon name="wifi" size={15} strokeWidth={1.9} />
        <Icon name="battery" size={19} strokeWidth={1.6} />
      </div>
    </div>
  );
}

type Props = {
  children: ReactNode;
  active: ScreenKey;
  onNavigate: (screen: ScreenKey) => void;
};

export function Phone({ children, active, onNavigate }: Props) {
  return (
    <div className="flex flex-col overflow-hidden relative w-[320px] h-[704px] bg-[var(--phone)] border border-white/[0.85] rounded-[30px] shadow-[0_1px_2px_rgba(20,22,34,0.06),0_26px_48px_-26px_rgba(24,26,40,0.5)]">
      <StatusBar />
      <div className="flex-1 min-h-0 flex">{children}</div>
      <nav className="flex-none h-[58px] flex bg-[var(--surface)] border-t border-[var(--surface-line)]" aria-label="Screens">
        {NAV.map((item) => (
          <button
            key={item.key}
            type="button"
            className={`flex-1 flex flex-col items-center justify-center gap-4 p-0 border-0 bg-none text-[var(--ink-soft)] text-[9.5px] font-medium cursor-pointer transition-colors duration-150 ${active === item.key ? 'text-[var(--brand)] font-semibold' : ''}`}
            aria-current={active === item.key ? 'page' : undefined}
            onClick={() => {
              hapticTap();
              onNavigate(item.key);
            }}
          >
            <Icon name={item.icon} size={19} strokeWidth={active === item.key ? 2.1 : 1.7} />
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
