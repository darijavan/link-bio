import { redirect } from "next/navigation";
import Link from "next/link";
import { auth, signIn } from "@/lib/auth";

export default async function Home() {
  const session = await auth();
  if (session?.user?.id) redirect("/dashboard");

  return (
    <main className="flex flex-col flex-1 items-center justify-center min-h-screen bg-white px-4">
      <div className="max-w-sm w-full text-center space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">link-bio</h1>
        <p className="text-gray-500">
          Turn your Instagram posts into a beautiful link-in-bio page — automatically.
        </p>

        <form
          action={async () => {
            "use server";
            await signIn("instagram", { redirectTo: "/dashboard" });
          }}
        >
          <button
            type="submit"
            className="w-full py-3 px-6 bg-linear-to-r from-purple-500 via-pink-500 to-orange-400 text-white font-semibold rounded-xl hover:opacity-90 transition-opacity"
          >
            Connect with Instagram
          </button>
        </form>
      </div>

      <footer className="absolute bottom-6 flex gap-4 text-xs text-gray-400">
        <Link href="/privacy" className="hover:text-gray-600">Privacy Policy</Link>
        <Link href="/terms" className="hover:text-gray-600">Terms of Service</Link>
      </footer>
    </main>
  );
}
