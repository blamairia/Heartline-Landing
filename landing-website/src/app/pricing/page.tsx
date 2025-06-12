'use client'

import { useSession } from 'next-auth/react';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { PricingSection } from '@/components/marketing/pricing-section';
import { DashboardHeader } from '@/components/dashboard/dashboard-header';

export default function PricingPage() {
  const { data: session, status } = useSession();
  const isAuthenticated = status === 'authenticated';

  return (
    <>
      {isAuthenticated ? <DashboardHeader /> : <Header />}
      <main className="pt-16 lg:pt-20">
        <PricingSection isAuthenticated={isAuthenticated} />
      </main>
      <Footer />
    </>
  );
}