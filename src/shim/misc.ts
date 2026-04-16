import { CivilEvent, makeNoopEvent } from "./event";
import { resolved } from "./util";

interface MessageEntry {
    message: string;
    placeholders?: Record<string, { content: string }>;
}

export function buildI18nAPI() {
    const _messages: Record<string, MessageEntry> = {};

    function getMessage(
        messageName: string,
        substitutions?: string | string[],
    ): string {
        const entry = _messages[messageName];
        if (!entry) return messageName;
        let msg = entry.message;
        const subs = Array.isArray(substitutions)
            ? substitutions
            : substitutions != null
              ? [substitutions]
              : [];
        subs.forEach((s, i) => {
            msg = msg.replace(new RegExp(`\\$${i + 1}`, "g"), s);
        });
        if (entry.placeholders) {
            for (const [name, { content }] of Object.entries(
                entry.placeholders,
            )) {
                msg = msg.replace(new RegExp(`\\$${name}\\$`, "gi"), content);
            }
        }
        return msg;
    }

    function getUILanguage(): string {
        return navigator.language || "en";
    }

    function detectLanguage(
        _text: string,
        cb?: (result: {
            isReliable: boolean;
            languages: { language: string; percentage: number }[];
        }) => void,
    ) {
        return resolved(
            {
                isReliable: false,
                languages: [{ language: "en", percentage: 100 }],
            },
            cb,
        );
    }

    function getAcceptLanguages(cb?: (languages: string[]) => void) {
        return resolved(
            typeof navigator !== "undefined" && navigator.languages
                ? [...navigator.languages]
                : ["en"],
            cb,
        );
    }

    function _seed(messages: Record<string, MessageEntry>): void {
        Object.assign(_messages, messages);
    }

    return {
        getMessage,
        getUILanguage,
        detectLanguage,
        getAcceptLanguages,
        _seed,
    };
}

export function buildPermissionsAPI() {
    const _granted = new Set<string>(["<all_urls>", "storage", "tabs"]);
    const onAdded = new CivilEvent<
        (permissions: chrome.permissions.Permissions) => void
    >();
    const onRemoved = new CivilEvent<
        (permissions: chrome.permissions.Permissions) => void
    >();

    return {
        contains(
            perms: chrome.permissions.Permissions,
            cb?: (result: boolean) => void,
        ) {
            return resolved(
                (perms.permissions ?? []).every(p => _granted.has(p)),
                cb,
            );
        },
        request(
            perms: chrome.permissions.Permissions,
            cb?: (granted: boolean) => void,
        ) {
            (perms.permissions ?? []).forEach(p => {
                _granted.add(p);
            });
            onAdded.dispatch(perms);
            return resolved(true, cb);
        },
        remove(
            perms: chrome.permissions.Permissions,
            cb?: (removed: boolean) => void,
        ) {
            (perms.permissions ?? []).forEach(p => {
                _granted.delete(p);
            });
            onRemoved.dispatch(perms);
            return resolved(true, cb);
        },
        getAll(cb?: (permissions: chrome.permissions.Permissions) => void) {
            return resolved(
                {
                    permissions: [
                        ..._granted,
                    ] as unknown as chrome.permissions.Permissions["permissions"],
                    origins: ["<all_urls>"],
                },
                cb,
            );
        },
        onAdded,
        onRemoved,
    };
}

export function buildContextMenusAPI() {
    const _items = new Map<string | number, Record<string, unknown>>();
    let _idCounter = 1;
    const onClicked = new CivilEvent<
        (info: chrome.contextMenus.OnClickData, tab?: chrome.tabs.Tab) => void
    >();

    return {
        create(
            props: chrome.contextMenus.CreateProperties,
            cb?: () => void,
        ): string | number {
            const id =
                (props.id as string | number | undefined) ?? _idCounter++;
            _items.set(id, { ...props, id });
            if (cb) cb();
            return id;
        },
        update(
            id: string | number,
            props: Record<string, unknown>,
            cb?: () => void,
        ) {
            _items.set(id, { ...(_items.get(id) ?? {}), ...props });
            return resolved(undefined, cb);
        },
        remove(id: string | number, cb?: () => void) {
            _items.delete(id);
            return resolved(undefined, cb);
        },
        removeAll(cb?: () => void) {
            _items.clear();
            return resolved(undefined, cb);
        },
        onClicked,
        ACTION_MENU_TOP_LEVEL_LIMIT: 6,
    };
}

