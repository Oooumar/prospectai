-- =============================================
-- COLLER CE SQL DANS : Neon Dashboard > SQL Editor
-- =============================================

-- 1. Donner les droits au rôle authenticator
GRANT ALL ON SCHEMA public TO authenticator;
GRANT CREATE ON SCHEMA public TO authenticator;

-- 2. Créer les ENUMs
CREATE TYPE IF NOT EXISTS "ProspectStatus" AS ENUM ('NEW', 'CONTACTED', 'OPENED', 'REPLIED', 'CONVERTED', 'UNSUBSCRIBED');
CREATE TYPE IF NOT EXISTS "CampaignStatus" AS ENUM ('DRAFT', 'ACTIVE', 'PAUSED', 'COMPLETED');
CREATE TYPE IF NOT EXISTS "EmailStatus" AS ENUM ('PENDING', 'SENT', 'FAILED', 'OPENED', 'REPLIED', 'BOUNCED');

-- 3. Table User
CREATE TABLE IF NOT EXISTS "User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "password" TEXT,
    "dailyLimit" INTEGER NOT NULL DEFAULT 50,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email");

-- 4. Table Account (OAuth)
CREATE TABLE IF NOT EXISTS "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,
    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- 5. Table Session
CREATE TABLE IF NOT EXISTS "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "Session_sessionToken_key" ON "Session"("sessionToken");

-- 6. Table VerificationToken
CREATE TABLE IF NOT EXISTS "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS "VerificationToken_token_key" ON "VerificationToken"("token");
CREATE UNIQUE INDEX IF NOT EXISTS "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- 7. Table Prospect
CREATE TABLE IF NOT EXISTS "Prospect" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "company" TEXT,
    "website" TEXT,
    "niche" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "address" TEXT,
    "rating" DOUBLE PRECISION,
    "reviewCount" INTEGER,
    "status" "ProspectStatus" NOT NULL DEFAULT 'NEW',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Prospect_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "Prospect_userId_idx" ON "Prospect"("userId");
CREATE INDEX IF NOT EXISTS "Prospect_niche_city_idx" ON "Prospect"("niche", "city");

-- 8. Table Campaign
CREATE TABLE IF NOT EXISTS "Campaign" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "niche" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "template" TEXT NOT NULL,
    "status" "CampaignStatus" NOT NULL DEFAULT 'DRAFT',
    "dailyLimit" INTEGER NOT NULL DEFAULT 20,
    "sentCount" INTEGER NOT NULL DEFAULT 0,
    "openCount" INTEGER NOT NULL DEFAULT 0,
    "replyCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Campaign_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "Campaign_userId_idx" ON "Campaign"("userId");

-- 9. Table EmailLog
CREATE TABLE IF NOT EXISTS "EmailLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "prospectId" TEXT NOT NULL,
    "campaignId" TEXT,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "status" "EmailStatus" NOT NULL DEFAULT 'PENDING',
    "messageId" TEXT,
    "openedAt" TIMESTAMP(3),
    "repliedAt" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EmailLog_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "EmailLog_userId_idx" ON "EmailLog"("userId");
CREATE INDEX IF NOT EXISTS "EmailLog_prospectId_idx" ON "EmailLog"("prospectId");

-- 10. Foreign Keys
ALTER TABLE "Account"  ADD CONSTRAINT "Account_userId_fkey"   FOREIGN KEY ("userId")     REFERENCES "User"("id")     ON DELETE CASCADE;
ALTER TABLE "Session"  ADD CONSTRAINT "Session_userId_fkey"   FOREIGN KEY ("userId")     REFERENCES "User"("id")     ON DELETE CASCADE;
ALTER TABLE "Prospect" ADD CONSTRAINT "Prospect_userId_fkey"  FOREIGN KEY ("userId")     REFERENCES "User"("id")     ON DELETE CASCADE;
ALTER TABLE "Campaign" ADD CONSTRAINT "Campaign_userId_fkey"  FOREIGN KEY ("userId")     REFERENCES "User"("id")     ON DELETE CASCADE;
ALTER TABLE "EmailLog" ADD CONSTRAINT "EmailLog_userId_fkey"  FOREIGN KEY ("userId")     REFERENCES "User"("id")     ON DELETE CASCADE;
ALTER TABLE "EmailLog" ADD CONSTRAINT "EmailLog_prospectId_fkey" FOREIGN KEY ("prospectId") REFERENCES "Prospect"("id") ON DELETE CASCADE;
ALTER TABLE "EmailLog" ADD CONSTRAINT "EmailLog_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE SET NULL;

-- 11. Droits finaux
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticator;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticator;

-- Vérification
SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;
