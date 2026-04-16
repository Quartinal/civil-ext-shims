import { CivilEvent, makeNoopEvent } from "./event";
import { dispatchBrowserEvent, getBiB, resolved } from "./util";

const noopEvent = () => makeNoopEvent<(...a: never[]) => void>();

function makeSetting() {
    const onChange = noopEvent();
    return {
        get: (
            _d: unknown,
            cb?: (d: { value: unknown; levelOfControl: string }) => void,
        ) => resolved({ value: false, levelOfControl: "not_controllable" }, cb),
        set: (_d: unknown, cb?: () => void) => resolved(undefined, cb),
        clear: (_d: unknown, cb?: () => void) => resolved(undefined, cb),
        onChange,
    };
}

export const accessibilityFeatures = {
    animationPolicy: makeSetting(),
    autoclick: makeSetting(),
    caretHighlight: makeSetting(),
    caretBrowsing: makeSetting(),
    cursorColor: makeSetting(),
    cursorHighlight: makeSetting(),
    dictation: makeSetting(),
    dockedMagnifier: makeSetting(),
    focusHighlight: makeSetting(),
    fullscreenMagnifier: makeSetting(),
    highContrast: makeSetting(),
    largeCursor: makeSetting(),
    screenMagnifier: makeSetting(),
    selectToSpeak: makeSetting(),
    spokenFeedback: makeSetting(),
    stickyKeys: makeSetting(),
    switchAccess: makeSetting(),
    virtualKeyboard: makeSetting(),
};

export const audio = {
    getDevices: (_filter?: unknown, cb?: (devices: unknown[]) => void) =>
        resolved([], cb),
    setActiveDevices: (
        _ids: { input?: string[]; output?: string[] },
        cb?: () => void,
    ) => resolved(undefined, cb),
    setProperties: (_id: string, _props: unknown, cb?: () => void) =>
        resolved(undefined, cb),
    getInfo: (cb?: (info: unknown) => void) => resolved({}, cb),
    onDeviceAdded: noopEvent(),
    onDeviceRemoved: noopEvent(),
    onDeviceListChanged: noopEvent(),
    onLevelChanged: noopEvent(),
    onMuteChanged: noopEvent(),
};

function makeContentSetting() {
    return {
        get: (_d: unknown, cb?: (d: { setting: string }) => void) =>
            resolved({ setting: "allow" }, cb),
        set: (_d: unknown, cb?: () => void) => resolved(undefined, cb),
        clear: (_d: unknown, cb?: () => void) => resolved(undefined, cb),
        getResourceIdentifiers: (cb?: (ids: unknown[]) => void) =>
            resolved([], cb),
    };
}

export const contentSettings = {
    automaticDownloads: makeContentSetting(),
    autoVerify: makeContentSetting(),
    camera: makeContentSetting(),
    clipboard: makeContentSetting(),
    cookies: makeContentSetting(),
    fullscreen: makeContentSetting(),
    geolocation: makeContentSetting(),
    images: makeContentSetting(),
    javascript: makeContentSetting(),
    localStorage: makeContentSetting(),
    microphone: makeContentSetting(),
    midi: makeContentSetting(),
    mouselock: makeContentSetting(),
    notifications: makeContentSetting(),
    plugins: makeContentSetting(),
    popups: makeContentSetting(),
    ppapiBroker: makeContentSetting(),
    sensors: makeContentSetting(),
    unsandboxedPlugins: makeContentSetting(),
};

export const declarativeContent = {
    onPageChanged: {
        addRules: (_rules: unknown[], cb?: () => void) => {
            if (cb) cb();
            return Promise.resolve([]);
        },
        removeRules: (_ids?: string[], cb?: () => void) => {
            if (cb) cb();
        },
        getRules: (_ids?: string[], cb?: (rules: unknown[]) => void) =>
            resolved([], cb),
        addListener: () => {},
        removeListener: () => {},
        hasListener: () => false,
        hasListeners: () => false,
    },
    PageStateMatcher: class {},
    ShowAction: class {},
    ShowPageAction: class {},
    RequestContentScript: class {},
    SetIcon: class {},
};

