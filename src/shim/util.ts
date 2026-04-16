export function dual<T>(
    thunk: () => Promise<T>,
    cb?: ((result: T) => void) | null,
): Promise<T> {
    const p = thunk();
    if (cb) {
        p.then(cb).catch(err => {
            console.error("[civil-ext-shim] dual() thunk threw:", err);
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

export function normaliseExtPath(extId: string, path: string): string {
    const p = path.replace(/^\//, "");
    return `/civil-ext/${extId}/${p}`;
}

export function clone<T>(v: T): T {
    return JSON.parse(JSON.stringify(v)) as T;
}

export function isExtensionFrame(): boolean {
    try {
        return window.top !== window;
    } catch {
        return true;
    }
}

export function toLastError(e: unknown): { message: string } {
    if (e instanceof Error) return { message: e.message };
    return { message: String(e) };
}
