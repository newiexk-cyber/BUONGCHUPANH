import './globals.css';

export const metadata = {
  title: 'Zump.pi Studio — Photobooth Kiosk 35mm Analog',
  description: 'Enterprise 35mm Analog Photobooth Studio & Kiosk Production Engine by Zump.pi',
  manifest: '/manifest.json',
  themeColor: '#0a0a0a',
};

export default function RootLayout({ children }) {
  return (
    <html lang="vi">
      <body>
        {children}
      </body>
    </html>
  );
}
