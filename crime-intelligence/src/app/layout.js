import "./globals.css";

export const metadata = {
  title: "Crime Intelligence Portal",
  description: "Catalyst authentication for the Crime Intelligence Portal",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
