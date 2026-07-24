"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth/server";
import mongoose from "mongoose";
import { getMongoose } from "@/lib/db/client";
import { getTripModel, getExpenseModel } from "@/lib/db/collections";
import { TripSchema } from "@/lib/validation/trip.schema";
import type { z } from "zod";

export type ActionResult<T = void> =
  | { success: true; data?: T }
  | { success: false; error: string };

const CreateTripSchema = TripSchema.omit({
  _id: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
});
type CreateTripInput = z.infer<typeof CreateTripSchema>;

// ─── listTrips ────────────────────────────────────────────────────────────────

export async function listTrips() {
  const session = await auth();
  if (!session?.user?.id) return [];

  await getMongoose();
  const TripModel = getTripModel();

  const trips = await TripModel.find({
    userId: new mongoose.Types.ObjectId(session.user.id),
  }).sort({ createdAt: -1 });

  return trips.map((t) => ({
    id: t._id.toString(),
    name: t.name,
    referenceCurrency: t.referenceCurrency,
    legs: t.legs.map((l) => ({
      legId: l.legId,
      country: l.country,
      countryCode: l.countryCode,
      city: l.city,
      currency: l.currency,
      startDate: l.startDate.toISOString(),
      endDate: l.endDate.toISOString(),
      budget: l.budget,
    })),
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
  }));
}

// ─── getTrip ─────────────────────────────────────────────────────────────────

export async function getTrip(tripId: string) {
  const session = await auth();
  if (!session?.user?.id) return null;

  await getMongoose();
  const TripModel = getTripModel();

  const trip = await TripModel.findOne({
    _id: new mongoose.Types.ObjectId(tripId),
    userId: new mongoose.Types.ObjectId(session.user.id),
  });
  if (!trip) return null;

  return {
    id: trip._id.toString(),
    name: trip.name,
    referenceCurrency: trip.referenceCurrency,
    legs: trip.legs.map((l) => ({
      legId: l.legId,
      country: l.country,
      countryCode: l.countryCode,
      city: l.city,
      currency: l.currency,
      startDate: l.startDate.toISOString(),
      endDate: l.endDate.toISOString(),
      budget: l.budget,
    })),
    createdAt: trip.createdAt.toISOString(),
    updatedAt: trip.updatedAt.toISOString(),
  };
}

// ─── createTrip ───────────────────────────────────────────────────────────────

export async function createTrip(
  input: CreateTripInput,
): Promise<ActionResult<{ id: string }>> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Não autenticado." };

  const parsed = CreateTripSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message };
  }

  await getMongoose();
  const TripModel = getTripModel();

  const trip = await TripModel.create({
    userId: new mongoose.Types.ObjectId(session.user.id),
    name: parsed.data.name,
    referenceCurrency: parsed.data.referenceCurrency,
    legs: parsed.data.legs.map((l) => ({
      ...l,
      startDate: new Date(l.startDate),
      endDate: new Date(l.endDate),
    })),
  });

  revalidatePath("/");
  return { success: true, data: { id: trip._id.toString() } };
}

// ─── updateTrip ───────────────────────────────────────────────────────────────

export async function updateTrip(
  tripId: string,
  input: Partial<CreateTripInput>,
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Não autenticado." };

  await getMongoose();
  const TripModel = getTripModel();

  const trip = await TripModel.findOne({
    _id: new mongoose.Types.ObjectId(tripId),
    userId: new mongoose.Types.ObjectId(session.user.id),
  });
  if (!trip) return { success: false, error: "Viagem não encontrada." };

  if (input.name) trip.name = input.name;
  if (input.referenceCurrency) trip.referenceCurrency = input.referenceCurrency;
  if (input.legs) {
    trip.legs = input.legs.map((l) => ({
      ...l,
      startDate: new Date(l.startDate),
      endDate: new Date(l.endDate),
    })) as typeof trip.legs;
  }

  await trip.save();
  revalidatePath(`/trips/${tripId}`);
  revalidatePath("/");
  return { success: true };
}

// ─── deleteTrip ───────────────────────────────────────────────────────────────

export async function deleteTrip(tripId: string): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Não autenticado." };

  await getMongoose();
  const TripModel = getTripModel();
  const ExpenseModel = getExpenseModel();

  const trip = await TripModel.findOne({
    _id: new mongoose.Types.ObjectId(tripId),
    userId: new mongoose.Types.ObjectId(session.user.id),
  });
  if (!trip) return { success: false, error: "Viagem não encontrada." };

  await ExpenseModel.deleteMany({ tripId: trip._id });
  await TripModel.deleteOne({ _id: trip._id });

  revalidatePath("/");
  return { success: true };
}
