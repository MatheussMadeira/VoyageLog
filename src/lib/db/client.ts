import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config();

const uri = process.env.MONGODB_URI || "";

if (!uri) {
  throw new Error("Environment variable MONGODB_URI must be defined.");
}

let cachedConnection: Promise<typeof mongoose> | undefined;

declare global {
  // eslint-disable-next-line no-var
  var _voyageLogMongoose: Promise<typeof mongoose> | undefined;
}
export function getMongoose(): Promise<typeof mongoose> {
  if (cachedConnection) {
    return cachedConnection;
  }

  if (process.env.NODE_ENV === "development") {
    if (!global._voyageLogMongoose) {
      global._voyageLogMongoose = mongoose.connect(uri, {
        dbName: "voyagelog",
      });
    }

    cachedConnection = global._voyageLogMongoose;
  } else {
    cachedConnection = mongoose.connect(uri, {
      dbName: "voyagelog",
    });
  }

  return cachedConnection;
}
