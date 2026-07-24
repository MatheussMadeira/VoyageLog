import { z } from "zod";

export const CategorySchema = z.object({
  _id: z.string().optional(),
  userId: z.string().optional(),
  name: z
    .string()
    .min(1, "Nome é obrigatório")
    .max(30, "Nome deve ter no máximo 30 caracteres"),
  icon: z.string().nullable().optional(),
  color: z.string().nullable().optional(),
  isDefault: z.boolean().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export const CreateCategorySchema = CategorySchema.pick({
  name: true,
  icon: true,
  color: true,
});

export const UpdateCategorySchema = CategorySchema.pick({
  name: true,
  icon: true,
  color: true,
}).partial();

export type Category = z.infer<typeof CategorySchema>;
export type CreateCategoryInput = z.infer<typeof CreateCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof UpdateCategorySchema>;