export const declarativeWebRequest = {
    onRequest: {
        addRules: (_rules: unknown[], cb?: () => void) => {
            if (cb) cb();
            return Promise.resolve([]);
        },
        removeRules: (_ids?: string[], cb?: () => void) => {
            if (cb) cb();
        },
        getRules: (_ids?: string[], cb?: (r: unknown[]) => void) =>
            resolved([], cb),
        addListener: () => {},
        removeListener: () => {},
        hasListener: () => false,
        hasListeners: () => false,
    },
};

export const desktopCapture = {
    chooseDesktopMedia: (
        _sources: string[],
        _tabOrCb?: unknown,
        cb?: (streamId: string, opts?: unknown) => void,
    ) => {
        const callback =
            typeof _tabOrCb === "function" ? (_tabOrCb as typeof cb) : cb;
        if (callback) callback("", {});
        return 0;
    },
    cancelChooseDesktopMedia: (_id: number) => {},
};

export const devtools = {
    inspectedWindow: {
        eval: (
            _expr: string,
            _opts?: unknown,
            cb?: (result: unknown, exceptionInfo?: unknown) => void,
        ) => {
            if (cb)
                cb(undefined, {
                    isError: true,
                    description:
                        "devtools.inspectedWindow not available in shim",
                });
        },
        reload: (_opts?: unknown) => {},
        getResources: (cb?: (resources: unknown[]) => void) => {
            if (cb) cb([]);
        },
        tabId: -1,
        onResourceAdded: noopEvent(),
        onResourceContentCommitted: noopEvent(),
    },
    network: {
        getHAR: (cb?: (harLog: unknown) => void) => {
            if (cb) cb({ entries: [] });
        },
        onRequestFinished: noopEvent(),
        onNavigated: noopEvent(),
    },
    panels: {
        create: (
            _title: string,
            _iconPath: string,
            _pagePath: string,
            cb?: (panel: unknown) => void,
        ) => {
            if (cb) cb({});
        },
        setOpenResourceHandler: (_cb?: unknown) => {},
        openResource: (
            _url: string,
            _lineNumber: number,
            _cb?: () => void,
        ) => {},
        elements: {
            createSidebarPane: (
                _title: string,
                cb?: (sidebar: unknown) => void,
            ) => {
                if (cb) cb({});
            },
            onSelectionChanged: noopEvent(),
        },
        sources: {
            onSelectionChanged: noopEvent(),
        },
        themeName: "default",
    },
    recorder: {
        createView: (_title: string, _pagePath: string) => ({}),
        onRecordingStarted: noopEvent(),
        onRecordingStopped: noopEvent(),
    },
    performance: {
        onProfilingStarted: noopEvent(),
        onProfilingStopped: noopEvent(),
    },
};

export const dom = {
    openOrClosedShadowRoot: (el: Element): ShadowRoot | null => {
        return (
            (el as unknown as { shadowRoot: ShadowRoot | null }).shadowRoot ??
            null
        );
    },
};

export const enterprise = {
    deviceAttributes: {
        getDeviceSerialNumber: (cb?: (sn: string) => void) => resolved("", cb),
        getDeviceAssetId: (cb?: (id: string) => void) => resolved("", cb),
        getDeviceAnnotatedLocation: (cb?: (loc: string) => void) =>
            resolved("", cb),
        getDeviceHostname: (cb?: (h: string) => void) => resolved("", cb),
        getDirectoryDeviceId: (cb?: (id: string) => void) => resolved("", cb),
    },
    networkingAttributes: {
        getNetworkDetails: (cb?: (details: unknown) => void) =>
            resolved({}, cb),
    },
    platformKeys: {
        getToken: (_details: unknown, cb?: (token: unknown) => void) =>
            resolved({}, cb),
        getCertificates: (_details: unknown, cb?: (certs: unknown[]) => void) =>
            resolved([], cb),
        importCertificate: (_details: unknown, cb?: () => void) =>
            resolved(undefined, cb),
        removeCertificate: (_details: unknown, cb?: () => void) =>
            resolved(undefined, cb),
        verifyTLSServerCertificate: (
            _details: unknown,
            cb?: (r: unknown) => void,
        ) => resolved({}, cb),
    },
    reportingPrivate: {
        submitReport: (_req: unknown, cb?: () => void) =>
            resolved(undefined, cb),
        getDeviceInfo: (cb?: (info: unknown) => void) => resolved({}, cb),
    },
};

