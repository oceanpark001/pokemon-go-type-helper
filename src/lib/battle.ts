import { TYPE_LABELS } from '../data/typeMeta';
import { typeChart } from '../data/typeChart';
import type { PokemonSlot, SlotAnalysis, TypeName } from '../types';

const STAB = 1.25;

export function effectiveness(attackType: TypeName, defendTypes: TypeName[]): number {
  return defendTypes.reduce((acc, defendType) => acc * typeChart[attackType][defendType], 1);
}

export function moveDamageScore(slot: PokemonSlot, moveType: TypeName, opponentTypes: TypeName[]): number {
  const base = effectiveness(moveType, opponentTypes);
  const stab = slot.types.includes(moveType) ? STAB : 1;
  return base * stab;
}

export function incomingRisk(slot: PokemonSlot, opponentTypes: TypeName[]): number {
  if (opponentTypes.length === 0 || slot.types.length === 0) return 1;
  const risks = opponentTypes.map((type) => effectiveness(type, slot.types));
  return Math.max(...risks);
}

export function labelByScore(score: number, favorable = true): '굉장' | '보통' | '별로' {
  if (favorable) {
    if (score >= 1.35) return '굉장';
    if (score <= 0.95) return '별로';
    return '보통';
  }

  if (score <= 0.8) return '굉장';
  if (score >= 1.25) return '별로';
  return '보통';
}

export function analyzeSlot(slot: PokemonSlot, opponentTypes: TypeName[]): SlotAnalysis {
  const availableMoves = [slot.fastMove, ...slot.chargedMoves].filter(Boolean) as TypeName[];
  const moveScores = availableMoves.length
    ? availableMoves.map((move) => moveDamageScore(slot, move, opponentTypes))
    : [1];

  const attackBest = Math.max(...moveScores);
  const attackAverage = moveScores.reduce((sum, value) => sum + value, 0) / moveScores.length;
  const risk = incomingRisk(slot, opponentTypes);
  const finalScore = (attackBest * 0.7 + attackAverage * 0.3) / risk;

  const offenseLabel = labelByScore(attackBest, true);
  const defenseLabel = labelByScore(risk, false);
  const overallLabel = finalScore >= 1.35 ? '굉장' : finalScore <= 0.95 ? '별로' : '보통';

  const reasons: string[] = [];

  if (availableMoves.length) {
    const bestMove = availableMoves.reduce((best, current) => {
      const currentScore = moveDamageScore(slot, current, opponentTypes);
      const bestScore = moveDamageScore(slot, best, opponentTypes);
      return currentScore > bestScore ? current : best;
    }, availableMoves[0]);
    const moveScore = moveDamageScore(slot, bestMove, opponentTypes);
    reasons.push(
      `${TYPE_LABELS[bestMove]} 기술이 상대에게 ${labelByScore(moveScore, true)} (${moveScore.toFixed(2)}x)`,
    );
  } else {
    reasons.push('기술 타입이 비어 있어 공격 판단이 제한됨');
  }

  reasons.push(`상대의 대표 타입 공격을 받을 때 ${labelByScore(risk, false)} (${risk.toFixed(2)}x)`);

  if (slot.types.length) {
    reasons.push(`내 타입: ${slot.types.map((type) => TYPE_LABELS[type]).join(' / ')}`);
  }

  return {
    slotId: slot.id,
    attackBest,
    attackAverage,
    incomingRisk: risk,
    finalScore,
    overallLabel,
    offenseLabel,
    defenseLabel,
    reasons,
  };
}

export function recommendSwitch(slots: PokemonSlot[], opponentTypes: TypeName[]): SlotAnalysis[] {
  return slots
    .map((slot) => analyzeSlot(slot, opponentTypes))
    .sort((a, b) => b.finalScore - a.finalScore);
}
