import type { Metadata } from 'next'
import './globals.css'
import Script from 'next/script';

export const metadata: Metadata = {
  title: 'Multi-Image Preprocessing Workbench',
  description: 'Open-source image preprocessing pipeline for computer vision',
  generator: 'Open Source',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* OpenCV.js CDN - loads only on client side */}
        <Script
          src="https://docs.opencv.org/4.x/opencv.js"
          strategy="afterInteractive"
        />
      </head>
      <body>
        {/* TODO: Add OpenCV.js loading state handling in the UI */}
        {children}
      </body>
    </html>
  );
}
