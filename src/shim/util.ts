import type { BiBConfig } from "../types";

let _bib: Required<BiBConfig> = {
    extPrefix: "/civil-ext/",
    origin: "",
    storagePersistence: "localStorage",
    storageKey: "civil-ext-storage",
    newTabEvent: "browser:newtab",
    navigateEvent: "browser:navigate",
    storagePostMessageType: "civil-ext-storage",
    storageSyncMessageType: "civil-ext-storage-sync",
    platformInfo: { os: "win", arch: "x86-64", nacl_arch: "x86-64" },
    currentTab: {},
    currentWindow: {},
    incognito: false,
    messages: {},
    features: {},
};

export function initBiB(
    cfg: BiBConfig | undefined,
    fallbackOrigin: string,
): void {
    _bib = {
        extPrefix: cfg?.extPrefix ?? "/civil-ext/",
        origin: cfg?.origin ?? fallbackOrigin,
        storagePersistence: cfg?.storagePersistence ?? "localStorage",
        storageKey: cfg?.storageKey ?? "civil-ext-storage",
        newTabEvent: cfg?.newTabEvent ?? "browser:newtab",
        navigateEvent: cfg?.navigateEvent ?? "browser:navigate",
        storagePostMessageType:
            cfg?.storagePostMessageType ?? "civil-ext-storage",
        storageSyncMessageType:
            cfg?.storageSyncMessageType ?? "civil-ext-storage-sync",
        platformInfo: {
            os: cfg?.platformInfo?.os ?? "win",
            arch: cfg?.platformInfo?.arch ?? "x86-64",
            nacl_arch: cfg?.platformInfo?.nacl_arch ?? "x86-64",
        },
        currentTab: cfg?.currentTab ?? {},
        currentWindow: cfg?.currentWindow ?? {},
        incognito: cfg?.incognito ?? false,
        messages: cfg?.messages ?? {},
        features: cfg?.features ?? {},
    };
}

export function getBiB(): Required<BiBConfig> {
    return _bib;
}

export function dual<T>(
    thunk: () => Promise<T>,
    cb?: ((result: T) => void) | null,
): Promise<T> {
    const p = thunk();
    if (cb) {
        p.then(cb).catch(err => {
            console.error("[civil-ext-shim] dual() error:", err);
        });
    }
    return p;
}

export function resolved<T>(
    value: T,
    cb?: ((result: T) => void) | null,
): Promise<T> {
    return dual(() => Promise.resolve(value), cb);
}

export function extUrl(extId: string, path: string): string {
    const prefix = _bib.extPrefix.endsWith("/")
        ? _bib.extPrefix
        : `${_bib.extPrefix}/`;
    const p = path.replace(/^\//, "");
    return `${_bib.origin}${prefix}${extId}/${p}`;
}

export function clone<T>(v: T): T {
    return JSON.parse(JSON.stringify(v)) as T;
}

export function toLastError(e: unknown): { message: string } {
    if (e instanceof Error) return { message: e.message };
    return { message: String(e) };
}

export function dispatchBrowserEvent(name: string, detail: unknown): void {
    try {
        document.dispatchEvent(new CustomEvent(name, { detail }));
    } catch {}
}

export function persistenceRead(key: string): string | null {
    try {
        switch (_bib.storagePersistence) {
            case "localStorage":
                return localStorage.getItem(key);
            case "sessionStorage":
                return sessionStorage.getItem(key);
            default:
                return null;
        }
    } catch {
        return null;
    }
}

export function persistenceWrite(key: string, value: string): void {
    try {
        switch (_bib.storagePersistence) {
            case "localStorage":
                localStorage.setItem(key, value);
                break;
            case "sessionStorage":
                sessionStorage.setItem(key, value);
                break;
            case "postMessage":
                try {
                    window.parent?.postMessage(
                        {
                            type: _bib.storagePostMessageType,
                            data: JSON.parse(value),
                        },
                        "*",
                    );
                } catch {}
                break;
        }
    } catch {}
}