export const extensionTypes = {
    ImageFormat: { JPEG: "jpeg", PNG: "png" },
    ImageDetails: {},
    RunAt: {
        DOCUMENT_START: "document_start",
        DOCUMENT_END: "document_end",
        DOCUMENT_IDLE: "document_idle",
    },
    CSSOrigin: { AUTHOR: "author", USER: "user" },
    ExecutionWorld: { ISOLATED: "ISOLATED", MAIN: "MAIN" },
    FrameType: {
        OUTERMOST_FRAME: "outermost_frame",
        FENCED_FRAME: "fenced_frame",
        SUB_FRAME: "sub_frame",
    },
    DocumentLifecycle: {
        PRERENDER: "prerender",
        ACTIVE: "active",
        CACHED: "cached",
        PENDING_DELETION: "pending_deletion",
    },
};

export const fontSettings = {
    setDefaultFontSize: (_d: unknown, cb?: () => void) =>
        resolved(undefined, cb),
    getFont: (_d: unknown, cb?: (d: unknown) => void) =>
        resolved({ fontId: "", levelOfControl: "not_controllable" }, cb),
    setFont: (_d: unknown, cb?: () => void) => resolved(undefined, cb),
    clearFont: (_d: unknown, cb?: () => void) => resolved(undefined, cb),
    getFontList: (cb?: (list: unknown[]) => void) => resolved([], cb),
    clearDefaultFontSize: (_d: unknown, cb?: () => void) =>
        resolved(undefined, cb),
    getDefaultFontSize: (_d: unknown, cb?: (d: unknown) => void) =>
        resolved({ pixelSize: 16, levelOfControl: "not_controllable" }, cb),
    getMinimumFontSize: (_d: unknown, cb?: (d: unknown) => void) =>
        resolved({ pixelSize: 6, levelOfControl: "not_controllable" }, cb),
    setMinimumFontSize: (_d: unknown, cb?: () => void) =>
        resolved(undefined, cb),
    clearMinimumFontSize: (_d: unknown, cb?: () => void) =>
        resolved(undefined, cb),
    getDefaultFixedFontSize: (_d: unknown, cb?: (d: unknown) => void) =>
        resolved({ pixelSize: 13, levelOfControl: "not_controllable" }, cb),
    setDefaultFixedFontSize: (_d: unknown, cb?: () => void) =>
        resolved(undefined, cb),
    clearDefaultFixedFontSize: (_d: unknown, cb?: () => void) =>
        resolved(undefined, cb),
    onDefaultFixedFontSizeChanged: noopEvent(),
    onDefaultFontSizeChanged: noopEvent(),
    onFontChanged: noopEvent(),
    onMinimumFontSizeChanged: noopEvent(),
};

export const gcm = {
    MAX_MESSAGE_SIZE: 4096,
    register: (_senderIds: string[], cb?: (registrationId: string) => void) =>
        resolved("", cb),
    unregister: (cb?: () => void) => resolved(undefined, cb),
    send: (_message: unknown, cb?: (messageId: string) => void) =>
        resolved("", cb),
    onMessage: new CivilEvent<
        (message: {
            data: Record<string, string>;
            from?: string;
            collapseKey?: string;
        }) => void
    >(),
    onMessagesDeleted: new CivilEvent<() => void>(),
    onSendError: new CivilEvent<
        (error: {
            errorMessage: string;
            messageId?: string;
            details: Record<string, string>;
        }) => void
    >(),
};

let _idleState: "active" | "idle" | "locked" = "active";
let _idleInterval = 60;

export const idle = {
    queryState: (
        _detectionIntervalInSeconds: number,
        cb?: (state: "active" | "idle" | "locked") => void,
    ) => resolved(_idleState, cb),
    setDetectionInterval: (intervalInSeconds: number) => {
        _idleInterval = intervalInSeconds;
    },
    getAutoLockDelay: (cb?: (delay: number) => void) => resolved(0, cb),
    onStateChanged: new CivilEvent<
        (newState: "active" | "idle" | "locked") => void
    >(),

    _setState: (state: "active" | "idle" | "locked") => {
        _idleState = state;
    },
};

