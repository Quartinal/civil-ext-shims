import { resolved } from "./util";

export function buildScriptingAPI() {
    const _registeredScripts = new Map<
        string,
        chrome.scripting.RegisteredContentScript
    >();

    function executeScript(
        injection: chrome.scripting.ScriptInjection<unknown[], unknown>,
        cb?: (results: chrome.scripting.InjectionResult<unknown>[]) => void,
    ): Promise<chrome.scripting.InjectionResult<unknown>[]> {
        return (async () => {
            const inj = injection as unknown as Record<string, unknown>;
            if (typeof inj.func === "function") {
                try {
                    const args = (inj.args ?? []) as unknown[];
                    const result = await (
                        inj.func as (...a: unknown[]) => unknown
                    )(...args);
                    return [
                        {
                            frameId: 0,
                            result,
                            documentId: "",
                        } as chrome.scripting.InjectionResult<unknown>,
                    ];
                } catch (e) {
                    console.warn(
                        "[civil-ext-shim] scripting.executeScript func threw:",
                        e,
                    );
                    return [];
                }
            }
            const files = inj.files as string[] | undefined;
            if (files) {
                for (const file of files) {
                    try {
                        const script = document.createElement("script");
                        script.src = file;
                        document.head?.appendChild(script);
                    } catch {}
                }
            }
            return [];
        })().then(r => {
            if (cb) cb(r);
            return r;
        });
    }

    function insertCSS(
        injection: chrome.scripting.CSSInjection,
        cb?: () => void,
    ): Promise<void> {
        const inj = injection as unknown as Record<string, unknown>;
        if (inj.css) {
            const el = document.createElement("style");
            el.textContent = inj.css as string;
            document.head?.appendChild(el);
        }
        return resolved(undefined, cb);
    }

    function removeCSS(
        _injection: chrome.scripting.CSSInjection,
        cb?: () => void,
    ) {
        return resolved(undefined, cb);
    }

    function registerContentScripts(
        scripts: chrome.scripting.RegisteredContentScript[],
        cb?: () => void,
    ) {
        for (const s of scripts) {
            if (s.id) _registeredScripts.set(s.id, s);
        }
        return resolved(undefined, cb);
    }

    function unregisterContentScripts(
        filter?: { ids?: string[] },
        cb?: () => void,
    ) {
        if (!filter?.ids) {
            _registeredScripts.clear();
        } else {
            for (const id of filter.ids) _registeredScripts.delete(id);
        }
        return resolved(undefined, cb);
    }

    function getRegisteredContentScripts(
        filter?:
            | { ids?: string[] }
            | ((s: chrome.scripting.RegisteredContentScript[]) => void),
        cb?: (scripts: chrome.scripting.RegisteredContentScript[]) => void,
    ) {
        if (typeof filter === "function") {
            cb = filter;
            filter = undefined;
        }
        const all = [..._registeredScripts.values()];
        const result = (filter as { ids?: string[] } | undefined)?.ids
            ? all.filter(s =>
                  ((filter as { ids?: string[] }).ids ?? []).includes(
                      s.id ?? "",
                  ),
              )
            : all;
        return resolved(result, cb);
    }

    function updateContentScripts(
        scripts: chrome.scripting.RegisteredContentScript[],
        cb?: () => void,
    ) {
        for (const s of scripts) {
            if (s.id && _registeredScripts.has(s.id)) {
                _registeredScripts.set(s.id, {
                    ..._registeredScripts.get(s.id)!,
                    ...s,
                });
            }
        }
        return resolved(undefined, cb);
    }

    return {
        executeScript,
        insertCSS,
        removeCSS,
        registerContentScripts,
        unregisterContentScripts,
        getRegisteredContentScripts,
        updateContentScripts,
    };
}
