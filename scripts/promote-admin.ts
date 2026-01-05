#!/usr/bin/env npx ts-node
/**
 * Admin Promotion Script
 * 
 * Usage:
 *   npx ts-node scripts/promote-admin.ts <email>
 *   
 * Or make executable:
 *   chmod +x scripts/promote-admin.ts
 *   ./scripts/promote-admin.ts <email>
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const email = process.argv[2]
  
  if (!email) {
    console.error('❌ Usage: npx ts-node scripts/promote-admin.ts <email>')
    console.error('')
    console.error('Examples:')
    console.error('  npx ts-node scripts/promote-admin.ts admin@example.com')
    console.error('  npm run promote-admin admin@example.com')
    process.exit(1)
  }

  console.log(`🔍 Looking for user: ${email}`)
  
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      name: true,
      role: true
    }
  })

  if (!user) {
    console.error(`❌ User not found: ${email}`)
    console.log('')
    console.log('Available users:')
    const users = await prisma.user.findMany({
      select: { email: true, name: true, role: true },
      take: 10,
      orderBy: { createdAt: 'desc' }
    })
    users.forEach((u: { email: string; name: string | null; role: string }) => {
      console.log(`  - ${u.email} (${u.name || 'No name'}) [${u.role}]`)
    })
    process.exit(1)
  }

  if (user.role === 'admin') {
    console.log(`✅ User ${email} is already an admin`)
    process.exit(0)
  }

  console.log(`📝 Promoting ${email} to admin...`)
  
  await prisma.user.update({
    where: { email },
    data: { role: 'admin' }
  })

  console.log(`✅ Successfully promoted ${email} to admin!`)
  console.log('')
  console.log(`User Details:`)
  console.log(`  ID: ${user.id}`)
  console.log(`  Email: ${user.email}`)
  console.log(`  Name: ${user.name || 'Not set'}`)
  console.log('')
  console.log(`They can now access the admin panel at /admin`)
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect()
  })