export const input = {
    ime: {
        setComposition: (_params: unknown, cb?: (success: boolean) => void) =>
            resolved(false, cb),
        clearComposition: (_params: unknown, cb?: (success: boolean) => void) =>
            resolved(false, cb),
        commitText: (_params: unknown, cb?: (success: boolean) => void) =>
            resolved(false, cb),
        sendKeyEvents: (_params: unknown, cb?: () => void) =>
            resolved(undefined, cb),
        hideInputView: () => {},
        setCandidateWindowProperties: (
            _params: unknown,
            cb?: (success: boolean) => void,
        ) => resolved(false, cb),
        setCandidates: (_params: unknown, cb?: (success: boolean) => void) =>
            resolved(false, cb),
        setCursorPosition: (
            _params: unknown,
            cb?: (success: boolean) => void,
        ) => resolved(false, cb),
        setMenuItems: (_params: unknown, cb?: () => void) =>
            resolved(undefined, cb),
        updateMenuItems: (_params: unknown, cb?: () => void) =>
            resolved(undefined, cb),
        deleteSurroundingText: (_params: unknown, cb?: () => void) =>
            resolved(undefined, cb),
        keyEventHandled: (_requestId: string, _response: boolean) => {},
        createWindow: (_options: unknown, cb?: (win: unknown) => void) =>
            resolved({}, cb),
        showWindow: (_windowId: number, cb?: () => void) =>
            resolved(undefined, cb),
        hideWindow: (_windowId: number, cb?: () => void) =>
            resolved(undefined, cb),
        setNativeMode: (_d: unknown, cb?: (success: boolean) => void) =>
            resolved(false, cb),
        onActivate: noopEvent(),
        onDeactivated: noopEvent(),
        onFocus: noopEvent(),
        onBlur: noopEvent(),
        onInputContextUpdate: noopEvent(),
        onKeyEvent: noopEvent(),
        onCandidateClicked: noopEvent(),
        onMenuItemActivated: noopEvent(),
        onSurroundingTextChanged: noopEvent(),
        onReset: noopEvent(),
        onAssistiveWindowButtonClicked: noopEvent(),
    },
};

export const instanceID = {
    getID: (cb?: (id: string) => void) => resolved("shim-instance-id", cb),
    getCreationTime: (cb?: (t: number) => void) => resolved(0, cb),
    getToken: (_getsParams: unknown, cb?: (token: string) => void) =>
        resolved("", cb),
    deleteToken: (_deleteParams: unknown, cb?: () => void) =>
        resolved(undefined, cb),
    deleteID: (cb?: () => void) => resolved(undefined, cb),
    onTokenRefresh: new CivilEvent<() => void>(),
};

export const loginState = {
    getProfileType: (cb?: (type: "SIGNIN_PROFILE" | "USER_PROFILE") => void) =>
        resolved("USER_PROFILE" as const, cb),
    getSessionState: (cb?: (state: string) => void) => resolved("ACTIVE", cb),
    onSessionStateChanged: noopEvent(),
};

export const networking = {
    config: {
        setNetworkFilter: (_networks: unknown[], cb?: () => void) =>
            resolved(undefined, cb),
        finishAuthentication: (
            _guid: string,
            _result: string,
            cb?: () => void,
        ) => resolved(undefined, cb),
        onCaptivePortalDetected: noopEvent(),
    },
};

export const omnibox = {
    setDefaultSuggestion: (_suggestion: { description: string }) => {},
    onInputStarted: new CivilEvent<() => void>(),
    onInputChanged: new CivilEvent<
        (text: string, suggest: (suggestions: unknown[]) => void) => void
    >(),
    onInputEntered: new CivilEvent<
        (text: string, disposition: string) => void
    >(),
    onInputCancelled: new CivilEvent<() => void>(),
    onDeleteSuggestion: new CivilEvent<(text: string) => void>(),
};

export const pageCapture = {
    saveAsMHTML: (
        _details: { tabId: number },
        cb?: (data?: ArrayBuffer) => void,
    ) => {
        if (cb) cb(undefined);
        return Promise.resolve(undefined as ArrayBuffer | undefined);
    },
};

