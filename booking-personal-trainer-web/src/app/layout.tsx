import { Outfit } from "next/font/google";
import "./globals.css";
import "flatpickr/dist/flatpickr.css";
import { ProfileProvider } from "@/context/ProfileContext";
import { SidebarProvider } from "@/context/SidebarContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { ToastProvider } from "@/context/ToastContext";
import Auth0UserProvider from "@/components/providers/Auth0UserProvider";
import Auth0BackendSync from "@/components/providers/Auth0BackendSync";
import { auth0 } from "@/lib/auth0";

const outfit = Outfit({
  subsets: ["latin"],
});

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth0.getSession();
  return (
    <html lang="en">
      <body className={`${outfit.className} dark:bg-gray-900`}>
        <ThemeProvider>
          <Auth0UserProvider user={session?.user}>
            <ProfileProvider>
              <ToastProvider>
                <Auth0BackendSync />
                <SidebarProvider>{children}</SidebarProvider>
              </ToastProvider>
            </ProfileProvider>
          </Auth0UserProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
