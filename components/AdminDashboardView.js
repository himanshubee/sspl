"use client";

import { useCallback, useMemo, useState } from "react";
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
  loadError = null,
}) {
  const [activeTab, setActiveTab] = useState("successful");
  const [approvedFromReview, setApprovedFromReview] = useState([]);
  const [removedReviewIds, setRemovedReviewIds] = useState([]);
  const [deletedSuccessfulIds, setDeletedSuccessfulIds] = useState([]);
  const [successfulOverrides, setSuccessfulOverrides] = useState({});

  const reviewSubmissions = useMemo(() => {
    const base = failedSubmissions ?? [];
    if (!removedReviewIds.length) {
      return base;
    }
    const removed = new Set(removedReviewIds);
    return base.filter((submission) => !removed.has(submission.id));
  }, [failedSubmissions, removedReviewIds]);

  const successfulSubmissions = useMemo(() => {
    const base = submissions ?? [];
    const deletedSet =
      deletedSuccessfulIds.length > 0 ? new Set(deletedSuccessfulIds) : null;
    const baseFiltered = deletedSet
      ? base.filter((submission) => !deletedSet.has(submission.id))
      : base;
    const approvedFiltered = deletedSet
      ? approvedFromReview.filter((submission) => !deletedSet.has(submission.id))
      : approvedFromReview;

    if (!approvedFiltered.length) {
      return baseFiltered;
    }

    const approvedMap = new Map(
      approvedFiltered.map((submission) => [submission.id, submission]),
    );
    const merged = [
      ...approvedFiltered,
      ...baseFiltered.filter((submission) => !approvedMap.has(submission.id)),
    ];
    merged.sort((a, b) => {
      const aTime = a?.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bTime = b?.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bTime - aTime;
    });
    if (!successfulOverrides || !Object.keys(successfulOverrides).length) {
      return merged;
    }
    return merged.map((submission) => {
      const override = successfulOverrides[submission.id];
      return override ? { ...submission, ...override } : submission;
    });
  }, [submissions, approvedFromReview, deletedSuccessfulIds, successfulOverrides]);

  const handleSubmissionApproved = useCallback((approvedSubmission) => {
    if (!approvedSubmission?.id) return;

    setRemovedReviewIds((prev) =>
      prev.includes(approvedSubmission.id)
        ? prev
        : [...prev, approvedSubmission.id],
    );

    setApprovedFromReview((prev) => {
      const filtered = prev.filter(
        (submission) => submission.id !== approvedSubmission.id,
      );
      return [...filtered, approvedSubmission];
    });
  }, []);

  const handleSubmissionDeleted = useCallback((deletedId) => {
    if (!deletedId) return;

    setDeletedSuccessfulIds((prev) =>
      prev.includes(deletedId) ? prev : [...prev, deletedId],
    );

    setApprovedFromReview((prev) =>
      prev.filter((submission) => submission.id !== deletedId),
    );
    setSuccessfulOverrides((prev) => {
      if (!prev || !prev[deletedId]) {
        return prev;
      }
      const next = { ...prev };
      delete next[deletedId];
      return next;
    });
  }, []);

  const handleSubmissionPaymentValidated = useCallback((updatedSubmission) => {
    if (!updatedSubmission?.id) return;

    setApprovedFromReview((prev) =>
      prev.map((submission) =>
        submission.id === updatedSubmission.id
          ? { ...submission, ...updatedSubmission }
          : submission,
      ),
    );

    setSuccessfulOverrides((prev) => ({
      ...prev,
      [updatedSubmission.id]: {
        ...(prev?.[updatedSubmission.id] ?? {}),
        paymentValidated: updatedSubmission.paymentValidated ?? false,
        ocrPaymentDetected: updatedSubmission.ocrPaymentDetected ?? null,
        ocrValidationReasons: updatedSubmission.ocrValidationReasons ?? [],
        ocrMatchedAmount: updatedSubmission.ocrMatchedAmount ?? null,
      },
    }));
  }, []);

  const activeConfig = useMemo(
    () => TAB_CONFIG.find((tab) => tab.key === activeTab) ?? TAB_CONFIG[0],
    [activeTab],
  );

  const activeData =
    activeTab === "failed" ? reviewSubmissions : successfulSubmissions;

  const counts = useMemo(
    () => ({
      successful: successfulSubmissions.length,
      failed: reviewSubmissions.length,
    }),
    [successfulSubmissions, reviewSubmissions],
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

        {loadError ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            Unable to load the latest submissions. Please refresh the page or verify the
            database connection is available.
            <div className="mt-1 text-xs text-red-600/80">
              Details: {loadError}
            </div>
          </div>
        ) : null}

        <SubmissionsTable
          submissions={activeData}
          variant={activeTab === "failed" ? "failed" : "successful"}
          onSubmissionApproved={
            activeTab === "failed" ? handleSubmissionApproved : undefined
          }
          onSubmissionDeleted={
            activeTab === "successful" ? handleSubmissionDeleted : undefined
          }
          onSubmissionPaymentValidated={
            activeTab === "successful"
              ? handleSubmissionPaymentValidated
              : undefined
          }
        />
      </section>
    </div>
  );
}
