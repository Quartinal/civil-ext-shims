import type { ChromeManifest, MessageSender, Port } from "../types";
import { CivilEvent } from "./event";
import { dual, extUrl, getBiB, resolved, toLastError } from "./util";

class CivilPort implements Port {
    name: string;
    sender?: MessageSender;
    error?: { message: string };
    readonly onMessage = new CivilEvent<
        (message: unknown, port: Port) => void
    >();
    readonly onDisconnect = new CivilEvent<(port: Port) => void>();
    private _connected = true;
    private _remote: CivilPort | null = null;

    constructor(name: string, sender?: MessageSender) {
        this.name = name;
        this.sender = sender;
    }

    _link(remote: CivilPort): void {
        this._remote = remote;
    }

    postMessage(message: unknown): void {
        if (!this._connected) {
            console.warn("[civil-ext-shim] postMessage on disconnected port");
            return;
        }
        this._remote?.onMessage.dispatch(message, this._remote);
    }

    disconnect(): void {
        if (!this._connected) return;
        this._connected = false;
        this.onDisconnect.dispatch(this);
        this._remote?.onDisconnect.dispatch(this._remote);
        this._remote = null;
    }
}

export function buildRuntimeAPI(extId: string, manifest: ChromeManifest) {
    let _lastError: { message: string } | null = null;

    const onMessage = new CivilEvent<
        (
            msg: unknown,
            sender: MessageSender,
            sendResponse: (r?: unknown) => void,
        ) => undefined | boolean
    >();
    const onMessageExternal = new CivilEvent<
        (
            msg: unknown,
            sender: MessageSender,
            sendResponse: (r?: unknown) => void,
        ) => undefined | boolean
    >();
    const onConnect = new CivilEvent<(port: Port) => void>();
    const onConnectExternal = new CivilEvent<(port: Port) => void>();
    const onInstalled = new CivilEvent<
        (details: chrome.runtime.InstalledDetails) => void
    >();
    const onStartup = new CivilEvent<() => void>();
    const onSuspend = new CivilEvent<() => void>();
    const onSuspendCanceled = new CivilEvent<() => void>();
    const onUpdateAvailable = new CivilEvent<
        (details: { version: string }) => void
    >();
    const onBrowserUpdateAvailable = new CivilEvent<() => void>();
    const onRestartRequired = new CivilEvent<(reason: string) => void>();
    const onUserScriptConnect = new CivilEvent<(port: Port) => void>();
    const onUserScriptMessage = new CivilEvent<
        (msg: unknown, sender: MessageSender) => void
    >();

    setTimeout(() => {
        onInstalled.dispatch({
            reason: "install",
            previousVersion: undefined,
        } as chrome.runtime.InstalledDetails);
    }, 0);

    function getURL(path: string): string {
        return extUrl(extId, path);
    }

    function connect(
        extensionIdOrInfo?:
            | string
            | { name?: string; includeTlsChannelId?: boolean },
        connectInfo?: { name?: string; includeTlsChannelId?: boolean },
    ): Port {
        const info =
            typeof extensionIdOrInfo === "object"
                ? extensionIdOrInfo
                : (connectInfo ?? {});
        const callerPort = new CivilPort(info.name ?? "", { id: extId });
        const receiverPort = new CivilPort(info.name ?? "", { id: extId });
        callerPort._link(receiverPort);
        receiverPort._link(callerPort);
        onConnect.dispatch(receiverPort);
        return callerPort;
    }

    function sendMessage(
        extensionIdOrMessage?: string | unknown,
        messageOrOptions?: unknown,
        optionsOrCb?: unknown,
        maybeCb?: (response: unknown) => void,
    ): Promise<unknown> {
        let message: unknown;
        let cb: ((response: unknown) => void) | undefined;
        if (typeof extensionIdOrMessage === "string") {
            message = messageOrOptions;
            cb = (
                typeof optionsOrCb === "function" ? optionsOrCb : maybeCb
            ) as typeof cb;
        } else {
            message = extensionIdOrMessage;
            cb = (
                typeof messageOrOptions === "function"
                    ? messageOrOptions
                    : typeof optionsOrCb === "function"
                      ? optionsOrCb
                      : maybeCb
            ) as typeof cb;
        }
        return dual(
            () =>
                new Promise<unknown>(resolve => {
                    let responded = false;
                    const sendResponse = (r?: unknown) => {
                        if (!responded) {
                            responded = true;
                            resolve(r);
                        }
                    };
                    onMessage.dispatch(message, { id: extId }, sendResponse);
                    if (!responded) resolve(undefined);
                }),
            cb,
        );
    }

    return {
        id: extId,
        get lastError() {
            return _lastError;
        },

        getManifest: () => ({ ...manifest }) as Record<string, unknown>,
        getURL,
        sendMessage,
        connect,

        getContexts: (
            _filter: Record<string, unknown>,
            cb?: (ctx: unknown[]) => void,
        ) => resolved([], cb),

        getPlatformInfo: (cb?: (info: chrome.runtime.PlatformInfo) => void) => {
            const bib = getBiB();
            return resolved(
                {
                    os: bib.platformInfo.os ?? "win",
                    arch: bib.platformInfo.arch ?? "x86-64",
                    nacl_arch: bib.platformInfo.nacl_arch ?? "x86-64",
                } as chrome.runtime.PlatformInfo,
                cb,
            );
        },

        getBackgroundPage: (cb?: (page: Window | null) => void) =>
            resolved(null, cb),
        openOptionsPage: (cb?: () => void) => resolved(undefined, cb),
        setUninstallURL: (_url: string, cb?: () => void) =>
            resolved(undefined, cb),
        reload: () => {
            /* no-op */
        },

        requestUpdateCheck: (cb?: (status: string) => void) => {
            if (cb) cb("no_update");
            return Promise.resolve({ status: "no_update" });
        },

        sendRequest: sendMessage,

        onMessage,
        onMessageExternal,
        onConnect,
        onConnectExternal,
        onInstalled,
        onStartup,
        onSuspend,
        onSuspendCanceled,
        onUpdateAvailable,
        onBrowserUpdateAvailable,
        onRestartRequired,
        onUserScriptConnect,
        onUserScriptMessage,

        _setLastError(e: unknown) {
            _lastError = e ? toLastError(e) : null;
        },
        _clearLastError() {
            _lastError = null;
        },
    };
}