export function buildWebRequestAPI() {
    const makeEvent = () => makeNoopEvent<(...a: never[]) => void>();
    return {
        onBeforeRequest: makeEvent(),
        onBeforeSendHeaders: makeEvent(),
        onSendHeaders: makeEvent(),
        onHeadersReceived: makeEvent(),
        onAuthRequired: makeEvent(),
        onResponseStarted: makeEvent(),
        onBeforeRedirect: makeEvent(),
        onCompleted: makeEvent(),
        onErrorOccurred: makeEvent(),
        onActionIgnored: makeEvent(),
        MAX_HANDLER_BEHAVIOR_CHANGED_CALLS_PER_10_MINUTES: 20,
        handlerBehaviorChanged(cb?: () => void) {
            return resolved(undefined, cb);
        },
    };
}

export function buildNotificationsAPI() {
    const onClicked = new CivilEvent<(id: string) => void>();
    const onClosed = new CivilEvent<(id: string, byUser: boolean) => void>();
    const onButtonClicked = new CivilEvent<
        (id: string, buttonIndex: number) => void
    >();
    const onPermissionLevelChanged = new CivilEvent<(level: string) => void>();
    const onShowSettings = new CivilEvent<() => void>();

    return {
        create(
            notificationIdOrOptions:
                | string
                | chrome.notifications.NotificationOptions,
            optionsOrCb?:
                | chrome.notifications.NotificationOptions
                | ((id: string) => void),
            maybeCb?: (id: string) => void,
        ) {
            const id =
                typeof notificationIdOrOptions === "string"
                    ? notificationIdOrOptions
                    : crypto.randomUUID();
            const options =
                typeof notificationIdOrOptions === "object"
                    ? notificationIdOrOptions
                    : (optionsOrCb as chrome.notifications.NotificationOptions);
            const cb =
                typeof optionsOrCb === "function" ? optionsOrCb : maybeCb;
            try {
                if (
                    typeof Notification !== "undefined" &&
                    Notification.permission === "granted"
                ) {
                    new Notification(
                        ((options as Record<string, unknown>)
                            ?.title as string) ?? "",
                        {
                            body:
                                ((options as Record<string, unknown>)
                                    ?.message as string) ?? "",
                        },
                    );
                }
            } catch {}
            return resolved(id, cb);
        },
        clear(_id: string, cb?: (wasCleared: boolean) => void) {
            return resolved(true, cb);
        },
        getAll(
            cb?: (
                notifications: Record<
                    string,
                    chrome.notifications.NotificationOptions
                >,
            ) => void,
        ) {
            return resolved({}, cb);
        },
        getPermissionLevel(cb?: (level: string) => void) {
            return resolved("granted", cb);
        },
        update(
            _id: string,
            _options: chrome.notifications.NotificationOptions,
            cb?: (wasUpdated: boolean) => void,
        ) {
            return resolved(false, cb);
        },
        onClicked,
        onClosed,
        onButtonClicked,
        onPermissionLevelChanged,
        onShowSettings,
    };
}

export function buildBrowsingDataAPI() {
    const noop = (_a?: unknown, _b?: unknown, cb?: () => void) =>
        resolved(undefined, cb);
    return {
        remove: noop,
        removeAppcache: noop,
        removeCache: noop,
        removeCacheStorage: noop,
        removeCookies: noop,
        removeDownloads: noop,
        removeFileSystems: noop,
        removeFormData: noop,
        removeHistory: noop,
        removeIndexedDB: noop,
        removeLocalStorage: noop,
        removePasswords: noop,
        removePluginData: noop,
        removeServiceWorkers: noop,
        removeWebSQL: noop,
        settings(
            cb?: (result: {
                options: chrome.browsingData.RemovalOptions;
                dataToRemove: chrome.browsingData.DataTypeSet;
            }) => void,
        ) {
            return resolved(
                {
                    options: { since: 0 },
                    dataToRemove: {},
                    dataRemovalPermitted: {},
                } as unknown as {
                    options: chrome.browsingData.RemovalOptions;
                    dataToRemove: chrome.browsingData.DataTypeSet;
                },
                cb,
            );
        },
    };
}

export function buildManagementAPI() {
    const onEnabled = new CivilEvent<
        (info: chrome.management.ExtensionInfo) => void
    >();
    const onDisabled = new CivilEvent<
        (info: chrome.management.ExtensionInfo) => void
    >();
    const onInstalled = new CivilEvent<
        (info: chrome.management.ExtensionInfo) => void
    >();
    const onUninstalled = new CivilEvent<(id: string) => void>();
    return {
        getAll(cb?: (result: chrome.management.ExtensionInfo[]) => void) {
            return resolved([], cb);
        },
        get(
            _id: string,
            cb?: (result: chrome.management.ExtensionInfo) => void,
        ) {
            return resolved({} as chrome.management.ExtensionInfo, cb);
        },
        getSelf(cb?: (result: chrome.management.ExtensionInfo) => void) {
            return resolved({} as chrome.management.ExtensionInfo, cb);
        },
        setEnabled(_id: string, _enabled: boolean, cb?: () => void) {
            return resolved(undefined, cb);
        },
        uninstallSelf(
            _options?: { showConfirmDialog?: boolean },
            cb?: () => void,
        ) {
            return resolved(undefined, cb);
        },
        onEnabled,
        onDisabled,
        onInstalled,
        onUninstalled,
    };
}

