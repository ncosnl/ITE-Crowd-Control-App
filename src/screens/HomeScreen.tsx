import { Gauge } from '../components/Gauge';
import { MallArt } from '../components/MallArt';
import { MallPicker } from '../components/MallPicker';
import { formatTime, headlineOf } from '../data';
import type { Mall, Place } from '../data';
import { Icon } from '../icons';

type Props = {
  mall: Mall;
  places: Place[];
  selected: Place;
  updatedAt: Date;
  dataSource: 'checking' | 'live' | 'estimated';
  onMallChange: (id: string) => void;
  theme: 'light' | 'dark';
  onThemeToggle: () => void;
};

export function HomeScreen({ mall, selected, updatedAt, dataSource, onMallChange, theme, onThemeToggle }: Props) {
  const filled = Math.max(1, Math.round((selected.pct / 100) * 5));
  const sourceLabel =
    dataSource === 'live' ? 'Live foot traffic' : dataSource === 'checking' ? 'Checking data…' : 'Estimated';
  const isBusy = selected.pct < 40 ? 'light' : selected.pct < 65 ? 'moderate' : 'busy';

  return (
    <div className="flex-1 min-h-0 flex flex-col w-full relative">
      <div className="flex-1 min-h-0 overflow-y-auto p-[6px_16px_16px] scrollbar-none">
        <header className="flex items-center gap-10 mb-18 pt-2">
          <div className="flex-none size-[34px] grid place-items-center text-white rounded-[10px] bg-[var(--brand)]">
            <Icon name="crowd" size={24} />
          </div>
          <div className="min-w-0">
            <h1 className="m-0 text-[20px] font-bold tracking-[-0.03em] leading-1.15 text-[#22212a]">
              Crowd Control
            </h1>
            <p className="m-[2px_0_0] text-[10.5px] leading-1.3 tracking-[0.005em] text-[#9498a4] whitespace-nowrap overflow-hidden text-ellipsis">
              Live crowd data for Philippine malls
            </p>
          </div>
          <button
            type="button"
            className="ml-auto flex-none size-[32px] grid place-items-center rounded-8 border-0 bg-[#f0ede7] text-[#4b4d57] cursor-pointer transition-all duration-150 tap-highlight-transparent active:scale-92"
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            onClick={onThemeToggle}
          >
            <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={20} strokeWidth={2} />
          </button>
        </header>

        <div className="m-0 mb-7 ml-2 text-[9.5px] font-semibold tracking-[0.1em] text-[#9a9da7]">MALL</div>
        <MallPicker mallId={mall.id} onChange={onMallChange} />

        <section className="flex-1 min-h-0 flex flex-col items-center p-[16px_16px_0] overflow-hidden rounded-[18px] border border-[#f0ede7]/0.9 bg-white shadow-[0_1px_2px_rgba(24,26,38,0.05),0_14px_26px_-24px_rgba(24,26,38,0.6)]">
          <p className="m-0 self-start text-[11px] text-[#9599a4]">Current crowd at</p>
          <h2 className="m-[2px_0_0] self-start text-[16px] font-semibold tracking-[-0.01em]">
            {selected.name}
          </h2>

          <div className="mt-9 self-start flex items-center gap-10">
            <span className={`text-[13px] font-medium ${isBusy === 'light' ? 'text-[#1f9d8f]' : isBusy === 'moderate' ? 'text-[#dc7a2a]' : 'text-[#d95a33]'}`}>
              {headlineOf(selected.pct)}
            </span>
            <span className="relative flex gap-2 w-[63px] h-[11px] text-[#f3d8c4]">
              {Array.from({ length: 5 }).map((_, index) => (
                <Icon
                  key={index}
                  name="person"
                  size={11}
                  strokeWidth={0}
                  className="flex-none"
                />
              ))}
              <span className="absolute inset-0 flex gap-2 overflow-hidden text-[var(--brand)]" style={{ width: `${(filled / 5) * 100}%` }}>
                {Array.from({ length: 5 }).map((_, index) => (
                  <Icon key={index} name="person" size={11} strokeWidth={0} className="flex-none" />
                ))}
              </span>
            </span>
          </div>

          <div className="w-full max-w-[290px] mx-auto mt-14 flex justify-center">
            <Gauge percent={selected.pct} />
          </div>

          <div className="text-center mt-4">
            <div className="text-[30px] font-extrabold tracking-[-0.04em] leading-1.05 text-[#232229]">
              {selected.pct}
              <span className="text-[19px]">%</span> <em className="text-[11.5px] font-medium tracking-[0] text-[#8e929d]">occupied</em>
            </div>
            <div className="mt-4 text-[11px] text-[#9a9ea8]">Right now</div>
          </div>

          <div className="flex items-center flex-wrap gap-7 mt-11">
            <div className="inline-flex items-center gap-5 px-10 py-4.5 rounded-full border border-[#f0ede7] bg-[#f8f6f2] text-[#9a9ea8] text-[9.5px] whitespace-nowrap">
              <Icon name="clock" size={12} strokeWidth={1.9} />
              Last updated {formatTime(updatedAt)}
            </div>
            <span className={`inline-flex items-center gap-4 px-9 py-4.5 rounded-full border border-[#f0ede7] bg-[#f8f6f2] text-[#9a9ea8] text-[9.5px] whitespace-nowrap ${dataSource === 'live' ? 'border-[rgba(31,157,143,0.28)] bg-[rgba(31,157,143,0.1)] text-[#17796e] font-semibold animate-live-pulse' : ''}`}>
              {sourceLabel}
            </span>
          </div>

          <div className="w-[calc(100%+32px)] mx-auto mt-[-16px] -mb-16 pt-12 animate-art-reveal opacity-0">
            <MallArt />
          </div>
        </section>
      </div>
    </div>
  );
}