export const platformKeys = {
    selectClientCertificates: (
        _details: unknown,
        cb?: (matches: unknown[]) => void,
    ) => resolved([], cb),
    getKeyPair: (
        _cert: ArrayBuffer,
        _params: unknown,
        cb?: (pub: CryptoKey | null, priv: CryptoKey | null) => void,
    ) => {
        if (cb) cb(null, null);
        return Promise.resolve({ publicKey: null, privateKey: null });
    },
    getKeyPairBySpki: (
        _spki: ArrayBuffer,
        _params: unknown,
        cb?: (pub: CryptoKey | null, priv: CryptoKey | null) => void,
    ) => {
        if (cb) cb(null, null);
        return Promise.resolve({ publicKey: null, privateKey: null });
    },
    subtleCrypto: () => (typeof crypto !== "undefined" ? crypto.subtle : null),
    verifyTLSServerCertificate: (
        _details: unknown,
        cb?: (r: { trusted: boolean }) => void,
    ) => resolved({ trusted: false }, cb),
};

export const power = {
    requestKeepAwake: (_level: "system" | "display") => {},
    releaseKeepAwake: () => {},
    reportActivity: (cb?: () => void) => resolved(undefined, cb),
};

export const printerProvider = {
    onGetPrintersRequested: noopEvent(),
    onGetUsbPrinterInfoRequested: noopEvent(),
    onGetCapabilityRequested: noopEvent(),
    onPrintRequested: noopEvent(),
};

export const printing = {
    submitJob: (_request: unknown, cb?: (response: unknown) => void) =>
        resolved({ status: "OK" }, cb),
    cancelJob: (_jobId: string, cb?: () => void) => resolved(undefined, cb),
    getPrinters: (cb?: (printers: unknown[]) => void) => resolved([], cb),
    getPrinterInfo: (_printerId: string, cb?: (info: unknown) => void) =>
        resolved({}, cb),
    onJobStatusChanged: noopEvent(),
    MAX_SUBMIT_JOB_CALLS_PER_MINUTE: 40,
    MAX_GET_PRINTER_INFO_CALLS_PER_MINUTE: 20,
};

export const printingMetrics = {
    getPrintJobs: (cb?: (jobs: unknown[]) => void) => resolved([], cb),
    onPrintJobFinished: noopEvent(),
};

export const readingList = {
    addEntry: (_entry: unknown, cb?: () => void) => resolved(undefined, cb),
    removeEntry: (_info: unknown, cb?: () => void) => resolved(undefined, cb),
    updateEntry: (_info: unknown, cb?: () => void) => resolved(undefined, cb),
    query: (_info: unknown, cb?: (entries: unknown[]) => void) =>
        resolved([], cb),
    onEntryAdded: noopEvent(),
    onEntryRemoved: noopEvent(),
    onEntryUpdated: noopEvent(),
};

export const search = {
    query: (
        queryInfo: { text: string; disposition?: string; tabId?: number },
        cb?: () => void,
    ) => {
        const bib = getBiB();
        dispatchBrowserEvent(bib.newTabEvent, {
            url: `https://www.google.com/search?q=${encodeURIComponent(queryInfo.text)}`,
        });
        return resolved(undefined, cb);
    },
};

export const serial = {
    getDevices: (cb?: (ports: unknown[]) => void) => resolved([], cb),
    connect: (
        _path: string,
        _options?: unknown,
        cb?: (info: unknown) => void,
    ) => resolved({}, cb),
    update: (_id: number, _options: unknown, cb?: (result: boolean) => void) =>
        resolved(false, cb),
    disconnect: (_id: number, cb?: (result: boolean) => void) =>
        resolved(false, cb),
    setPaused: (_id: number, _paused: boolean, cb?: () => void) =>
        resolved(undefined, cb),
    getInfo: (_id: number, cb?: (info: unknown) => void) => resolved({}, cb),
    getConnections: (cb?: (infos: unknown[]) => void) => resolved([], cb),
    send: (_id: number, _data: ArrayBuffer, cb?: (info: unknown) => void) =>
        resolved({}, cb),
    flush: (_id: number, cb?: (result: boolean) => void) => resolved(false, cb),
    getControlSignals: (_id: number, cb?: (sigs: unknown) => void) =>
        resolved({}, cb),
    setControlSignals: (
        _id: number,
        _sigs: unknown,
        cb?: (result: boolean) => void,
    ) => resolved(false, cb),
    setBreak: (_id: number, cb?: (result: boolean) => void) =>
        resolved(false, cb),
    clearBreak: (_id: number, cb?: (result: boolean) => void) =>
        resolved(false, cb),
    onReceive: noopEvent(),
    onReceiveError: noopEvent(),
};

