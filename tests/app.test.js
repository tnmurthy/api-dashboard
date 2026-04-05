/**
 * Tests for app.js (API Command Center)
 *
 * This PR reverts the blockchain-backed CRM layer.  The tests therefore cover:
 *
 *   1. StorageService – core storage keys and methods
 *   2. StorageService – regression: CRM keys/methods must NOT be present
 *   3. MODELS constant – completeness and structure
 *   4. CommandParser – all remaining commands
 *   5. CommandParser – regression: CRM commands must return "unknown"
 *   6. AppController – formatNumber utility
 *
 * jest.setup.js loads app.js via eval() and exposes StorageService,
 * CommandParser, MODELS, AppController, and app as globals, so no require
 * is needed here.
 */

/* global StorageService, CommandParser, MODELS, AppController, app */

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Create a fresh StorageService with an empty localStorage. */
function makeStorage() {
    localStorage.clear();
    return new StorageService(); // eslint-disable-line no-undef
}

/** Create a CommandParser backed by a fresh StorageService. */
function makeParser() {
    const storage = makeStorage();
    return new CommandParser(storage); // eslint-disable-line no-undef
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. StorageService – STORAGE_KEYS
// ─────────────────────────────────────────────────────────────────────────────

describe('StorageService – STORAGE_KEYS', () => {
    let storage;

    beforeEach(() => {
        storage = makeStorage();
    });

    it('defines the six core keys', () => {
        const keys = storage.STORAGE_KEYS;
        expect(keys.APPS).toBe('api_command_apps');
        expect(keys.HISTORY).toBe('api_command_history');
        expect(keys.STATS).toBe('api_command_stats');
        expect(keys.SETTINGS).toBe('api_command_settings');
        expect(keys.QUOTA).toBe('api_command_quota');
        expect(keys.ACTIVITY).toBe('api_command_activity');
    });

    it('has exactly six keys (no CRM keys added back)', () => {
        expect(Object.keys(storage.STORAGE_KEYS)).toHaveLength(6);
    });

    // ── Regression: CRM keys removed in this PR ───────────────────────────────
    it('does NOT contain CRM_CONTACTS key', () => {
        expect(storage.STORAGE_KEYS).not.toHaveProperty('CRM_CONTACTS');
    });

    it('does NOT contain CRM_DEALS key', () => {
        expect(storage.STORAGE_KEYS).not.toHaveProperty('CRM_DEALS');
    });

    it('does NOT contain CRM_ACTIVITIES key', () => {
        expect(storage.STORAGE_KEYS).not.toHaveProperty('CRM_ACTIVITIES');
    });

    it('does NOT contain CRM_CHAIN_TXS key', () => {
        expect(storage.STORAGE_KEYS).not.toHaveProperty('CRM_CHAIN_TXS');
    });

    it('does NOT contain WALLET key', () => {
        expect(storage.STORAGE_KEYS).not.toHaveProperty('WALLET');
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. StorageService – CRM methods removed (regression)
// ─────────────────────────────────────────────────────────────────────────────

describe('StorageService – CRM methods absent (regression)', () => {
    let storage;

    beforeEach(() => {
        storage = makeStorage();
    });

    it('does NOT have getCRMContacts method', () => {
        expect(typeof storage.getCRMContacts).toBe('undefined');
    });

    it('does NOT have saveCRMContacts method', () => {
        expect(typeof storage.saveCRMContacts).toBe('undefined');
    });

    it('does NOT have addCRMContact method', () => {
        expect(typeof storage.addCRMContact).toBe('undefined');
    });

    it('does NOT have updateCRMContact method', () => {
        expect(typeof storage.updateCRMContact).toBe('undefined');
    });

    it('does NOT have getCRMDeals method', () => {
        expect(typeof storage.getCRMDeals).toBe('undefined');
    });

    it('does NOT have saveCRMDeals method', () => {
        expect(typeof storage.saveCRMDeals).toBe('undefined');
    });

    it('does NOT have addCRMDeal method', () => {
        expect(typeof storage.addCRMDeal).toBe('undefined');
    });

    it('does NOT have getCRMActivities method', () => {
        expect(typeof storage.getCRMActivities).toBe('undefined');
    });

    it('does NOT have saveCRMActivities method', () => {
        expect(typeof storage.saveCRMActivities).toBe('undefined');
    });

    it('does NOT have addCRMActivity method', () => {
        expect(typeof storage.addCRMActivity).toBe('undefined');
    });

    it('does NOT have getChainTxs method', () => {
        expect(typeof storage.getChainTxs).toBe('undefined');
    });

    it('does NOT have addChainTx method', () => {
        expect(typeof storage.addChainTx).toBe('undefined');
    });

    it('does NOT have getWallet method', () => {
        expect(typeof storage.getWallet).toBe('undefined');
    });

    it('does NOT have saveWallet method', () => {
        expect(typeof storage.saveWallet).toBe('undefined');
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. StorageService – Apps
// ─────────────────────────────────────────────────────────────────────────────

describe('StorageService – apps', () => {
    let storage;

    beforeEach(() => {
        storage = makeStorage();
    });

    it('initialises with mock apps on first construction', () => {
        const apps = storage.getApps();
        expect(apps.length).toBeGreaterThan(0);
    });

    it('returns mock apps with required fields', () => {
        const apps = storage.getApps();
        apps.forEach(app => {
            expect(app).toHaveProperty('id');
            expect(app).toHaveProperty('name');
            expect(app).toHaveProperty('primaryModel');
            expect(app).toHaveProperty('fallbackModel');
            expect(app.primaryModel).toHaveProperty('model');
            expect(app.fallbackModel).toHaveProperty('model');
        });
    });

    it('saves and retrieves apps', () => {
        const apps = [{ id: 'testapp', name: 'TestApp', primaryModel: { model: 'gpt-4-turbo' }, fallbackModel: { model: 'gpt-3.5-turbo' } }];
        storage.saveApps(apps);
        expect(storage.getApps()).toEqual(apps);
    });

    it('returns empty array when localStorage has empty list', () => {
        storage.saveApps([]);
        expect(storage.getApps()).toEqual([]);
    });

    it('does not re-initialise apps if they already exist', () => {
        const firstLoad = storage.getApps();
        // Create a second instance — should not overwrite existing data
        const storage2 = new StorageService(); // eslint-disable-line no-undef
        expect(storage2.getApps()).toEqual(firstLoad);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. StorageService – Stats
// ─────────────────────────────────────────────────────────────────────────────

describe('StorageService – stats', () => {
    let storage;

    beforeEach(() => {
        storage = makeStorage();
    });

    it('initialises with mock stats', () => {
        const stats = storage.getStats();
        expect(stats).toHaveProperty('totalCalls');
        expect(stats).toHaveProperty('tokensAvailable');
        expect(stats).toHaveProperty('tokensUsed');
        expect(stats).toHaveProperty('totalCost');
        expect(stats).toHaveProperty('successRate');
        expect(stats).toHaveProperty('uptime');
    });

    it('saves and retrieves stats', () => {
        const newStats = { totalCalls: 999, tokensAvailable: 5000, tokensUsed: 1000, totalCost: 1.5, successRate: 98.5, uptime: 99.0 };
        storage.saveStats(newStats);
        expect(storage.getStats()).toEqual(newStats);
    });

    it('returns empty object when no stats are stored', () => {
        localStorage.removeItem(storage.STORAGE_KEYS.STATS);
        expect(storage.getStats()).toEqual({});
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. StorageService – History
// ─────────────────────────────────────────────────────────────────────────────

describe('StorageService – history', () => {
    let storage;

    beforeEach(() => {
        storage = makeStorage();
    });

    it('initialises with an empty history', () => {
        expect(storage.getHistory()).toEqual([]);
    });

    it('addToHistory appends an entry with required fields', () => {
        storage.addToHistory('list apps', 'Apps:\n  • OpenClaw', true);
        const history = storage.getHistory();
        expect(history).toHaveLength(1);
        expect(history[0]).toHaveProperty('command', 'list apps');
        expect(history[0]).toHaveProperty('output', 'Apps:\n  • OpenClaw');
        expect(history[0]).toHaveProperty('success', true);
        expect(history[0]).toHaveProperty('timestamp');
    });

    it('addToHistory sets success=true by default', () => {
        storage.addToHistory('help', 'Commands:...');
        const entry = storage.getHistory()[0];
        expect(entry.success).toBe(true);
    });

    it('addToHistory stores failed commands with success=false', () => {
        storage.addToHistory('bad cmd', 'Unknown: bad cmd', false);
        expect(storage.getHistory()[0].success).toBe(false);
    });

    it('trims history to the last 50 entries', () => {
        for (let i = 0; i < 60; i++) {
            storage.addToHistory(`cmd${i}`, `output${i}`);
        }
        expect(storage.getHistory().length).toBeLessThanOrEqual(50);
    });

    it('keeps the most recent 50 entries when trimming', () => {
        for (let i = 0; i < 55; i++) {
            storage.addToHistory(`cmd${i}`, `output${i}`);
        }
        const history = storage.getHistory();
        expect(history[history.length - 1].command).toBe('cmd54');
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// 6. StorageService – Activity
// ─────────────────────────────────────────────────────────────────────────────

describe('StorageService – activity', () => {
    let storage;

    beforeEach(() => {
        storage = makeStorage();
    });

    it('initialises with 10 mock activity entries', () => {
        const activity = storage.getActivity();
        expect(activity).toHaveLength(10);
    });

    it('mock activity entries have required fields', () => {
        storage.getActivity().forEach(entry => {
            expect(entry).toHaveProperty('timestamp');
            expect(entry).toHaveProperty('model');
            expect(entry).toHaveProperty('tokens');
            expect(entry).toHaveProperty('cost');
            expect(entry).toHaveProperty('status');
            expect(['success', 'error']).toContain(entry.status);
        });
    });

    it('addActivity prepends an entry (most recent first)', () => {
        const initialCount = storage.getActivity().length;
        const newEntry = { timestamp: new Date().toISOString(), model: 'gpt-4-turbo', tokens: 100, cost: '0.0010', status: 'success' };
        storage.addActivity(newEntry);
        const activity = storage.getActivity();
        expect(activity[0]).toEqual(newEntry);
        expect(activity.length).toBe(initialCount + 1);
    });

    it('addActivity trims list to 100 entries', () => {
        localStorage.clear();
        const fresh = new StorageService(); // eslint-disable-line no-undef
        // fill with 99 existing entries
        const entries = Array.from({ length: 99 }, (_, i) => ({
            timestamp: new Date(Date.now() - i * 1000).toISOString(),
            model: 'gpt-3.5-turbo', tokens: 100, cost: '0.0001', status: 'success'
        }));
        fresh.saveActivity(entries);

        // add 5 more — total would be 104 without trimming
        for (let i = 0; i < 5; i++) {
            fresh.addActivity({ timestamp: new Date().toISOString(), model: 'gpt-4-turbo', tokens: 200, cost: '0.002', status: 'success' });
        }

        expect(fresh.getActivity().length).toBeLessThanOrEqual(100);
    });

    it('saves and retrieves custom activity array', () => {
        const data = [{ timestamp: '2026-01-01T00:00:00Z', model: 'test', tokens: 1, cost: '0', status: 'success' }];
        storage.saveActivity(data);
        expect(storage.getActivity()).toEqual(data);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// 7. StorageService – Settings & Quota
// ─────────────────────────────────────────────────────────────────────────────

describe('StorageService – settings', () => {
    let storage;

    beforeEach(() => {
        storage = makeStorage();
    });

    it('returns empty object when no settings stored', () => {
        expect(storage.getSettings()).toEqual({});
    });

    it('saves and retrieves settings', () => {
        const settings = { email: 'test@example.com', apiKey: 'sk-test', provider: 'openai' };
        storage.saveSettings(settings);
        expect(storage.getSettings()).toEqual(settings);
    });
});

describe('StorageService – quota', () => {
    let storage;

    beforeEach(() => {
        storage = makeStorage();
    });

    it('returns empty object when no quota stored', () => {
        expect(storage.getQuota()).toEqual({});
    });

    it('saves and retrieves quota', () => {
        const quota = { total: 1000000, used: 300000, remaining: 700000 };
        storage.saveQuota(quota);
        expect(storage.getQuota()).toEqual(quota);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// 8. MODELS constant
// ─────────────────────────────────────────────────────────────────────────────

describe('MODELS constant', () => {
    // MODELS is exposed to global by jest.setup.js
    let models;

    beforeAll(() => {
        models = MODELS;
    });

    it('defines exactly 6 models', () => {
        expect(Object.keys(models)).toHaveLength(6);
    });

    it('contains gpt-4-turbo', () => {
        expect(models).toHaveProperty('gpt-4-turbo');
        expect(models['gpt-4-turbo'].provider).toBe('openai');
    });

    it('contains gpt-3.5-turbo', () => {
        // Use array-path syntax to avoid Jest treating the '.' as a path separator
        expect(models).toHaveProperty(['gpt-3.5-turbo']);
        expect(models['gpt-3.5-turbo'].provider).toBe('openai');
    });

    it('contains claude-3-opus', () => {
        expect(models).toHaveProperty('claude-3-opus');
        expect(models['claude-3-opus'].provider).toBe('anthropic');
    });

    it('contains claude-3-sonnet', () => {
        expect(models).toHaveProperty('claude-3-sonnet');
        expect(models['claude-3-sonnet'].provider).toBe('anthropic');
    });

    it('contains gemini-pro', () => {
        expect(models).toHaveProperty('gemini-pro');
        expect(models['gemini-pro'].provider).toBe('google');
    });

    it('contains gemini-ultra', () => {
        expect(models).toHaveProperty('gemini-ultra');
        expect(models['gemini-ultra'].provider).toBe('google');
    });

    it('every model has costPer1k, provider, and name fields', () => {
        Object.values(models).forEach(m => {
            expect(m).toHaveProperty('provider');
            expect(m).toHaveProperty('name');
            expect(m).toHaveProperty('costPer1k');
            expect(typeof m.costPer1k).toBe('number');
            expect(m.costPer1k).toBeGreaterThan(0);
        });
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// 9. CommandParser – help
// ─────────────────────────────────────────────────────────────────────────────

describe('CommandParser – help', () => {
    let parser;

    beforeEach(() => {
        parser = makeParser();
    });

    it('returns success:true for "help"', () => {
        expect(parser.parse('help').success).toBe(true);
    });

    it('output contains basic command list', () => {
        const { output } = parser.parse('help');
        expect(output).toMatch(/list apps/);
        expect(output).toMatch(/list models/);
        expect(output).toMatch(/config/);
        expect(output).toMatch(/export/);
        expect(output).toMatch(/clear/);
    });

    // Regression: CRM help text removed in this PR
    it('output does NOT mention "crm contacts"', () => {
        expect(parser.parse('help').output).not.toMatch(/crm contacts/i);
    });

    it('output does NOT mention "crm deals"', () => {
        expect(parser.parse('help').output).not.toMatch(/crm deals/i);
    });

    it('output does NOT mention "crm stats"', () => {
        expect(parser.parse('help').output).not.toMatch(/crm stats/i);
    });

    it('output does NOT mention "wallet status"', () => {
        expect(parser.parse('help').output).not.toMatch(/wallet status/i);
    });

    it('is case-insensitive for the "help" command', () => {
        expect(parser.parse('HELP').success).toBe(true);
        expect(parser.parse('Help').success).toBe(true);
    });

    it('ignores leading/trailing whitespace', () => {
        expect(parser.parse('  help  ').success).toBe(true);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// 10. CommandParser – list apps
// ─────────────────────────────────────────────────────────────────────────────

describe('CommandParser – list apps', () => {
    let parser;

    beforeEach(() => {
        parser = makeParser();
    });

    it('returns success:true', () => {
        expect(parser.parse('list apps').success).toBe(true);
    });

    it('output starts with "Apps:"', () => {
        expect(parser.parse('list apps').output).toMatch(/^Apps:/);
    });

    it('lists each app by name and id', () => {
        const { output } = parser.parse('list apps');
        const storage = makeStorage();
        storage.getApps().forEach(a => {
            expect(output).toContain(a.name);
            expect(output).toContain(a.id);
        });
    });

    it('is case-insensitive', () => {
        expect(parser.parse('LIST APPS').success).toBe(true);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// 11. CommandParser – list models
// ─────────────────────────────────────────────────────────────────────────────

describe('CommandParser – list models', () => {
    let parser;

    beforeEach(() => {
        parser = makeParser();
    });

    it('returns success:true', () => {
        expect(parser.parse('list models').success).toBe(true);
    });

    it('output starts with "Models:"', () => {
        expect(parser.parse('list models').output).toMatch(/^Models:/);
    });

    it('lists all six model keys', () => {
        const { output } = parser.parse('list models');
        ['gpt-4-turbo', 'gpt-3.5-turbo', 'claude-3-opus', 'claude-3-sonnet', 'gemini-pro', 'gemini-ultra'].forEach(key => {
            expect(output).toContain(key);
        });
    });

    it('includes cost information', () => {
        const { output } = parser.parse('list models');
        expect(output).toMatch(/\$\d+\.\d+\/1k/);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// 12. CommandParser – show config
// ─────────────────────────────────────────────────────────────────────────────

describe('CommandParser – show config', () => {
    let parser;

    beforeEach(() => {
        parser = makeParser();
    });

    it('returns error for missing app id', () => {
        const result = parser.parse('show config');
        expect(result.success).toBe(false);
        expect(result.output).toMatch(/Usage:/);
    });

    it('returns error for non-existent app', () => {
        const result = parser.parse('show config nonexistent');
        expect(result.success).toBe(false);
        expect(result.output).toMatch(/Not found/);
    });

    it('returns config for an existing app', () => {
        const storage = makeStorage();
        const appId = storage.getApps()[0].id;
        const result = parser.parse(`show config ${appId}`);
        expect(result.success).toBe(true);
        expect(result.output).toMatch(/Primary/);
        expect(result.output).toMatch(/Fallback/);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// 13. CommandParser – config (configure app)
// ─────────────────────────────────────────────────────────────────────────────

describe('CommandParser – config (configure app)', () => {
    let parser;
    let appId;

    beforeEach(() => {
        parser = makeParser();
        appId = makeStorage().getApps()[0].id;
    });

    it('returns error when --primary flag is missing', () => {
        const result = parser.parse(`config ${appId} --fallback gpt-3.5-turbo`);
        expect(result.success).toBe(false);
        expect(result.output).toMatch(/Usage:/);
    });

    it('returns error when --fallback flag is missing', () => {
        const result = parser.parse(`config ${appId} --primary gpt-4-turbo`);
        expect(result.success).toBe(false);
        expect(result.output).toMatch(/Usage:/);
    });

    it('returns error for an invalid primary model', () => {
        const result = parser.parse(`config ${appId} --primary unknown-model --fallback gpt-3.5-turbo`);
        expect(result.success).toBe(false);
        expect(result.output).toMatch(/Invalid model/);
    });

    it('returns error for an invalid fallback model', () => {
        const result = parser.parse(`config ${appId} --primary gpt-4-turbo --fallback unknown-model`);
        expect(result.success).toBe(false);
        expect(result.output).toMatch(/Invalid model/);
    });

    it('returns error for a non-existent app', () => {
        const result = parser.parse('config nosuchapp --primary gpt-4-turbo --fallback gpt-3.5-turbo');
        expect(result.success).toBe(false);
        expect(result.output).toMatch(/Not found/);
    });

    it('successfully configures an app with valid models', () => {
        const result = parser.parse(`config ${appId} --primary claude-3-opus --fallback gemini-pro`);
        expect(result.success).toBe(true);
        expect(result.output).toMatch(/configured/);
    });

    it('persists the updated models to storage after config', () => {
        const storage = makeStorage();
        const localParser = new CommandParser(storage); // eslint-disable-line no-undef
        localParser.parse(`config ${appId} --primary gemini-ultra --fallback gpt-3.5-turbo`);
        const updatedApp = storage.getApps().find(a => a.id === appId);
        expect(updatedApp.primaryModel.model).toBe('gemini-ultra');
        expect(updatedApp.fallbackModel.model).toBe('gpt-3.5-turbo');
    });

    it('allows --primary and --fallback to be the same model', () => {
        const result = parser.parse(`config ${appId} --primary gpt-4-turbo --fallback gpt-4-turbo`);
        expect(result.success).toBe(true);
    });

    it('accepts flags in reverse order (--fallback before --primary)', () => {
        const result = parser.parse(`config ${appId} --fallback gpt-3.5-turbo --primary claude-3-opus`);
        expect(result.success).toBe(true);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// 14. CommandParser – export
// ─────────────────────────────────────────────────────────────────────────────

describe('CommandParser – export', () => {
    let parser;
    let appId;

    beforeEach(() => {
        parser = makeParser();
        appId = makeStorage().getApps()[0].id;
    });

    it('returns error when app id is missing', () => {
        const result = parser.parse('export');
        expect(result.success).toBe(false);
        expect(result.output).toMatch(/Usage:/);
    });

    it('returns error for a non-existent app', () => {
        const result = parser.parse('export nosuchapp');
        expect(result.success).toBe(false);
        expect(result.output).toMatch(/Not found/);
    });

    it('succeeds for an existing app', () => {
        const result = parser.parse(`export ${appId}`);
        expect(result.success).toBe(true);
        expect(result.output).toContain(appId);
    });

    it('mentions the filename in the output', () => {
        const result = parser.parse(`export ${appId}`);
        expect(result.output).toContain(`${appId}-config.json`);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// 15. CommandParser – clear
// ─────────────────────────────────────────────────────────────────────────────

describe('CommandParser – clear', () => {
    let parser;

    beforeEach(() => {
        parser = makeParser();
    });

    it('returns success:true and the clear flag', () => {
        const result = parser.parse('clear');
        expect(result.success).toBe(true);
        expect(result.clear).toBe(true);
    });

    it('output is empty string on clear', () => {
        expect(parser.parse('clear').output).toBe('');
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// 16. CommandParser – unknown commands
// ─────────────────────────────────────────────────────────────────────────────

describe('CommandParser – unknown commands', () => {
    let parser;

    beforeEach(() => {
        parser = makeParser();
    });

    it('returns success:false for a completely unknown command', () => {
        expect(parser.parse('foobar').success).toBe(false);
    });

    it('includes the original command in the error output', () => {
        expect(parser.parse('foobar').output).toContain('foobar');
    });

    it('suggests typing "help"', () => {
        expect(parser.parse('foobar').output).toMatch(/help/);
    });

    // Regression: CRM commands removed in this PR
    it('"crm contacts" returns success:false (CRM removed)', () => {
        expect(parser.parse('crm contacts').success).toBe(false);
    });

    it('"crm deals" returns success:false (CRM removed)', () => {
        expect(parser.parse('crm deals').success).toBe(false);
    });

    it('"crm stats" returns success:false (CRM removed)', () => {
        expect(parser.parse('crm stats').success).toBe(false);
    });

    it('"wallet status" returns success:false (CRM removed)', () => {
        expect(parser.parse('wallet status').success).toBe(false);
    });

    it('an empty string returns success:false', () => {
        // trimmed becomes '' which matches none of the known commands
        // parse('') → trimmed = '' → falls through to unknown
        const result = parser.parse('   ');
        expect(result.success).toBe(false);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// 17. AppController – formatNumber
// ─────────────────────────────────────────────────────────────────────────────

describe('AppController – formatNumber', () => {
    // Access the global `app` instance created at the bottom of app.js
    // (exposed to global by jest.setup.js)
    let appInstance;

    beforeAll(() => {
        appInstance = app;
    });

    it('formats zero as "0"', () => {
        expect(appInstance.formatNumber(0)).toBe('0');
    });

    it('formats a number below 1000 without separator', () => {
        expect(appInstance.formatNumber(999)).toBe('999');
    });

    it('formats 1000 with a comma separator', () => {
        // toLocaleString with 'en-US' gives "1,000"
        expect(appInstance.formatNumber(1000)).toBe('1,000');
    });

    it('formats a large number with multiple separators', () => {
        expect(appInstance.formatNumber(1234567)).toBe('1,234,567');
    });

    it('formats a decimal number', () => {
        // toLocaleString may vary by locale; just verify it returns a string
        expect(typeof appInstance.formatNumber(1.5)).toBe('string');
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// 18. StorageService – getMockApps structure
// ─────────────────────────────────────────────────────────────────────────────

describe('StorageService – getMockApps', () => {
    let storage;

    beforeEach(() => {
        storage = makeStorage();
    });

    it('returns an array with at least 2 apps', () => {
        expect(storage.getMockApps().length).toBeGreaterThanOrEqual(2);
    });

    it('contains openclaw app', () => {
        const app = storage.getMockApps().find(a => a.id === 'openclaw');
        expect(app).toBeDefined();
        expect(app.name).toBe('OpenClaw');
    });

    it('contains moltbot app', () => {
        const app = storage.getMockApps().find(a => a.id === 'moltbot');
        expect(app).toBeDefined();
        expect(app.name).toBe('MoltBot');
    });

    it('each mock app has an icon field', () => {
        storage.getMockApps().forEach(a => {
            expect(a).toHaveProperty('icon');
        });
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// 19. StorageService – getMockStats structure
// ─────────────────────────────────────────────────────────────────────────────

describe('StorageService – getMockStats', () => {
    let storage;

    beforeEach(() => {
        storage = makeStorage();
    });

    it('returns realistic totalCalls value', () => {
        expect(storage.getMockStats().totalCalls).toBeGreaterThan(0);
    });

    it('tokensAvailable is greater than tokensUsed', () => {
        const s = storage.getMockStats();
        expect(s.tokensAvailable).toBeGreaterThan(s.tokensUsed);
    });

    it('successRate is between 0 and 100', () => {
        const rate = storage.getMockStats().successRate;
        expect(rate).toBeGreaterThanOrEqual(0);
        expect(rate).toBeLessThanOrEqual(100);
    });

    it('uptime is between 0 and 100', () => {
        const uptime = storage.getMockStats().uptime;
        expect(uptime).toBeGreaterThanOrEqual(0);
        expect(uptime).toBeLessThanOrEqual(100);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// 20. StorageService – getMockActivity structure
// ─────────────────────────────────────────────────────────────────────────────

describe('StorageService – getMockActivity', () => {
    let storage;

    beforeEach(() => {
        storage = makeStorage();
    });

    it('returns exactly 10 activity entries', () => {
        expect(storage.getMockActivity()).toHaveLength(10);
    });

    it('entries are in descending timestamp order (most recent first)', () => {
        const activity = storage.getMockActivity();
        for (let i = 0; i < activity.length - 1; i++) {
            expect(new Date(activity[i].timestamp) >= new Date(activity[i + 1].timestamp)).toBe(true);
        }
    });

    it('entries have valid ISO timestamp strings', () => {
        storage.getMockActivity().forEach(entry => {
            expect(() => new Date(entry.timestamp).toISOString()).not.toThrow();
        });
    });

    it('token counts are positive integers', () => {
        storage.getMockActivity().forEach(entry => {
            expect(Number.isInteger(entry.tokens)).toBe(true);
            expect(entry.tokens).toBeGreaterThan(0);
        });
    });

    it('model names are non-empty strings', () => {
        storage.getMockActivity().forEach(entry => {
            expect(typeof entry.model).toBe('string');
            expect(entry.model.length).toBeGreaterThan(0);
        });
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// 21. StorageService – localStorage isolation
// ─────────────────────────────────────────────────────────────────────────────

describe('StorageService – localStorage isolation', () => {
    it('stores data under namespaced keys (not bare "contacts" etc.)', () => {
        const storage = makeStorage();
        // After construction the only keys that should exist start with 'api_command_'
        const storedKeys = Object.keys(localStorage);
        storedKeys.forEach(key => {
            expect(key).toMatch(/^api_command_/);
        });
    });

    it('does NOT write any crm_ prefixed keys to localStorage', () => {
        makeStorage();
        const storedKeys = Object.keys(localStorage);
        const crmKeys = storedKeys.filter(k => k.startsWith('crm_'));
        expect(crmKeys).toHaveLength(0);
    });
});