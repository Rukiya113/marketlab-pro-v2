import './globals.css';import Topbar from '@/components/Topbar';import AppProviders from '@/components/AppProviders';
export const metadata={title:'MarketLab Pro',description:'India-first intraday trading workstation'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en" suppressHydrationWarning><body><AppProviders><Topbar/>{children}</AppProviders></body></html>}
