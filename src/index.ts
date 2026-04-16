export type {
    Alarm,
    AlarmCreateInfo,
    BiBConfig,
    ChromeEvent,
    ChromeManifest,
    ContentScript,
    DNRRule,
    FirefoxManifest,
    MessageSender,
    Port,
    ShimOptions,
    StorageData,
    SyntheticTab,
    SyntheticWindow,
    TabInfo,
} from "./types";

import SHIM_SOURCE from "virtual:civil-ext-shim-source";

const DEV_SHIM_PATH = "/civil-ext-shim.js";

export function buildChromeShim(opts: import("./types").ShimOptions): string {
    const { extId, manifest, storageData = {} } = opts;

    const optsJson = JSON.stringify(
        {
            extId,
            manifest,
            storageData,
            bib: opts.bib,
        } satisfies import("./types").ShimOptions,
        (_key, value) => {
            if (typeof value === "function") return undefined;
            return value as unknown;
        },
    );

    if (SHIM_SOURCE) {
        return SHIM_SOURCE.replace("__CIVIL_SHIM_OPTIONS__", optsJson);
    }

    return `
(function() {
  if (window.__civil_chrome_injected) return;
  var s = document.createElement('script');
  s.src = ${JSON.stringify(DEV_SHIM_PATH)};
  s.onload = function() {
    if (typeof window.__civilInstallShim === 'function') {
      window.__civilInstallShim(${optsJson});
    }
  };
  document.head.prepend(s);
})();
`.trim();
}

export function resolveExtIcon(
    extId: string,
    manifest: import("./types").ChromeManifest,
    preferredSize = 48,
): string | null {
    const icons =
        manifest.icons ??
        (
            manifest.browser_action as
                | { default_icon?: Record<string, string> }
                | undefined
        )?.default_icon ??
        (
            manifest.action as
                | { default_icon?: Record<string, string> }
                | undefined
        )?.default_icon;

    if (!icons) return null;
    if (typeof icons === "string") return `/civil-ext/${extId}/${icons}`;

    const sizes = Object.keys(icons)
        .map(Number)
        .filter(n => !Number.isNaN(n))
        .sort((a, b) => a - b);
    if (sizes.length === 0) return null;

    const best =
        sizes.find(s => s >= preferredSize) ?? sizes[sizes.length - 1]!;
    const path = (icons as Record<string, string>)[String(best)];
    return path ? `/civil-ext/${extId}/${path}` : null;
}

export function resolveExtPopupUrl(
    extId: string,
    manifest: import("./types").ChromeManifest,
): string | null {
    const popup =
        (manifest.action as { default_popup?: string } | undefined)
            ?.default_popup ??
        (manifest.browser_action as { default_popup?: string } | undefined)
            ?.default_popup ??
        null;
    return popup ? `/civil-ext/${extId}/${popup}` : null;
}
