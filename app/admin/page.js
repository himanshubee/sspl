import Image from "next/image";
import LogoutButton from "@/components/LogoutButton";
import SubmissionsTable from "@/components/SubmissionsTable";
import { readSubmissions } from "@/lib/storage";
import { getSignedObjectUrl } from "@/lib/objectStorage";

export const dynamic = "force-dynamic";

async function attachSignedUrls(submission) {
  const enhanced = { ...submission };
  if (submission.photoKey) {
    enhanced.photoUrl = await getSignedObjectUrl(submission.photoKey);
  } else if (submission.photo) {
    enhanced.photoUrl = submission.photo;
  }

  if (submission.paymentScreenshotKey) {
    enhanced.paymentUrl = await getSignedObjectUrl(
      submission.paymentScreenshotKey,
    );
  } else if (submission.paymentScreenshot) {
    enhanced.paymentUrl = submission.paymentScreenshot;
  }

  return enhanced;
}

export default async function AdminDashboard() {
  const submissions = await readSubmissions();
  const submissionsWithUrls = await Promise.all(
    submissions.map((submission) => attachSignedUrls(submission)),
  );

  return (
    <div className="min-h-screen bg-slate-100 py-10">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 rounded-3xl bg-white p-8 shadow-lg md:p-12">
        <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <Image
              src="/sspl-2026.png"
              alt="SSPL Season 2026 logo"
              width={72}
              height={72}
              className="h-16 w-16"
              priority
            />
            <div>
              <h1 className="text-3xl font-bold text-slate-900">
                Registration Submissions
              </h1>
              <p className="text-sm text-slate-500">
                Export submissions or review individual records below.
              </p>
            </div>
          </div>
          <LogoutButton />
        </header>

        <SubmissionsTable submissions={submissionsWithUrls} />
      </div>
    </div>
  );
}
