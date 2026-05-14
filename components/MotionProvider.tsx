"use client";

import { LazyMotion, domAnimation } from "framer-motion";
import type { ReactNode } from "react";

/**
 * Wraps the app in LazyMotion(strict) so only the lazy-loaded `domAnimation`
 * feature bundle ships, and `<m.* />` components must be used instead of
 * `<motion.* />` (strict mode throws on the heavier bundle).
 * https://motion.dev/docs/react-reduce-bundle-size
 */
export default function MotionProvider({ children }: { children: ReactNode }) {
  return (
    <LazyMotion features={domAnimation} strict>
      {children}
    </LazyMotion>
  );
}
