// ============================================
// API Command Center - Compact Two-Screen App
// ============================================

class StorageService {
    constructor() {
        this.STORAGE_KEYS = {
            APPS: 'api_command_apps',
            HISTORY: 'api_command_history',
            STATS: 'api_command_stats',
            SETTINGS: 'api_command_settings',
            QUOTA: 'api_command_quota',
            ACTIVITY: 'api_command_activity',
            // CRM keys
            CRM_CONTACTS:   'crm_contacts',
            CRM_DEALS:      'crm_deals',
            CRM_ACTIVITIES: 'crm_activities',
            CRM_CHAIN_TXS:  'crm_chain_txs',
            WALLET:         'crm_wallet',
        };
        this.initializeStorage();
    }

    initializeStorage() {
        if (!localStorage.getItem(this.STORAGE_KEYS.APPS)) {
            this.saveApps(this.getMockApps());
        }
        if (!localStorage.getItem(this.STORAGE_KEYS.STATS)) {
            this.saveStats(this.getMockStats());
        }
        if (!localStorage.getItem(this.STORAGE_KEYS.HISTORY)) {
            this.saveHistory([]);
        }
        if (!localStorage.getItem(this.STORAGE_KEYS.ACTIVITY)) {
            this.saveActivity(this.getMockActivity());
        }
    }

    getMockActivity() {
        const now = new Date();
        const models = ['GPT-4 Turbo', 'Claude 3 Opus', 'Gemini Pro', 'GPT-3.5 Turbo', 'Claude 3 Sonnet'];
        const activity = [];

        for (let i = 0; i < 10; i++) {
            const timestamp = new Date(now - i * 3 * 60 * 1000); // 3 minutes apart
            activity.push({
                timestamp: timestamp.toISOString(),
                model: models[Math.floor(Math.random() * models.length)],
                tokens: Math.floor(Math.random() * 3000) + 500,
                cost: (Math.random() * 0.05).toFixed(4),
                status: Math.random() > 0.1 ? 'success' : 'error'
            });
        }

        return activity;
    }

    getMockApps() {
        return [
            {
                id: 'openclaw',
                name: 'OpenClaw',
                description: 'AI-powered code assistant',
                icon: 'OC',
                primaryModel: { provider: 'openai', model: 'gpt-4-turbo', costPer1k: 0.01 },
                fallbackModel: { provider: 'anthropic', model: 'claude-3-sonnet', costPer1k: 0.003 }
            },
            {
                id: 'moltbot',
                name: 'MoltBot',
                description: 'Conversational AI assistant',
                icon: 'MB',
                primaryModel: { provider: 'google', model: 'gemini-pro', costPer1k: 0.0005 },
                fallbackModel: { provider: 'openai', model: 'gpt-3.5-turbo', costPer1k: 0.0015 }
            }
        ];
    }

    getMockStats() {
        return {
            totalCalls: 12547,
            callsTrend: '+24',
            tokensAvailable: 1000000,
            tokensUsed: 678432,
            totalCost: 24.56,
            successRate: 99.8,
            uptime: 99.9
        };
    }

    getApps() {
        return JSON.parse(localStorage.getItem(this.STORAGE_KEYS.APPS) || '[]');
    }

    saveApps(apps) {
        localStorage.setItem(this.STORAGE_KEYS.APPS, JSON.stringify(apps));
    }

    getStats() {
        return JSON.parse(localStorage.getItem(this.STORAGE_KEYS.STATS) || '{}');
    }

    saveStats(stats) {
        localStorage.setItem(this.STORAGE_KEYS.STATS, JSON.stringify(stats));
    }

    getHistory() {
        return JSON.parse(localStorage.getItem(this.STORAGE_KEYS.HISTORY) || '[]');
    }

    saveHistory(history) {
        localStorage.setItem(this.STORAGE_KEYS.HISTORY, JSON.stringify(history));
    }

    addToHistory(command, output, success = true) {
        const history = this.getHistory();
        history.push({ timestamp: new Date().toISOString(), command, output, success });
        this.saveHistory(history.slice(-50));
    }

    getSettings() {
        return JSON.parse(localStorage.getItem(this.STORAGE_KEYS.SETTINGS) || '{}');
    }

    saveSettings(settings) {
        localStorage.setItem(this.STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    }

    getQuota() {
        return JSON.parse(localStorage.getItem(this.STORAGE_KEYS.QUOTA) || '{}');
    }

    saveQuota(quota) {
        localStorage.setItem(this.STORAGE_KEYS.QUOTA, JSON.stringify(quota));
    }

    getActivity() {
        return JSON.parse(localStorage.getItem(this.STORAGE_KEYS.ACTIVITY) || '[]');
    }

    saveActivity(activity) {
        localStorage.setItem(this.STORAGE_KEYS.ACTIVITY, JSON.stringify(activity));
    }

    addActivity(entry) {
        const activity = this.getActivity();
        activity.unshift(entry); // Add to beginning
        this.saveActivity(activity.slice(0, 100)); // Keep last 100
    }

    // ── CRM helpers ──────────────────────────────────────────────────────────

    getCRMContacts() {
        return JSON.parse(localStorage.getItem(this.STORAGE_KEYS.CRM_CONTACTS) || '[]');
    }
    saveCRMContacts(contacts) {
        localStorage.setItem(this.STORAGE_KEYS.CRM_CONTACTS, JSON.stringify(contacts));
    }
    addCRMContact(contact) {
        const contacts = this.getCRMContacts();
        contacts.unshift(contact);
        this.saveCRMContacts(contacts);
    }
    updateCRMContact(id, updates) {
        const contacts = this.getCRMContacts();
        const idx = contacts.findIndex(c => c.id === id);
        if (idx !== -1) {
            contacts[idx] = { ...contacts[idx], ...updates, updatedAt: new Date().toISOString() };
            this.saveCRMContacts(contacts);
        }
    }

    getCRMDeals() {
        return JSON.parse(localStorage.getItem(this.STORAGE_KEYS.CRM_DEALS) || '[]');
    }
    saveCRMDeals(deals) {
        localStorage.setItem(this.STORAGE_KEYS.CRM_DEALS, JSON.stringify(deals));
    }
    addCRMDeal(deal) {
        const deals = this.getCRMDeals();
        deals.unshift(deal);
        this.saveCRMDeals(deals);
    }

    getCRMActivities() {
        return JSON.parse(localStorage.getItem(this.STORAGE_KEYS.CRM_ACTIVITIES) || '[]');
    }
    saveCRMActivities(acts) {
        localStorage.setItem(this.STORAGE_KEYS.CRM_ACTIVITIES, JSON.stringify(acts));
    }
    addCRMActivity(entry) {
        const acts = this.getCRMActivities();
        acts.unshift(entry);
        this.saveCRMActivities(acts.slice(0, 200));
    }

    getChainTxs() {
        return JSON.parse(localStorage.getItem(this.STORAGE_KEYS.CRM_CHAIN_TXS) || '[]');
    }
    addChainTx(tx) {
        const txs = this.getChainTxs();
        txs.unshift(tx);
        localStorage.setItem(this.STORAGE_KEYS.CRM_CHAIN_TXS, JSON.stringify(txs.slice(0, 50)));
    }

    getWallet() {
        return JSON.parse(localStorage.getItem(this.STORAGE_KEYS.WALLET) || 'null');
    }
    saveWallet(walletData) {
        localStorage.setItem(this.STORAGE_KEYS.WALLET, JSON.stringify(walletData));
    }
}

const MODELS = {
    'gpt-4-turbo': { provider: 'openai', name: 'GPT-4 Turbo', costPer1k: 0.01 },
    'gpt-3.5-turbo': { provider: 'openai', name: 'GPT-3.5 Turbo', costPer1k: 0.0015 },
    'claude-3-opus': { provider: 'anthropic', name: 'Claude 3 Opus', costPer1k: 0.015 },
    'claude-3-sonnet': { provider: 'anthropic', name: 'Claude 3 Sonnet', costPer1k: 0.003 },
    'gemini-pro': { provider: 'google', name: 'Gemini Pro', costPer1k: 0.0005 },
    'gemini-ultra': { provider: 'google', name: 'Gemini Ultra', costPer1k: 0.002 }
};

class CommandParser {
    constructor(storage) {
        this.storage = storage;
    }

