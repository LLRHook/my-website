import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "My Website",
  description: "A simple demo site",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: "system-ui, -apple-system, sans-serif" }}>
        {children}
      </body>
    </html>
  )
}
