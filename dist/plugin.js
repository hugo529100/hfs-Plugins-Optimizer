// plugin.js - Plugins Optimizer
// One plugin for:
//   1) a GitHub-only outbound HTTP proxy (VPN tunnel) used by plugin installs/updates and HFS updates;
//   2) a persistent on-disk cache for GitHub API / raw plugin files;
//   3) a portable plugin-catalog mirror in the plugin's storage folder;
//   4) an admin-panel extension: hide/show installed plugins and an "Optimizer" settings tab.
//
// The proxy is deliberately scoped: only hostnames in `githubHosts` are tunneled.
// Everything else keeps using the normal network path.

exports.version = 40.8
exports.apiRequired = [12.7, 13.72]
exports.description = "GitHub-only VPN proxy + persistent cache for plugin/HFS updates, a portable plugin catalog mirror, admin-panel Installed enhancements, and a draggable visual Plugin Skill Tree."
exports.repo = "hugo529100/hfs-Plugins-Optimizer"
exports.preview = []
exports.changelog = []

exports.config = {
    // ========== VPN / proxy ==========
    proxyEnabled: {
        type: 'boolean', defaultValue: false, label: 'Route GitHub traffic through VPN proxy',
        helperText: "Independent proxy module. If HFS has a global outbound proxy (Options > Networking), HFS takes precedence over this proxy. Only GitHub hostnames below are tunneled by this plugin.",
        xs: 12,
    },
    proxyHost: {
        type: 'string', defaultValue: '192.168.1.224', label: 'VPN proxy host',
        helperText: "Default 192.168.1.224. You may also paste http://IP:PORT.",
        xs: 8,
        showIf: c => c.proxyEnabled === true
    },
    proxyPort: {
        type: 'number', defaultValue: 10809, min: 1, max: 65535, label: 'VPN proxy port',
        helperText: "Default 10809. No username/password is required.",
        xs: 4,
        showIf: c => c.proxyEnabled === true
    },
    githubHosts: {
        type: 'string',
        defaultValue: 'github.com,api.github.com,codeload.github.com,raw.githubusercontent.com,objects.githubusercontent.com,github-releases.githubusercontent.com,githubassets.com,githubusercontent.com',
        label: 'GitHub hosts routed through the proxy',
        helperText: "Comma-separated suffix match. These are exactly the hosts used by plugin installs/updates and HFS updates.",
        xs: 12,
        showIf: c => c.proxyEnabled === true
    },

    // ========== Cache ==========
    cacheEnabled: {
        type: 'boolean', defaultValue: false, label: 'Enable GitHub disk cache',
        helperText: "Cache GET/HEAD responses from GitHub API and raw plugin files. Survives restarts and saves GitHub rate-limit quota.",
        xs: 12,
    },
    ttlHours: {
        type: 'number', defaultValue: 24, min: 0.1, max: 720, label: 'Fresh TTL (hours)',
        helperText: "Within this window cached data is served without contacting GitHub.",
        xs: 6,
        showIf: c => c.cacheEnabled === true
    },
    pluginTtlHours: {
        type: 'number', defaultValue: 6, min: 0.1, max: 720, label: 'Plugin.js TTL (hours)',
        helperText: "Shorter TTL for plugin.js / raw plugin files so new versions are picked up sooner.",
        xs: 6,
        showIf: c => c.cacheEnabled === true
    },
    maxAgeDays: {
        type: 'number', defaultValue: 30, min: 1, max: 365, label: 'Max cache age (days)',
        helperText: "Stale-while-revalidate window. Older files are pruned in the background.",
        xs: 6,
        showIf: c => c.cacheEnabled === true
    },
    catalogSyncHours: {
        type: 'number', defaultValue: 6, min: 0, max: 720, label: 'Plugin catalog mirror sync (hours)',
        helperText: "How often the plugin rebuilds its portable catalog.json in its storage folder. 0 disables automatic sync.",
        xs: 6,
    },
    githubToken: {
        type: 'password', defaultValue: '', label: 'GitHub Token (optional)',
        helperText: "PAT. When set, api.github.com requests get an Authorization header (60/h -> 5000/h).",
        xs: 12,
        showIf: c => c.cacheEnabled === true
    },
    cacheApi: {
        type: 'boolean', defaultValue: true, label: 'Cache api.github.com',
        xs: 6,
        showIf: c => c.cacheEnabled === true
    },
    cacheRaw: {
        type: 'boolean', defaultValue: true, label: 'Cache raw.githubusercontent.com',
        xs: 6,
        showIf: c => c.cacheEnabled === true
    },
    cacheGithubHtml: {
        type: 'boolean', defaultValue: false, label: 'Cache github.com HTML',
        xs: 6,
        showIf: c => c.cacheEnabled === true
    },
    skipSuspiciousHtml: {
        type: 'boolean', defaultValue: true, label: 'Skip caching suspicious HTML/error responses',
        helperText: "Do not cache 2xx responses that look like GitHub error pages.",
        xs: 12,
        showIf: c => c.cacheEnabled === true
    },
    normalizeUrl: {
        type: 'boolean', defaultValue: true, label: 'Normalize URL for cache key',
        helperText: "Strip cache-busting query params (t, _, timestamp, cachebust, v), sort remaining query, trim trailing slash. Recommended ON.",
        xs: 12,
        showIf: c => c.cacheEnabled === true
    },

    // ========== Network behavior ==========
    maxConcurrent: {
        type: 'number', defaultValue: 20, min: 1, max: 64, label: 'Max concurrent GitHub requests',
        helperText: "Limits simultaneous tunnels. Raise this if plugin loading is slow; lower if your proxy resets under load.",
        xs: 6,
    },
    retryCount: {
        type: 'number', defaultValue: 2, min: 0, max: 5, label: 'Retries on transient network errors',
        helperText: "Retries ECONNRESET / ETIMEDOUT / socket hang up with backoff. HEAD requests only retry once.",
        xs: 6,
    },
    requestTimeoutSec: {
        type: 'number', defaultValue: 30, min: 3, max: 120, label: 'Request timeout (seconds)',
        helperText: "Abort a request that takes longer than this. Lower = less slot blocking; higher = better for large downloads.",
        xs: 6,
    },
    failBlacklistThreshold: {
        type: 'number', defaultValue: 3, min: 0, max: 10, label: 'Fail blacklist threshold',
        helperText: "After this many consecutive failures, a URL is short-circuited. 0 = disable.",
        xs: 6,
    },
    failBlacklistSeconds: {
        type: 'number', defaultValue: 60, min: 10, max: 3600, label: 'Fail blacklist cooldown (seconds)',
        helperText: "How long a blacklisted URL is rejected without contacting GitHub.",
        xs: 6,
    },

    debug: {
        type: 'boolean', defaultValue: false, label: 'Debug logging',
        helperText: "Print HIT/MISS/proxy/catalog details. When off, only important messages and rate-limited errors are logged.",
        xs: 12
    },

}

