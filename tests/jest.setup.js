/**
 * Jest DOM + global setup.
 *
 * Runs BEFORE every test file.  Two responsibilities:
 *   1. Populate the jsdom document with every DOM element that AppController
 *      needs so that `new AppController()` (called at the bottom of app.js)
 *      succeeds without throwing.
 *   2. Execute app.js in this module's scope via eval(), then promote the
 *      resulting class/constant bindings to `global` so that every test file
 *      can access StorageService, CommandParser, MODELS and AppController
 *      directly.
 */

'use strict';

const fs   = require('fs');
const path = require('path');

// ── Fake timers (prevents setInterval from leaking between tests) ─────────────
// Must be called before app.js runs so animateCounter's setInterval is faked.
jest.useFakeTimers();

// ── Build the required DOM skeleton ──────────────────────────────────────────

function el(tag, id, extra) {
    const node = document.createElement(tag);
    if (id) node.id = id;
    if (extra) Object.assign(node, extra);
    document.body.appendChild(node);
    return node;
}

// Hero
el('div',    'spotlight');
el('div',    'hero');
el('button', 'enter-btn');
el('span',   'typewriter');
el('div',    'app');

// Terminal
el('input',  'terminal-input');
el('div',    'terminal-output');
el('button', 'clear-terminal');

// Configuration
el('button', 'export-config');
el('div',    'config-apps');

// Settings
el('input',  'user-email');
el('input',  'api-key',   { type: 'password' });
el('select', 'provider-select');
el('button', 'toggle-key');
el('button', 'save-settings');
el('button', 'fetch-quota');
el('div',    'quota-display');
el('span',   'quota-total');
el('span',   'quota-used');
el('span',   'quota-remaining');

// Activity log
el('button', 'export-activity');
el('div',    'activity-log');

// Dashboard stats
el('span', 'total-calls');
el('span', 'calls-trend');
el('span', 'tokens-used');
el('span', 'tokens-available');
el('span', 'total-cost');
el('span', 'success-rate');
el('span', 'uptime');

// ── Stubs for browser-only APIs ────────────────────────────────────────────
global.URL.createObjectURL = jest.fn(() => 'blob:mock');
global.URL.revokeObjectURL = jest.fn();

// ── Load app.js and expose its top-level bindings to the global scope ─────
//
// Jest wraps every require()'d file in a CommonJS module function, making
// class/const declarations invisible outside that wrapper.
//
// We work around this by eval()'ing the source directly inside this setup
// module's scope.  Direct eval() creates bindings in the *enclosing* function
// scope (i.e. this module), after which we explicitly assign them to `global`
// so tests can access them as plain identifiers.
//

const appSrc = fs.readFileSync(path.join(__dirname, '../app.js'), 'utf8'); // eslint-disable-line no-sync

// Class declarations inside eval() are scoped to the eval block even in
// non-strict mode.  Instead, wrap the entire source in a Function that
// returns the identifiers we need, then assigns them to global.
//
// The function executes with access to global's properties (document,
// localStorage, etc.) because we pass `global` as `this` via `.call()`.
/* eslint-disable no-new-func */
const _exports = new Function(`
    ${appSrc}
    return { StorageService, CommandParser, MODELS, AppController, app };
`).call(global);
/* eslint-enable no-new-func */

global.StorageService  = _exports.StorageService;
global.CommandParser   = _exports.CommandParser;
global.MODELS          = _exports.MODELS;
global.AppController   = _exports.AppController;
global.app             = _exports.app;