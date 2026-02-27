import { useEffect, useRef, useCallback } from 'react';

interface TurnstileProps {
  onVerify: (token: string) => void;
}

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement,
        options: {
          sitekey: string;
          callback: (token: string) => void;
          theme?: 'dark' | 'light' | 'auto';
          appearance?: 'always' | 'execute' | 'interaction-only';
        },
      ) => string;
      remove: (widgetId: string) => void;
    };
    onTurnstileLoad?: () => void;
  }
}

const SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY ?? '';

export default function Turnstile({ onVerify }: TurnstileProps): React.ReactElement {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);

  const renderWidget = useCallback(() => {
    if (!window.turnstile || !containerRef.current || widgetIdRef.current) return;

    widgetIdRef.current = window.turnstile.render(containerRef.current, {
      sitekey: SITE_KEY,
      callback: onVerify,
      theme: 'light',
      appearance: 'always',
    });
  }, [onVerify]);

  useEffect(() => {
    if (!SITE_KEY) {
      console.warn('VITE_TURNSTILE_SITE_KEY is not set');
      return;
    }

    // If turnstile script is already loaded, render immediately
    if (window.turnstile) {
      renderWidget();
      return;
    }

    // Load the turnstile script
    const existingScript = document.querySelector(
      'script[src*="challenges.cloudflare.com/turnstile"]',
    );

    if (!existingScript) {
      window.onTurnstileLoad = renderWidget;
      const script = document.createElement('script');
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onTurnstileLoad';
      script.async = true;
      document.head.appendChild(script);
    } else {
      // Script exists but not yet loaded — wait for it
      window.onTurnstileLoad = renderWidget;
    }

    return () => {
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
  }, [renderWidget]);

  if (!SITE_KEY) {
    return (
      <div className="p-4 border border-border rounded bg-surface-sunken text-text-muted text-sm">
        Turnstile not configured
      </div>
    );
  }

  return <div ref={containerRef} />;
}
