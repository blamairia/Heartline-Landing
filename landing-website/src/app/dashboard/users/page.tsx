// src/app/dashboard/users/page.tsx
import React from 'react';
import { prisma } from '@/lib/prisma'; // Assuming prisma client is exported from here
import UsersTable from '@/components/dashboard/users-table';
import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Users Management | Hearline Dashboard',
  description: 'Manage users in the Hearline system.',
};

async function getUsers() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
      }
    });
    return users;
  } catch (error) {
    console.error("Failed to fetch users:", error);
    return []; // Return empty array on error
  }
}

export default async function UsersPage() {
  const users = await getUsers();

  return (
    <>
      <DashboardHeader
        title="Users Management"
        description="View and manage user accounts."
      />
      <div className="container mx-auto px-4 py-8">
        {users.length > 0 ? (
          <UsersTable users={users} />
        ) : (
          <p>No users found or failed to load users.</p>
        )}
      </div>
    </>
  );
}
