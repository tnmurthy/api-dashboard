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
            CONTACTS: 'api_command_contacts',
            WALLET: 'api_command_wallet',
            TRANSACTIONS: 'api_command_transactions'
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
        if (!localStorage.getItem(this.STORAGE_KEYS.CONTACTS)) {
            this.saveContacts(this.getMockContacts());
        }
        if (!localStorage.getItem(this.STORAGE_KEYS.WALLET)) {
            this.saveWallet(this.getMockWallet());
        }
        if (!localStorage.getItem(this.STORAGE_KEYS.TRANSACTIONS)) {
            this.saveTransactions(this.getMockTransactions());
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

    getMockContacts() {
        return [
            { id: 'c1', name: 'Alice Johnson', company: 'TechCorp', email: 'alice@techcorp.io', status: 'customer', value: 12000, createdAt: new Date(Date.now() - 30 * 86400000).toISOString() },
            { id: 'c2', name: 'Bob Martinez', company: 'StartupXYZ', email: 'bob@startupxyz.com', status: 'prospect', value: 5000, createdAt: new Date(Date.now() - 14 * 86400000).toISOString() },
            { id: 'c3', name: 'Carol Lee', company: 'Innovate Ltd', email: 'carol@innovate.dev', status: 'lead', value: 2500, createdAt: new Date(Date.now() - 7 * 86400000).toISOString() },
            { id: 'c4', name: 'David Kim', company: 'FinTech Inc', email: 'david@fintech.io', status: 'customer', value: 20000, createdAt: new Date(Date.now() - 60 * 86400000).toISOString() },
            { id: 'c5', name: 'Eva Patel', company: 'DataStream', email: 'eva@datastream.ai', status: 'prospect', value: 8000, createdAt: new Date(Date.now() - 3 * 86400000).toISOString() },
            { id: 'c6', name: 'Frank Müller', company: 'EuroAI GmbH', email: 'frank@euroai.de', status: 'lead', value: 3000, createdAt: new Date(Date.now() - 1 * 86400000).toISOString() },
            { id: 'c7', name: 'Grace Chen', company: 'CloudBase', email: 'grace@cloudbase.net', status: 'churned', value: 4500, createdAt: new Date(Date.now() - 90 * 86400000).toISOString() }
        ];
    }

    getMockWallet() {
        return { balance: 42.50, monthlySpend: 24.56, totalSpent: 187.32, avgCostPerCall: 0.00196, autoRefill: false, tokensRemaining: 4250000 };
    }

    getMockTransactions() {
        const now = Date.now();
        return [
            { id: 't1', date: new Date(now - 1 * 86400000).toISOString(), description: 'API Usage - GPT-4 Turbo', tokens: -85420, amount: -0.854, type: 'debit' },
            { id: 't2', date: new Date(now - 2 * 86400000).toISOString(), description: 'Credits Added', tokens: 2500000, amount: 25.00, type: 'credit' },
            { id: 't3', date: new Date(now - 3 * 86400000).toISOString(), description: 'API Usage - Claude 3 Sonnet', tokens: -42100, amount: -0.126, type: 'debit' },
            { id: 't4', date: new Date(now - 5 * 86400000).toISOString(), description: 'API Usage - Gemini Pro', tokens: -310000, amount: -0.155, type: 'debit' },
            { id: 't5', date: new Date(now - 7 * 86400000).toISOString(), description: 'Credits Added', tokens: 1000000, amount: 10.00, type: 'credit' },
            { id: 't6', date: new Date(now - 10 * 86400000).toISOString(), description: 'API Usage - GPT-4 Turbo', tokens: -120000, amount: -1.20, type: 'debit' },
            { id: 't7', date: new Date(now - 15 * 86400000).toISOString(), description: 'Credits Added', tokens: 5000000, amount: 50.00, type: 'credit' }
        ];
    }

    getContacts() {
        return JSON.parse(localStorage.getItem(this.STORAGE_KEYS.CONTACTS) || '[]');
    }

    saveContacts(contacts) {
        localStorage.setItem(this.STORAGE_KEYS.CONTACTS, JSON.stringify(contacts));
    }

    getWallet() {
        return JSON.parse(localStorage.getItem(this.STORAGE_KEYS.WALLET) || '{}');
    }

    saveWallet(wallet) {
        localStorage.setItem(this.STORAGE_KEYS.WALLET, JSON.stringify(wallet));
    }

    getTransactions() {
        return JSON.parse(localStorage.getItem(this.STORAGE_KEYS.TRANSACTIONS) || '[]');
    }

    saveTransactions(transactions) {
        localStorage.setItem(this.STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
    }

    addTransaction(tx) {
        const transactions = this.getTransactions();
        transactions.unshift(tx);
        this.saveTransactions(transactions.slice(0, 200));
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

        return { success: false, output: `Unknown: ${input}\nType 'help' for commands` };
    }

    showHelp() {
        return {
            success: true,
            output: `Commands:
  config <app> --primary <model> --fallback <model>
  list apps | list models
  show config <app> | export <app>
  clear | help`
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
        this.setupCRM();
        this.setupWallet();
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

    // ============================================
    // CRM
    // ============================================

    setupCRM() {
        this.crmFilter = 'all';
        this.loadCRMStats();
        this.loadCRMContacts();

        document.getElementById('crm-add-contact').addEventListener('click', () => {
            this.addContact();
        });

        document.querySelectorAll('.crm-filter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.crm-filter-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.crmFilter = btn.dataset.filter;
                this.loadCRMContacts();
            });
        });
    }

    loadCRMStats() {
        const contacts = this.storage.getContacts();
        const leads = contacts.filter(c => c.status === 'lead').length;
        const customers = contacts.filter(c => c.status === 'customer').length;
        const total = contacts.length;
        const pipeline = contacts.filter(c => c.status !== 'churned').reduce((sum, c) => sum + (c.value || 0), 0);
        const conversion = total > 0 ? ((customers / total) * 100).toFixed(1) : '0.0';

        document.getElementById('crm-total-contacts').textContent = total;
        document.getElementById('crm-active-leads').textContent = leads;
        document.getElementById('crm-leads-trend').textContent = `${leads} active`;
        document.getElementById('crm-conversion').textContent = `${conversion}%`;
        document.getElementById('crm-pipeline').textContent = pipeline.toLocaleString();
    }

    loadCRMContacts() {
        const contacts = this.storage.getContacts();
        const filtered = this.crmFilter === 'all' ? contacts : contacts.filter(c => c.status === this.crmFilter);
        const tbody = document.getElementById('crm-contacts-tbody');

        if (filtered.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:var(--text-muted);padding:2rem;">No contacts found</td></tr>`;
            return;
        }

        tbody.innerHTML = filtered.map(c => `
            <tr>
                <td><strong>${this.escapeHtml(c.name)}</strong></td>
                <td style="color:var(--text-secondary)">${this.escapeHtml(c.company)}</td>
                <td class="contact-email">${this.escapeHtml(c.email)}</td>
                <td><span class="contact-status-badge ${c.status}">${c.status}</span></td>
                <td class="contact-value">$${(c.value || 0).toLocaleString()}</td>
                <td><button class="crm-delete-btn" onclick="app.deleteContact('${c.id}')">Remove</button></td>
            </tr>
        `).join('');
    }

    addContact() {
        const name = document.getElementById('crm-name').value.trim();
        const company = document.getElementById('crm-company').value.trim();
        const email = document.getElementById('crm-email').value.trim();
        const status = document.getElementById('crm-status').value;
        const value = parseFloat(document.getElementById('crm-value').value) || 0;

        if (!name || !email) {
            alert('Name and email are required.');
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            alert('Please enter a valid email address.');
            return;
        }

        const contact = {
            id: 'c' + Date.now(),
            name,
            company,
            email,
            status,
            value,
            createdAt: new Date().toISOString()
        };

        const contacts = this.storage.getContacts();
        contacts.unshift(contact);
        this.storage.saveContacts(contacts);

        document.getElementById('crm-name').value = '';
        document.getElementById('crm-company').value = '';
        document.getElementById('crm-email').value = '';
        document.getElementById('crm-value').value = '';

        this.loadCRMStats();
        this.loadCRMContacts();
    }

    deleteContact(id) {
        const contacts = this.storage.getContacts().filter(c => c.id !== id);
        this.storage.saveContacts(contacts);
        this.loadCRMStats();
        this.loadCRMContacts();
    }

    escapeHtml(str) {
        return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    // ============================================
    // WALLET
    // ============================================

    setupWallet() {
        this.selectedTopupAmount = null;
        this.loadWalletData();

        document.querySelectorAll('.topup-package').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.topup-package').forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                this.selectedTopupAmount = parseFloat(btn.dataset.amount);
                document.getElementById('wallet-custom-amount').value = this.selectedTopupAmount;
            });
        });

        document.getElementById('wallet-topup-btn').addEventListener('click', () => {
            const input = document.getElementById('wallet-custom-amount');
            const amount = parseFloat(input.value);
            if (!amount || amount <= 0 || amount > 10000) {
                alert('Please enter a valid amount between $1 and $10,000.');
                return;
            }
            this.processTopup(amount);
        });

        document.getElementById('wallet-autorefill').addEventListener('change', (e) => {
            const wallet = this.storage.getWallet();
            wallet.autoRefill = e.target.checked;
            this.storage.saveWallet(wallet);
        });

        document.getElementById('export-transactions').addEventListener('click', () => {
            this.exportTransactionsCSV();
        });
    }

    loadWalletData() {
        const wallet = this.storage.getWallet();

        document.getElementById('wallet-balance').textContent = wallet.balance.toFixed(2);
        document.getElementById('wallet-balance-tokens').textContent = `${this.formatNumber(wallet.tokensRemaining)} tokens remaining`;
        document.getElementById('wallet-monthly-spend').textContent = wallet.monthlySpend.toFixed(2);
        document.getElementById('wallet-total-spent').textContent = wallet.totalSpent.toFixed(2);
        document.getElementById('wallet-avg-cost').textContent = wallet.avgCostPerCall.toFixed(3);
        document.getElementById('wallet-autorefill').checked = wallet.autoRefill || false;

        this.loadTransactions();
    }

    processTopup(amount) {
        const tokensPerDollar = 100000;
        const tokens = Math.round(amount * tokensPerDollar);
        const wallet = this.storage.getWallet();

        wallet.balance = parseFloat((wallet.balance + amount).toFixed(2));
        wallet.tokensRemaining += tokens;
        this.storage.saveWallet(wallet);

        const tx = {
            id: 'tx' + Date.now(),
            date: new Date().toISOString(),
            description: 'Credits Added',
            tokens,
            amount,
            type: 'credit'
        };
        this.storage.addTransaction(tx);

        document.getElementById('wallet-custom-amount').value = '';
        document.querySelectorAll('.topup-package').forEach(b => b.classList.remove('selected'));
        this.selectedTopupAmount = null;

        this.loadWalletData();

        const btn = document.getElementById('wallet-topup-btn');
        const orig = btn.innerHTML;
        btn.innerHTML = '✓ Added!';
        setTimeout(() => { btn.innerHTML = orig; }, 2000);
    }

    loadTransactions() {
        const transactions = this.storage.getTransactions();
        const container = document.getElementById('wallet-tx-list');

        if (transactions.length === 0) {
            container.innerHTML = '<div style="text-align:center;color:var(--text-muted);padding:2rem;">No transactions yet</div>';
            return;
        }

        container.innerHTML = transactions.map(tx => {
            const date = new Date(tx.date);
            const dateStr = date.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' });
            const timeStr = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
            const sign = tx.type === 'credit' ? '+' : '-';
            const absAmount = Math.abs(tx.amount).toFixed(3);
            const tokensStr = tx.type === 'credit'
                ? `+${this.formatNumber(tx.tokens)}`
                : `${this.formatNumber(tx.tokens)}`;

            return `
                <div class="wallet-tx-item">
                    <div class="wallet-tx-date">${dateStr} ${timeStr}</div>
                    <div class="wallet-tx-desc">${this.escapeHtml(tx.description)}</div>
                    <div class="wallet-tx-tokens">${tokensStr} tkns</div>
                    <div class="wallet-tx-amount ${tx.type}">${sign}$${absAmount}</div>
                </div>
            `;
        }).join('');
    }

    exportTransactionsCSV() {
        const transactions = this.storage.getTransactions();
        const headers = ['Date', 'Description', 'Tokens', 'Amount', 'Type'];
        const rows = transactions.map(tx => [tx.date, `"${tx.description}"`, tx.tokens, tx.amount, tx.type]);

        const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `wallet-transactions-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    }
}

const app = new AppController();
