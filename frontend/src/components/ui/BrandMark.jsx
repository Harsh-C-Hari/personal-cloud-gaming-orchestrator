/**
 * components/ui/BrandMark.jsx
 *
 * The 3-bar equalizer mark — the app's visual identity anchor. Extracted
 * from Login.jsx and DashboardHeader.jsx into a single shared component.
 *
 * Props:
 *   scale  "lg" (default) — Login's scale: heights [10,17,25], container 28px
 *          "sm"           — Header's scale: heights [8,14,20], container 22px
 *
 * Idle animation (Phase 4.2): the 3 bars gently oscillate scaleY on an
 * independent loop per bar, creating an equalizer breathing effect. Pauses
 * under prefers-reduced-motion. Killed on unmount.
 */
import { useRef, useEffect } from "react";
import { colors } from "../../dashboard/theme.js";
import { initMotion } from "../../lib/motion/gsapSetup.js";
import { prefersReducedMotion } from "../../lib/motion/reducedMotion.js";

const SCALE_CONFIG = {
  lg: { heights: [10, 17, 25], containerHeight: 28, barWidth: 4 },
  sm: { heights: [8, 14, 20], containerHeight: 22, barWidth: 3 },
};

// Idle animation parameters per bar — staggered durations create organic motion.
const IDLE_CONFIG = [
  { duration: 2.8, yoyo: true, repeat: -1, scaleY: 0.6, ease: "sine.inOut", delay: 0 },
  { duration: 2.2, yoyo: true, repeat: -1, scaleY: 0.5, ease: "sine.inOut", delay: 0.4 },
  { duration: 3.2, yoyo: true, repeat: -1, scaleY: 0.7, ease: "sine.inOut", delay: 0.2 },
];

export function BrandMark({ scale = "lg" }) {
  const config = SCALE_CONFIG[scale] ?? SCALE_CONFIG.lg;
  const barRefs = [useRef(null), useRef(null), useRef(null)];
  const animsRef = useRef([]);

  useEffect(() => {
    if (prefersReducedMotion()) return;

    let anims = [];

    initMotion().then(({ gsap }) => {
      anims = barRefs.map((ref, i) => {
        if (!ref.current) return null;
        return gsap.to(ref.current, {
          scaleY: IDLE_CONFIG[i].scaleY,
          duration: IDLE_CONFIG[i].duration,
          repeat: IDLE_CONFIG[i].repeat,
          yoyo: IDLE_CONFIG[i].yoyo,
          ease: IDLE_CONFIG[i].ease,
          delay: IDLE_CONFIG[i].delay,
          transformOrigin: "bottom",
        });
      });
      animsRef.current = anims;
    });

    return () => {
      animsRef.current.forEach((a) => a?.kill());
      animsRef.current = [];
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // mount-only — barRefs are stable

  return (
    <div
      aria-hidden="true"
      style={{
        display: "inline-flex",
        alignItems: "flex-end",
        gap: 2,
        height: config.containerHeight,
      }}
    >
      {config.heights.map((height, index) => (
        <span
          key={height}
          ref={barRefs[index]}
          style={{
            width: config.barWidth,
            height,
            borderRadius: 2,
            background: index === 2 ? colors.brand : colors.inkDim,
            display: "block",
            transformOrigin: "bottom",
          }}
        />
      ))}
    </div>
  );
}
