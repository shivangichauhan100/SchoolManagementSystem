import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers'
import { Toaster } from '@/components/ui/toaster'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Shivangi Chauhan Institute of Management Studies',
  description: 'Official portal for the Shivangi Chauhan Institute of Management Studies',
  keywords: ['school', 'management', 'education', 'students', 'teachers', 'administration'],
  authors: [{ name: 'Shivangi Chauhan Institute of Management Studies' }],
  creator: 'Shivangi Chauhan Institute of Management Studies',
  publisher: 'Shivangi Chauhan Institute of Management Studies',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('http://localhost:3000'),
  openGraph: {
    title: 'Shivangi Chauhan Institute of Management Studies',
    description: 'Official portal for the Shivangi Chauhan Institute of Management Studies',
    url: 'http://localhost:3000',
    siteName: 'Shivangi Chauhan Institute of Management Studies',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Shivangi Chauhan Institute of Management Studies',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Shivangi Chauhan Institute of Management Studies',
    description: 'Official portal for the Shivangi Chauhan Institute of Management Studies',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-verification-code',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  )
}
