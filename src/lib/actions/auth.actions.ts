"use server";

import bcrypt from "bcryptjs";
import { getMongoose } from "@/lib/db/client";
import { getUserModel } from "@/lib/db/collections";
import { SignUpSchema } from "@/lib/validation/auth.schema";
import { seedDefaultCategories } from "@/lib/domain/default-categories";

export type ActionResult =
  | { success: true }
  | { success: false; error: string };

export async function signUp(
  _prevState: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const raw = {
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  };

  const parsed = SignUpSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0].message,
    };
  }

  const { name, email, password } = parsed.data;

  await getMongoose();
  const UserModel = getUserModel();

  const existing = await UserModel.findOne({ email: email.toLowerCase() });
  if (existing) {
    return { success: false, error: "E-mail já cadastrado." };
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await UserModel.create({
    name,
    email: email.toLowerCase(),
    passwordHash,
  });

  // Seed das 6 categorias padrão após criação do usuário
  await seedDefaultCategories(user._id.toString());

  return { success: true };
}
