import { useState, useEffect, useRef } from 'react';
import { MIN_BEATS_PER_BAR, MAX_BEATS_PER_BAR } from '../../audio';
import styles from './BeatsPerBarControl.module.css';

interface Props {
  value: number;
  onChange: (val: number) => void;
}

const OPTIONS = Array.from(
  { length: MAX_BEATS_PER_BAR - MIN_BEATS_PER_BAR + 1 },
  (_, i) => MIN_BEATS_PER_BAR + i,
);

export function BeatsPerBarControl({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  return (
    <div className={styles.container} ref={containerRef}>
      <div className={styles.selectWrapper}>
        <button
          className={`${styles.trigger} ${open ? styles.triggerOpen : ''}`}
          onClick={() => setOpen(o => !o)}
        >
          {value}
        </button>
        {open && (
          <ul className={styles.dropdown}>
            {OPTIONS.map(n => (
              <li key={n}>
                <button
                  className={`${styles.option} ${n === value ? styles.selected : ''}`}
                  onClick={() => { onChange(n); setOpen(false); }}
                >
                  {n}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      <span className={styles.label}>Beats/bar</span>
    </div>
  );
}
