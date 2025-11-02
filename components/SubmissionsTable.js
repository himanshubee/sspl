"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import * as XLSX from "xlsx";

const playerTypeLabels = {
  batsman: "Batsman",
  bowler: "Bowler",
  all_rounder: "All Rounder",
  other: "Other",
};

const foodTypeLabels = {
  veg: "Veg",
  non_veg: "Non-Veg",
  other: "Other",
};

function formatValue(primary, other, labels) {
  if (labels && primary && labels[primary]) {
    return other ? other : labels[primary];
  }
  if (other) return other;
  return primary;
}

function formatTimestamp(timestamp) {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }
  return date.toISOString().replace("T", " ").replace("Z", " UTC");
}

const publicStorageBaseUrl =
  process.env.NEXT_PUBLIC_STORAGE_BASE_URL ??
  process.env.NEXT_PUBLIC_B2_PUBLIC_BASE_URL ??
  null;

function buildPublicObjectUrl(key) {
  if (!publicStorageBaseUrl || !key) return null;
  try {
    const normalizedBase = publicStorageBaseUrl.endsWith("/")
      ? publicStorageBaseUrl
      : `${publicStorageBaseUrl}/`;
    const normalizedKey = key.replace(/^\/+/, "");
    return new URL(normalizedKey, normalizedBase).toString();
  } catch {
    return null;
  }
}

function resolveDownloadUrl(url) {
  if (!url) return "";
  const directUrl = buildPublicObjectUrl(url);
  if (directUrl) return directUrl;
  try {
    return new URL(url, window.location.origin).href;
  } catch {
    return url;
  }
}

function buildExportRows(submissions, variant) {
  return submissions.map((submission) => ({
    "Submitted At": formatTimestamp(submission.createdAt),
    Name: submission.name,
    Address: submission.address,
    "Player Type": formatValue(
      submission.playerType,
      submission.playerTypeOther,
      playerTypeLabels,
    ),
    "T-Shirt Size": submission.tshirtSize,
    "Jersey Name": submission.jerseyName,
    "Jersey Number": submission.jerseyNumber,
    "Food Preference": formatValue(
      submission.foodType,
      submission.foodTypeOther,
      foodTypeLabels,
    ),
    "Photo URL": resolveDownloadUrl(
      submission.photoDownloadUrl ??
        submission.photoUrl ??
        submission.photo ??
        "",
    ),
    "Payment Screenshot URL": resolveDownloadUrl(
      submission.paymentDownloadUrl ??
        submission.paymentUrl ??
        submission.paymentScreenshot ??
        "",
    ),
    "Entry Type": variant === "failed" ? "Failed" : "Successful",
    "Failure Reason": submission.failureReason ?? "",
    "Failure Message": submission.failureMessage ?? "",
    "Payment Validated": submission.paymentValidated ? "Yes" : "No",
    "Submission ID": submission.id,
  }));
}

