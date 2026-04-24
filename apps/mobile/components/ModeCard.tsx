import type { GameModeMeta } from '@pitch-therapy/core';
import { AnimatedModeCard } from '@/components/AnimatedModeCard';

interface ModeCardProps {
  mode: GameModeMeta;
}

export function ModeCard({ mode }: ModeCardProps) {
  return <AnimatedModeCard mode={mode} />;
}
