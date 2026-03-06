import { useState, useEffect, useRef, useCallback } from 'react';
import { clamp } from '../../utils';
import styles from './TempoControl.module.css';

interface Props {
  tempo: number;
  min: number;
  max: number;
  onChange: (tempo: number) => void;
}

export function TempoControl({ tempo, min, max, onChange }: Props) {
  const [displayTempo, setDisplayTempoState] = useState(tempo);
  const [inputValue, setInputValue] = useState(String(tempo));
  const displayTempoRef = useRef(tempo);
  const wheelTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const setDisplayTempo = (val: number) => {
    displayTempoRef.current = val;
    setDisplayTempoState(val);
  };

  // Sync when tempo is changed externally (e.g. future controls)
  useEffect(() => {
    setDisplayTempo(tempo);
    setInputValue(String(tempo));
  }, [tempo]);

  const commit = useCallback((val: number) => {
    onChange(clamp(Math.round(isNaN(val) ? tempo : val), min, max));
  }, [onChange, tempo, min, max]);

  // Number input handlers
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleInputCommit = () => {
    commit(parseInt(inputValue, 10));
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleInputCommit();
  };

  // Slider handlers — onChange fires on every movement in React (native `input` event)
  const handleSliderMove = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    setDisplayTempo(val);
    setInputValue(String(val));
  };

  // onMouseUp/onTouchEnd fire on release, equivalent to native `change` event
  const handleSliderCommit = () => {
    commit(displayTempoRef.current);
  };

  // Wheel handler — uses ref to avoid stale closure on rapid scroll
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 1 : -1;
    const newVal = clamp(displayTempoRef.current + delta, min, max);
    setDisplayTempo(newVal);
    setInputValue(String(newVal));
    if (wheelTimerRef.current) clearTimeout(wheelTimerRef.current);
    wheelTimerRef.current = setTimeout(() => onChange(newVal), 300);
  }, [min, max, onChange]);

  return (
    <div className={styles.tempoControl}>
      <div className={styles.tempoDisplay}>
        <input
          className={styles.tempoInput}
          type="number"
          value={inputValue}
          min={min}
          max={max}
          onChange={handleInputChange}
          onBlur={handleInputCommit}
          onKeyDown={handleInputKeyDown}
          onWheel={handleWheel}
        />
        <span className={styles.bpmLabel}>BPM</span>
      </div>
      <input
        className={styles.tempoSlider}
        type="range"
        value={displayTempo}
        min={min}
        max={max}
        onChange={handleSliderMove}
        onMouseUp={handleSliderCommit}
        onTouchEnd={handleSliderCommit}
        onWheel={handleWheel}
      />
    </div>
  );
}
