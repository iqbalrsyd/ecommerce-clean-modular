import { z } from "zod";
import { ValidationError } from "@ecom/shared-errors";

const PAN_RE = /^\d{13,19}$/;
const CVV_RE = /^\d{3,4}$/;

export const CardInput = z.object({
  cardNumber: z.string().regex(PAN_RE, "invalid card number"),
  cvv: z.string().regex(CVV_RE, "invalid cvv"),
  expMonth: z.coerce.number().int().min(1).max(12),
  expYear: z.coerce.number().int().min(2024).max(2100),
  cardholderName: z.string().min(1).max(120),
});

export const AddressInput = z.object({
  line1: z.string().min(1).max(200),
  line2: z.string().max(200).optional(),
  city: z.string().min(1).max(120),
  region: z.string().min(1).max(120),
  postalCode: z.string().min(1).max(20),
  country: z.string().length(2),
});

export const Money = z.object({
  currency: z.enum(["USD", "EUR", "IDR", "JPY", "SGD"]),
  amount: z.number().int().nonnegative(),
});

export function parseOrThrow(schema, input) {
  const result = schema.safeParse(input);
  if (!result.success) {
    throw new ValidationError(
      "request validation failed",
      result.error.issues.map((i) => ({
        path: i.path.join("."),
        message: i.message,
        code: i.code,
      })),
    );
  }
  return result.data;
}
