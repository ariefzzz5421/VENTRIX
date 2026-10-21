import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {title:"VENTRIX — Crypto Venture Intelligence",description:"Decode the capital behind crypto. Track funds, investments and venture networks."};
export default function RootLayout({children}:{children:React.ReactNode}) {return <html lang="en"><body>{children}</body></html>}