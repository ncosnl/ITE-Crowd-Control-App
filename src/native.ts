import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';

/** Light haptic tap for buttons / nav taps. */
export const hapticTap = () => {
  if (typeof window === 'undefined' || !('Capacitor' in window)) return;
  void Haptics.impact({ style: ImpactStyle.Light });
};

/** Heavier haptic for destructive / confirm actions. */
export const hapticMedium = () => {
  if (typeof window === 'undefined' || !('Capacitor' in window)) return;
  void Haptics.impact({ style: ImpactStyle.Medium });
};

/** Apply native status bar + splash screen styling based on the current theme. */
export const applyNativeChrome = (theme: 'light' | 'dark') => {
  if (typeof window === 'undefined' || !('Capacitor' in window)) return;

  const isDark = theme === 'dark';
  const bg = isDark ? '#0a0b0f' : '#faf9f7';

  void StatusBar.setBackgroundColor({ color: bg });
  void StatusBar.setStyle({ style: isDark ? Style.Light : Style.Dark });
  void SplashScreen.hide();
};
