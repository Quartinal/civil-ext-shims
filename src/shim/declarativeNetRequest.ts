import type { DNRRule } from "../types";
import { CivilEvent } from "./event";
import { dual, resolved } from "./util";

export function buildDNRAPI() {
    const _dynamicRules = new Map<number, DNRRule>();
    const _sessionRules = new Map<number, DNRRule>();
    const _enabledRulesets = new Set<string>();

    const onRuleMatchedDebug = new CivilEvent<(info: unknown) => void>();

    function updateDynamicRules(
        options: {
            addRules?: DNRRule[];
            removeRuleIds?: number[];
        },
        cb?: () => void,
    ): Promise<void> {
        return dual(() => {
            for (const id of options.removeRuleIds ?? [])
                _dynamicRules.delete(id);
            for (const rule of options.addRules ?? [])
                _dynamicRules.set(rule.id, rule);
            return Promise.resolve();
        }, cb);
    }

    function getDynamicRules(
        filter?: { ruleIds?: number[] },
        cb?: (rules: DNRRule[]) => void,
    ): Promise<DNRRule[]> {
        if (typeof filter === "function") {
            cb = filter as unknown as (rules: DNRRule[]) => void;
            filter = undefined;
        }
        return dual(() => {
            const all = [..._dynamicRules.values()];
            const result = filter?.ruleIds
                ? all.filter(r => filter!.ruleIds!.includes(r.id))
                : all;
            return Promise.resolve(result);
        }, cb);
    }

    function updateSessionRules(
        options: { addRules?: DNRRule[]; removeRuleIds?: number[] },
        cb?: () => void,
    ): Promise<void> {
        return dual(() => {
            for (const id of options.removeRuleIds ?? [])
                _sessionRules.delete(id);
            for (const rule of options.addRules ?? [])
                _sessionRules.set(rule.id, rule);
            return Promise.resolve();
        }, cb);
    }

    function getSessionRules(
        filter?: { ruleIds?: number[] },
        cb?: (rules: DNRRule[]) => void,
    ): Promise<DNRRule[]> {
        if (typeof filter === "function") {
            cb = filter as unknown as (rules: DNRRule[]) => void;
            filter = undefined;
        }
        return dual(() => {
            const all = [..._sessionRules.values()];
            const result = filter?.ruleIds
                ? all.filter(r => filter!.ruleIds!.includes(r.id))
                : all;
            return Promise.resolve(result);
        }, cb);
    }

    function updateEnabledRulesets(
        options: { enableRulesetIds?: string[]; disableRulesetIds?: string[] },
        cb?: () => void,
    ): Promise<void> {
        return dual(() => {
            for (const id of options.disableRulesetIds ?? [])
                _enabledRulesets.delete(id);
            for (const id of options.enableRulesetIds ?? [])
                _enabledRulesets.add(id);
            return Promise.resolve();
        }, cb);
    }

    function getEnabledRulesets(
        cb?: (rulesetIds: string[]) => void,
    ): Promise<string[]> {
        return dual(() => Promise.resolve([..._enabledRulesets]), cb);
    }

    function getAvailableStaticRuleCount(
        cb?: (count: number) => void,
    ): Promise<number> {
        return resolved(30_000, cb);
    }

    function getMatchedRules(
        filter?: unknown,
        cb?: (details: { rulesMatchedInfo: unknown[] }) => void,
    ): Promise<{ rulesMatchedInfo: unknown[] }> {
        if (typeof filter === "function") {
            cb = filter as unknown as typeof cb;
            filter = undefined;
        }
        return resolved({ rulesMatchedInfo: [] }, cb);
    }

    function isRegexSupported(
        regexOptions: {
            regex: string;
            isCaseSensitive?: boolean;
            requireCapturing?: boolean;
        },
        cb?: (result: { isSupported: boolean; reason?: string }) => void,
    ): Promise<{ isSupported: boolean; reason?: string }> {
        let isSupported = true;
        let reason: string | undefined;
        try {
            new RegExp(
                regexOptions.regex,
                regexOptions.isCaseSensitive ? undefined : "i",
            );
        } catch {
            isSupported = false;
            reason = "syntaxError";
        }
        return resolved({ isSupported, reason }, cb);
    }

    function setExtensionActionOptions(
        _options: {
            displayActionCountAsBadgeText?: boolean;
            tabUpdate?: unknown;
        },
        cb?: () => void,
    ): Promise<void> {
        return resolved(undefined, cb);
    }

    function testMatchOutcome(
        _request: unknown,
        options?: unknown,
        cb?: (result: { matchedRules: unknown[] }) => void,
    ): Promise<{ matchedRules: unknown[] }> {
        if (typeof options === "function") {
            cb = options as unknown as typeof cb;
            options = undefined;
        }
        return resolved({ matchedRules: [] }, cb);
    }

    return {
        updateDynamicRules,
        getDynamicRules,
        updateSessionRules,
        getSessionRules,
        updateEnabledRulesets,
        getEnabledRulesets,
        getAvailableStaticRuleCount,
        getMatchedRules,
        isRegexSupported,
        setExtensionActionOptions,
        testMatchOutcome,
        onRuleMatchedDebug,
        GUARANTEED_MINIMUM_STATIC_RULES: 30_000,
        MAX_NUMBER_OF_DYNAMIC_AND_SESSION_RULES: 5_000,
        MAX_NUMBER_OF_REGEX_RULES: 1_000,
        MAX_NUMBER_OF_STATIC_RULESETS: 100,
        MAX_NUMBER_OF_ENABLED_STATIC_RULESETS: 50,
    };
}
