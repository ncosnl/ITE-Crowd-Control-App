import type { ReactNode } from 'react';

export type IconName =
  | 'crowd'
  | 'utensils'
  | 'cart'
  | 'bag'
  | 'film'
  | 'gamepad'
  | 'bowl'
  | 'sparkle'
  | 'home'
  | 'pin'
  | 'chart'
  | 'chat'
  | 'chevronRight'
  | 'chevronDown'
  | 'arrowLeft'
  | 'clock'
  | 'walk'
  | 'alert'
  | 'send'
  | 'download'
  | 'person'
  | 'signal'
  | 'wifi'
  | 'battery';

const PATHS: Record<IconName, ReactNode> = {
  crowd: (
    <>
      <circle cx="12" cy="7.6" r="2.5" fill="currentColor" stroke="none" />
      <path d="M7.4 15.6c0-2.4 2.1-3.8 4.6-3.8s4.6 1.4 4.6 3.8v1.2H7.4z" fill="currentColor" stroke="none" />
      <circle cx="5.2" cy="9.4" r="1.7" fill="currentColor" stroke="none" opacity=".75" />
      <path d="M2.4 15.2c0-1.7 1.4-2.7 3.1-2.7.6 0 1.1.1 1.6.3-.6.7-1 1.6-1 2.6v1.4H2.4z" fill="currentColor" stroke="none" opacity=".75" />
      <circle cx="18.8" cy="9.4" r="1.7" fill="currentColor" stroke="none" opacity=".75" />
      <path d="M21.6 15.2c0-1.7-1.4-2.7-3.1-2.7-.6 0-1.1.1-1.6.3.6.7 1 1.6 1 2.6v1.4h3.7z" fill="currentColor" stroke="none" opacity=".75" />
    </>
  ),
  utensils: (
    <>
      <path d="M7.4 3v6.4a2 2 0 0 0 4 0V3" />
      <path d="M9.4 9.4V21" />
      <path d="M17 3.2c-1.6 1.6-2.3 3.6-2.3 6.1 0 1.7.8 2.8 2.3 3.3V21" />
    </>
  ),
  cart: (
    <>
      <path d="M2.6 4.2h2.2l2.4 10.3a1.9 1.9 0 0 0 1.9 1.5h8.3a1.9 1.9 0 0 0 1.9-1.5L21 7.6H6.2" />
      <circle cx="10" cy="20" r="1.4" />
      <circle cx="18" cy="20" r="1.4" />
    </>
  ),
  bag: (
    <>
      <path d="M4.5 8.4h15L18.4 20H5.6z" />
      <path d="M9 8.4V7a3 3 0 0 1 6 0v1.4" />
    </>
  ),
  film: (
    <>
      <rect x="2.8" y="4.6" width="18.4" height="14.8" rx="2.2" />
      <path d="M7.5 4.6v14.8M16.5 4.6v14.8M2.8 9.6h4.7M2.8 14.4h4.7M16.5 9.6h4.7M16.5 14.4h4.7" />
    </>
  ),
  gamepad: (
    <>
      <rect x="2.4" y="7" width="19.2" height="10" rx="4.2" />
      <path d="M7.4 10.1v3.8M5.5 12h3.8" />
      <circle cx="15.9" cy="10.9" r=".95" fill="currentColor" stroke="none" />
      <circle cx="18.1" cy="13.4" r=".95" fill="currentColor" stroke="none" />
    </>
  ),
  bowl: (
    <>
      <path d="M3.4 11.4h17.2a8.6 8.6 0 0 1-17.2 0Z" />
      <path d="M9.4 7.9c0-1.5 1.2-1.9 1.2-3.3M13.4 7.9c0-1.5 1.2-1.9 1.2-3.3" />
    </>
  ),
  sparkle: (
    <path
      d="M12 2.6l1.9 5.5 5.5 1.9-5.5 1.9L12 17.4l-1.9-5.5-5.5-1.9 5.5-1.9z"
      fill="currentColor"
      stroke="none"
    />
  ),
  home: (
    <path d="M4 10.4 12 4l8 6.4V20a1 1 0 0 1-1 1h-4.2v-6H9.2v6H5a1 1 0 0 1-1-1z" />
  ),
  pin: (
    <>
      <path d="M12 21s6.4-6 6.4-11a6.4 6.4 0 1 0-12.8 0C5.6 15 12 21 12 21Z" />
      <circle cx="12" cy="10" r="2.3" />
    </>
  ),
  chart: <path d="M5 20v-8M12 20V5M19 20v-5" />,
  chat: <path d="M20.4 11.6a8 8 0 0 1-11.7 7.1L4.2 20.4l1.8-4.8a8 8 0 1 1 14.4-4Z" />,
  chevronRight: <path d="M9.6 5.6 16 12l-6.4 6.4" />,
  chevronDown: <path d="M5.6 9.6 12 16l6.4-6.4" />,
  arrowLeft: <path d="M19 12H5M11 6l-6 6 6 6" />,
  clock: (
    <>
      <circle cx="12" cy="12" r="8.6" />
      <path d="M12 7.4v5l3.2 2" />
    </>
  ),
  walk: (
    <>
      <circle cx="13.2" cy="4.6" r="1.8" fill="currentColor" stroke="none" />
      <path d="M11 21l1.4-5.5-2.2-2.1.9-4.6 3.2-.8 2 3.1 2.6 1M12.4 15.5 14.6 21" />
    </>
  ),
  alert: (
    <>
      <path d="M18 9.2a6 6 0 1 0-12 0c0 4.4-1.8 5.6-1.8 5.6h15.6S18 13.6 18 9.2Z" />
      <path d="M10 18.4a2.2 2.2 0 0 0 4 0" />
    </>
  ),
  send: <path d="M12 19.4V5M6.4 10.6 12 5l5.6 5.6" />,
  download: <path d="M12 4v10.4M7.4 10 12 14.6 16.6 10M4.8 19.6h14.4" />,
  person: (
    <>
      <circle cx="12" cy="8.4" r="2.9" fill="currentColor" stroke="none" />
      <path d="M5.6 19.4c0-3.1 2.9-5.1 6.4-5.1s6.4 2 6.4 5.1z" fill="currentColor" stroke="none" />
    </>
  ),
  signal: <path d="M3 18.5v-4M8 18.5v-7M13 18.5v-10M18 18.5V6" />,
  wifi: (
    <>
      <path d="M3 9a15 15 0 0 1 18 0M6.2 12.6a10 10 0 0 1 11.6 0M9.2 16.2a5 5 0 0 1 5.6 0" />
      <circle cx="12" cy="19.2" r="1" fill="currentColor" stroke="none" />
    </>
  ),
  battery: (
    <>
      <rect x="2" y="8" width="18" height="8" rx="2.4" />
      <rect x="4" y="10" width="12" height="4" rx="1" fill="currentColor" stroke="none" />
      <path d="M22 11v2" />
    </>
  ),
};

type Props = {
  name: IconName;
  size?: number;
  strokeWidth?: number;
  className?: string;
};

export function Icon({ name, size = 18, strokeWidth = 1.8, className }: Props) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {PATHS[name]}
    </svg>
  );
}
