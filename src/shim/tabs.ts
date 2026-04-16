import type { TabInfo } from "../types";
import { CivilEvent } from "./event";
import { dual, resolved } from "./util";

function _toChromTab(t: TabInfo): chrome.tabs.Tab {
    return {
        id: parseInt(t.id, 16) || 0,
        index: t.index,
        windowId: t.windowId,
        highlighted: t.highlighted,
        active: t.active,
        pinned: t.pinned,
        audible: t.audible ?? false,
        discarded: t.discarded,
        autoDiscardable: t.autoDiscardable,
        mutedInfo: t.mutedInfo ?? { muted: false },
        url: t.url,
        pendingUrl: t.pendingUrl,
        title: t.title,
        favIconUrl: t.favIconUrl,
        status: t.status ?? "complete",
        incognito: t.incognito,
        width: t.width,
        height: t.height,
        sessionId: t.sessionId,
        groupId: t.groupId ?? -1,
        openerTabId: t.openerTabId
            ? parseInt(t.openerTabId, 16) || undefined
            : undefined,
        selected: t.active,
    } as chrome.tabs.Tab;
}

function makeSelfTab(): chrome.tabs.Tab {
    return {
        id: -1,
        index: 0,
        windowId: 1,
        highlighted: true,
        active: true,
        pinned: false,
        audible: false,
        discarded: false,
        autoDiscardable: true,
        mutedInfo: { muted: false },
        url: typeof window !== "undefined" ? window.location.href : "",
        title: typeof document !== "undefined" ? document.title : "",
        favIconUrl: undefined,
        status: "complete",
        incognito: false,
        width: typeof window !== "undefined" ? window.innerWidth : 1280,
        height: typeof window !== "undefined" ? window.innerHeight : 800,
        groupId: -1,
        selected: true,
    } as chrome.tabs.Tab;
}

