import mongoose from "mongoose";
import { getMongoose } from "@/lib/db/client";
import { getCategoryModel } from "@/lib/db/collections";

export const DEFAULT_CATEGORIES = [
  { name: "Alimentação", icon: "UtensilsCrossed", color: "#f97316" },
  { name: "Transporte", icon: "Car", color: "#3b82f6" },
  { name: "Hospedagem", icon: "BedDouble", color: "#8b5cf6" },
  { name: "Lazer", icon: "PartyPopper", color: "#ec4899" },
  { name: "Compras", icon: "ShoppingBag", color: "#14b8a6" },
  { name: "Outros", icon: "Ellipsis", color: "#6b7280" },
] as const;

export async function seedDefaultCategories(userId: string): Promise<void> {
  await getMongoose();
  const CategoryModel = getCategoryModel();
  const userObjectId = new mongoose.Types.ObjectId(userId);

  const docs = DEFAULT_CATEGORIES.map((cat) => ({
    userId: userObjectId,
    name: cat.name,
    icon: cat.icon,
    color: cat.color,
    isDefault: true,
  }));

  // insertMany com ordered:false ignora duplicatas (e-mail re-cadastro edge case)
  await CategoryModel.insertMany(docs, { ordered: false }).catch(() => {
    // Silencia erros de chave duplicada — seed já aplicado
  });
}

/** Garante que a categoria "Outros" exista para o usuário, criando se necessário. */
export async function ensureOutrosCategory(
  userId: string,
): Promise<mongoose.Types.ObjectId> {
  await getMongoose();
  const CategoryModel = getCategoryModel();
  const userObjectId = new mongoose.Types.ObjectId(userId);

  let outros = await CategoryModel.findOne({
    userId: userObjectId,
    name: { $regex: /^outros$/i },
  });

  if (!outros) {
    const outros_default = DEFAULT_CATEGORIES.find((c) => c.name === "Outros")!;
    outros = await CategoryModel.create({
      userId: userObjectId,
      name: "Outros",
      icon: outros_default.icon,
      color: outros_default.color,
      isDefault: true,
    });
  }

  return outros._id as mongoose.Types.ObjectId;
}