export const sessions = {
    MAX_SESSION_RESULTS: 25,
    getRecentlyClosed: (
        _filter?: unknown,
        cb?: (sessions: unknown[]) => void,
    ) => resolved([], cb),
    getDevices: (_filter?: unknown, cb?: (devices: unknown[]) => void) =>
        resolved([], cb),
    restore: (_sessionId?: string, cb?: (session: unknown) => void) =>
        resolved({}, cb),
    onChanged: new CivilEvent<() => void>(),
};

export const socket = {
    create: (_type: string, _options?: unknown, cb?: (info: unknown) => void) =>
        resolved({ socketId: 0 }, cb),
    destroy: (_socketId: number) => {},
    connect: (
        _socketId: number,
        _hostname: string,
        _port: number,
        cb?: (result: number) => void,
    ) => resolved(-1, cb),
    bind: (
        _socketId: number,
        _address: string,
        _port: number,
        cb?: (result: number) => void,
    ) => resolved(-1, cb),
    disconnect: (_socketId: number) => {},
    read: (
        _socketId: number,
        _bufSize?: number,
        cb?: (info: unknown) => void,
    ) => resolved({}, cb),
    write: (
        _socketId: number,
        _data: ArrayBuffer,
        cb?: (info: unknown) => void,
    ) => resolved({}, cb),
    recvFrom: (
        _socketId: number,
        _bufSize?: number,
        cb?: (info: unknown) => void,
    ) => resolved({}, cb),
    sendTo: (
        _socketId: number,
        _data: ArrayBuffer,
        _address: string,
        _port: number,
        cb?: (info: unknown) => void,
    ) => resolved({}, cb),
    listen: (
        _socketId: number,
        _address: string,
        _port: number,
        _backlog?: number,
        cb?: (result: number) => void,
    ) => resolved(-1, cb),
    accept: (_socketId: number, cb?: (info: unknown) => void) =>
        resolved({}, cb),
    setKeepAlive: (
        _socketId: number,
        _enable: boolean,
        _delay?: number,
        cb?: (result: boolean) => void,
    ) => resolved(false, cb),
    setNoDelay: (
        _socketId: number,
        _noDelay: boolean,
        cb?: (result: boolean) => void,
    ) => resolved(false, cb),
    getInfo: (_socketId: number, cb?: (info: unknown) => void) =>
        resolved({}, cb),
    getNetworkList: (cb?: (list: unknown[]) => void) => resolved([], cb),
    joinGroup: (
        _socketId: number,
        _address: string,
        cb?: (result: number) => void,
    ) => resolved(-1, cb),
    leaveGroup: (
        _socketId: number,
        _address: string,
        cb?: (result: number) => void,
    ) => resolved(-1, cb),
    setMulticastTimeToLive: (
        _socketId: number,
        _ttl: number,
        cb?: (result: number) => void,
    ) => resolved(-1, cb),
    setMulticastLoopbackMode: (
        _socketId: number,
        _enabled: boolean,
        cb?: (result: number) => void,
    ) => resolved(-1, cb),
    getJoinedGroups: (_socketId: number, cb?: (groups: string[]) => void) =>
        resolved([], cb),
    secure: (
        _socketId: number,
        _options?: unknown,
        cb?: (result: number) => void,
    ) => resolved(-1, cb),
};

export const systemLog = {
    add: (_message: { message: string }, cb?: () => void) =>
        resolved(undefined, cb),
};

