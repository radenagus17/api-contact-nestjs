import z, { ZodType } from 'zod';

export class ContactValidation {
  static readonly CREATE: ZodType = z.object({
    name: z.string().min(1).max(100),
    email: z.email(),
    phone: z.string().min(2).max(20),
  });
}
