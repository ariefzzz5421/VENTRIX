import type { Metadata } from "next";
import "@xyflow/react/dist/style.css";
import "./globals.css";
import "./overview-flow.css";
export const metadata: Metadata = {title:"VENTRIX — Crypto Venture Intelligence",description:"Decode the capital behind crypto. Track funds, investments and venture networks.",icons:{icon:"/icon.svg"}};
export default function RootLayout({children}:{children:React.ReactNode}) {return <html lang="en"><body>{children}</body></html>}
