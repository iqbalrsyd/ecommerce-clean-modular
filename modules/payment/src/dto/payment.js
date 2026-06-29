import { z } from "zod";

export const CreatePaymentIntentInput = z.object({
  orderId: z.coerce.number().int().positive(),
  idempotencyKey: z.string().uuid(),
}).strict();
