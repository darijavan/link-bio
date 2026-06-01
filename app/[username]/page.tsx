/* eslint-disable @next/next/no-img-element */
import { notFound } from "next/navigation";
import { getPostsPage } from "@/lib/posts";
import { getPublicProfile } from "@/lib/public-profile";
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

  const user = await getPublicProfile(username);
  if (!user) notFound();

  const { posts, nextCursor } = await getPostsPage(user.id);

  return (
    <main className="min-h-screen bg-white">
      <header className="flex justify-start border-b border-[#ddd] px-4 py-4 md:justify-center">
        {user.logoUrl ? (
          <img
            src={user.logoUrl}
            alt={`${user.username} logo`}
            className="h-8 max-w-45 object-contain"
          />
        ) : (
          <span className="text-sm font-medium leading-8 text-[#2a2a2a]">@{user.username}</span>
        )}
      </header>

      <div className="mx-auto w-full max-w-170">
        <p className="my-4 px-2 py-2 text-center text-sm leading-4.5 text-[#666]">
          Click on media to view link
        </p>

        {posts.length === 0 ? (
          <p className="text-center text-gray-500 py-16">No posts yet.</p>
        ) : (
          <PostGrid
            username={user.username}
            initialPosts={posts}
            initialNextCursor={nextCursor}
          />
        )}
      </div>
    </main>
  );
}
