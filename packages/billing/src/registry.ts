import { UnsupportedPaymentProviderError } from "./errors";
import type { PaymentProvider } from "./types";
import type { PaymentProviderKeyValue } from "./enums";

// Simpler than @platform/ai-core's registry (Chunk 5) — no DB-driven
// isActive layer here, see types.ts's comment on PaymentProvider for why.
// Just an in-memory map from key -> adapter, populated once at module
// load rather than via a separate bootstrap() call, since (unlike audio
// providers) there's no scenario where code for Stripe/Razorpay exists
// but should be treated as "not registered yet" at runtime.
const implementations = new Map<PaymentProviderKeyValue, PaymentProvider>();

export function registerPaymentProvider(provider: PaymentProvider): void {
  implementations.set(provider.key, provider);
}

/** Test/reset hook — production code never needs this. */
export function clearPaymentProviderRegistry(): void {
  implementations.clear();
}

export function getPaymentProvider(key: PaymentProviderKeyValue): PaymentProvider {
  const impl = implementations.get(key);
  if (!impl) {
    throw new UnsupportedPaymentProviderError(key);
  }
  return impl;
}
