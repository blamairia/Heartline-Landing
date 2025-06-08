import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Providers } from '@/components/layout/providers'
import '@/styles/globals.css'

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter'
})

export const metadata: Metadata = {
  title: {
    default: 'Hearline - AI-Powered Cardiology Management System',
    template: '%s | Hearline'
  },
  description: 'Revolutionary AI-powered cardiology management system for Algerian healthcare providers. Instant ECG analysis, 7000+ medication database, and comprehensive patient management.',
  keywords: [
    'cardiology',
    'AI ECG analysis', 
    'medical software',
    'Algeria healthcare',
    'patient management',
    'prescription system',
    'ResNet34',
    'cardiovascular care'
  ],
  authors: [{ name: 'Hearline Team' }],
  creator: 'Hearline',
  publisher: 'Hearline',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    title: 'Hearline - AI-Powered Cardiology Management System',
    description: 'Revolutionizing cardiovascular care with AI-driven ECG analysis and comprehensive practice management.',
    siteName: 'Hearline',
    images: [
      {
        url: '/images/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Hearline AI-Powered Cardiology Management System'
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Hearline - AI-Powered Cardiology Management System',
    description: 'Revolutionizing cardiovascular care with AI-driven ECG analysis and comprehensive practice management.',
    images: ['/images/og-image.jpg']
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1
    }
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="manifest" href="/site.webmanifest" />
        <meta name="theme-color" content="#667eea" />
        <meta name="msapplication-TileColor" content="#667eea" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0" />
      </head>
      <body className={`${inter.className} antialiased`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
