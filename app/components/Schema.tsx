type SchemaProps = {
  villa?: {
    name?: string;
    description?: string;
    image?: string;
    price?: number;
    rating?: number;
    reviewCount?: number;
  };
  settings?: {
    site_title?: string;
    site_description?: string;
    logo_url?: string;
  };
};

export default function Schema({ villa, settings }: SchemaProps) {
  // ✅ BASE URL (client-safe)
  const baseUrl =
    typeof window !== "undefined"
      ? window.location.origin
      : process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  // ✅ DATA
  const name =
    villa?.name ||
    settings?.site_title ||
    "Kalkan Üzümlü Balayı Villası";

  const description =
    villa?.description ||
    settings?.site_description ||
    "Kaş Kalkan Üzümlü’de doğa içinde konumlanan 1+1 balayı villası.";

  const image =
    villa?.image ||
    settings?.logo_url ||
    `${baseUrl}/og.jpg`;

  // ✅ RATING FIX
  const hasRating =
    typeof villa?.rating === "number" &&
    typeof villa?.reviewCount === "number" &&
    villa.reviewCount > 0;

  // ✅ SCHEMA (GRAPH STRUCTURE)
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "LodgingBusiness",
        name,
        image,
        description,
        url: baseUrl,

        address: {
          "@type": "PostalAddress",
          addressLocality: "Kalkan",
          addressCountry: "TR",
        },

        priceRange: "₺₺₺",

        ...(hasRating && {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: villa?.rating,
            reviewCount: villa?.reviewCount,
          },
        }),

        offers: {
          "@type": "Offer",
          priceCurrency: "TRY",
          price: villa?.price || 5000,
          availability: "https://schema.org/InStock",
          url: baseUrl,
        },
      },

      {
        "@type": "Organization",
        name,
        url: baseUrl,
        logo: settings?.logo_url || image,
      },

      {
        "@type": "WebSite",
        name,
        url: baseUrl,
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(schema),
      }}
    />
  );
}