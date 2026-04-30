export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { headers } from "next/headers";
import { Geist, Geist_Mono } from "next/font/google";
import { createClient } from "@supabase/supabase-js";
import "./globals.css";

// 🔥 SUPABASE (SERVER)
function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// 🔥 FONT
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// 🔥 BASE URL (FIXED)
async function getBaseUrl() {
  try {
    const h = await headers(); // ✅ DOĞRU

    const host =
      h.get("x-forwarded-host") ||
      h.get("host") ||
      process.env.NEXT_PUBLIC_SITE_URL ||
      "localhost:3000";

    const protocol =
      h.get("x-forwarded-proto") ||
      (host.includes("localhost") ? "http" : "https");

    return `${protocol}://${host}`;
  } catch {
    return process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  }
}

// 🔥 SETTINGS
async function getSettings() {
  try {
    const supabase = getSupabase();

    const { data, error } = await supabase
      .from("settings")
      .select("*");

    if (error || !data) return {};

    const obj: Record<string, string> = {};
    data.forEach((item) => {
      obj[item.key] = item.value;
    });

    return obj;
  } catch {
    return {};
  }
}

// 🔥 SEO (DYNAMIC)
export async function generateMetadata(): Promise<Metadata> {
  const baseUrl = await getBaseUrl(); // ✅ await eklendi
  const settings = await getSettings();

  const title =
    settings.site_title ||
    "Kalkan Üzümlü Balayı Villası | 1+1 Özel Havuzlu Kiralık Villa";

  const description =
    settings.site_description ||
    "Kaş Kalkan Üzümlü’de doğa içinde konumlanan 1+1 balayı villası.";

  const image =
    settings.logo_url ||
    `${baseUrl}/og.jpg`;

  return {
    metadataBase: new URL(baseUrl),

    title: {
      default: title,
      template: `%s | ${title}`,
    },

    description,

    keywords: [
      "kalkan villa",
      "kalkan kiralık villa",
      "balayı villası",
      "özel havuzlu villa",
      "kaş villa",
      "üzümlü villa",
    ],

    openGraph: {
      title,
      description,
      url: baseUrl,
      siteName: title,
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
        },
      ],
      locale: "tr_TR",
      type: "website",
    },

    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },

    robots: {
      index: true,
      follow: true,
    },

    alternates: {
      canonical: baseUrl,
    },
  };
}

// 🔥 LAYOUT
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="tr"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
      </body>
    </html>
  );
}