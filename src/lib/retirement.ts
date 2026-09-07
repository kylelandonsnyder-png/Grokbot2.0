export interface RetirementProjection {
  years: number;
  months: number;
  projected: number;
  onTrack: boolean;
  gap: number;
  monthlyNeeded: number;
}

export function projectRetirement(input: {
  currentAge: number;
  retirementAge: number;
  currentBalance: number;
  monthlyContribution: number;
  expectedReturn: number;
  targetNestEgg: number;
}): RetirementProjection {
  const years = Math.max(0, input.retirementAge - input.currentAge);
  const months = years * 12;
  const monthlyRate = input.expectedReturn / 12;
  const projected = futureValue(input.currentBalance, input.monthlyContribution, monthlyRate, months);
  const gap = input.targetNestEgg - projected;
  const monthlyNeeded = contributionNeeded(
    input.currentBalance,
    input.targetNestEgg,
    monthlyRate,
    months,
  );

  return {
    years,
    months,
    projected,
    onTrack: projected + 1 >= input.targetNestEgg,
    gap,
    monthlyNeeded,
  };
}

export function futureValue(
  present: number,
  monthlyContribution: number,
  monthlyRate: number,
  months: number,
): number {
  if (months <= 0) return present;
  if (monthlyRate === 0) return present + monthlyContribution * months;
  const growth = Math.pow(1 + monthlyRate, months);
  return present * growth + monthlyContribution * ((growth - 1) / monthlyRate);
}

export function contributionNeeded(
  present: number,
  target: number,
  monthlyRate: number,
  months: number,
): number {
  if (months <= 0) return target > present ? Number.POSITIVE_INFINITY : 0;
  if (monthlyRate === 0) return Math.max(0, (target - present) / months);
  const growth = Math.pow(1 + monthlyRate, months);
  const fvOfPresent = present * growth;
  const neededFromContrib = target - fvOfPresent;
  if (neededFromContrib <= 0) return 0;
  return neededFromContrib / ((growth - 1) / monthlyRate);
}
