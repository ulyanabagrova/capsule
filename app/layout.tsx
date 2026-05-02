import './globals.css'

export const metadata = {
  title: 'Pupsy Team - Capsule',
  description: 'High-end 3D Experience',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      {/* Убираем лишние классы, оставляем только черный фон */}
      <body className="bg-black m-0 p-0 overflow-hidden">
        {children}
      </body>
    </html>
  )
}
