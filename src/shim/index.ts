import type { ShimOptions } from "../types";
import { buildActionAPI } from "./action";
import { buildAlarmsAPI } from "./alarms";
import {
    accessibilityFeatures,
    audio,
    certificateProvider,
    contentSettings,
    declarativeContent,
    declarativeWebRequest,
    desktopCapture,
    devtools,
    dom,
    enterprise,
    extensionTypes,
    fileBrowserHandler,
    fileSystemProvider,
    fontSettings,
    gcm,
    idle,
    input,
    instanceID,
    loginState,
    networking,
    omnibox,
    pageCapture,
    platformKeys,
    power,
    printerProvider,
    printing,
    printingMetrics,
    readingList,
    search,
    serial,
    sessions,
    socket,
    systemLog,
    tabCapture,
    tabGroups,
    topSites,
    tts,
    ttsEngine,
    userScripts,
    vpnProvider,
    wallpaper,
    webAuthenticationProxy,
} from "./apis";
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
import { extUrl, getBiB, initBiB } from "./util";
import { buildWebNavigationAPI } from "./webNavigation";
import { buildWindowsAPI } from "./windows";

declare const __CIVIL_SHIM_OPTIONS__: ShimOptions;

(() => {
    if ((window as unknown as Record<string, unknown>).__civil_chrome_injected)
        return;
    (window as unknown as Record<string, unknown>).__civil_chrome_injected =
        true;

    const opts: ShimOptions = __CIVIL_SHIM_OPTIONS__;
    const { extId, manifest, storageData = {} } = opts;

    initBiB(opts.bib, window.location.origin);
    const bib = getBiB();
    const features = bib.features ?? {};

    const runtime = buildRuntimeAPI(extId, manifest);
    const storage = buildStorageAPI(storageData);
    const tabs = buildTabsAPI(extId);
    const windows = buildWindowsAPI();
    const action = buildActionAPI();
    const scripting = buildScriptingAPI();
    const dnr =
        features.declarativeNetRequest !== false
            ? buildDNRAPI()
            : buildDNRStub();
    const webNav =
        features.webNavigation !== false
            ? buildWebNavigationAPI()
            : buildNoopNamespace();
    const i18n = buildI18nAPI();
    const permissions = buildPermissionsAPI();
    const contextMenus =
        features.contextMenus !== false
            ? buildContextMenusAPI()
            : buildNoopNamespace();
    const webRequest =
        features.webRequest !== false
            ? buildWebRequestAPI()
            : buildNoopNamespace();
    const notifs =
        features.notifications !== false
            ? buildNotificationsAPI()
            : buildNoopNamespace();
    const browsingData = buildBrowsingDataAPI();
    const management = buildManagementAPI();
    const offscreen = buildOffscreenAPI();
    const sidePanel = buildSidePanelAPI();
    const privacy =
        features.privacy !== false ? buildPrivacyAPI() : buildNoopNamespace();
    const proxy =
        features.proxy !== false ? buildProxyAPI() : buildNoopNamespace();
    const dns = buildDnsAPI();
    const cookies =
        features.cookies !== false ? buildCookiesAPI() : buildNoopNamespace();
    const history =
        features.history !== false ? buildHistoryAPI() : buildNoopNamespace();
    const bookmarks = buildBookmarksAPI();
    const commands = buildCommandsAPI();
    const downloads =
        features.downloads !== false
            ? buildDownloadsAPI()
            : buildNoopNamespace();
    const alarmsAPI =
        features.alarms !== false ? buildAlarmsAPI() : buildNoopNamespace();

    const extension = {
        getURL: (path: string) => extUrl(extId, path),
        getBackgroundPage: () => null as Window | null,
        getViews: (_fetchProperties?: unknown) => [] as Window[],
        isAllowedIncognitoAccess: (cb?: (allowed: boolean) => void) => {
            if (cb) cb(false);
            return Promise.resolve(false);
        },
        isAllowedFileSchemeAccess: (cb?: (allowed: boolean) => void) => {
            if (cb) cb(false);
            return Promise.resolve(false);
        },
        sendRequest: runtime.sendMessage,
        sendMessage: runtime.sendMessage,
        onRequest: runtime.onMessage,
        onMessage: runtime.onMessage,
        onRequestExternal: runtime.onMessageExternal,
        onMessageExternal: runtime.onMessageExternal,
        inIncognitoContext: bib.incognito,
        lastError: null as { message: string } | null,

        getExtensionTabs: () => [] as unknown[],
    };

    const types = {
        ChromeSetting: class {
            onChange = {
                addListener() {},
                removeListener() {},
                hasListener() {
                    return false;
                },
                hasListeners() {
                    return false;
                },
            };
            get(_d: unknown, cb?: (d: unknown) => void) {
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
            set(_d: unknown, cb?: () => void) {
                if (cb) cb();
                return Promise.resolve();
            }
            clear(_d: unknown, cb?: () => void) {
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
        action,
        browserAction: action,
        pageAction: action,
        scripting,
        declarativeNetRequest: dnr,
        webNavigation: webNav,
        webRequest,
        permissions,
        contextMenus,
        notifications: notifs,
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
        alarms: alarmsAPI,
        i18n,
        extension,
        types,

        accessibilityFeatures,
        audio,
        certificateProvider,
        contentSettings:
            features.contentSettings !== false
                ? contentSettings
                : buildNoopNamespace(),
        declarativeContent,
        declarativeWebRequest,
        desktopCapture,
        devtools: features.devtools !== false ? devtools : undefined,
        dom,
        enterprise,
        extensionTypes,
        fileBrowserHandler,
        fileSystemProvider,
        fontSettings:
            features.fontSettings !== false
                ? fontSettings
                : buildNoopNamespace(),
        gcm,
        idle: features.idle !== false ? idle : buildNoopNamespace(),
        input,
        instanceID,
        loginState,
        networking,
        omnibox: features.omnibox !== false ? omnibox : buildNoopNamespace(),
        pageCapture:
            features.pageCapture !== false ? pageCapture : buildNoopNamespace(),
        platformKeys,
        power,
        printerProvider,
        printing,
        printingMetrics,
        readingList,
        search: features.search !== false ? search : buildNoopNamespace(),
        serial,
        sessions: features.sessions !== false ? sessions : buildNoopNamespace(),
        socket,
        systemLog,
        tabCapture,
        tabGroups:
            features.tabGroups !== false ? tabGroups : buildNoopNamespace(),
        topSites,
        tts: features.tts !== false ? tts : buildNoopNamespace(),
        ttsEngine,
        userScripts:
            features.userScripts !== false ? userScripts : buildNoopNamespace(),
        vpnProvider,
        wallpaper,
        webAuthenticationProxy,

        cast: undefined,
        app: {
            getDetails: () => null,
            getIsInstalled: () => false,
            InstallState: {},
            RunningState: {},
        },

        identity: {
            getAuthToken: (_d: unknown, cb?: (t?: string) => void) => {
                if (cb) cb(undefined);
                return Promise.resolve(undefined as string | undefined);
            },
            removeCachedAuthToken: (_d: unknown, cb?: () => void) => {
                if (cb) cb();
                return Promise.resolve();
            },
            getRedirectURL: (path?: string) =>
                `https://${extId}.chromiumapp.org/${path ?? ""}`,
            getProfileUserInfo: (_d: unknown, cb?: (i: unknown) => void) => {
                if (cb) cb({ email: "", id: "" });
                return Promise.resolve({ email: "", id: "" });
            },
            launchWebAuthFlow: (_d: unknown, cb?: (url?: string) => void) => {
                if (cb) cb(undefined);
                return Promise.resolve(undefined as string | undefined);
            },
            clearAllCachedAuthTokens: (cb?: () => void) => {
                if (cb) cb();
                return Promise.resolve();
            },
            onSignInChanged: {
                addListener() {},
                removeListener() {},
                hasListener() {
                    return false;
                },
                hasListeners() {
                    return false;
                },
            },
        },

        system: {
            cpu: {
                getInfo: (cb?: (info: unknown) => void) => {
                    const info = {
                        numOfProcessors: navigator.hardwareConcurrency ?? 4,
                        archName: bib.platformInfo.arch ?? "x86-64",
                        modelName: "Civil Shim CPU",
                        features: [],
                        processors: [],
                    };
                    if (cb) cb(info);
                    return Promise.resolve(info);
                },
            },
            memory: {
                getInfo: (cb?: (info: unknown) => void) => {
                    const info = {
                        capacity: 8 * 1024 * 1024 * 1024,
                        availableCapacity: 4 * 1024 * 1024 * 1024,
                        physicalMemory: 8 * 1024 * 1024 * 1024,
                    };
                    if (cb) cb(info);
                    return Promise.resolve(info);
                },
            },
            storage: {
                getInfo: (cb?: (i: unknown[]) => void) => {
                    if (cb) cb([]);
                    return Promise.resolve([]);
                },
            },
            display: {
                getInfo: (cb?: (i: unknown[]) => void) => {
                    if (cb) cb([]);
                    return Promise.resolve([]);
                },
                onDisplayChanged: {
                    addListener() {},
                    removeListener() {},
                    hasListener() {
                        return false;
                    },
                    hasListeners() {
                        return false;
                    },
                },
            },
            network: {
                getNetworkInterfaces: (cb?: (i: unknown[]) => void) => {
                    if (cb) cb([]);
                    return Promise.resolve([]);
                },
            },
            powerSource: {
                onPowerChanged: {
                    addListener() {},
                    removeListener() {},
                    hasListener() {
                        return false;
                    },
                    hasListeners() {
                        return false;
                    },
                },
            },
        },
    };

    const w = window as unknown as Record<string, unknown>;
    w.chrome = chrome;
    w.browser = chrome;

    storage.onChanged.addListener(() => {
        try {
            window.parent?.postMessage(
                {
                    type: bib.storagePostMessageType,
                    data: storage._local._snapshot(),
                },
                "*",
            );
        } catch {}
    });

    window.addEventListener("message", (e: MessageEvent) => {
        if (!e.data) return;
        if (e.data.type === bib.storageSyncMessageType) {
            const d = e.data as {
                type: string;
                data?: Record<string, unknown>;
                session?: Record<string, unknown>;
            };
            if (d.data) storage._local._seed(d.data);
            if (d.session) storage._session._seed(d.session);
        }
    });
})();

function buildNoopNamespace(): Record<string, unknown> {
    return {};
}

function buildDNRStub() {
    const noop2 = (_a?: unknown, _b?: unknown, cb?: () => void) => {
        if (cb) cb();
        return Promise.resolve();
    };
    return {
        updateDynamicRules: noop2,
        getDynamicRules: (_a?: unknown, cb?: (r: unknown[]) => void) => {
            if (cb) cb([]);
            return Promise.resolve([]);
        },
        updateSessionRules: noop2,
        getSessionRules: (_a?: unknown, cb?: (r: unknown[]) => void) => {
            if (cb) cb([]);
            return Promise.resolve([]);
        },
        updateEnabledRulesets: noop2,
        getEnabledRulesets: (cb?: (r: string[]) => void) => {
            if (cb) cb([]);
            return Promise.resolve([]);
        },
        getAvailableStaticRuleCount: (cb?: (n: number) => void) => {
            if (cb) cb(0);
            return Promise.resolve(0);
        },
        isRegexSupported: (
            _o: unknown,
            cb?: (r: { isSupported: boolean }) => void,
        ) => {
            if (cb) cb({ isSupported: true });
            return Promise.resolve({ isSupported: true });
        },
        onRuleMatchedDebug: {
            addListener() {},
            removeListener() {},
            hasListener() {
                return false;
            },
            hasListeners() {
                return false;
            },
        },
    };
}
