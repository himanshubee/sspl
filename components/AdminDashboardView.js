"use client";

import { useMemo, useState } from "react";
import SubmissionsTable from "@/components/SubmissionsTable";

const TAB_CONFIG = [
  {
    key: "successful",
    label: "Successful",
    description:
      "Approved registrations pulled directly from the form. Use the download button to export the latest roster.",
  },
  {
    key: "failed",
    label: "Needs Review",
    description:
      "Submissions where the automated ₹900 payment check did not pass. Follow up with these registrants manually.",
  },
];

export default function AdminDashboardView({
  submissions,
  failedSubmissions,
}) {
  const [activeTab, setActiveTab] = useState("successful");

  const activeConfig = useMemo(
    () => TAB_CONFIG.find((tab) => tab.key === activeTab) ?? TAB_CONFIG[0],
    [activeTab],
  );

  const activeData =
    activeTab === "failed" ? failedSubmissions ?? [] : submissions ?? [];

  const counts = useMemo(
    () => ({
      successful: submissions?.length ?? 0,
      failed: failedSubmissions?.length ?? 0,
    }),
    [submissions, failedSubmissions],
  );

  return (
    <div className="flex flex-col gap-6">
      <nav className="flex flex-wrap gap-2 rounded-2xl bg-slate-100 p-2">
        {TAB_CONFIG.map((tab) => {
          const isActive = tab.key === activeTab;
          const count =
            tab.key === "failed" ? counts.failed : counts.successful;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
                isActive
                  ? "bg-white text-emerald-600 shadow"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                  isActive ? "bg-emerald-50 text-emerald-700" : "bg-slate-200 text-slate-600"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </nav>

      <section className="space-y-3">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">
            {activeConfig.label}
          </h2>
          <p className="text-sm text-slate-500">{activeConfig.description}</p>
        </div>

        <SubmissionsTable
          submissions={activeData}
          variant={activeTab === "failed" ? "failed" : "successful"}
        />
      </section>
    </div>
  );
}
