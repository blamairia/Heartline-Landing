// src/app/dashboard/users/page.tsx
import React from 'react';
import { prisma as db } from '@/lib/prisma';
import { users } from '../../../../db/schema';
import UsersTable from '@/components/dashboard/users-table';
import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Users Management | Heartline Dashboard',
  description: 'Manage users in the Heartline system.',
};

async function getUsers() {
  try {
    const usersList = await db.select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      isActive: users.isActive, // Added isActive field
      createdAt: users.createdAt,
    }).from(users);
    
    return usersList;
  } catch (error) {
    console.error("Failed to fetch users:", error);
    return []; // Return empty array on error
  }
}

export default async function UsersPage() {
  const users = await getUsers();

  return (
    <>
      <DashboardHeader />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Users Management</h1>
          <p className="text-gray-600">View and manage user accounts.</p>
        </div>
        {users.length > 0 ? (
          <UsersTable users={users} />
        ) : (
          <p>No users found or failed to load users.</p>
        )}
      </div>
    </>
  );
}
