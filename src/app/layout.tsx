'use client';
import Script from 'next/script';
import { useEffect } from 'react';
import '@/app/globals.css';
import { getTelegramWebApp } from '@/lib/telegram';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const tg = getTelegramWebApp();
    if (!tg) return;
    try { tg.ready(); tg.expand(); } catch {}
    const setH = () => {
      const h = tg.viewportHeight ?? window.innerHeight;
      document.documentElement.style.setProperty('--tg-viewport-height', `${Math.max(320, Math.floor(h))}px`);
    };
    setH();
    tg.onEvent?.('viewportChanged', setH);
    return () => tg.offEvent?.('viewportChanged', setH);
  }, []);

  return (
    <html lang="ru">
      <head>
        <meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover,user-scalable=no" />
        <Script src="https://telegram.org/js/telegram-web-app.js" strategy="beforeInteractive" />
      </head>
      <body>
        <div id="app-root" className="app-shell">{children}</div>
      </body>
    </html>
  );
}