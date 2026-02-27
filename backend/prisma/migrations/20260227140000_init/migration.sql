-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enums
DO $$ BEGIN
  CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Tables
CREATE TABLE IF NOT EXISTS "User" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "email" TEXT NOT NULL,
  "passwordHash" TEXT NOT NULL,
  "firstName" TEXT NOT NULL,
  "lastName" TEXT NOT NULL,
  "role" "Role" NOT NULL DEFAULT 'USER',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email");

CREATE TABLE IF NOT EXISTS "Book" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "title" TEXT NOT NULL,
  "author" TEXT NOT NULL,
  "isbn" TEXT NOT NULL,
  "publishedYear" INTEGER,
  "copiesTotal" INTEGER NOT NULL DEFAULT 1,
  "copiesAvailable" INTEGER NOT NULL DEFAULT 1,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "Book_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Book_isbn_key" ON "Book"("isbn");

CREATE TABLE IF NOT EXISTS "Loan" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "userId" TEXT NOT NULL,
  "bookId" TEXT NOT NULL,
  "borrowedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "dueDate" TIMESTAMP(3) NOT NULL,
  "returnedAt" TIMESTAMP(3),

  CONSTRAINT "Loan_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "Loan_userId_idx" ON "Loan"("userId");
CREATE INDEX IF NOT EXISTS "Loan_bookId_idx" ON "Loan"("bookId");

ALTER TABLE "Loan"
  ADD CONSTRAINT "Loan_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Loan"
  ADD CONSTRAINT "Loan_bookId_fkey"
  FOREIGN KEY ("bookId") REFERENCES "Book"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;