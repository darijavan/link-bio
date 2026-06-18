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
  const user = await getPublicProfile(username);
  return {
    title: user?.headerText?.trim() || `@${username}`,
    icons: user?.profilePictureUrl
      ? { icon: `/api/avatar/${username}` }
      : undefined,
  };
}

export default async function ProfilePage({ params }: Props) {
  const { username } = await params;

  const user = await getPublicProfile(username);
  if (!user) notFound();

  const { posts, nextCursor } = await getPostsPage(user.id);
  const headerLabel = user.headerText?.trim() || `@${user.username}`;

  return (
    <main className="min-h-screen bg-white">
      <header className="flex justify-center border-b border-[#ddd] px-4 py-4">
        <a href={`https://www.instagram.com/${user.username}`} target="_blank" rel="noopener noreferrer" className="flex items-center">
          {user.profilePictureUrl && (
            <img
              src={`/api/avatar/${user.username}`}
              alt={`${user.username} profile picture`}
              className="h-8 w-8 rounded-full object-cover"
            />
          )}
          <span className={`text-sm font-medium leading-8 text-[#2a2a2a] ${user.profilePictureUrl ? "ml-2" : ""}`}>
            {headerLabel}
          </span>
        </a>
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
