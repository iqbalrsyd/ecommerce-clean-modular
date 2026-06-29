import { z } from "zod";

const PASSWORD_MIN = 12;
const PASSWORD_RE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{12,128}$/;

export const RegisterInput = z.object({
  email: z.string().email().max(254),
  password: z.string().regex(PASSWORD_RE, `password must be at least ${PASSWORD_MIN} chars and contain upper, lower, digit, special`),
  displayName: z.string().min(1).max(120),
}).strict();

export const LoginInput = z.object({
  email: z.string().email().max(254),
  password: z.string().min(1).max(128),
}).strict();

export const UserIdParam = z.object({
  id: z.coerce.string().uuid(),
}).strict();
