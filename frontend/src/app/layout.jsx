import "./globals.css";

export const metadata = {
  title: "IndustriAlert | Gestão de Ocorrências",
  description:
    "Gestão rápida, priorizada e eficiente de ocorrências industriais.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
