"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";

const playerOptions = [
  { label: "Batsman", value: "batsman" },
  { label: "Bowler", value: "bowler" },
  { label: "All Rounder", value: "all_rounder" },
  { label: "Other", value: "other" },
];

const tshirtOptions = [
  "XS - 34",
  "S - 36",
  "M - 38",
  "L - 40",
  "XL- 42",
  "XXL - 44",
  "XXXL - 46",
];

const foodOptions = [
  { label: "Veg", value: "veg" },
  { label: "Non-Veg", value: "non_veg" },
  { label: "Other", value: "other" },
];

const feeOptions = [
  { label: "Payment YES", value: "yes" },
  { label: "Payment NO", value: "no" },
  { label: "Other", value: "other" },
];

export default function Home() {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage("");
    setError("");

    const form = event.currentTarget;
    const formData = new FormData(form);

    try {
      const playerType = formData.get("playerType");
      const playerTypeOther = formData.get("playerTypeOther");
      if (playerType === "other" && !playerTypeOther) {
        throw new Error("Please specify your player type.");
      }

      const foodType = formData.get("foodType");
      const foodTypeOther = formData.get("foodTypeOther");
      if (foodType === "other" && !foodTypeOther) {
        throw new Error("Please specify your food preference.");
      }

      const feeResponse = formData.get("feeResponse");
      const feeResponseOther = formData.get("feeResponseOther");
      if (feeResponse === "other" && !feeResponseOther) {
        throw new Error("Please describe your fee status.");
      }

      const paymentFile = formData.get("paymentScreenshot");
      if (paymentFile instanceof File && paymentFile.size > 1 * 1024 * 1024) {
        throw new Error("Payment screenshot must be under 1 MB.");
      }

      const photoFile = formData.get("photo");
      if (photoFile instanceof File && photoFile.size > 1 * 1024 * 1024) {
        throw new Error("Player photo must be under 1 MB.");
      }

      const response = await fetch("/api/register", {
        method: "POST",
        body: formData,
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "Unable to submit form.");
      }

      form.reset();
      setShowForm(false);
      router.push("/thank-you");
      return;
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "Unexpected error. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-100 py-10">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-10 rounded-3xl bg-white p-6 shadow-lg md:p-12">
        <header className="flex flex-col items-center gap-6 text-center">
          <Image
            src="/sspl-2026.png"
            alt="SSPL Season 2026 logo"
            width={160}
            height={160}
            className="h-24 w-24 md:h-28 md:w-28"
            priority
          />
          <h1 className="text-3xl font-bold text-slate-900 md:text-4xl">
            SSPL Season 2026 Registration
          </h1>
          <p className="max-w-2xl text-base text-slate-600 md:text-lg">
            Complete the payment below, capture a clear screenshot that shows the
            ₹900 transaction, and then proceed to fill out the registration form.
            You will be asked to upload both a player photo and the payment
            screenshot.
          </p>
        </header>

        <section className="flex flex-col items-center gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-6">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <Image
              src="/upi-qr.png"
              alt="UPI QR code for ₹900 payment to adi.kuveskar1988@okicici"
              width={360}
              height={500}
              className="h-auto w-full max-w-xs"
              priority
            />
          </div>
          <p className="text-sm font-medium text-slate-700">
            UPI ID: <span className="font-semibold">adi.kuveskar1988@okicici</span>{" "}
            · Amount: <span className="font-semibold">₹900</span>
          </p>
          <ol className="list-decimal space-y-2 text-left text-sm text-slate-600">
            <li>Scan the QR code using Google Pay, PhonePe, Paytm, or any UPI app.</li>
            <li>Confirm that the amount is ₹900 before completing the payment.</li>
            <li>
              After paying, capture a clear screenshot showing the transaction status and
              amount. You will need to upload this screenshot in the registration form.
            </li>
          </ol>
          {!showForm && (
            <button
              type="button"
              onClick={() => setShowForm(true)}
              className="rounded-full bg-emerald-600 px-6 py-2 text-sm font-semibold text-white shadow hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
            >
              I&apos;ve paid and I&apos;m ready to register
            </button>
          )}
        </section>

        {showForm && (
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-inner md:p-10">
            <form
              className="flex flex-col gap-6"
              onSubmit={handleSubmit}
              encType="multipart/form-data"
            >
              <div>
                <h2 className="text-xl font-semibold text-slate-900">
                  Player Details
                </h2>
                <p className="text-sm text-slate-500">
                  Fields marked with <span className="text-emerald-600">*</span> are
                  required.
                </p>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <label className="flex flex-col gap-2">
                  <span className="text-sm font-medium text-slate-700">
                    Name <span className="text-emerald-600">*</span>
                  </span>
                  <input
                    name="name"
                    type="text"
                    required
                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="Full name"
                  />
                </label>

                <label className="flex flex-col gap-2">
                  <span className="text-sm font-medium text-slate-700">
                    Jersey Name <span className="text-emerald-600">*</span>
                  </span>
                  <input
                    name="jerseyName"
                    type="text"
                    required
                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="Printed on jersey"
                  />
                </label>

                <label className="flex flex-col gap-2 md:col-span-2">
                  <span className="text-sm font-medium text-slate-700">
                    Address <span className="text-emerald-600">*</span>
                  </span>
                  <textarea
                    name="address"
                    rows={3}
                    required
                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="Residential address"
                  />
                </label>

                <label className="flex flex-col gap-2">
                  <span className="text-sm font-medium text-slate-700">
                    Jersey Number <span className="text-emerald-600">*</span>
                  </span>
                  <input
                    name="jerseyNumber"
                    type="text"
                    required
                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="Preferred number"
                  />
                </label>

                <label className="flex flex-col gap-2">
                  <span className="text-sm font-medium text-slate-700">
                    T-Shirt Size <span className="text-emerald-600">*</span>
                  </span>
                  <select
                    name="tshirtSize"
                    required
                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    defaultValue=""
                  >
                    <option value="" disabled>
                      Select size
                    </option>
                    {tshirtOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <fieldset className="grid gap-4 rounded-xl border border-slate-200 p-4">
                <legend className="text-sm font-semibold text-slate-700">
                  Player Type <span className="text-emerald-600">*</span>
                </legend>
                {playerOptions.map((option) => (
                  <label
                    key={option.value}
                    className="flex items-center gap-2 text-sm text-slate-700"
                  >
                    <input
                      type="radio"
                      name="playerType"
                      value={option.value}
                      required
                      className="h-4 w-4 text-emerald-600 focus:ring-emerald-500"
                    />
                    {option.label}
                    {option.value === "other" && (
                      <input
                        type="text"
                        name="playerTypeOther"
                        className="ml-2 flex-1 rounded-md border border-slate-200 px-2 py-1 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        placeholder="Please specify"
                      />
                    )}
                  </label>
                ))}
              </fieldset>

              <fieldset className="grid gap-4 rounded-xl border border-slate-200 p-4">
                <legend className="text-sm font-semibold text-slate-700">
                  Food Preference <span className="text-emerald-600">*</span>
                </legend>
                {foodOptions.map((option) => (
                  <label
                    key={option.value}
                    className="flex items-center gap-2 text-sm text-slate-700"
                  >
                    <input
                      type="radio"
                      name="foodType"
                      value={option.value}
                      required
                      className="h-4 w-4 text-emerald-600 focus:ring-emerald-500"
                    />
                    {option.label}
                    {option.value === "other" && (
                      <input
                        type="text"
                        name="foodTypeOther"
                        className="ml-2 flex-1 rounded-md border border-slate-200 px-2 py-1 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        placeholder="Please specify"
                      />
                    )}
                  </label>
                ))}
              </fieldset>

              <fieldset className="grid gap-4 rounded-xl border border-slate-200 p-4">
                <legend className="text-sm font-semibold text-slate-700">
                  Payment Confirmation <span className="text-emerald-600">*</span>
                </legend>
                <p className="text-sm text-slate-500">
                  OCR verification checks for ₹900 in your screenshot. If OCR fails we
                  will ask you to try again.
                </p>
                {feeOptions.map((option) => (
                  <label
                    key={option.value}
                    className="flex items-center gap-2 text-sm text-slate-700"
                  >
                    <input
                      type="radio"
                      name="feeResponse"
                      value={option.value}
                      required
                      className="h-4 w-4 text-emerald-600 focus:ring-emerald-500"
                    />
                    {option.label}
                    {option.value === "other" && (
                      <input
                        type="text"
                        name="feeResponseOther"
                        className="ml-2 flex-1 rounded-md border border-slate-200 px-2 py-1 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        placeholder="Please specify"
                      />
                    )}
                  </label>
                ))}
              </fieldset>

              <div className="grid gap-6 md:grid-cols-2">
                <label className="flex flex-col gap-2">
                  <span className="text-sm font-medium text-slate-700">
                    Player Photo (jpg/png) <span className="text-emerald-600">*</span>
                  </span>
                  <input
                    name="photo"
                    type="file"
                    required
                    accept="image/png,image/jpeg"
                    className="text-sm text-slate-600 file:mr-4 file:rounded-md file:border-0 file:bg-emerald-600 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-emerald-500"
                  />
                  <span className="text-xs text-slate-500">
                    Upload a recent portrait photo (max 1 MB).
                  </span>
                </label>

                <label className="flex flex-col gap-2">
                  <span className="text-sm font-medium text-slate-700">
                    Payment Screenshot (jpg/png){" "}
                    <span className="text-emerald-600">*</span>
                  </span>
                  <input
                    name="paymentScreenshot"
                    type="file"
                    required
                    accept="image/png,image/jpeg"
                    className="text-sm text-slate-600 file:mr-4 file:rounded-md file:border-0 file:bg-emerald-600 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-emerald-500"
                  />
                  <span className="text-xs text-slate-500">
                    Make sure the ₹900 amount and successful status are clearly visible.
                    File must be under 1 MB.
                  </span>
                </label>
              </div>

              {error && (
                <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
                  {error}
                </p>
              )}

              {message && (
                <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-700">
                  {message}
                </p>
              )}

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 rounded-full bg-emerald-600 px-6 py-2 text-sm font-semibold text-white shadow hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-emerald-300"
                >
                  {isSubmitting ? "Submitting..." : "Submit Registration"}
                </button>
              </div>
            </form>
          </section>
        )}

        {message && !showForm && (
          <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-center text-sm text-emerald-700">
            {message}
          </p>
        )}
      </div>
    </div>
  );
}
