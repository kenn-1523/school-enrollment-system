import { Inter } from 'next/font/google';
import { Providers } from './providers'; 

// FIX: Import the CSS here so it loads on hard refresh
// (This path assumes styles.css is inside src/features/marketing/)
import '../features/marketing/styles.css'; 

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Elite Croupier Training',
  description: 'Master the art of casino dealing',
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