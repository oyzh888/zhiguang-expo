import { ScanResult } from '../types';

// In-memory store (no need to persist for MVP)
let currentResult: ScanResult | null = null;

export function setScanResult(result: ScanResult): void {
  currentResult = result;
}

export function getScanResult(): ScanResult | null {
  return currentResult;
}

export function clearScanResult(): void {
  currentResult = null;
}
