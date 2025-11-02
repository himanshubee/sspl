import Image from "next/image";
import LogoutButton from "@/components/LogoutButton";
import AdminDashboardView from "@/components/AdminDashboardView";
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

        <AdminDashboardView
          submissions={submissions}
          failedSubmissions={failedSubmissions}
        />
      </div>
    </div>
  );
}
