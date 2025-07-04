import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "../styles/globals.css"

const poppins = Poppins({
  variable: "--font-poppins",
  weight: "100"
});

export const metadata: Metadata = {
  title: "3D Tic Tac Toe Game",
  description: "Challenge your friends to a classic game of Tic Tac Toe in stunning 3D! Experience the fun in dynamic dark and light modes.",
  icons: {
    icon: "/3dIcon.png",
  },
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${poppins.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
