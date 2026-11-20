import { ForecastChart } from '../components/ForecastChart';
import { FORECAST_HOURS, formatTime, headlineOf, statusOf, walkLabel } from '../data';
import type { Mall, Place } from '../data';
import { Icon } from '../icons';

type Props = {
  mall: Mall;
  places: Place[];
  selected: Place;
  updatedAt: Date;
  onBack: () => void;
};

export function PredictionsScreen({ mall, places, selected, updatedAt, onBack }: Props) {
  const average = Math.round(selected.forecast.reduce((total, value) => total + value, 0) / selected.forecast.length);
  const hourLabels = selected.hourLabels ?? FORECAST_HOURS;
  const peakIndex = selected.forecast.indexOf(Math.max(...selected.forecast));
  const peakHour = hourLabels[peakIndex];
  const peakValue = selected.forecast[peakIndex];
  const calmest = [...places].sort((a, b) => a.pct - b.pct)[0];
  const status = statusOf(selected.pct);

  return (
    <div className="screen">
      <div className="screen-scroll">
        <header className="screen-head">
          <button type="button" className="back-btn" onClick={onBack} aria-label="Back to places">
            <Icon name="arrowLeft" size={18} strokeWidth={2} />
          </button>
          <div className="screen-head-text">
            <h1>Predictions</h1>
            <p>
              {selected.name} · {mall.name}
            </p>
          </div>
        </header>

        <div className="pred-stack">
          <section className="card pred-card">
            <span className={`place-icon ${`tone-${selected.tone}`}`}>
              <Icon name={selected.icon} size={20} strokeWidth={1.9} />
            </span>
            <span className="pred-info">
              <span className="pred-name">{selected.name}</span>
              <span className="place-level">{selected.level}</span>
            </span>
            <span className="pred-right">
              <span className={`pred-status st-${status.toLowerCase()}`}>{headlineOf(selected.pct)}</span>
              <span className="pred-pct">{selected.pct}% now</span>
            </span>
          </section>

          <section className="card forecast-card">
            <div className="forecast-head">
              <span>Today&apos;s crowd forecast</span>
              <strong>{average}%</strong>
            </div>

            <ForecastChart values={selected.forecast} labels={hourLabels} />

            <div className="chart-callout">
              <span className="callout-icon">
                <Icon name="alert" size={16} strokeWidth={1.9} />
              </span>
              <p>
                Crowds usually peak around <strong>{peakHour}</strong>.
                {peakValue >= 80 ? ' Plan ahead for a smoother visit.' : ' Expect a steady afternoon.'}
              </p>
            </div>
          </section>

          <div className="forecast-footer">
            <div className="updated-pill">
              <Icon name="clock" size={12} strokeWidth={1.9} />
              Last updated {formatTime(updatedAt)}
            </div>
            <p className="forecast-tip">
              Least crowded right now: <strong>{calmest.name}</strong> ({calmest.pct}%, {walkLabel(calmest.walk)})
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
