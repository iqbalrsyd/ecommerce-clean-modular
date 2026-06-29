import { z } from "zod";
import { CardInput, AddressInput } from "@ecom/shared-validation";

export const CheckoutInput = z.object({
  cartId: z.coerce.number().int().positive(),
  shippingAddress: AddressInput,
  billingAddress: AddressInput.optional(),
  paymentMethodId: z.string().min(1).max(120),
  card: CardInput.optional(),
  idempotencyKey: z.string().uuid(),
}).strict();

export const OrderIdParam = z.object({
  id: z.coerce.number().int().positive(),
}).strict();
