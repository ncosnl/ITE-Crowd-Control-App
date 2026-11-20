import { useEffect, useRef, useState } from 'react';
import { Icon } from '../icons';
import { MALLS } from '../data';

type Props = {
  mallId: string;
  onChange: (id: string) => void;
};

export function MallPicker({ mallId, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const selected = MALLS.find((mall) => mall.id === mallId) ?? MALLS[0];

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  return (
    <div className="mall-picker" ref={rootRef}>
      <button
        type="button"
        className={`mall-picker-btn${open ? ' open' : ''}`}
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="mall-badge" style={{ background: selected.accent }}>
          {selected.short}
        </span>
        <span className="mall-picker-label">{selected.name}</span>
        <span className="mall-picker-chevron">
          <Icon name="chevronDown" size={16} strokeWidth={2} />
        </span>
      </button>

      {open && (
        <div className="mall-menu" role="listbox" aria-label="Select a mall">
          {MALLS.map((mall) => (
            <button
              key={mall.id}
              type="button"
              role="option"
              aria-selected={mall.id === mallId}
              className={`mall-option${mall.id === mallId ? ' selected' : ''}`}
              onClick={() => {
                onChange(mall.id);
                setOpen(false);
              }}
            >
              <span className="mall-badge" style={{ background: mall.accent }}>
                {mall.short}
              </span>
              <span>{mall.name}</span>
              {mall.id === mallId && (
                <span className="mall-check">
                  <Icon name="chevronRight" size={14} strokeWidth={2.2} />
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