    parse(input) {
        const trimmed = input.trim().toLowerCase();

        if (trimmed === 'help') return this.showHelp();
        if (trimmed === 'list apps') return this.listApps();
        if (trimmed === 'list models') return this.listModels();
        if (trimmed.startsWith('show config')) return this.showConfig(trimmed);
        if (trimmed.startsWith('config ')) return this.configureApp(input);
        if (trimmed.startsWith('export')) return this.exportConfig(trimmed);
        if (trimmed === 'clear') return { success: true, output: '', clear: true };

        // CRM commands
        if (trimmed === 'crm contacts') return this.crmListContacts();
        if (trimmed === 'crm deals') return this.crmListDeals();
        if (trimmed === 'crm stats') return this.crmStats();
        if (trimmed === 'wallet status') return this.walletStatus();

        return { success: false, output: `Unknown: ${input}\nType 'help' for commands` };
    }

    showHelp() {
        return {
            success: true,
            output: `Commands:
  config <app> --primary <model> --fallback <model>
  list apps | list models
  show config <app> | export <app>
  clear | help

  CRM Commands:
  crm contacts        List all contacts
  crm deals           Show deal pipeline summary
  crm stats           CRM statistics
  wallet status       Connected wallet info`
        };
    }

    listApps() {
        const apps = this.storage.getApps();
        return { success: true, output: `Apps:\n${apps.map(a => `  • ${a.name} (${a.id})`).join('\n')}` };
    }

    listModels() {
        return {
            success: true,
            output: `Models:\n${Object.entries(MODELS).map(([k, m]) =>
                `  • ${k.padEnd(18)} $${m.costPer1k.toFixed(4)}/1k`
            ).join('\n')}`
        };
    }

    showConfig(input) {
        const appId = input.replace('show config', '').trim();
        if (!appId) return { success: false, output: 'Usage: show config <app>' };

        const app = this.storage.getApps().find(a => a.id === appId);
        if (!app) return { success: false, output: `Not found: ${appId}` };

        return {
            success: true,
            output: `${app.name}:\n  Primary:  ${app.primaryModel.model}\n  Fallback: ${app.fallbackModel.model}`
        };
    }

    configureApp(input) {
        const parts = input.split(/\s+/);
        const appId = parts[1];
        const primaryIdx = parts.indexOf('--primary');
        const fallbackIdx = parts.indexOf('--fallback');

        if (!appId || primaryIdx === -1 || fallbackIdx === -1) {
            return { success: false, output: 'Usage: config <app> --primary <model> --fallback <model>' };
        }

        const primaryModel = parts[primaryIdx + 1];
        const fallbackModel = parts[fallbackIdx + 1];

        if (!MODELS[primaryModel] || !MODELS[fallbackModel]) {
            return { success: false, output: 'Invalid model. Use "list models"' };
        }

        const apps = this.storage.getApps();
        const appIndex = apps.findIndex(a => a.id === appId);
        if (appIndex === -1) return { success: false, output: `Not found: ${appId}` };

        apps[appIndex].primaryModel = {
            provider: MODELS[primaryModel].provider,
            model: primaryModel,
            costPer1k: MODELS[primaryModel].costPer1k
        };
        apps[appIndex].fallbackModel = {
            provider: MODELS[fallbackModel].provider,
            model: fallbackModel,
            costPer1k: MODELS[fallbackModel].costPer1k
        };

        this.storage.saveApps(apps);
        return { success: true, output: `✓ ${apps[appIndex].name} configured` };
    }

