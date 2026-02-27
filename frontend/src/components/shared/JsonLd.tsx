interface JsonLdProps {
  data: Record<string, unknown>;
}

export default function JsonLd({ data }: JsonLdProps): React.ReactElement {
  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />
  );
}

export function WebsiteJsonLd(): React.ReactElement {
  return (
    <JsonLd
      data={{
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: 'ScamLedger',
        url: 'https://scamledger.com',
        description: 'Free, anonymous cryptocurrency scam & hack incident reporting platform',
        potentialAction: {
          '@type': 'SearchAction',
          target: {
            '@type': 'EntryPoint',
            urlTemplate: 'https://scamledger.com/search?q={search_term_string}',
          },
          'query-input': 'required name=search_term_string',
        },
      }}
    />
  );
}

export function OrganizationJsonLd(): React.ReactElement {
  return (
    <JsonLd
      data={{
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: 'ScamLedger',
        url: 'https://scamledger.com',
        logo: 'https://scamledger.com/favicon.svg',
        description: 'Community-powered cryptocurrency scam and hack incident reporting platform',
      }}
    />
  );
}

export function DatasetJsonLd(): React.ReactElement {
  return (
    <JsonLd
      data={{
        '@context': 'https://schema.org',
        '@type': 'Dataset',
        name: 'ScamLedger Threat Intelligence',
        description: 'Aggregated cryptocurrency scam and hack incident reports with risk scoring',
        url: 'https://scamledger.com/dashboard',
        license: 'https://creativecommons.org/publicdomain/zero/1.0/',
        creator: {
          '@type': 'Organization',
          name: 'ScamLedger',
        },
      }}
    />
  );
}
