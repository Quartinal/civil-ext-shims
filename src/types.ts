export type StorageData = Record<string, unknown>;

export interface ShimOptions {
    extId: string;
    manifest: ChromeManifest;
    storageData?: StorageData;
    origin?: string;
}

export interface ChromeManifest {
    manifest_version: 2 | 3;
    name: string;
    version: string;
    description?: string;
    icons?: Record<string, string>;
    permissions?: string[];
    host_permissions?: string[];
    content_scripts?: ContentScript[];
    background?: {
        service_worker?: string;
        scripts?: string[];
        page?: string;
        persistent?: boolean;
    };
    action?: ActionDef;
    browser_action?: ActionDef;
    page_action?: ActionDef;
    options_page?: string;
    options_ui?: { page: string; open_in_tab?: boolean };
    web_accessible_resources?:
        | string[]
        | Array<{ resources: string[]; matches: string[] }>;
    content_security_policy?:
        | string
        | { extension_pages?: string; sandbox?: string };
    [key: string]: unknown;
}

export interface FirefoxManifest extends ChromeManifest {
    browser_specific_settings?: {
        gecko?: { id?: string; strict_min_version?: string };
    };
}

export interface ContentScript {
    matches?: string[];
    exclude_matches?: string[];
    css?: string[];
    js?: string[];
    run_at?: "document_start" | "document_end" | "document_idle";
    all_frames?: boolean;
    world?: "MAIN" | "ISOLATED";
}

export interface ActionDef {
    default_icon?: string | Record<string, string>;
    default_title?: string;
    default_popup?: string;
}

export interface Port {
    name: string;
    disconnect(): void;
    postMessage(message: unknown): void;
    onMessage: ChromeEvent<(message: unknown, port: Port) => void>;
    onDisconnect: ChromeEvent<(port: Port) => void>;
    sender?: MessageSender;
    error?: { message: string };
}

export interface MessageSender {
    tab?: chrome.tabs.Tab;
    frameId?: number;
    id?: string;
    url?: string;
    origin?: string;
    tlsChannelId?: string;
    documentId?: string;
    documentLifecycle?: string;
}

export interface ChromeEvent<TCallback extends (...args: never[]) => unknown> {
    addListener(callback: TCallback): void;
    removeListener(callback: TCallback): void;
    hasListener(callback: TCallback): boolean;
    hasListeners(): boolean;
}

export interface Alarm {
    name: string;
    scheduledTime: number;
    periodInMinutes?: number;
}

export interface AlarmCreateInfo {
    when?: number;
    delayInMinutes?: number;
    periodInMinutes?: number;
}

export interface DNRRule {
    id: number;
    priority?: number;
    action: { type: string; [k: string]: unknown };
    condition: { [k: string]: unknown };
}

export interface TabInfo {
    id: string;
    index: number;
    windowId: number;
    highlighted: boolean;
    active: boolean;
    pinned: boolean;
    audible?: boolean;
    discarded: boolean;
    autoDiscardable: boolean;
    mutedInfo?: { muted: boolean };
    url?: string;
    pendingUrl?: string;
    title?: string;
    favIconUrl?: string;
    status?: "loading" | "complete" | "unloaded";
    incognito: boolean;
    width?: number;
    height?: number;
    sessionId?: string;
    groupId: number;
    openerTabId?: string;
}
