// Top-level barrel for @platform/billing. apps/web's checkout Server
// Action and its two webhook routes should import from here rather than
// reaching into providers/*-provider.ts directly — the vendor SDKs
// (stripe/razorpay) never need to be imported outside providers/*.

export type {
  CreateCheckoutSessionInput,
  CheckoutSession,
  NormalizedBillingEvent,
  SubscriptionUpsertedEvent,
  SubscriptionCanceledEvent,
  PaymentSettledEvent,
  PaymentProvider,
} from "./types";
export type { PaymentProviderKeyValue, SubscriptionStatusValue, PaymentStatusValue } from "./enums";
export {
  WebhookSignatureError,
  UnsupportedPaymentProviderError,
  PlanNotFoundError,
  PlanNotCheckoutReadyError,
  MissingCheckoutMetadataError,
} from "./errors";
export { getPaymentProvider, registerPaymentProvider, clearPaymentProviderRegistry } from "./registry";
export { registerBuiltInPaymentProviders, resetBuiltInPaymentProviderRegistration } from "./bootstrap";
export { applyBillingEvent } from "./webhook-handler";
export { loadPlanForCheckout, type PlanCheckoutInfo } from "./plan-lookup";
export { getStripeConfig, getRazorpayConfig, resetBillingConfigCache } from "./config";