export const tabCapture = {
    capture: (_options: unknown, cb?: (stream: MediaStream | null) => void) => {
        if (cb) cb(null);
        return Promise.resolve(null as MediaStream | null);
    },
    captureOffscreenTab: (
        _startUrl: string,
        _options: unknown,
        cb?: (stream: MediaStream | null) => void,
    ) => {
        if (cb) cb(null);
        return Promise.resolve(null as MediaStream | null);
    },
    getCapturedTabs: (cb?: (result: unknown[]) => void) => resolved([], cb),
    getMediaStreamId: (_options?: unknown, cb?: (id: string) => void) =>
        resolved("", cb),
    onStatusChanged: noopEvent(),
};

export const tabGroups = {
    TAB_GROUP_ID_NONE: -1,
    get: (_groupId: number, cb?: (group: unknown) => void) => resolved({}, cb),
    query: (_queryInfo: unknown, cb?: (groups: unknown[]) => void) =>
        resolved([], cb),
    update: (
        _groupId: number,
        _props: unknown,
        cb?: (group: unknown) => void,
    ) => resolved({}, cb),
    move: (_groupId: number, _props: unknown, cb?: (group: unknown) => void) =>
        resolved({}, cb),
    onCreated: noopEvent(),
    onRemoved: noopEvent(),
    onUpdated: noopEvent(),
    onMoved: noopEvent(),
    Color: {
        GREY: "grey",
        BLUE: "blue",
        RED: "red",
        YELLOW: "yellow",
        GREEN: "green",
        PINK: "pink",
        PURPLE: "purple",
        CYAN: "cyan",
        ORANGE: "orange",
    },
};

export const topSites = {
    get: (cb?: (data: Array<{ title: string; url: string }>) => void) =>
        resolved([], cb),
};

export const tts = {
    speak: (utterance: string, _options?: unknown, cb?: () => void) => {
        try {
            if (typeof speechSynthesis !== "undefined") {
                const u = new SpeechSynthesisUtterance(utterance);
                speechSynthesis.speak(u);
            }
        } catch {}
        return resolved(undefined, cb);
    },
    stop: () => {
        try {
            speechSynthesis.cancel();
        } catch {}
    },
    pause: () => {
        try {
            speechSynthesis.pause();
        } catch {}
    },
    resume: () => {
        try {
            speechSynthesis.resume();
        } catch {}
    },
    isSpeaking: (cb?: (speaking: boolean) => void) => {
        const speaking =
            typeof speechSynthesis !== "undefined"
                ? speechSynthesis.speaking
                : false;
        return resolved(speaking, cb);
    },
    getVoices: (cb?: (voices: unknown[]) => void) => {
        const voices =
            typeof speechSynthesis !== "undefined"
                ? speechSynthesis.getVoices().map(v => ({
                      voiceName: v.name,
                      lang: v.lang,
                      remote: false,
                      extensionId: "",
                  }))
                : [];
        return resolved(voices, cb);
    },
    onEvent: new CivilEvent<(event: unknown) => void>(),
    onVoicesChanged: new CivilEvent<() => void>(),
};

export const ttsEngine = {
    sendTtsEvent: (_requestId: number, _event: unknown) => {},
    sendTtsAudio: (_requestId: number, _audio: unknown) => {},
    updateVoices: (_voices: unknown[]) => {},
    onSpeak: noopEvent(),
    onSpeakWithAudioStream: noopEvent(),
    onStop: noopEvent(),
    onPause: noopEvent(),
    onResume: noopEvent(),
};

export const userScripts = {
    register: (_scripts: unknown[], cb?: () => void) => resolved(undefined, cb),
    unregister: (_filter?: unknown, cb?: () => void) => resolved(undefined, cb),
    update: (_scripts: unknown[], cb?: () => void) => resolved(undefined, cb),
    getScripts: (_filter?: unknown, cb?: (scripts: unknown[]) => void) =>
        resolved([], cb),
    configureWorld: (_properties: unknown, cb?: () => void) =>
        resolved(undefined, cb),
    getWorldConfigurations: (cb?: (configs: unknown[]) => void) =>
        resolved([], cb),
    resetWorldConfiguration: (_worldId?: string, cb?: () => void) =>
        resolved(undefined, cb),
};

