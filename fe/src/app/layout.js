import "./globals.css";
import Providers from "./providers";
import SideDecorBand from "@/components/SideDecorBand";

export const metadata = {
  title: "GABERA Enterprise Portal",
  description: "Enterprise frontend scaffold built with Next.js and Material UI.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="cs" suppressHydrationWarning>
      <body>
        <Providers>
          <SideDecorBand />
          <div className="page-content">{children}</div>
        </Providers>
      </body>
    </html>
  );
}
