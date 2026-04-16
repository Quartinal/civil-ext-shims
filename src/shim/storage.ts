import type { StorageData } from "../types";
import { CivilEvent } from "./event";
import { clone, dual } from "./util";

type StorageChanges = Record<
    string,
    { oldValue?: unknown; newValue?: unknown }
>;
type StorageArea = "local" | "sync" | "session" | "managed";

class StorageNamespace {
    private _data: StorageData;

    private readonly _globalOnChanged: CivilEvent<
        (changes: StorageChanges, areaName: StorageArea) => void
    >;
    private readonly _areaName: StorageArea;

    constructor(
        initial: StorageData,
        areaName: StorageArea,
        globalOnChanged: CivilEvent<
            (changes: StorageChanges, areaName: StorageArea) => void
        >,
    ) {
        this._data = clone(initial);
        this._areaName = areaName;
        this._globalOnChanged = globalOnChanged;
    }

    get(
        keys?: string | string[] | Record<string, unknown> | null,
        cb?: (result: StorageData) => void,
    ): Promise<StorageData> {
        return dual(() => {
            const result: StorageData = {};
            if (keys == null) {
                Object.assign(result, clone(this._data));
            } else if (typeof keys === "string") {
                result[keys] = clone(this._data[keys]);
            } else if (Array.isArray(keys)) {
                for (const k of keys) result[k] = clone(this._data[k]);
            } else {
                for (const [k, defaultVal] of Object.entries(keys)) {
                    result[k] =
                        k in this._data ? clone(this._data[k]) : defaultVal;
                }
            }
            return Promise.resolve(result);
        }, cb);
    }

    set(items: StorageData, cb?: (() => void) | null): Promise<void> {
        return dual(() => {
            const changes: StorageChanges = {};
            for (const [k, newVal] of Object.entries(items)) {
                const oldValue =
                    k in this._data ? clone(this._data[k]) : undefined;
                this._data[k] = newVal;
                changes[k] = { oldValue, newValue: clone(newVal) };
            }
            this._globalOnChanged.dispatch(changes, this._areaName);
            this._persistLocal();
            return Promise.resolve();
        }, cb ?? undefined);
    }

    remove(keys: string | string[], cb?: (() => void) | null): Promise<void> {
        return dual(() => {
            const ks = Array.isArray(keys) ? keys : [keys];
            const changes: StorageChanges = {};
            for (const k of ks) {
                if (k in this._data) {
                    changes[k] = {
                        oldValue: clone(this._data[k]),
                        newValue: undefined,
                    };
                    delete this._data[k];
                }
            }
            this._globalOnChanged.dispatch(changes, this._areaName);
            this._persistLocal();
            return Promise.resolve();
        }, cb ?? undefined);
    }

    clear(cb?: (() => void) | null): Promise<void> {
        return dual(() => {
            const changes: StorageChanges = {};
            for (const k of Object.keys(this._data)) {
                changes[k] = {
                    oldValue: clone(this._data[k]),
                    newValue: undefined,
                };
            }
            this._data = {};
            this._globalOnChanged.dispatch(changes, this._areaName);
            this._persistLocal();
            return Promise.resolve();
        }, cb ?? undefined);
    }

    getBytesInUse(
        keys?: string | string[] | null,
        cb?: (bytes: number) => void,
    ): Promise<number> {
        return dual(() => {
            let bytes = 0;
            const src =
                keys == null
                    ? this._data
                    : (Array.isArray(keys) ? keys : [keys]).reduce<StorageData>(
                          (acc, k) => {
                              if (k in this._data) acc[k] = this._data[k];
                              return acc;
                          },
                          {},
                      );
            try {
                bytes = new TextEncoder().encode(JSON.stringify(src)).length;
            } catch {}
            return Promise.resolve(bytes);
        }, cb);
    }

    private _persistLocal(): void {
        if (this._areaName !== "local") return;
        try {
            localStorage.setItem(
                "civil-ext-storage",
                JSON.stringify(this._data),
            );
        } catch {}
    }

    _seed(data: StorageData): void {
        this._data = clone(data);
    }

    _snapshot(): StorageData {
        return clone(this._data);
    }
}

export function buildStorageAPI(initialData: StorageData) {
    const onChanged = new CivilEvent<
        (changes: StorageChanges, areaName: StorageArea) => void
    >();

    const local = new StorageNamespace(initialData, "local", onChanged);
    const sync = new StorageNamespace(initialData, "sync", onChanged);
    const session = new StorageNamespace({}, "session", onChanged);
    const managed = new StorageNamespace({}, "managed", onChanged);

    return {
        local,
        sync,
        session,
        managed: {
            get: managed.get.bind(managed),
            getBytesInUse: managed.getBytesInUse.bind(managed),
            onChanged: new CivilEvent<
                (changes: StorageChanges, areaName: "managed") => void
            >(),
        },
        onChanged,
        _local: local,
        _session: session,
    };
}
