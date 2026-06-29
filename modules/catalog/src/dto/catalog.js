import { z } from "zod";

export const ReviewInput = z.object({
  rating: z.coerce.number().int().min(1).max(5),
  title: z.string().min(1).max(120),
  body: z.string().min(1).max(2000),
}).strict();

export const ProductIdParam = z.object({
  id: z.coerce.number().int().positive(),
}).strict();

export const ProductSearchQuery = z.object({
  q: z.string().min(1).max(200),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  offset: z.coerce.number().int().min(0).default(0),
}).strict();

export const PublicProduct = z.object({
  id: z.number().int(),
  name: z.string(),
  description: z.string(),
  priceCents: z.number().int().nonnegative(),
  currency: z.string().length(3),
  stock: z.number().int().nonnegative(),
});