export function buildOffscreenAPI() {
    return {
        createDocument(
            _params: { url: string; reasons: string[]; justification: string },
            cb?: () => void,
        ) {
            return resolved(undefined, cb);
        },
        closeDocument(cb?: () => void) {
            return resolved(undefined, cb);
        },
        hasDocument(cb?: (result: boolean) => void) {
            return resolved(false, cb);
        },
        Reason: {
            TESTING: "TESTING",
            AUDIO_PLAYBACK: "AUDIO_PLAYBACK",
            IFRAME_SCRIPTING: "IFRAME_SCRIPTING",
            DOM_SCRAPING: "DOM_SCRAPING",
            BLOBS: "BLOBS",
            DOM_PARSER: "DOM_PARSER",
            USER_MEDIA: "USER_MEDIA",
            DISPLAY_MEDIA: "DISPLAY_MEDIA",
            WEB_RTC: "WEB_RTC",
            CLIPBOARD: "CLIPBOARD",
            LOCAL_STORAGE: "LOCAL_STORAGE",
            WORKERS: "WORKERS",
            BATTERY_STATUS: "BATTERY_STATUS",
            MATCH_MEDIA: "MATCH_MEDIA",
            GEOLOCATION: "GEOLOCATION",
        },
    };
}

export function buildSidePanelAPI() {
    return {
        open(
            _options?: { tabId?: number; windowId?: number },
            cb?: () => void,
        ) {
            return resolved(undefined, cb);
        },
        setOptions(
            _options: { tabId?: number; path?: string; enabled?: boolean },
            cb?: () => void,
        ) {
            return resolved(undefined, cb);
        },
        getOptions(
            _options: { tabId?: number },
            cb?: (options: { path?: string; enabled?: boolean }) => void,
        ) {
            return resolved({ enabled: false }, cb);
        },
        setPanelBehavior(
            _behavior: { openPanelOnActionClick?: boolean },
            cb?: () => void,
        ) {
            return resolved(undefined, cb);
        },
        getPanelBehavior(
            cb?: (behavior: { openPanelOnActionClick: boolean }) => void,
        ) {
            return resolved({ openPanelOnActionClick: false }, cb);
        },
    };
}

function makeChromeSetting() {
    const onChange =
        makeNoopEvent<
            (details: { value: unknown; levelOfControl: string }) => void
        >();
    return {
        get(
            _details: { incognito?: boolean },
            cb?: (details: { value: unknown; levelOfControl: string }) => void,
        ) {
            return resolved(
                { value: false, levelOfControl: "not_controllable" },
                cb,
            );
        },
        set(_details: { value: unknown; scope?: string }, cb?: () => void) {
            return resolved(undefined, cb);
        },
        clear(_details: { scope?: string }, cb?: () => void) {
            return resolved(undefined, cb);
        },
        onChange,
    };
}

export function buildPrivacyAPI() {
    const s = makeChromeSetting;
    return {
        network: {
            networkPredictionEnabled: s(),
            webRTCIPHandlingPolicy: s(),
            webRTCMultipleRoutesEnabled: s(),
            webRTCNonProxiedUdpEnabled: s(),
        },
        services: {
            alternateErrorPagesEnabled: s(),
            autofillAddressEnabled: s(),
            autofillCreditCardEnabled: s(),
            autofillEnabled: s(),
            hotwordSearchEnabled: s(),
            passwordSavingEnabled: s(),
            safeBrowsingEnabled: s(),
            safeBrowsingExtendedReportingEnabled: s(),
            searchSuggestEnabled: s(),
            spellingServiceEnabled: s(),
            translationServiceEnabled: s(),
        },
        websites: {
            adMeasurementEnabled: s(),
            fledgeEnabled: s(),
            hyperlinkAuditingEnabled: s(),
            interestCohortEnabled: s(),
            privacySandboxEnabled: s(),
            protectedContentEnabled: s(),
            referrersEnabled: s(),
            relatedWebsiteSetsEnabled: s(),
            thirdPartyCookiesAllowed: s(),
            topicsEnabled: s(),
        },
    };
}

