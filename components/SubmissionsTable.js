"use client";

import Image from "next/image";
import { useState } from "react";
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

function resolveDownloadUrl(url) {
  if (!url) return "";
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
    "Payment Verified":
      submission.ocrPaymentDetected === true
        ? `Yes (${submission.ocrMatchedAmount ?? "unknown"})`
        : submission.ocrPaymentDetected === false
          ? "No"
          : "Unknown",
    "OCR Candidate Amounts": Array.isArray(submission.ocrCandidateAmounts)
      ? submission.ocrCandidateAmounts.join(", ")
      : "",
    "OCR Reasons": Array.isArray(submission.ocrValidationReasons)
      ? submission.ocrValidationReasons.join(", ")
      : "",
    "OCR Text": submission.ocrText ?? "",
    "Failure Reason": submission.failureReason ?? "",
    "Failure Message": submission.failureMessage ?? "",
    "Submission ID": submission.id,
  }));
}

export default function SubmissionsTable({ submissions, variant = "successful" }) {
  const [modal, setModal] = useState(null);
  const [isDownloading, setIsDownloading] = useState(false);

  async function fetchSignedAttachment(key) {
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

  function handleViewOcr(submission) {
    setModal({
      type: "text",
      title: "OCR Extract",
      submission,
      text: submission.ocrText || "No OCR text was saved with this submission.",
      amounts: submission.ocrCandidateAmounts ?? [],
      reasons: submission.ocrValidationReasons ?? [],
      matchedAmount: submission.ocrMatchedAmount ?? null,
    });
  }

  async function handleDownload() {
    if (!submissions?.length || isDownloading) return;
    setIsDownloading(true);
    try {
      const enhanced = await Promise.all(
        submissions.map(async (submission) => {
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
              {modal.type === "image" ? (
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
              ) : (
                <div className="flex max-h-[70vh] flex-col gap-3 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="text-sm text-slate-600">
                    {Array.isArray(modal.amounts) && modal.amounts.length > 0 ? (
                      <span>
                        Candidate amounts detected: {modal.amounts.join(", ")}
                      </span>
                    ) : (
                      <span>No numeric amounts detected during OCR.</span>
                    )}
                  </div>
                  {Array.isArray(modal.reasons) && modal.reasons.length > 0 && (
                    <div className="text-xs font-medium uppercase tracking-wide text-emerald-700">
                      Matched rules: {modal.reasons.join(", ")}
                    </div>
                  )}
                  {modal.matchedAmount ? (
                    <div className="text-xs font-semibold text-emerald-600">
                      Verified amount: ₹{modal.matchedAmount}
                    </div>
                  ) : (
                    <div className="text-xs text-amber-600">
                      No qualifying amount detected.
                    </div>
                  )}
                  <pre className="whitespace-pre-wrap break-words rounded-lg bg-white p-4 text-sm text-slate-700 shadow-inner">
                    {modal.text}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-600">
          Showing {submissions.length}{" "}
          {variant === "failed" ? "failed submission" : "record"}
          {submissions.length !== 1 ? "s" : ""}.
        </p>
        <button
          type="button"
          onClick={() => void handleDownload()}
          disabled={!submissions.length || isDownloading}
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
              <th className="px-4 py-3">Payment OCR</th>
              {variant === "failed" && (
                <th className="px-4 py-3">Failure Reason</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white text-sm text-slate-700">
            {submissions.length === 0 ? (
              <tr>
                <td
                  className="px-4 py-6 text-center text-slate-500"
                  colSpan={variant === "failed" ? 11 : 10}
                >
                  No submissions yet. Registrations will appear here once
                  players complete the form.
                </td>
              </tr>
            ) : (
              submissions.map((submission) => (
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
                  <td className="px-4 py-3">
                    <div className="text-sm">
                      {submission.ocrPaymentDetected === true ? (
                        <span className="font-semibold text-emerald-600">
                          Verified
                        </span>
                      ) : submission.ocrPaymentDetected === false ? (
                        <span className="font-semibold text-amber-600">
                          Needs review
                        </span>
                      ) : (
                        <span className="text-slate-400">Unknown</span>
                      )}
                    </div>
                    {Array.isArray(submission.ocrValidationReasons) &&
                      submission.ocrValidationReasons.length > 0 && (
                        <div className="text-xs text-slate-500">
                          {submission.ocrValidationReasons.join(", ")}
                        </div>
                      )}
                    {submission.ocrText ? (
                      <button
                        type="button"
                        onClick={() => handleViewOcr(submission)}
                        className="mt-1 text-xs font-medium text-emerald-600 hover:text-emerald-500"
                      >
                        View OCR text
                      </button>
                    ) : (
                      <div className="mt-1 text-xs text-slate-400">
                        No OCR text
                      </div>
                    )}
                    {submission.ocrMatchedAmount ? (
                      <div className="mt-1 text-xs font-semibold text-emerald-600">
                        Verified amount: ₹{submission.ocrMatchedAmount}
                      </div>
                    ) : null}
                  </td>
                  {variant === "failed" && (
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
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
