import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DashboardClient } from "@/components/DashboardClient";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/");

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: session.user.id },
    select: { username: true, triggerPhrase: true, lastSyncedAt: true },
  });

  return (
    <main className="max-w-xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold mb-8">Dashboard</h1>
      <DashboardClient
        username={user.username}
        initialTriggerPhrase={user.triggerPhrase}
        lastSyncedAt={user.lastSyncedAt?.toISOString() ?? null}
      />
    </main>
  );
}
