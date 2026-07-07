-- Migration : table AiUsageLog pour le comptage des générations IA par plan
-- À exécuter avec l'URL owner (neondb_owner) dans Neon

CREATE TABLE IF NOT EXISTS "AiUsageLog" (
  "id"        TEXT NOT NULL,
  "userId"    TEXT NOT NULL,
  "type"      TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AiUsageLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "AiUsageLog_userId_createdAt_idx"
  ON "AiUsageLog"("userId", "createdAt");

GRANT ALL ON "AiUsageLog" TO authenticator;
