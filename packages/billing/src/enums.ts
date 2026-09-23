// Local literal-union re-declarations of schema.prisma's billing enums —
// same established pattern as apps/admin's JobStatusValue and
// @modules/audio's SceneStatus: keeps this package's public types from
// ever depending on `prisma generate` having actually been run.

export type PaymentProviderKeyValue = "STRIPE" | "RAZORPAY" | "CASHFREE" | "NONE";
export type SubscriptionStatusValue = "ACTIVE" | "TRIALING" | "PAST_DUE" | "CANCELED" | "INCOMPLETE";
export type PaymentStatusValue = "PENDING" | "SUCCEEDED" | "FAILED" | "REFUNDED";
