// No seed data needed.
// Admin account is created via the setup wizard on first launch.
// Run: cd backend && npx prisma migrate deploy
// Then open http://localhost:3001 to complete setup.
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
async function main() {}
main().finally(() => prisma.$disconnect())
