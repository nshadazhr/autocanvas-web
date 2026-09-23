// Same shape as packages/storage's config.ts: read once, cache, throw
// loudly (not silently fall back to undefined) if a required var is
// missing — so a misconfigured deploy fails at first use, not with a
// confusing downstream SDK error.

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var ${name} (see .env.example's "Payments" section).`);
  }
  return value;
}

export interface StripeConfig {
  secretKey: string;
  webhookSecret: string;
}

export interface RazorpayConfig {
  keyId: string;
  keySecret: string;
  webhookSecret: string;
}

let cachedStripeConfig: StripeConfig | undefined;
let cachedRazorpayConfig: RazorpayConfig | undefined;

export function getStripeConfig(): StripeConfig {
  if (!cachedStripeConfig) {
    cachedStripeConfig = {
      secretKey: requireEnv("STRIPE_SECRET_KEY"),
      webhookSecret: requireEnv("STRIPE_WEBHOOK_SECRET"),
    };
  }
  return cachedStripeConfig;
}

export function getRazorpayConfig(): RazorpayConfig {
  if (!cachedRazorpayConfig) {
    cachedRazorpayConfig = {
      keyId: requireEnv("RAZORPAY_KEY_ID"),
      keySecret: requireEnv("RAZORPAY_KEY_SECRET"),
      webhookSecret: requireEnv("RAZORPAY_WEBHOOK_SECRET"),
    };
  }
  return cachedRazorpayConfig;
}

/** Test-only reset hook — production code never needs this. */
export function resetBillingConfigCache(): void {
  cachedStripeConfig = undefined;
  cachedRazorpayConfig = undefined;
}