export default function SubmissionsTable({
  submissions,
  variant = "successful",
  onSubmissionApproved,
  onSubmissionDeleted,
  onSubmissionPaymentValidated,
}) {
  const [modal, setModal] = useState(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [approvingId, setApprovingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [updatingPaymentId, setUpdatingPaymentId] = useState(null);
  const [rows, setRows] = useState(submissions);

  useEffect(() => {
    setRows(submissions);
  }, [submissions]);

  async function fetchSignedAttachment(key) {
    const directUrl = buildPublicObjectUrl(key);
    if (directUrl) {
      return directUrl;
    }

    const response = await fetch(
      `/api/admin/signed-url?key=${encodeURIComponent(key)}`,
    );
    if (!response.ok) {
      throw new Error(`Failed to fetch signed URL (${response.status})`);
    }
    const payload = await response.json();
    if (!payload?.url) {
      throw new Error("Signed URL payload missing url field");
    }
    return payload.url;
  }

  async function openAttachment(submission, type) {
    const title = type === "photo" ? "Player Photo" : "Payment Screenshot";
    const fallback =
      type === "photo" ? submission.photo : submission.paymentScreenshot;
    const storageKey =
      type === "photo"
        ? submission.photoKey
        : submission.paymentScreenshotKey;

    if (fallback) {
      setModal({
        type: "image",
        title,
        submission,
        url: resolveDownloadUrl(fallback),
        loading: false,
        error: null,
      });
      return;
    }

    if (!storageKey) {
      setModal({
        type: "image",
        title,
        submission,
        url: null,
        loading: false,
        error: "Attachment is not available for this submission.",
      });
      return;
    }

    setModal({
      type: "image",
      title,
      submission,
      url: null,
      loading: true,
      error: null,
    });

    try {
      const signedUrl = await fetchSignedAttachment(storageKey);
      setModal({
        type: "image",
        title,
        submission,
        url: resolveDownloadUrl(signedUrl),
        loading: false,
        error: null,
      });
    } catch (error) {
      console.error("[Admin] Failed to load attachment", error);
      setModal({
        type: "image",
        title,
        submission,
        url: null,
        loading: false,
        error: "Unable to load the attachment. Please try again.",
      });
    }
  }

  async function handleDownload() {
    if (!rows?.length || isDownloading) return;
    setIsDownloading(true);
    try {
      const enhanced = await Promise.all(
        rows.map(async (submission) => {
          const photoDownloadUrl = submission.photo
            ? resolveDownloadUrl(submission.photo)
            : submission.photoKey
              ? await fetchSignedAttachment(submission.photoKey).catch(
                  (error) => {
                    console.error(
                      "[Admin] Failed to sign photo for export",
                      error,
                    );
                    return "";
                  },
                )
              : "";
          const paymentDownloadUrl = submission.paymentScreenshot
            ? resolveDownloadUrl(submission.paymentScreenshot)
            : submission.paymentScreenshotKey
              ? await fetchSignedAttachment(
                  submission.paymentScreenshotKey,
                ).catch((error) => {
                  console.error(
                    "[Admin] Failed to sign payment screenshot for export",
                    error,
                  );
                  return "";
                })
              : "";
          return {
            ...submission,
            photoDownloadUrl,
            paymentDownloadUrl,
          };
        }),
      );

      const rows = buildExportRows(enhanced, variant);
      const worksheet = XLSX.utils.json_to_sheet(rows);
      const workbook = XLSX.utils.book_new();
      const sheetName = variant === "failed" ? "Failed Submissions" : "Submissions";
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
      const excelBuffer = XLSX.write(workbook, {
        type: "array",
        bookType: "xlsx",
      });
      const blob = new Blob([excelBuffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      const filenamePrefix =
        variant === "failed" ? "sspl-failed-submissions" : "sspl-submissions";
      anchor.download = `${filenamePrefix}-${Date.now()}.xlsx`;
      anchor.click();
      setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 2000);
    } catch (error) {
      console.error("[Admin] Failed to prepare export", error);
      if (typeof window !== "undefined" && typeof window.alert === "function") {
        window.alert("Unable to prepare the export. Please try again.");
      }
    } finally {
      setIsDownloading(false);
    }
  }

  async function handleApprove(submission) {
    if (!submission?.id || approvingId) return;

    setApprovingId(submission.id);
    try {
      const response = await fetch("/api/admin/approve", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: submission.id }),
      });

      let payload = null;
      try {
        payload = await response.json();
      } catch {
        payload = null;
      }

      if (!response.ok) {
        const message =
          payload?.error ??
          `Failed to approve submission (${response.status}).`;
        throw new Error(message);
      }

      const approvedSubmission = payload?.submission;
      if (!approvedSubmission) {
        throw new Error(
          "Approval response is missing submission data. Please refresh and try again.",
        );
      }

      onSubmissionApproved?.(approvedSubmission);
      setRows((prev) =>
        prev.filter((row) => row.id !== submission.id),
      );
    } catch (error) {
      console.error("[Admin] Failed to approve submission", error);
      setRows((prev) => {
        const exists = prev.some((row) => row.id === submission.id);
        if (exists) return prev;
        return [submission, ...prev];
      });
      if (typeof window !== "undefined" && typeof window.alert === "function") {
        window.alert(
          error instanceof Error && error.message
            ? error.message
            : "Unable to approve the submission. Please try again.",
        );
      }
    } finally {
      setApprovingId(null);
    }
  }

  async function handleDelete(submission) {
    if (!submission?.id || deletingId) return;

    if (typeof window !== "undefined") {
      const confirmed = window.confirm(
        "Are you sure you want to remove this submission from the successful list?",
      );
      if (!confirmed) return;
    }

    setDeletingId(submission.id);
    setRows((prev) =>
      prev.filter((row) => row.id !== submission.id),
    );
    try {
      const response = await fetch("/api/admin/delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: submission.id }),
      });

      let payload = null;
      try {
        payload = await response.json();
      } catch {
        payload = null;
      }

      if (!response.ok) {
        const message =
          payload?.error ??
          `Failed to delete submission (${response.status}).`;
        throw new Error(message);
      }

      onSubmissionDeleted?.(submission.id);
    } catch (error) {
      console.error("[Admin] Failed to delete submission", error);
      setRows((prev) => {
        const exists = prev.some((row) => row.id === submission.id);
        if (exists) return prev;
        return [submission, ...prev];
      });
      if (typeof window !== "undefined" && typeof window.alert === "function") {
        window.alert(
          error instanceof Error && error.message
            ? error.message
            : "Unable to delete the submission. Please try again.",
        );
      }
    } finally {
      setDeletingId(null);
    }
  }

  async function handleTogglePaymentValidation(submission) {
    if (!submission?.id || updatingPaymentId) return;

    const nextValue = !submission.paymentValidated;
    setUpdatingPaymentId(submission.id);
    const previousValue = submission.paymentValidated ?? false;
    const optimisticSubmission = {
      ...submission,
      paymentValidated: nextValue,
    };
    setRows((prev) =>
      prev.map((row) =>
        row.id === submission.id ? optimisticSubmission : row,
      ),
    );
    onSubmissionPaymentValidated?.(optimisticSubmission);
    try {
      const response = await fetch("/api/admin/payment-validation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: submission.id, validated: nextValue }),
      });

      let payload = null;
      try {
        payload = await response.json();
      } catch {
        payload = null;
      }

      if (!response.ok) {
        const message =
          payload?.error ??
          `Failed to update payment validation (${response.status}).`;
        throw new Error(message);
      }

      const updatedSubmission =
        payload?.submission ?? { ...submission, paymentValidated: nextValue };
      setRows((prev) =>
        prev.map((row) =>
          row.id === submission.id ? updatedSubmission : row,
        ),
      );
      onSubmissionPaymentValidated?.(updatedSubmission);
    } catch (error) {
      console.error("[Admin] Failed to update payment validation", error);
      setRows((prev) =>
        prev.map((row) =>
          row.id === submission.id
            ? { ...row, paymentValidated: previousValue }
            : row,
        ),
      );
      onSubmissionPaymentValidated?.({
        ...submission,
        paymentValidated: previousValue,
      });
      if (typeof window !== "undefined" && typeof window.alert === "function") {
        window.alert(
          error instanceof Error && error.message
            ? error.message
            : "Unable to update the payment validation. Please try again.",
        );
      }
    } finally {
      setUpdatingPaymentId(null);
    }
  }

  return (
    <div className="space-y-4">
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-8">
          <div className="relative max-h-[90vh] w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl">
            <button
              type="button"
              onClick={() => setModal(null)}
              className="absolute right-3 top-3 rounded-full bg-black/60 px-3 py-1 text-sm font-medium text-white hover:bg-black/80 focus:outline-none focus:ring-2 focus:ring-white/80"
            >
              Close
            </button>
            <div className="flex flex-col gap-3 p-6">
              <h2 className="text-lg font-semibold text-slate-900">
                {modal.title}
              </h2>
              <div className="flex justify-between text-xs text-slate-500">
                <span>Player: {modal.submission.name}</span>
                <span>
                  Submitted{" "}
                  {new Date(modal.submission.createdAt).toLocaleString()}
                </span>
              </div>
              <figure className="flex flex-col items-center justify-center overflow-auto rounded-xl border border-slate-200 bg-slate-50 p-4">
                {modal.loading ? (
                  <div className="flex h-64 w-full items-center justify-center text-sm text-slate-500">
                    Loading attachment…
                  </div>
                ) : modal.error ? (
                  <div className="flex h-64 w-full items-center justify-center px-6 text-center text-sm text-red-600">
                    {modal.error}
                  </div>
                ) : (
                  <Image
                    src={modal.url}
                    alt={modal.title}
                    width={800}
                    height={800}
                    className="h-auto w-full max-h-[70vh] rounded-lg object-contain"
                  />
                )}
              </figure>
            </div>
          </div>
        </div>
      )}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-600">
          Showing {rows.length}{" "}
          {variant === "failed" ? "failed submission" : "record"}
          {rows.length !== 1 ? "s" : ""}.
        </p>
        <button
          type="button"
          onClick={() => void handleDownload()}
          disabled={!rows.length || isDownloading}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-600 px-5 py-2 text-sm font-semibold text-white shadow hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-emerald-300"
        >
          {isDownloading
            ? "Preparing…"
            : variant === "failed"
              ? "Download Failed Excel"
              : "Download Excel"}
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr className="text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
              <th className="px-4 py-3">Submitted</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Address</th>
              <th className="px-4 py-3">Player Type</th>
              <th className="px-4 py-3">T-Shirt</th>
              <th className="px-4 py-3">Jersey</th>
              <th className="px-4 py-3">Food</th>
              <th className="px-4 py-3">Photo</th>
              <th className="px-4 py-3">Payment</th>
              {variant === "failed" ? (
                <>
                  <th className="px-4 py-3">Failure Reason</th>
                  <th className="px-4 py-3">Actions</th>
                </>
              ) : null}
              {variant === "successful" ? (
                <>
                  <th className="px-4 py-3">Payment Status</th>
                  <th className="px-4 py-3">Actions</th>
                </>
              ) : null}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white text-sm text-slate-700">
            {rows.length === 0 ? (
              <tr>
                <td
                  className="px-4 py-6 text-center text-slate-500"
                  colSpan={variant === "failed" ? 11 : 11}
                >
                  No submissions yet. Registrations will appear here once
                  players complete the form.
                </td>
              </tr>
            ) : (
              rows.map((submission) => (
                <tr key={submission.id} className="align-top">
                  <td className="px-4 py-3 text-xs text-slate-500">
                    {formatTimestamp(submission.createdAt)}
                  </td>
                  <td className="px-4 py-3 font-semibold text-slate-900">
                    {submission.name}
                  </td>
                  <td className="px-4 py-3 whitespace-pre-wrap">
                    {submission.address}
                  </td>
                  <td className="px-4 py-3">
                    {formatValue(
                      submission.playerType,
                      submission.playerTypeOther,
                      playerTypeLabels,
                    )}
                  </td>
                  <td className="px-4 py-3">{submission.tshirtSize}</td>
                  <td className="px-4 py-3">
                    <div>{submission.jerseyName}</div>
                    <div className="text-xs text-slate-500">
                      #{submission.jerseyNumber}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {formatValue(
                      submission.foodType,
                      submission.foodTypeOther,
                      foodTypeLabels,
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {submission.photoKey || submission.photo ? (
                      <button
                        type="button"
                        onClick={() => void openAttachment(submission, "photo")}
                        className="text-emerald-600 hover:text-emerald-500"
                      >
                        View photo
                      </button>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {submission.paymentScreenshotKey ||
                    submission.paymentScreenshot ? (
                      <button
                        type="button"
                        onClick={() =>
                          void openAttachment(submission, "payment")
                        }
                        className="text-emerald-600 hover:text-emerald-500"
                      >
                        View payment
                      </button>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  {variant === "failed" ? (
                    <>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-amber-600">
                          {submission.failureReason
                            ? submission.failureReason.replace(/_/g, " ")
                            : "Unknown"}
                        </div>
                        {submission.failureMessage ? (
                          <div className="text-xs text-slate-500">
                            {submission.failureMessage}
                          </div>
                        ) : null}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => void handleApprove(submission)}
                          disabled={approvingId === submission.id}
                          className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-600 px-4 py-1.5 text-xs font-semibold text-white shadow hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-1 disabled:cursor-not-allowed disabled:bg-emerald-300"
                        >
                          {approvingId === submission.id
                            ? "Approving…"
                            : "Approve"}
                        </button>
                      </td>
                    </>
                  ) : null}
                  {variant === "successful" ? (
                    <>
                      <td className="px-4 py-3">
                        <div
                          className={`mb-2 inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                            submission.paymentValidated
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {submission.paymentValidated ? "Validated" : "Pending"}
                        </div>
                        <div className="inline-flex items-center gap-3">
                          <span className="text-xs text-slate-500">
                            {submission.paymentValidated ? "On" : "Off"}
                          </span>
                          <button
                            type="button"
                            role="switch"
                            aria-checked={submission.paymentValidated}
                            onClick={() =>
                              void handleTogglePaymentValidation(submission)
                            }
                            disabled={updatingPaymentId === submission.id}
                            className={`relative inline-flex h-6 w-12 items-center rounded-full transition ${
                              submission.paymentValidated
                                ? "bg-emerald-500"
                                : "bg-slate-300"
                            } ${
                              updatingPaymentId === submission.id
                                ? "opacity-60"
                                : "hover:brightness-110"
                            }`}
                          >
                            <span
                              className={`absolute left-1 inline-flex h-4 w-4 transform items-center justify-center rounded-full bg-white text-[10px] font-semibold text-slate-600 transition ${
                                submission.paymentValidated ? "translate-x-6" : ""
                              }`}
                            >
                              {updatingPaymentId === submission.id ? "…" : ""}
                            </span>
                            <span className="sr-only">Toggle payment validated</span>
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => void handleDelete(submission)}
                          disabled={deletingId === submission.id}
                          className="inline-flex items-center justify-center gap-2 rounded-full bg-red-600 px-4 py-1.5 text-xs font-semibold text-white shadow hover:bg-red-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1 disabled:cursor-not-allowed disabled:bg-red-300"
                        >
                          {deletingId === submission.id ? "Removing…" : "Remove"}
                        </button>
                      </td>
                    </>
                  ) : null}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
