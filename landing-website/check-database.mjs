import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkUsers() {
  try {
    console.log('Checking users in database...')
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        organization: true,
        role: true,
        createdAt: true,
        emailVerified: true
      }
    })
    
    console.log(`Found ${users.length} users:`)
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email} - ${user.firstName} ${user.lastName} (${user.organization}) - Created: ${user.createdAt}`)
    })
    
    if (users.length === 0) {
      console.log('❌ No users found in database')
    } else {
      console.log('✅ Users found in database')
    }
    
  } catch (error) {
    console.error('❌ Error checking database:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkUsers()