export function buildProxyAPI() {
    return {
        settings: makeChromeSetting(),
        onProxyError:
            makeNoopEvent<
                (details: {
                    fatal: boolean;
                    error: string;
                    details: string;
                }) => void
            >(),
        onRequest: makeNoopEvent<(details: unknown) => void>(),
        Mode: {
            DIRECT: "direct",
            AUTO_DETECT: "auto_detect",
            PAC_SCRIPT: "pac_script",
            FIXED_SERVERS: "fixed_servers",
            SYSTEM: "system",
        },
    };
}

export function buildDnsAPI() {
    return {
        resolve(
            _hostname: string,
            cb?: (resolveInfo: {
                resultCode: number;
                address?: string;
            }) => void,
        ) {
            return resolved({ resultCode: 0, address: "0.0.0.0" }, cb);
        },
    };
}

export function buildCookiesAPI() {
    const onChanged = new CivilEvent<
        (changeInfo: chrome.cookies.CookieChangeInfo) => void
    >();
    return {
        get(
            _details: chrome.cookies.Cookie,
            cb?: (cookie: chrome.cookies.Cookie | null) => void,
        ) {
            return resolved(null, cb);
        },
        getAll(
            _details: chrome.cookies.GetAllDetails,
            cb?: (cookies: chrome.cookies.Cookie[]) => void,
        ) {
            return resolved([], cb);
        },
        set(
            details: chrome.cookies.SetDetails,
            cb?: (cookie: chrome.cookies.Cookie | null) => void,
        ) {
            try {
                document.cookie = `${details.name}=${details.value ?? ""}`;
            } catch {}
            return resolved(null, cb);
        },
        remove(
            details: chrome.cookies.SetDetails,
            cb?: (details: chrome.cookies.SetDetails) => void,
        ) {
            try {
                document.cookie = `${details.name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT`;
            } catch {}
            return resolved(details, cb);
        },
        getAllCookieStores(
            cb?: (cookieStores: chrome.cookies.CookieStore[]) => void,
        ) {
            return resolved(
                [{ id: "0", tabIds: [] }] as chrome.cookies.CookieStore[],
                cb,
            );
        },
        onChanged,
    };
}

export function buildHistoryAPI() {
    const onVisited = new CivilEvent<
        (result: chrome.history.HistoryItem) => void
    >();
    const onVisitRemoved = new CivilEvent<
        (removed: chrome.history.RemovedResult) => void
    >();
    return {
        search(
            _query: chrome.history.HistoryQuery,
            cb?: (results: chrome.history.HistoryItem[]) => void,
        ) {
            return resolved([], cb);
        },
        getVisits(
            _details: chrome.history.UrlDetails,
            cb?: (results: chrome.history.VisitItem[]) => void,
        ) {
            return resolved([], cb);
        },
        addUrl(_details: chrome.history.UrlDetails, cb?: () => void) {
            return resolved(undefined, cb);
        },
        deleteUrl(_details: chrome.history.UrlDetails, cb?: () => void) {
            return resolved(undefined, cb);
        },
        deleteRange(_range: chrome.history.Range, cb?: () => void) {
            return resolved(undefined, cb);
        },
        deleteAll(cb?: () => void) {
            return resolved(undefined, cb);
        },
        onVisited,
        onVisitRemoved,
    };
}

