import Image from "next/image";
import LogoutButton from "@/components/LogoutButton";
import SubmissionsTable from "@/components/SubmissionsTable";
import { readFailedSubmissions, readSubmissions } from "@/lib/storage";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const [submissions, failedSubmissions] = await Promise.all([
    readSubmissions(),
    readFailedSubmissions(),
  ]);

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

        <SubmissionsTable submissions={submissions} variant="successful" />

        <div className="space-y-4 border-t border-slate-200 pt-6">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900">
              Failed Submissions
            </h2>
            <p className="text-sm text-slate-500">
              Attempts that did not pass automated payment validation. Review
              details to follow up with the registrant.
            </p>
          </div>
          <SubmissionsTable submissions={failedSubmissions} variant="failed" />
        </div>
      </div>
    </div>
  );
}