    exportConfig(input) {
        const appId = input.replace('export', '').trim();
        if (!appId) return { success: false, output: 'Usage: export <app>' };

        const app = this.storage.getApps().find(a => a.id === appId);
        if (!app) return { success: false, output: `Not found: ${appId}` };

        const blob = new Blob([JSON.stringify(app, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${appId}-config.json`;
        a.click();
        URL.revokeObjectURL(url);

        return { success: true, output: `✓ Exported ${appId}-config.json` };
    }

    crmListContacts() {
        const contacts = this.storage.getCRMContacts().filter(c => c.active !== false);
        if (contacts.length === 0) return { success: true, output: 'No contacts yet. Use the CRM tab to add contacts.' };
        return {
            success: true,
            output: `Contacts (${contacts.length}):\n${contacts.slice(0, 10).map(c =>
                `  • ${c.name.padEnd(22)} ${(c.company || '—').padEnd(18)} ${c.email || '—'}`
            ).join('\n')}`
        };
    }

    crmListDeals() {
        const deals = this.storage.getCRMDeals();
        if (deals.length === 0) return { success: true, output: 'No deals yet. Use the CRM tab to add deals.' };
        const stageCounts = deals.reduce((acc, d) => { acc[d.stage] = (acc[d.stage] || 0) + 1; return acc; }, {});
        return {
            success: true,
            output: `Deals Pipeline:\n${Object.entries(stageCounts).map(([s, n]) =>
                `  ${s.padEnd(14)} ${n} deal${n !== 1 ? 's' : ''}`
            ).join('\n')}`
        };
    }

    crmStats() {
        const contacts  = this.storage.getCRMContacts().filter(c => c.active !== false).length;
        const deals     = this.storage.getCRMDeals();
        const open      = deals.filter(d => !['closedwon','closedlost'].includes(d.stage)).length;
        const won       = deals.filter(d => d.stage === 'closedwon').length;
        const activities = this.storage.getCRMActivities().length;
        const chainTxs  = this.storage.getChainTxs().length;
        return {
            success: true,
            output: `CRM Stats:\n  Contacts:   ${contacts}\n  Open Deals: ${open}\n  Closed Won: ${won}\n  Activities: ${activities}\n  Chain TXs:  ${chainTxs}`
        };
    }

    walletStatus() {
        const wallet = this.storage.getWallet();
        if (!wallet) return { success: false, output: 'No wallet connected. Go to the Wallet tab.' };
        return {
            success: true,
            output: `Wallet Connected:\n  Address: ${wallet.address}\n  Balance: ${wallet.balance || '—'} CRMC\n  Staked:  ${wallet.staked || '—'} CRMC`
        };
    }
}

class AppController {
    constructor() {
        this.storage = new StorageService();
        this.parser = new CommandParser(this.storage);
        this.init();
    }

    init() {
        this.setupHero();
        this.setupNavigation();
        this.setupTerminal();
        this.setupConfiguration();
        this.setupSettings();
        this.setupActivityLog();
        this.loadDashboardData();
    }

    setupHero() {
        const spotlight = document.getElementById('spotlight');
        const hero = document.getElementById('hero');
        const enterBtn = document.getElementById('enter-btn');

        hero.addEventListener('mousemove', (e) => {
            const x = e.clientX - 400;
            const y = e.clientY - 400;
            spotlight.style.transform = `translate(${x}px, ${y}px)`;
        });

        const text = "Your AI. Your Rules.";
        const typewriter = document.getElementById('typewriter');
        let i = 0;
        const type = () => {
            if (i < text.length) {
                typewriter.textContent = text.substring(0, i + 1);
                i++;
                setTimeout(type, 100);
            }
        };
        type();

        enterBtn.addEventListener('click', () => {
            hero.style.display = 'none';
            document.getElementById('app').classList.add('active');
        });
    }

    setupNavigation() {
        const navTabs = document.querySelectorAll('.nav-tab');
        const views = document.querySelectorAll('.view');

        navTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const viewId = tab.dataset.view;

                navTabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');

                views.forEach(v => v.classList.remove('active'));
                document.getElementById(`view-${viewId}`).classList.add('active');
            });
        });
    }

    setupTerminal() {
        const input = document.getElementById('terminal-input');
        const output = document.getElementById('terminal-output');
        const clearBtn = document.getElementById('clear-terminal');

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                const command = input.value.trim();
                if (command) {
                    this.executeCommand(command);
                    input.value = '';
                }
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                const history = this.storage.getHistory();
                if (history.length > 0) {
                    input.value = history[history.length - 1].command;
                }
            }
        });

        clearBtn.addEventListener('click', () => {
            output.innerHTML = `
                <div class="terminal-line welcome">Welcome to API Command Center</div>
                <div class="terminal-line muted">Type 'help' for commands</div>
                <div class="terminal-line muted">─────────────────────────────────</div>
            `;
        });
    }

    executeCommand(command) {
        const output = document.getElementById('terminal-output');

        const commandLine = document.createElement('div');
        commandLine.className = 'terminal-line';
        commandLine.textContent = `$ ${command}`;
        output.appendChild(commandLine);

        const result = this.parser.parse(command);

        if (result.clear) {
            output.innerHTML = '';
            return;
        }

        const resultLine = document.createElement('div');
        resultLine.className = `terminal-line ${result.success ? 'success' : 'error'}`;
        resultLine.innerHTML = `<pre>${result.output}</pre>`;
        output.appendChild(resultLine);

        output.scrollTop = output.scrollHeight;
        this.storage.addToHistory(command, result.output, result.success);

        if (command.startsWith('config ')) {
            this.loadConfigurationData();
        }
    }

    setupConfiguration() {
        const exportBtn = document.getElementById('export-config');

        exportBtn.addEventListener('click', () => {
            const apps = this.storage.getApps();
            const blob = new Blob([JSON.stringify(apps, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'api-command-config.json';
            a.click();
            URL.revokeObjectURL(url);
        });

        this.loadConfigurationData();
    }

    loadConfigurationData() {
        const apps = this.storage.getApps();
        const container = document.getElementById('config-apps');

        container.innerHTML = apps.map(app => `
            <div class="config-card">
                <div class="config-card-header">
                    <div class="config-icon">${app.icon}</div>
                    <div class="config-card-title">
                        <h3>${app.name}</h3>
                        <p>${app.description}</p>
                    </div>
                </div>
                <div class="config-models">
                    <div class="model-select">
                        <label>Primary Model</label>
                        <select data-app="${app.id}" data-type="primary">
                            ${Object.keys(MODELS).map(key =>
            `<option value="${key}" ${app.primaryModel.model === key ? 'selected' : ''}>
                                    ${MODELS[key].name} ($${MODELS[key].costPer1k}/1k)
                                </option>`
        ).join('')}
                        </select>
                    </div>
                    <div class="model-select">
                        <label>Fallback Model</label>
                        <select data-app="${app.id}" data-type="fallback">
                            ${Object.keys(MODELS).map(key =>
            `<option value="${key}" ${app.fallbackModel.model === key ? 'selected' : ''}>
                                    ${MODELS[key].name} ($${MODELS[key].costPer1k}/1k)
                                </option>`
        ).join('')}
                        </select>
                    </div>
                </div>
                <div class="config-command">
                    $ config ${app.id} --primary ${app.primaryModel.model} --fallback ${app.fallbackModel.model}
                </div>
                <div class="config-card-actions">
                    <button class="btn-secondary" onclick="app.copyCommand('${app.id}')">Copy</button>
                    <button class="btn-primary" onclick="app.applyConfig('${app.id}')">Apply</button>
                </div>
            </div>
        `).join('');

        container.querySelectorAll('select').forEach(select => {
            select.addEventListener('change', (e) => {
                const appId = e.target.dataset.app;
                this.updateCommandPreview(appId);
            });
        });
    }

    updateCommandPreview(appId) {
        const card = document.querySelector(`[data-app="${appId}"]`).closest('.config-card');
        const primary = card.querySelector('[data-type="primary"]').value;
        const fallback = card.querySelector('[data-type="fallback"]').value;
        card.querySelector('.config-command').textContent = `$ config ${appId} --primary ${primary} --fallback ${fallback}`;
    }

    copyCommand(appId) {
        const card = document.querySelector(`[data-app="${appId}"]`).closest('.config-card');
        const command = card.querySelector('.config-command').textContent.replace('$ ', '');
        navigator.clipboard.writeText(command);

        const btn = card.querySelector('.btn-secondary');
        const originalText = btn.textContent;
        btn.textContent = 'Copied!';
        setTimeout(() => btn.textContent = originalText, 2000);
    }

    applyConfig(appId) {
        const card = document.querySelector(`[data-app="${appId}"]`).closest('.config-card');
        const primary = card.querySelector('[data-type="primary"]').value;
        const fallback = card.querySelector('[data-type="fallback"]').value;
        const command = `config ${appId} --primary ${primary} --fallback ${fallback}`;

        const result = this.parser.parse(command);

        const btn = card.querySelector('.btn-primary');
        const originalText = btn.textContent;
        btn.textContent = result.success ? '✓ Applied' : '✗ Failed';
        setTimeout(() => btn.textContent = originalText, 2000);
    }

    setupSettings() {
        const emailInput = document.getElementById('user-email');
        const apiKeyInput = document.getElementById('api-key');
        const providerSelect = document.getElementById('provider-select');
        const toggleKeyBtn = document.getElementById('toggle-key');
        const saveSettingsBtn = document.getElementById('save-settings');
        const fetchQuotaBtn = document.getElementById('fetch-quota');

        // Load saved settings
        const settings = this.storage.getSettings();
        if (settings.email) emailInput.value = settings.email;
        if (settings.apiKey) apiKeyInput.value = settings.apiKey;
        if (settings.provider) providerSelect.value = settings.provider;

        // Toggle API key visibility
        toggleKeyBtn.addEventListener('click', () => {
            const type = apiKeyInput.type === 'password' ? 'text' : 'password';
            apiKeyInput.type = type;
        });

        // Save settings
        saveSettingsBtn.addEventListener('click', () => {
            const settings = {
                email: emailInput.value,
                apiKey: apiKeyInput.value,
                provider: providerSelect.value
            };
            this.storage.saveSettings(settings);

            const originalText = saveSettingsBtn.textContent;
            saveSettingsBtn.textContent = '✓ Saved';
            setTimeout(() => saveSettingsBtn.textContent = originalText, 2000);
        });

        // Fetch quota
        fetchQuotaBtn.addEventListener('click', async () => {
            const email = emailInput.value;
            const apiKey = apiKeyInput.value;
            const provider = providerSelect.value;

            if (!email || !apiKey) {
                alert('Please enter both email and API key');
                return;
            }

            fetchQuotaBtn.disabled = true;
            fetchQuotaBtn.textContent = 'Fetching...';

            try {
                // Simulate API call (replace with real API integration)
                const quota = await this.fetchQuotaFromProvider(provider, apiKey, email);

                // Display quota
                document.getElementById('quota-display').style.display = 'grid';
                document.getElementById('quota-total').textContent = this.formatNumber(quota.total);
                document.getElementById('quota-used').textContent = this.formatNumber(quota.used);
                document.getElementById('quota-remaining').textContent = this.formatNumber(quota.remaining);

                // Save quota data
                this.storage.saveQuota(quota);

                // Update dashboard stats
                const stats = this.storage.getStats();
                stats.tokensAvailable = quota.total;
                stats.tokensUsed = quota.used;
                this.storage.saveStats(stats);
                this.loadDashboardData();

                fetchQuotaBtn.textContent = '✓ Fetched';
            } catch (error) {
                alert('Failed to fetch quota: ' + error.message);
                fetchQuotaBtn.textContent = 'Fetch Quota';
            } finally {
                fetchQuotaBtn.disabled = false;
                setTimeout(() => fetchQuotaBtn.textContent = 'Fetch Quota', 2000);
            }
        });

        // Load and display saved quota if available
        const savedQuota = this.storage.getQuota();
        if (savedQuota.total) {
            document.getElementById('quota-display').style.display = 'grid';
            document.getElementById('quota-total').textContent = this.formatNumber(savedQuota.total);
            document.getElementById('quota-used').textContent = this.formatNumber(savedQuota.used);
            document.getElementById('quota-remaining').textContent = this.formatNumber(savedQuota.remaining);
        }
    }

    async fetchQuotaFromProvider(provider, apiKey, email) {
        // Simulate API call with mock data
        // In production, replace with real API calls to OpenAI, Anthropic, Google
        return new Promise((resolve) => {
            setTimeout(() => {
                const mockQuota = {
                    openai: { total: 1000000, used: 678432, remaining: 321568 },
                    anthropic: { total: 500000, used: 234567, remaining: 265433 },
                    google: { total: 2000000, used: 987654, remaining: 1012346 }
                };
                resolve(mockQuota[provider] || mockQuota.openai);
            }, 1500);
        });

        /* 
        // Example real implementation for OpenAI:
        const response = await fetch('https://api.openai.com/v1/usage', {
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            }
        });
        const data = await response.json();
        return {
            total: data.hard_limit_usd * 1000000, // Convert to tokens
            used: data.total_usage,
            remaining: (data.hard_limit_usd * 1000000) - data.total_usage
        };
        */
    }

    setupActivityLog() {
        const exportBtn = document.getElementById('export-activity');

        exportBtn.addEventListener('click', () => {
            this.exportActivityCSV();
        });

        this.loadActivityLog();
    }

    loadActivityLog() {
        const activity = this.storage.getActivity();
        const container = document.getElementById('activity-log');

        if (activity.length === 0) {
            container.innerHTML = '<div class="terminal-line muted">No recent activity</div>';
            return;
        }

        container.innerHTML = activity.slice(0, 10).map(item => {
            const time = new Date(item.timestamp);
            const timeStr = time.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            });
            const dateStr = time.toLocaleDateString('en-US', {
                month: '2-digit',
                day: '2-digit'
            });

            const statusIcon = item.status === 'success'
                ? '<div class="status-icon success">✓</div>'
                : '<div class="status-icon error">✗</div>';

            return `
                <div class="activity-item">
                    <div class="activity-time">${dateStr} ${timeStr}</div>
                    <div class="activity-model">${item.model}</div>
                    <div class="activity-tokens">${this.formatNumber(item.tokens)} tokens</div>
                    <div class="activity-status">${statusIcon}</div>
                </div>
            `;
        }).join('');
    }

    exportActivityCSV() {
        const activity = this.storage.getActivity();
        const headers = ['Timestamp', 'Model', 'Tokens', 'Cost', 'Status'];
        const rows = activity.map(item => [
            item.timestamp,
            item.model,
            item.tokens,
            item.cost,
            item.status
        ]);

        const csv = [
            headers.join(','),
            ...rows.map(row => row.join(','))
        ].join('\n');

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `activity-export-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    }

    loadDashboardData() {
        const stats = this.storage.getStats();

        this.animateCounter('total-calls', stats.totalCalls);
        document.getElementById('calls-trend').textContent = `${stats.callsTrend}%`;
        document.getElementById('tokens-used').textContent = this.formatNumber(stats.tokensUsed);
        document.getElementById('tokens-available').textContent = `of ${this.formatNumber(stats.tokensAvailable)}`;
        document.getElementById('total-cost').textContent = stats.totalCost.toFixed(2);
        document.getElementById('success-rate').textContent = `${stats.successRate}%`;
        document.getElementById('uptime').textContent = `${stats.uptime}% uptime`;
    }

    animateCounter(id, target) {
        const element = document.getElementById(id);
        const duration = 2000;
        const increment = target / (duration / 16);
        let current = 0;

        const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
                element.textContent = this.formatNumber(target);
                clearInterval(timer);
            } else {
                element.textContent = this.formatNumber(Math.floor(current));
            }
        }, 16);
    }

