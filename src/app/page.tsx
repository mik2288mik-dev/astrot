'use client';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();
  
  return (
    <main className="page">
      <section className="card">
        <h2 style={{fontSize:22, fontWeight:800}}>Добро пожаловать в Astrot v6</h2>
        <p style={{color:'var(--hint)', marginBottom:16}}>Ваша личная астрология на Swiss Ephemeris с OpenAI интерпретациями</p>
        <button className="btn" onClick={() => router.push('/chart')}>
          Рассчитать натальную карту
        </button>
      </section>
      
      <section className="card">
        <h3 style={{fontSize:18, fontWeight:700}}>Возможности</h3>
        <ul style={{lineHeight:1.6, color:'var(--hint)'}}>
          <li>• Точные расчёты на Swiss Ephemeris</li>
          <li>• Планеты, дома, аспекты</li>
          <li>• AI-интерпретации через OpenAI</li>
          <li>• Адаптивный fullscreen UI</li>
          <li>• Поддержка Telegram Mini Apps</li>
        </ul>
      </section>
    </main>
  );
}