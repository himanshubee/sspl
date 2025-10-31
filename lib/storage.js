import { getSubmissionsCollection } from "./mongodb";

const DEFAULT_SORT = { createdAt: -1 };

async function mapCursorToSubmissions(cursor) {
  const documents = await cursor.toArray();
  return documents.map(({ _id, ...document }) => ({
    ...document,
    mongoId: _id?.toString(),
  }));
}

export async function readSubmissions() {
  const collection = await getSubmissionsCollection();
  const cursor = collection.find().sort(DEFAULT_SORT);
  return mapCursorToSubmissions(cursor);
}

export async function addSubmission(submission) {
  const collection = await getSubmissionsCollection();
  await collection.insertOne(submission);
}
