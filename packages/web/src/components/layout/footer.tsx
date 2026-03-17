import Link from 'next/link';

const columns = [
  {
    title: 'Product',
    links: [
      { href: '/tools', label: 'Tools' },
      { href: '/integrations', label: 'Integrations' },
      { href: '/guides', label: 'Guides' },
      { href: '/pricing', label: 'Pricing' },
    ],
  },
  {
    title: 'Creators',
    links: [
      { href: '/creator', label: 'Create Tools' },
      { href: '/creator/templates', label: 'Templates' },
      { href: '/creator/earnings', label: 'Earn Money' },
    ],
  },
  {
    title: 'Company',
    links: [
      { href: '/about', label: 'About' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { href: '/terms', label: 'Terms' },
      { href: '/privacy', label: 'Privacy' },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-border bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
          {columns.map((col) => (
            <div key={col.title}>
              <h3 className="text-sm font-semibold text-primary">{col.title}</h3>
              <ul className="mt-4 space-y-2">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-8 border-t border-border pt-8 text-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} Sotally. Your Software Ally.
        </div>
      </div>
    </footer>
  );
}