    formatNumber(num) {
        return num.toLocaleString();
    }
}

const app = new AppController();

// ============================================
// CRM Controller
// ============================================

class CRMController {
    constructor(storage) {
        this.storage = storage;
        this.init();
    }

    init() {
        this.setupSidebarNav();
        this.setupContactsPanel();
        this.setupDealsPanel();
        this.setupActivitiesPanel();
        this.setupOnChainPanel();
        this.renderContacts();
        this.renderPipeline();
        this.renderActivityFeed();
        this.renderOnChain();
    }

    // ── Sidebar navigation ────────────────────────────────────────────────────

    setupSidebarNav() {
        document.querySelectorAll('.crm-nav-item').forEach(item => {
            item.addEventListener('click', () => {
                document.querySelectorAll('.crm-nav-item').forEach(i => i.classList.remove('active'));
                item.classList.add('active');
                const panel = item.dataset.crmPanel;
                document.querySelectorAll('.crm-panel').forEach(p => p.classList.remove('active'));
                document.getElementById(`crm-panel-${panel}`)?.classList.add('active');
            });
        });
    }

    // ── Contacts panel ────────────────────────────────────────────────────────

    setupContactsPanel() {
        document.getElementById('new-contact-btn').addEventListener('click', () => {
            document.getElementById('modal-contact').classList.remove('hidden');
            document.getElementById('contact-name').focus();
        });

        ['close-contact-modal', 'cancel-contact'].forEach(id => {
            document.getElementById(id).addEventListener('click', () => {
                document.getElementById('modal-contact').classList.add('hidden');
                this.clearContactForm();
            });
        });

        document.getElementById('save-contact').addEventListener('click', () => this.saveContact());

        document.getElementById('contact-search').addEventListener('input', e => {
            this.renderContacts(e.target.value);
        });
    }

