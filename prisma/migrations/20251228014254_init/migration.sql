-- CreateTable
CREATE TABLE "Receipt" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "url" TEXT NOT NULL,
    "driveId" TEXT NOT NULL,
    "merchant" TEXT,
    "date" DATETIME,
    "amount" REAL,
    "currency" TEXT DEFAULT 'USD',
    "category" TEXT,
    "status" TEXT NOT NULL DEFAULT 'processing',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
