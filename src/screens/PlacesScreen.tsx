import { statusOf, walkLabel } from '../data';
import type { Mall, Place } from '../data';
import { Icon } from '../icons';

type Props = {
  mall: Mall;
  places: Place[];
  onBack: () => void;
  onOpenPlace: (id: string) => void;
};

const toneClass = (place: Place) => `tone-${place.tone}`;

export function PlacesScreen({ mall, places, onBack, onOpenPlace }: Props) {
  const ranked = [...places].sort((a, b) => a.pct - b.pct);
  const calmest = ranked[0];
  const busiest = ranked[ranked.length - 1];

  return (
    <div className="screen">
      <div className="screen-scroll">
        <header className="screen-head">
          <button type="button" className="back-btn" onClick={onBack} aria-label="Back to home">
            <Icon name="arrowLeft" size={18} strokeWidth={2} />
          </button>
          <div className="screen-head-text">
            <h1>Places at {mall.name}</h1>
            <p>Live crowd levels</p>
          </div>
        </header>

        <div className="place-list">
          {places.map((place) => {
            const status = statusOf(place.pct);
            return (
              <button
                key={place.id}
                type="button"
                className="place-item"
                onClick={() => onOpenPlace(place.id)}
              >
                <span className={`place-icon ${toneClass(place)}`}>
                  <Icon name={place.icon} size={18} strokeWidth={1.9} />
                </span>
                <span className="place-info">
                  <span className="place-name">{place.name}</span>
                  <span className="place-level">{place.level}</span>
                </span>
                <span className="place-right">
                  <span className={`pill pill-${status.toLowerCase()}`}>{status}</span>
                  <span className="place-pct">{place.pct}%</span>
                </span>
                <Icon name="chevronRight" size={14} strokeWidth={2} className="place-chevron" />
              </button>
            );
          })}

          <button type="button" className="alert-card" onClick={() => onOpenPlace(busiest.id)}>
            <span className="alert-icon">
              <Icon name="alert" size={17} strokeWidth={1.9} />
            </span>
            <span className="alert-text">
              <span className="alert-title">
                {busiest.name} is busy — try the {calmest.name.toLowerCase()}.
              </span>
              <span className="alert-meta">
                About a {walkLabel(calmest.walk)} · Usually less crowded
              </span>
            </span>
            <Icon name="chevronRight" size={15} strokeWidth={2} className="alert-chevron" />
          </button>
        </div>
      </div>
    </div>
  );
}
