import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Data Deletion Status — link-bio",
};

interface Props {
  searchParams: Promise<{ code?: string; id?: string }>;
}

export default async function DeletionStatusPage({ searchParams }: Props) {
  const { code, id } = await searchParams;

  return (
    <main className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="max-w-sm w-full text-center space-y-4">
        <div className="text-4xl">✓</div>
        <h1 className="text-xl font-semibold text-gray-900">Data Deleted</h1>
        <p className="text-gray-600 text-sm">
          Your link-bio account and all associated data have been permanently deleted.
        </p>

        {code && id && (
          <div className="bg-gray-50 rounded-lg px-4 py-3 text-left space-y-1">
            <p className="text-xs text-gray-500">Confirmation code</p>
            <p className="font-mono text-xs text-gray-800 break-all">{code}</p>
            <p className="text-xs text-gray-500 mt-2">Instagram user ID</p>
            <p className="font-mono text-xs text-gray-800">{id}</p>
          </div>
        )}

        <p className="text-xs text-gray-400">
          If you have questions, contact us at{" "}
          <a href="mailto:darijavan@gmail.com" className="underline hover:text-gray-600">
            darijavan@gmail.com
          </a>
        </p>

        <Link href="/" className="inline-block text-xs text-gray-400 hover:text-gray-600">
          ← Back to home
        </Link>
      </div>
    </main>
  );
}
