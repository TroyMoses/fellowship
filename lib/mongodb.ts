import { MongoClient, type Db } from "mongodb";

if (!process.env.MONGODB_URI) {
  throw new Error("Please add your MongoDB URI to .env.local");
}

const uri = process.env.MONGODB_URI;

const options = {
  tls: true,
  tlsAllowInvalidCertificates: false, // Always validate certificates in production
  tlsAllowInvalidHostnames: false,
  serverSelectionTimeoutMS: 30000, // Increased timeout for Vercel cold starts
  socketTimeoutMS: 45000,
  connectTimeoutMS: 30000,
  maxPoolSize: 10,
  minPoolSize: 1, // Reduced for serverless environments
  retryWrites: true,
  retryReads: true,
  maxIdleTimeMS: 10000,
  waitQueueTimeoutMS: 10000,
};

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

if (process.env.NODE_ENV === "development") {
  // In development mode, use a global variable to preserve the connection
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri, options);
    global._mongoClientPromise = client.connect().catch((error) => {
      console.error("[MongoDB] Connection error:", error.message);
      // Don't throw, return a rejected promise that can be caught later
      return Promise.reject(error);
    });
  }
  clientPromise = global._mongoClientPromise;
} else {
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri, options);
    global._mongoClientPromise = client.connect().catch((error) => {
      console.error("[MongoDB] Production connection error:", error.message);
      console.error("[MongoDB] Full error:", error);
      // Reset the promise so next request can retry
      global._mongoClientPromise = undefined;
      return Promise.reject(error);
    });
  }
  clientPromise = global._mongoClientPromise;
}

export async function getDatabase(): Promise<Db> {
  try {
    const client = await clientPromise;
    return client.db("fellowship_platform");
  } catch (error) {
    console.error("[MongoDB] Failed to get database:", error);
    throw error;
  }
}

export async function getDatabaseSafe(): Promise<Db | null> {
  try {
    const client = await clientPromise;
    return client.db("fellowship_platform");
  } catch (error) {
    console.error("[MongoDB] Failed to get database (safe mode):", error);
    return null;
  }
}

export default clientPromise;