    clearContactForm() {
        ['contact-name','contact-email','contact-phone','contact-company','contact-tags','contact-wallet','contact-did']
            .forEach(id => { document.getElementById(id).value = ''; });
    }

    saveContact() {
        const name = document.getElementById('contact-name').value.trim();
        if (!name) { alert('Name is required'); return; }

        const contact = {
            id:            crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36),
            name,
            email:         document.getElementById('contact-email').value.trim(),
            phone:         document.getElementById('contact-phone').value.trim(),
            company:       document.getElementById('contact-company').value.trim(),
            tags:          document.getElementById('contact-tags').value.split(',').map(t => t.trim()).filter(Boolean),
            walletAddress: document.getElementById('contact-wallet').value.trim(),
            didUri:        document.getElementById('contact-did').value.trim(),
            active:        true,
            createdAt:     new Date().toISOString(),
            updatedAt:     new Date().toISOString(),
            onChainId:     null,
            dataHash:      null,
            txHash:        null,
        };

        // Simulate on-chain hash (browser-side keccak256 substitute using SHA-256)
        const payload = JSON.stringify({ name, email: contact.email, company: contact.company });
        this.sha256(payload).then(hash => {
            contact.dataHash = hash;
            this.storage.addCRMContact(contact);
            // Record simulated tx
            this.storage.addChainTx({
                type:      'ContactRegistered',
                hash:      hash.slice(0, 10) + '…',
                entity:    name,
                timestamp: new Date().toISOString(),
                simulated: true,
            });
            document.getElementById('modal-contact').classList.add('hidden');
            this.clearContactForm();
            this.renderContacts();
            this.updateBadges();
            this.renderOnChain();
        });
    }

