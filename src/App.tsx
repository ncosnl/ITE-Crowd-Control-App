import { useEffect, useMemo, useRef, useState } from 'react';
import type { ReactElement } from 'react';
import { Phone } from './components/Phone';
import type { ScreenKey } from './components/Phone';
import { FORECAST_HOURS, MALLS } from './data';
import type { Place } from './data';
import { botMessage, replyTo, seedChat, userMessage } from './chat';
import type { ChatMsg } from './chat';
import { statusOf } from './data';
import { fetchLiveCrowd, forecastLabels, streamAssistant } from './live';
import type { ChatTurn, LiveCrowd } from './live';
import { HomeScreen } from './screens/HomeScreen';
import { PlacesScreen } from './screens/PlacesScreen';
import { PredictionsScreen } from './screens/PredictionsScreen';
import { AssistantScreen } from './screens/AssistantScreen';

function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(() =>
    typeof window === 'undefined' ? true : window.matchMedia(query).matches,
  );

  useEffect(() => {
    const media = window.matchMedia(query);
    const update = () => setMatches(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, [query]);

  return matches;
}

const initialLive = () => {
  const map: Record<string, number> = {};
  MALLS.forEach((mall) => mall.places.forEach((place) => (map[place.id] = place.pct)));
  return map;
};

const SCREEN_LABELS: { key: ScreenKey; label: string }[] = [
  { key: 'home', label: 'Home' },
  { key: 'places', label: 'Places' },
  { key: 'predictions', label: 'Predictions' },
  { key: 'assistant', label: 'Assistant' },
];

export default function App() {
  // An installed window shows one screen, not the four-phone showcase.
  const standalone = useMediaQuery('(display-mode: standalone)');
  // The Android shell draws its own system status bar, so the mock one goes.
  const native = import.meta.env.VITE_NATIVE === 'true';
  const isWide = useMediaQuery('(min-width: 1024px)') && !standalone && !native;
  const [mallId, setMallId] = useState(MALLS[0].id);
  const [placeId, setPlaceId] = useState(MALLS[0].places[0].id);
  const [screen, setScreen] = useState<ScreenKey>('home');
  const [livePcts, setLivePcts] = useState<Record<string, number>>(initialLive);
  const [liveCrowd, setLiveCrowd] = useState<Record<string, LiveCrowd>>({});
  const [dataSource, setDataSource] = useState<'checking' | 'live' | 'estimated'>('checking');
  const [updatedAt, setUpdatedAt] = useState(() => new Date());
  const [messages, setMessages] = useState<ChatMsg[]>(() => seedChat(MALLS[0], MALLS[0].places));
  const [typing, setTyping] = useState(false);

  const mall = MALLS.find((item) => item.id === mallId) ?? MALLS[0];

  const liveRef = useRef<Record<string, LiveCrowd>>({});
  liveRef.current = liveCrowd;
  // Bumped when the conversation is reset, so late replies are dropped.
  const chatToken = useRef(0);

  const places: Place[] = useMemo(
    () =>
      mall.places.map((place) => {
        const live = liveCrowd[place.id];
        if (live?.source === 'besttime' && typeof live.pct === 'number' && live.forecast?.length === 5) {
          return {
            ...place,
            pct: live.pct,
            forecast: live.forecast as Place['forecast'],
            hourLabels: forecastLabels(live.hours),
          };
        }
        return { ...place, pct: livePcts[place.id] ?? place.pct };
      }),
    [mall, livePcts, liveCrowd],
  );

  const selected = places.find((place) => place.id === placeId) ?? places[0];

  // Live crowd data comes from the local API (server/index.mjs). When it is not
  // configured or the request fails, the estimates above keep the app usable.
  useEffect(() => {
    const controller = new AbortController();
    const ids = mall.places.map((place) => place.id);
    let cancelled = false;

    const load = async () => {
      const data = await fetchLiveCrowd(ids, controller.signal);
      if (cancelled) return;
      if (!data) {
        setDataSource('estimated');
        return;
      }
      const live = Object.fromEntries(
        Object.entries(data).filter(([, entry]) => entry.source === 'besttime' && typeof entry.pct === 'number'),
      );
      setLiveCrowd((previous) => ({ ...previous, ...live }));
      setDataSource(Object.keys(live).length > 0 ? 'live' : 'estimated');
    };

    void load();
    const timer = window.setInterval(load, 5 * 60 * 1000);
    return () => {
      cancelled = true;
      controller.abort();
      window.clearInterval(timer);
    };
  }, [mall.id]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setLivePcts((previous) => {
        const next = { ...previous };
        MALLS.forEach((item) =>
          item.places.forEach((place) => {
            // Places with live data must not drift away from the real numbers.
            if (liveRef.current[place.id]?.source === 'besttime') return;
            const base = next[place.id] ?? place.pct;
            const drift = Math.round((Math.random() - 0.5) * 7);
            next[place.id] = Math.max(6, Math.min(96, base + drift));
          }),
        );
        return next;
      });
      setUpdatedAt(new Date());
    }, 30000);
    return () => window.clearInterval(timer);
  }, []);

  const dataUpdatedAt = useMemo(() => {
    const stamps = mall.places
      .map((place) => liveCrowd[place.id]?.updatedAt)
      .filter((stamp): stamp is string => Boolean(stamp))
      .map((stamp) => new Date(stamp).getTime());
    return stamps.length ? new Date(Math.max(...stamps)) : updatedAt;
  }, [mall, liveCrowd, updatedAt]);

  const changeMall = (id: string) => {
    const nextMall = MALLS.find((item) => item.id === id) ?? MALLS[0];
    setMallId(nextMall.id);
    setPlaceId(nextMall.places[0].id);
    chatToken.current += 1;
    setMessages(seedChat(nextMall, nextMall.places));
    setTyping(false);
  };

  const openPlace = (id: string) => {
    setPlaceId(id);
    setScreen('predictions');
  };

  const navigate = (key: ScreenKey) => {
    setScreen(key);
    if (isWide) {
      document.getElementById(`col-${key}`)?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  };

  const send = async (text: string) => {
    if (typing) return;
    const token = ++chatToken.current;

    const history: ChatTurn[] = messages
      .filter((message) => message.kind === 'text' && message.text)
      .slice(-10)
      .map((message) => ({ role: message.role === 'user' ? 'user' : 'assistant', content: message.text ?? '' }));

    setMessages((previous) => [...previous, userMessage(text)]);
    setTyping(true);

    let streamed = false;
    const reply = await streamAssistant(
      [...history, { role: 'user', content: text }],
      {
        mallName: mall.name,
        localTime: new Intl.DateTimeFormat('en-US', {
          timeZone: 'Asia/Manila',
          weekday: 'long',
          hour: 'numeric',
          minute: '2-digit',
        }).format(new Date()),
        places: places.map((place) => ({
          name: place.name,
          level: place.level,
          pct: place.pct,
          status: statusOf(place.pct),
          walk: place.walk,
          forecast: place.forecast,
          labels: place.hourLabels ?? FORECAST_HOURS,
        })),
      },
      (delta) => {
        if (token !== chatToken.current) return;
        if (!streamed) {
          // First visible fragment: open the bubble and drop the typing dots.
          if (!delta.trim()) return;
          streamed = true;
          setMessages((previous) => [...previous, botMessage(delta.replace(/^\s+/, ''))]);
          return;
        }
        setMessages((previous) =>
          previous.map((message, index) =>
            index === previous.length - 1 ? { ...message, text: `${message.text ?? ''}${delta}` } : message,
          ),
        );
      },
    );

    if (token !== chatToken.current) return;
    setMessages((previous) =>
      streamed
        ? previous
        : [...previous, reply ? botMessage(reply) : replyTo(text, mall, places)],
    );
    setTyping(false);
  };

  const screens: Record<ScreenKey, ReactElement> = {
    home: (
      <HomeScreen
        mall={mall}
        places={places}
        selected={selected}
        updatedAt={dataUpdatedAt}
        dataSource={dataSource}
        onMallChange={changeMall}
      />
    ),
    places: (
      <PlacesScreen mall={mall} places={places} onBack={() => navigate('home')} onOpenPlace={openPlace} />
    ),
    predictions: (
      <PredictionsScreen
        mall={mall}
        places={places}
        selected={selected}
        updatedAt={dataUpdatedAt}
        onBack={() => navigate('places')}
      />
    ),
    assistant: (
      <AssistantScreen
        mallName={mall.name}
        messages={messages}
        typing={typing}
        onSend={send}
      />
    ),
  };

  if (!isWide) {
    return (
      <main className={`stage solo${native ? ' native' : ''}`}>
        <Phone active={screen} onNavigate={navigate}>
          {screens[screen]}
        </Phone>
      </main>
    );
  }

  return (
    <main className="stage">
      <div className="showcase">
        {SCREEN_LABELS.map((item) => (
          <div className="col" id={`col-${item.key}`} key={item.key}>
            <div className={`col-label${screen === item.key ? ' focused' : ''}`}>{item.label}</div>
            <Phone active={item.key} onNavigate={navigate}>
              {screens[item.key]}
            </Phone>
          </div>
        ))}
      </div>
    </main>
  );
}
