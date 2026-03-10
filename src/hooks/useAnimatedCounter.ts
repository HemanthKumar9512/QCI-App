import { useEffect, useRef } from 'react';

export function useAnimatedCounter(target: number, duration: number = 1000): number {
  const ref = useRef(0);
  const startRef = useRef(0);
  const startTimeRef = useRef<number | null>(null);
  const frameRef = useRef<number>(0);
  const [value, setValue] = React.useState(0);

  React.useEffect(() => {
    startRef.current = ref.current;
    startTimeRef.current = null;

    function animate(timestamp: number) {
      if (startTimeRef.current === null) startTimeRef.current = timestamp;
      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      const current = startRef.current + (target - startRef.current) * eased;
      ref.current = current;
      setValue(current);
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      }
    }
    frameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameRef.current);
  }, [target, duration]);

  return value;
}

import React from 'react';