    renderContacts(search = '') {
        const contacts = this.storage.getCRMContacts()
            .filter(c => c.active !== false)
            .filter(c => !search || [c.name, c.email, c.company].some(f => f && f.toLowerCase().includes(search.toLowerCase())));

        const tbody = document.getElementById('contacts-tbody');
        const empty = document.getElementById('contacts-empty');

        if (contacts.length === 0) {
            tbody.innerHTML = '';
            empty.style.display = 'flex';
            return;
        }
        empty.style.display = 'none';

        tbody.innerHTML = contacts.map(c => {
            const initials = c.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0,2);
            const tags     = (c.tags || []).map(t => `<span class="crm-tag">${this.escapeHtml(t)}</span>`).join('');
            const chainBadge = c.txHash
                ? `<span class="chain-badge"><span class="chain-dot"></span>Hashed</span>`
                : `<span style="color:var(--text-muted);font-size:0.75rem;">—</span>`;
            const date = new Date(c.createdAt).toLocaleDateString('en-US', { month:'short', day:'numeric' });

            return `<tr data-contact-id="${c.id}">
                <td class="name-cell">
                    <span class="crm-avatar">${initials}</span>${this.escapeHtml(c.name)}
                </td>
                <td>${this.escapeHtml(c.company || '—')}</td>
                <td>${this.escapeHtml(c.email || '—')}</td>
                <td>${tags || '<span style="color:var(--text-muted)">—</span>'}</td>
                <td>${chainBadge}</td>
                <td>${date}</td>
            </tr>`;
        }).join('');

