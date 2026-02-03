import './globals.css';
import Header from '@/components/Header';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <Header />
        <main className="min-h-screen flex flex-col items-center bg-black text-gray-100 font-sans selection:bg-blue-500/30">
          {children}
        </main>
      </body>
    </html>
  )
}
