import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title: 'Hustle.mn — Ур чадвар боломжтой уулзана', description: 'Монголын бүтээлч мэргэжилтнүүдийг үйлчлүүлэгчидтэй холбох үйлчилгээний marketplace.' };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="mn" suppressHydrationWarning><body>{children}</body></html>; }
