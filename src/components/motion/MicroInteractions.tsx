"use client";

import { motion, useReducedMotion, type Variants } from "framer-motion";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

// ─── Premium micro-motion primitives ───
// Respects prefers-reduced-motion automatically.
// Use for buttons, cards, lists, toasts to fix laggy/dull feel.

const springSnappy = { type: "spring", stiffness: 400, damping: 28 } as const;
const easeOut = [0.16, 1, 0.3, 1] as const;

export function FadeIn({
  children,
  delay = 0,
  y = 8,
  className,
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
}) {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, delay, ease: easeOut }}
    >
      {children}
    </motion.div>
  );
}

export function ScaleIn({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ ...springSnappy, delay }}
    >
      {children}
    </motion.div>
  );
}

export function Pressable({
  children,
  className,
  onClick,
  ariaLabel,
}: {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  ariaLabel?: string;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.button
      type="button"
      aria-label={ariaLabel}
      onClick={onClick}
      className={cn("micro-press micro-glow cursor-pointer", className)}
      whileHover={reduce ? undefined : { scale: 1.03, y: -1 }}
      whileTap={reduce ? undefined : { scale: 0.96, y: 1 }}
      transition={springSnappy}
    >
      {children}
    </motion.button>
  );
}

const staggerParent: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.04 } },
};

const staggerChild: Variants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: easeOut } },
};

// Omit framer-motion's conflicting gesture handlers (onDrag et al.)
// so ...rest spreads type-check on motion.div.
type DivProps = Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "onDrag" | "onDragStart" | "onDragEnd" | "onAnimationStart" | "onAnimationComplete"
> & {
  children: ReactNode;
  className?: string;
};

export function Stagger({ children, className, ...rest }: DivProps) {
  const reduce = useReducedMotion();
  if (reduce)
    return (
      <div className={className} {...rest}>
        {children}
      </div>
    );
  return (
    <motion.div
      className={className}
      variants={staggerParent}
      initial="hidden"
      animate="show"
      {...rest}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, className, ...rest }: DivProps) {
  const reduce = useReducedMotion();
  if (reduce)
    return (
      <div className={className} {...rest}>
        {children}
      </div>
    );
  return (
    <motion.div className={className} variants={staggerChild} {...rest}>
      {children}
    </motion.div>
  );
}

export function LiftCard({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={cn("card-premium", className)}
      whileHover={reduce ? undefined : { y: -3, scale: 1.005 }}
      whileTap={reduce ? undefined : { scale: 0.995 }}
      transition={springSnappy}
    >
      {children}
    </motion.div>
  );
}