        this.updateBadges();
    }

    // ── Deals panel ───────────────────────────────────────────────────────────

    setupDealsPanel() {
        document.getElementById('new-deal-btn').addEventListener('click', () => {
            this.populateDealContactSelect();
            document.getElementById('modal-deal').classList.remove('hidden');
            document.getElementById('deal-title').focus();
        });

        ['close-deal-modal', 'cancel-deal'].forEach(id => {
            document.getElementById(id).addEventListener('click', () => {
                document.getElementById('modal-deal').classList.add('hidden');
                this.clearDealForm();
            });
        });

        document.getElementById('save-deal').addEventListener('click', () => this.saveDeal());
    }

    populateDealContactSelect() {
        const sel = document.getElementById('deal-contact');
        const contacts = this.storage.getCRMContacts().filter(c => c.active !== false);
        sel.innerHTML = '<option value="">— None —</option>' +
            contacts.map(c => `<option value="${c.id}">${this.escapeHtml(c.name)}</option>`).join('');
    }

    clearDealForm() {
        ['deal-title','deal-value','deal-assignee','deal-notes'].forEach(id => { document.getElementById(id).value = ''; });
        document.getElementById('deal-stage').value = 'lead';
    }

    saveDeal() {
        const title = document.getElementById('deal-title').value.trim();
        if (!title) { alert('Title is required'); return; }

        const deal = {
            id:         crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36),
            title,
            value:      parseFloat(document.getElementById('deal-value').value) || 0,
            stage:      document.getElementById('deal-stage').value,
            contactId:  document.getElementById('deal-contact').value || null,
            assignedTo: document.getElementById('deal-assignee').value.trim() || null,
            notes:      document.getElementById('deal-notes').value.trim(),
            active:     true,
            createdAt:  new Date().toISOString(),
            updatedAt:  new Date().toISOString(),
            onChainId:  null,
            txHash:     null,
        };

        const payload = JSON.stringify({ title, value: deal.value, stage: deal.stage });
        this.sha256(payload).then(hash => {
            deal.dataHash = hash;
            this.storage.addCRMDeal(deal);
            this.storage.addChainTx({
                type:      'DealCreated',
                hash:      hash.slice(0, 10) + '…',
                entity:    title,
                timestamp: new Date().toISOString(),
                simulated: true,
            });
            document.getElementById('modal-deal').classList.add('hidden');
            this.clearDealForm();
            this.renderPipeline();
            this.updateBadges();
            this.renderOnChain();
        });
    }

    renderPipeline() {
        const STAGES = [
            { key: 'lead',        label: 'Lead' },
            { key: 'qualified',   label: 'Qualified' },
            { key: 'proposal',    label: 'Proposal' },
            { key: 'negotiation', label: 'Negotiation' },
            { key: 'closedwon',   label: 'Closed Won' },
            { key: 'closedlost',  label: 'Closed Lost' },
        ];

        const deals    = this.storage.getCRMDeals();
        const contacts = this.storage.getCRMContacts();
        const board    = document.getElementById('pipeline-board');

        board.innerHTML = STAGES.map(stage => {
            const stageDels = deals.filter(d => d.stage === stage.key);
            const totalVal  = stageDels.reduce((s, d) => s + (d.value || 0), 0);
            const cards     = stageDels.map(d => {
                const contact = contacts.find(c => c.id === d.contactId);
                const valStr  = d.value ? `$${d.value.toLocaleString()}` : 'No value';
                return `<div class="pipeline-card" data-deal-id="${d.id}" onclick="crmController.openDealDetail('${d.id}')">
                    <div class="pipeline-card-title">${this.escapeHtml(d.title)}</div>
                    <div class="pipeline-card-value">${valStr}</div>
                    ${contact ? `<div class="pipeline-card-contact">👤 ${this.escapeHtml(contact.name)}</div>` : ''}
                </div>`;
            }).join('');

            return `<div class="pipeline-column">
                <div class="pipeline-col-header">
                    <div class="pipeline-col-title">${stage.label}</div>
                    <div class="pipeline-col-count">${stageDels.length} deal${stageDels.length !== 1 ? 's' : ''} · $${totalVal.toLocaleString()}</div>
                </div>
                <div class="pipeline-cards">${cards}</div>
            </div>`;
        }).join('');

        this.updateBadges();
    }

    openDealDetail(dealId) {
        const deal = this.storage.getCRMDeals().find(d => d.id === dealId);
        if (!deal) return;
        const STAGE_LABELS = ['Lead','Qualified','Proposal','Negotiation','Closed Won','Closed Lost'];
        const STAGE_KEYS   = ['lead','qualified','proposal','negotiation','closedwon','closedlost'];
        const currentIdx   = STAGE_KEYS.indexOf(deal.stage);
        const nextStages   = STAGE_KEYS.slice(currentIdx + 1).filter(s => !['closedwon','closedlost'].includes(deal.stage) || true);

        const msg = `Deal: ${deal.title}\nValue: $${(deal.value || 0).toLocaleString()}\nStage: ${STAGE_LABELS[currentIdx] || deal.stage}\n\nAdvance to next stage? (or Cancel)`;
        if (!confirm(msg)) return;

        if (currentIdx < STAGE_KEYS.length - 1) {
            const deals = this.storage.getCRMDeals();
            const idx   = deals.findIndex(d => d.id === dealId);
            const newStage = STAGE_KEYS[currentIdx + 1];
            if (idx !== -1) {
                deals[idx].stage     = newStage;
                deals[idx].updatedAt = new Date().toISOString();
                deals[idx].active    = !['closedwon','closedlost'].includes(newStage);
                this.storage.saveCRMDeals(deals);

                const notesHash = `stage:${newStage}:${Date.now()}`;
                this.storage.addChainTx({
                    type:      'DealStageAdvanced',
                    hash:      notesHash.slice(0, 12) + '…',
                    entity:    `${deal.title} → ${STAGE_LABELS[currentIdx + 1]}`,
                    timestamp: new Date().toISOString(),
                    simulated: true,
                });
                this.renderPipeline();
                this.renderOnChain();
            }
        }
    }

    // ── Activities panel ──────────────────────────────────────────────────────

    setupActivitiesPanel() {
        document.getElementById('new-activity-btn').addEventListener('click', () => {
            this.populateActivitySelects();
            document.getElementById('modal-activity').classList.remove('hidden');
            document.getElementById('activity-summary').focus();
        });

        ['close-activity-modal', 'cancel-activity'].forEach(id => {
            document.getElementById(id).addEventListener('click', () => {
                document.getElementById('modal-activity').classList.add('hidden');
            });
        });

        document.getElementById('save-activity').addEventListener('click', () => this.saveActivity());
    }

    populateActivitySelects() {
        const contacts = this.storage.getCRMContacts().filter(c => c.active !== false);
        const deals    = this.storage.getCRMDeals().filter(d => d.active !== false);
        const cSel     = document.getElementById('activity-contact');
        const dSel     = document.getElementById('activity-deal');
        cSel.innerHTML = '<option value="">— None —</option>' + contacts.map(c => `<option value="${c.id}">${this.escapeHtml(c.name)}</option>`).join('');
        dSel.innerHTML = '<option value="">— None —</option>' + deals.map(d => `<option value="${d.id}">${this.escapeHtml(d.title)}</option>`).join('');
    }

    saveActivity() {
        const summary = document.getElementById('activity-summary').value.trim();
        if (!summary) { alert('Summary is required'); return; }

        const type      = document.getElementById('activity-type').value;
        const contactId = document.getElementById('activity-contact').value || null;
        const dealId    = document.getElementById('activity-deal').value || null;

        const ICONS = { call:'📞', email:'📧', meeting:'🤝', note:'📝', apiUsage:'⚡', dealUpdate:'📊', custom:'✏️' };

        const entry = {
            id:         crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36),
            type,
            icon:       ICONS[type] || '✏️',
            summary,
            contactId,
            dealId,
            actor:      'You',
            createdAt:  new Date().toISOString(),
            txHash:     null,
            payloadHash: null,
        };

        const payload = JSON.stringify({ type, summary, contactId, dealId, createdAt: entry.createdAt });
        this.sha256(payload).then(hash => {
            entry.payloadHash = hash;
            this.storage.addCRMActivity(entry);
            this.storage.addChainTx({
                type:      'ActivityLogged',
                hash:      hash.slice(0, 10) + '…',
                entity:    summary,
                timestamp: entry.createdAt,
                simulated: true,
            });
            document.getElementById('modal-activity').classList.add('hidden');
            document.getElementById('activity-summary').value = '';
            this.renderActivityFeed();
            this.renderOnChain();
        });
    }

    renderActivityFeed() {
        const activities = this.storage.getCRMActivities();
        const container  = document.getElementById('activity-feed');
        const contacts   = this.storage.getCRMContacts();
        const deals      = this.storage.getCRMDeals();

        if (activities.length === 0) {
            container.innerHTML = `<div class="crm-empty"><div class="crm-empty-icon">📋</div><p>No activities yet. Log your first interaction.</p></div>`;
            return;
        }

        container.innerHTML = activities.slice(0, 50).map(a => {
            const contact = a.contactId ? contacts.find(c => c.id === a.contactId) : null;
            const deal    = a.dealId    ? deals.find(d => d.id === a.dealId)       : null;
            const time    = new Date(a.createdAt).toLocaleString('en-US', { month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' });
            const meta    = [contact && `👤 ${contact.name}`, deal && `💼 ${deal.title}`].filter(Boolean).join(' · ');
            const hashLine = a.payloadHash ? `<div class="activity-feed-hash">⛓ ${a.payloadHash.slice(0,20)}… (simulated)</div>` : '';

            return `<div class="activity-feed-item">
                <div class="activity-feed-icon">${a.icon || '📋'}</div>
                <div class="activity-feed-body">
                    <div class="activity-feed-title">${this.escapeHtml(a.summary)}</div>
                    <div class="activity-feed-meta">${time}${meta ? ' · ' + meta : ''}</div>
                    ${hashLine}
                </div>
            </div>`;
        }).join('');
    }

    // ── On-Chain panel ────────────────────────────────────────────────────────

    setupOnChainPanel() { /* reads from storage only */ }

    renderOnChain() {
        const contacts  = this.storage.getCRMContacts().filter(c => c.dataHash).length;
        const deals     = this.storage.getCRMDeals().filter(d => d.dataHash).length;
        const activities = this.storage.getCRMActivities().filter(a => a.payloadHash).length;

        document.getElementById('chain-contacts').textContent  = contacts;
        document.getElementById('chain-deals').textContent     = deals;
        document.getElementById('chain-activities').textContent = activities;

        const txs = this.storage.getChainTxs();
        const log = document.getElementById('chain-tx-log');
        log.innerHTML = txs.slice(0, 20).map(tx => {
            const time = new Date(tx.timestamp).toLocaleString('en-US', { month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' });
            return `<div class="invoice-row">
                <span class="invoice-token-id">${tx.type}</span>
                <span style="flex:1;font-size:0.8rem;color:var(--text-secondary);">${this.escapeHtml(tx.entity)}</span>
                <span style="font-family:var(--font-mono);font-size:0.7rem;color:var(--text-muted);">${tx.hash}</span>
                <span style="font-size:0.75rem;color:var(--text-muted);">${time}</span>
                ${tx.simulated ? '<span class="chain-badge" style="margin-left:8px;">Sim</span>' : '<span class="chain-badge"><span class="chain-dot"></span>Live</span>'}
            </div>`;
        }).join('') || `<div class="crm-empty"><div class="crm-empty-icon">⛓</div><p>No on-chain transactions yet.</p></div>`;
    }

    // ── Badges ────────────────────────────────────────────────────────────────

    updateBadges() {
        const contactCount = this.storage.getCRMContacts().filter(c => c.active !== false).length;
        const dealCount    = this.storage.getCRMDeals().filter(d => d.active !== false).length;
        document.getElementById('contact-count-badge').textContent = contactCount;
        document.getElementById('deal-count-badge').textContent    = dealCount;
    }

    // ── Utilities ─────────────────────────────────────────────────────────────

    escapeHtml(str) {
        if (!str) return '';
        return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');
    }

    async sha256(message) {
        const msgBuffer = new TextEncoder().encode(message);
        const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
        const hashArray  = Array.from(new Uint8Array(hashBuffer));
        return '0x' + hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }
}

// ============================================
// Wallet Controller (ethers.js via CDN)
// ============================================

class WalletController {
    constructor(storage) {
        this.storage  = storage;
        this.provider = null;
        this.signer   = null;
        this.address  = null;
        this.init();
    }

    init() {
        this.setupWalletUI();
        this.restoreSession();
    }

    setupWalletUI() {
        document.getElementById('connect-wallet-btn').addEventListener('click', () => this.connectWallet());
        document.getElementById('disconnect-wallet-btn').addEventListener('click', () => this.disconnectWallet());
        document.getElementById('sign-message-btn').addEventListener('click', () => this.signInWithEthereum());
    }

    restoreSession() {
        const saved = this.storage.getWallet();
        if (saved?.address) {
            this.address = saved.address;
            this.showConnectedState(saved.address);
            this.refreshBalances(saved);
        }
    }

    async connectWallet() {
        if (typeof window.ethereum === 'undefined') {
            alert('MetaMask is not installed. Please install MetaMask to connect a wallet.\n\nhttps://metamask.io');
            return;
        }

        try {
            const ethers   = window.ethers;
            this.provider  = new ethers.BrowserProvider(window.ethereum);
            const accounts = await this.provider.send('eth_requestAccounts', []);
            this.signer    = await this.provider.getSigner();
            this.address   = accounts[0];

            this.showConnectedState(this.address);
            this.storage.saveWallet({ address: this.address, connectedAt: new Date().toISOString() });

            // Listen for account changes
            window.ethereum.on('accountsChanged', accs => {
                if (accs.length === 0) this.disconnectWallet();
                else { this.address = accs[0]; this.showConnectedState(accs[0]); }
            });
        } catch (err) {
            console.error('Wallet connect error:', err);
            alert('Failed to connect wallet: ' + (err.message || err));
        }
    }

    disconnectWallet() {
        this.provider = null;
        this.signer   = null;
        this.address  = null;
        this.storage.saveWallet(null);
        document.getElementById('wallet-not-connected').style.display = 'block';
        document.getElementById('wallet-connected').style.display     = 'none';
        this.resetBalanceUI();
    }

    showConnectedState(address) {
        document.getElementById('wallet-not-connected').style.display = 'none';
        document.getElementById('wallet-connected').style.display     = 'block';
        document.getElementById('wallet-address-display').textContent = address;
    }

    resetBalanceUI() {
        ['credit-balance','staked-balance','invoice-count'].forEach(id => {
            document.getElementById(id).textContent = '—';
        });
        document.getElementById('invoices-list').innerHTML = '';
        document.getElementById('invoices-empty').style.display = 'flex';
    }

    refreshBalances(savedWallet) {
        // When not connected to a real contract, show data from localStorage
        document.getElementById('credit-balance').textContent  = savedWallet.balance  || '0';
        document.getElementById('staked-balance').textContent  = savedWallet.staked   || '0';
        document.getElementById('invoice-count').textContent   = savedWallet.invoices || '0';
        this.renderInvoices();
    }

    renderInvoices() {
        // In production this reads from InvoiceNFT contract via The Graph.
        // For demo we show mock data or localStorage invoices.
        const invoices = this.getMockInvoices();
        const list     = document.getElementById('invoices-list');
        const empty    = document.getElementById('invoices-empty');

        if (invoices.length === 0) {
            list.innerHTML = '';
            empty.style.display = 'flex';
            return;
        }
        empty.style.display = 'none';
        list.innerHTML = invoices.map(inv => `
            <div class="invoice-row">
                <span class="invoice-token-id">#${inv.tokenId}</span>
                <span style="flex:1;font-size:0.875rem;">${inv.period}</span>
                <span style="font-weight:700;color:var(--text-primary);">$${inv.amount.toLocaleString()}</span>
                <span style="font-size:0.8rem;color:var(--text-muted);">${inv.credits.toLocaleString()} CRMC</span>
                <span class="invoice-settled ${inv.settled ? 'yes' : 'no'}">${inv.settled ? 'Settled' : 'Pending'}</span>
            </div>
        `).join('');
        document.getElementById('invoice-count').textContent = invoices.length;
    }

    getMockInvoices() {
        return [
            { tokenId: 1, period: 'Mar 2026',  amount: 100, credits: 1000, settled: true  },
            { tokenId: 2, period: 'Apr 2026',  amount: 250, credits: 2500, settled: false },
        ];
    }

    async signInWithEthereum() {
        if (!this.signer || !this.address) {
            alert('Connect your wallet first.');
            return;
        }

        try {
            const nonce   = Math.random().toString(36).slice(2, 12);
            const message = `Sign in to CRM Command Center\nAddress: ${this.address}\nNonce: ${nonce}\nTimestamp: ${new Date().toISOString()}`;
            const signature = await this.signer.signMessage(message);

            const saved = this.storage.getWallet() || {};
            this.storage.saveWallet({
                ...saved,
                address:   this.address,
                signature,
                signedAt:  new Date().toISOString(),
                siweNonce: nonce,
            });

            alert(`✓ Signed in!\nYour wallet ${this.address.slice(0,6)}…${this.address.slice(-4)} is verified.\n\nIn production this signature is sent to the backend for JWT issuance.`);
        } catch (err) {
            if (err.code === 4001) {
                // User rejected
            } else {
                console.error('SIWE error:', err);
                alert('Failed to sign: ' + (err.message || err));
            }
        }
    }
}

// ── Bootstrap ──────────────────────────────────────────────────────────────────
const crmController    = new CRMController(app.storage);
const walletController = new WalletController(app.storage);
