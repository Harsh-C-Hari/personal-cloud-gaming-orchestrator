/**
 * lib/motion/scrollContainerContext.jsx
 *
 * Lightweight React context that carries a ref to the `<main>` scroll
 * container inside MainContent. Consumers (Phase 4's list stagger, count-up)
 * use this ref as the `scroller` option for ScrollTrigger, so triggers are
 * measured against the correct scrollable element rather than window.
 *
 * Usage:
 *   // In a consumer component:
 *   const scrollContainerRef = useScrollContainer();
 *   // Then pass to ScrollTrigger:
 *   ScrollTrigger.create({ scroller: scrollContainerRef.current, ... });
 */
import { createContext, useContext } from "react";

export const ScrollContainerContext = createContext(null);

/**
 * useScrollContainer()
 * Returns the React ref { current: HTMLElement } for the main scroll
 * container. Will be null if called outside a MainContent tree (e.g., Login).
 */
export function useScrollContainer() {
  return useContext(ScrollContainerContext);
}