export function buildTabsAPI(extId: string) {
    const onCreated = new CivilEvent<(tab: chrome.tabs.Tab) => void>();
    const onRemoved = new CivilEvent<
        (tabId: number, removeInfo: chrome.tabs.OnRemovedInfo) => void
    >();
    const onUpdated = new CivilEvent<
        (
            tabId: number,
            changeInfo: chrome.tabs.OnUpdatedInfo,
            tab: chrome.tabs.Tab,
        ) => void
    >();
    const onActivated = new CivilEvent<
        (activeInfo: chrome.tabs.OnActivatedInfo) => void
    >();
    const onMoved = new CivilEvent<
        (tabId: number, moveInfo: chrome.tabs.OnMovedInfo) => void
    >();
    const onHighlighted = new CivilEvent<
        (highlightInfo: chrome.tabs.OnHighlightedInfo) => void
    >();
    const onDetached = new CivilEvent<
        (tabId: number, detachInfo: chrome.tabs.OnDetachedInfo) => void
    >();
    const onAttached = new CivilEvent<
        (tabId: number, attachInfo: chrome.tabs.OnAttachedInfo) => void
    >();
    const onReplaced = new CivilEvent<
        (addedTabId: number, removedTabId: number) => void
    >();
    const onZoomChange = new CivilEvent<
        (zoomChangeInfo: chrome.tabs.OnZoomChangeInfo) => void
    >();

    function query(
        queryInfo: chrome.tabs.QueryInfo,
        cb?: (tabs: chrome.tabs.Tab[]) => void,
    ): Promise<chrome.tabs.Tab[]> {
        return dual(() => {
            const self = makeSelfTab();
            const matches =
                (queryInfo.active === undefined ||
                    queryInfo.active === self.active) &&
                (queryInfo.currentWindow === undefined ||
                    queryInfo.currentWindow) &&
                (queryInfo.url === undefined ||
                    (self.url ?? "").includes(queryInfo.url as string));
            return Promise.resolve(matches ? [self] : []);
        }, cb);
    }

    function get(
        _tabId: number,
        cb?: (tab: chrome.tabs.Tab) => void,
    ): Promise<chrome.tabs.Tab> {
        return dual(() => Promise.resolve(makeSelfTab()), cb);
    }

    function getCurrent(
        cb?: (tab?: chrome.tabs.Tab) => void,
    ): Promise<chrome.tabs.Tab | undefined> {
        return dual(() => Promise.resolve(makeSelfTab()), cb);
    }

    function create(
        createProperties: chrome.tabs.CreateProperties,
        cb?: (tab: chrome.tabs.Tab) => void,
    ): Promise<chrome.tabs.Tab> {
        return dual(() => {
            if (createProperties.url && typeof document !== "undefined") {
                document.dispatchEvent(
                    new CustomEvent("browser:newtab", {
                        detail: { url: createProperties.url },
                    }),
                );
            }
            return Promise.resolve(makeSelfTab());
        }, cb);
    }

    function update(
        tabIdOrProps: number | chrome.tabs.UpdateProperties,
        propsOrCb?:
            | chrome.tabs.UpdateProperties
            | ((tab?: chrome.tabs.Tab) => void),
        maybeCb?: (tab?: chrome.tabs.Tab) => void,
    ): Promise<chrome.tabs.Tab | undefined> {
        const props =
            typeof tabIdOrProps === "number"
                ? (propsOrCb as chrome.tabs.UpdateProperties)
                : tabIdOrProps;
        const cb =
            typeof tabIdOrProps === "number"
                ? (maybeCb as ((tab?: chrome.tabs.Tab) => void) | undefined)
                : (propsOrCb as ((tab?: chrome.tabs.Tab) => void) | undefined);

        return dual(() => {
            if (props.url && typeof document !== "undefined") {
                document.dispatchEvent(
                    new CustomEvent("browser:navigate", {
                        detail: { url: props.url },
                    }),
                );
            }
            return Promise.resolve(makeSelfTab());
        }, cb);
    }

    function remove(
        _tabIds: number | number[],
        cb?: () => void,
    ): Promise<void> {
        return resolved(undefined, cb);
    }

    function sendMessage(
        _tabId: number,
        message: unknown,
        optionsOrCb?:
            | chrome.tabs.MessageSendOptions
            | ((response: unknown) => void),
        maybeCb?: (response: unknown) => void,
    ): Promise<unknown> {
        const cb = typeof optionsOrCb === "function" ? optionsOrCb : maybeCb;
        if (typeof document !== "undefined") {
            document.dispatchEvent(
                new CustomEvent("civil-ext-tab-message", {
                    detail: { extId, message },
                }),
            );
        }
        return dual(() => Promise.resolve(undefined), cb);
    }

    function executeScript(
        _tabIdOrDetails: number | Record<string, unknown>,
        _detailsOrCb?: Record<string, unknown> | ((results: unknown[]) => void),
        maybeCb?: (results: unknown[]) => void,
    ): Promise<unknown[]> {
        const cb = typeof _detailsOrCb === "function" ? _detailsOrCb : maybeCb;
        return resolved([], cb);
    }

    function insertCSS(
        _tabIdOrDetails: number | Record<string, unknown>,
        _detailsOrCb?: Record<string, unknown> | (() => void),
        maybeCb?: () => void,
    ): Promise<void> {
        return resolved(undefined, maybeCb);
    }

    function captureVisibleTab(
        _windowIdOrOptions?: number | chrome.extensionTypes.ImageDetails,
        _optionsOrCb?:
            | chrome.extensionTypes.ImageDetails
            | ((dataUrl: string) => void),
        maybeCb?: (dataUrl: string) => void,
    ): Promise<string> {
        return resolved("", maybeCb);
    }

    function detectLanguage(
        _tabId: number,
        cb?: (language: string) => void,
    ): Promise<string> {
        return resolved(navigator.language || "en", cb);
    }

    function discard(
        _tabId?: number,
        cb?: (tab?: chrome.tabs.Tab) => void,
    ): Promise<chrome.tabs.Tab | undefined> {
        return resolved(undefined, cb);
    }

    function duplicate(
        _tabId: number,
        cb?: (tab?: chrome.tabs.Tab) => void,
    ): Promise<chrome.tabs.Tab | undefined> {
        return resolved(makeSelfTab(), cb);
    }

    function highlight(
        _highlightInfo: chrome.tabs.HighlightInfo,
        cb?: (window: chrome.windows.Window) => void,
    ): Promise<chrome.windows.Window> {
        return resolved(
            {
                id: 1,
                focused: true,
                alwaysOnTop: false,
                incognito: false,
                state: "normal",
                type: "normal",
            } as chrome.windows.Window,
            cb,
        );
    }

    function move(
        _tabIds: number | number[],
        _moveProperties: chrome.tabs.MoveProperties,
        cb?: (tabs: chrome.tabs.Tab | chrome.tabs.Tab[]) => void,
    ): Promise<chrome.tabs.Tab | chrome.tabs.Tab[]> {
        return resolved(makeSelfTab(), cb);
    }

    function reload(
        _tabIdOrReloadProperties?: number | chrome.tabs.ReloadProperties,
        _reloadPropertiesOrCb?: chrome.tabs.ReloadProperties | (() => void),
        maybeCb?: () => void,
    ): Promise<void> {
        return resolved(undefined, maybeCb);
    }

    function goBack(_tabId?: number, cb?: () => void): Promise<void> {
        return resolved(undefined, cb);
    }

    function goForward(_tabId?: number, cb?: () => void): Promise<void> {
        return resolved(undefined, cb);
    }

    function setZoom(
        _tabIdOrZoomFactor: number,
        _zoomFactorOrCb?: number | (() => void),
        maybeCb?: () => void,
    ): Promise<void> {
        return resolved(undefined, maybeCb);
    }

    function getZoom(
        _tabId?: number,
        cb?: (zoomFactor: number) => void,
    ): Promise<number> {
        return resolved(1, cb);
    }

    function setZoomSettings(
        _tabId: number,
        _zoomSettings: chrome.tabs.ZoomSettings,
        cb?: () => void,
    ): Promise<void> {
        return resolved(undefined, cb);
    }

    function getZoomSettings(
        _tabId?: number,
        cb?: (zoomSettings: chrome.tabs.ZoomSettings) => void,
    ): Promise<chrome.tabs.ZoomSettings> {
        return resolved(
            { mode: "automatic", scope: "per-origin", defaultZoomFactor: 1 },
            cb,
        );
    }

    function getAllInWindow(
        _windowId?: number,
        cb?: (tabs: chrome.tabs.Tab[]) => void,
    ): Promise<chrome.tabs.Tab[]> {
        return resolved([makeSelfTab()], cb);
    }

    function getSelected(
        _windowId?: number,
        cb?: (tab: chrome.tabs.Tab) => void,
    ): Promise<chrome.tabs.Tab> {
        return resolved(makeSelfTab(), cb);
    }

    return {
        query,
        get,
        getCurrent,
        create,
        update,
        remove,
        sendMessage,
        executeScript,
        insertCSS,
        captureVisibleTab,
        detectLanguage,
        discard,
        duplicate,
        highlight,
        move,
        reload,
        goBack,
        goForward,
        setZoom,
        getZoom,
        setZoomSettings,
        getZoomSettings,
        getAllInWindow,
        getSelected,
        onCreated,
        onRemoved,
        onUpdated,
        onActivated,
        onMoved,
        onHighlighted,
        onDetached,
        onAttached,
        onReplaced,
        onZoomChange,
        TAB_ID_NONE: -1,
    };
}
