import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;
if (!uri) {
  throw new Error(
    "Missing MONGODB_URI. Add it to your environment configuration (e.g. .env.local).",
  );
}

const options = {};

let clientPromise;
const globalForMongo = globalThis;

if (!globalForMongo._mongoClientPromise) {
  const client = new MongoClient(uri, options);
  globalForMongo._mongoClientPromise = client
    .connect()
    .then((connectedClient) => {
      console.log("[MongoDB] Connected successfully.");
      return connectedClient;
    })
    .catch((connectionError) => {
      console.error("[MongoDB] Connection failed.", connectionError);
      throw connectionError;
    });
}

clientPromise = globalForMongo._mongoClientPromise;

export async function getMongoClient() {
  return clientPromise;
}

export async function getSubmissionsCollection() {
  const client = await getMongoClient();
  const dbName = process.env.MONGODB_DB || "sspl";
  const collectionName = process.env.MONGODB_COLLECTION || "submissions";
  return client.db(dbName).collection(collectionName);
}

export async function getFailedSubmissionsCollection() {
  const client = await getMongoClient();
  const dbName = process.env.MONGODB_DB || "sspl";
  const collectionName =
    process.env.MONGODB_FAILED_COLLECTION || "failed_submissions";
  return client.db(dbName).collection(collectionName);
}