export const vpnProvider = {
    createConfig: (_name: string, cb?: (id: string) => void) =>
        resolved("", cb),
    destroyConfig: (_id: string, cb?: () => void) => resolved(undefined, cb),
    setParameters: (_id: string, _params: unknown, cb?: () => void) =>
        resolved(undefined, cb),
    sendPacket: (_data: ArrayBuffer, cb?: () => void) =>
        resolved(undefined, cb),
    notifyConnectionStateChanged: (_state: string, cb?: () => void) =>
        resolved(undefined, cb),
    onPlatformMessage: noopEvent(),
    onPacketReceived: noopEvent(),
    onConfigRemoved: noopEvent(),
    onConfigCreated: noopEvent(),
    onUIEvent: noopEvent(),
};

export const wallpaper = {
    setWallpaper: (
        _details: unknown,
        cb?: (thumbnail?: ArrayBuffer) => void,
    ) => {
        if (cb) cb(undefined);
        return Promise.resolve(undefined as ArrayBuffer | undefined);
    },
};

export const webAuthenticationProxy = {
    requestFilter: {
        addRules: (_rules: unknown[], cb?: () => void) => {
            if (cb) cb();
        },
        removeRules: (_ids?: string[], cb?: () => void) => {
            if (cb) cb();
        },
        getRules: (_ids?: string[], cb?: (r: unknown[]) => void) =>
            resolved([], cb),
    },
    attach: (cb?: () => void) => resolved(undefined, cb),
    detach: (cb?: () => void) => resolved(undefined, cb),
    completeCreateRequest: (_details: unknown, cb?: () => void) =>
        resolved(undefined, cb),
    completeGetRequest: (_details: unknown, cb?: () => void) =>
        resolved(undefined, cb),
    completeIsUvpaaRequest: (_details: unknown, cb?: () => void) =>
        resolved(undefined, cb),
    onCreateRequest: noopEvent(),
    onGetRequest: noopEvent(),
    onIsUvpaaRequest: noopEvent(),
    onRemoteSessionStateChange: noopEvent(),
    onRequestCanceled: noopEvent(),
};

export const fileBrowserHandler = {
    selectFile: (_selectionParams: unknown, cb?: (result: unknown) => void) =>
        resolved({}, cb),
    onExecute: noopEvent(),
};

export const fileSystemProvider = {
    mount: (_options: unknown, cb?: () => void) => resolved(undefined, cb),
    unmount: (_options: unknown, cb?: () => void) => resolved(undefined, cb),
    getAll: (cb?: (fileSystems: unknown[]) => void) => resolved([], cb),
    get: (_fileSystemId: string, cb?: (fileSystem: unknown) => void) =>
        resolved({}, cb),
    notify: (_options: unknown, cb?: () => void) => resolved(undefined, cb),
    onUnmountRequested: noopEvent(),
    onGetMetadataRequested: noopEvent(),
    onGetActionsRequested: noopEvent(),
    onReadDirectoryRequested: noopEvent(),
    onOpenFileRequested: noopEvent(),
    onCloseFileRequested: noopEvent(),
    onReadFileRequested: noopEvent(),
    onCreateDirectoryRequested: noopEvent(),
    onDeleteEntryRequested: noopEvent(),
    onCreateFileRequested: noopEvent(),
    onCopyEntryRequested: noopEvent(),
    onMoveEntryRequested: noopEvent(),
    onTruncateEntryRequested: noopEvent(),
    onWriteFileRequested: noopEvent(),
    onAbortRequested: noopEvent(),
    onConfigureRequested: noopEvent(),
    onMountRequested: noopEvent(),
    onAddWatcherRequested: noopEvent(),
    onRemoveWatcherRequested: noopEvent(),
    onExecuteActionRequested: noopEvent(),
};

export const certificateProvider = {
    setCertificates: (_details: unknown, cb?: () => void) =>
        resolved(undefined, cb),
    requestPin: (_details: unknown, cb?: (response: unknown) => void) =>
        resolved({}, cb),
    stopPinRequest: (_details: unknown, cb?: () => void) =>
        resolved(undefined, cb),
    reportSignature: (_details: unknown, cb?: () => void) =>
        resolved(undefined, cb),
    onCertificatesUpdateRequested: noopEvent(),
    onSignatureRequested: noopEvent(),

    onCertificatesRequested: noopEvent(),
    onSignDigestRequested: noopEvent(),
};
