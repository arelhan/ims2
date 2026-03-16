-- Force admin-only users: make role default ADMIN and convert existing users to ADMIN
-- SQLite: recreate table to change default value.

CREATE TABLE "User_new" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'ADMIN',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resetCode" TEXT,
    "resetCodeExpiry" DATETIME
);

INSERT INTO "User_new" ("id", "name", "username", "passwordHash", "role", "createdAt", "resetCode", "resetCodeExpiry")
SELECT "id", "name", "username", "passwordHash", 'ADMIN', "createdAt", "resetCode", "resetCodeExpiry"
FROM "User";

DROP TABLE "User";

ALTER TABLE "User_new" RENAME TO "User";

CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
