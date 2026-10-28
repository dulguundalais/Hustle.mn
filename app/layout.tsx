import type { Metadata } from 'next';
import './globals.css';
import PartnerReferralCapture from '../components/partner-referral-capture';
export const metadata: Metadata = { title: 'Hustle.mn — Ур чадвар, боломжийг холбох газар', description: 'Монголын мэргэжилтнүүдийг захиалагчидтай холбох үйлчилгээний платформ.' };
const v53PreviewTheme='try{if(location.hostname==="feature-partner-self-service.hustle-mn-preview.pages.dev"&&localStorage.getItem("hustle:v53-preview-initialized")!=="1"){localStorage.setItem("hustle-theme","dark");localStorage.setItem("hustle:v53-preview-initialized","1")}}catch{}';
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="mn" suppressHydrationWarning><body><script dangerouslySetInnerHTML={{__html:v53PreviewTheme}}/><PartnerReferralCapture/>{children}</body></html>; }
