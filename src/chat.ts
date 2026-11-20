import { statusOf, walkLabel } from './data';
import type { Mall, Place } from './data';

export type ChatItem = {
  name: string;
  pct: number;
  status: string;
  walk: [number, number];
};

export type ChatMsg = {
  id: string;
  role: 'user' | 'bot';
  kind: 'text' | 'list';
  text?: string;
  title?: string;
  items?: ChatItem[];
};

let seq = 0;
const nextId = () => `msg-${++seq}`;

export const userMessage = (text: string): ChatMsg => ({
  id: nextId(),
  role: 'user',
  kind: 'text',
  text,
});

export const botMessage = (text: string): ChatMsg => ({
  id: nextId(),
  role: 'bot',
  kind: 'text',
  text,
});

const quietest = (places: Place[]) => [...places].sort((a, b) => a.pct - b.pct);

const itemOf = (place: Place): ChatItem => ({
  name: place.name,
  pct: place.pct,
  status: statusOf(place.pct),
  walk: place.walk,
});

export const quietPlacesMessage = (mall: Mall, places: Place[]): ChatMsg => ({
  id: nextId(),
  role: 'bot',
  kind: 'list',
  title: `Here are the least crowded places at ${mall.name} right now:`,
  items: quietest(places).slice(0, 3).map(itemOf),
});

const PEAK_WINDOWS = ['right now', '1 PM – 3 PM', '3 PM – 5 PM', '5 PM – 7 PM', '7 PM – 9 PM'];

const peakWindow = (place: Place): string => {
  let peak = 0;
  place.forecast.forEach((value, index) => {
    if (value > place.forecast[peak]) peak = index;
  });
  return PEAK_WINDOWS[peak];
};

const withIndefiniteArticle = (word: string) => (/^[aeiou]/i.test(word) ? `an ${word}` : `a ${word}`);

export function seedChat(mall: Mall, places: Place[]): ChatMsg[] {
  const quiet = quietest(places);
  const busiest = quiet[quiet.length - 1];
  const alternative = quiet[0];
  return [
    userMessage('Which place is less crowded right now?'),
    quietPlacesMessage(mall, places),
    userMessage('Is the food court busy?'),
    botMessage(
      `Yes, the food court is **busy right now (${busiest.pct}% occupied)**. Try the ${alternative.name.toLowerCase()} for a more comfortable meal.`,
    ),
  ];
}

const matchedPlace = (query: string, places: Place[]): Place | undefined =>
  places.find((place) => {
    const keys = [place.name.toLowerCase(), place.name.toLowerCase().replace(/^sm\s+/, '')];
    return keys.some((key) => query.includes(key));
  });

export function replyTo(rawQuery: string, mall: Mall, places: Place[]): ChatMsg {
  const query = rawQuery.toLowerCase().trim();
  const ranked = quietest(places);
  const calmest = ranked[0];
  const busiest = ranked[ranked.length - 1];

  if (/least|less crowd|quieter|quietest|emptiest|empty|calm|avoid/.test(query)) {
    return quietPlacesMessage(mall, places);
  }

  if (/peak|busiest time|best time|when|forecast|what time|today/.test(query)) {
    return botMessage(
      `Crowds at ${busiest.name} usually peak between **${peakWindow(busiest)}**. Right now it's at ${busiest.pct}%. If you can, plan your visit before 2 PM or after 8 PM for a smoother time.`,
    );
  }

  if (/busiest|most crowd|most packed|packed/.test(query)) {
    return botMessage(
      `The busiest spot at ${mall.name} right now is **${busiest.name} at ${busiest.pct}%**. ${calmest.name} is the calmest at ${calmest.pct}% — about a ${walkLabel(calmest.walk)}.`,
    );
  }

  const place = matchedPlace(query, places);
  if (place) {
    const status = statusOf(place.pct).toLowerCase();
    if (place.pct >= 60) {
      return botMessage(
        `${place.name} is **${status} right now (${place.pct}% occupied)**. Try ${calmest.name} instead — it's only ${calmest.pct}% occupied and a ${walkLabel(calmest.walk)} away.`,
      );
    }
    return botMessage(
      `${place.name} is **${status} right now (${place.pct}% occupied)** — ${withIndefiniteArticle('good')} time to head over. It's a ${walkLabel(place.walk)} from the mall entrance.`,
    );
  }

  if (/^(hi|hey|hello|help|what can you|how does)/.test(query)) {
    return botMessage(
      `I can check live crowd levels at ${mall.name}. Ask me things like “Which place is least crowded?”, “Is the cinema busy?” or “When is the food court busiest?”`,
    );
  }

  return botMessage(
    `Right now ${mall.name} is at about **${Math.round(
      places.reduce((total, p) => total + p.pct, 0) / places.length,
    )}% average occupancy**. ${calmest.name} is the calmest at ${calmest.pct}%, and ${busiest.name} is the busiest at ${busiest.pct}%. Ask me about any specific place.`,
  );
}