exports.init = async api => {
    try {
        api.events?.on?.('pluginDownload', event => {
            const repo = typeof event === 'string' ? event : event?.repo
            if (!repo) return
            if (event?.status) activeDownloads.set(repo, { repo, startedAt: Date.now() })
            else activeDownloads.delete(repo)
        })
        api.events?.on?.('pluginDownloaded', event => {
            if (event?.repo) activeDownloads.delete(event.repo)
        })
    } catch {}
    const fs = api.require('fs').promises
    const path = api.require('path')
    const crypto = api.require('crypto')
    const ADMIN_TOKEN = crypto.randomBytes(24).toString('hex')
    const http = api.require('http')
    const https = api.require('https')
    const tls = api.require('tls')
    const { Readable } = api.require('stream')
    const EventEmitter = api.require('events')
    const { AsyncLocalStorage } = api.require('async_hooks')

    const storageDir = api.storageDir
    const CACHE_ROOT = path.join(storageDir, 'cache')
    const META_FILE = path.join(storageDir, 'meta.json')
    const VERSION_FILE = path.join(storageDir, 'storage-version.txt')
    const CATALOG_FILE = path.join(storageDir, 'catalog.json')
    const HIDDEN_FILE = path.join(storageDir, 'hidden.json')
    const TREE_FILE = path.join(storageDir, 'tree.json')
    const TREE_BACKUP_FILE = path.join(storageDir, 'tree.backup.json')
    const TREE_BEFORE_RESET_FILE = path.join(storageDir, 'tree.before-reset.json')
    const TREE_DEFAULT = path.join(path.dirname(storageDir), 'public', 'tree.default.json')
    const UI_STATE_FILE = path.join(storageDir, 'ui.json')
    const DESCRIPTIONS_FILE = path.join(storageDir, 'descriptions.json')
    const DESCRIPTIONS_PUBLIC = path.join(path.dirname(storageDir), 'public', 'descriptions.js')
    const PLUGINS_ROOT = path.dirname(path.dirname(storageDir))
    const STORAGE_VERSION = 1
    let descriptionsCache = null
    const activeDownloads = new Map()
    let hiddenCache = []
    let treeCache = null
    let hasSavedTreeStorage = false

    const DEFAULT_PROXY_HOST = '192.168.1.224'
    const DEFAULT_PROXY_PORT = 10809

    let hfsHttpStream = null
    try { hfsHttpStream = api.require('./misc').httpStream } catch (e) { /* older/newer HFS */ }

    // ============================================================
    //  Logging
    // ============================================================
    let errorCount = 0
    const debugEnabled = () => {
        const value = api.getConfig('debug')
        return value === true || value === 'true' || value === 1 || value === '1'
    }
    const logDebug = (...a) => { if (debugEnabled()) api.log('[optimizer]', ...a) }
    const logInfo = (...a) => { if (debugEnabled()) api.log('[optimizer]', ...a) }
    const logError = (...a) => {
        errorCount++
        if (debugEnabled()) api.log('[optimizer][error]', ...a)
    }

    // ============================================================
    //  Config helpers
    // ============================================================
    function networkOn() {
        // Legacy helper: network/cache/proxy are now independent modules.
        return true
    }

    function proxyConfig() {
        if (!networkOn() || !api.getConfig('proxyEnabled')) return null
        let host = String(api.getConfig('proxyHost') || '').trim()
        let port = Number(api.getConfig('proxyPort')) || 0
        let protocol = 'http'
        if (host.includes('://')) {
            try {
                const u = new URL(host)
                protocol = (u.protocol || 'http:').replace(':', '') || 'http'
                host = u.hostname
                if (u.port) port = parseInt(u.port) || port
            } catch { host = '' }
        } else if (host.includes(':') && !host.includes(']')) {
            const parts = host.split(':')
            if (parts.length === 2) {
                host = parts[0]
                port = parseInt(parts[1]) || port
            }
        }
        if (!host) host = DEFAULT_PROXY_HOST
        if (!port) port = DEFAULT_PROXY_PORT
        // Kept only for backward compatibility with old configs. The current proxy needs no auth.
        const user = String(api.getConfig('proxyUser') || '').trim()
        const pass = String(api.getConfig('proxyPass') || '')
        const auth = user ? `${user}:${pass}` : null
        const url = `${protocol}://${host}:${port}`
        return { protocol, host, port, auth, url }
    }

    function hfsOutboundProxy() {
        let raw
        try { raw = api.getHfsConfig('outbound_proxy') } catch { return null }
        if (!raw) return null
        if (typeof raw === 'object') raw = raw.url || raw.href || ''
        raw = String(raw || '').trim()
        if (!raw) return null
        try {
            const u = new URL(raw.includes('://') ? raw : 'http://' + raw)
            const host = u.hostname
            const port = Number(u.port) || (u.protocol === 'https:' ? 443 : 80)
            if (!host) return null
            const auth = u.username
                ? `${decodeURIComponent(u.username)}:${decodeURIComponent(u.password || '')}`
                : null
            return { protocol: 'http', host, port, auth, url: `http://${host}:${port}`, hfs: true }
        } catch { return null }
    }

    // HFS' global "outbound proxy" setting applies to all outgoing requests,
    // so it takes precedence over this plugin's GitHub-only proxy setting.
    function effectiveProxy() {
        return hfsOutboundProxy() || proxyConfig()
    }

    const githubHostsList = () =>
        String(api.getConfig('githubHosts') || '')
            .split(',')
            .map(s => s.trim().toLowerCase())
            .filter(Boolean)

    function isGithubHost(hostnameRaw) {
        if (!hostnameRaw) return false
        const h = String(hostnameRaw).toLowerCase()
        if (h === 'localhost' || /^\d+\.\d+\.\d+\.\d+$/.test(h)) return false
        for (const p of githubHostsList()) {
            if (h === p) return true
            if (h.endsWith('.' + p)) return true
        }
        return false
    }

    const GITHUB_RAW_PATH_RE = /^\/[^/]+\/[^/]+\/raw\//
    const isCacheableMethod = m => m === 'GET' || m === 'HEAD'

    function isCacheTarget(hostnameRaw, pathname) {
        if (!hostnameRaw) return false
        const h = String(hostnameRaw).toLowerCase()
        const p = String(pathname || '')
        if (api.getConfig('cacheApi') && h === 'api.github.com') return true
        if (api.getConfig('cacheRaw') && h === 'raw.githubusercontent.com') return true
        if (api.getConfig('cacheRaw') && h === 'github.com' && GITHUB_RAW_PATH_RE.test(p)) return true
        if (api.getConfig('cacheGithubHtml') && (h === 'github.com' || h.endsWith('.github.com'))) return true
        return false
    }

    function isPluginFile(pathname) {
        return /\/plugin\.js$/i.test(String(pathname || ''))
    }

    function normalizeHidden(list) {
        return [...new Set((Array.isArray(list) ? list : [])
            .map(x => String(x || '').trim())
            .filter(x => x && x.length <= 200))]
            .slice(0, 500)
    }

    function hiddenList() {
        return [...hiddenCache]
    }

    async function setHiddenList(list) {
        const clean = normalizeHidden(list)
        hiddenCache = clean
        await writeJson(HIDDEN_FILE, { hidden: clean, updatedAt: Date.now() })
        return clean
    }

    function isValidTree(tree) {
        return !!tree && typeof tree === 'object'
            && (Array.isArray(tree.roots) || Array.isArray(tree.mains) || Array.isArray(tree.categories))
    }

    async function loadTree() {
        // The saved tree is authoritative. The live plugin list only decorates
        // it, so plugin updates and temporary missing rows never rebuild or
        // erase the user's branch assignments.
        const storedTree = await readJson(TREE_FILE).catch(() => null)
        let tree = storedTree
        let fromBackup = false
        if (!isValidTree(tree)) {
            tree = await readJson(TREE_BACKUP_FILE).catch(() => null)
            fromBackup = isValidTree(tree)
        }
        hasSavedTreeStorage = isValidTree(storedTree) || fromBackup
        if (!isValidTree(tree)) {
            tree = await readJson(TREE_DEFAULT).catch(() => null)
            fromBackup = false
        }
        if (isValidTree(tree)) {
            if (fromBackup) await writeJson(TREE_FILE, tree).catch(e => logError('restore tree.json: ' + e.message))
            await writeJson(TREE_BACKUP_FILE, tree).catch(e => logError('backup tree.json: ' + e.message))
        }
        treeCache = isValidTree(tree) ? tree : null
        return treeCache
    }

    async function saveTree(tree) {
        if (!isValidTree(tree))
            throw Error('invalid tree')
        treeCache = tree
        await writeJson(TREE_FILE, tree)
        await writeJson(TREE_BACKUP_FILE, tree).catch(e => logError('backup tree.json: ' + e.message))
        return treeCache
    }

    async function resetTree() {
        const def = await readJson(TREE_DEFAULT).catch(() => null)
        if (!def) throw Error('missing public/tree.default.json')
        const current = treeCache || await loadTree()
        if (isValidTree(current))
            await writeJson(TREE_BEFORE_RESET_FILE, current).catch(e => logError('snapshot pre-reset tree: ' + e.message))
        return saveTree(def)
    }

    async function snapshotTree(tree) {
        if (!isValidTree(tree)) throw Error('invalid tree snapshot')
        await writeJson(TREE_BEFORE_RESET_FILE, tree)
        return tree
    }

    async function restoreBeforeReset() {
        const tree = await readJson(TREE_BEFORE_RESET_FILE).catch(() => null)
        if (!isValidTree(tree)) throw Error('no tree snapshot from before the last reset')
        return saveTree(tree)
    }

    async function latestTreeSnapshot() {
        const files = [TREE_DEFAULT, TREE_BEFORE_RESET_FILE]
        const candidates = []
        for (const file of files) {
            const tree = await readJson(file).catch(() => null)
            if (isValidTree(tree)) candidates.push(tree)
        }
        if (!candidates.length) throw Error('no saved layout snapshot')
        candidates.sort((a, b) => Number(b.updatedAt || 0) - Number(a.updatedAt || 0))
        return saveTree(candidates[0])
    }

    async function restoreLatestTree() {
        return latestTreeSnapshot()
    }

    async function freezeTree() {
        const tree = treeCache || await loadTree()
        if (!tree) throw Error('no tree to freeze')
        await writeJson(TREE_DEFAULT, tree)
        return tree
    }

    function normalizeUiState(input) {
        const ui = input && typeof input === 'object' ? input : {}
        const openSettings = Array.isArray(ui.openSettings)
            ? [...new Set(ui.openSettings.filter(id => typeof id === 'string' && id))]
            : []
        const heights = {}
        if (ui.settingsHeights && typeof ui.settingsHeights === 'object') {
            for (const [id, value] of Object.entries(ui.settingsHeights)) {
                const n = Number(value)
                if (id && Number.isFinite(n)) heights[id] = Math.max(120, Math.min(500, Math.round(n)))
            }
        }
        const expandedHidden = Array.isArray(ui.expandedHidden)
            ? [...new Set(ui.expandedHidden.filter(key => typeof key === 'string' && key))]
            : []
        return { version: 1, openSettings, settingsHeights: heights, expandedHidden, updatedAt: Number(ui.updatedAt || Date.now()) }
    }

    async function loadUiState() {
        const saved = await readJson(UI_STATE_FILE).catch(() => null)
        return normalizeUiState(saved)
    }

    async function saveUiState(ui) {
        const clean = normalizeUiState(ui)
        clean.updatedAt = Date.now()
        await writeJson(UI_STATE_FILE, clean)
        return clean
    }

    async function loadHidden() {
        const saved = await readJson(HIDDEN_FILE).catch(() => null)
        const legacy = normalizeHidden(Array.isArray(api.getConfig('hiddenPlugins'))
            ? api.getConfig('hiddenPlugins')
            : String(api.getConfig('hiddenPlugins') || '').split(/[\n,]+/))
        if (!saved && legacy.length) {
            hiddenCache = legacy
            await writeJson(HIDDEN_FILE, { hidden: legacy, updatedAt: Date.now() }).catch(e => logError('migrate hidden.json: ' + e.message))
        } else {
            hiddenCache = normalizeHidden(saved?.hidden)
        }
        // The old YAML field is no longer used; remove it once migrated.
        try { if (api.getConfig('hiddenPlugins') !== undefined) api.setConfig('hiddenPlugins', null) } catch {}
    }

    // ============================================================
    //  URL normalization / cache keys
    // ============================================================
    const CACHE_BUST_PARAMS = new Set(['t', '_', 'timestamp', 'cachebust', 'v', 'ver', 'version'])

    function normalizeUrl(rawUrl) {
        if (!api.getConfig('normalizeUrl')) return rawUrl
        try {
            const u = new URL(rawUrl)
            for (const p of [...u.searchParams.keys()]) {
                if (CACHE_BUST_PARAMS.has(p.toLowerCase())) u.searchParams.delete(p)
            }
            u.searchParams.sort()
            let pathname = u.pathname.replace(/\/+$/, '')
            if (!pathname) pathname = '/'
            u.pathname = pathname
            return u.toString()
        } catch {
            return rawUrl
        }
    }

    const keyFor = (url, method) =>
        crypto.createHash('sha1').update(`${method} ${normalizeUrl(url)}`).digest('hex').slice(0, 16)

    const dirFor = k => path.join(CACHE_ROOT, k)
    const bodyFileFor = k => path.join(dirFor(k), 'body.bin')
    const metaFileFor = k => path.join(dirFor(k), 'meta.json')
    const uniqueTmp = f => `${f}.${process.pid}.${Date.now()}.${Math.random().toString(36).slice(2, 8)}.tmp`

    // ============================================================
    //  Stats
    // ============================================================
    const stats = {
        hits: 0,
        misses: 0,
        requests: 0,
        proxied: 0,
        direct: 0,
        errors: 0,
        bytesSaved: 0,
        startedAt: Date.now(),
    }
    let lastProxyTest = null

    // ============================================================
    //  Storage helpers
    // ============================================================
    async function ensureStorage() {
        await fs.mkdir(storageDir, { recursive: true })
        await fs.mkdir(CACHE_ROOT, { recursive: true })
        let current = '0'
        try { current = (await fs.readFile(VERSION_FILE, 'utf8')).trim() } catch {}
        if (current !== String(STORAGE_VERSION)) {
            try { await fs.rm(META_FILE, { force: true }) } catch {}
            try { await fs.rm(CACHE_ROOT, { recursive: true, force: true }) } catch {}
            await fs.mkdir(CACHE_ROOT, { recursive: true })
            await fs.writeFile(VERSION_FILE, String(STORAGE_VERSION), 'utf8')
            logInfo(`storage version set to ${STORAGE_VERSION}`)
        }
    }

    async function readJson(f) {
        try { return JSON.parse(await fs.readFile(f, 'utf8')) }
        catch (e) { if (e.code === 'ENOENT') return null; throw e }
    }

    async function writeJson(f, d) {
        await fs.mkdir(path.dirname(f), { recursive: true })
        const tmp = uniqueTmp(f)
        await fs.writeFile(tmp, JSON.stringify(d), 'utf8')
        try {
            await fs.rename(tmp, f)
        } catch (e) {
            try { await fs.rm(tmp, { force: true }) } catch {}
            throw e
        }
    }

    function normalizeDescriptionEntry(id, value) {
        if (!id || !value || typeof value !== 'object') return null
        const repo = String(value.repo || '').trim()
        const description = String(value.description || '').trim()
        if (!repo && !description) return null
        const author = String(value.author || repo.split('/')[0] || '').trim()
        return {
            id: String(value.id || id),
            repo,
            author,
            description,
            version: value.version ?? null,
            source: String(value.source || ''),
            updatedAt: Number(value.updatedAt || Date.now()),
        }
    }

    async function loadDescriptions() {
        if (descriptionsCache) return descriptionsCache
        const saved = await readJson(DESCRIPTIONS_FILE).catch(() => null)
        const map = {}
        if (saved && typeof saved === 'object') {
            for (const [id, value] of Object.entries(saved)) {
                const entry = normalizeDescriptionEntry(id, value)
                if (entry) map[id] = entry
            }
        }
        descriptionsCache = map
        return map
    }

    async function saveDescriptions(entries) {
        const map = { ...(await loadDescriptions()) }
        for (const raw of entries || []) {
            if (!raw) continue
            const id = String(raw.id || raw.repo || '').trim()
            const entry = normalizeDescriptionEntry(id, raw)
            if (!entry) continue
            map[id] = entry
            if (entry.repo) map[entry.repo] = entry
        }
        descriptionsCache = map
        await writeJson(DESCRIPTIONS_FILE, map)
        await fs.mkdir(path.dirname(DESCRIPTIONS_PUBLIC), { recursive: true })
        const script = `// Generated by Plugins-Optimizer\nwindow.PLUGINS_OPTIMIZER_DESCRIPTIONS = ${JSON.stringify(map, null, 2)};\n`
        const tmp = uniqueTmp(DESCRIPTIONS_PUBLIC)
        await fs.writeFile(tmp, script, 'utf8')
        try { await fs.rename(tmp, DESCRIPTIONS_PUBLIC) }
        catch (e) {
            try { await fs.rm(tmp, { force: true }) } catch {}
            throw e
        }
        return map
    }

    function descriptionKey(id) {
        return String(id || '').toLowerCase().replace(/^.*[\\/]/, '')
            .replace(/^(?:hugo529100|hugo29100)[-_]?/, '')
            .replace(/^hfs[-_]?/, '')
            .replace(/-main$/, '')
            .replace(/\+$/, '')
            .replace(/[^a-z0-9]/g, '')
    }

    async function pruneDescriptions() {
        const map = await loadDescriptions()
        const keep = new Set(['pluginsoptimizer'])
        try {
            const entries = await fs.readdir(PLUGINS_ROOT, { withFileTypes: true })
            for (const entry of entries) {
                if (entry.isDirectory()) keep.add(descriptionKey(entry.name))
            }
        } catch {}
        const tree = await loadTree().catch(() => null)
        if (tree) {
            const add = id => { const key = descriptionKey(id); if (key) keep.add(key) }
            for (const root of tree.roots || []) for (const id of root.plugins || []) add(id)
            for (const main of tree.mains || []) for (const id of main.plugins || []) add(id)
            for (const cat of tree.categories || []) for (const id of cat.plugins || []) add(id)
            for (const id of tree.stars || []) add(id)
            for (const id of Object.keys(tree.pluginMeta || {})) add(id)
        }
        let removed = 0
        for (const [key, entry] of Object.entries(map)) {
            const candidates = [key, entry.id, entry.repo, String(entry.repo || '').split('/').pop()]
            if (candidates.some(value => keep.has(descriptionKey(value)))) continue
            delete map[key]
            removed++
        }
        if (removed) {
            descriptionsCache = map
            await saveDescriptions([])
            logDebug(`descriptions pruned: ${removed}`)
        }
        return removed
    }

    async function updateDescriptionsFromCatalog(entries) {
        const existing = await loadDescriptions()
        const list = []
        for (const entry of entries || []) {
            if (!entry) continue
            const repo = String(entry.repo || '').trim()
            const id = String(entry.id || repo).trim()
            if (!repo && !entry.description) continue
            const previous = existing[id] || (repo ? existing[repo] : null)
            // The installed plugin's own description is authoritative.
            if (previous?.source === 'plugin' && previous.description) continue
            list.push({
                id,
                repo,
                author: String(entry.author || entry.owner?.login || repo.split('/')[0] || '').trim(),
                description: entry.description || '',
                version: entry.version ?? null,
                source: 'catalog',
            })
        }
        if (list.length) await saveDescriptions(list)
    }

    async function updateDescriptionFromPlugin(event) {
        const p = event?.plugin?.getData?.() || event?.plugin || event?.getData?.() || event || {}
        const id = String(p.id || event?.id || '').trim()
        if (!id) return
        const rawRepo = p.repo ?? event?.repo
        const repo = typeof rawRepo === 'string'
            ? rawRepo
            : String(rawRepo?.web || rawRepo?.main || '').replace(/^https?:\/\/github\.com\//i, '').replace(/\/.*$/, '')
        const description = String(p.description || '').trim()
        if (!description && !repo) return
        await saveDescriptions([{
            id,
            repo,
            author: String(p.author || repo.split('/')[0] || '').trim(),
            description,
            version: p.version ?? null,
            source: 'plugin',
        }])
    }

    async function readBody(k) {
        try { return await fs.readFile(bodyFileFor(k)) } catch { return null }
    }

    async function writeBody(k, buf) {
        await fs.mkdir(dirFor(k), { recursive: true })
        const tmp = uniqueTmp(bodyFileFor(k))
        await fs.writeFile(tmp, buf)
        try {
            await fs.rename(tmp, bodyFileFor(k))
        } catch (e) {
            try { await fs.rm(tmp, { force: true }) } catch {}
            throw e
        }
    }

    let indexChain = Promise.resolve()
    const withIndex = fn => (indexChain = indexChain.then(fn, fn))

    async function loadIndex() {
        const d = await readJson(META_FILE)
        if (!d || typeof d !== 'object') return { version: STORAGE_VERSION, entries: {} }
        if (!d.entries || typeof d.entries !== 'object') d.entries = {}
        return d
    }

    async function updateIndexEntry(url, method, key, info) {
        return withIndex(async () => {
            const idx = await loadIndex()
            idx.entries[`${method} ${normalizeUrl(url)}`] = { key, url, method, ...info, updatedAt: Date.now() }
            await writeJson(META_FILE, idx)
        })
    }

    async function removeIndexEntry(url, method) {
        return withIndex(async () => {
            const idx = await loadIndex()
            delete idx.entries[`${method} ${normalizeUrl(url)}`]
            await writeJson(META_FILE, idx)
        })
    }

    // ============================================================
    //  Fail blacklist
    // ============================================================
    const failCache = new Map()

    function failKey(url, method) {
        return `${method} ${normalizeUrl(url)}`
    }

    function isBlacklisted(url, method) {
        const th = api.getConfig('failBlacklistThreshold') ?? 3
        if (!th) return false
        const k = failKey(url, method)
        const rec = failCache.get(k)
        if (!rec) return false
        if (Date.now() >= rec.until) {
            failCache.delete(k)
            return false
        }
        return rec.count >= th
    }

    function recordFail(url, method, errMessage) {
        const th = api.getConfig('failBlacklistThreshold') ?? 3
        if (!th) return
        const sec = api.getConfig('failBlacklistSeconds') ?? 60
        const k = failKey(url, method)
        const now = Date.now()
        const rec = failCache.get(k) || { count: 0, until: 0, lastRecordedAt: 0 }
        if (now - rec.lastRecordedAt < 1000) return
        rec.count++
        rec.lastRecordedAt = now
        rec.lastError = String(errMessage || '')
        if (rec.count >= th) {
            rec.until = now + sec * 1000
            logDebug(`blacklist ${method} ${url} for ${sec}s after ${rec.count} failures (${rec.lastError})`)
        }
        failCache.set(k, rec)
    }

    function recordSuccess(url, method) {
        const k = failKey(url, method)
        if (failCache.has(k)) failCache.delete(k)
    }

    // ============================================================
    //  Concurrency limit
    // ============================================================
    let activeCount = 0
    const waitQueue = []

    function withLimit(fn) {
        return new Promise((resolve, reject) => {
            const run = () => {
                activeCount++
                Promise.resolve()
                    .then(fn)
                    .then(resolve, reject)
                    .finally(() => {
                        activeCount--
                        const next = waitQueue.shift()
                        if (next) next()
                    })
            }
            const limit = Math.max(1, api.getConfig('maxConcurrent') || 20)
            if (activeCount < limit) run()
            else waitQueue.push(run)
        })
    }

    // ============================================================
    //  Upstream requests
    // ============================================================
    // Per-async-operation bypass. A plain counter would also disable the patch for
    // unrelated concurrent requests, which could accidentally send them direct.
    const bypassStore = new AsyncLocalStorage()
    const runBypassed = fn => bypassStore.run({ bypass: true }, fn)
    const isBypassed = () => !!bypassStore.getStore()?.bypass

    const isTransientError = e =>
        e && /ECONNRESET|ETIMEDOUT|socket hang up|EPIPE|ECONNREFUSED|EAI_AGAIN|Timeout|timeout/i.test(e.message || '')

    function timeoutMs() {
        return Math.max(3, Number(api.getConfig('requestTimeoutSec')) || 30) * 1000
    }

    function buildHeaders(url, method, options, oldMeta) {
        const headers = { ...(options.headers || {}) }
        if (oldMeta?.etag) headers['If-None-Match'] = oldMeta.etag
        if (oldMeta?.lastModified) headers['If-Modified-Since'] = oldMeta.lastModified
        const token = String(api.getConfig('githubToken') || '').trim()
        try {
            const u = new URL(url)
            if (token && u.hostname === 'api.github.com' && !headers.Authorization && !headers.authorization)
                headers['Authorization'] = `Bearer ${token}`
        } catch {}
        return headers
    }

    function requestDirect(url, method, headers, body, options = {}) {
        return new Promise((resolve, reject) => {
            const u = new URL(url)
            const isHttps = u.protocol === 'https:'
            const mod = isHttps ? https : http
            const req = runBypassed(() => mod.request({
                method,
                hostname: u.hostname,
                port: u.port || (isHttps ? 443 : 80),
                path: u.pathname + u.search,
                headers,
                agent: options.agent ?? false,
                rejectUnauthorized: options.rejectUnauthorized,
                servername: isHttps ? u.hostname : undefined,
            }, resolve))
            req.on('error', reject)
            req.setTimeout(timeoutMs(), () => req.destroy(Object.assign(Error('timeout'), { code: 'ETIMEDOUT' })))
            if (options.signal) {
                if (options.signal.aborted) return req.destroy(Error('aborted'))
                const onAbort = () => req.destroy(Error('aborted'))
                options.signal.addEventListener('abort', onAbort, { once: true })
                req.once('close', () => options.signal.removeEventListener('abort', onAbort))
            }
            if (body && body.length) req.end(body)
            else req.end()
        })
    }

    function requestViaProxyRaw(url, method, headers, body, proxy, options = {}) {
        return new Promise((resolve, reject) => {
            const u = new URL(url)
            const targetPort = u.port || 443
            const authHeader = proxy.auth
                ? { 'Proxy-Authorization': 'Basic ' + Buffer.from(proxy.auth).toString('base64') }
                : {}
            const connectReq = http.request({
                host: proxy.host,
                port: proxy.port,
                method: 'CONNECT',
                path: `${u.hostname}:${targetPort}`,
                headers: { Host: `${u.hostname}:${targetPort}`, ...authHeader },
                agent: false,
            })
            connectReq.on('connect', (res, socket) => {
                if (res.statusCode !== 200) {
                    socket.destroy()
                    return reject(Error(`Proxy CONNECT ${res.statusCode}`))
                }
                // Let https.request perform the TLS handshake on the tunnel socket.
                const req = runBypassed(() => https.request({
                    method,
                    hostname: u.hostname,
                    port: targetPort,
                    path: u.pathname + u.search,
                    headers,
                    agent: false,
                    socket,
                    servername: u.hostname,
                    rejectUnauthorized: options.rejectUnauthorized,
                }, resolve))
                req.on('error', reject)
                req.setTimeout(timeoutMs(), () => req.destroy(Object.assign(Error('timeout'), { code: 'ETIMEDOUT' })))
                if (body && body.length) req.end(body)
                else req.end()
            })
            connectReq.on('error', reject)
            connectReq.setTimeout(Math.min(30000, timeoutMs()), () => {
                connectReq.destroy()
                reject(Error('Proxy CONNECT timeout'))
            })
            connectReq.end()
        })
    }

    async function requestViaProxy(url, method, headers, body, proxy, options = {}) {
        if (hfsHttpStream) {
            // HFS already has a robust CONNECT/TLS implementation. Use it, but keep our
            // own https.request patch out of the way while it runs.
            return await runBypassed(() => hfsHttpStream(url, {
                proxy: proxy.url,
                method,
                headers,
                body: body && body.length ? body : undefined,
                noRedirect: true,
                httpThrow: false,
                timeout: timeoutMs(),
                rejectUnauthorized: options.rejectUnauthorized,
                agent: false,
                signal: options.signal,
            }))
        }
        return requestViaProxyRaw(url, method, headers, body, proxy, options)
    }

    async function performUpstream(url, method, headers, body, options = {}, proxy = null) {
        let attempt = 0
        const maxRetry = method === 'HEAD'
            ? 1
            : Math.max(0, Number(api.getConfig('retryCount')) || 0)
        for (;;) {
            try {
                const res = proxy
                    ? await requestViaProxy(url, method, headers, body, proxy, options)
                    : await requestDirect(url, method, headers, body, options)
                stats.requests++
                if (proxy) stats.proxied++
                else stats.direct++
                return res
            } catch (e) {
                if (attempt < maxRetry && isTransientError(e)) {
                    const delay = 300 * (attempt + 1) + Math.floor(Math.random() * 200)
                    logDebug(`transient error "${e.message}", retrying in ${delay}ms`)
                    attempt++
                    await new Promise(r => setTimeout(r, delay))
                    continue
                }
                throw e
            }
        }
    }

    // ============================================================
    //  Cached response helpers
    // ============================================================
    function makeCachedResponse(body, meta) {
        const stream = Readable.from(body || Buffer.alloc(0))
        stream.statusCode = meta.statusCode
        stream.statusMessage = meta.statusMessage || 'OK'
        stream.headers = { ...meta.headers, 'x-gh-cache': meta.source || 'hit' }
        return stream
    }

    function looksLikeError(body, headers) {
        if (!api.getConfig('skipSuspiciousHtml')) return false
        const ct = String(headers['content-type'] || '').toLowerCase()
        if (ct.includes('text/html')) return true
        if (body.length < 512) {
            const head = body.toString('utf8', 0, Math.min(200, body.length)).trim().toLowerCase()
            if (head.startsWith('<!doctype') || head.startsWith('<html') || head.startsWith('404')) return true
        }
        return false
    }

    function extractPluginVersion(body) {
        try {
            const text = body.toString('utf8', 0, Math.min(8192, body.length))
            const m = text.match(/exports\.version\s*=\s*["']?([^"'\n;]+)/)
            return m ? m[1].trim() : null
        } catch { return null }
    }

    async function collectBody(res) {
        const chunks = []
        let total = 0
        for await (const chunk of res) {
            const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
            total += buf.length
            if (total > 32 * 1024 * 1024) throw Error('response too large to cache')
            chunks.push(buf)
        }
        return Buffer.concat(chunks, total)
    }

    // ============================================================
    //  Core cache fetch
    // ============================================================
    async function fetchAndCache(url, method, key, headers, oldMeta, proxy) {
        let res
        try {
            res = await performUpstream(url, method, headers, undefined, {}, proxy)
        } catch (e) {
            recordFail(url, method, e.message)
            stats.errors++
            throw e
        }
        const status = res.statusCode

        if (status === 304 && oldMeta) {
            logDebug(`304 ${method} ${url}`)
            res.resume()
            const newMeta = { ...oldMeta, fetchedAt: Date.now() }
            await writeJson(metaFileFor(key), newMeta).catch(e => logError(`update meta failed: ${e.message}`))
            await updateIndexEntry(url, method, key, {
                statusCode: oldMeta.statusCode,
                fetchedAt: newMeta.fetchedAt,
                etag: oldMeta.etag,
                pluginVersion: oldMeta.pluginVersion,
            }).catch(e => logError(`update index failed: ${e.message}`))
            const body = await readBody(key)
            recordSuccess(url, method)
            return { status: oldMeta.statusCode, statusMessage: oldMeta.statusMessage, headers: oldMeta.headers, body, meta: newMeta, from: 'revalidate' }
        }

        const body = await collectBody(res)
        const responseHeaders = { ...res.headers }
        delete responseHeaders['transfer-encoding']
        delete responseHeaders['connection']

        const u = new URL(url)
        const pluginVersion = isPluginFile(u.pathname) ? extractPluginVersion(body) : null
        const meta = {
            statusCode: status,
            statusMessage: res.statusMessage,
            headers: responseHeaders,
            etag: responseHeaders.etag,
            lastModified: responseHeaders['last-modified'],
            cacheControl: responseHeaders['cache-control'],
            fetchedAt: Date.now(),
            bodyLength: body.length,
            source: 'origin',
            pluginVersion,
        }

        try {
            if (status >= 200 && status < 300) {
                if (looksLikeError(body, responseHeaders)) {
                    logDebug(`skip caching suspicious 2xx ${method} ${url} (${body.length} bytes, ct=${responseHeaders['content-type'] || 'n/a'})`)
                } else {
                    await writeBody(key, body)
                    await writeJson(metaFileFor(key), meta)
                    await updateIndexEntry(url, method, key, {
                        statusCode: status,
                        fetchedAt: meta.fetchedAt,
                        etag: meta.etag,
                        lastModified: meta.lastModified,
                        bodyLength: meta.bodyLength,
                        pluginVersion: meta.pluginVersion,
                    })
                    logDebug(`cached ${method} ${url} (${body.length} bytes${pluginVersion ? `, v=${pluginVersion}` : ''})`)
                }
                recordSuccess(url, method)
            } else if (status === 403 || status === 429) {
                const maxAgeMs = (api.getConfig('maxAgeDays') || 30) * 86400 * 1000
                const oldUsable = oldMeta && (Date.now() - (oldMeta.fetchedAt || 0)) < maxAgeMs && oldMeta.source !== 'ratelimit'
                if (!oldUsable) {
                    await writeBody(key, body)
                    await writeJson(metaFileFor(key), { ...meta, source: 'ratelimit' })
                    logDebug(`cached rate-limit ${status} for ${method} ${url} (no usable old cache)`)
                } else {
                    logDebug(`rate-limit ${status} for ${method} ${url}, keeping existing cache`)
                }
                recordFail(url, method, `HTTP ${status}`)
            } else {
                recordFail(url, method, `HTTP ${status}`)
            }
        } catch (e) {
            logError(`write cache failed: ${e.message}`)
        }

        return { status, statusMessage: res.statusMessage, headers: responseHeaders, body, meta, from: 'origin' }
    }

    // in-flight merge: registration must happen before withLimit()
    const inFlight = new Map()
    function startOrJoin(key, factory) {
        if (!key) return factory()
        const existing = inFlight.get(key)
        if (existing) {
            logDebug(`JOIN in-flight key=${key}`)
            return existing
        }
        const p = factory().finally(() => { inFlight.delete(key) })
        inFlight.set(key, p)
        return p
    }

    // ============================================================
    //  Fake ClientRequest + https.request patch
    // ============================================================
    function requestOptionsFromArgs(args) {
        let options, callback, url
        if (typeof args[0] === 'string' || args[0] instanceof URL) {
            url = String(args[0])
            if (typeof args[1] === 'function') {
                callback = args[1]
                options = {}
            } else {
                options = { ...(args[1] || {}) }
                callback = args[2]
            }
        } else {
            options = { ...(args[0] || {}) }
            callback = args[1]
            if (options.href) url = String(options.href)
            else {
                const host = options.hostname || options.host
                if (!host) return null
                const proto = options.protocol || 'https:'
                const port = options.port ? `:${options.port}` : ''
                url = `${proto}//${host}${port}${options.path || '/'}`
            }
        }
        return { url, options, callback }
    }

    function createFakeRequest(url, method, options, callback) {
        const req = new EventEmitter()
        const chunks = []
        let ended = false
        let aborted = false
        let responded = false
        let timer = null
        let inner = null

        const clearTimer = () => { if (timer) { clearTimeout(timer); timer = null } }

        function fail(err) {
            if (aborted || responded) return
            aborted = true
            clearTimer()
            try { inner?.abort?.() } catch {}
            req.emit('error', err instanceof Error ? err : Error(String(err)))
        }

        req.setHeader = (name, value) => {
            options.headers ||= {}
            options.headers[name] = value
            return req
        }
        req.getHeader = name => options.headers?.[name]
        req.removeHeader = name => { if (options.headers) delete options.headers[name]; return req }
        req.flushHeaders = () => {}
        req.setTimeout = (ms, cb) => {
            if (cb) req.once('timeout', cb)
            clearTimer()
            if (ms > 0) timer = setTimeout(() => {
                req.emit('timeout')
                fail(Object.assign(Error('timeout'), { code: 'ETIMEDOUT' }))
            }, ms)
            return req
        }
        req.write = (chunk, enc, cb) => {
            if (chunk) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk, enc))
            if (typeof cb === 'function') cb()
            return true
        }
        req.end = (chunk, enc, cb) => {
            if (typeof chunk === 'function') cb = chunk
            else if (chunk) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk, enc))
            if (typeof cb === 'function') cb()
            if (!ended) {
                ended = true
                handle().catch(fail)
            }
            return req
        }
        req.destroy = (err) => {
            if (err) return fail(err)
            aborted = true
            clearTimer()
            try { inner?.abort?.() } catch {}
            return req
        }
        req.abort = () => req.destroy()

        if (options.signal) {
            if (options.signal.aborted) return req
            options.signal.addEventListener('abort', () => req.destroy(Error('aborted')), { once: true })
        }

        async function handle() {
            if (aborted) return
            const parsed = new URL(url)
            const proxy = effectiveProxy()
            const useProxy = !!proxy && isGithubHost(parsed.hostname)
            const cacheable = networkOn() && api.getConfig('cacheEnabled')
                && isCacheableMethod(method)
                && isCacheTarget(parsed.hostname, parsed.pathname)
            const key = cacheable ? keyFor(url, method) : null

            if (isBlacklisted(url, method)) {
                logDebug(`BLACKLIST ${method} ${url}`)
                return fail(Error(`blacklisted after repeated failures: ${method} ${url}`))
            }

            // ---------- 1) cache lookup ----------
            let cachedMeta = null
            if (cacheable) {
                cachedMeta = await readJson(metaFileFor(key)).catch(() => null)
                if (cachedMeta && cachedMeta.bodyLength !== undefined) {
                    const age = Date.now() - (cachedMeta.fetchedAt || 0)
                    const isPlugin = isPluginFile(parsed.pathname)
                    const ttlH = isPlugin
                        ? (api.getConfig('pluginTtlHours') || 6)
                        : (api.getConfig('ttlHours') || 24)
                    const maxAgeMs = (api.getConfig('maxAgeDays') || 30) * 86400 * 1000
                    const isRateLimitEntry = cachedMeta.source === 'ratelimit'
                    const fresh = !isRateLimitEntry && age < ttlH * 3600 * 1000
                    // A cached 403/429 must never mask the real answer for days. Retry
                    // after a short cooldown instead.
                    const usable = isRateLimitEntry ? age < 60_000 : age < maxAgeMs
                    if (fresh || usable) {
                        const body = await readBody(key)
                        if (body) {
                            stats.hits++
                            stats.bytesSaved += body.length
                            const v = cachedMeta.pluginVersion ? ` v=${cachedMeta.pluginVersion}` : ''
                            logDebug(`HIT ${method} ${url}${v} age=${Math.round(age / 1000)}s fresh=${fresh} source=${cachedMeta.source || 'cache'}`)
                            const stream = makeCachedResponse(body, cachedMeta)
                            responded = true
                            clearTimer()
                            if (callback) callback(stream)
                            req.emit('response', stream)
                            if (!fresh) {
                                logDebug(`SWR ${method} ${url}`)
                                startOrJoin(key, () =>
                                    withLimit(() => fetchAndCache(url, method, key, buildHeaders(url, method, options, cachedMeta), cachedMeta, useProxy ? proxy : null))
                                ).catch(e => logDebug(`SWR fail: ${e.message}`))
                            }
                            return
                        }
                    }
                }
                stats.misses++
                logDebug(`MISS ${method} ${url}`)
            }

            // ---------- 2) not cacheable: stream straight through ----------
            const headers = buildHeaders(url, method, options, cachedMeta)
            const bodyBuf = chunks.length ? Buffer.concat(chunks) : undefined

            if (!cacheable) {
                const res = await performUpstream(url, method, headers, bodyBuf, {}, useProxy ? proxy : null)
                if (aborted) { res.resume?.(); return }
                responded = true
                clearTimer()
                res.once?.('end', () => recordSuccess(url, method))
                res.once?.('error', e => { stats.errors++; recordFail(url, method, e.message) })
                if (callback) callback(res)
                req.emit('response', res)
                return
            }

            // ---------- 3) cache miss / stale refresh ----------
            const result = await startOrJoin(key, () =>
                withLimit(() => fetchAndCache(url, method, key, headers, cachedMeta, useProxy ? proxy : null))
            )
            if (aborted) return
            responded = true
            clearTimer()
            const stream = makeCachedResponse(result.body, result.meta)
            if (callback) callback(stream)
            req.emit('response', stream)
        }

        // keep a reference for abort()
        Object.defineProperty(req, '_optimizerInner', { get: () => inner, set: v => { inner = v } })

        return req
    }

    function installHttpsPatch() {
        if (https.__pluginsOptimizerPatched) {
            try { https.__pluginsOptimizerPatched.unpatch() } catch {}
        }
        const original = https.request
        let installed = true

        const patched = function (...args) {
            if (!installed) return original.apply(this, args)
            if (isBypassed()) return original.apply(this, args)

            const parsed = requestOptionsFromArgs(args)
            if (!parsed) return original.apply(this, args)
            const { url, options, callback } = parsed
            if (!/^https:/i.test(url)) return original.apply(this, args)

            let u
            try { u = new URL(url) } catch { return original.apply(this, args) }
            const proxy = effectiveProxy()
            const proxied = !!proxy && isGithubHost(u.hostname)
            const cacheable = networkOn() && api.getConfig('cacheEnabled')
                && isCacheableMethod((options.method || 'GET').toUpperCase())
                && isCacheTarget(u.hostname, u.pathname)
            if (!proxied && !cacheable) return original.apply(this, args)

            const method = String(options.method || 'GET').toUpperCase()
            return createFakeRequest(url, method, options, callback)
        }

        function unpatch() {
            installed = false
            if (https.request === patched) https.request = original
            if (https.__pluginsOptimizerPatched?.unpatch === unpatch) delete https.__pluginsOptimizerPatched
        }

        https.request = patched
        https.__pluginsOptimizerPatched = { unpatch }
        return unpatch
    }

    // ============================================================
    //  Persistent catalog mirror
    // ============================================================
    const catalogState = {
        data: null,
        syncing: false,
        error: null,
        progress: '',
        promise: null,
    }

    async function loadCatalog() {
        catalogState.data = await readJson(CATALOG_FILE).catch(() => null)
        return catalogState.data
    }

    function catalogStale() {
        const hours = Number(api.getConfig('catalogSyncHours'))
        if (!hours) return false
        const at = catalogState.data?.updatedAt || 0
        return !at || Date.now() - at > hours * 3600 * 1000
    }

    async function fetchText(url, { headers = {}, timeout = timeoutMs() } = {}) {
        const u = new URL(url)
        const proxy = effectiveProxy()
        const useProxy = !!proxy && isGithubHost(u.hostname)
        const res = useProxy
            ? await requestViaProxy(url, 'GET', { 'user-agent': 'HFS-Plugins-Optimizer', ...headers }, undefined, proxy, {})
            : await requestDirect(url, 'GET', { 'user-agent': 'HFS-Plugins-Optimizer', ...headers }, undefined, {})
        if (!res.statusCode || res.statusCode < 200 || res.statusCode >= 300) {
            res.resume?.()
            throw Error(`HTTP ${res.statusCode}`)
        }
        const chunks = []
        let total = 0
        for await (const chunk of res) {
            const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
            total += buf.length
            if (total > 4 * 1024 * 1024) throw Error('catalog file too large')
            chunks.push(buf)
        }
        return Buffer.concat(chunks, total).toString('utf8')
    }

    function parsePluginSource(text, repo, repoInfo) {
        const pick = (re, index = 1) => {
            const m = re.exec(text)
            return m ? String(m[index] || '').trim() : undefined
        }
        const unquote = s => s && s.replace(/^['"`]|['"`]$/g, '')
        const numeric = s => {
            const m = /^-?\d+(?:\.\d+)?/.exec(String(s || '').trim())
            return m ? Number(m[0]) : s
        }
        const versionRaw = pick(/exports\.version\s*=\s*([^\n;]+)/)
        let version = numeric(unquote(versionRaw))
        const apiRequiredRaw = pick(/exports\.apiRequired\s*=\s*([^\n;]+)/)
        let apiRequired = numeric(unquote(apiRequiredRaw))
        const description = unquote(pick(/exports\.description\s*=\s*(['"`])([\s\S]*?)\1/, 2))
        const isTheme = /exports\.isTheme\s*=\s*(['"`])([^'"`]+)\1/.exec(text)?.[2]
            || (/exports\.isTheme\s*=\s*true/.test(text) ? true : undefined)
        return {
            id: repo,
            repo,
            version,
            apiRequired,
            description,
            isTheme,
            branch: repoInfo.default_branch,
            pushed_at: repoInfo.pushed_at,
            stargazers_count: repoInfo.stargazers_count,
            default_branch: repoInfo.default_branch,
            license: repoInfo.license?.spdx_id || repoInfo.license || undefined,
        }
    }

    function scanBalanced(text, start) {
        let depth = 0
        let quote = ''
        let escaped = false
        let lineComment = false
        let blockComment = false
        for (let i = start; i < text.length; i++) {
            const c = text[i]
            const n = text[i + 1]
            if (lineComment) {
                if (c === '\n') lineComment = false
                continue
            }
            if (blockComment) {
                if (c === '*' && n === '/') { blockComment = false; i++ }
                continue
            }
            if (quote) {
                if (escaped) { escaped = false; continue }
                if (c === '\\') { escaped = true; continue }
                if (c === quote) quote = ''
                continue
            }
            if (c === '/' && n === '/') { lineComment = true; i++; continue }
            if (c === '/' && n === '*') { blockComment = true; i++; continue }
            if (c === "'" || c === '"' || c === '`') { quote = c; continue }
            if (c === '{') depth++
            else if (c === '}') {
                depth--
                if (depth === 0) return text.slice(start, i + 1)
            }
        }
        return ''
    }

    function splitTopLevel(text) {
        const parts = []
        let start = 0
        let depth = 0
        let quote = ''
        let escaped = false
        for (let i = 0; i < text.length; i++) {
            const c = text[i]
            if (quote) {
                if (escaped) escaped = false
                else if (c === '\\') escaped = true
                else if (c === quote) quote = ''
                continue
            }
            if (c === "'" || c === '"' || c === '`') { quote = c; continue }
            if (c === '{' || c === '[' || c === '(') depth++
            else if (c === '}' || c === ']' || c === ')') depth--
            else if (c === ',' && depth === 0) {
                parts.push(text.slice(start, i))
                start = i + 1
            }
        }
        parts.push(text.slice(start))
        return parts
    }

    function topLevelColon(text) {
        let depth = 0
        let quote = ''
        let escaped = false
        for (let i = 0; i < text.length; i++) {
            const c = text[i]
            if (quote) {
                if (escaped) escaped = false
                else if (c === '\\') escaped = true
                else if (c === quote) quote = ''
                continue
            }
            if (c === "'" || c === '"' || c === '`') { quote = c; continue }
            if (c === '{' || c === '[' || c === '(') depth++
            else if (c === '}' || c === ']' || c === ')') depth--
            else if (c === ':' && depth === 0) return i
        }
        return -1
    }

    function unquoteValue(value) {
        const s = String(value || '').trim()
        const m = /^(['"`])([\s\S]*)\1$/.exec(s)
        if (!m) return undefined
        return m[2].replace(/\\(['"`\\])/g, '$1').replace(/\\n/g, '\n').replace(/\\t/g, '\t')
    }

    function simpleValue(value) {
        const s = String(value || '').trim()
        if (!s) return undefined
        const quoted = unquoteValue(s)
        if (quoted !== undefined) return quoted
        if (s === 'true') return true
        if (s === 'false') return false
        if (s === 'null') return null
        if (/^-?\d+(?:\.\d+)?$/.test(s)) return Number(s)
        return undefined
    }

    function configStringProp(body, name) {
        const m = new RegExp(name + "\\s*:\\s*(['\"`])([\\s\\S]*?)\\1").exec(body)
        return m ? unquoteValue(m[0].replace(new RegExp('^' + name + '\\s*:\\s*', 'i'), '')) : undefined
    }

    function parseConfigFields(source) {
        const match = /exports\.config\s*=\s*\{/.exec(source)
        if (!match) return {}
        const start = match.index + match[0].length - 1
        const block = scanBalanced(source, start)
        if (!block) return {}
        const fields = {}
        for (const raw of splitTopLevel(block.slice(1, -1))) {
            const part = raw.trim()
            if (!part) continue
            const colon = topLevelColon(part)
            if (colon < 0) continue
            const key = unquoteValue(part.slice(0, colon).trim()) || part.slice(0, colon).trim()
            if (!/^[A-Za-z_$][\w$]*$/.test(key)) continue
            const body = part.slice(colon + 1).trim()
            if (!body.startsWith('{')) continue
            const field = {}
            const type = configStringProp(body, 'type')
            if (type) field.type = type
            const label = configStringProp(body, 'label')
            if (label !== undefined) field.label = label
            const helperText = configStringProp(body, 'helperText')
            if (helperText !== undefined) field.helperText = helperText
            const dm = /(?:^|[,{\s])defaultValue\s*:\s*([^,}\n]+)/.exec(body)
            if (dm) {
                const v = simpleValue(dm[1])
                if (v !== undefined) field.defaultValue = v
            }
            const mm = /(?:^|[,{\s])min\s*:\s*(-?\d+(?:\.\d+)?)/.exec(body)
            if (mm) field.min = Number(mm[1])
            const xm = /(?:^|[,{\s])max\s*:\s*(-?\d+(?:\.\d+)?)/.exec(body)
            if (xm) field.max = Number(xm[1])
            const om = /(?:^|[,{\s])options\s*:\s*\{/.exec(body)
            if (om) {
                const ob = scanBalanced(body, om.index + om[0].length - 1)
                if (ob) {
                    const options = {}
                    for (const opt of splitTopLevel(ob.slice(1, -1))) {
                        const c = topLevelColon(opt)
                        if (c < 0) continue
                        const labelKey = unquoteValue(opt.slice(0, c).trim()) || opt.slice(0, c).trim()
                        const optValue = simpleValue(opt.slice(c + 1).trim())
                        if (labelKey) options[labelKey] = optValue ?? opt.slice(c + 1).trim()
                    }
                    if (Object.keys(options).length) field.options = options
                }
            }
            if (Object.keys(field).length) fields[key] = field
        }
        return fields
    }

    async function mapLimit(items, limit, fn) {
        const ret = new Array(items.length)
        let next = 0
        async function worker() {
            for (;;) {
                const i = next++
                if (i >= items.length) return
                ret[i] = await fn(items[i], i).catch(e => ({ error: e.message || String(e) }))
            }
        }
        await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker))
        return ret
    }

    async function syncCatalog(force = false) {
        if (catalogState.syncing && catalogState.promise) return catalogState.promise
        if (!force && !catalogStale()) return catalogState.data
        catalogState.syncing = true
        catalogState.error = null
        catalogState.progress = 'searching GitHub'
        catalogState.promise = (async () => {
            try {
                const headers = {
                    'accept': 'application/vnd.github.v3+json',
                    'user-agent': 'HFS-Plugins-Optimizer',
                }
                const repos = []
                for (let page = 1; page <= 10; page++) {
                    catalogState.progress = `searching GitHub page ${page}`
                    const text = await fetchText(`https://api.github.com/search/repositories?q=topic:hfs-plugin&per_page=100&page=${page}`, { headers })
                    const json = JSON.parse(text)
                    const items = Array.isArray(json.items) ? json.items : []
                    repos.push(...items)
                    if (items.length < 100 || repos.length >= (json.total_count || 0)) break
                }
                const uniq = [...new Map(repos.map(r => [r.full_name, r])).values()]
                catalogState.progress = `reading ${uniq.length} plugin manifests`
                const entries = await mapLimit(uniq, 8, async repo => {
                    const info = {
                        default_branch: repo.default_branch || 'main',
                        pushed_at: repo.pushed_at,
                        stargazers_count: repo.stargazers_count,
                        license: repo.license?.spdx_id || null,
                    }
                    let text = ''
                    let branch = info.default_branch
                    for (const candidate of [`https://raw.githubusercontent.com/${repo.full_name}/${branch}/dist/plugin.js`,
                                             `https://raw.githubusercontent.com/${repo.full_name}/${branch}/plugin.js`]) {
                        try { text = await fetchText(candidate); break } catch {}
                    }
                    const parsed = text ? parsePluginSource(text, repo.full_name, info) : { id: repo.full_name, repo: repo.full_name, ...info }
                    parsed.description = parsed.description || repo.description || ''
                    return parsed
                })
                let hfsVersion = ''
                try { hfsVersion = String(api.require('./const').VERSION || '') } catch {}
                const data = {
                    version: 1,
                    hfsVersion,
                    updatedAt: Date.now(),
                    entries,
                }
                await writeJson(CATALOG_FILE, data)
                catalogState.data = data
                catalogState.progress = ''
                await updateDescriptionsFromCatalog(entries)
                await pruneDescriptions()
                logInfo(`catalog mirror synced: ${entries.length} entries`)
                return data
            } catch (e) {
                catalogState.error = e.message || String(e)
                logError('catalog sync failed: ' + catalogState.error)
                throw e
            } finally {
                catalogState.syncing = false
                catalogState.promise = null
            }
        })()
        return catalogState.promise
    }

    function catalogInfo() {
        const d = catalogState.data
        return {
            count: Array.isArray(d?.entries) ? d.entries.length : 0,
            updatedAt: d?.updatedAt || null,
            syncing: catalogState.syncing,
            progress: catalogState.progress,
            error: catalogState.error,
            path: CATALOG_FILE,
        }
    }

    // ============================================================
    //  Proxy self-test
    // ============================================================
    async function testProxy(host, port) {
        let h = String(host || api.getConfig('proxyHost') || DEFAULT_PROXY_HOST).trim()
        let p = Number(port || api.getConfig('proxyPort') || DEFAULT_PROXY_PORT)
        if (h.includes('://')) {
            try { const u = new URL(h); h = u.hostname; if (u.port) p = +u.port } catch {}
        }
        if (!p) p = DEFAULT_PROXY_PORT
        const started = Date.now()
        const proxy = { protocol: 'http', host: h, port: p, auth: null, url: `http://${h}:${p}` }
        let res
        try {
            res = await runBypassed(async () => {
                if (hfsHttpStream) {
                    // github.com (not api.github.com) validates the tunnel without
                    // consuming the GitHub REST API quota.
                    return await hfsHttpStream('https://github.com/', {
                        proxy: proxy.url,
                        method: 'HEAD',
                        headers: { 'user-agent': 'HFS-Plugins-Optimizer', 'accept': 'text/html' },
                        noRedirect: true,
                        httpThrow: false,
                        timeout: 15000,
                        agent: false,
                    })
                }
                return await requestViaProxyRaw('https://github.com/', 'HEAD',
                    { 'user-agent': 'HFS-Plugins-Optimizer', 'accept': 'text/html' }, undefined, proxy, {})
            })
            const result = {
                ok: !!res.statusCode && res.statusCode >= 200 && res.statusCode < 500,
                statusCode: res.statusCode,
                latencyMs: Date.now() - started,
                host: h,
                port: p,
                at: Date.now(),
            }
            res.resume?.()
            lastProxyTest = result
            logInfo(`proxy test ${result.ok ? 'OK' : 'FAIL'} ${h}:${p} status=${result.statusCode} ${result.latencyMs}ms`)
            return result
        } catch (e) {
            const result = { ok: false, error: e.message || String(e), latencyMs: Date.now() - started, host: h, port: p, at: Date.now() }
            lastProxyTest = result
            logError(`proxy test failed ${h}:${p}: ${result.error}`)
            return result
        }
    }

    // ============================================================
    //  Cache pruning
    // ============================================================
    async function pruneCache() {
        if (!api.getConfig('cacheEnabled')) return
        const maxAgeMs = (api.getConfig('maxAgeDays') || 30) * 86400 * 1000
        let removed = 0
        let dirs = []
        try { dirs = await fs.readdir(CACHE_ROOT, { withFileTypes: true }) } catch { return }
        for (const dirent of dirs) {
            if (!dirent.isDirectory()) continue
            const dir = path.join(CACHE_ROOT, dirent.name)
            try {
                const meta = await readJson(path.join(dir, 'meta.json'))
                if (!meta || Date.now() - (meta.fetchedAt || 0) > maxAgeMs) {
                    await fs.rm(dir, { recursive: true, force: true })
                    removed++
                }
            } catch {}
        }
        if (removed) logInfo(`pruned ${removed} cache entries`)
    }

    // ============================================================
    //  Custom REST API (admin only)
    // ============================================================
    function adminUsernames() {
        const names = new Set(['admin'])
        try {
            const accounts = api.getHfsConfig('accounts') || {}
            for (const [name, account] of Object.entries(accounts)) {
                if (account?.admin === true) names.add(String(name).toLocaleLowerCase())
            }
        } catch {}
        return [...names]
    }

    function assertAdmin(ctx) {
        let ok = false
        try {
            const supplied = String(ctx.get?.('x-optimizer-token') || ctx.headers?.['x-optimizer-token'] || '')
            if (supplied && supplied.length === ADMIN_TOKEN.length
                && crypto.timingSafeEqual(Buffer.from(supplied), Buffer.from(ADMIN_TOKEN)))
                return
        } catch {}
        try { ok = api.ctxBelongsTo(ctx, adminUsernames()) } catch {}
        if (!ok) {
            try {
                const usernames = ctx.state?.usernames
                if (usernames && typeof usernames.has === 'function')
                    ok = adminUsernames().some(name => usernames.has(name))
            } catch {}
        }
        if (!ok) {
            try {
                const username = api.getCurrentUsername?.(ctx)
                if (username) {
                    const account = api.getAccount?.(username)
                    ok = account?.admin === true
                }
            } catch {}
        }
        if (!ok) throw Error('admin only')
    }

    function redactedConfig() {
        let cfg = {}
        try { cfg = { ...api.getConfig() } } catch {}
        if (cfg.githubToken) cfg.githubToken = '***'
        if (cfg.proxyPass) cfg.proxyPass = '***'
        return cfg
    }

    async function statusPayload() {
        const idx = await loadIndex().catch(() => ({ entries: {} }))
        const entries = Object.values(idx.entries || {})
        let totalBytes = 0
        for (const e of entries) totalBytes += e.bodyLength || 0
        const proxy = effectiveProxy()
        const hits = stats.hits
        const misses = stats.misses
        const total = hits + misses
        return {
            ok: true,
            version: exports.version,
            storageDir,
            cacheDir: CACHE_ROOT,
            config: redactedConfig(),
            network: {
                enabled: true,
            },
            proxy: {
                enabled: !!api.getConfig('proxyEnabled'),
                active: !!proxy,
                host: proxy?.host || String(api.getConfig('proxyHost') || DEFAULT_PROXY_HOST),
                port: proxy?.port || Number(api.getConfig('proxyPort') || DEFAULT_PROXY_PORT),
                lastTest: lastProxyTest,
            },
            cache: {
                enabled: !!api.getConfig('cacheEnabled'),
                entries: entries.length,
                bytes: totalBytes,
                hits,
                misses,
                hitRate: total ? Math.round(hits / total * 100) : 0,
                inFlight: inFlight.size,
                blacklist: failCache.size,
                ttlHours: api.getConfig('ttlHours'),
                pluginTtlHours: api.getConfig('pluginTtlHours'),
                maxAgeDays: api.getConfig('maxAgeDays'),
            },
            catalog: catalogInfo(),
            hidden: hiddenList(),
            stats: { ...stats },
        }
    }

    const CONFIG_COERCERS = {
        enabled: v => !!v,
        debug: v => !!v,
        proxyEnabled: v => !!v,
        cacheEnabled: v => !!v,
        cacheApi: v => !!v,
        cacheRaw: v => !!v,
        cacheGithubHtml: v => !!v,
        skipSuspiciousHtml: v => !!v,
        normalizeUrl: v => !!v,
        proxyHost: v => {
            let s = String(v || '').trim()
            if (s.includes('://')) { try { const u = new URL(s); return u.hostname || DEFAULT_PROXY_HOST } catch {} }
            if (s.includes(':') && !s.includes(']')) return s.split(':')[0] || DEFAULT_PROXY_HOST
            return s || DEFAULT_PROXY_HOST
        },
        proxyPort: v => Math.min(65535, Math.max(1, Number(v) || DEFAULT_PROXY_PORT)),
        ttlHours: v => Math.min(720, Math.max(0.1, Number(v) || 24)),
        pluginTtlHours: v => Math.min(720, Math.max(0.1, Number(v) || 6)),
        maxAgeDays: v => Math.min(365, Math.max(1, Number(v) || 30)),
        catalogSyncHours: v => Math.min(720, Math.max(0, Number(v) || 0)),
        maxConcurrent: v => Math.min(64, Math.max(1, Number(v) || 20)),
        retryCount: v => Math.min(5, Math.max(0, Number(v) || 0)),
        requestTimeoutSec: v => Math.min(120, Math.max(3, Number(v) || 30)),
        failBlacklistThreshold: v => Math.min(10, Math.max(0, Number(v) || 0)),
        failBlacklistSeconds: v => Math.min(3600, Math.max(10, Number(v) || 60)),
        githubToken: v => String(v || ''),
        githubHosts: v => String(v || '').split(',').map(s => s.trim()).filter(Boolean).join(','),
    }

    async function saveConfig(params) {
        const changes = {}
        for (const [k, coerce] of Object.entries(CONFIG_COERCERS)) {
            if (Object.prototype.hasOwnProperty.call(params || {}, k))
                changes[k] = coerce(params[k])
        }
        for (const [k, v] of Object.entries(changes)) {
            try { api.setConfig(k, v) } catch (e) { logError(`setConfig ${k}: ${e.message}`) }
        }
        failCache.clear()
        logDebug('config saved', changes)
        return { ok: true, config: redactedConfig() }
    }

    async function customRestStatus(params, ctx) {
        assertAdmin(ctx)
        return statusPayload()
    }

    async function customRestSaveConfig(params, ctx) {
        assertAdmin(ctx)
        return saveConfig(params)
    }

    async function customRestSetHidden(params, ctx) {
        assertAdmin(ctx)
        return { ok: true, hidden: await setHiddenList(params?.hidden) }
    }

    async function customRestTestProxy(params, ctx) {
        assertAdmin(ctx)
        return testProxy(params?.host, params?.port)
    }

    async function customRestClearCache(params, ctx) {
        assertAdmin(ctx)
        await fs.rm(CACHE_ROOT, { recursive: true, force: true }).catch(() => {})
        await fs.rm(META_FILE, { force: true }).catch(() => {})
        await fs.mkdir(CACHE_ROOT, { recursive: true })
        inFlight.clear()
        failCache.clear()
        stats.hits = stats.misses = stats.bytesSaved = 0
        return { ok: true }
    }

    async function customRestClearBlacklist(params, ctx) {
        assertAdmin(ctx)
        const n = failCache.size
        failCache.clear()
        return { ok: true, cleared: n }
    }

    async function customRestSyncCatalog(params, ctx) {
        assertAdmin(ctx)
        const data = await syncCatalog(!!params?.force)
        return { ok: true, catalog: catalogInfo(), entries: data?.entries?.length || 0 }
    }

    async function customRestCatalog(params, ctx) {
        assertAdmin(ctx)
        const data = catalogState.data || await loadCatalog()
        return { ok: true, catalog: catalogInfo(), entries: data?.entries || [] }
    }

    async function customRestDescriptions(params, ctx) {
        assertAdmin(ctx)
        return { ok: true, descriptions: await loadDescriptions() }
    }

    async function customRestSaveDescriptions(params, ctx) {
        assertAdmin(ctx)
        const descriptions = await saveDescriptions(Array.isArray(params?.entries) ? params.entries : [])
        return { ok: true, descriptions }
    }

    async function readLocalPluginSource(id) {
        const wanted = String(id || '').trim().toLowerCase()
        if (!wanted) return ''
        try {
            const dirs = await fs.readdir(PLUGINS_ROOT, { withFileTypes: true })
            const dir = dirs.find(d => d.isDirectory() && d.name.toLowerCase() === wanted)
            if (!dir) return ''
            return await fs.readFile(path.join(PLUGINS_ROOT, dir.name, 'plugin.js'), 'utf8')
        } catch { return '' }
    }

    async function customRestPluginVersions(params, ctx) {
        assertAdmin(ctx)
        const versions = {}
        try {
            const entries = await fs.readdir(PLUGINS_ROOT, { withFileTypes: true })
            for (const entry of entries) {
                if (!entry.isDirectory()) continue
                const source = await fs.readFile(path.join(PLUGINS_ROOT, entry.name, 'plugin.js'), 'utf8').catch(() => '')
                const match = source.match(/exports\.version\s*=\s*([^\r\n;]+)/)
                if (!match) continue
                let value = match[1].trim().replace(/^['"]|['"]$/g, '')
                if (/^-?\d+(?:\.\d+)?$/.test(value)) value = Number(value)
                else value = value.replace(/;+$/, '').trim()
                if (value !== '') versions[entry.name] = value
            }
        } catch {}
        return { ok: true, versions }
    }

    async function customRestOnlinePlugin(params, ctx) {
        assertAdmin(ctx)
        const repo = String(params?.repo || '').trim()
        if (repo && !/^[\w.-]+\/[\w.-]+$/.test(repo)) throw Error('bad repo')
        let source = await readLocalPluginSource(params?.id)
        let sourceUrl = source ? 'local' : ''
        const urls = [
            `https://raw.githubusercontent.com/${repo}/main/dist/plugin.js`,
            `https://raw.githubusercontent.com/${repo}/master/dist/plugin.js`,
            `https://raw.githubusercontent.com/${repo}/main/plugin.js`,
            `https://raw.githubusercontent.com/${repo}/master/plugin.js`,
        ]
        if (!source && repo) {
            for (const url of urls) {
                try {
                    source = await fetchText(url, { timeout: 20000 })
                    sourceUrl = url
                    break
                } catch {}
            }
        }
        if (!source) return { ok: false, error: 'plugin.js not found' }
        const parsed = parsePluginSource(source, repo, {})
        const fields = parseConfigFields(source)
        return {
            ok: true,
            plugin: {
                id: parsed.id,
                repo,
                author: String(parsed.author || repo.split('/')[0] || '').trim(),
                description: parsed.description || '',
                version: parsed.version ?? null,
                branch: /\/main\//.test(sourceUrl) ? 'main' : 'master',
                sourceUrl,
                fields,
            },
        }
    }

    async function customRestDownloads(params, ctx) {
        assertAdmin(ctx)
        return { ok: true, downloads: [...activeDownloads.values()] }
    }

    async function customRestTree(params, ctx) {
        assertAdmin(ctx)
        return { ok: true, tree: await loadTree() }
    }

    async function customRestSaveTree(params, ctx) {
        assertAdmin(ctx)
        const tree = await saveTree(params?.tree)
        pruneDescriptions().catch(() => {})
        return { ok: true, tree }
    }

    async function customRestResetTree(params, ctx) {
        assertAdmin(ctx)
        return { ok: true, tree: await resetTree() }
    }

    async function customRestRestoreBeforeReset(params, ctx) {
        assertAdmin(ctx)
        return { ok: true, tree: await restoreBeforeReset() }
    }

    async function customRestSnapshotTree(params, ctx) {
        assertAdmin(ctx)
        return { ok: true, tree: await snapshotTree(params?.tree) }
    }

    async function customRestUiState(params, ctx) {
        assertAdmin(ctx)
        return { ok: true, ui: await loadUiState() }
    }

    async function customRestSaveUiState(params, ctx) {
        assertAdmin(ctx)
        return { ok: true, ui: await saveUiState(params?.ui) }
    }

    async function customRestRestoreLatest(params, ctx) {
        assertAdmin(ctx)
        return { ok: true, tree: await restoreLatestTree() }
    }

    async function customRestFreezeTree(params, ctx) {
        assertAdmin(ctx)
        return { ok: true, tree: await freezeTree() }
    }

    // ============================================================
    //  Admin-panel HTML injection
    // ============================================================
    function middleware(ctx) {
        // Admin panel extensions are intentionally independent from the
        // network modules and have no on/off switch of their own.
        if (ctx.method !== 'GET') return
        if (ctx.path !== '/~/admin' && ctx.path !== '/~/admin/') return
        return () => {
            if (typeof ctx.body !== 'string' || ctx.body.includes('plugins-optimizer-admin')) return
            const base = (ctx.state?.revProxyPath || '') + '/~/plugins/Plugins-Optimizer/admin.js'
            const src = `${base}?v=${encodeURIComponent(String(exports.version))}`
            const hidden = JSON.stringify(hiddenList()).replace(/</g, '\\u003c')
            const data = `<script>window.__OPTIMIZER_HIDDEN__=${hidden};window.__OPTIMIZER_TOKEN__=${JSON.stringify(ADMIN_TOKEN)};window.__OPTIMIZER_VERSION__=${JSON.stringify(String(exports.version))};window.__OPTIMIZER_HAS_TREE__=${hasSavedTreeStorage ? 'true' : 'false'}</script>`
            const tag = `<script id="plugins-optimizer-admin" src="${src}"></script>`
            // Load in <head> (before the admin module) so we can quiet the live
            // plugin-list EventSource before React creates it. The script itself
            // waits for DOMContentLoaded before touching the page. The tiny inline
            // script carries the hidden list from storage, not from config.yaml.
            if (ctx.body.includes('</head>'))
                ctx.body = ctx.body.replace('</head>', data + tag + '</head>')
            else if (ctx.body.includes('</body>'))
                ctx.body = ctx.body.replace('</body>', data + tag + '</body>')
        }
    }

    // ============================================================
    //  Startup
    // ============================================================
    await ensureStorage()
    await loadIndex()
    await loadCatalog()
    await loadDescriptions()
    if (catalogState.data?.entries?.length) await updateDescriptionsFromCatalog(catalogState.data.entries)
    else await saveDescriptions([])
    await loadHidden()
    await loadTree()
    await pruneDescriptions()

    // Simplify old configs: the current VPN proxy requires no username/password.
    for (const legacyKey of ['proxyUser', 'proxyPass']) {
        try {
            if (api.getConfig(legacyKey) !== undefined) api.setConfig(legacyKey, null)
        } catch {}
    }

    const unpatch = installHttpsPatch()

    // Good to know immediately, but never block startup.
    setTimeout(() => {
        const p = effectiveProxy()
        if (p) testProxy(p.host, p.port).catch(() => {})
    }, 5000)

    setTimeout(() => pruneCache().catch(e => logDebug('prune failed: ' + e.message)), 8000)

    setTimeout(() => {
        if (networkOn() && catalogStale()) syncCatalog(false).catch(() => {})
    }, 15000)

    const catalogTimer = setInterval(() => {
        if (networkOn() && catalogStale()) syncCatalog(false).catch(() => {})
    }, 60 * 60 * 1000)
    if (catalogTimer.unref) catalogTimer.unref()

    const p = effectiveProxy()
    logInfo(`loaded v${exports.version}; proxy=${p ? `${p.host}:${p.port}` : 'off'}; cache=${api.getConfig('cacheEnabled') ? 'on' : 'off'}; catalog=${catalogInfo().count} entries`)

    const handleDescriptionEvent = event => {
        updateDescriptionFromPlugin(event).catch(e => logDebug('description update failed: ' + e.message))
    }
    api.events?.on?.('pluginInstalled', handleDescriptionEvent)
    api.events?.on?.('pluginUpdated', handleDescriptionEvent)

    return {
        middleware,
        customRest: {
            pluginsOptimizer_status: customRestStatus,
            pluginsOptimizer_saveConfig: customRestSaveConfig,
            pluginsOptimizer_setHidden: customRestSetHidden,
            pluginsOptimizer_testProxy: customRestTestProxy,
            pluginsOptimizer_clearCache: customRestClearCache,
            pluginsOptimizer_clearBlacklist: customRestClearBlacklist,
            pluginsOptimizer_syncCatalog: customRestSyncCatalog,
            pluginsOptimizer_catalog: customRestCatalog,
            pluginsOptimizer_pluginVersions: customRestPluginVersions,
            pluginsOptimizer_descriptions: customRestDescriptions,
            pluginsOptimizer_saveDescriptions: customRestSaveDescriptions,
            pluginsOptimizer_onlinePlugin: customRestOnlinePlugin,
            pluginsOptimizer_downloads: customRestDownloads,
            pluginsOptimizer_tree: customRestTree,
            pluginsOptimizer_saveTree: customRestSaveTree,
            pluginsOptimizer_resetTree: customRestResetTree,
            pluginsOptimizer_restoreBeforeReset: customRestRestoreBeforeReset,
            pluginsOptimizer_restoreLatest: customRestRestoreLatest,
            pluginsOptimizer_snapshotTree: customRestSnapshotTree,
            pluginsOptimizer_uiState: customRestUiState,
            pluginsOptimizer_saveUiState: customRestSaveUiState,
            pluginsOptimizer_freezeTree: customRestFreezeTree,
        },
        unload() {
            clearInterval(catalogTimer)
            try { unpatch() } catch {}
            logDebug('unloaded')
        },
    }
}

