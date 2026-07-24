import mongoose, { Schema, type Document, type Model } from "mongoose";

// ─── User ────────────────────────────────────────────────────────────────────

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash: string;
  createdAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: { type: String, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

// ─── Category ─────────────────────────────────────────────────────────────────

export interface ICategory extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  icon: string | null;
  color: string | null;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CategorySchema = new Schema<ICategory>(
  {
    userId: { type: Schema.Types.ObjectId, required: true, index: true },
    name: { type: String, required: true, trim: true },
    icon: { type: String, default: null },
    color: { type: String, default: null },
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true },
);

CategorySchema.index({ userId: 1, name: 1 }, { unique: true });

// ─── Leg (embedded) ───────────────────────────────────────────────────────────

const BudgetSchema = new Schema(
  {
    cash: { type: Number, required: true, min: 0 },
    debit: { type: Number, required: true, min: 0 },
    credit: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

const LegSchema = new Schema(
  {
    legId: { type: String, required: true },
    country: { type: String, required: true },
    countryCode: { type: String, required: true },
    city: { type: String, required: true },
    currency: { type: String, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    budget: { type: BudgetSchema, required: true },
  },
  { _id: false },
);

// ─── Trip ─────────────────────────────────────────────────────────────────────

export interface ICategoryBudget {
  categoryId: string;
  categoryName: string;
  allocated: number;
}

export interface ITrip extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  referenceCurrency: string;
  legs: Array<{
    legId: string;
    country: string;
    countryCode: string;
    city: string;
    currency: string;
    startDate: Date;
    endDate: Date;
    budget: { cash: number; debit: number; credit: number };
  }>;
  categoryBudgets: ICategoryBudget[];
  createdAt: Date;
  updatedAt: Date;
}

const CategoryBudgetSchema = new Schema(
  {
    categoryId: { type: String, required: true },
    categoryName: { type: String, required: true },
    allocated: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

const TripSchema = new Schema<ITrip>(
  {
    userId: { type: Schema.Types.ObjectId, required: true, index: true },
    name: { type: String, required: true },
    referenceCurrency: { type: String, required: true },
    legs: { type: [LegSchema], required: true, default: [] },
    categoryBudgets: { type: [CategoryBudgetSchema], default: [] },
  },
  { timestamps: true },
);

// ─── Expense ──────────────────────────────────────────────────────────────────

export interface IExpense extends Document {
  tripId: mongoose.Types.ObjectId;
  legId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  description: string;
  method: "cash" | "debit" | "credit";
  timestamp: Date;
  amount: number;
  currency: string;
  amountConverted: number | null;
  referenceCurrency: string;
  categoryId: mongoose.Types.ObjectId;
  categoryName: string;
  createdAt: Date;
  updatedAt: Date;
}

const ExpenseSchema = new Schema<IExpense>(
  {
    tripId: { type: Schema.Types.ObjectId, required: true },
    legId: { type: Schema.Types.ObjectId, required: true },
    userId: { type: Schema.Types.ObjectId, required: true, index: true },
    description: { type: String, required: true },
    method: { type: String, enum: ["cash", "debit", "credit"], required: true },
    timestamp: { type: Date, required: true },
    amount: { type: Number, required: true },
    currency: { type: String, required: true },
    amountConverted: { type: Number, default: null },
    referenceCurrency: { type: String, required: true },
    categoryId: { type: Schema.Types.ObjectId, required: true },
    categoryName: { type: String, required: true },
  },
  { timestamps: true },
);

ExpenseSchema.index({ tripId: 1, timestamp: -1 });
ExpenseSchema.index({ tripId: 1, legId: 1, method: 1 });
ExpenseSchema.index({ tripId: 1, categoryId: 1 });

// ─── RateCache ────────────────────────────────────────────────────────────────

export interface IRateCache extends Document {
  base: string;
  rates: Record<string, number>;
  fetchedAt: Date;
}

const RateCacheSchema = new Schema<IRateCache>({
  base: { type: String, required: true, unique: true },
  rates: { type: Map, of: Number, required: true },
  fetchedAt: { type: Date, required: true },
});

RateCacheSchema.index({ fetchedAt: 1 }, { expireAfterSeconds: 43200 }); // TTL 12h

// ─── Model getters (HMR-safe) ─────────────────────────────────────────────────

function getModel<T extends Document>(name: string, schema: Schema): Model<T> {
  return (mongoose.models[name] as Model<T>) || mongoose.model<T>(name, schema);
}

export const getUserModel = (): Model<IUser> =>
  getModel<IUser>("User", UserSchema);

export const getCategoryModel = (): Model<ICategory> =>
  getModel<ICategory>("Category", CategorySchema);

export const getTripModel = (): Model<ITrip> =>
  getModel<ITrip>("Trip", TripSchema);

export const getExpenseModel = (): Model<IExpense> =>
  getModel<IExpense>("Expense", ExpenseSchema);

export const getRateCacheModel = (): Model<IRateCache> =>
  getModel<IRateCache>("RateCache", RateCacheSchema);
