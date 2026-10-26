import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title: 'Hustle.mn — Ур чадвар, боломжийг холбох газар', description: 'Монголын мэргэжилтнүүдийг захиалагчидтай холбох үйлчилгээний платформ.' };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="mn" suppressHydrationWarning><body>{children}</body></html>; }
