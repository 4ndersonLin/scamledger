import { useState, useCallback } from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function Header(): React.ReactElement {
  const { t, i18n } = useTranslation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleLanguage = useCallback((): void => {
    const nextLang = i18n.language === 'zh-TW' ? 'en' : 'zh-TW';
    void i18n.changeLanguage(nextLang);
  }, [i18n]);

  const closeMobileMenu = useCallback((): void => {
    setMobileMenuOpen(false);
  }, []);

  const toggleMobileMenu = useCallback((): void => {
    setMobileMenuOpen((prev) => !prev);
  }, []);

  const navLinkClass = ({ isActive }: { isActive: boolean }): string =>
    `font-heading uppercase tracking-wider text-sm transition-colors ${
      isActive ? 'text-blue-accent' : 'text-slate-300 hover:text-white'
    }`;

  const navItems = [
    { to: '/', label: t('nav.home') },
    { to: '/search', label: t('nav.search') },
    { to: '/report', label: t('nav.report') },
    { to: '/dashboard', label: t('nav.dashboard') },
    { to: '/developers', label: t('nav.developers') },
    { to: '/docs/api', label: t('nav.apiDocs') },
  ];

  return (
    <header role="banner">
      {/* Classification bar */}
      <div
        className="bg-threat-red/90 text-white font-heading text-xs text-center py-0.5 uppercase tracking-widest"
        aria-label={t('footer.classification')}
      >
        {t('footer.classification')}
      </div>

      {/* Main nav */}
      <nav className="bg-navy-900 border-b border-navy-700" aria-label="Main navigation">
        <div className="container mx-auto px-4 flex items-center justify-between h-14">
          {/* Logo */}
          <NavLink to="/" className="flex items-center gap-2" aria-label="ScamLedger Home">
            <svg
              width="28"
              height="28"
              viewBox="0 0 28 28"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="shrink-0"
              aria-hidden="true"
            >
              <path
                d="M14 2L4 7v7c0 6.075 4.25 11.425 10 12.75C19.75 25.425 24 20.075 24 14V7L14 2Z"
                stroke="#3b82f6"
                strokeWidth="1.5"
                fill="none"
              />
              <path
                d="M14 5L7 8.5v5.5c0 4.5 3 8.5 7 9.5 4-1 7-5 7-9.5V8.5L14 5Z"
                stroke="#3b82f6"
                strokeWidth="1"
                fill="rgba(59,130,246,0.08)"
              />
              <circle cx="14" cy="14" r="2" fill="#3b82f6" />
            </svg>
            <span className="font-heading uppercase tracking-[2.5px] text-lg font-bold text-white">
              SCAMLEDGER
            </span>
          </NavLink>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-6" role="menubar">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={navLinkClass}
                end={item.to === '/'}
                role="menuitem"
              >
                {item.label}
              </NavLink>
            ))}
            <button
              onClick={toggleLanguage}
              className="text-sm font-mono text-slate-400 hover:text-white border border-navy-600 px-2 py-1 rounded transition-colors"
              aria-label={i18n.language === 'zh-TW' ? 'Switch to English' : 'Switch to Chinese'}
            >
              {i18n.language === 'zh-TW' ? 'EN' : '中文'}
            </button>
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden text-slate-300 hover:text-white p-1 rounded transition-colors"
            onClick={toggleMobileMenu}
            aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-nav-menu"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              {mobileMenuOpen ? (
                <path d="M6 6l12 12M6 18L18 6" />
              ) : (
                <path d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div
            id="mobile-nav-menu"
            className="md:hidden border-t border-navy-700 bg-navy-900 px-4 py-4 space-y-1"
            role="menu"
          >
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }: { isActive: boolean }): string =>
                  `block py-2 px-3 rounded font-heading uppercase tracking-wider text-sm transition-colors ${
                    isActive
                      ? 'text-blue-accent bg-navy-800'
                      : 'text-slate-300 hover:text-white hover:bg-navy-800'
                  }`
                }
                end={item.to === '/'}
                onClick={closeMobileMenu}
                role="menuitem"
              >
                {item.label}
              </NavLink>
            ))}
            <div className="pt-2 border-t border-navy-700 mt-2">
              <button
                onClick={toggleLanguage}
                className="text-sm font-mono text-slate-400 hover:text-white border border-navy-600 px-3 py-2 rounded transition-colors w-full text-left"
                aria-label={i18n.language === 'zh-TW' ? 'Switch to English' : 'Switch to Chinese'}
              >
                {i18n.language === 'zh-TW' ? 'EN — English' : '中文 — Chinese'}
              </button>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
