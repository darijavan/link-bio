import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getPostsPage } from "@/lib/posts";
import { PostGrid } from "@/components/PostGrid";

interface Props {
  params: Promise<{ username: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { username } = await params;
  return { title: `@${username}` };
}

export default async function ProfilePage({ params }: Props) {
  const { username } = await params;

  const user = await prisma.user.findUnique({
    where: { username },
    select: { id: true, username: true },
  });
  if (!user) notFound();

  const { posts, nextCursor } = await getPostsPage(user.id);

  return (
    <main className="mx-auto w-full max-w-170 py-8">
      <header className="mb-6 px-3 text-center">
        <h1 className="text-xl font-semibold">@{user.username}</h1>
      </header>

      {posts.length === 0 ? (
        <p className="text-center text-gray-500 py-16">No posts yet.</p>
      ) : (
        <PostGrid
          username={user.username}
          initialPosts={posts}
          initialNextCursor={nextCursor}
        />
      )}
    </main>
  );
}
