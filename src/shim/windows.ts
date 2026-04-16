import { CivilEvent } from "./event";
import { resolved } from "./util";

function makeWindow(): chrome.windows.Window {
    return {
        id: 1,
        focused: true,
        alwaysOnTop: false,
        incognito: false,
        state: "normal",
        type: "normal",
        top: 0,
        left: 0,
        width: typeof window !== "undefined" ? window.outerWidth : 1280,
        height: typeof window !== "undefined" ? window.outerHeight : 800,
        tabs: [],
        sessionId: undefined,
    };
}

export function buildWindowsAPI() {
    const onFocusChanged = new CivilEvent<(windowId: number) => void>();
    const onCreated = new CivilEvent<(win: chrome.windows.Window) => void>();
    const onRemoved = new CivilEvent<(windowId: number) => void>();
    const onBoundsChanged = new CivilEvent<
        (win: chrome.windows.Window) => void
    >();

    function get(
        _windowId: number,
        queryOptionsOrCb?:
            | chrome.windows.QueryOptions
            | ((win: chrome.windows.Window) => void),
        maybeCb?: (win: chrome.windows.Window) => void,
    ) {
        const cb =
            typeof queryOptionsOrCb === "function" ? queryOptionsOrCb : maybeCb;
        return resolved(makeWindow(), cb);
    }

    function getCurrent(
        queryOptionsOrCb?:
            | chrome.windows.QueryOptions
            | ((win: chrome.windows.Window) => void),
        maybeCb?: (win: chrome.windows.Window) => void,
    ) {
        const cb =
            typeof queryOptionsOrCb === "function" ? queryOptionsOrCb : maybeCb;
        return resolved(makeWindow(), cb);
    }

    function getLastFocused(
        queryOptionsOrCb?:
            | chrome.windows.QueryOptions
            | ((win: chrome.windows.Window) => void),
        maybeCb?: (win: chrome.windows.Window) => void,
    ) {
        const cb =
            typeof queryOptionsOrCb === "function" ? queryOptionsOrCb : maybeCb;
        return resolved(makeWindow(), cb);
    }

    function getAll(
        queryOptionsOrCb?:
            | chrome.windows.QueryOptions
            | ((wins: chrome.windows.Window[]) => void),
        maybeCb?: (wins: chrome.windows.Window[]) => void,
    ) {
        const cb =
            typeof queryOptionsOrCb === "function" ? queryOptionsOrCb : maybeCb;
        return resolved([makeWindow()], cb);
    }

    function create(
        createData?: chrome.windows.CreateData,
        cb?: (win?: chrome.windows.Window) => void,
    ) {
        if (createData?.url && typeof document !== "undefined") {
            const url = Array.isArray(createData.url)
                ? createData.url[0]
                : createData.url;
            document.dispatchEvent(
                new CustomEvent("browser:newtab", { detail: { url } }),
            );
        }
        return resolved(makeWindow(), cb);
    }

    function update(
        _windowId: number,
        _updateInfo: chrome.windows.UpdateInfo,
        cb?: (win: chrome.windows.Window) => void,
    ) {
        return resolved(makeWindow(), cb);
    }

    function remove(_windowId: number, cb?: () => void) {
        return resolved(undefined, cb);
    }

    return {
        get,
        getCurrent,
        getLastFocused,
        getAll,
        create,
        update,
        remove,
        onFocusChanged,
        onCreated,
        onRemoved,
        onBoundsChanged,
        WINDOW_ID_NONE: -1,
        WINDOW_ID_CURRENT: -2,
    };
}
