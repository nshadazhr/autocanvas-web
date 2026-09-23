import { registerPaymentProvider } from "./registry";
import { StripeProvider } from "../providers/stripe-provider";
import { RazorpayProvider } from "../providers/razorpay-provider";

// Same idea as @platform/ai-core's registerBuiltInAudioProviders() —
// call once at process startup (apps/web) before any checkout/webhook
// code runs. Adding Cashfree later means: write providers/cashfree-
// provider.ts implementing PaymentProvider, add one line here, done.
let registered = false;

export function registerBuiltInPaymentProviders(): void {
  if (registered) return; // idempotent — safe to call from multiple entrypoints
  registerPaymentProvider(StripeProvider);
  registerPaymentProvider(RazorpayProvider);
  registered = true;
}

/** Test/reset hook — production code never needs this. */
export function resetBuiltInPaymentProviderRegistration(): void {
  registered = false;
}
