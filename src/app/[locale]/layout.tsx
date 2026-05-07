import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { SwRegister } from "@/components/SwRegister";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { template: "%s | 제주 오름 패스포트", default: "제주 오름 패스포트" },
};

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as "ko" | "en" | "ja" | "zh")) {
    notFound();
  }

  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <body>
        <NextIntlClientProvider messages={messages}>
          <SwRegister />
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
