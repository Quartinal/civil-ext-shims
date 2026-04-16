import type { ShimOptions } from "../types";
import { buildActionAPI } from "./action";
import { buildAlarmsAPI } from "./alarms";
import { buildDNRAPI } from "./declarativeNetRequest";
import {
    buildBookmarksAPI,
    buildBrowsingDataAPI,
    buildCommandsAPI,
    buildContextMenusAPI,
    buildCookiesAPI,
    buildDnsAPI,
    buildDownloadsAPI,
    buildHistoryAPI,
    buildI18nAPI,
    buildManagementAPI,
    buildNotificationsAPI,
    buildOffscreenAPI,
    buildPermissionsAPI,
    buildPrivacyAPI,
    buildProxyAPI,
    buildSidePanelAPI,
    buildWebRequestAPI,
} from "./misc";
import { buildRuntimeAPI } from "./runtime";
import { buildScriptingAPI } from "./scripting";
import { buildStorageAPI } from "./storage";
import { buildTabsAPI } from "./tabs";
import { buildWebNavigationAPI } from "./webNavigation";
import { buildWindowsAPI } from "./windows";

declare const __CIVIL_SHIM_OPTIONS__: ShimOptions;

(() => {
    if ((window as unknown as Record<string, unknown>).__civil_chrome_injected)
        return;
    (window as unknown as Record<string, unknown>).__civil_chrome_injected =
        true;

    const opts: ShimOptions = __CIVIL_SHIM_OPTIONS__;
    const { extId, manifest, storageData = {}, origin } = opts;

    const _origin = origin ?? window.location.origin;

    const runtime = buildRuntimeAPI(extId, manifest);
    const storage = buildStorageAPI(storageData);
    const tabs = buildTabsAPI(extId);
    const windows = buildWindowsAPI();
    const alarms = buildAlarmsAPI();
    const action = buildActionAPI();
    const scripting = buildScriptingAPI();
    const dnr = buildDNRAPI();
    const webNavigation = buildWebNavigationAPI();
    const i18n = buildI18nAPI();
    const permissions = buildPermissionsAPI();
    const contextMenus = buildContextMenusAPI();
    const webRequest = buildWebRequestAPI();
    const notifications = buildNotificationsAPI();
    const browsingData = buildBrowsingDataAPI();
    const management = buildManagementAPI();
    const offscreen = buildOffscreenAPI();
    const sidePanel = buildSidePanelAPI();
    const privacy = buildPrivacyAPI();
    const proxy = buildProxyAPI();
    const dns = buildDnsAPI();
    const cookies = buildCookiesAPI();
    const history = buildHistoryAPI();
    const bookmarks = buildBookmarksAPI();
    const commands = buildCommandsAPI();
    const downloads = buildDownloadsAPI();

    const extension = {
        getURL: runtime.getURL,
        getBackgroundPage: () => null as Window | null,
        getViews: (_fetchProperties?: { type?: string; windowId?: number }) =>
            [] as Window[],
        isAllowedIncognitoAccess: (cb?: (isAllowed: boolean) => void) => {
            if (cb) cb(false);
            return Promise.resolve(false);
        },
        isAllowedFileSchemeAccess: (cb?: (isAllowed: boolean) => void) => {
            if (cb) cb(false);
            return Promise.resolve(false);
        },
        sendRequest: runtime.sendMessage,
        sendMessage: runtime.sendMessage,
        onRequest: runtime.onMessage,
        onMessage: runtime.onMessage,
        onRequestExternal: runtime.onMessageExternal,
        onMessageExternal: runtime.onMessageExternal,
        inIncognitoContext: false,
        lastError: null as { message: string } | null,
    };

    const types = {
        ChromeSetting: class {
            onChange = {
                addListener() {},
                removeListener() {},
                hasListener() {
                    return false;
                },
            };
            get(_details: unknown, cb?: (details: unknown) => void) {
                if (cb)
                    cb({
                        value: undefined,
                        levelOfControl: "not_controllable",
                    });
                return Promise.resolve({
                    value: undefined,
                    levelOfControl: "not_controllable",
                });
            }
            set(_details: unknown, cb?: () => void) {
                if (cb) cb();
                return Promise.resolve();
            }
            clear(_details: unknown, cb?: () => void) {
                if (cb) cb();
                return Promise.resolve();
            }
        },
    };

    const chrome = {
        runtime,
        storage,
        tabs,
        windows,
        alarms,
        action,
        browserAction: action,
        pageAction: action,
        scripting,
        declarativeNetRequest: dnr,
        webNavigation,
        i18n,
        permissions,
        contextMenus,
        webRequest,
        notifications,
        browsingData,
        management,
        offscreen,
        sidePanel,
        privacy,
        proxy,
        dns,
        cookies,
        history,
        bookmarks,
        commands,
        downloads,
        extension,
        types,

        devtools: undefined,

        app: {
            getDetails: () => null,
            getIsInstalled: () => false,
            InstallState: {},
            RunningState: {},
        },

        identity: {
            getAuthToken: (
                _details: unknown,
                cb?: (token?: string) => void,
            ) => {
                if (cb) cb(undefined);
                return Promise.resolve(undefined as string | undefined);
            },
            removeCachedAuthToken: (_details: unknown, cb?: () => void) => {
                if (cb) cb();
                return Promise.resolve();
            },
            getRedirectURL: (path?: string) =>
                `https://${extId}.chromiumapp.org/${path ?? ""}`,
            launchWebAuthFlow: (
                _details: unknown,
                cb?: (responseUrl?: string) => void,
            ) => {
                if (cb) cb(undefined);
                return Promise.resolve(undefined as string | undefined);
            },
            onSignInChanged: {
                addListener() {},
                removeListener() {},
                hasListener() {
                    return false;
                },
            },
        },

        system: {
            cpu: {
                getInfo: (cb?: (info: unknown) => void) => {
                    const info = {
                        numOfProcessors: 4,
                        archName: "x86-64",
                        modelName: "Civil Shim CPU",
                        features: [],
                        processors: [],
                    };
                    if (cb) cb(info);
                    return Promise.resolve(info);
                },
            },
            memory: {
                getInfo: (
                    cb?: (info: {
                        capacity: number;
                        availableCapacity: number;
                        physicalMemory?: number;
                    }) => void,
                ) => {
                    const info = {
                        capacity: 8 * 1024 * 1024 * 1024,
                        availableCapacity: 4 * 1024 * 1024 * 1024,
                    };
                    if (cb) cb(info);
                    return Promise.resolve(info);
                },
            },
            storage: {
                getInfo: (cb?: (info: unknown[]) => void) => {
                    if (cb) cb([]);
                    return Promise.resolve([]);
                },
            },
            display: {
                getInfo: (cb?: (info: unknown[]) => void) => {
                    if (cb) cb([]);
                    return Promise.resolve([]);
                },
            },
        },

        cast: undefined,
    };

    const w = window as unknown as Record<string, unknown>;
    w.chrome = chrome;
    w.browser = chrome;

    storage.onChanged.addListener(() => {
        try {
            window.parent?.postMessage(
                { type: "civil-ext-storage", data: storage._local._snapshot() },
                "*",
            );
        } catch {}
    });

    window.addEventListener("message", (e: MessageEvent) => {
        if (e.data?.type === "civil-ext-storage-sync") {
            storage._local._seed(e.data.data as Record<string, unknown>);
            storage._session._seed(
                (e.data.session as Record<string, unknown>) ?? {},
            );
        }
    });
})();
