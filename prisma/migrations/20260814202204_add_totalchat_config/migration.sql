-- CreateTable
CREATE TABLE "totalchat_config" (
    "id" TEXT NOT NULL,
    "apiUrl" TEXT,
    "username" TEXT,
    "password" TEXT,
    "connectionId" INTEGER,
    "pollingEnabled" BOOLEAN NOT NULL DEFAULT false,
    "pollIntervalSeconds" INTEGER NOT NULL DEFAULT 60,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "totalchat_config_pkey" PRIMARY KEY ("id")
);
