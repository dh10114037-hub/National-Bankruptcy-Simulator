/**
 * PortalTooltip - 使用 React Portal 将 tooltip 渲染到 body
 * 解决 z-index stacking context 导致的 tooltip 被遮挡问题
 */

import { useEffect, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

interface PortalTooltipProps {
  children: ReactNode;
  visible: boolean;
  anchorRef: React.RefObject<HTMLElement | null>;
  position?: 'right' | 'left';
}

export function PortalTooltip({ children, visible, anchorRef, position = 'right' }: PortalTooltipProps) {
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);

  useEffect(() => {
    if (!visible || !anchorRef.current) {
      setCoords(null);
      return;
    }

    const updateCoords = () => {
      if (!anchorRef.current) return;
      const rect = anchorRef.current.getBoundingClientRect();
      const gap = 12; // ml-3 = 12px gap

      if (position === 'right') {
        setCoords({
          top: rect.top,
          left: rect.right + gap,
        });
      } else {
        setCoords({
          top: rect.top,
          left: rect.left - 200 - gap, // 假设 tooltip 宽度 200px
        });
      }
    };

    updateCoords();

    // 滚动时更新位置
    window.addEventListener('scroll', updateCoords, true);
    window.addEventListener('resize', updateCoords);

    return () => {
      window.removeEventListener('scroll', updateCoords, true);
      window.removeEventListener('resize', updateCoords);
    };
  }, [visible, anchorRef, position]);

  if (!visible || !coords) return null;

  return createPortal(
    <div
      className="fixed z-[9999] w-48 rounded-xl border border-amber-200 bg-white shadow-lg p-3 pointer-events-none"
      style={{
        top: coords.top,
        left: coords.left,
      }}
    >
      {children}
    </div>,
    document.body
  );
}