export function buildBookmarksAPI() {
    const _tree: chrome.bookmarks.BookmarkTreeNode[] = [];
    const onCreated = new CivilEvent<
        (id: string, bookmark: chrome.bookmarks.BookmarkTreeNode) => void
    >();
    const onRemoved = new CivilEvent<
        (
            id: string,
            removeInfo: {
                parentId: string;
                index: number;
                node: chrome.bookmarks.BookmarkTreeNode;
            },
        ) => void
    >();
    const onChanged = new CivilEvent<
        (id: string, changeInfo: { title: string; url?: string }) => void
    >();
    const onMoved = new CivilEvent<
        (
            id: string,
            moveInfo: {
                parentId: string;
                index: number;
                oldParentId: string;
                oldIndex: number;
            },
        ) => void
    >();
    const onChildrenReordered = new CivilEvent<
        (id: string, reorderInfo: { childIds: string[] }) => void
    >();
    const onImportBegan = new CivilEvent<() => void>();
    const onImportEnded = new CivilEvent<() => void>();

    return {
        get(
            _ids: string | string[],
            cb?: (results: chrome.bookmarks.BookmarkTreeNode[]) => void,
        ) {
            return resolved([], cb);
        },
        getChildren(
            _id: string,
            cb?: (results: chrome.bookmarks.BookmarkTreeNode[]) => void,
        ) {
            return resolved([], cb);
        },
        getRecent(
            _n: number,
            cb?: (results: chrome.bookmarks.BookmarkTreeNode[]) => void,
        ) {
            return resolved([], cb);
        },
        getTree(cb?: (results: chrome.bookmarks.BookmarkTreeNode[]) => void) {
            return resolved(_tree, cb);
        },
        getSubTree(
            _id: string,
            cb?: (results: chrome.bookmarks.BookmarkTreeNode[]) => void,
        ) {
            return resolved([], cb);
        },
        search(
            _query: string | { query?: string; url?: string; title?: string },
            cb?: (results: chrome.bookmarks.BookmarkTreeNode[]) => void,
        ) {
            return resolved([], cb);
        },
        create(
            bookmark: {
                parentId?: string;
                index?: number;
                title?: string;
                url?: string;
            },
            cb?: (result: chrome.bookmarks.BookmarkTreeNode) => void,
        ) {
            const node = {
                ...bookmark,
                id: crypto.randomUUID(),
                dateAdded: Date.now(),
                syncing: false,
                children: [],
            } as chrome.bookmarks.BookmarkTreeNode;
            _tree.push(node);
            return resolved(node, cb);
        },
        move(
            _id: string,
            _dest: { parentId?: string; index?: number },
            cb?: (result: chrome.bookmarks.BookmarkTreeNode) => void,
        ) {
            return resolved({} as chrome.bookmarks.BookmarkTreeNode, cb);
        },
        update(
            _id: string,
            _changes: { title?: string; url?: string },
            cb?: (result: chrome.bookmarks.BookmarkTreeNode) => void,
        ) {
            return resolved({} as chrome.bookmarks.BookmarkTreeNode, cb);
        },
        remove(_id: string, cb?: () => void) {
            return resolved(undefined, cb);
        },
        removeTree(_id: string, cb?: () => void) {
            return resolved(undefined, cb);
        },
        onCreated,
        onRemoved,
        onChanged,
        onMoved,
        onChildrenReordered,
        onImportBegan,
        onImportEnded,
        MAX_WRITE_OPERATIONS_PER_HOUR: 1_000_000,
        MAX_SUSTAINED_WRITE_OPERATIONS_PER_MINUTE: 1_000_000,
    };
}

export function buildCommandsAPI() {
    const onCommand = new CivilEvent<
        (command: string, tab?: chrome.tabs.Tab) => void
    >();
    return {
        getAll(cb?: (commands: chrome.commands.Command[]) => void) {
            return resolved([], cb);
        },
        onCommand,
    };
}

export function buildDownloadsAPI() {
    const onCreated = new CivilEvent<
        (item: chrome.downloads.DownloadItem) => void
    >();
    const onChanged = new CivilEvent<
        (delta: chrome.downloads.DownloadDelta) => void
    >();
    const onErased = new CivilEvent<(id: number) => void>();
    const onDeterminingFilename = new CivilEvent<
        (
            item: chrome.downloads.DownloadItem,
            suggest: (suggestion?: chrome.downloads.FilenameSuggestion) => void,
        ) => void
    >();
    return {
        download(
            _options: chrome.downloads.DownloadOptions,
            cb?: (id: number) => void,
        ) {
            return resolved(-1, cb);
        },
        search(
            _query: chrome.downloads.DownloadQuery,
            cb?: (results: chrome.downloads.DownloadItem[]) => void,
        ) {
            return resolved([], cb);
        },
        pause(_id: number, cb?: () => void) {
            return resolved(undefined, cb);
        },
        resume(_id: number, cb?: () => void) {
            return resolved(undefined, cb);
        },
        cancel(_id: number, cb?: () => void) {
            return resolved(undefined, cb);
        },
        getFileIcon(
            _id: number,
            _opts?: chrome.downloads.GetFileIconOptions,
            cb?: (url: string) => void,
        ) {
            return resolved("", cb);
        },
        open(_id: number) {},
        show(_id: number) {},
        showDefaultFolder() {},
        erase(
            _query: chrome.downloads.DownloadQuery,
            cb?: (ids: number[]) => void,
        ) {
            return resolved([], cb);
        },
        removeFile(_id: number, cb?: () => void) {
            return resolved(undefined, cb);
        },
        acceptDanger(_id: number, cb?: () => void) {
            return resolved(undefined, cb);
        },
        setUiOptions(_opts: { enabled: boolean }, cb?: () => void) {
            return resolved(undefined, cb);
        },
        onCreated,
        onChanged,
        onErased,
        onDeterminingFilename,
    };
}
