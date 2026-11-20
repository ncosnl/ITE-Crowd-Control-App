import type { ReactNode } from 'react';
import { Icon } from '../icons';
import type { IconName } from '../icons';

export type ScreenKey = 'home' | 'places' | 'predictions' | 'assistant';

const NAV: { key: ScreenKey; label: string; icon: IconName }[] = [
  { key: 'home', label: 'Home', icon: 'home' },
  { key: 'places', label: 'Places', icon: 'pin' },
  { key: 'predictions', label: 'Predictions', icon: 'chart' },
  { key: 'assistant', label: 'Assistant', icon: 'chat' },
];

function StatusBar() {
  return (
    <div className="statusbar">
      <span className="statusbar-time">9:41</span>
      <span className="statusbar-icons">
        <Icon name="signal" size={15} strokeWidth={2.1} />
        <Icon name="wifi" size={15} strokeWidth={1.9} />
        <Icon name="battery" size={19} strokeWidth={1.6} />
      </span>
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
    <div className="phone">
      <StatusBar />
      <div className="phone-body">{children}</div>
      <nav className="bottom-nav" aria-label="Screens">
        {NAV.map((item) => (
          <button
            key={item.key}
            type="button"
            className={`nav-item${active === item.key ? ' active' : ''}`}
            aria-current={active === item.key ? 'page' : undefined}
            onClick={() => onNavigate(item.key)}
          >
            <Icon name={item.icon} size={19} strokeWidth={active === item.key ? 2.1 : 1.7} />
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
