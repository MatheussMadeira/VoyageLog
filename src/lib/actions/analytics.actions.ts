"use server";

import { auth } from "@/lib/auth/server";
import mongoose from "mongoose";
import { getMongoose } from "@/lib/db/client";
import { getExpenseModel } from "@/lib/db/collections";

export interface CategoryBreakdownItem {
  categoryId: string;
  categoryName: string;
  total: number;
  percentage: number;
}

export async function getCategoryBreakdown(
  tripId: string,
): Promise<CategoryBreakdownItem[]> {
  const session = await auth();
  if (!session?.user?.id) return [];

  await getMongoose();
  const ExpenseModel = getExpenseModel();

  const pipeline = [
    {
      $match: {
        tripId: new mongoose.Types.ObjectId(tripId),
        userId: new mongoose.Types.ObjectId(session.user.id),
        amountConverted: { $ne: null },
      },
    },
    {
      $group: {
        _id: { categoryId: "$categoryId", categoryName: "$categoryName" },
        total: { $sum: "$amountConverted" },
      },
    },
    { $sort: { total: -1 as -1 } },
  ];

  const rows = await ExpenseModel.aggregate(pipeline);

  const grandTotal = rows.reduce((sum, r) => sum + (r.total as number), 0);

  return rows.map((r) => ({
    categoryId: (r._id.categoryId as mongoose.Types.ObjectId).toString(),
    categoryName: r._id.categoryName as string,
    total: Math.round((r.total as number) * 100) / 100,
    percentage:
      grandTotal > 0
        ? Math.round(((r.total as number) / grandTotal) * 1000) / 10
        : 0,
  }));
}
