import type { Metadata } from 'next';
import { Inter, Plus_Jakarta_Sans } from 'next/font/google';
import { NavBar } from '@/components/NavBar';
import { profile } from '@/lib/profile/data';
import './globals.css';

/**
 * Typography: Inter (body) + Plus Jakarta Sans (display) loaded via next/font/google
 * for optimal web font delivery (no FOIT, subsetted, self-hosted by Next.js).
 * The CSS variables below are the integration point for Tailwind's fontFamily config.
 */
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
});

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
  weight: ['400', '500', '600', '700', '800'],
});

// ── Deployment URL — override via NEXT_PUBLIC_SITE_URL in production ──────────
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://trinadh.dev';

// ── Structured data (JSON-LD) ─────────────────────────────────────────────────
const personSchema = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  name: 'Trinadh Kumar Reddi',
  jobTitle: 'Aspiring AI/ML Engineer',
  description: profile.summary,
  url: siteUrl,
  sameAs: [
    'https://www.linkedin.com/in/trinadh-kumar-reddi-a45b79265/',
    'https://github.com/redditrinadhkumar',
  ],
  alumniOf: [
    {
      '@type': 'CollegeOrUniversity',
      name: 'Bonam Venkata Chalamayya Engineering College',
    },
  ],
  knowsAbout: [
    'Artificial Intelligence',
    'Machine Learning',
    'Retrieval-Augmented Generation',
    'LangGraph',
    'LangChain',
    'Python',
    'FastAPI',
    'Computer Vision',
    'Natural Language Processing',
    'Generative AI',
    'Large Language Models',
    'Prompt Engineering',
  ],
  email: profile.contact.email,
};

const projectsSchema = {
  '@context': 'https://schema.org',
  '@type': 'ItemList',
  name: 'Projects by Trinadh Kumar Reddi',
  itemListElement: profile.projects.map((project, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    item: {
      '@type': 'SoftwareSourceCode',
      name: project.name,
      description: project.highlights[0] ?? '',
      programmingLanguage: project.stack.join(', '),
      ...(project.githubUrl ? { codeRepository: project.githubUrl } : {}),
      author: {
        '@type': 'Person',
        name: 'Trinadh Kumar Reddi',
      },
    },
  })),
};

// ── Page metadata ─────────────────────────────────────────────────────────────
export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Trinadh Kumar Reddi — AI/ML Engineer',
    template: '%s | Trinadh Kumar Reddi',
  },
  description:
    'Portfolio of Trinadh Kumar Reddi, an aspiring AI/ML engineer specializing in RAG systems, LangGraph agents, and applied Generative AI. Includes an embedded, security-hardened portfolio AI assistant.',
  keywords: [
    'AI Engineer',
    'ML Engineer',
    'RAG',
    'LangGraph',
    'LangChain',
    'Python',
    'FastAPI',
    'Generative AI',
    'Trinadh Kumar Reddi',
    'portfolio',
  ],
  authors: [{ name: 'Trinadh Kumar Reddi', url: siteUrl }],
  creator: 'Trinadh Kumar Reddi',
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large' },
  },
  alternates: {
    canonical: siteUrl,
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: siteUrl,
    siteName: 'Trinadh Kumar Reddi — Portfolio',
    title: 'Trinadh Kumar Reddi — AI/ML Engineer',
    description:
      'Aspiring AI/ML engineer building RAG systems, LangGraph agents & production AI pipelines. Explore the portfolio with an embedded, profile-grounded AI assistant.',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Trinadh Kumar Reddi — AI/ML Engineer Portfolio',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Trinadh Kumar Reddi — AI/ML Engineer',
    description:
      'Aspiring AI/ML engineer building RAG systems, LangGraph agents & production AI pipelines.',
    images: ['/og-image.jpg'],
  },
  icons: {
    icon: '/portfolio-logo.svg',
    shortcut: '/portfolio-logo.svg',
    apple: '/portfolio-logo.svg',
  },
};

// ── FOUC-prevention theme script (inlined, blocking) ─────────────────────────
// This runs synchronously before the first paint so the user never sees a
// flash of the wrong theme. It reads localStorage first, then falls back to
// prefers-color-scheme. Only the theme key is read/written — no personal data.
const themeInitScript = `
(function() {
  try {
    var stored = localStorage.getItem('theme');
    if (stored === 'dark' || stored === 'light') {
      document.documentElement.setAttribute('data-theme', stored);
      return;
    }
  } catch(e) {}
  var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
})();
`.trim();

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${plusJakartaSans.variable}`} suppressHydrationWarning>
      <head>
        {/* FOUC-prevention: set data-theme before first paint */}
        {/* eslint-disable-next-line @next/next/no-sync-scripts */}
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />

        {/* JSON-LD structured data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(personSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(projectsSchema) }}
        />
      </head>
      <body className="font-body antialiased bg-void text-starlight">
        <NavBar />
        {children}
      </body>
    </html>
  );
}
