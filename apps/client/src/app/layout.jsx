import { Inter } from 'next/font/google';
import { Providers } from './providers'; 

// ✅ Keep your existing style import
import '../features/marketing/styles.css'; 

const inter = Inter({ subsets: ['latin'] });

// ✅ UPGRADED SEO METADATA
export const metadata = {
  metadataBase: new URL('https://elitecroupier.com'), // Replace with your real domain
  title: {
    default: 'Elite Croupier Training Services | Casino Dealer School Philippines',
    template: '%s | Elite Croupier Training' // Adds suffix to other pages automatically
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
        url: '/images/og-social-card.jpg', // You should create this image (1200x630px)
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
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}