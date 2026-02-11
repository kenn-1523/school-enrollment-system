import { Inter } from 'next/font/google';
import { Providers } from './providers'; 

// ✅ CORRECT IMPORT ORDER:
// 1. Load Legacy Styles FIRST (So they don't fight new styles)
import '../features/marketing/styles.css';

// 2. Load Tailwind LAST (So utility classes like 'flex' can override legacy bugs)
import '../index.css'; 

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  metadataBase: new URL('https://elitecroupier.com'), 
  title: {
    default: 'Elite Croupier Training Services | Casino Dealer School Philippines',
    template: '%s | Elite Croupier Training' 
  },
  description: 'The premier casino dealer training school in Makati, Philippines. Learn Blackjack, Poker, and Roulette from expert instructors and get job placement assistance.',
  keywords: ['casino dealer training', 'croupier school philippines', 'casino job hiring', 'learn poker', 'blackjack course manila', 'cruise ship casino jobs'],
  authors: [{ name: 'Edgar Croupier Training Services' }],
  openGraph: {
    title: 'Elite Croupier Training Services',
    description: 'Start your career in the casino industry. Professional training for cruise ships and land-based casinos.',
    url: 'https://elitecroupier.com',
    siteName: 'Elite Croupier Training',
    images: [
      {
        url: '/images/og-social-card.jpg', 
        width: 1200,
        height: 630,
        alt: 'Elite Croupier Training Classroom',
      },
    ],
    locale: 'en_PH',
    type: 'website',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      {/* We keep the body class minimal so your legacy 'styles.css' 
         can handle the background colors naturally.
      */}
      <body className={`${inter.className} antialiased`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}