import { z } from "zod";

export const OrderListQuery = z.object({
  status: z.enum(["pending", "paid", "shipped", "delivered", "cancelled", "payment_failed"]).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  cursor: z.string().optional(),
}).strict();
