import './globals.css'

export const metadata = {
  title: 'EXE Wallet Airdrop',
  description: 'Claim your EXE tokens',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-black text-white min-h-screen flex items-center justify-center">
        {children}
      </body>
    </html>
  )
}
