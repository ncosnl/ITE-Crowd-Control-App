import { Gauge } from '../components/Gauge';
import { MallArt } from '../components/MallArt';
import { MallPicker } from '../components/MallPicker';
import { formatTime, headlineOf } from '../data';
import type { Mall, Place } from '../data';
import { Icon } from '../icons';
import { useInstallPrompt } from '../install';

type Props = {
  mall: Mall;
  places: Place[];
  selected: Place;
  updatedAt: Date;
  dataSource: 'checking' | 'live' | 'estimated';
  onMallChange: (id: string) => void;
};

export function HomeScreen({ mall, selected, updatedAt, dataSource, onMallChange }: Props) {
  const filled = Math.max(1, Math.round((selected.pct / 100) * 5));
  const install = useInstallPrompt();
  const sourceLabel =
    dataSource === 'live' ? 'Live foot traffic' : dataSource === 'checking' ? 'Checking data…' : 'Estimated';

  return (
    <div className="screen">
      <div className="screen-scroll home-scroll">
        <header className="brand-row">
          <div className="brand-mark">
            <Icon name="crowd" size={24} />
          </div>
          <div className="brand-text">
            <h1 className="brand-name">Crowd Control</h1>
            <p className="brand-sub">
              Real-time crowd estimates for
              <br />
              Philippine malls
            </p>
          </div>
          {install.available && (
            <button
              type="button"
              className="install-btn"
              onClick={install.install}
              title="Install Crowd Control on this device"
            >
              <Icon name="download" size={14} strokeWidth={2} />
              <span>Install</span>
            </button>
          )}
        </header>

        <div className="field-label">MALL</div>
        <MallPicker mallId={mall.id} onChange={onMallChange} />

        <section className="card hero-card">
          <p className="eyebrow">Current crowd at</p>
          <h2 className="hero-place">{selected.name}</h2>

          <div className="hero-status">
            <span className={`status-text st-${selected.pct < 40 ? 'light' : selected.pct < 65 ? 'moderate' : 'busy'}`}>
              {headlineOf(selected.pct)}
            </span>
            <span className="people-row">
              {Array.from({ length: 5 }).map((_, index) => (
                <Icon
                  key={index}
                  name="person"
                  size={11}
                  className="person"
                  strokeWidth={0}
                />
              ))}
              <span className="people-fill" style={{ width: `${(filled / 5) * 100}%` }}>
                {Array.from({ length: 5 }).map((_, index) => (
                  <Icon key={index} name="person" size={11} strokeWidth={0} />
                ))}
              </span>
            </span>
          </div>

          <div className="gauge-wrap">
            <Gauge percent={selected.pct} />
          </div>

          <div className="gauge-caption">
            <div className="gauge-pct">
              {selected.pct}
              <span>%</span> <em>occupied</em>
            </div>
            <div className="gauge-when">Right now</div>
          </div>

          <div className="data-meta">
            <div className="updated-pill">
              <Icon name="clock" size={12} strokeWidth={1.9} />
              Last updated {formatTime(updatedAt)}
            </div>
            <span className={`source-chip${dataSource === 'live' ? ' is-live' : ''}`}>{sourceLabel}</span>
          </div>

          <div className="mall-art-wrap">
            <MallArt />
          </div>
        </section>
      </div>
    </div>
  );
}
