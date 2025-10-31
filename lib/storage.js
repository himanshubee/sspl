import { promises as fs } from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
const SUBMISSIONS_FILE = path.join(DATA_DIR, "submissions.json");

async function ensureDataFile() {
  try {
    await fs.access(SUBMISSIONS_FILE);
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(SUBMISSIONS_FILE, "[]", "utf-8");
  }
}

export async function readSubmissions() {
  await ensureDataFile();
  const raw = await fs.readFile(SUBMISSIONS_FILE, "utf-8");
  if (!raw.trim()) {
    return [];
  }

  try {
    return JSON.parse(raw);
  } catch (parseError) {
    if (parseError instanceof SyntaxError) {
      await fs.writeFile(SUBMISSIONS_FILE, "[]", "utf-8");
      return [];
    }

    throw parseError;
  }
}

export async function addSubmission(submission) {
  await ensureDataFile();
  const all = await readSubmissions();
  all.unshift(submission);
  await fs.writeFile(SUBMISSIONS_FILE, JSON.stringify(all, null, 2), "utf-8");
}
