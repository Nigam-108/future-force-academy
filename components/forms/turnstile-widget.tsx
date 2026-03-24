"use client";

import { useEffect, useId, useRef, useState } from "react";

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: string | HTMLElement,
        options: {
          sitekey: string;
          callback?: (token: string) => void;
          "expired-callback"?: () => void;
          "error-callback"?: (error: string) => void;
          theme?: "light" | "dark" | "auto";
        }
      ) => string;
      remove?: (widgetId: string) => void;
      reset?: (widgetId?: string) => void;
    };
  }
}

type TurnstileWidgetProps = {
  siteKey: string;
  visible: boolean;
  resetKey?: number;
  onTokenChange: (token: string) => void;
  onError?: (message: string) => void;
};

export function TurnstileWidget({
  siteKey,
  visible,
  resetKey = 0,
  onTokenChange,
  onError,
}: TurnstileWidgetProps) {
  const elementId = useId().replace(/:/g, "");
  const widgetIdRef = useRef<string | null>(null);
  const [scriptReady, setScriptReady] = useState(false);

  useEffect(() => {
    if (window.turnstile) {
      setScriptReady(true);
      return;
    }

    const existingScript = document.querySelector<HTMLScriptElement>(
      'script[src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"]'
    );

    if (existingScript) {
      existingScript.addEventListener("load", () => setScriptReady(true));
      return;
    }

    const script = document.createElement("script");
    script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    script.async = true;
    script.defer = true;
    script.onload = () => setScriptReady(true);
    document.body.appendChild(script);
  }, []);

  useEffect(() => {
    if (!visible || !scriptReady || !window.turnstile) {
      return;
    }

    const container = document.getElementById(elementId);
    if (!container) {
      return;
    }

    container.innerHTML = "";
    widgetIdRef.current = window.turnstile.render(container, {
      sitekey: siteKey,
      theme: "auto",
      callback: (token) => {
        onTokenChange(token);
      },
      "expired-callback": () => {
        onTokenChange("");
      },
      "error-callback": (errorCode) => {
        onTokenChange("");
        onError?.(`Turnstile error: ${errorCode}`);
      },
    });

    return () => {
      if (widgetIdRef.current && window.turnstile?.remove) {
        window.turnstile.remove(widgetIdRef.current);
      }
      widgetIdRef.current = null;
    };
  }, [visible, scriptReady, siteKey, elementId, onTokenChange, onError, resetKey]);

  if (!visible) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <p className="mb-3 text-sm font-medium text-slate-900">Security verification required</p>
      <p className="mb-4 text-sm text-slate-600">
        Please complete the Turnstile check before continuing.
      </p>
      <div id={elementId} />
    </div>
  );
}