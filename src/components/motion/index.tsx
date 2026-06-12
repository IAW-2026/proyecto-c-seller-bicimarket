"use client";

import { useEffect } from "react";
import type { ReactNode } from "react";
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  type Variants,
} from "motion/react";

// ── FadeIn ───────────────────────────────────────────────────
// Sube y aparece suavemente al montar. Ideal para secciones de página.

export function FadeIn({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}

// ── Stagger ──────────────────────────────────────────────────
// Container que anima a sus hijos <StaggerItem> en cascada.

const containerVariants: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } },
};

export function Stagger({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div className={className} variants={itemVariants}>
      {children}
    </motion.div>
  );
}

// ── AnimatedNumber ───────────────────────────────────────────
// Count-up animado. Re-anima cuando cambia el valor (p. ej. tras
// aceptar un pedido y recalcular las estadísticas).

export function AnimatedNumber({ value }: { value: number }) {
  const mv = useMotionValue(0);
  const spring = useSpring(mv, { stiffness: 120, damping: 24 });
  const text = useTransform(spring, (v) => Math.round(v).toString());

  useEffect(() => {
    mv.set(value);
  }, [mv, value]);

  return <motion.span>{text}</motion.span>;
}
