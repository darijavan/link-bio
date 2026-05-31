-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "instagramId" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "tokenExpiresAt" TIMESTAMP(3) NOT NULL,
    "triggerPhrase" TEXT NOT NULL DEFAULT 'Link in bio 🔗',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSyncedAt" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Post" (
    "id" TEXT NOT NULL,
    "instagramPostId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "thumbnailUrl" TEXT NOT NULL,
    "caption" TEXT NOT NULL,
    "extractedUrl" TEXT NOT NULL,
    "postedAt" TIMESTAMP(3) NOT NULL,
    "cachedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Post_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_instagramId_key" ON "User"("instagramId");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Post_instagramPostId_key" ON "Post"("instagramPostId");

-- CreateIndex
CREATE INDEX "Post_userId_postedAt_idx" ON "Post"("userId", "postedAt" DESC);

-- AddForeignKey
ALTER TABLE "Post" ADD CONSTRAINT "Post_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
