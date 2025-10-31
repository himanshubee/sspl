import Link from "next/link";
import Image from "next/image";

export const metadata = {
  title: "Thank You | SSPL Registration",
  description:
    "Confirmation page for the SSPL Season 2026 registration submission.",
};

export default function ThankYouPage() {
  return (
    <div className="min-h-screen bg-slate-100 py-12">
      <div className="mx-auto flex w-full max-w-3xl flex-col items-center gap-8 rounded-3xl bg-white p-10 text-center shadow-lg">
        <Image
          src="/sspl-2026.png"
          alt="SSPL Season 2026 logo"
          width={120}
          height={120}
          className="h-24 w-24"
          priority
        />
        <h1 className="text-3xl font-bold text-slate-900">
          Registration Submitted!
        </h1>
        <p className="max-w-xl text-base text-slate-600">
          Thank you for registering for SSPL Season 2026. We&apos;ve received your
          details and payment screenshot. The team will review your submission and
          contact you soon if anything else is needed.
        </p>
      </div>
    </div>
  );
}
