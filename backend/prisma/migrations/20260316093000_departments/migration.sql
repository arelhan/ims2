-- Add normalized Department table and move Personnel.department string to relation

CREATE TABLE "Department" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX "Department_name_key" ON "Department"("name");

INSERT INTO "Department" ("id", "name", "createdAt")
SELECT lower(hex(randomblob(4))) || lower(hex(randomblob(2))) || '4' || substr(lower(hex(randomblob(2))), 2) ||
       substr('89ab', abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))), 2) || lower(hex(randomblob(6))),
       trim("department"),
       CURRENT_TIMESTAMP
FROM "Personnel"
WHERE trim("department") <> ''
GROUP BY trim("department");

INSERT OR IGNORE INTO "Department" ("id", "name", "createdAt")
VALUES (
  lower(hex(randomblob(4))) || lower(hex(randomblob(2))) || '4' || substr(lower(hex(randomblob(2))), 2) ||
  substr('89ab', abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))), 2) || lower(hex(randomblob(6))),
  'Genel',
  CURRENT_TIMESTAMP
);

ALTER TABLE "Personnel" ADD COLUMN "departmentId" TEXT;

UPDATE "Personnel"
SET "departmentId" = (
  SELECT d."id"
  FROM "Department" d
  WHERE d."name" = trim("Personnel"."department")
  LIMIT 1
);

UPDATE "Personnel"
SET "departmentId" = (
  SELECT d."id" FROM "Department" d WHERE d."name" = 'Genel' LIMIT 1
)
WHERE "departmentId" IS NULL;

PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;

CREATE TABLE "new_Personnel" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "phone" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Personnel_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

INSERT INTO "new_Personnel" ("id", "name", "email", "departmentId", "phone", "createdAt")
SELECT "id", "name", "email", "departmentId", "phone", "createdAt"
FROM "Personnel";

DROP TABLE "Personnel";
ALTER TABLE "new_Personnel" RENAME TO "Personnel";

CREATE UNIQUE INDEX "Personnel_email_key" ON "Personnel"("email");

PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
