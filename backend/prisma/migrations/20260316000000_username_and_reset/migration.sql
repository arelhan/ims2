-- Rename email -> username in User, add resetCode fields
-- SQLite requires recreating the table to rename a column

CREATE TABLE "User_new" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'VIEWER',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resetCode" TEXT,
    "resetCodeExpiry" DATETIME
);

INSERT INTO "User_new" ("id", "name", "username", "passwordHash", "role", "createdAt")
SELECT "id", "name", "email", "passwordHash", "role", "createdAt" FROM "User";

DROP TABLE "User";

ALTER TABLE "User_new" RENAME TO "User";

CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
