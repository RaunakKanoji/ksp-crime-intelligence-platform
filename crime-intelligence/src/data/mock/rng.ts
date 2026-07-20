export class SeededRandom {
  private state: number;

  constructor(seed: number) {
    this.state = (seed >>> 0) || 1;
  }

  next(): number {
    let value = this.state += 0x6d2b79f5;
    value = Math.imul(value ^ value >>> 15, value | 1);
    value ^= value + Math.imul(value ^ value >>> 7, value | 61);
    return ((value ^ value >>> 14) >>> 0) / 4294967296;
  }

  integer(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  decimal(min: number, max: number, precision = 2): number {
    const factor = 10 ** precision;
    return Math.round((min + this.next() * (max - min)) * factor) / factor;
  }

  choice<T>(values: readonly T[]): T {
    return values[this.integer(0, values.length - 1)];
  }

  weighted<T>(values: ReadonlyArray<{ value: T; weight: number }>): T {
    const total = values.reduce((sum, item) => sum + item.weight, 0);
    let cursor = this.next() * total;
    for (const item of values) {
      cursor -= item.weight;
      if (cursor <= 0) return item.value;
    }
    return values[values.length - 1].value;
  }
}

export function seededDate(referenceDate: string, rng: SeededRandom, minimumDaysAgo: number, maximumDaysAgo: number, hour?: number): string {
  const reference = new Date(referenceDate);
  const daysAgo = rng.integer(minimumDaysAgo, maximumDaysAgo);
  const result = new Date(reference.getTime() - daysAgo * 86_400_000);
  result.setUTCHours(hour ?? rng.integer(6, 22), rng.integer(0, 59), 0, 0);
  return result.toISOString();
}

export function addDays(value: string, days: number): string {
  return new Date(new Date(value).getTime() + days * 86_400_000).toISOString();
}

export function maskPhone(index: number): string {
  return `+91-98XXXXXX${String((index % 90) + 10)}`;
}

export function maskEmail(index: number): string {
  return `person${String(index).padStart(4, "0")}@example.invalid`;
}

export function maskAddress(index: number, city: string): string {
  return `Ward ${(index % 28) + 1}, Sample Layout, ${city}`;
}
