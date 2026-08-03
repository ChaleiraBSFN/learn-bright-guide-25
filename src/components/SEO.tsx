import { Helmet } from "react-helmet-async";

interface SEOProps {
  title: string;
  description: string;
  path: string;
  /** Optional JSON-LD structured data object */
  jsonLd?: Record<string, unknown>;
  /** Comma separated keywords */
  keywords?: string;
  /** og:type, defaults to website */
  type?: string;
  /** Prevent indexing (private/admin pages) */
  noindex?: boolean;
}

const SITE = "https://studdybuddy.com.br";

export function SEO({ title, description, path, jsonLd, keywords, type = "website", noindex }: SEOProps) {
  const url = `${SITE}${path}`;
  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      {keywords && <meta name="keywords" content={keywords} />}
      {noindex && <meta name="robots" content="noindex, nofollow" />}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      {jsonLd && <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>}
    </Helmet>
  );
}
