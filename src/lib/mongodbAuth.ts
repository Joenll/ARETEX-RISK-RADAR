// src/lib/mongodbAuth.ts
import { MongoClient } from 'mongodb';

// Ensure the MONGODB_URI is defined
if (!process.env.MONGODB_URI) {
  throw new Error('Invalid/Missing environment variable: "MONGODB_URI"');
}

const uri = process.env.MONGODB_URI;
const options = {}; // Add any MongoClient options here if needed

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

// Use a global variable in development to preserve the value
// across module reloads caused by HMR (Hot Module Replacement).
if (process.env.NODE_ENV === 'development') {
  // Extend the global type to include our custom property
  let globalWithMongo = global as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>
  }

  if (!globalWithMongo._mongoClientPromise) {
    client = new MongoClient(uri, options);
    globalWithMongo._mongoClientPromise = client.connect();
    console.log("MongoDB Client Promise created (Development).");
  }
  clientPromise = globalWithMongo._mongoClientPromise;
} else {
  // In production mode, it's best to not use a global variable.
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
  console.log("MongoDB Client Promise created (Production).");
}

// Export a module-scoped MongoClient promise.
// By doing this in a separate module, the client can be shared across functions.
export default clientPromise;
