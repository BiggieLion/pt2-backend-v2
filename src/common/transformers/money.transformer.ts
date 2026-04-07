import { ValueTransformer } from 'typeorm';

/**
 * Converts monetary values between decimal numbers (API layer) and
 * bigint cents strings (database layer).
 *
 * Example: 123.45 ↔ '12345'
 */
export const MoneyTransformer: ValueTransformer = {
  to: (value: number): string => {
    if (typeof value !== 'number' || Number.isNaN(value)) return '0';
    return Math.round(value * 100).toString();
  },
  from: (value: string): number => {
    const cents: number = parseInt(value, 10);
    return cents / 100;
  },
};
