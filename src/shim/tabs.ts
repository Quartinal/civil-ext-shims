import { CivilEvent } from "./event";
import { dispatchBrowserEvent, dual, getBiB, resolved } from "./util";

type TabChangeInfo = chrome.tabs.OnActiveChangedInfo;
type TabActiveInfo = chrome.tabs.OnActivatedInfo;
type TabMoveInfo = chrome.tabs.OnMovedInfo;
type TabHighlightInfo = chrome.tabs.OnHighlightedInfo;
type TabDetachInfo = chrome.tabs.OnDetachedInfo;
type TabAttachInfo = chrome.tabs.OnAttachedInfo;
type TabRemoveInfo = chrome.tabs.OnRemovedInfo;
type ZoomChangeInfo = chrome.tabs.OnZoomChangeInfo;
type ZoomSettings = chrome.tabs.ZoomSettings;
type HighlightInfo = chrome.tabs.HighlightInfo;

function makeSelfTab(): chrome.tabs.Tab {
    const bib = getBiB();
    const syn = bib.currentTab;
    return {
        id: syn.id ?? -1,
        index: syn.index ?? 0,
        windowId: syn.windowId ?? 1,
        highlighted: true,
        active: syn.active ?? true,
        pinned: syn.pinned ?? false,
        audible: false,
        discarded: false,
        autoDiscardable: true,
        mutedInfo: { muted: false },
        url:
            syn.url ??
            (typeof window !== "undefined" ? window.location.href : ""),
        title:
            syn.title ??
            (typeof document !== "undefined" ? document.title : ""),
        favIconUrl: syn.favIconUrl,
        status: syn.status ?? "complete",
        incognito: syn.incognito ?? bib.incognito,
        width: typeof window !== "undefined" ? window.innerWidth : 1280,
        height: typeof window !== "undefined" ? window.innerHeight : 800,
        groupId: syn.groupId ?? -1,
        selected: true,
    } as chrome.tabs.Tab;
}

export function buildTabsAPI(extId: string) {
    const onCreated = new CivilEvent<(tab: chrome.tabs.Tab) => void>();
    const onRemoved = new CivilEvent<
        (tabId: number, removeInfo: TabRemoveInfo) => void
    >();
    const onUpdated = new CivilEvent<
        (tabId: number, changeInfo: TabChangeInfo, tab: chrome.tabs.Tab) => void
    >();
    const onActivated = new CivilEvent<(activeInfo: TabActiveInfo) => void>();
    const onMoved = new CivilEvent<
        (tabId: number, moveInfo: TabMoveInfo) => void
    >();
    const onHighlighted = new CivilEvent<
        (highlightInfo: TabHighlightInfo) => void
    >();
    const onDetached = new CivilEvent<
        (tabId: number, detachInfo: TabDetachInfo) => void
    >();
    const onAttached = new CivilEvent<
        (tabId: number, attachInfo: TabAttachInfo) => void
    >();
    const onReplaced = new CivilEvent<
        (addedTabId: number, removedTabId: number) => void
    >();
    const onZoomChange = new CivilEvent<
        (zoomChangeInfo: ZoomChangeInfo) => void
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
        props: chrome.tabs.CreateProperties,
        cb?: (tab: chrome.tabs.Tab) => void,
    ): Promise<chrome.tabs.Tab> {
        return dual(() => {
            const bib = getBiB();
            if (props.url)
                dispatchBrowserEvent(bib.newTabEvent, { url: props.url });
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
                ? maybeCb
                : (propsOrCb as ((tab?: chrome.tabs.Tab) => void) | undefined);
        return dual(() => {
            const bib = getBiB();
            if (props?.url)
                dispatchBrowserEvent(bib.navigateEvent, { url: props.url });
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
        try {
            document.dispatchEvent(
                new CustomEvent("civil-ext-tab-message", {
                    detail: { extId, message },
                }),
            );
        } catch {}
        return dual(() => Promise.resolve(undefined), cb);
    }

    function executeScript(
        _a: unknown,
        _b?: unknown,
        cb?: (r: unknown[]) => void,
    ): Promise<unknown[]> {
        return resolved([], cb);
    }
    function insertCSS(
        _a: unknown,
        _b?: unknown,
        cb?: () => void,
    ): Promise<void> {
        return resolved(undefined, cb);
    }

    function captureVisibleTab(
        _a?: unknown,
        _b?: unknown,
        cb?: (url: string) => void,
    ): Promise<string> {
        return resolved("", cb);
    }
    function detectLanguage(
        _tabId: number,
        cb?: (lang: string) => void,
    ): Promise<string> {
        return resolved(
            typeof navigator !== "undefined"
                ? navigator.language || "en"
                : "en",
            cb,
        );
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
        _info: HighlightInfo,
        cb?: (w: chrome.windows.Window) => void,
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
        cb?: (t: chrome.tabs.Tab | chrome.tabs.Tab[]) => void,
    ): Promise<chrome.tabs.Tab | chrome.tabs.Tab[]> {
        return resolved(makeSelfTab(), cb);
    }

    function reload(
        _a?: unknown,
        _b?: unknown,
        cb?: () => void,
    ): Promise<void> {
        return resolved(undefined, cb);
    }
    function goBack(_tabId?: number, cb?: () => void): Promise<void> {
        return resolved(undefined, cb);
    }
    function goForward(_tabId?: number, cb?: () => void): Promise<void> {
        return resolved(undefined, cb);
    }

    function setZoom(
        _a: number,
        _b?: number | (() => void),
        cb?: () => void,
    ): Promise<void> {
        return resolved(undefined, cb);
    }
    function getZoom(
        _tabId?: number,
        cb?: (z: number) => void,
    ): Promise<number> {
        return resolved(1, cb);
    }
    function setZoomSettings(
        _tabId: number,
        _z: ZoomSettings,
        cb?: () => void,
    ): Promise<void> {
        return resolved(undefined, cb);
    }
    function getZoomSettings(
        _tabId?: number,
        cb?: (z: ZoomSettings) => void,
    ): Promise<ZoomSettings> {
        return resolved(
            {
                mode: "automatic",
                scope: "per-origin",
                defaultZoomFactor: 1,
            } as ZoomSettings,
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

    // chrome.tabs.group / ungroup (MV3 tab groups)
    function group(
        _options: { tabIds: number | number[]; groupId?: number },
        cb?: (groupId: number) => void,
    ): Promise<number> {
        return resolved(-1, cb);
    }
    function ungroup(
        _tabIds: number | number[],
        cb?: () => void,
    ): Promise<void> {
        return resolved(undefined, cb);
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
        group,
        ungroup,
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
