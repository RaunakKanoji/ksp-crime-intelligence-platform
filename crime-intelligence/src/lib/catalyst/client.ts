"use client";

const CATALYST_WEB_SDK_SRC =
  "https://static.zohocdn.com/catalyst/sdk/js/4.4.0/catalystWebSDK.js";
const CATALYST_INIT_SRC = "/__catalyst/sdk/init.js";
const LOCAL_AUTH_CSS_URL = "/css/catalyst-auth.css";

type CatalystAuth = {
  signIn: (elementId: string, options?: Record<string, unknown>) => void;
  signOut: (redirectUrl: string) => void;
  signUp: (user: Record<string, unknown>) => Promise<CatalystResponse>;
  isUserAuthenticated: () => Promise<CatalystResponse>;
};

type CatalystResponse = {
  status?: number;
  content?: any;
  data?: any;
  message?: string;
};

declare global {
  interface Window {
    catalyst?: {
      auth?: CatalystAuth;
    };
  }
}

let catalystReadyPromise: Promise<CatalystAuth> | null = null;

export function loadScript(src: string) {
  return new Promise<void>((resolve, reject) => {
    const existing = document.querySelector(
      `script[src="${src}"]`,
    ) as HTMLScriptElement | null;

    if (existing) {
      if (existing.getAttribute("data-loaded") === "true") {
        resolve();
        return;
      }

      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener(
        "error",
        () => reject(new Error(`Failed to load existing ${src}`)),
        { once: true },
      );
      return;
    }

    const script = document.createElement("script");
    script.src = src;
    script.async = false;
    script.onload = () => {
      script.setAttribute("data-loaded", "true");
      resolve();
    };
    script.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.body.appendChild(script);
  });
}

export async function getCatalystAuth() {
  if (!catalystReadyPromise) {
    catalystReadyPromise = loadScript(CATALYST_WEB_SDK_SRC)
      .then(() => loadScript(CATALYST_INIT_SRC))
      .then(() => {
        if (!window.catalyst?.auth) {
          throw new Error("Catalyst auth is unavailable on this host.");
        }

        return window.catalyst.auth;
      });
  }

  return catalystReadyPromise;
}

export function getSafeRedirectPath(fallback = "/") {
  const params = new URLSearchParams(window.location.search);
  const serviceUrl = params.get("service_url");

  if (serviceUrl && serviceUrl.startsWith("/") && !serviceUrl.startsWith("//")) {
    return serviceUrl;
  }

  return fallback;
}

export async function getCurrentCatalystUser() {
  const auth = await getCatalystAuth();
  const response = await auth.isUserAuthenticated();
  return response.content ?? response.data ?? null;
}

export async function mountCatalystSignIn(elementId: string) {
  const auth = await getCatalystAuth();
  auth.signIn(elementId, {
    css_url: `${window.location.origin}${LOCAL_AUTH_CSS_URL}`,
    service_url: getSafeRedirectPath("/"),
  });
  injectLocalSignInStyles(elementId);
}

function injectLocalSignInStyles(elementId: string) {
  const timeoutAt = Date.now() + 5000;

  function tryInject() {
    const frame = document
      .getElementById(elementId)
      ?.querySelector<HTMLIFrameElement>("#iam_iframe");

    if (!frame) {
      if (Date.now() < timeoutAt) {
        window.setTimeout(tryInject, 100);
      }
      return;
    }

    function appendStylesheet() {
      frame?.setAttribute("scrolling", "no");

      try {
        const doc = frame?.contentDocument;

        if (!doc?.head || doc.getElementById("ksp-catalyst-auth-css")) {
          return;
        }

        const stylesheet = doc.createElement("link");
        stylesheet.id = "ksp-catalyst-auth-css";
        stylesheet.rel = "stylesheet";
        stylesheet.href = LOCAL_AUTH_CSS_URL;
        doc.head.appendChild(stylesheet);
      } catch {
        // Cross-origin Catalyst frames must rely on Catalyst's default CSS.
      }
    }

    appendStylesheet();
    frame.addEventListener("load", appendStylesheet, { once: true });
  }

  tryInject();
}

export async function signUpCatalystUser(values: {
  firstName?: string;
  lastName: string;
  email: string;
}) {
  const auth = await getCatalystAuth();

  return auth.signUp({
    first_name: values.firstName,
    last_name: values.lastName,
    email_id: values.email,
    redirect_url: `${window.location.origin}/login`,
    platform_type: "web",
  });
}

export async function signOutCatalystUser() {
  window.location.replace("/api/logout");
}
