import { z } from "zod";

export const AddItemInput = z.object({
  productId: z.coerce.number().int().positive(),
  quantity: z.coerce.number().int().min(1).max(99),
}).strict();

export const UpdateQuantityInput = z.object({
  quantity: z.coerce.number().int().min(0).max(99),
}).strict();

export const CartIdParam = z.object({
  id: z.coerce.number().int().positive(),
}).strict();
