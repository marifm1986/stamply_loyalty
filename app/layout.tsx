import type { Metadata } from 'next';
import './globals.css';
export const metadata:Metadata={title:'Stamply | Little stamps. Lasting loyalty.',description:'Your loyalty program, beautifully simple. Scan cards, reward regulars, and keep customers coming back.'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}
