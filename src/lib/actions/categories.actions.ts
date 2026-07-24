"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth/server";
import mongoose from "mongoose";
import { getMongoose } from "@/lib/db/client";
import { getCategoryModel, getExpenseModel } from "@/lib/db/collections";
import {
  CreateCategorySchema,
  UpdateCategorySchema,
  type CreateCategoryInput,
  type UpdateCategoryInput,
} from "@/lib/validation/category.schema";
import { ensureOutrosCategory } from "@/lib/domain/default-categories";

export type ActionResult<T = void> =
  | { success: true; data?: T }
  | { success: false; error: string };

// ─── listCategories ────────────────────────────────────────────────────────────

export async function listCategories() {
  const session = await auth();
  if (!session?.user?.id) return [];

  await getMongoose();
  const CategoryModel = getCategoryModel();

  const categories = await CategoryModel.find({
    userId: new mongoose.Types.ObjectId(session.user.id),
  }).sort({ isDefault: -1, name: 1 });

  return categories.map((c) => ({
    id: c._id.toString(),
    name: c.name,
    icon: c.icon,
    color: c.color,
    isDefault: c.isDefault,
  }));
}

// ─── createCategory ────────────────────────────────────────────────────────────

export async function createCategory(
  input: CreateCategoryInput,
): Promise<ActionResult<{ id: string; name: string }>> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Não autenticado." };

  const parsed = CreateCategorySchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  await getMongoose();
  const CategoryModel = getCategoryModel();
  const userId = new mongoose.Types.ObjectId(session.user.id);

  // Unicidade case-insensitive
  const duplicate = await CategoryModel.findOne({
    userId,
    name: { $regex: new RegExp(`^${parsed.data.name.trim()}$`, "i") },
  });
  if (duplicate) {
    return { success: false, error: "Já existe uma categoria com esse nome." };
  }

  const category = await CategoryModel.create({
    userId,
    name: parsed.data.name.trim(),
    icon: parsed.data.icon ?? null,
    color: parsed.data.color ?? null,
    isDefault: false,
  });

  revalidatePath("/profile/categories");
  return {
    success: true,
    data: { id: category._id.toString(), name: category.name },
  };
}

// ─── updateCategory ────────────────────────────────────────────────────────────

export async function updateCategory(
  categoryId: string,
  input: UpdateCategoryInput,
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Não autenticado." };

  const parsed = UpdateCategorySchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  await getMongoose();
  const CategoryModel = getCategoryModel();
  const userId = new mongoose.Types.ObjectId(session.user.id);

  const category = await CategoryModel.findOne({
    _id: new mongoose.Types.ObjectId(categoryId),
    userId,
  });
  if (!category) return { success: false, error: "Categoria não encontrada." };

  if (parsed.data.name) {
    const name = parsed.data.name.trim();
    const duplicate = await CategoryModel.findOne({
      userId,
      name: { $regex: new RegExp(`^${name}$`, "i") },
      _id: { $ne: category._id },
    });
    if (duplicate) {
      return {
        success: false,
        error: "Já existe uma categoria com esse nome.",
      };
    }
    category.name = name;
  }

  if (parsed.data.icon !== undefined) category.icon = parsed.data.icon ?? null;
  if (parsed.data.color !== undefined)
    category.color = parsed.data.color ?? null;

  await category.save();
  revalidatePath("/profile/categories");
  return { success: true };
}

// ─── deleteCategory ────────────────────────────────────────────────────────────

export async function deleteCategory(
  categoryId: string,
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Não autenticado." };

  await getMongoose();
  const CategoryModel = getCategoryModel();
  const ExpenseModel = getExpenseModel();
  const userId = new mongoose.Types.ObjectId(session.user.id);
  const catObjectId = new mongoose.Types.ObjectId(categoryId);

  const category = await CategoryModel.findOne({ _id: catObjectId, userId });
  if (!category) return { success: false, error: "Categoria não encontrada." };

  // Reatribui despesas para "Outros" antes de deletar
  const outrosId = await ensureOutrosCategory(session.user.id);
  const outrosCategory = await CategoryModel.findById(outrosId);

  if (outrosId.toString() !== catObjectId.toString()) {
    await ExpenseModel.updateMany(
      { userId, categoryId: catObjectId },
      {
        $set: {
          categoryId: outrosId,
          categoryName: outrosCategory?.name ?? "Outros",
        },
      },
    );
  }

  await CategoryModel.deleteOne({ _id: catObjectId });
  revalidatePath("/profile/categories");
  return { success: true };
}
