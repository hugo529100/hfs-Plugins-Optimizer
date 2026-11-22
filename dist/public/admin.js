/* Plugins Optimizer - Admin panel extension
 *
 * Injected by the plugin's middleware into /~/admin/.
 * Adds:
 *   - a PluginTree sidebar shortcut to the Skill Tree
 *   - per-branch/plugin visual customization inside the Skill Tree
 *
 * Everything is stored server-side in the plugin config (hiddenPlugins) so it
 * survives browser reloads and HFS restarts.
 */
(function () {
    'use strict'

    if (!location.pathname.includes('/~/admin')) return

    const PLUGIN_ID = 'Plugins-Optimizer'
    const DIVIDER_ID = '__optimizer_rejetto_divider__'
    const API_BASE = (function () {
        const i = location.pathname.indexOf('/~/admin')
        const prefix = i >= 0 ? location.pathname.slice(0, i) : ''
        return location.origin + prefix + '/~/api/'
    })()
    const LS_KEY = 'pluginsOptimizer.hidden.v2'
    const LS_TREE_BACKUP = 'pluginsOptimizer.treeBackup.v1'
    const LS_TREE_VIEW = 'pluginsOptimizer.treeView.v1'
    function debugEnabled() {
        const value = state.config?.debug
        return value === true || value === 'true' || value === 1 || value === '1'
    }
    const debugLog = (...a) => { if (debugEnabled()) console.debug('[optimizer]', ...a) }
    const debugError = (...a) => { if (debugEnabled()) console.error('[optimizer]', ...a) }

    const BRANCH_COLORS = [
        '#ff3b30', '#ff6b00', '#ff9800', '#ffc107',
        '#ffe600', '#a8e000', '#4caf50', '#00c853',
        '#00bcd4', '#2196f3', '#3f51b5', '#9c27b0',
    ]
    const treeOrientation = () => (window.innerHeight >= window.innerWidth ? 'portrait' : 'landscape')
    const readTreeViewStore = () => {
        try {
            const raw = JSON.parse(localStorage.getItem(LS_TREE_VIEW) || '{}')
            if (Number.isFinite(Number(raw.x)) && Number.isFinite(Number(raw.y)))
                return { [treeOrientation()]: raw }
            return raw && typeof raw === 'object' ? raw : {}
        } catch { return {} }
    }
    const $ = (sel, root) => (root || document).querySelector(sel)
    const $$ = (sel, root) => [...(root || document).querySelectorAll(sel)]

    const ICONS = {
        eye: '<svg class="MuiSvgIcon-root MuiSvgIcon-fontSizeMedium" width="24" height="24" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/></svg>',
        eyeOff: '<svg class="MuiSvgIcon-root MuiSvgIcon-fontSizeMedium" width="24" height="24" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z"/></svg>',
        restore: '<svg class="MuiSvgIcon-root MuiSvgIcon-fontSizeMedium" width="24" height="24" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M12.5 8c-2.65 0-5.05.99-6.9 2.6L2 7v9h9l-3.62-3.62c1.39-1.16 3.16-1.88 5.12-1.88 3.54 0 6.55 2.31 7.6 5.5l2.37-.78C21.08 11.03 17.15 8 12.5 8z"/></svg>',
        tune: '<svg class="MuiSvgIcon-root MuiSvgIcon-fontSizeMedium" width="24" height="24" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M3 17v2h6v-2H3zM3 5v2h10V5H3zm10 16v-2h8v-2h-8v-2h-2v6h2zM7 9v2H3v2h4v2h2V9H7zm14 4v-2H11v2h10zm-6-4h2V7h4V5h-4V3h-2v6z"/></svg>',
        refresh: '<svg class="MuiSvgIcon-root MuiSvgIcon-fontSizeMedium" width="24" height="24" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M17.65 6.35A7.95 7.95 0 0 0 12 4a8 8 0 1 0 7.73 10h-2.08A6 6 0 1 1 12 6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/></svg>',
        star: '<svg class="MuiSvgIcon-root MuiSvgIcon-fontSizeMedium" width="24" height="24" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" d="m12 3.6 2.47 5.01 5.53.8-4 3.9.94 5.5L12 16.2l-4.94 2.61.94-5.5-4-3.9 5.53-.8z"/></svg>',
        lock: '<svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="10" width="14" height="10" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3" fill="none" stroke="currentColor" stroke-width="2"/></svg>',
        unlock: '<svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="10" width="14" height="10" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><path d="M16 10V7a4 4 0 0 0-7.7-1.5" fill="none" stroke="currentColor" stroke-width="2"/></svg>',
        starFilled: '<svg class="MuiSvgIcon-root MuiSvgIcon-fontSizeMedium" width="24" height="24" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="m12 3.6 2.47 5.01 5.53.8-4 3.9.94 5.5L12 16.2l-4.94 2.61.94-5.5-4-3.9 5.53-.8z"/></svg>',
    }

    let treeOpQueue = Promise.resolve()

    const state = {
        hidden: new Set(),
        showHidden: false,
        status: null,
        config: null,
        panel: null,
        tab: null,
        tabsRoot: null,
        root: null,
        active: false,
        paneDisplays: new Map(),
        dirty: false,
        busy: false,
        lastError: '',
        gridApi: null,
        rejettoComparator: null,
        nativeSortRestored: false,
        allRows: null,
        updates: new Set(),
        updatesLoading: false,
        serverDownloads: new Set(),
        errorsAnnounced: false,
        skillActive: false,
        sidebarPending: false,
        sidebarTree: null,
        sidebarPlugins: null,
        skillTab: null,
        skillPanel: null,
        tree: null,
        installed: new Map(),
        pluginRows: [],
        treeLoaded: false,
        treeFitted: false,
        descriptions: {},
        descriptionsLoaded: false,
        treePan: { x: 24, y: 20 },
        treeZoom: .9,
        treeDrag: null,
        treeSaveTimer: null,
        treeSettings: new Set(),
        treeExpanded: new Set(),
        treeShowUnloaded: new Set(),
        settingsOpenId: null,
        settingsEl: null,
        settingsHeight: 330,
        settingsPanels: new Map(),
        outputId: null,
        outputEl: null,
        outputTimer: null,
        ui: { openSettings: [], settingsHeights: {}, expandedHidden: [] },
        uiLoaded: false,
        uiRestored: false,
        uiSaveTimer: null,
        descPanels: new Map(),
        descPinned: false,
        treeViewTimer: null,
        viewOrientation: treeOrientation(),
    }

    try {
        const savedView = readTreeViewStore()[state.viewOrientation]
        if (savedView && Number.isFinite(Number(savedView.x)) && Number.isFinite(Number(savedView.y))) {
            state.treePan = { x: Number(savedView.x), y: Number(savedView.y) }
            const z = Number(savedView.zoom)
            if (Number.isFinite(z) && z >= .2 && z <= 2) state.treeZoom = z
            state.treeFitted = true
        }
    } catch {}

    let orientationViewTimer = null
    window.addEventListener('resize', () => {
        if (orientationViewTimer) clearTimeout(orientationViewTimer)
        orientationViewTimer = setTimeout(() => {
            orientationViewTimer = null
            if (state.skillPanel) switchTreeViewOrientation()
        }, 150)
    })

    // Hidden rows are also hidden by generated CSS, so they never flash into view
    // before the React grid has finished rendering. The initial value comes from
    // HFS.plugins (requires hiddenPlugins.frontend = true) plus localStorage.
    function parseHiddenValue(raw) {
        if (Array.isArray(raw)) return raw.map(String).map(s => s.trim()).filter(Boolean)
        return String(raw || '').split(/[\n,]+/).map(s => s.trim()).filter(Boolean)
    }

    function cssAttrValue(value) {
        return String(value).replace(/\\/g, '\\\\').replace(/"/g, '\\"')
    }

    function updateRouteAttribute() {
        const h = location.hash
        if (h.includes('/plugins/installed'))
            document.documentElement.dataset.optimizerInstalled = '1'
        else
            delete document.documentElement.dataset.optimizerInstalled
    }

    function treeIsStarred(id) {
        if (!Array.isArray(state.tree?.stars)) return false
        return state.tree.stars.some(star => samePluginId(star, id))
    }

    function updateHiddenCss() {
        // The Installed hide feature is retired. Keep the persisted hidden data
        // untouched, but never hide native rows again.
        const style = document.getElementById('optimizer-hidden-css')
        if (style) style.textContent = ''
    }

    updateRouteAttribute()

    function loadInitialHidden() {
        const ids = []
        try { ids.push(...parseHiddenValue(window.__OPTIMIZER_HIDDEN__)) } catch {}
        try {
            const raw = localStorage.getItem(LS_KEY)
            if (raw) ids.push(...parseHiddenValue(JSON.parse(raw)))
        } catch {}
        state.hidden = new Set(ids)
        updateHiddenCss()
    }

    loadInitialHidden()

    // ============================================================
    //  API
    // ============================================================
    async function apiCall(cmd, params, opts) {
        const timeout = (opts && opts.timeout) || 20000
        const externalSignal = opts && opts.signal
        const controller = !externalSignal && typeof AbortController !== 'undefined' ? new AbortController() : null
        const timer = setTimeout(() => controller && controller.abort('timeout'), timeout)
        try {
            const headers = { 'content-type': 'application/json', 'x-hfs-anti-csrf': '1' }
            if (window.__OPTIMIZER_TOKEN__) headers['x-optimizer-token'] = window.__OPTIMIZER_TOKEN__
            const res = await fetch(API_BASE + cmd, {
                method: 'POST',
                headers,
                body: JSON.stringify(params || {}),
                credentials: 'same-origin',
                signal: externalSignal || (controller ? controller.signal : undefined),
            })
            const text = await res.text()
            let data
            try { data = text ? JSON.parse(text) : null } catch { data = text }
            if (!res.ok) {
                const details = Array.isArray(data) ? data
                    : Array.isArray(data?.cause) ? data.cause
                    : null
                let msg = typeof data === 'string' ? data : (data && (data.message || data.error)) || `HTTP ${res.status}`
                if (res.status === 424 && details?.length) {
                    msg = 'Needs support plugin' + (details.length > 1 ? 's' : '') + ': '
                        + details.map(item => `${item.id || item.repo} (${item.error || 'missing'})`).join(', ')
                } else if (res.status === 404) {
                    msg = 'Package source not found (404). Check the repository/branch, or install the required support plugin first.'
                } else if (typeof msg === 'string' && /^\s*Error:/.test(msg)) {
                    msg = msg.split(/\n|\s+at\s+/)[0].trim()
                }
                const err = new Error(msg)
                err.code = res.status
                err.details = details
                throw err
            }
            return data
        } finally {
            clearTimeout(timer)
        }
    }

    const rest = (name, params, opts) => apiCall('_' + name, params, opts)

    function toast(message, type, ms) {
        const fullscreenPanel = document.fullscreenElement
            || (state.skillPanel?.classList.contains('skill-fullscreen') ? state.skillPanel : null)
        const mount = fullscreenPanel || document.body
        let host = document.getElementById('optimizer-toast-host')
        if (!host) {
            host = document.createElement('div')
            host.id = 'optimizer-toast-host'
        }
        if (host.parentElement !== mount) mount.appendChild(host)
        const el = document.createElement('div')
        el.className = 'opt-toast' + (type ? ' opt-toast-' + type : '')
        el.textContent = String(message)
        host.appendChild(el)
        setTimeout(() => { el.classList.add('opt-toast-out'); setTimeout(() => el.remove(), 250) }, ms || 3200)
    }

    function paintConfirmSurface(overlay, box) {
        let surface = ''
        try {
            const card = state.skillPanel?.querySelector('.skill-card')
            if (card) surface = getComputedStyle(card).backgroundColor
        } catch {}
        if (!surface || surface === 'rgba(0, 0, 0, 0)' || surface === 'transparent') {
            try {
                surface = getComputedStyle(document.documentElement)
                    .getPropertyValue('--active-button-bg').trim()
            } catch {}
        }
        if (!surface) surface = '#1b1b1b'
        overlay.style.setProperty('background-color', 'transparent', 'important')
        overlay.style.setProperty('pointer-events', 'none', 'important')
        box.style.setProperty('background-color', surface, 'important')
        box.style.setProperty('color', '#eee', 'important')
        box.style.setProperty('pointer-events', 'auto', 'important')
    }

    function uiDialog({ text, okLabel = 'Confirm', input = false, value = '' }) {
        return new Promise(resolve => {
            const overlay = document.createElement('div')
            overlay.className = 'opt-confirm'
            const box = document.createElement('div')
            box.className = 'opt-confirm-box'
            const msg = document.createElement('div')
            msg.className = 'opt-confirm-text'
            msg.textContent = text
            box.appendChild(msg)
            let field = null
            if (input) {
                field = document.createElement('input')
                field.type = 'text'
                field.className = 'opt-confirm-input'
                field.value = value
                box.appendChild(field)
            }
            const actions = document.createElement('div')
            actions.className = 'opt-confirm-actions'
            const cancel = document.createElement('button')
            cancel.type = 'button'
            cancel.className = 'opt-btn'
            cancel.textContent = 'Cancel'
            const ok = document.createElement('button')
            ok.type = 'button'
            ok.className = 'opt-btn opt-primary'
            ok.textContent = okLabel
            actions.append(ok, cancel)
            box.appendChild(actions)
            overlay.appendChild(box)
            paintConfirmSurface(overlay, box)
            ok.style.setProperty('background-color', '#ff9800', 'important')
            ok.style.setProperty('color', '#111', 'important')
            cancel.style.setProperty('background-color', '#2a2a2a', 'important')
            cancel.style.setProperty('color', '#eee', 'important')
            if (field) {
                field.style.setProperty('background-color', '#2a2a2a', 'important')
                field.style.setProperty('color', '#eee', 'important')
            }
            const fullscreenPanel = document.fullscreenElement
                || (state.skillPanel?.classList.contains('skill-fullscreen') ? state.skillPanel : null)
            const mount = fullscreenPanel || document.body
            mount.appendChild(overlay)
            const close = result => {
                overlay.remove()
                document.removeEventListener('keydown', onKey, true)
                resolve(result)
            }
            const accept = () => close(input ? (field.value.trim() || null) : true)
            const onKey = ev => {
                if (ev.key === 'Escape') { ev.preventDefault(); close(input ? null : false) }
                else if (ev.key === 'Enter' && (!input || document.activeElement === field)) {
                    ev.preventDefault()
                    accept()
                }
            }
            cancel.addEventListener('click', () => close(input ? null : false))
            ok.addEventListener('click', accept)
            document.addEventListener('keydown', onKey, true)
            setTimeout(() => {
                if (input) { field.focus(); field.select() }
                else ok.focus()
            }, 0)
        })
    }

    const uiConfirm = (text, okLabel = 'Confirm') => uiDialog({ text, okLabel })
    const uiPrompt = (text, value = '', okLabel = 'OK') => uiDialog({ text, okLabel, input: true, value })

    function fmtBytes(n) {
        n = Number(n) || 0
        if (n < 1024) return n + ' B'
        if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' KB'
        if (n < 1024 * 1024 * 1024) return (n / 1024 / 1024).toFixed(1) + ' MB'
        return (n / 1024 / 1024 / 1024).toFixed(2) + ' GB'
    }

    function fmtTime(ts) {
        if (!ts) return 'never'
        try { return new Date(ts).toLocaleString() } catch { return String(ts) }
    }

    // ============================================================
    //  Hidden set persistence
    // ============================================================
    let hiddenSave = Promise.resolve()
    let hiddenDirtyAt = 0

    function loadLocalHidden() {
        try {
            const raw = localStorage.getItem(LS_KEY)
            if (!raw) return
            for (const id of parseHiddenValue(JSON.parse(raw))) state.hidden.add(String(id))
            updateHiddenCss()
        } catch {}
    }

    function persistHidden() {
        const list = [...state.hidden]
        hiddenDirtyAt = Date.now()
        updateHiddenCss()
        try { localStorage.setItem(LS_KEY, JSON.stringify(list)) } catch {}
        hiddenSave = hiddenSave.then(() => rest('pluginsOptimizer_setHidden', { hidden: list }))
            .catch(e => {
                toast('Could not save hidden list: ' + e.message, 'error')
            })
    }

    // ============================================================
    //  Find the plugins page
    // ============================================================
    function findTablist() {
        const lists = $$('[role="tablist"]')
        return lists.find(list => {
            const texts = $$('[role="tab"]', list).map(b => b.textContent.trim())
            return texts.includes('Installed') && texts.includes('Get more') && texts.includes('Check updates')
        }) || (location.hash.includes('/plugins/') ? lists[0] || null : null)
    }

    function selectedNativeLabel(list) {
        const tab = $$('[role="tab"]', list).find(b => !b.dataset.optimizerTab && b.getAttribute('aria-selected') === 'true')
        return tab ? tab.textContent.trim() : ''
    }

    function selectNativeTab(list) {
        return $$('[role="tab"]', list).find(b => !b.dataset.optimizerTab && !b.dataset.skillTab && b.getAttribute('aria-selected') === 'true')
            || $$('[role="tab"]', list).find(b => !b.dataset.optimizerTab && !b.dataset.skillTab)
    }

    // ============================================================
    //  Tab
    // ============================================================
    function ensureTab(list) {
        if (!list) return
        let tab = $('[data-optimizer-tab]', list)
        if (!tab) {
            const native = list.querySelector('[role="tab"]')
            if (!native) return
            tab = native.cloneNode(true)
            tab.dataset.optimizerTab = '1'
            tab.classList.add('opt-tab')
            tab.classList.remove('Mui-selected')
            tab.removeAttribute('id')
            tab.removeAttribute('aria-controls')
            tab.setAttribute('aria-selected', 'false')
            tab.setAttribute('aria-label', 'Optimizer settings')
            tab.tabIndex = -1
            tab.textContent = 'OPTIMIZER'
            tab.addEventListener('click', ev => {
                ev.preventDefault()
                ev.stopPropagation()
                activateTab()
            })
            const indicator = $('.MuiTabs-indicator', list)
            if (indicator) list.insertBefore(tab, indicator)
            else list.appendChild(tab)
            if (!list.dataset.optimizerBound) {
                list.dataset.optimizerBound = '1'
                list.addEventListener('click', ev => {
                    const t = ev.target.closest && ev.target.closest('[role="tab"]')
                    if (t && !t.dataset.optimizerTab && state.active) deactivateTab()
                }, true)
            }
        }
        state.tab = tab
        ensurePanel(list)
    }

    function ensureSidebarButton() {
        const name = document.querySelector('#hfs-name')
        const list = name?.closest('ul')
        if (!list) return
        if (!document.getElementById('optimizer-sidebar-style')) {
            const style = document.createElement('style')
            style.id = 'optimizer-sidebar-style'
            style.textContent = `
                .optimizer-sidebar-tree .MuiListItemIcon-root svg { width: 22px; height: 22px; }
                .optimizer-sidebar-tree[data-active="1"] { background-color: rgba(255, 153, 0, .09) !important; color: var(--active-focus-color, #ff9800) !important; }
                .optimizer-sidebar-tree[data-active="1"] .MuiListItemIcon-root,
                .optimizer-sidebar-tree[data-active="1"] .MuiListItemText-primary { color: var(--active-focus-color, #ff9800) !important; font-weight: 600; }
            `
            document.head.appendChild(style)
        }
        let btn = document.querySelector('[data-optimizer-plugin-tree]')
        if (btn && !list.contains(btn)) {
            btn.remove()
            btn = null
        }
        if (!btn) {
            const plugins = [...list.querySelectorAll('a')].find(a => (a.getAttribute('href') || '').includes('/plugins'))
            btn = document.createElement('a')
            btn.href = pluginTreePageHref()
            btn.tabIndex = 0
            btn.dataset.optimizerPluginTree = '1'
            btn.setAttribute('aria-label', 'PluginTree')
            btn.className = (plugins?.className || 'MuiButtonBase-root MuiListItemButton-root MuiListItemButton-gutters') + ' optimizer-sidebar-tree'
            btn.classList.remove('Mui-selected')
            const iconClass = plugins?.querySelector('.MuiListItemIcon-root')?.className || 'MuiListItemIcon-root'
            const textClass = plugins?.querySelector('.MuiListItemText-root')?.className || 'MuiListItemText-root'
            const primaryClass = plugins?.querySelector('.MuiListItemText-primary')?.className || 'MuiTypography-root MuiTypography-body1 MuiListItemText-primary'
            btn.innerHTML = `<div class="${iconClass}"><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M3 4h7v4H3V4zm0 6h7v4H3v-4zm0 6h7v4H3v-4zm9-12h9v2h-9V4zm0 6h9v2h-9v-2zm0 6h9v2h-9v-2z"/></svg></div><div class="${textClass}"><span class="${primaryClass}">PluginTree</span></div>`
            btn.addEventListener('click', ev => {
                ev.preventDefault()
                ev.stopPropagation()
                state.sidebarPending = true
                if (!location.hash.includes('/plugins/installed')) {
                    location.hash = '#/plugins/installed'
                    return
                }
                const tabs = findTablist()
                if (!tabs) return
                ensureSkillTab(tabs)
                state.sidebarPending = false
                navigateToPluginTreePage()
            })
            if (plugins) plugins.insertAdjacentElement('beforebegin', btn)
            else list.appendChild(btn)
        }
        state.sidebarTree = btn
        state.sidebarPlugins = [...list.querySelectorAll('a')].find(a => !a.hasAttribute('data-optimizer-plugin-tree') && (a.getAttribute('href') || '').includes('/plugins')) || null
        if (state.sidebarPlugins && !state.sidebarPlugins.dataset.optimizerPluginsBound) {
            state.sidebarPlugins.dataset.optimizerPluginsBound = '1'
            state.sidebarPlugins.addEventListener('click', () => {
                if (state.skillActive) deactivateSkillTab()
            })
        }
        updateSidebarActive()
    }

    function updateSidebarActive() {
        if (!state.sidebarTree) return
        const active = !!state.skillActive && location.hash.includes('/plugins/installed')
        state.sidebarTree.dataset.active = active ? '1' : '0'
        if (state.sidebarPlugins) {
            if (active) state.sidebarPlugins.classList.remove('Mui-selected')
            else if (location.hash.includes('/plugins/installed')) state.sidebarPlugins.classList.add('Mui-selected')
        }
    }

    function ensureSkillTab(list) {
        if (!list) return
        let tab = $('[data-skill-tab]', list)
        if (!tab) {
            const native = list.querySelector('[role="tab"]')
            if (!native) return
            tab = native.cloneNode(true)
            tab.dataset.skillTab = '1'
            tab.classList.add('opt-skill-tab')
            tab.classList.remove('Mui-selected')
            tab.removeAttribute('id')
            tab.removeAttribute('aria-controls')
            tab.setAttribute('aria-selected', 'false')
            tab.setAttribute('aria-label', 'Plugin Tree')
            tab.tabIndex = -1
            tab.textContent = 'PLUGIN TREE'
            tab.addEventListener('click', ev => {
                ev.preventDefault()
                ev.stopPropagation()
                navigateToPluginTreePage()
            })
        }
        tab.style.order = '-1'
        if (tab.parentElement !== list) {
            const indicator = $('.MuiTabs-indicator', list)
            if (indicator) list.insertBefore(tab, indicator)
            else list.appendChild(tab)
        }
        state.skillTab = tab
        if (!list.dataset.skillBound) {
            list.dataset.skillBound = '1'
            list.addEventListener('click', ev => {
                const t = ev.target.closest && ev.target.closest('[role="tab"]')
                if (t && t !== tab && state.skillActive) deactivateSkillTab()
            }, true)
        }
    }

    function pluginTreePageHref() {
        return location.pathname + '?pluginTree=1#/plugins/installed'
    }

    function isPluginTreePage() {
        try { return new URLSearchParams(location.search).has('pluginTree') } catch { return false }
    }

    function navigateToPluginTreePage() {
        if (!isPluginTreePage()) {
            try { history.pushState({ pluginTree: 1 }, '', pluginTreePageHref()) } catch { location.href = pluginTreePageHref(); return }
        }
        activateSkillTab()
    }

    function clearPluginTreePageRoute() {
        if (!isPluginTreePage()) return
        try {
            const url = new URL(location.href)
            url.searchParams.delete('pluginTree')
            history.replaceState(history.state, '', url.pathname + url.search + url.hash)
        } catch {}
    }

    function activateSkillTab() {
        const list = findTablist()
        if (!list) return
        if (state.active) deactivateTab()
        ensureSkillTab(list)
        ensureSkillPanel(list)
        state.skillActive = true
        for (const t of $$('[role="tab"]', list)) {
            t.classList.remove('Mui-selected')
            t.setAttribute('aria-selected', 'false')
            t.tabIndex = -1
        }
        if (state.skillTab) {
            state.skillTab.classList.add('Mui-selected')
            state.skillTab.setAttribute('aria-selected', 'true')
            state.skillTab.tabIndex = 0
        }
        if (state.panel) state.panel.style.display = 'none'
        if (state.skillPanel) state.skillPanel.style.display = 'flex'
        hideNativePane()
        setNativeTabsVisible(false)
        setIndicator()
        updateSidebarActive()
        loadTree().then(() => {
            loadTreeUpdates()
            setTimeout(() => {
                loadServerDownloads()
                applyPendingDownloadFeedback(true)
                processDownloadQueue()
                processTreeActions()
            }, 1200)
        }).catch(e => toast('Tree load failed: ' + e.message, 'error'))
    }

    function deactivateSkillTab() {
        state.skillActive = false
        clearPluginTreePageRoute()
        updateSidebarActive()
        exitSkillFullscreen()
        if (state.skillTab) {
            state.skillTab.classList.remove('Mui-selected')
            state.skillTab.setAttribute('aria-selected', 'false')
            state.skillTab.tabIndex = -1
        }
        if (state.skillPanel) state.skillPanel.style.display = 'none'
        restoreNativePane()
        setNativeTabsVisible(true)
        const list = findTablist()
        const native = list && selectNativeTab(list)
        if (native) {
            native.classList.add('Mui-selected')
            native.setAttribute('aria-selected', 'true')
            native.tabIndex = 0
        }
        setIndicator()
    }

    function setIndicator() {
        if (!state.tabsRoot) return
        const ind = $('.MuiTabs-indicator', state.tabsRoot)
        if (!ind) return
        const target = state.skillActive && state.skillTab
            ? state.skillTab
            : state.active && state.tab
                ? state.tab
                : selectNativeTab(state.tabsRoot.querySelector('[role="tablist"]'))
        if (!target) return
        ind.style.left = target.offsetLeft + 'px'
        ind.style.width = target.offsetWidth + 'px'
    }

    function activateTab() {
        const list = findTablist()
        if (!list) return
        if (state.skillActive) deactivateSkillTab()
        ensurePanel(list)
        state.active = true
        if (state.tab) {
            state.tab.classList.add('Mui-selected')
            state.tab.setAttribute('aria-selected', 'true')
            state.tab.tabIndex = 0
        }
        for (const t of $$('[role="tab"]', list)) {
            if (t !== state.tab) {
                t.classList.remove('Mui-selected')
                t.setAttribute('aria-selected', 'false')
                t.tabIndex = -1
            }
        }
        if (state.panel) state.panel.style.display = 'block'
        hideNativePane()
        setIndicator()
        state.active = true
        renderStatus()
        refreshStatus().catch(() => {})
    }

    function deactivateTab() {
        state.active = false
        if (state.tab) {
            state.tab.classList.remove('Mui-selected')
            state.tab.setAttribute('aria-selected', 'false')
            state.tab.tabIndex = -1
        }
        if (state.panel) state.panel.style.display = 'none'
        restoreNativePane()
        const list = findTablist()
        const native = list && selectNativeTab(list)
        if (native) {
            native.classList.add('Mui-selected')
            native.setAttribute('aria-selected', 'true')
            native.tabIndex = 0
        }
        setIndicator()
    }

    function setNativeTabsVisible(visible) {
        if (!state.tabsRoot) return
        if (state.tabsRoot.dataset.skillTabsDisplay === undefined) {
            state.tabsRoot.dataset.skillTabsDisplay = state.tabsRoot.style.display || ''
        }
        state.tabsRoot.style.display = visible ? (state.tabsRoot.dataset.skillTabsDisplay || '') : 'none'
    }

    function hideNativePane() {
        if (!state.root || !state.tabsRoot) return
        for (const child of [...state.root.children]) {
            if (child === state.tabsRoot || child === state.panel || child === state.skillPanel) continue
            if (!state.paneDisplays.has(child)) state.paneDisplays.set(child, child.style.display)
            child.style.display = 'none'
        }
    }

    function restoreNativePane() {
        if (!state.root) return
        for (const [child, display] of state.paneDisplays) {
            if (child.isConnected) child.style.display = display || ''
        }
        state.paneDisplays.clear()
    }

    // ============================================================
    //  Panel
    // ============================================================
    function ensurePanel(list) {
        const tabsRoot = list.closest('.MuiTabs-root')
        const root = tabsRoot && tabsRoot.parentElement
        if (!tabsRoot || !root) return
        state.tabsRoot = tabsRoot
        state.root = root
        if (state.panel && state.panel.isConnected && state.panel.parentElement === root) {
            if (!state.active) state.panel.style.display = 'none'
            return
        }
        const panel = document.createElement('div')
        panel.className = 'opt-panel'
        panel.id = 'optimizer-panel'
        panel.dataset.optimizerPanel = '1'
        panel.style.display = 'none'
        panel.innerHTML = `
            <div class="opt-head">
                <div>
                    <div class="opt-title">Plugins Optimizer</div>
                    <div class="opt-sub" data-opt-sub>Loading...</div>
                </div>
                <div class="opt-head-actions">
                    <button type="button" class="opt-btn" data-opt-refresh title="Refresh status">${ICONS.refresh}<span>Refresh</span></button>
                    <button type="button" class="opt-btn" data-opt-native title="Open the plugin's native Options dialog">Native options</button>
                </div>
            </div>
            <div class="opt-hint">
                <strong>Admin panel extensions</strong> are always enabled and are not controlled by any switch.
                <br><strong>Proxy precedence:</strong> if HFS has a global Outbound proxy configured
                (Options &gt; Networking), GitHub requests use it first; the proxy below is only the fallback.
            </div>
            <div class="opt-grid">
                <section class="opt-card">
                    <h3>VPN proxy</h3>
                    <label class="opt-check"><input type="checkbox" data-opt="proxyEnabled"> Route GitHub traffic through VPN</label>
                    <div class="opt-fields">
                        <label>Host <input type="text" data-opt="proxyHost" placeholder="192.168.1.224" autocomplete="off"></label>
                        <label>Port <input type="number" data-opt="proxyPort" min="1" max="65535" placeholder="10809"></label>
                    </div>
                    <div class="opt-hint">Independent proxy module. HFS' global Outbound proxy takes precedence; otherwise only GitHub hostnames used by plugin installs/updates and HFS updates are tunneled.</div>
                    <div class="opt-row">
                        <button type="button" class="opt-btn opt-primary" data-opt-test>Test connection</button>
                        <span class="opt-test-result" data-opt-test-result></span>
                    </div>
                    <div class="opt-stats" data-opt-proxy-stats></div>
                </section>
                <section class="opt-card">
                    <h3>Cache</h3>
                    <label class="opt-check"><input type="checkbox" data-opt="cacheEnabled"> Enable GitHub disk cache</label>
                    <div class="opt-fields">
                        <label>Fresh TTL (h) <input type="number" step="0.1" data-opt="ttlHours"></label>
                        <label>Plugin TTL (h) <input type="number" step="0.1" data-opt="pluginTtlHours"></label>
                        <label>Max age (days) <input type="number" data-opt="maxAgeDays"></label>
                    </div>
                    <div class="opt-stats" data-opt-cache-stats></div>
                    <div class="opt-row">
                        <button type="button" class="opt-btn" data-opt-clear-cache>Clear cache</button>
                        <button type="button" class="opt-btn" data-opt-clear-blacklist>Clear failure blacklist</button>
                    </div>
                </section>
                <section class="opt-card">
                    <h3>Plugin catalog mirror</h3>
                    <div class="opt-stats" data-opt-catalog-stats></div>
                    <div class="opt-row">
                        <label>Sync every <input type="number" min="0" max="720" step="1" data-opt="catalogSyncHours"> h</label>
                        <button type="button" class="opt-btn" data-opt-sync>Sync now</button>
                    </div>
                    <div class="opt-hint">A portable <code>catalog.json</code> snapshot is kept in the plugin's storage folder and survives restarts. HFS also keeps its own catalog cache; this mirror is a second, inspectable copy that also helps warm the HTTP cache.</div>
                </section>
                <section class="opt-card opt-wide">
                    <h3>Advanced</h3>
                    <div class="opt-fields opt-fields-3">
                        <label>Max concurrent <input type="number" min="1" max="64" data-opt="maxConcurrent"></label>
                        <label>Retries <input type="number" min="0" max="5" data-opt="retryCount"></label>
                        <label>Timeout (s) <input type="number" min="3" max="120" data-opt="requestTimeoutSec"></label>
                        <label>Fail threshold <input type="number" min="0" max="10" data-opt="failBlacklistThreshold"></label>
                        <label>Fail cooldown (s) <input type="number" min="10" max="3600" data-opt="failBlacklistSeconds"></label>
                    </div>
                    <label class="opt-check"><input type="checkbox" data-opt="debug"> Debug logging</label>
                    <label class="opt-wide">GitHub hosts routed through the proxy
                        <textarea data-opt="githubHosts" rows="3"></textarea>
                    </label>
                </section>
            </div>
            <div class="opt-footer">
                <button type="button" class="opt-btn opt-primary" data-opt-save>Save settings</button>
                <button type="button" class="opt-btn" data-opt-restart>Restart plugin</button>
                <span class="opt-save-result" data-opt-save-result></span>
            </div>
        `
        panel.addEventListener('input', () => { state.dirty = true })
        panel.addEventListener('change', () => { state.dirty = true })
        panel.addEventListener('click', ev => {
            const t = ev.target.closest && ev.target.closest('button')
            if (!t) return
            if (t.dataset.optRefresh !== undefined) { refreshStatus(true).catch(() => {}); return }
            if (t.dataset.optNative !== undefined) { openNativeOptions(); return }
            if (t.dataset.optTest !== undefined) { testProxy(); return }
            if (t.dataset.optClearCache !== undefined) { clearCache(); return }
            if (t.dataset.optClearBlacklist !== undefined) { clearBlacklist(); return }
            if (t.dataset.optSync !== undefined) { syncCatalog(); return }
            if (t.dataset.optSave !== undefined) { saveSettings(); return }
            if (t.dataset.optRestart !== undefined) { restartPlugin(); return }
        })
        if (tabsRoot.nextSibling) root.insertBefore(panel, tabsRoot.nextSibling)
        else root.appendChild(panel)
        state.panel = panel
        state.paneDisplays.clear()
        if (state.active) {
            panel.style.display = 'block'
            hideNativePane()
        }
        renderStatus()
    }

    function field(name) {
        return state.panel && state.panel.querySelector('[data-opt="' + name + '"]')
    }

    function setField(name, value) {
        const el = field(name)
        if (!el) return
        if (el.type === 'checkbox') el.checked = !!value
        else el.value = value == null ? '' : String(value)
    }

    function readField(name) {
        const el = field(name)
        if (!el) return undefined
        if (el.type === 'checkbox') return el.checked
        if (el.type === 'number') return el.value === '' ? undefined : Number(el.value)
        return el.value
    }

    function collectSettings() {
        const names = ['proxyEnabled', 'proxyHost', 'proxyPort', 'cacheEnabled', 'ttlHours', 'pluginTtlHours',
            'maxAgeDays', 'catalogSyncHours', 'maxConcurrent', 'retryCount', 'requestTimeoutSec',
            'failBlacklistThreshold', 'failBlacklistSeconds', 'debug', 'githubHosts']
        const out = {}
        for (const n of names) {
            const v = readField(n)
            if (v !== undefined) out[n] = v
        }
        return out
    }

    function renderStatus() {
        const p = state.panel
        if (!p) return
        const st = state.status
        const sub = p.querySelector('[data-opt-sub]')
        if (!st) {
            if (sub) sub.textContent = state.lastError ? 'Plugin unreachable: ' + state.lastError : 'Loading...'
            return
        }
        if (sub) {
            sub.textContent = `v${st.version || '?'} | network ${st.network?.enabled ? 'on' : 'off'} | proxy ${st.proxy && st.proxy.active ? 'on' : 'off'} | cache ${st.cache && st.cache.enabled ? 'on' : 'off'} | ${st.cache ? st.cache.entries : 0} cached URLs`
        }
        if (!state.dirty) {
            const c = st.config || {}
            for (const n of ['proxyEnabled', 'proxyHost', 'proxyPort', 'cacheEnabled', 'ttlHours', 'pluginTtlHours',
                'maxAgeDays', 'catalogSyncHours', 'maxConcurrent', 'retryCount', 'requestTimeoutSec',
                'failBlacklistThreshold', 'failBlacklistSeconds', 'debug', 'githubHosts']) {
                if (c[n] !== undefined) setField(n, c[n])
            }
        }
        const proxyStats = p.querySelector('[data-opt-proxy-stats]')
        if (proxyStats && st.proxy) {
            const lt = st.proxy.lastTest
            const bits = [
                st.proxy.active ? `Using ${st.proxy.host}:${st.proxy.port}` : 'Proxy disabled',
                lt ? (lt.ok ? `Last test OK | HTTP ${lt.statusCode} | ${lt.latencyMs} ms` : `Last test failed | ${lt.error || 'unknown'}`) : 'No test yet',
            ]
            proxyStats.textContent = bits.join(' | ')
        }
        const testBtn = p.querySelector('[data-opt-test]')
        if (testBtn) testBtn.disabled = state.busy
        const syncBtn = p.querySelector('[data-opt-sync]')
        if (syncBtn) syncBtn.disabled = state.busy
        const cacheStats = p.querySelector('[data-opt-cache-stats]')
        if (cacheStats && st.cache) {
            const c = st.cache
            cacheStats.textContent = `${c.entries} entries | ${fmtBytes(c.bytes)} | hit rate ${c.hitRate}% (${c.hits}/${c.hits + c.misses}) | ${c.inFlight} in flight | ${c.blacklist} blacklisted`
        }
        const catStats = p.querySelector('[data-opt-catalog-stats]')
        if (catStats && st.catalog) {
            const c = st.catalog
            let text = `${c.count} plugins | last sync ${fmtTime(c.updatedAt)}`
            if (c.syncing) text += ` | syncing...${c.progress || ''}`
            if (c.error) text += ` | error: ${c.error}`
            catStats.textContent = text
        }
        renderHiddenList()
    }

    function renderHiddenList() {
        const p = state.panel
        if (!p) return
        const list = p.querySelector('[data-opt-hidden-list]')
        const count = p.querySelector('[data-opt-hidden-count]')
        if (count) count.textContent = String(state.hidden.size)
        if (!list) return
        const ids = [...state.hidden].sort((a, b) => a.localeCompare(b))
        const sig = ids.join('\n')
        if (list.dataset.optSig === sig) return
        list.dataset.optSig = sig
        list.textContent = ''
        if (!ids.length) {
            const empty = document.createElement('span')
            empty.className = 'opt-muted'
            empty.textContent = 'No hidden plugins.'
            list.appendChild(empty)
            return
        }
        for (const id of ids) {
            const chip = document.createElement('span')
            chip.className = 'opt-chip'
            const label = document.createElement('span')
            label.textContent = id
            const btn = document.createElement('button')
            btn.type = 'button'
            btn.className = 'opt-chip-x'
            btn.title = 'Restore ' + id
            btn.textContent = '\u00d7'
            btn.dataset.optRestore = id
            chip.append(label, btn)
            list.appendChild(chip)
        }
    }

    // ============================================================
    //  Installed-list toolbar + rows
    // ============================================================
    function onInstalledList() {
        // Hide/show and rejetto pinning belong to the native Installed pane,
        // not to the Skill Tree or the online/updates tabs.
        if (state.skillActive) return false
        const h = location.hash
        return !h.includes('/plugins/get') && !h.includes('/plugins/updates')
    }

    function isRejettoRow(row) {
        return /^rejetto\//i.test(String(row?.repo || row?.id || ''))
    }

    // Reach the MUI DataGrid API through the React fiber of the grid root. This lets
    // us add a real sort comparator (so rejetto plugins are pinned) without editing
    // HFS or fighting the virtualizer with DOM moves.
    function getGridApi() {
        const cached = state.gridApi
        if (cached) {
            // The grid root is replaced when switching tabs; never keep using a
            // detached API instance.
            const root = cached.rootElementRef?.current
            if (root && root.isConnected) return cached
            state.gridApi = null
        }
        const grid = document.querySelector('.MuiDataGrid-root')
        if (!grid) return null
        const key = Object.keys(grid).find(k => k.startsWith('__reactFiber$') || k.startsWith('__reactInternalInstance$'))
        if (!key) return null
        let fiber = grid[key]
        for (let i = 0; fiber && i < 400; i++, fiber = fiber.return) {
            const props = fiber.memoizedProps
            const api = props?.apiRef?.current
            if (api && typeof api.setSortModel === 'function' && typeof api.getRowModels === 'function') {
                state.gridApi = api
                return api
            }
        }
        return null
    }

    function rejettoComparator() {
        if (state.rejettoComparator) return state.rejettoComparator
        const cmp = (v1, v2, c1, c2) => {
            const r1 = c1?.api?.getRow?.(c1.id) || c1?.row || null
            const r2 = c2?.api?.getRow?.(c2.id) || c2?.row || null
            const k1 = String(r1?.repo || v1 || '')
            const k2 = String(r2?.repo || v2 || '')
            const rank = row => row?.__optimizerDivider ? 3 : row?.started ? 0 : isRejettoRow(row) ? 1 : 2
            const a = r1 ? rank(r1) : (/^rejetto\//i.test(k1) ? 1 : 2)
            const b = r2 ? rank(r2) : (/^rejetto\//i.test(k2) ? 1 : 2)
            return a - b || k1.localeCompare(k2)
        }
        cmp.__optimizerRejetto = true
        state.rejettoComparator = cmp
        return cmp
    }

    function isDividerRow(row) {
        return row?.__optimizerDivider === true || row?.id === DIVIDER_ID
    }

    function sortRowsForPin(rows) {
        const rank = row => isDividerRow(row) ? 3 : row?.started ? 0 : isRejettoRow(row) ? 1 : 2
        return [...rows].sort((a, b) =>
            rank(a) - rank(b)
            || String(a.repo || a.id || '').localeCompare(String(b.repo || b.id || '')))
    }

    function ensureAllRows(api) {
        if (state.allRows?.length) return state.allRows
        const rows = [...api.getRowModels().values()].filter(r => !isDividerRow(r))
        if (rows.length) state.allRows = sortRowsForPin(rows)
        return state.allRows
    }

    function buildVisibleRows() {
        if (!state.allRows?.length) return null
        const running = []
        const rej = []
        const rest = []
        for (const row of state.allRows) {
            if (row.started) running.push(row)
            else if (isRejettoRow(row)) rej.push(row)
            else rest.push(row)
        }
        if (rej.length && rest.length) {
            const divider = {
                id: DIVIDER_ID,
                repo: 'rejetto',
                version: '',
                description: '',
                started: null,
                __optimizerDivider: true,
            }
            return [...running, ...rej, divider, ...rest]
        }
        return [...running, ...rej, ...rest]
    }

    function refreshHiddenVisibility() {
        updateHiddenCss()
        const api = getGridApi()
        if (api) applyHiddenRows(api)
    }

    function applyHiddenRows(api) {
        state.allRows = null
        if (!api) return
        const current = [...api.getRowModels().values()]
        const filtered = current.filter(row => !isDividerRow(row))
        if (filtered.length !== current.length) {
            try { api.setRows(filtered) } catch (e) { debugLog('remove divider rows', e) }
        }
    }

    function restoreNativeSort() {
        if (!onInstalledList() || state.nativeSortRestored) return
        const api = getGridApi()
        if (!api) return
        state.nativeSortRestored = true
        state.allRows = null

        // Remove the old author-aware comparator from the Name column.
        const col = api.getColumn?.('id') || api.getAllColumns?.().find(c => c.field === 'id')
        if (col?.sortComparator?.__optimizerRejetto) {
            const next = { ...col }
            delete next.sortComparator
            try { api.updateColumns([next]) } catch (e) { debugLog('restore column', e) }
        }
        // Drop the forced Name ascending sort and restore the grid's native order.
        const sm = api.getSortModel?.() || []
        if (sm.length === 1 && sm[0].field === 'id' && sm[0].sort === 'asc') {
            try { api.setSortModel([]) } catch (e) { debugLog('restore sort', e) }
        }
        const current = [...api.getRowModels().values()]
        const filtered = current.filter(row => !isDividerRow(row))
        if (filtered.length !== current.length) {
            try { api.setRows(filtered) } catch (e) { debugLog('remove divider', e) }
        }
    }

    function findSearchButton(grid) {
        return grid.querySelector('button[aria-label="Search"]')
            || grid.querySelector('button[title="Search"]')
            || $$('button', grid).find(b => {
                const p = b.querySelector('svg path')
                return p && String(p.getAttribute('d') || '').startsWith('M15.5 14h-.79l-.28-.27')
            })
            || null
    }

    function findFilterButton(grid) {
        return grid.querySelector('button[aria-label="View filters"]')
            || grid.querySelector('button[aria-label="Filter"]')
            || $$('button', grid).find(b => {
                const p = b.querySelector('svg path')
                return p && String(p.getAttribute('d') || '').startsWith('M4.25 5.61')
            })
            || null
    }

    function ensureToolbar() {
        // The custom footer Refresh button has been removed; the native live
        // plugin stream keeps the Installed list current.
        document.getElementById('optimizer-refresh-btn')?.remove()
        document.getElementById('optimizer-hide-toggle')?.remove()
    }

    function updateToggleButton() {
        const btn = document.getElementById('optimizer-hide-toggle')
        if (!btn) return
        const n = state.hidden.size
        const sig = (state.showHidden ? 'eye' : 'eyeoff') + ':' + n
        if (btn.dataset.optSig !== sig) {
            btn.innerHTML = (state.showHidden ? ICONS.eye : ICONS.eyeOff) + (n ? `<span class="opt-badge">${n}</span>` : '')
            btn.dataset.optSig = sig
        }
        btn.title = state.showHidden
            ? `Showing hidden plugins${n ? ` (${n})` : ''} - click to hide them again`
            : `Show hidden plugins${n ? ` (${n})` : ''} - click to reveal`
        btn.setAttribute('aria-label', state.showHidden ? 'Hide hidden plugins' : 'Show hidden plugins')
        btn.classList.toggle('opt-active', state.showHidden)
    }

    async function refreshPluginList() {
        const api = getGridApi()
        if (!api) {
            toast('Plugin list is not ready yet', 'error')
            return
        }
        const btn = document.getElementById('optimizer-refresh-btn')
        if (btn?.disabled) return
        if (btn) btn.disabled = true
        try {
            const data = await apiCall('get_plugins', {}, { timeout: 30000 })
            const list = Array.isArray(data?.list) ? data.list : []
            if (!list.length) throw Error('empty plugin list')
            for (const row of list) {
                if (typeof row.config === 'string' && row.config) {
                    try { row.config = JSON.parse(row.config) }
                    catch {
                        try { row.config = new Function('return (' + row.config + ')')() }
                        catch { row.config = undefined }
                    }
                }
            }
            state.allRows = null
            state.nativeSortRestored = false
            applyHiddenRows(api)
            setTimeout(() => { ensureUi(); restoreNativeSort() }, 0)
            toast(`Plugin list refreshed (${list.length})`)
        } catch (e) {
            toast('Refresh failed: ' + (e.message || e), 'error')
        } finally {
            if (btn) btn.disabled = false
        }
    }

    function paintHideButton(btn, showRestore) {
        const color = showRestore ? '#ff9800' : '#9e9e9e'
        btn.style.setProperty('color', color, 'important')
        const path = btn.querySelector('svg path')
        if (path) path.style.setProperty('fill', color, 'important')
    }

    function ensureActionsWidth(api) {
        try {
            const col = api.getColumn?.('Actions')
            if (col && col.width !== 120)
                api.setColumnWidth?.('Actions', 120)
        } catch {}
    }

    function ensureRows() {
        const list = findTablist()
        if (!list || !onInstalledList(list)) return
        const root = state.root || (list.closest('.MuiTabs-root') && list.closest('.MuiTabs-root').parentElement)
        if (!root) return
        const api = getGridApi()
        if (api) ensureActionsWidth(api)
        for (const row of $$('.MuiDataGrid-row[data-id]', root)) {
            const id = row.getAttribute('data-id')
            if (!id) continue
            if (id === DIVIDER_ID) {
                row.remove()
                continue
            }
            row.classList.remove('opt-divider-row')
            const nameCell = row.querySelector('.MuiDataGrid-cell[data-field="id"]')
            if (!nameCell) continue
            nameCell.classList.remove('opt-name-cell')
            // Remove hide buttons left by older admin.js versions.
            row.querySelector('.MuiDataGrid-cell[data-field="Actions"] .opt-row-hide')?.remove()
            nameCell.querySelector('.opt-row-hide')?.remove()
        }
    }

    function applyHidden() {
        const list = findTablist()
        if (!list || !onInstalledList(list)) return
        const root = state.root || (list.closest('.MuiTabs-root') && list.closest('.MuiTabs-root').parentElement)
        if (!root) return
        const api = getGridApi()
        if (api) applyHiddenRows(api)
        for (const row of $$('.MuiDataGrid-row[data-id]', root)) {
            row.classList.remove('opt-row-hidden', 'opt-row-revealed')
            row.querySelector('.opt-row-hide')?.remove()
        }
    }

    function toggleRow(id) {
        if (!id) return
        if (state.hidden.has(id)) state.hidden.delete(id)
        else state.hidden.add(id)
        if (!state.hidden.size) state.showHidden = false
        persistHidden()
        updateHiddenCss()
        applyHidden()
        ensureRows()
        restoreNativeSort()
        renderHiddenList()
        renderStatus()
    }

    function toggleShowHidden() {
        state.showHidden = !state.showHidden
        updateHiddenCss()
        applyHidden()
        ensureRows()
        restoreNativeSort()
        renderHiddenList()
    }

    function restoreAll() {
        if (!state.hidden.size) return
        state.hidden.clear()
        state.showHidden = false
        persistHidden()
        updateHiddenCss()
        applyHidden()
        ensureRows()
        restoreNativeSort()
        renderHiddenList()
        toast('All hidden plugins restored')
    }

    // ============================================================
    //  Actions
    // ============================================================
    async function refreshStatus(force) {
        try {
            const st = await rest('pluginsOptimizer_status')
            if (!st || !st.ok) throw Error('invalid status')
            state.status = st
            state.config = st.config
            if (Array.isArray(st.hidden) && Date.now() - hiddenDirtyAt > 1500) {
                state.hidden = new Set(st.hidden.map(String))
                updateHiddenCss()
            }
            state.lastError = ''
            renderStatus()
            applyHidden()
            ensureRows()
            restoreNativeSort()
            updateToggleButton()
        } catch (e) {
            state.lastError = e.message || String(e)
            if (force) toast('Optimizer status: ' + state.lastError, 'error')
            renderStatus()
        }
    }

    async function saveSettings() {
        if (state.busy) return
        const panel = state.panel
        const result = panel && panel.querySelector('[data-opt-save-result]')
        const btn = panel && panel.querySelector('[data-opt-save]')
        state.busy = true
        if (btn) btn.disabled = true
        if (result) result.textContent = 'Saving...'
        try {
            const values = collectSettings()
            await rest('pluginsOptimizer_saveConfig', values)
            state.dirty = false
            if (result) result.textContent = 'Saved.'
            toast('Optimizer settings saved')
            await refreshStatus()
        } catch (e) {
            if (result) result.textContent = 'Save failed.'
            toast('Save failed: ' + e.message, 'error')
        } finally {
            state.busy = false
            if (btn) btn.disabled = false
        }
    }

    async function testProxy() {
        const panel = state.panel
        if (!panel) return
        const result = panel.querySelector('[data-opt-test-result]')
        const btn = panel.querySelector('[data-opt-test]')
        state.busy = true
        if (btn) btn.disabled = true
        if (result) { result.textContent = 'Testing...'; result.className = 'opt-test-result' }
        try {
            const host = readField('proxyHost')
            const port = readField('proxyPort')
            const r = await rest('pluginsOptimizer_testProxy', { host, port }, { timeout: 30000 })
            if (r.ok) {
                if (result) { result.textContent = `OK | HTTP ${r.statusCode} | ${r.latencyMs} ms`; result.className = 'opt-test-result opt-ok' }
            } else {
                if (result) { result.textContent = `Failed | ${r.error || ('HTTP ' + r.statusCode)}`; result.className = 'opt-test-result opt-fail' }
            }
            await refreshStatus()
        } catch (e) {
            if (result) { result.textContent = 'Failed | ' + e.message; result.className = 'opt-test-result opt-fail' }
        } finally {
            state.busy = false
            if (btn) btn.disabled = false
        }
    }

    async function clearCache() {
        if (!(await uiConfirm('Clear the GitHub cache? Cached plugin lists will be downloaded again.', 'Clear cache'))) return
        try {
            await rest('pluginsOptimizer_clearCache')
            toast('Cache cleared')
            await refreshStatus()
        } catch (e) { toast('Clear cache failed: ' + e.message, 'error') }
    }

    async function clearBlacklist() {
        try {
            const r = await rest('pluginsOptimizer_clearBlacklist')
            toast(`Failure blacklist cleared (${r.cleared || 0})`)
            await refreshStatus()
        } catch (e) { toast('Clear blacklist failed: ' + e.message, 'error') }
    }

    async function syncCatalog() {
        const panel = state.panel
        const result = panel && panel.querySelector('[data-opt-save-result]')
        if (state.busy) return
        state.busy = true
        if (result) result.textContent = 'Syncing catalog... this can take a minute.'
        try {
            await rest('pluginsOptimizer_syncCatalog', { force: true }, { timeout: 300000 })
            toast('Plugin catalog mirror synced')
            if (result) result.textContent = 'Catalog synced.'
            await refreshStatus()
        } catch (e) {
            if (result) result.textContent = 'Catalog sync failed.'
            toast('Catalog sync failed: ' + e.message, 'error')
        } finally {
            state.busy = false
        }
    }

    async function restartPlugin() {
        if (state.busy) return
        if (!(await uiConfirm('Restart Plugins-Optimizer? The admin page stays open.', 'Restart'))) return
        state.busy = true
        try {
            await apiCall('stop_plugin', { id: PLUGIN_ID }, { timeout: 30000 }).catch(() => {})
            await apiCall('start_plugin', { id: PLUGIN_ID }, { timeout: 30000 })
            toast('Plugins-Optimizer restarted')
            setTimeout(() => refreshStatus(true).catch(() => {}), 1500)
        } catch (e) {
            toast('Restart failed: ' + e.message, 'error')
        } finally {
            state.busy = false
        }
    }

    const sleep = ms => new Promise(r => setTimeout(r, ms))

    async function openNativeOptions() {
        deactivateTab()
        location.hash = '#/plugins/installed'
        await sleep(500)
        const list = findTablist()
        const root = state.root || (list && list.closest('.MuiTabs-root') && list.closest('.MuiTabs-root').parentElement)
        const grid = root && root.querySelector('.MuiDataGrid-root')
        if (!grid) { toast('Installed plugins grid not found', 'error'); return }

        // The plugin may be below the virtualized viewport. Use the native quick
        // filter so its row is rendered, then click the native Options button.
        const findSearchInput = () => document.querySelector('input[role="searchbox"]')
            || document.querySelector('input[placeholder="Search"]')
            || document.querySelector('input[placeholder="Search"]')
        let input = findSearchInput()
        if (!input) {
            const searchBtn = findSearchButton(grid)
            if (searchBtn) {
                searchBtn.click()
                await sleep(400)
                input = findSearchInput()
            }
        }
        if (input) {
            const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set
            if (setter) setter.call(input, PLUGIN_ID)
            else input.value = PLUGIN_ID
            input.dispatchEvent(new Event('input', { bubbles: true }))
            await sleep(900)
        }

        const row = document.querySelector('.MuiDataGrid-row[data-id="' + PLUGIN_ID + '"]')
        if (!row) {
            toast('Plugins-Optimizer row not found', 'error')
            if (input) {
                const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set
                if (setter) setter.call(input, '')
                input.dispatchEvent(new Event('input', { bubbles: true }))
            }
            return
        }
        row.classList.remove('opt-row-hidden')
        const cell = row.querySelector('.MuiDataGrid-cell[data-field="Actions"]') || row
        const buttons = $$('button', cell)
        const btn = buttons.find(b => /^(Options|Log|\u9078\u9805|\u65e5\u8a8c)$/i.test((b.getAttribute('aria-label') || b.title || '').trim()))
            || buttons[1] || buttons[0]
        if (!btn || btn.disabled) {
            toast('Native options are unavailable (start the plugin first)', 'error')
            return
        }
        btn.click()
        // Restore the full list behind the native dialog; the dialog itself stays open.
        if (input) {
            setTimeout(() => {
                const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set
                if (setter) setter.call(input, '')
                input.dispatchEvent(new Event('input', { bubbles: true }))
            }, 1200)
        }
    }

    // ============================================================
    //  Skill Tree
    // ============================================================
    const GRID_X = 20
    const GRID_Y = 28
    const SETTINGS_SPACE = 330
    const GLYPH_DRAG = '\u2261\uFE0E'
    const GLYPH_MENU = '\u22EF\uFE0E'
    const GLYPH_INFO = '!\uFE0E'

    const TREE_ICONS = {
        power: 'M13 3h-2v10h2V3zm4.83 2.17-1.42 1.42C17.99 7.86 19 9.81 19 12c0 3.87-3.13 7-7 7s-7-3.13-7-7c0-2.19 1.01-4.14 2.59-5.42L6.17 5.17C4.23 6.82 3 9.26 3 12c0 4.97 4.03 9 9 9s9-4.03 9-9c0-2.74-1.23-5.18-3.17-6.83z',
        settings: 'M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.9l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z',
        delete: 'M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z',
        info: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z',
        install: 'M5 20h14v-2H5v2zM19 9h-4V3H9v6H5l7 7 7-7z',
        update: 'M16 18v2H8v-2h8zM11 7.99V16h2V7.99h3L12 4 8 7.99h3z',
        expand: 'M7.41 8.59 12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z',
        output: 'M9.4 16.6 4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0 4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z',
    }

    function treeIcon(name, size = 18) {
        return `<svg viewBox="0 0 24 24" width="${size}" height="${size}" aria-hidden="true" focusable="false"><path fill="currentColor" d="${TREE_ICONS[name]}"/></svg>`
    }

    function parseRowConfig(row) {
        if (typeof row.config === 'string' && row.config) {
            try { row.config = JSON.parse(row.config) }
            catch {
                try { row.config = new Function('return (' + row.config + ')')() }
                catch { row.config = undefined }
            }
        }
        return row
    }

    function pluginIdKey(id) {
        return String(id || '').toLowerCase().replace(/^hfs-/, '').replace(/-main$/, '')
    }

    function pluginDisplayName(id) {
        return String(id || '')
            .replace(/^(?:hugo529100|hugo29100)[-_]/i, '')
            .replace(/^hfs-/i, '')
            .replace(/-main$/i, '')
            .replace(/\+$/, '')
    }

    function pluginMatchKey(id) {
        let value = String(id || '').toLowerCase().replace(/^.*[\\/]/, '')
        value = value.replace(/^(?:hugo529100|hugo29100)[-_]?/, '')
        value = value.replace(/^hfs[-_]?/, '')
        value = value.replace(/-main$/, '')
        value = value.replace(/\+$/, '')
        return value.replace(/[^a-z0-9]/g, '')
    }

    function isSelfPlugin(id) {
        return String(id || '').toLowerCase() === String(PLUGIN_ID).toLowerCase()
    }

    function samePluginId(a, b) {
        return String(a).toLowerCase() === String(b).toLowerCase()
            || pluginIdKey(a) === pluginIdKey(b)
            || pluginMatchKey(a) === pluginMatchKey(b)
    }

    function makeInstalledMap(rows) {
        const map = new Map(rows.map(r => [r.id, r]))
        const byLower = new Map(rows.map(r => [String(r.id).toLowerCase(), r.id]))
        const byNormalized = new Map()
        const byFuzzy = new Map()
        for (const row of rows) {
            const key = pluginIdKey(row.id)
            if (!byNormalized.has(key)) byNormalized.set(key, row.id)
            const fuzzy = pluginMatchKey(row.id)
            if (!byFuzzy.has(fuzzy)) byFuzzy.set(fuzzy, row.id)
        }
        const baseGet = Map.prototype.get.bind(map)
        const baseHas = Map.prototype.has.bind(map)
        const baseSet = Map.prototype.set.bind(map)
        map.get = key => {
            const raw = String(key)
            if (baseHas(raw)) return baseGet(raw)
            const lower = raw.toLowerCase()
            let canonical = byLower.get(lower)
            if (canonical === undefined) canonical = byNormalized.get(pluginIdKey(raw))
            if (canonical === undefined) canonical = byFuzzy.get(pluginMatchKey(raw))
            return canonical !== undefined ? baseGet(canonical) : undefined
        }
        map.has = key => map.get(key) !== undefined
        map.set = (key, value) => {
            baseSet(key, value)
            byLower.set(String(key).toLowerCase(), key)
            const normalized = pluginIdKey(key)
            if (!byNormalized.has(normalized)) byNormalized.set(normalized, key)
            const fuzzy = pluginMatchKey(key)
            if (!byFuzzy.has(fuzzy)) byFuzzy.set(fuzzy, key)
            return map
        }
        return map
    }

    function ensureSkillPanel(list) {
        const tabsRoot = list.closest('.MuiTabs-root')
        const root = tabsRoot && tabsRoot.parentElement
        if (!tabsRoot || !root) return
        if (state.skillPanel && state.skillPanel.isConnected && state.skillPanel.parentElement === root) {
            if (!state.skillActive) state.skillPanel.style.display = 'none'
            return
        }
        root.style.minWidth = '0'
        const panel = document.createElement('div')
        panel.className = 'skill-panel'
        panel.id = 'optimizer-skill-panel'
        panel.style.display = 'none'
        panel.style.minWidth = '0'
        panel.innerHTML = `
            <div class="skill-head">
                <div class="skill-titlebar">
                    <div class="skill-title">Plugin Skill Tree</div>
                    <div class="skill-sub" data-skill-sub>Loading...</div>
                </div>
                <div class="skill-actions">
                    <button type="button" class="opt-btn" data-skill-add-trunk>+ Trunk</button>
                    <button type="button" class="opt-btn" data-skill-reset title="Reset custom positions to the HFS3 sequence layout">Reset</button>
                    <button type="button" class="opt-btn" data-skill-restore title="Restore the latest saved layout (Save default or before last Reset); right-click for other snapshots">Restore</button>
                    <button type="button" class="opt-btn" data-skill-freeze>Save default</button>
                    <button type="button" class="opt-btn opt-refresh-btn" data-skill-refresh title="Refresh PluginTree content" aria-label="Refresh PluginTree">Refresh</button>
                    <button type="button" class="opt-btn" data-skill-fullscreen title="Enter fullscreen Skill Tree" aria-label="Fullscreen">Fullscreen</button>
                </div>
            </div>
            <div class="skill-viewport" data-skill-viewport>
                <div class="skill-world" data-skill-world></div>
            </div>
            <div class="skill-zoom">
                <button type="button" data-skill-zoom-in title="Zoom in">+\uFE0E</button>
                <button type="button" data-skill-zoom-out title="Zoom out">\u2212\uFE0E</button>
            </div>
            <div class="skill-tray">
                <div class="skill-tray-head">Unarranged <span class="opt-count" data-skill-tray-count>0</span></div>
                <div class="skill-tray-items" data-skill-tray></div>
            </div>
            <div class="skill-desc" data-skill-desc hidden>
                <button type="button" class="skill-desc-close" data-skill-desc-close title="Close description">&#215;</button>
                <div data-skill-desc-text></div>
            </div>
            <div class="skill-settings-pop" data-skill-settings-pop hidden>
                <div class="skill-settings-pop-head">
                    <strong data-skill-settings-title>Settings</strong>
                    <button type="button" data-skill-settings-close title="Close settings">&#215;</button>
                </div>
                <div class="skill-settings-pop-body" data-skill-settings-body></div>
            </div>
            <div class="skill-confirm" data-skill-confirm hidden>
                <div class="skill-confirm-box">
                    <div class="skill-confirm-text" data-skill-confirm-text></div>
                    <div class="skill-confirm-actions">
                        <button type="button" class="opt-btn opt-primary" data-skill-confirm-ok>Confirm</button>
                        <button type="button" class="opt-btn" data-skill-confirm-cancel>Cancel</button>
                    </div>
                </div>
            </div>
            <div class="skill-menu" data-skill-menu hidden></div>
        `
        panel.addEventListener('click', ev => {
            const b = ev.target.closest && ev.target.closest('button')
            if (!b) return
            if (b.dataset.skillSettingsClose !== undefined) { closeTreeSettings(); return }
            if (b.dataset.skillDescClose !== undefined) { closeTreeDesc(); return }
            if (b.dataset.skillConfirmCancel !== undefined) { closeTreeConfirm(); return }
            if (b.dataset.skillConfirmOk !== undefined) {
                const fn = state.confirmAction
                closeTreeConfirm()
                if (fn) Promise.resolve().then(fn)
                return
            }
            if (b.dataset.skillRefresh !== undefined) { loadTree(true).catch(e => toast('Tree refresh failed: ' + e.message, 'error')); return }
            if (b.dataset.skillFit !== undefined) { fitTree(); return }
            if (b.dataset.skillReset !== undefined) { resetTreeLayout(); return }
            if (b.dataset.skillRestore !== undefined) { restoreLatestTreeLayout(); return }
            if (b.dataset.skillFreeze !== undefined) { freezeTreeLayout(); return }
            if (b.dataset.skillAddTrunk !== undefined) { addTreeTrunk(); return }
            if (b.dataset.skillRefresh !== undefined) { refreshSkillTree(); return }
            if (b.dataset.skillFullscreen !== undefined) { toggleSkillFullscreen(); return }
            if (b.dataset.skillZoomIn !== undefined) { zoomTreeBy(1.2); return }
            if (b.dataset.skillZoomOut !== undefined) { zoomTreeBy(1 / 1.2); return }
        })
        panel.addEventListener('contextmenu', ev => {
            const b = ev.target.closest?.('[data-skill-restore]')
            if (!b) return
            ev.preventDefault()
            ev.stopPropagation()
            showRestoreMenu(b)
        })
        const viewport = panel.querySelector('[data-skill-viewport]')
        viewport.addEventListener('pointerdown', ev => {
            if (ev.button !== 0) return
            if (ev.target.closest('button, a, input, select, textarea, .skill-inline-panel, .skill-output-pop, .skill-settings, .skill-menu')) return
            const node = ev.target.closest('.skill-node')
            if (node) {
                const item = state.layout?.[node.dataset.key]
                if (!item || !nodeIsLocked(item)) return
            }
            startPan(ev)
        })
        viewport.addEventListener('wheel', ev => {
            // Let the settings panel and trays scroll normally; only empty canvas
            // wheel gestures zoom the tree.
            if (ev.target.closest('.skill-settings, .skill-tray, .skill-desc')) return
            ev.preventDefault()
            zoomTree(ev)
        }, { passive: false })
        viewport.addEventListener('touchstart', ev => {
            if (ev.touches.length !== 2) return
            const r = viewport.getBoundingClientRect()
            const a = ev.touches[0]
            const b = ev.touches[1]
            const cx = (a.clientX + b.clientX) / 2 - r.left
            const cy = (a.clientY + b.clientY) / 2 - r.top
            const dist = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY) || 1
            state.pinching = true
            state.pinch = {
                startDist: dist,
                startZoom: state.treeZoom,
                worldX: (cx - state.treePan.x) / state.treeZoom,
                worldY: (cy - state.treePan.y) / state.treeZoom,
            }
            ev.preventDefault()
        }, { passive: false })
        viewport.addEventListener('touchmove', ev => {
            if (!state.pinching || ev.touches.length !== 2 || !state.pinch) return
            const r = viewport.getBoundingClientRect()
            const a = ev.touches[0]
            const b = ev.touches[1]
            const cx = (a.clientX + b.clientX) / 2 - r.left
            const cy = (a.clientY + b.clientY) / 2 - r.top
            const dist = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY) || 1
            const p = state.pinch
            const next = Math.max(.35, Math.min(1.8, p.startZoom * dist / p.startDist))
            state.treeZoom = next
            state.treePan.x = cx - p.worldX * next
            state.treePan.y = cy - p.worldY * next
            scheduleWorldTransform()
            ev.preventDefault()
        }, { passive: false })
        const endPinch = ev => {
            if (ev.touches.length < 2) {
                state.pinching = false
                state.pinch = null
                if (state.worldFrame) {
                    cancelAnimationFrame(state.worldFrame)
                    state.worldFrame = 0
                }
                snapTreeView()
                applyWorldTransform()
                saveTreeView()
            }
        }
        viewport.addEventListener('touchend', endPinch)
        viewport.addEventListener('touchcancel', endPinch)
        for (const sel of ['[data-skill-tray]']) {
            const el = panel.querySelector(sel)
            if (!el) continue
            el.addEventListener('dragover', ev => {
                ev.preventDefault()
                el.classList.add('drop-target')
            })
            el.addEventListener('dragleave', () => el.classList.remove('drop-target'))
            el.addEventListener('wheel', ev => {
                if (Math.abs(ev.deltaY) > Math.abs(ev.deltaX)) {
                    el.scrollLeft += ev.deltaY
                    ev.preventDefault()
                }
            }, { passive: false })
            el.addEventListener('drop', ev => {
                ev.preventDefault()
                el.classList.remove('drop-target')
                const id = ev.dataTransfer?.getData('text/plain')
                if (id) { removePluginFromTree(id); renderTree() }
            })
        }
        document.addEventListener('click', ev => {
            if (!ev.target.closest?.('.skill-menu') && !ev.target.closest?.('.skill-branch-menu')) hideBranchMenu()
        })
        for (const sel of ['[data-skill-settings-pop]', '[data-skill-confirm]']) {
            const el = panel.querySelector(sel)
            if (!el) continue
            el.addEventListener('pointerdown', ev => ev.stopPropagation())
            el.addEventListener('wheel', ev => ev.stopPropagation(), { passive: true })
        }
        document.addEventListener('keydown', ev => {
            if (ev.key === 'Escape' && panel.classList.contains('skill-fullscreen')) exitSkillFullscreen()
        })
        document.addEventListener('fullscreenchange', () => {
            if (!panel.isConnected) return
            if (document.fullscreenElement === panel) {
                state.nativeFullscreen = true
                setSkillFullscreen(true)
            } else if (state.nativeFullscreen) {
                state.nativeFullscreen = false
                setSkillFullscreen(false)
            }
        })
        root.appendChild(panel)
        state.skillPanel = panel
        state.settingsEl = panel.querySelector('[data-skill-settings-pop]')
        applyWorldTransform()
        renderTree()
    }

    function readTreeBackup() {
        try {
            const raw = localStorage.getItem(LS_TREE_BACKUP)
            if (!raw) return null
            const parsed = JSON.parse(raw)
            return parsed?.tree ? parsed : null
        } catch { return null }
    }

    function writeTreeBackup(tree) {
        try {
            if (tree) localStorage.setItem(LS_TREE_BACKUP, JSON.stringify({ tree, savedAt: Date.now() }))
        } catch {}
    }

    function treeUpdatedAt(tree) {
        return Number(tree?.updatedAt) || 0
    }

    async function loadTree(force = false) {
        if (state.treeLoaded && !force) {
            renderTree()
            return
        }
        // Read the saved tree first. get_plugins is only a decoration/status
        // source; it must never recreate or overwrite the saved branch tree.
        const treeRes = await rest('pluginsOptimizer_tree')
        if (!treeRes?.tree) throw Error('invalid tree data')
        const serverTree = normalizeTree(treeRes.tree)
        const backup = readTreeBackup()
        if (backup && treeUpdatedAt(backup.tree) > treeUpdatedAt(serverTree)) {
            // The page was refreshed before the async save finished (or the save
            // failed). Restore the newer local snapshot and push it to storage.
            state.tree = normalizeTree(backup.tree)
            rest('pluginsOptimizer_saveTree', { tree: state.tree }).catch(() => {})
        } else {
            state.tree = serverTree
            writeTreeBackup(serverTree)
        }
        if (!state.tree.positions || typeof state.tree.positions !== 'object')
            state.tree.positions = {}
        const [data, versionData] = await Promise.all([
            apiCall('get_plugins', {}, { timeout: 30000 }),
            rest('pluginsOptimizer_pluginVersions').catch(() => null),
        ])
        const rows = (data?.list || []).map(parseRowConfig)
        state.pluginRows = rows
        state.installed = makeInstalledMap(rows)
        recordPluginSignals(rows, versionData?.versions || {})
        canonicalizeTreeIds()
        state.treeLoaded = true
        renderTree()
        refreshHiddenVisibility()
        await loadUiState()
        await loadDescriptions()
        renderTree()
    }

    async function refreshTreeInstalled(expected = null) {
        const lastKnown = expected ? state.installed.get(expected.id) : null
        const versionData = await rest('pluginsOptimizer_pluginVersions').catch(() => null)
        for (let attempt = 0; attempt < 5; attempt++) {
            const data = await apiCall('get_plugins', {}, { timeout: 30000 })
            const rows = (data?.list || []).map(parseRowConfig)
            state.pluginRows = rows
            state.installed = makeInstalledMap(rows)
            state.allRows = null
            if (!expected) break
            const row = state.installed.get(expected.id)
            const settled = expected.installed === false
                ? !row
                : !!row && !!row.started === !!expected.started
            if (settled) break
            if (attempt < 4) await new Promise(r => setTimeout(r, 220 * (attempt + 1)))
        }
        if (expected && expected.installed !== false && lastKnown && !state.installed.has(expected.id)) {
            state.installed.set(expected.id, {
                ...lastKnown,
                started: expected.started
                    ? (lastKnown.started || new Date().toISOString())
                    : null,
            })
        }
        recordPluginSignals(state.pluginRows, versionData?.versions || {})
        canonicalizeTreeIds()
        renderTree()
        const api = getGridApi()
        if (api) {
            applyHiddenRows(api)
            restoreNativeSort()
        }
    }

    let treeAutoRefreshTimer = null
    function scheduleTreeRefresh(delay = 350) {
        if (treeAutoRefreshTimer) clearTimeout(treeAutoRefreshTimer)
        treeAutoRefreshTimer = setTimeout(() => {
            treeAutoRefreshTimer = null
            refreshTreeInstalled().catch(() => {})
        }, delay)
    }

    function pluginVersionFor(id) {
        const row = state.installed?.get(id)
        if (row?.version != null) return String(row.version)
        const allMeta = state.tree?.pluginMeta || {}
        const meta = allMeta[id]
            || Object.entries(allMeta).find(([key]) => samePluginId(key, id))?.[1]
            || {}
        return meta.version != null ? String(meta.version) : ''
    }

    function canonicalizeTreeIds() {
        const tree = state.tree
        if (!tree) return
        const remap = id => {
            const row = state.installed.get(id)
            if (!row) return id
            // hfs- and -main are only naming variants of the same plugin.
            return pluginMatchKey(row.id) === pluginMatchKey(id) || pluginIdKey(row.id) === pluginIdKey(id) ? id : row.id
        }
        const aliases = new Map()
        const seen = []
        const remapList = list => {
            const out = []
            for (const id of list || []) {
                const canonical = remap(id)
                const key = pluginMatchKey(canonical)
                const version = pluginVersionFor(canonical)
                const collision = seen.find(item => item.key === key
                    && (!item.version || !version || item.version === version))
                if (collision) {
                    aliases.set(id, collision.id)
                    continue
                }
                seen.push({ id: canonical, key, version })
                if (!out.includes(canonical)) out.push(canonical)
            }
            return out
        }
        for (const root of tree.roots || []) root.plugins = remapList(root.plugins)
        for (const main of tree.mains || []) main.plugins = remapList(main.plugins)
        for (const cat of tree.categories || []) cat.plugins = remapList(cat.plugins)
        const stars = []
        for (const id of tree.stars || []) {
            const canonical = aliases.get(id) || remap(id)
            if (!stars.includes(canonical)) stars.push(canonical)
        }
        tree.stars = stars
        const positions = {}
        for (const [key, value] of Object.entries(tree.positions || {})) {
            if (key.startsWith('plugin:')) {
                const canonical = 'plugin:' + (aliases.get(key.slice(7)) || remap(key.slice(7)))
                if (!positions[canonical]) positions[canonical] = value
            } else {
                positions[key] = value
            }
        }
        tree.positions = positions
        for (const [removed, kept] of aliases) {
            if (tree.pluginColors?.[removed] && !tree.pluginColors[kept])
                tree.pluginColors[kept] = tree.pluginColors[removed]
            if (tree.pluginColors) delete tree.pluginColors[removed]
        }
        if (tree.pluginMeta && typeof tree.pluginMeta === 'object') {
            const meta = {}
            for (const [id, value] of Object.entries(tree.pluginMeta)) {
                const canonical = aliases.get(id) || remap(id)
                if (!meta[canonical]) meta[canonical] = value
            }
            tree.pluginMeta = meta
        }
    }

    async function loadTreeUpdates() {
        if (state.updatesLoading) return
        state.updatesLoading = true
        try {
            const data = await apiCall('get_plugin_updates', {}, { timeout: 60000 })
            const updates = new Set()
            for (const row of data?.list || []) {
                if (row?.id) updates.add(pluginMatchKey(row.id))
                if (row?.repo) updates.add(pluginMatchKey(row.repo))
            }
            state.updates = updates
            renderTree()
        } catch {}
        finally { state.updatesLoading = false }
    }

    function pluginHasUpdate(id) {
        return state.updates.has(pluginMatchKey(id))
    }

    function applyTreeUpdates() {
        const panel = state.skillPanel
        if (!panel) return
        for (const node of panel.querySelectorAll('.skill-node.skill-plugin[data-id]')) {
            node.classList.toggle('has-update', pluginHasUpdate(node.dataset.id))
        }
    }

    function descriptionEntryFor(id, repo) {
        const map = state.descriptions || {}
        const direct = map[id] || (repo && map[repo])
        if (direct) return direct
        const tail = String(repo || id || '').split('/').pop()
        return Object.values(map).find(entry =>
            (entry.repo && samePluginId(entry.repo.split('/').pop(), id))
            || samePluginId(entry.id, id)
            || (tail && samePluginId(entry.repo?.split('/').pop(), tail))
        ) || null
    }

    function descriptionFor(id, repo) {
        return descriptionEntryFor(id, repo)?.description || ''
    }

    async function loadDescriptions() {
        if (state.descriptionsLoaded) return
        try {
            const data = await rest('pluginsOptimizer_descriptions')
            state.descriptions = data?.descriptions && typeof data.descriptions === 'object' ? data.descriptions : {}
        } catch {}
        state.descriptionsLoaded = true
    }

    async function cachePluginDescription(id, meta) {
        const repo = meta?.repo || ''
        let description = descriptionFor(id, repo) || meta?.description || ''
        let version = meta?.version ?? null
        const author = String(meta?.author || repo.split('/')[0] || '').trim()
        const source = meta?.row ? 'plugin' : 'online'
        if (repo && !description) {
            try {
                const online = await rest('pluginsOptimizer_onlinePlugin', { repo, id }, { timeout: 30000 })
                if (online?.ok && online.plugin) {
                    description = online.plugin.description || description
                    version = online.plugin.version ?? version
                }
            } catch {}
        }
        if (!description && !repo) return
        try {
            await rest('pluginsOptimizer_saveDescriptions', {
                entries: [{ id, repo, author, description, version, source }],
            })
            state.descriptions[id] = { id, repo, author, description, version, source }
            if (repo) state.descriptions[repo] = state.descriptions[id]
            renderTree()
        } catch {}
    }

    function treeMeta(id) {
        const row = state.installed.get(id)
        const allMeta = state.tree?.pluginMeta || {}
        const meta = allMeta[id]
            || Object.entries(allMeta).find(([key]) => samePluginId(key, id))?.[1]
            || {}
        const knownRepo = row?.repo || meta.repo || ''
        const entry = descriptionEntryFor(id, knownRepo)
        const repo = knownRepo || entry?.repo || ''
        const hug3o = meta.hug3o === true || /^Hug3O\//i.test(repo)
        const description = row?.description || meta.description || entry?.description || ''
        const author = String(meta.author || entry?.author || repo.split('/')[0] || '').trim()
        return { row, meta, repo, author, hug3o, description }
    }

    function treePluginIds() {
        const ids = new Set()
        for (const cat of state.tree?.categories || [])
            for (const id of cat.plugins || []) ids.add(id)
        for (const main of state.tree?.mains || [])
            for (const id of main.plugins || []) ids.add(id)
        for (const root of state.tree?.roots || [])
            for (const id of root.plugins || []) ids.add(id)
        for (const id of [...ids]) {
            ids.add(pluginIdKey(id))
            ids.add(pluginMatchKey(id))
        }
        return ids
    }

    function normalizeTree(tree) {
        if (!tree || typeof tree !== 'object') return tree
        if (!Array.isArray(tree.roots)) {
            tree.roots = [
                { id: 'hfs3', label: tree.root?.label || 'HFS3' },
                { id: 'server', label: 'Server' },
            ]
        } else if (!tree.roots.length && tree.schema !== 2) {
            tree.roots = [
                { id: 'hfs3', label: tree.root?.label || 'HFS3' },
                { id: 'server', label: 'Server' },
            ]
        }
        tree.roots = tree.roots.map((root, i) => ({
            ...root,
            id: root.id || `root-${i + 1}`,
            label: root.label || `Trunk ${i + 1}`,
            plugins: Array.isArray(root.plugins) ? root.plugins : [],
        }))
        const rootIds = new Set(tree.roots.map(r => r.id))
        tree.mains = Array.isArray(tree.mains) ? tree.mains : []
        for (const main of tree.mains) {
            if (!main.root || !rootIds.has(main.root)) main.root = tree.roots[0].id
            if (!Array.isArray(main.plugins)) main.plugins = []
        }
        tree.categories = Array.isArray(tree.categories) ? tree.categories : []
        const categoryIds = new Set(tree.categories.map(c => c.id))
        for (const cat of tree.categories) {
            if (!Array.isArray(cat.plugins)) cat.plugins = []
            if (cat.parent && (!categoryIds.has(cat.parent) || cat.parent === cat.id)) delete cat.parent
        }
        for (const cat of tree.categories) {
            let parentId = cat.parent
            const seen = new Set([cat.id])
            while (parentId) {
                if (seen.has(parentId)) {
                    delete cat.parent
                    break
                }
                seen.add(parentId)
                const parent = tree.categories.find(c => c.id === parentId)
                parentId = parent?.parent
            }
            if (cat.parent) {
                const parent = tree.categories.find(c => c.id === cat.parent)
                if (parent) cat.main = parent.main
            }
        }
        tree.positions = tree.positions && typeof tree.positions === 'object' ? tree.positions : {}
        tree.pluginColors = tree.pluginColors && typeof tree.pluginColors === 'object' ? tree.pluginColors : {}
        tree.stars = Array.isArray(tree.stars) ? [...new Set(tree.stars.filter(x => typeof x === 'string' && x))] : []
        if (tree.positions.root && !tree.positions['root:' + tree.roots[0].id]) {
            tree.positions['root:' + tree.roots[0].id] = tree.positions.root
            delete tree.positions.root
        }
        tree.schema = 2
        return tree
    }

    function loadedCount(ids) {
        const unique = new Set(ids || [])
        let count = 0
        for (const id of unique) {
            if (state.installed.get(id)?.started) count++
        }
        return count
    }

    function loadedForCategory(cat) {
        return loadedCount(cat?.plugins || [])
    }

    function hiddenCount(ids) {
        const unique = new Set(ids || [])
        let count = 0
        for (const id of unique) {
            const row = state.installed.get(id)
            if (!row || !row.started) count++
        }
        return count
    }

    function hiddenForMain(mainId) {
        const ids = []
        const main = (state.tree.mains || []).find(m => m.id === mainId)
        ids.push(...(main?.plugins || []))
        for (const cat of state.tree.categories || []) {
            if (cat.main === mainId) ids.push(...(cat.plugins || []))
        }
        return hiddenCount(ids)
    }

    function loadedForMain(mainId) {
        const ids = []
        for (const cat of state.tree.categories || []) {
            if (cat.main === mainId) ids.push(...(cat.plugins || []))
        }
        const main = (state.tree.mains || []).find(m => m.id === mainId)
        if (main) ids.push(...(main.plugins || []))
        return loadedCount(ids)
    }

    function loadedForRoot(rootId) {
        const ids = []
        const root = (state.tree.roots || []).find(r => r.id === rootId)
        ids.push(...(root?.plugins || []))
        for (const main of state.tree.mains || []) {
            if (main.root !== rootId) continue
            ids.push(...(main.plugins || []))
            for (const cat of state.tree.categories || []) {
                if (cat.main === main.id) ids.push(...(cat.plugins || []))
            }
        }
        return loadedCount(ids)
    }

    function categorySections(cat) {
        const active = []
        const unloaded = []
        const pinned = []
        for (const id of cat.plugins || []) {
            const row = state.installed.get(id)
            if (row?.started) active.push(id)
            else if (treeIsStarred(id)) pinned.push(id)
            else unloaded.push(id)
        }
        const show = state.treeShowUnloaded.has(cat.id)
        return {
            active,
            unloaded,
            pinned,
            visible: [...active, ...(show ? unloaded : []), ...pinned],
            hidden: unloaded.length,
            show,
        }
    }

    function mainSections(main) {
        const active = []
        const unloaded = []
        const pinned = []
        for (const id of main.plugins || []) {
            const row = state.installed.get(id)
            if (row?.started) active.push(id)
            else if (treeIsStarred(id)) pinned.push(id)
            else unloaded.push(id)
        }
        const show = state.treeShowUnloaded.has('main:' + main.id)
        return {
            active,
            unloaded,
            pinned,
            visible: [...active, ...(show ? unloaded : []), ...pinned],
            hidden: unloaded.length,
            show,
        }
    }

    function inlineExtra() {
        // Inline panels are overlays; they must not push following plugins.
        return 0
    }

    function computeTreeLayout() {
        const tree = state.tree
        const positions = tree.positions || (tree.positions = {})
        const layout = {}
        const roots = tree.roots || []
        const mains = [...(tree.mains || [])].sort((a, b) => (a.order || 0) - (b.order || 0))
        let cursor = 112
        for (const root of roots) {
            const rootMains = mains.filter(m => m.root === root.id)
            const rootKey = 'root:' + root.id
            const rootPos = positions[rootKey] || {}
            const rootY = rootPos.y ?? cursor
            const rootX = rootPos.x ?? 40
            let verticalY = rootY
            let bandBottom = rootY + 58
            for (const main of rootMains) {
                const allCats = tree.categories || []
                const cats = allCats.filter(c => c.main === main.id && !c.parent)
                const direct = mainSections(main)
                const mainKey = 'main:' + main.id
                const mainPos = positions[mainKey] || {}
                // Default sequence: level 1 branches vertically, level 2
                // categories horizontally, level 3 plugin entries vertically.
                const mainY = mainPos.y ?? verticalY
                const mainX = mainPos.x ?? (rootX + 420)
                layout[mainKey] = {
                    key: mainKey, type: 'main', id: main.id, root: root.id, label: main.label,
                    x: mainX, y: mainY, w: 340, h: 56,
                }
                let bottom = mainY + 56
                const layoutCatTree = (cat, defaultX, defaultY, baseX, topLevel = false) => {
                    const key = 'cat:' + cat.id
                    const catPos = positions[key] || {}
                    const catX = catPos.x ?? defaultX
                    const catY = catPos.y ?? defaultY
                    const sections = categorySections(cat)
                    layout[key] = { key, type: 'category', id: cat.id, main: main.id, root: root.id, label: cat.label, x: catX, y: catY, w: 340, h: 56 }
                    let localBottom = catY + 56
                    let nextY = catY + 58
                    for (const id of sections.active) {
                        const pkey = 'plugin:' + id
                        layout[pkey] = {
                            key: pkey, type: 'plugin', id, cat: cat.id, main: main.id, root: root.id,
                            x: catX, y: nextY, w: 340, h: 52,
                        }
                        nextY += 56 + inlineExtra(id)
                        localBottom = Math.max(localBottom, nextY)
                    }
                    let tailY = nextY
                    if (sections.show) {
                        let uy = tailY
                        for (const id of sections.unloaded) {
                            const pkey = 'plugin:' + id
                            layout[pkey] = {
                                key: pkey, type: 'plugin', id, cat: cat.id, main: main.id, root: root.id,
                                x: catX, y: uy, w: 340, h: 52,
                            }
                            uy += 56 + inlineExtra(id)
                            localBottom = Math.max(localBottom, uy)
                        }
                        tailY = uy
                    } else {
                        tailY = Math.max(tailY, catY + 58)
                        localBottom = Math.max(localBottom, tailY)
                    }
                    if (sections.pinned.length) {
                        let py = tailY
                        for (const id of sections.pinned) {
                            const pkey = 'plugin:' + id
                            layout[pkey] = {
                                key: pkey, type: 'plugin', id, cat: cat.id, main: main.id, root: root.id,
                                x: catX, y: py, w: 340, h: 52,
                            }
                            py += 56 + inlineExtra(id)
                            localBottom = Math.max(localBottom, py)
                        }
                    }
                    let childY = localBottom + 24
                    for (const child of allCats.filter(c => c.parent === cat.id)) {
                        const childDefaultX = Math.min(catX + 40, baseX + 40)
                        const childBottom = layoutCatTree(child, childDefaultX, childY, baseX, false)
                        childY = childBottom + 24
                        localBottom = Math.max(localBottom, childBottom)
                    }
                    return localBottom
                }
                cats.forEach((cat, i) => {
                    const key = 'cat:' + cat.id
                    const catPos = positions[key] || {}
                    const defaultX = catPos.x ?? (mainX + 420 + i * 400)
                    bottom = Math.max(bottom, layoutCatTree(cat, defaultX, mainY + 84, defaultX, true))
                })
                ;[].forEach((cat, i) => {
                    const key = 'cat:' + cat.id
                    const catPos = positions[key] || {}
                    const defaultCatX = mainX + 420 + i * 400
                    // A child category may never sit closer than 80px to its
                    // parent main, even after a custom drag.
                    const catX = Math.max(catPos.x ?? defaultCatX, mainX + 420)
                    const catY = catPos.y ?? (mainY + 84)
                    const sections = categorySections(cat)
                    layout[key] = { key, type: 'category', id: cat.id, main: main.id, root: root.id, label: cat.label, x: catX, y: catY, w: 340, h: 56 }
                    let nextY = catY + 70
                    for (const id of sections.active) {
                        const pkey = 'plugin:' + id
                        layout[pkey] = {
                            key: pkey, type: 'plugin', id, cat: cat.id, main: main.id, root: root.id,
                            x: catX, y: nextY, w: 340, h: 52,
                        }
                        nextY += 56 + inlineExtra(id)
                        bottom = Math.max(bottom, nextY)
                    }
                    let tailY = nextY
                    if (sections.show) {
                        // Unloaded entries always sit below the loaded ones, grouped together.
                        let uy = tailY
                        for (const id of sections.unloaded) {
                            const pkey = 'plugin:' + id
                            layout[pkey] = {
                                key: pkey, type: 'plugin', id, cat: cat.id, main: main.id, root: root.id,
                                x: catX, y: uy, w: 340, h: 52,
                            }
                            uy += 56 + inlineExtra(id)
                            bottom = Math.max(bottom, uy)
                        }
                        tailY = uy
                    } else {
                        tailY = Math.max(tailY, catY + 70)
                        bottom = Math.max(bottom, tailY)
                    }
                    // Starred but stopped/missing plugins stay visible, pinned to the bottom.
                    if (sections.pinned.length) {
                        let py = tailY
                        for (const id of sections.pinned) {
                            const pkey = 'plugin:' + id
                            layout[pkey] = {
                                key: pkey, type: 'plugin', id, cat: cat.id, main: main.id, root: root.id,
                                x: catX, y: py, w: 340, h: 52,
                            }
                            py += 56 + inlineExtra(id)
                            bottom = Math.max(bottom, py)
                        }
                    }
                })
                // Direct children sit magnetically under their main branch, not
                // in the category column to its right.
                const directX = mainX
                // Direct children use the same 14px magnetic gap as a category's
                // first plugin, without an extra category header row.
                let directNext = mainY + 58
                for (const id of direct.active) {
                    const pkey = 'plugin:' + id
                    layout[pkey] = {
                        key: pkey, type: 'plugin', id, main: main.id, root: root.id,
                        x: directX, y: directNext, w: 340, h: 52,
                    }
                    directNext += 56 + inlineExtra(id)
                    bottom = Math.max(bottom, directNext)
                }
                let directTail = directNext
                if (direct.show) {
                    let uy = directTail
                    for (const id of direct.unloaded) {
                        const pkey = 'plugin:' + id
                        layout[pkey] = {
                            key: pkey, type: 'plugin', id, main: main.id, root: root.id,
                            x: directX, y: uy, w: 340, h: 52,
                        }
                        uy += 56 + inlineExtra(id)
                        bottom = Math.max(bottom, uy)
                    }
                    directTail = uy
                }
                if (direct.pinned.length) {
                    let py = directTail
                    for (const id of direct.pinned) {
                        const pkey = 'plugin:' + id
                        layout[pkey] = {
                            key: pkey, type: 'plugin', id, main: main.id, root: root.id,
                            x: directX, y: py, w: 340, h: 52,
                        }
                        py += 56 + inlineExtra(id)
                        bottom = Math.max(bottom, py)
                    }
                }
                bandBottom = Math.max(bandBottom, bottom)
                verticalY = bottom + 224
            }
            layout[rootKey] = {
                key: rootKey, type: 'root', id: root.id, label: root.label,
                x: rootX, y: rootY, w: 340, h: 58,
            }
            const rootPlugins = [...(root.plugins || [])].sort((a, b) => {
                const sa = state.installed.get(a)?.started ? 0 : 1
                const sb = state.installed.get(b)?.started ? 0 : 1
                return sa - sb
            })
            let rootNext = rootY + 84
            for (const id of rootPlugins) {
                const pkey = 'plugin:' + id
                layout[pkey] = {
                    key: pkey, type: 'plugin', id, root: root.id,
                    x: rootX, y: rootNext, w: 340, h: 52,
                }
                rootNext += 56 + inlineExtra(id)
            }
            cursor = Math.max(bandBottom, rootNext, rootY + 58) + 140
        }
        return layout
    }

    function saveTreeView(orientation = state.viewOrientation || treeOrientation()) {
        try {
            const all = readTreeViewStore()
            all[orientation] = {
                x: state.treePan.x,
                y: state.treePan.y,
                zoom: state.treeZoom,
            }
            localStorage.setItem(LS_TREE_VIEW, JSON.stringify(all))
        } catch {}
    }

    function switchTreeViewOrientation() {
        const next = treeOrientation()
        if (next === state.viewOrientation) return
        saveTreeView(state.viewOrientation)
        state.viewOrientation = next
        const saved = readTreeViewStore()[next]
        if (saved && Number.isFinite(Number(saved.x)) && Number.isFinite(Number(saved.y))) {
            state.treePan = { x: Number(saved.x), y: Number(saved.y) }
            const z = Number(saved.zoom)
            state.treeZoom = Number.isFinite(z) && z >= .2 && z <= 2 ? z : state.treeZoom
            state.treeFitted = true
            applyWorldTransform()
        } else {
            state.treeFitted = false
            setTimeout(() => {
                focusTree()
                saveTreeView(next)
            }, 50)
        }
    }

    function saveTreeViewSoon() {
        if (state.treeViewTimer) clearTimeout(state.treeViewTimer)
        state.treeViewTimer = setTimeout(() => {
            state.treeViewTimer = null
            saveTreeView()
        }, 120)
    }

    function snapTreeView() {
        state.treePan.x = Math.round(state.treePan.x)
        state.treePan.y = Math.round(state.treePan.y)
        state.treeZoom = Math.round((Number(state.treeZoom) || 1) * 100) / 100
    }

    function applyWorldTransform() {
        const world = state.skillPanel?.querySelector('[data-skill-world]')
        if (!world) return
        world.style.transform = `translate(${state.treePan.x}px, ${state.treePan.y}px) scale(${state.treeZoom})`
        if (!state.pinching) updateInlinePanelScale()
        saveTreeViewSoon()
    }

    function scheduleWorldTransform() {
        if (state.worldFrame) return
        state.worldFrame = requestAnimationFrame(() => {
            state.worldFrame = 0
            applyWorldTransform()
        })
    }

    function fitTree() {
        const viewport = state.skillPanel?.querySelector('[data-skill-viewport]')
        if (!viewport) return
        const layout = computeTreeLayout()
        const nodes = Object.values(layout)
        if (!nodes.length) return
        const minX = Math.min(...nodes.map(n => n.x))
        const minY = Math.min(...nodes.map(n => n.y))
        const maxX = Math.max(...nodes.map(n => n.x + n.w))
        const maxY = Math.max(...nodes.map(n => n.y + n.h))
        const vw = viewport.clientWidth || 800
        const vh = viewport.clientHeight || 500
        const coarse = (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) || window.innerWidth <= 760
        const minFit = coarse ? .5 : .35
        state.treeZoom = Math.max(minFit, Math.min(1, Math.min(vw / (maxX - minX + 80), vh / (maxY - minY + 80))))
        state.treePan = { x: 24 - minX * state.treeZoom, y: 24 - minY * state.treeZoom }
        applyWorldTransform()
    }

    function focusTree() {
        const viewport = state.skillPanel?.querySelector('[data-skill-viewport]')
        if (!viewport || !state.layout) return
        const nodes = Object.values(state.layout)
        if (!nodes.length) return
        const minX = Math.min(...nodes.map(n => n.x))
        const maxX = Math.max(...nodes.map(n => n.x + n.w))
        const vw = viewport.clientWidth || 800
        const coarse = window.matchMedia && window.matchMedia('(pointer: coarse)').matches
        state.treeZoom = Math.max(coarse ? .9 : .82, Math.min(1, (vw - 30) / Math.max(1, maxX - minX + 60)))
        state.treePan.x = 18 - minX * state.treeZoom
        state.treePan.y = 18 - Math.min(...nodes.map(n => n.y)) * state.treeZoom
        applyWorldTransform()
    }

    function startPan(ev) {
        const viewport = state.skillPanel?.querySelector('[data-skill-viewport]')
        if (!viewport) return
        const start = { x: ev.clientX, y: ev.clientY, px: state.treePan.x, py: state.treePan.y }
        viewport.classList.add('panning')
        const move = e => {
            if (state.pinching) return
            state.treePan.x = start.px + e.clientX - start.x
            state.treePan.y = start.py + e.clientY - start.y
            applyWorldTransform()
        }
        const up = () => {
            viewport.classList.remove('panning')
            snapTreeView()
            applyWorldTransform()
            saveTreeView()
            window.removeEventListener('pointermove', move)
            window.removeEventListener('pointerup', up)
        }
        window.addEventListener('pointermove', move)
        window.addEventListener('pointerup', up)
    }

    function zoomTreeBy(factor) {
        const viewport = state.skillPanel?.querySelector('[data-skill-viewport]')
        if (!viewport) return
        const rect = viewport.getBoundingClientRect()
        const mx = rect.width / 2
        const my = rect.height / 2
        const old = state.treeZoom
        const next = Math.max(.2, Math.min(1.6, old * factor))
        state.treePan.x = mx - (mx - state.treePan.x) * (next / old)
        state.treePan.y = my - (my - state.treePan.y) * (next / old)
        state.treeZoom = next
        snapTreeView()
        applyWorldTransform()
        saveTreeView()
    }

    function zoomTree(ev) {
        const viewport = state.skillPanel?.querySelector('[data-skill-viewport]')
        if (!viewport) return
        const rect = viewport.getBoundingClientRect()
        const mx = ev.clientX - rect.left
        const my = ev.clientY - rect.top
        const old = state.treeZoom
        const next = Math.max(.35, Math.min(1.4, old * (ev.deltaY < 0 ? 1.1 : .9)))
        state.treePan.x = mx - (mx - state.treePan.x) * (next / old)
        state.treePan.y = my - (my - state.treePan.y) * (next / old)
        state.treeZoom = next
        snapTreeView()
        applyWorldTransform()
        saveTreeView()
    }

    function withTreeLock(fn) {
        const run = treeOpQueue.then(fn, fn)
        treeOpQueue = run.catch(() => {})
        return run
    }

    async function doSaveTree() {
        if (!state.tree) return false
        state.tree.updatedAt = Date.now()
        writeTreeBackup(state.tree)
        try {
            await rest('pluginsOptimizer_saveTree', { tree: state.tree })
            return true
        } catch (e) {
            toast('Tree save failed: ' + e.message, 'error')
            return false
        }
    }

    function saveTreeNow() {
        if (state.treeSaveTimer) {
            clearTimeout(state.treeSaveTimer)
            state.treeSaveTimer = null
        }
        return withTreeLock(doSaveTree)
    }

    function resetOrderByProximity() {
        const layout = computeTreeLayout()
        const dist = (a, b) => {
            if (!a || !b) return Infinity
            const ax = a.x + a.w / 2
            const ay = a.y + a.h / 2
            const bx = b.x + b.w / 2
            const by = b.y + b.h / 2
            return (ax - bx) ** 2 + (ay - by) ** 2
        }
        const sortPlugins = (list, parent) => {
            const ranked = (list || []).map((id, index) => ({
                id,
                index,
                d: dist(layout['plugin:' + id], parent),
            }))
            ranked.sort((a, b) => a.d - b.d || a.index - b.index)
            return ranked.map(x => x.id)
        }
        for (const root of state.tree.roots || []) {
            const rootNode = layout['root:' + root.id]
            const mains = state.tree.mains
                .filter(m => m.root === root.id)
                .map((m, index) => ({ m, index, d: dist(layout['main:' + m.id], rootNode) }))
            mains.sort((a, b) => a.d - b.d || a.index - b.index)
            mains.forEach((x, i) => { x.m.order = i })
            root.plugins = sortPlugins(root.plugins, rootNode)
        }
        for (const main of state.tree.mains || []) {
            const mainNode = layout['main:' + main.id]
            const siblings = state.tree.categories.filter(c => c.main === main.id)
            const ranked = siblings.map((c, index) => ({
                c,
                index,
                d: dist(layout['cat:' + c.id], mainNode),
            }))
            ranked.sort((a, b) => a.d - b.d || a.index - b.index)
            let k = 0
            for (let i = 0; i < state.tree.categories.length; i++) {
                if (state.tree.categories[i].main === main.id) {
                    state.tree.categories[i] = ranked[k++].c
                }
            }
            main.plugins = sortPlugins(main.plugins, mainNode)
            for (const cat of state.tree.categories.filter(c => c.main === main.id)) {
                cat.plugins = sortPlugins(cat.plugins, layout['cat:' + cat.id])
            }
        }
    }

    async function resetTreeLayout() {
        if (!(await uiConfirm('Reset all custom positions to the HFS3 sequence? Siblings closer to their parent will be ordered first.', 'Reset layout'))) return
        try {
            await withTreeLock(async () => {
                // Preserve the complete current tree, including every custom
                // coordinate, so Restore can bring the exact layout back.
                await rest('pluginsOptimizer_snapshotTree', { tree: state.tree })
                // Rank siblings by their distance to the parent before dropping
                // the coordinates, so Reset preserves the intended near-to-far order.
                resetOrderByProximity()
                state.tree.positions = {}
                state.tree.updatedAt = Date.now()
                state.treeShowUnloaded.clear()
                state.ui.expandedHidden = []
                queueUiSave()
                await rest('pluginsOptimizer_saveTree', { tree: state.tree })
                writeTreeBackup(state.tree)
                state.treeLoaded = true
                state.treeFitted = false
                renderTree()
                refreshHiddenVisibility()
                toast('Layout reset to HFS3 sequence')
            })
        } catch (e) { toast('Reset failed: ' + e.message, 'error') }
    }

    function captureCurrentLayoutPositions() {
        if (!state.tree) return 0
        const layout = computeTreeLayout()
        const positions = state.tree.positions || (state.tree.positions = {})
        let count = 0
        for (const node of Object.values(layout)) {
            positions[node.key] = { x: node.x, y: node.y }
            count++
        }
        return count
    }

    async function freezeTreeLayout() {
        if (!(await uiConfirm('Overwrite public/tree.default.json with the current storage tree and every visible layout coordinate?', 'Save default'))) return
        try {
            await withTreeLock(async () => {
                const count = captureCurrentLayoutPositions()
                if (!await doSaveTree()) return
                await rest('pluginsOptimizer_freezeTree')
                toast(`Saved tree and ${count} layout coordinates as public default`)
            })
        } catch (e) { toast('Save as default failed: ' + e.message, 'error') }
    }

    function setNodeXY(el, x, y) {
        if (!el) return
        el.style.left = x + 'px'
        el.style.top = y + 'px'
    }

    function nodeEls() {
        const world = state.skillPanel?.querySelector('[data-skill-world]')
        return world ? [...world.querySelectorAll('.skill-node')] : []
    }

    function updateConnectors() {
        const svg = state.skillPanel?.querySelector('[data-skill-links]')
        if (!svg || !state.layout) return
        const paths = []
        const seenPaths = new Set()
        const pushPath = d => {
            if (seenPaths.has(d)) return
            seenPaths.add(d)
            paths.push(`<path d="${d}"/>`)
        }
        const add = (a, b) => {
            if (!a || !b) return
            const x1 = a.x + a.w, y1 = a.y + a.h / 2
            const x2 = b.x, y2 = b.y + b.h / 2
            const dx = x2 - x1
            const dy = y2 - y1
            if (Math.abs(dy) < 1) {
                pushPath(`M ${x1} ${y1} H ${x2}`)
            } else if (Math.abs(dx) < 1) {
                pushPath(`M ${x1} ${y1} V ${y2}`)
            } else {
                // Horizontal -> 45 degrees chamfer -> vertical at the left stub ->
                // final horizontal segment into the child card.
                const stub = Math.min(14, Math.abs(dx))
                const targetX = x2 - Math.sign(dx) * stub
                const routeDx = targetX - x1
                const d = Math.min(40, Math.abs(routeDx) / 2, Math.abs(dy))
                const sx = targetX - Math.sign(routeDx) * d
                const sy = y1 + Math.sign(dy) * d
                pushPath(`M ${x1} ${y1} H ${sx} L ${targetX} ${sy} V ${y2} H ${x2}`)
            }
        }
        const addDown = (a, b) => {
            if (!a || !b) return
            // Vertical spine sits just right of the power switch (about 44px
            // from the card's left edge). The card masks the hidden part.
            const x = b.x + 44
            pushPath(`M ${x} ${a.y + a.h} V ${b.y}`)
        }
        const addChildCategory = (a, b) => {
            if (!a || !b) return
            const x1 = a.x + 44
            const x2 = b.x + 44
            const y1 = a.y + a.h
            const dx = x2 - x1
            const dy = b.y - y1
            if (Math.abs(dx) < 1) {
                pushPath(`M ${x1} ${y1} V ${b.y}`)
                return
            }
            // Match the parent-level connector: horizontal, a small 45 degrees
            // chamfer, then vertical into the child category.
            const d = Math.min(24, Math.abs(dx) / 2, Math.abs(dy))
            const sx = x2 - Math.sign(dx) * d
            const sy = y1 + Math.sign(dy) * d
            pushPath(`M ${x1} ${y1} H ${sx} L ${x2} ${sy} V ${b.y}`)
        }

        for (const root of state.tree.roots || []) {
            const r = state.layout['root:' + root.id]
            for (const main of state.tree.mains || []) {
                if (main.root !== root.id) continue
                add(r, state.layout['main:' + main.id])
            }
            for (const id of root.plugins || []) {
                add(r, state.layout['plugin:' + id])
            }
        }
        for (const main of state.tree.mains || []) {
            const m = state.layout['main:' + main.id]
            const connectCategory = (cat, topLevel) => {
                const c = state.layout['cat:' + cat.id]
                if (!c) return
                if (topLevel) add(m, c)
                for (const child of state.tree.categories.filter(x => x.parent === cat.id)) {
                    const childNode = state.layout['cat:' + child.id]
                    addChildCategory(c, childNode)
                    connectCategory(child, false)
                }
            }
            for (const cat of state.tree.categories.filter(c => c.main === main.id && !c.parent)) {
                connectCategory(cat, true)
            }
            for (const id of mainSections(main).visible) {
                addDown(m, state.layout['plugin:' + id])
            }
        }
        svg.innerHTML = paths.join('')
    }

    function renderTree() {
        const panel = state.skillPanel
        if (!panel || !state.tree) return
        const world = panel.querySelector('[data-skill-world]')
        if (!world) return
        const layout = computeTreeLayout()
        state.layout = layout
        const nodes = Object.values(layout)
        const maxX = Math.max(900, ...nodes.map(n => n.x + n.w + 80))
        const maxY = Math.max(600, ...nodes.map(n => n.y + n.h + 100))
        world.innerHTML = ''
        world.style.width = maxX + 'px'
        world.style.height = maxY + 'px'
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
        svg.setAttribute('class', 'skill-links')
        svg.setAttribute('data-skill-links', '1')
        svg.setAttribute('width', maxX)
        svg.setAttribute('height', maxY)
        world.appendChild(svg)

        for (const root of state.tree.roots || []) {
            world.appendChild(makeTreeNode(layout['root:' + root.id]))
            for (const id of [...(root.plugins || [])].sort((a, b) => {
                const sa = state.installed.get(a)?.started ? 0 : 1
                const sb = state.installed.get(b)?.started ? 0 : 1
                return sa - sb
            })) {
                const item = layout['plugin:' + id]
                if (item) world.appendChild(makePluginNode(item))
            }
            for (const main of state.tree.mains || []) {
                if (main.root !== root.id) continue
                world.appendChild(makeTreeNode(layout['main:' + main.id]))
                for (const cat of state.tree.categories || []) {
                    if (cat.main !== main.id) continue
                    world.appendChild(makeTreeNode(layout['cat:' + cat.id]))
                    for (const id of categorySections(cat).visible) {
                        const item = layout['plugin:' + id]
                        if (item) world.appendChild(makePluginNode(item))
                    }
                }
                for (const id of mainSections(main).visible) {
                    const item = layout['plugin:' + id]
                    if (item) world.appendChild(makePluginNode(item))
                }
            }
        }
        dockInlinePanels()
        updateConnectors()
        applyWorldTransform()
        ensurePersistedOutput()
        if (!state.treeFitted) {
            state.treeFitted = true
            requestAnimationFrame(focusTree)
        }
        renderTray()
        applyTreeUpdates()
        applyPendingDownloadFeedback()
        applyQueuedActionFeedback()
        updateSkillSummary()
        announcePluginErrors()
    }

    function announcePluginErrors() {
        if (state.errorsAnnounced) return
        const errors = [...state.installed.values()].filter(row => row.error)
        if (!errors.length) {
            state.errorsAnnounced = false
            return
        }
        state.errorsAnnounced = true
        const text = errors.map(row => `${pluginDisplayName(row.id)}: ${row.error}`).join(' | ')
        toast('Plugin needs attention — ' + text, 'error', 10000)
    }

    function updateSkillSummary() {
        const panel = state.skillPanel
        const sub = panel?.querySelector('[data-skill-sub]')
        if (!sub) return
        const installedCount = state.installed.size
        const runningCount = [...state.installed.values()].filter(row => row.started).length
        const treeIds = treePluginIds()
        const unarrangedCount = [...state.installed.keys()]
            .filter(id => !treeIds.has(id) && !treeIds.has(pluginMatchKey(id))).length
        const queue = queueEntries()
        const queuePart = queue.length
            ? ` | ${queue.filter(x => x.status === 'downloading').length} downloading, ${queue.filter(x => x.status !== 'downloading').length} queued`
            : ''
        const actions = readTreeActions().length
        const actionPart = actions ? ` | ${actions} action${actions === 1 ? '' : 's'} queued` : ''
        sub.textContent = `${installedCount} installed | ${runningCount} running | ${unarrangedCount} unarranged${queuePart}${actionPart}`
    }

    function bindBranchDrop(el, item) {
        el.addEventListener('dragover', ev => { ev.preventDefault(); el.classList.add('drop-target') })
        el.addEventListener('dragleave', () => el.classList.remove('drop-target'))
        el.addEventListener('drop', ev => {
            ev.preventDefault()
            el.classList.remove('drop-target')
            const id = ev.dataTransfer?.getData('text/plain')
            if (id) dropPluginOnBranch(id, item)
        })
    }

    function assignPluginToMain(pluginId, mainId) {
        const main = state.tree.mains.find(m => m.id === mainId)
        if (!main) return
        for (const cat of state.tree.categories) cat.plugins = (cat.plugins || []).filter(x => x !== pluginId)
        for (const m of state.tree.mains) m.plugins = (m.plugins || []).filter(x => x !== pluginId)
        main.plugins = main.plugins || []
        main.plugins.push(pluginId)
        for (const id of main.plugins) delete state.tree.positions['plugin:' + id]
        saveTreeNow()
        renderTree()
        scheduleTreeRefresh()
    }

    function categoryHasAncestor(catId, ancestorId) {
        let parentId = state.tree.categories.find(c => c.id === catId)?.parent
        const seen = new Set()
        while (parentId && !seen.has(parentId)) {
            if (parentId === ancestorId) return true
            seen.add(parentId)
            parentId = state.tree.categories.find(c => c.id === parentId)?.parent
        }
        return false
    }

    function clearCategoryPositions(catId) {
        const positions = state.tree.positions || (state.tree.positions = {})
        const cat = state.tree.categories.find(c => c.id === catId)
        if (!cat) return
        delete positions['cat:' + cat.id]
        for (const id of cat.plugins || []) delete positions['plugin:' + id]
        for (const child of state.tree.categories.filter(c => c.parent === cat.id)) {
            clearCategoryPositions(child.id)
        }
    }

    function reparentCategoryTo(catId, targetId) {
        const cat = state.tree.categories.find(c => c.id === catId)
        const target = state.tree.categories.find(c => c.id === targetId)
        if (!cat || !target || cat.id === target.id) return false
        if (categoryHasAncestor(target.id, cat.id)) return false
        cat.parent = target.id
        cat.main = target.main
        clearCategoryPositions(cat.id)
        saveTreeNow()
        renderTree()
        scheduleTreeRefresh()
        return true
    }

    function convertMainToCategory(mainId, targetCatId) {
        const main = state.tree.mains.find(m => m.id === mainId)
        const target = state.tree.categories.find(c => c.id === targetCatId)
        if (!main || !target || target.main === main.id) return false
        const ownCats = state.tree.categories.filter(c => c.main === main.id)
        const topCats = ownCats.filter(c => !c.parent)
        const created = {
            id: treeNewId('cat'),
            label: main.label,
            main: target.main,
            parent: target.id,
            plugins: [...(main.plugins || [])],
            ...(main.locked !== undefined ? { locked: main.locked } : {}),
            ...(main.colorIndex !== undefined ? { colorIndex: main.colorIndex } : {}),
        }
        state.tree.categories.push(created)
        for (const cat of ownCats) cat.main = target.main
        for (const cat of topCats) cat.parent = created.id
        state.tree.mains = state.tree.mains.filter(m => m.id !== main.id)
        const positions = state.tree.positions || (state.tree.positions = {})
        delete positions['main:' + main.id]
        for (const id of main.plugins || []) delete positions['plugin:' + id]
        for (const cat of ownCats) {
            delete positions['cat:' + cat.id]
            for (const id of cat.plugins || []) delete positions['plugin:' + id]
        }
        saveTreeNow()
        renderTree()
        scheduleTreeRefresh()
        return true
    }

    function addPluginToCategory(pluginId, catId) {
        const cat = state.tree.categories.find(c => c.id === catId)
        if (!cat) return
        for (const c of state.tree.categories) c.plugins = (c.plugins || []).filter(x => x !== pluginId)
        for (const main of state.tree.mains) main.plugins = (main.plugins || []).filter(x => x !== pluginId)
        for (const root of state.tree.roots) root.plugins = (root.plugins || []).filter(x => x !== pluginId)
        cat.plugins = cat.plugins || []
        cat.plugins.push(pluginId)
        delete state.tree.positions['plugin:' + pluginId]
        saveTreeNow()
        renderTree()
        scheduleTreeRefresh()
    }

    function assignPluginToRoot(pluginId, rootId) {
        const root = state.tree.roots.find(r => r.id === rootId)
        if (!root) return
        for (const cat of state.tree.categories) cat.plugins = (cat.plugins || []).filter(x => x !== pluginId)
        for (const main of state.tree.mains) main.plugins = (main.plugins || []).filter(x => x !== pluginId)
        for (const r of state.tree.roots) r.plugins = (r.plugins || []).filter(x => x !== pluginId)
        root.plugins = root.plugins || []
        root.plugins.push(pluginId)
        delete state.tree.positions['plugin:' + pluginId]
        saveTreeNow()
        renderTree()
        scheduleTreeRefresh()
    }

    function rootIsLocked(rootId) {
        const root = state.tree?.roots?.find(r => r.id === rootId)
        return !!root && root.locked !== false
    }

    function rootBatchLocked(rootId) {
        const root = state.tree?.roots?.find(r => r.id === rootId)
        if (!root) return false
        if (root.locked !== false) return true
        const mainIds = new Set(state.tree.mains.filter(m => m.root === rootId).map(m => m.id))
        return state.tree.mains.some(m => mainIds.has(m.id) && m.locked !== false)
            || state.tree.categories.some(c => mainIds.has(c.main) && c.locked !== false)
    }

    function toggleRootLock(rootId) {
        const root = state.tree?.roots?.find(r => r.id === rootId)
        if (!root) return
        // The root lock is the master switch: if anything below is locked,
        // clicking unlocks the whole trunk; otherwise it locks the whole trunk.
        const unlock = rootBatchLocked(rootId)
        root.locked = !unlock
        const mainIds = new Set(state.tree.mains.filter(m => m.root === rootId).map(m => m.id))
        for (const main of state.tree.mains) {
            if (mainIds.has(main.id)) main.locked = !unlock
        }
        for (const cat of state.tree.categories) {
            if (mainIds.has(cat.main)) cat.locked = !unlock
        }
        saveTreeNow()
        renderTree()
    }

    function mainIsLocked(mainId) {
        return state.tree?.mains?.find(m => m.id === mainId)?.locked !== false
    }

    function categoryIsLocked(catId) {
        return state.tree?.categories?.find(c => c.id === catId)?.locked !== false
    }

    function nodeIsLocked(item) {
        if (!item) return false
        if (item.type === 'root') return rootBatchLocked(item.id)
        if (item.type === 'main') return mainIsLocked(item.id)
        if (item.type === 'category') return categoryIsLocked(item.id)
        if (item.cat) return categoryIsLocked(item.cat)
        if (item.main) return mainIsLocked(item.main)
        return !!item.root && rootIsLocked(item.root)
    }

    function toggleMainLock(mainId) {
        const main = state.tree?.mains?.find(m => m.id === mainId)
        if (!main) return
        const locked = main.locked !== false
        main.locked = !locked
        saveTreeNow()
        renderTree()
    }

    function toggleCategoryLock(catId) {
        const cat = state.tree?.categories?.find(c => c.id === catId)
        if (!cat) return
        const locked = cat.locked !== false
        cat.locked = !locked
        saveTreeNow()
        renderTree()
    }

    function branchRootId(branchItem) {
        if (!branchItem) return null
        if (branchItem.type === 'root') return branchItem.id
        if (branchItem.type === 'main') {
            return state.tree.mains.find(m => m.id === branchItem.id)?.root || null
        }
        if (branchItem.type === 'category') {
            const cat = state.tree.categories.find(c => c.id === branchItem.id)
            const main = cat && state.tree.mains.find(m => m.id === cat.main)
            return main?.root || null
        }
        return null
    }

    function dropPluginOnBranch(pluginId, branchItem) {
        const locked = branchItem.type === 'root'
            ? rootIsLocked(branchItem.id)
            : (branchItem.type === 'main'
                ? mainIsLocked(branchItem.id)
                : (branchItem.type === 'category' && categoryIsLocked(branchItem.id)))
        if (locked) return
        if (branchItem.type === 'root') {
            assignPluginToRoot(pluginId, branchItem.id)
        } else {
            assignPluginToMain(pluginId, branchItem.id)
        }
    }

    function branchObjectFor(item) {
        if (!item || !state.tree) return null
        if (item.type === 'root') return state.tree.roots.find(r => r.id === item.id)
        if (item.type === 'main') return state.tree.mains.find(m => m.id === item.id)
        if (item.type === 'category') return state.tree.categories.find(c => c.id === item.id)
        return null
    }

    function ownBranchColor(obj) {
        return Number.isInteger(obj?.colorIndex) ? obj.colorIndex : -1
    }

    function effectiveBranchColor(item, obj) {
        return ownBranchColor(obj)
    }

    function applyBranchColor(el, obj, item) {
        const index = effectiveBranchColor(item, obj)
        if (BRANCH_COLORS[index]) {
            el.classList.add('has-color')
            el.style.setProperty('--branch-color', BRANCH_COLORS[index])
        }
    }

    function cycleBranchColor(item) {
        if (nodeIsLocked(item)) return
        const obj = branchObjectFor(item)
        if (!obj) return
        const current = Number.isInteger(obj.colorIndex) ? obj.colorIndex : -1
        obj.colorIndex = current < 0 ? 0 : (current + 1) % BRANCH_COLORS.length
        saveTreeNow()
        renderTree()
    }

    function resetBranchColor(item) {
        if (nodeIsLocked(item)) return
        const obj = branchObjectFor(item)
        if (!obj || obj.colorIndex === undefined) return
        delete obj.colorIndex
        saveTreeNow()
        renderTree()
    }

    function bindColorLongPress(el, reset) {
        let timer = null
        let fired = false
        const cancel = () => {
            if (timer) clearTimeout(timer)
            timer = null
        }
        el.addEventListener('contextmenu', ev => ev.preventDefault())
        el.addEventListener('pointerdown', ev => {
            if (ev.button !== 0) return
            fired = false
            cancel()
            timer = setTimeout(() => {
                timer = null
                fired = true
                reset()
            }, 600)
        })
        el.addEventListener('pointerup', cancel)
        el.addEventListener('pointercancel', cancel)
        el.addEventListener('pointerleave', cancel)
        el.addEventListener('click', ev => {
            if (!fired) return
            fired = false
            ev.preventDefault()
            ev.stopImmediatePropagation()
        }, true)
    }

    function pluginColorIndex(id) {
        const index = state.tree?.pluginColors?.[id]
        return Number.isInteger(index) ? index : -1
    }

    function effectivePluginColor(item) {
        return pluginColorIndex(item.id)
    }

    function applyPluginColor(el, item) {
        const index = effectivePluginColor(item)
        if (BRANCH_COLORS[index]) {
            el.classList.add('has-color')
            el.style.setProperty('--branch-color', BRANCH_COLORS[index])
            return
        }
        // A plugin without its own colour inherits the category colour for the
        // left marker. Fall back to locating the category by membership.
        const catId = item.cat
            || state.tree.categories.find(c => (c.plugins || []).includes(item.id))?.id
        if (catId) {
            const category = state.tree.categories.find(c => c.id === catId)
            const categoryColor = ownBranchColor(category)
            if (BRANCH_COLORS[categoryColor]) {
                el.classList.add('has-category-marker')
                el.style.setProperty('--category-marker-color', BRANCH_COLORS[categoryColor])
                return
            }
        }
        const main = item.main ? state.tree.mains.find(m => m.id === item.main) : null
        const mainColor = ownBranchColor(main)
        if (BRANCH_COLORS[mainColor]) {
            el.classList.add('has-branch-marker')
            el.style.setProperty('--branch-marker-color', BRANCH_COLORS[mainColor])
            return
        }
        if (!item.main && item.root) {
            const root = state.tree.roots.find(r => r.id === item.root)
            const rootColor = ownBranchColor(root)
            if (BRANCH_COLORS[rootColor]) {
                el.classList.add('has-branch-marker')
                el.style.setProperty('--branch-marker-color', BRANCH_COLORS[rootColor])
            }
        }
    }

    function cyclePluginColor(id) {
        if (!state.tree) return
        state.tree.pluginColors = state.tree.pluginColors && typeof state.tree.pluginColors === 'object'
            ? state.tree.pluginColors
            : {}
        const current = pluginColorIndex(id)
        state.tree.pluginColors[id] = current < 0 ? 0 : (current + 1) % BRANCH_COLORS.length
        saveTreeNow()
        renderTree()
    }

    function resetPluginColor(id) {
        if (!state.tree?.pluginColors || state.tree.pluginColors[id] === undefined) return
        delete state.tree.pluginColors[id]
        saveTreeNow()
        renderTree()
    }

    function bindBranchColorTitle(el, item) {
        const title = el.querySelector('.skill-branch-card strong')
        if (!title) return
        title.title = 'Click to change border colour; long press to reset'
        title.addEventListener('click', ev => {
            ev.stopPropagation()
            cycleBranchColor(item)
        })
        bindColorLongPress(title, () => resetBranchColor(item))
    }

    function makeTreeNode(item) {
        const el = document.createElement('div')
        el.className = 'skill-node skill-' + item.type
        el.dataset.key = item.key
        if (item.id) el.dataset.id = item.id
        setNodeXY(el, item.x, item.y)
        el.style.width = item.w + 'px'
        el.style.minHeight = item.h + 'px'
        const menuBtn = `<button type="button" class="skill-branch-menu" title="Branch options">${GLYPH_MENU}</button>`
        const dragGlyph = `<span class="skill-drag-handle" title="Drag">${GLYPH_DRAG}</span>`
        if (item.type === 'root') {
            const rootObj = state.tree.roots.find(r => r.id === item.id) || {}
            applyBranchColor(el, rootObj, item)
            const loaded = loadedForRoot(item.id)
            const locked = rootBatchLocked(item.id)
            const lockBtn = `<button type="button" class="skill-lock ${locked ? 'locked' : 'unlocked'}" title="${locked ? 'Locked: click to unlock this trunk' : 'Unlocked: click to lock this trunk'}" aria-label="${locked ? 'Unlock' : 'Lock'} ${item.label}">${locked ? ICONS.lock : ICONS.unlock}</button>`
            el.classList.toggle('locked', locked)
            el.innerHTML = `<div class="skill-branch-card root"><span class="skill-glow"></span>${dragGlyph}<span class="skill-branch-tools">${lockBtn}${menuBtn}</span><strong>${item.label}</strong><span class="skill-trunk-stat" title="Loaded plugins in this trunk">${loaded} loaded</span></div>`
            el.querySelector('.skill-drag-handle')?.addEventListener('pointerdown', ev => startNodeDrag(ev, item, el, !!ev.shiftKey))
            el.querySelector('.skill-lock')?.addEventListener('click', ev => {
                ev.preventDefault()
                ev.stopPropagation()
                toggleRootLock(item.id)
            })
            bindBranchColorTitle(el, item)
            bindBranchDrop(el, item)
        } else if (item.type === 'main') {
            const loaded = loadedForMain(item.id)
            const hidden = hiddenForMain(item.id)
            const mainObj = state.tree.mains.find(m => m.id === item.id) || { id: item.id, plugins: [] }
            applyBranchColor(el, mainObj, item)
            const sections = mainSections(mainObj)
            const eyeBtn = sections.hidden
                ? `<button type="button" class="skill-branch-visibility" title="${sections.show ? 'Hide' : 'Show'} ${sections.hidden} hidden">${sections.show ? ICONS.eyeOff : ICONS.eye}</button>`
                : ''
            if (eyeBtn) el.classList.add('has-visibility')
            const mainLocked = mainObj.locked !== false
            const lockBtn = `<button type="button" class="skill-lock ${mainLocked ? 'locked' : 'unlocked'}" title="${mainLocked ? 'Locked: click to unlock this branch' : 'Unlocked: click to lock this branch'}" aria-label="${mainLocked ? 'Unlock' : 'Lock'} ${item.label}">${mainLocked ? ICONS.lock : ICONS.unlock}</button>`
            el.classList.toggle('locked', mainLocked)
            el.innerHTML = `<div class="skill-branch-card main"><span class="skill-glow"></span>${dragGlyph}<span class="skill-branch-tools">${lockBtn}${eyeBtn}${menuBtn}</span><strong>${item.label}</strong><small>${loaded} loaded${hidden ? ` | ${hidden} hidden` : ''}</small></div>`
            el.querySelector('.skill-drag-handle')?.addEventListener('pointerdown', ev => startNodeDrag(ev, item, el, !!ev.shiftKey))
            el.querySelector('.skill-lock')?.addEventListener('click', ev => {
                ev.preventDefault()
                ev.stopPropagation()
                toggleMainLock(item.id)
            })
            const eye = el.querySelector('.skill-branch-visibility')
            if (eye) {
                eye.style.setProperty('color', 'var(--active-text, #ff9800)', 'important')
                const svg = eye.querySelector('svg')
                if (svg) svg.style.setProperty('color', 'var(--active-text, #ff9800)', 'important')
                eye.addEventListener('click', ev => {
                    ev.stopPropagation()
                    toggleMainUnloaded(item.id)
                })
            }
            bindBranchColorTitle(el, item)
            bindBranchDrop(el, item)
        } else {
            const cat = state.tree.categories.find(c => c.id === item.id) || { id: item.id, plugins: [] }
            applyBranchColor(el, cat, item)
            const sections = categorySections(cat)
            const eyeBtn = sections.hidden
                ? `<button type="button" class="skill-branch-visibility" title="${sections.show ? 'Hide' : 'Show'} ${sections.hidden} hidden">${sections.show ? ICONS.eyeOff : ICONS.eye}</button>`
                : ''
            const loaded = loadedForCategory(cat)
            const countText = sections.show
                ? `${loaded} loaded | ${sections.unloaded.length} hidden`
                : `${loaded} loaded${sections.hidden ? ` | ${sections.hidden} hidden` : ''}`
            if (eyeBtn) el.classList.add('has-visibility')
            const catLocked = cat.locked !== false
            const lockBtn = `<button type="button" class="skill-lock ${catLocked ? 'locked' : 'unlocked'}" title="${catLocked ? 'Locked: click to unlock this category' : 'Unlocked: click to lock this category'}" aria-label="${catLocked ? 'Unlock' : 'Lock'} ${item.label}">${catLocked ? ICONS.lock : ICONS.unlock}</button>`
            el.classList.toggle('locked', catLocked)
            el.innerHTML = `<div class="skill-branch-card category"><span class="skill-glow"></span>${dragGlyph}<span class="skill-branch-tools">${lockBtn}${eyeBtn}${menuBtn}</span><strong>${item.label}</strong><small>${countText}</small></div>`
            el.dataset.category = item.id
            el.querySelector('.skill-drag-handle')?.addEventListener('pointerdown', ev => startNodeDrag(ev, item, el, !!ev.shiftKey))
            bindBranchColorTitle(el, item)
            el.querySelector('.skill-lock')?.addEventListener('click', ev => {
                ev.preventDefault()
                ev.stopPropagation()
                toggleCategoryLock(item.id)
            })
            const eye = el.querySelector('.skill-branch-visibility')
            if (eye) {
                eye.style.setProperty('color', 'var(--active-text, #ff9800)', 'important')
                const svg = eye.querySelector('svg')
                if (svg) svg.style.setProperty('color', 'var(--active-text, #ff9800)', 'important')
                eye.addEventListener('click', ev => {
                    ev.stopPropagation()
                    toggleCategoryUnloaded(item.id)
                })
            }
            el.addEventListener('dragover', ev => { ev.preventDefault(); el.classList.add('drop-target') })
            el.addEventListener('dragleave', () => el.classList.remove('drop-target'))
            el.addEventListener('drop', ev => {
                ev.preventDefault()
                el.classList.remove('drop-target')
                const id = ev.dataTransfer?.getData('text/plain')
                if (id) addPluginToCategory(id, item.id)
            })
        }
        el.querySelector('.skill-branch-menu')?.addEventListener('click', ev => {
            ev.stopPropagation()
            showBranchMenu(item, ev.currentTarget)
        })
        return el
    }

    function inlineNode(id) {
        return [...(state.skillPanel?.querySelectorAll('.skill-node[data-id]') || [])]
            .find(n => n.dataset.id === id)
    }

    function createInlineDescription(id, text, node) {
        const el = document.createElement('div')
        el.className = 'skill-inline-panel skill-inline-desc'
        el.dataset.for = id
        const head = document.createElement('div')
        head.className = 'skill-inline-head'
        const title = document.createElement('strong')
        title.textContent = 'Description | ' + id
        const close = document.createElement('button')
        close.type = 'button'
        close.textContent = '\u00d7'
        close.title = 'Close description'
        head.append(title, close)
        const body = document.createElement('div')
        body.className = 'skill-inline-body'
        body.textContent = text
        el.append(head, body)
        close.addEventListener('click', ev => {
            ev.stopPropagation()
            state.descPanels.delete(id)
            el.remove()
            renderTree()
        })
        el.addEventListener('pointerdown', ev => ev.stopPropagation())
        el.addEventListener('wheel', ev => ev.stopPropagation(), { passive: true })
        node.appendChild(el)
        el.style.height = 'auto'
        const h = Math.min(220, Math.max(60, el.offsetHeight))
        el.style.height = h + 'px'
        state.descPanels.set(id, { el, body, height: h })
        renderTree()
    }

    function toggleInlineDescription(id, text) {
        const existing = state.descPanels.get(id)
        if (existing) {
            state.descPanels.delete(id)
            existing.el.remove()
            renderTree()
            return
        }
        const node = inlineNode(id)
        if (!node) return
        createInlineDescription(id, text, node)
    }

    function queueUiSave() {
        state.ui.openSettings = [...state.settingsPanels.keys()]
        state.ui.settingsHeights = state.ui.settingsHeights || {}
        state.ui.expandedHidden = [...state.treeShowUnloaded]
        if (state.uiSaveTimer) clearTimeout(state.uiSaveTimer)
        state.uiSaveTimer = setTimeout(() => {
            state.uiSaveTimer = null
            rest('pluginsOptimizer_saveUiState', { ui: state.ui }).catch(() => {})
        }, 200)
    }

    async function loadUiState() {
        if (state.uiLoaded) return
        try {
            const r = await rest('pluginsOptimizer_uiState')
            const ui = r?.ui || {}
            state.ui.openSettings = Array.isArray(ui.openSettings) ? ui.openSettings.filter(id => typeof id === 'string') : []
            state.ui.settingsHeights = ui.settingsHeights && typeof ui.settingsHeights === 'object' ? ui.settingsHeights : {}
            state.ui.expandedHidden = Array.isArray(ui.expandedHidden) ? ui.expandedHidden.filter(key => typeof key === 'string') : []
        } catch {
            state.ui.openSettings = []
            state.ui.settingsHeights = {}
            state.ui.expandedHidden = []
        }
        state.uiLoaded = true
        state.treeShowUnloaded.clear()
        for (const key of state.ui.expandedHidden) {
            if (key.startsWith('main:')) {
                const id = key.slice(5)
                if (state.tree?.mains?.some(m => m.id === id)) state.treeShowUnloaded.add(key)
            } else if (key.startsWith('cat:')) {
                const id = key.slice(4)
                if (state.tree?.categories?.some(c => c.id === id)) state.treeShowUnloaded.add(id)
            } else if (state.tree?.categories?.some(c => c.id === key)) {
                state.treeShowUnloaded.add(key)
            }
        }
        renderTree()
        restoreOpenSettings()
    }

    function restoreOpenSettings() {
        if (state.uiRestored || !state.uiLoaded) return
        state.uiRestored = true
        for (const id of state.ui.openSettings) {
            if (state.settingsPanels.has(id)) continue
            if (!state.installed.has(id)) continue
            openTreeSettings(id)
        }
    }

    function updatePluginOutputPosition() {
        if (!state.outputEl || !state.outputId) return
        const d = state.descPanels.get(state.outputId)
        const s = state.settingsPanels.get(state.outputId)
        let top = 52
        if (d) top += d.height
        if (s) top += s.height
        state.outputEl.style.top = (top + 6) + 'px'
    }

    const OUTPUT_OPEN_KEY = 'pluginsOptimizer.outputOpen.v1'

    function readPersistedOutput() {
        try { return localStorage.getItem(OUTPUT_OPEN_KEY) || '' } catch { return '' }
    }

    function persistOutput(id) {
        try {
            if (id) localStorage.setItem(OUTPUT_OPEN_KEY, id)
            else localStorage.removeItem(OUTPUT_OPEN_KEY)
        } catch {}
    }

    function closePluginOutput(clearPersisted = false) {
        if (state.outputTimer) clearInterval(state.outputTimer)
        state.outputTimer = null
        state.outputEl?.closest('.skill-node')?.classList.remove('output-open')
        state.outputEl?.remove()
        state.outputEl = null
        state.outputId = null
        if (clearPersisted) persistOutput('')
    }

    function ensurePersistedOutput() {
        const persisted = readPersistedOutput()
        if (!persisted) return
        if (state.outputId === persisted && state.outputEl?.isConnected) return
        if (state.outputEl && state.outputId !== persisted) closePluginOutput(false)
        togglePluginOutput(persisted)
    }

    async function refreshPluginOutput() {
        const pop = state.outputEl
        const id = state.outputId
        if (!pop || !id || !pop.isConnected) return
        const log = pop.querySelector('.skill-output-log')
        try {
            const data = await apiCall('get_plugin_log', { id }, { timeout: 15000 })
            if (!state.outputEl || state.outputId !== id) return
            const list = Array.isArray(data?.list) ? data.list : []
            const text = list.map(line => {
                if (typeof line === 'string') return line
                const ts = line?.ts ? new Date(line.ts).toLocaleTimeString() : ''
                const level = line?.type || line?.level || ''
                const msg = line?.msg ?? line?.message ?? line?.text ?? JSON.stringify(line)
                return [ts, level, msg].filter(Boolean).join(' ')
            }).join('\n')
            log.textContent = text || 'No output yet.'
            const count = pop.querySelector('.skill-output-count')
            if (count) count.textContent = list.length ? ` (${list.length})` : ''
        } catch (e) {
            if (state.outputEl === pop) log.textContent = 'Could not load output: ' + (e.message || 'unknown error')
        }
    }

    function togglePluginOutput(id) {
        if (state.outputId === id && state.outputEl?.isConnected) {
            closePluginOutput(true)
            return
        }
        closePluginOutput(false)
        const node = [...(state.skillPanel?.querySelectorAll('.skill-node') || [])]
            .find(el => el.dataset.id === id)
        if (!node) return
        const pop = document.createElement('div')
        pop.className = 'skill-output-pop'
        const head = document.createElement('div')
        head.className = 'skill-output-head'
        const title = document.createElement('span')
        title.className = 'skill-output-title'
        title.textContent = 'Plugin output ' + pluginDisplayName(id)
        const count = document.createElement('small')
        count.className = 'skill-output-count'
        title.appendChild(count)
        const refresh = document.createElement('button')
        refresh.type = 'button'
        refresh.className = 'skill-output-refresh'
        refresh.innerHTML = treeIcon('refresh', 12)
        refresh.title = 'Refresh output'
        refresh.addEventListener('click', ev => { ev.stopPropagation(); refreshPluginOutput() })
        const close = document.createElement('button')
        close.type = 'button'
        close.className = 'skill-output-close'
        close.textContent = '×'
        close.title = 'Close output'
        close.addEventListener('click', ev => { ev.stopPropagation(); closePluginOutput(true) })
        head.append(title, refresh, close)
        const log = document.createElement('pre')
        log.className = 'skill-output-log'
        log.textContent = 'Loading...'
        pop.append(head, log)
        pop.addEventListener('click', ev => ev.stopPropagation())
        node.classList.add('output-open')
        node.appendChild(pop)
        const surface = getComputedStyle(pop).backgroundColor
        head.style.setProperty('background-color', surface, 'important')
        log.style.setProperty('background-color', surface, 'important')
        state.outputId = id
        state.outputEl = pop
        persistOutput(id)
        updatePluginOutputPosition()
        applyInlinePanelAccent(id)
        refreshPluginOutput()
        state.outputTimer = setInterval(refreshPluginOutput, 2500)
    }

    function closeInlineSettings(id) {
        const panel = state.settingsPanels.get(id)
        if (!panel) return
        state.settingsPanels.delete(id)
        try { panel.fitObserver?.disconnect() } catch {}
        panel.el.remove()
        renderTree()
        queueUiSave()
    }

    function toggleInlineSettings(id) {
        if (state.settingsPanels.has(id)) closeInlineSettings(id)
        else openTreeSettings(id)
    }

    function createInlineSettings(id, node) {
        const el = document.createElement('div')
        el.className = 'skill-inline-panel skill-inline-settings'
        el.dataset.for = id
        const head = document.createElement('div')
        head.className = 'skill-inline-head'
        const title = document.createElement('strong')
        title.textContent = 'Settings | ' + id
        const save = document.createElement('button')
        save.type = 'button'
        save.className = 'skill-inline-save'
        save.textContent = 'Save'
        save.title = 'Save quick settings'
        save.hidden = true
        save.disabled = true
        const close = document.createElement('button')
        close.type = 'button'
        close.textContent = '\u00d7'
        close.title = 'Close settings'
        head.append(title, save, close)
        const body = document.createElement('div')
        body.className = 'skill-inline-body'
        body.innerHTML = '<div class="skill-settings-loading">Loading...</div>'
        const resizer = document.createElement('div')
        resizer.className = 'skill-inline-resizer'
        resizer.title = 'Drag to resize settings'
        el.append(head, body, resizer)
        const savedHeight = Number(state.ui?.settingsHeights?.[id])
        const initialHeight = Number.isFinite(savedHeight)
            ? Math.max(120, Math.round(savedHeight))
            : 260
        const panel = {
            id, el, head, body, resizer, save, height: initialHeight,
            hasSavedHeight: Number.isFinite(savedHeight),
            fitPending: false,
        }
        el.style.height = panel.height + 'px'
        const fitPanel = () => {
            if (!panel.el.isConnected) return
            const previousHeight = panel.el.style.height
            panel.el.style.height = 'auto'
            const contentHeight = panel.body.scrollHeight
            panel.el.style.height = previousHeight
            const headHeight = panel.head.offsetHeight || 0
            const resizerHeight = panel.resizer?.offsetHeight || 10
            const needed = Math.max(120, Math.ceil(headHeight + resizerHeight + contentHeight + 2))
            if (!panel.hasSavedHeight || needed > panel.height) {
                panel.height = needed
                panel.el.style.height = needed + 'px'
                state.ui.settingsHeights[id] = needed
                queueUiSave()
                updatePluginOutputPosition()
            }

        }
        const scheduleFit = () => {
            if (panel.fitPending) return
            panel.fitPending = true
            requestAnimationFrame(() => {
                panel.fitPending = false
                fitPanel()
            })
        }
        panel.fitObserver = new MutationObserver(scheduleFit)
        panel.fitObserver.observe(body, { childList: true, subtree: true })
        requestAnimationFrame(scheduleFit)
        close.addEventListener('click', ev => {
            ev.stopPropagation()
            closeInlineSettings(id)
        })
        el.addEventListener('pointerdown', ev => ev.stopPropagation())
        el.addEventListener('wheel', ev => ev.stopPropagation(), { passive: true })
        resizer.addEventListener('pointerdown', ev => {
            ev.preventDefault()
            ev.stopPropagation()
            const startY = ev.clientY
            const startH = panel.height
            const move = e => {
                const h = Math.max(120, startH + (e.clientY - startY) / (state.treeZoom || 1))
                panel.height = Math.round(h)
                el.style.height = panel.height + 'px'
            }
            const up = () => {
                window.removeEventListener('pointermove', move)
                window.removeEventListener('pointerup', up)
                panel.hasSavedHeight = true
                state.ui.settingsHeights[id] = panel.height
                queueUiSave()
                renderTree()
            }
            window.addEventListener('pointermove', move)
            window.addEventListener('pointerup', up)
        })
        node.appendChild(el)
        state.settingsPanels.set(id, panel)
        renderTree()
        return panel
    }

    function applyInlinePanelAccent(id) {
        const card = inlineNode(id)?.querySelector('.skill-card')
        if (!card) return
        const style = getComputedStyle(card)
        const color = style.borderLeftColor
        if (!color || color === 'rgba(0, 0, 0, 0)' || color === 'transparent') return
        const width = style.borderLeftWidth || '1px'
        const panels = [
            state.descPanels.get(id)?.el,
            state.settingsPanels.get(id)?.el,
            state.outputId === id ? state.outputEl : null,
        ].filter(Boolean)
        for (const el of panels) {
            el.style.setProperty('border-left-style', 'solid', 'important')
            el.style.setProperty('border-left-width', width, 'important')
            el.style.setProperty('border-left-color', color, 'important')
            const resizer = el.querySelector('.skill-inline-resizer')
            if (resizer) {
                resizer.style.setProperty('--panel-accent', color)
                resizer.style.setProperty('border-bottom-style', 'solid', 'important')
                resizer.style.setProperty('border-bottom-width', '2px', 'important')
                resizer.style.setProperty('border-bottom-color', color, 'important')
            }
        }
    }

    function updateInlinePanelScale() {
        for (const [id, d] of state.descPanels) {
            d.el.style.width = '100%'
            d.el.style.left = '0'
            d.el.style.transform = 'none'
            d.el.style.top = '52px'
        }
        for (const [id, s] of state.settingsPanels) {
            const d = state.descPanels.get(id)
            s.el.style.width = '100%'
            s.el.style.left = '0'
            s.el.style.transform = 'none'
            s.el.style.top = (52 + (d ? d.height : 0)) + 'px'
        }
        updatePluginOutputPosition()
        for (const id of new Set([...state.descPanels.keys(), ...state.settingsPanels.keys()]))
            applyInlinePanelAccent(id)
        if (state.outputId) applyInlinePanelAccent(state.outputId)
    }

    function dockInlinePanels() {
        const panel = state.skillPanel
        if (!panel) return
        for (const [id, d] of state.descPanels) {
            const node = inlineNode(id)
            if (!node) {
                panel.appendChild(d.el)
                d.el.hidden = true
                continue
            }
            if (d.el.parentElement !== node) node.appendChild(d.el)
            d.el.hidden = false
        }
        for (const [id, s] of state.settingsPanels) {
            const node = inlineNode(id)
            if (!node) {
                panel.appendChild(s.el)
                s.el.hidden = true
                continue
            }
            if (s.el.parentElement !== node) node.appendChild(s.el)
            s.el.hidden = false
            s.el.style.height = s.height + 'px'
            node.classList.add('settings-open')
        }
        updateInlinePanelScale()
        applySettingsBranchFocus()
    }

    function applySettingsBranchFocus() {
        const panel = state.skillPanel
        if (!panel) return
        const nodes = [...panel.querySelectorAll('.skill-node')]
        for (const node of nodes) node.classList.remove('settings-focus')
        const focusedIds = [...state.settingsPanels.keys()]
        if (!focusedIds.length) return
        const markKey = key => {
            const node = nodes.find(n => n.dataset.key === key)
            if (node) node.classList.add('settings-focus')
        }
        for (const id of focusedIds) {
            const category = (state.tree?.categories || []).find(cat =>
                (cat.plugins || []).some(pid => samePluginId(pid, id)))
            const main = category
                ? (state.tree?.mains || []).find(m => m.id === category.main)
                : (state.tree?.mains || []).find(m => (m.plugins || []).some(pid => samePluginId(pid, id)))
            const root = main
                ? (state.tree?.roots || []).find(r => r.id === main.root)
                : (state.tree?.roots || []).find(r => (r.plugins || []).some(pid => samePluginId(pid, id)))
            if (root) markKey('root:' + root.id)
            if (main) markKey('main:' + main.id)
            if (category) markKey('cat:' + category.id)
            const categories = state.tree?.categories || []
            const relatedCats = category ? categories.filter(cat => {
                let current = cat
                const seen = new Set()
                while (current?.parent && !seen.has(current.id)) {
                    seen.add(current.id)
                    if (current.parent === category.id) return true
                    current = categories.find(c => c.id === current.parent)
                }
                return false
            }) : []
            const pluginIds = new Set([id])
            if (category) for (const pid of category.plugins || []) pluginIds.add(pid)
            for (const cat of relatedCats) for (const pid of cat.plugins || []) pluginIds.add(pid)
            if (main) for (const pid of main.plugins || []) pluginIds.add(pid)
            if (root && !main) for (const pid of root.plugins || []) pluginIds.add(pid)
            for (const pid of pluginIds) {
                const node = nodes.find(n => n.dataset.key === 'plugin:' + pid)
                if (node) node.classList.add('settings-focus')
            }
            const focusNode = nodes.find(n => n.dataset.key === 'plugin:' + id)
            if (focusNode) focusNode.classList.add('settings-open')
        }
    }

    async function openTreeSettings(id) {
        if (state.settingsPanels.has(id)) return
        const node = inlineNode(id)
        if (!node) return
        const panel = createInlineSettings(id, node)
        queueUiSave()
        const row = state.installed.get(id)
        const canonical = row?.id || id
        const meta = treeMeta(id)
        let description = meta.description || ''
        let version = row?.version ?? null
        let onlineFields = {}

        if (!row) {
            panel.body.textContent = 'Loading plugin.js from the repository...'
            if (meta.repo) {
                try {
                    const online = await rest('pluginsOptimizer_onlinePlugin', { repo: meta.repo, id }, { timeout: 30000 })
                    if (online?.ok && online.plugin) {
                        description = online.plugin.description || description
                        version = online.plugin.version ?? version
                        onlineFields = online.plugin.fields && typeof online.plugin.fields === 'object' ? online.plugin.fields : {}
                        state.descriptions[id] = {
                            id, repo: meta.repo, description, version, updatedAt: Date.now(),
                        }
                        state.descriptions[meta.repo] = state.descriptions[id]
                        await rest('pluginsOptimizer_saveDescriptions', {
                            entries: [{ id, repo: meta.repo, description, version }],
                        }).catch(() => {})
                        renderTree()
                    }
                } catch {}
            }
            if (state.settingsPanels.get(id) !== panel) return
            panel.body.textContent = ''
            const hasOnlineFields = Object.keys(onlineFields).length > 0
            if (hasOnlineFields) {
                const values = {}
                for (const [key, field] of Object.entries(onlineFields)) {
                    if (field?.defaultValue !== undefined) values[key] = field.defaultValue
                }
                renderConfigForm(id, null, onlineFields, values, panel)
                for (const input of panel.body.querySelectorAll('input,select,textarea')) input.disabled = true
                const note = document.createElement('div')
                note.className = 'skill-settings-empty skill-settings-online'
                const head = document.createElement('strong')
                head.textContent = 'Online settings preview (not installed)'
                note.appendChild(head)
                if (description) {
                    const text = document.createElement('p')
                    text.textContent = description
                    note.appendChild(text)
                }
                const repo = document.createElement('small')
                repo.textContent = 'Repo: ' + (meta.repo || 'unknown')
                    + (version != null ? ' | v' + version : '')
                note.appendChild(repo)
                panel.body.insertBefore(note, panel.body.firstChild)
                const install = document.createElement('button')
                install.type = 'button'
                install.className = 'opt-btn opt-primary skill-settings-start'
                install.textContent = meta.repo ? 'Install plugin' : 'No repository metadata'
                install.disabled = !meta.repo
                install.addEventListener('click', async ev => {
                    ev.stopPropagation()
                    if (!meta.repo) return
                    install.disabled = true
                    install.textContent = 'Installing...'
                    await installTreePlugin(id, meta.repo)
                    closeInlineSettings(id)
                    setTimeout(() => openTreeSettings(id), 1200)
                })
                panel.body.appendChild(install)
                return
            }
            const note = document.createElement('div')
            note.className = 'skill-settings-empty skill-settings-online'
            const head = document.createElement('strong')
            head.textContent = description ? 'Online plugin description' : 'Online plugin information unavailable'
            note.appendChild(head)
            if (description) {
                const text = document.createElement('p')
                text.textContent = description
                note.appendChild(text)
            }
            if (meta.repo) {
                const repo = document.createElement('small')
                repo.textContent = 'Repo: ' + meta.repo + (version != null ? ' | v' + version : '')
                note.appendChild(repo)
            }
            const install = document.createElement('button')
            install.type = 'button'
            install.className = 'opt-btn opt-primary skill-settings-start'
            install.textContent = meta.repo ? 'Install plugin' : 'No repository metadata'
            install.disabled = !meta.repo
            install.addEventListener('click', async ev => {
                ev.stopPropagation()
                if (!meta.repo) return
                install.disabled = true
                install.textContent = 'Installing...'
                await installTreePlugin(id, meta.repo)
                closeInlineSettings(id)
                setTimeout(() => openTreeSettings(id), 1200)
            })
            note.appendChild(install)
            panel.body.appendChild(note)
            return
        }

        const fields = row.config && typeof row.config === 'object' ? row.config : {}
        let values = {}
        let fetchError = null
        try {
            const data = await apiCall('get_plugin', { id: canonical })
            values = data?.config || {}
        } catch (e) { fetchError = e }
        if (state.settingsPanels.get(id) !== panel) return
        const hasFields = Object.keys(fields).length > 0
        if (hasFields) {
            renderConfigForm(canonical, row, fields, values, panel)
            const metaBlock = document.createElement('div')
            metaBlock.className = 'skill-settings-meta'
            if (meta.repo) {
                const repo = document.createElement('div')
                repo.className = 'skill-settings-repo'
                repo.textContent = 'Repo: ' + meta.repo
                metaBlock.appendChild(repo)
            }
            if (description) {
                const text = document.createElement('p')
                text.className = 'skill-settings-description'
                text.textContent = description
                metaBlock.appendChild(text)
            }
            if (metaBlock.childNodes.length) panel.body.insertBefore(metaBlock, panel.body.firstChild)
            if (fetchError) {
                const note = document.createElement('div')
                note.className = 'skill-settings-empty'
                note.textContent = 'Could not refresh saved values: ' + (fetchError.message || 'unknown error')
                panel.body.insertBefore(note, panel.body.firstChild)
            }
            return
        }

        if (meta.repo) {
            try {
                const online = await rest('pluginsOptimizer_onlinePlugin', { repo: meta.repo, id: canonical }, { timeout: 30000 })
                if (online?.ok && online.plugin) {
                    description = online.plugin.description || description
                    version = online.plugin.version ?? version
                    onlineFields = online.plugin.fields && typeof online.plugin.fields === 'object' ? online.plugin.fields : {}
                }
            } catch {}
        }

        if (Object.keys(onlineFields).length) {
            Object.assign(fields, onlineFields)
            for (const [key, field] of Object.entries(fields)) {
                if (values[key] === undefined && field?.defaultValue !== undefined) values[key] = field.defaultValue
            }
            renderConfigForm(canonical, row, fields, values, panel)
            const note = document.createElement('div')
            note.className = 'skill-settings-empty skill-settings-online'
            const head = document.createElement('strong')
            head.textContent = row.started
                ? 'Settings loaded from plugin.js'
                : 'Preview loaded from plugin.js (plugin not started)'
            note.appendChild(head)
            if (description) {
                const text = document.createElement('p')
                text.textContent = description
                note.appendChild(text)
            }
            const repo = document.createElement('small')
            repo.textContent = 'Repo: ' + meta.repo + (version != null ? ' | v' + version : '')
            note.appendChild(repo)
            if (!row.started) {
                const start = document.createElement('button')
                start.type = 'button'
                start.className = 'opt-btn opt-primary skill-settings-start'
                start.textContent = 'Start plugin'
                start.addEventListener('click', async ev => {
                    ev.stopPropagation()
                    start.disabled = true
                    await togglePluginPower(canonical, false)
                    closeInlineSettings(id)
                    setTimeout(() => openTreeSettings(id), 1200)
                })
                note.appendChild(start)
            }
            panel.body.insertBefore(note, panel.body.firstChild)
            return
        }

        panel.body.textContent = ''
        const note = document.createElement('div')
        note.className = 'skill-settings-empty skill-settings-online'
        if (!row.started) {
            const head = document.createElement('strong')
            head.textContent = 'Plugin is installed but not loaded'
            note.appendChild(head)
            if (description) {
                const text = document.createElement('p')
                text.textContent = description
                note.appendChild(text)
            }
            const start = document.createElement('button')
            start.type = 'button'
            start.className = 'opt-btn opt-primary skill-settings-start'
            start.textContent = 'Start plugin'
            start.addEventListener('click', async ev => {
                ev.stopPropagation()
                start.disabled = true
                await togglePluginPower(canonical, false)
                closeInlineSettings(id)
                setTimeout(() => openTreeSettings(id), 1200)
            })
            note.appendChild(start)
        } else {
            note.textContent = 'No quick settings were declared by this plugin.'
            if (description) {
                const text = document.createElement('p')
                text.textContent = description
                note.appendChild(text)
            }
        }
        if (state.settingsPanels.get(id) === panel) panel.body.appendChild(note)
    }

    const SIGNAL_KEY = 'pluginsOptimizer.pluginSignals.v1'
    const VERSION_SIGNAL_MS = 3 * 24 * 60 * 60 * 1000
    const CONFIG_SIGNAL_MS = 24 * 60 * 60 * 1000
    let pluginSignalCache = null

    function readPluginSignals() {
        if (pluginSignalCache) return pluginSignalCache
        try { pluginSignalCache = JSON.parse(localStorage.getItem(SIGNAL_KEY) || '{}') || {} }
        catch { pluginSignalCache = {} }
        return pluginSignalCache
    }

    function writePluginSignals(map) {
        pluginSignalCache = map
        try { localStorage.setItem(SIGNAL_KEY, JSON.stringify(map)) } catch {}
    }

    function pluginConfigHash(row) {
        let raw = ''
        try { raw = typeof row?.config === 'string' ? row.config : JSON.stringify(row?.config || {}) } catch { raw = '' }
        let hash = 5381
        for (let i = 0; i < raw.length; i++) hash = ((hash << 5) + hash) ^ raw.charCodeAt(i)
        return (hash >>> 0).toString(36)
    }

    function recordPluginSignals(rows, fileVersions = {}) {
        const map = { ...readPluginSignals() }
        const now = Date.now()
        const seen = new Set()
        for (const row of rows || []) {
            const id = String(row?.id || '').trim()
            if (!id) continue
            seen.add(id)
            const previous = map[id] || {}
            const version = String(fileVersions[id] ?? row.version ?? '')
            const configHash = pluginConfigHash(row)
            if (previous.version && version && previous.version !== version) previous.versionChangedAt = now
            if (previous.configHash && configHash && previous.configHash !== configHash) previous.configChangedAt = now
            previous.version = version
            previous.configHash = configHash
            if (previous.versionChangedAt && now - previous.versionChangedAt > VERSION_SIGNAL_MS) delete previous.versionChangedAt
            if (previous.configChangedAt && now - previous.configChangedAt > CONFIG_SIGNAL_MS) delete previous.configChangedAt
            map[id] = previous
        }
        for (const id of Object.keys(map)) if (!seen.has(id)) delete map[id]
        writePluginSignals(map)
    }

    function getPluginSignalState(id) {
        const signal = readPluginSignals()[id] || {}
        const now = Date.now()
        return {
            version: !!signal.versionChangedAt && now - signal.versionChangedAt <= VERSION_SIGNAL_MS,
            config: !!signal.configChangedAt && now - signal.configChangedAt <= CONFIG_SIGNAL_MS,
        }
    }

    function markPluginConfigChanged(id) {
        if (!id) return
        const map = { ...readPluginSignals() }
        const entry = { ...(map[id] || {}) }
        entry.configChangedAt = Date.now()
        map[id] = entry
        writePluginSignals(map)
    }

    function makePluginNode(item) {
        const { row, repo, hug3o, description: storedDescription } = treeMeta(item.id)
        const installed = !!row
        const running = !!row?.started
        const version = row?.version != null ? row.version : '-'
        const description = storedDescription || (hug3o ? 'Hug3O plugin (not installed)' : '')
        const el = document.createElement('div')
        el.className = 'skill-node skill-plugin' + (installed ? (running ? ' running' : ' stopped') : ' missing') + (hug3o ? ' hug3o' : '') + (row?.error ? ' plugin-error' : '')
        const signal = getPluginSignalState(row?.id || item.id)
        if (signal.version) el.classList.add('version-changed')
        if (signal.config) el.classList.add('config-changed')
        const cat = (state.tree?.categories || []).find(c => (c.plugins || []).some(pid => samePluginId(pid, item.id)))
        const directMain = (state.tree?.mains || []).find(m => (m.plugins || []).some(pid => samePluginId(pid, item.id)))
        if (!running && ((cat && state.treeShowUnloaded.has(cat.id))
            || (directMain && state.treeShowUnloaded.has('main:' + directMain.id))))
            el.classList.add('hidden-expanded')
        el.dataset.key = item.key
        el.dataset.id = item.id
        setNodeXY(el, item.x, item.y)
        el.style.width = item.w + 'px'
        applyPluginColor(el, item)
        const card = document.createElement('div')
        card.className = 'skill-card'
        const power = document.createElement('button')
        power.type = 'button'
        power.className = 'skill-icon power' + (running ? ' on' : '')
        if (installed) {
            power.innerHTML = treeIcon('power', 16)
            power.title = running ? 'Stop ' + item.id : 'Start ' + item.id
            power.addEventListener('click', ev => { ev.stopPropagation(); togglePluginPower(item.id, running) })
        } else {
            power.innerHTML = treeIcon('install', 16)
            power.title = repo ? 'Install ' + item.id : 'No repository for this node'
            power.disabled = !repo
            power.addEventListener('click', ev => { ev.stopPropagation(); installTreePlugin(item.id, repo) })
        }
        const name = document.createElement('span')
        name.className = 'skill-name'
        name.textContent = pluginDisplayName(item.id)
        name.title = 'Right-click to change border colour; long press to reset'
        name.addEventListener('contextmenu', ev => {
            ev.preventDefault()
            ev.stopPropagation()
            cyclePluginColor(item.id)
        })
        bindColorLongPress(name, () => resetPluginColor(item.id))
        const ver = document.createElement('span')
        ver.className = 'skill-ver'
        ver.textContent = 'v' + version
        let errorBadge = null
        if (row?.error) {
            errorBadge = document.createElement('span')
            errorBadge.className = 'skill-plugin-error'
            errorBadge.textContent = '!'
            errorBadge.title = row.error
            errorBadge.addEventListener('click', ev => {
                ev.stopPropagation()
                toast(row.error, 'error', 9000)
            })
        }
        const actions = document.createElement('span')
        actions.className = 'skill-card-actions'
        const starred = treeIsStarred(item.id)
        const star = document.createElement('button')
        star.type = 'button'
        star.className = 'skill-icon star' + (starred ? ' on' : '')
        star.innerHTML = starred ? ICONS.starFilled : ICONS.star
        star.title = starred ? 'Unstar ' + item.id : 'Star ' + item.id + ' (keep in Save default)'
        star.addEventListener('click', ev => { ev.stopPropagation(); toggleStar(item.id) })
        if (installed && pluginHasUpdate(item.id)) {
            const update = document.createElement('button')
            update.type = 'button'
            update.className = 'skill-icon update'
            update.innerHTML = treeIcon('update', 15)
            update.title = 'Update ' + pluginDisplayName(item.id) + ' to the latest version'
            update.addEventListener('click', ev => { ev.stopPropagation(); updateTreePlugin(item.id) })
            actions.appendChild(update)
        }
        actions.appendChild(star)
        const gear = document.createElement('button')
        gear.type = 'button'
        gear.className = 'skill-icon'
        gear.innerHTML = treeIcon('settings', 15)
        gear.title = 'Preview settings'
        gear.addEventListener('click', ev => { ev.stopPropagation(); toggleInlineSettings(item.id) })
        if (installed && !isSelfPlugin(item.id)) {
            const del = document.createElement('button')
            del.type = 'button'
            del.className = 'skill-icon danger'
            del.innerHTML = treeIcon('delete', 15)
            del.title = 'Uninstall ' + item.id
            del.addEventListener('click', ev => { ev.stopPropagation(); uninstallTreePlugin(item.id) })
            actions.appendChild(del)
        }
        if (installed) {
            const output = document.createElement('button')
            output.type = 'button'
            output.className = 'skill-icon output'
            output.innerHTML = treeIcon('output', 15)
            output.title = 'Plugin output'
            output.addEventListener('click', ev => {
                ev.stopPropagation()
                togglePluginOutput(item.id)
            })
            actions.appendChild(output)
        }
        actions.appendChild(gear)
        const grip = document.createElement('span')
        grip.className = 'skill-drag-handle'
        grip.title = item.type === 'plugin'
            ? 'Drag this plugin'
            : 'Drag this node and its plugins (Shift-drag to move unlocked sub-branches too)'
        grip.textContent = GLYPH_DRAG
        grip.addEventListener('pointerdown', ev => startNodeDrag(ev, item, el, !!ev.shiftKey))
        card.append(grip, power, name, ver)
        if (errorBadge) card.append(errorBadge)
        card.append(actions)
        el.appendChild(card)
        return el
    }

    function startNodeDrag(ev, item, el, wholeBranch = false) {
        // Ignore synthetic/programmatic pointer events (for example a MUI ripple
        // triggered by a scripted click) so they cannot move a whole branch.
        if (!ev.isTrusted) return
        if (ev.button !== 0 || ev.target.closest('button')) return
        if (nodeIsLocked(item)) {

            return
        }
        ev.preventDefault()
        ev.stopPropagation()
        const start = { x: ev.clientX, y: ev.clientY }
        const positions = state.tree.positions || (state.tree.positions = {})
        const keys = new Set()
        const seenCategories = new Set()
        const addCategoryTree = cat => {
            if (!cat || seenCategories.has(cat.id) || categoryIsLocked(cat.id)) return
            seenCategories.add(cat.id)
            keys.add('cat:' + cat.id)
            for (const id of cat.plugins || []) keys.add('plugin:' + id)
            for (const child of state.tree.categories.filter(c => c.parent === cat.id)) addCategoryTree(child)
        }
        keys.add(item.key)
        if (item.type !== 'plugin' && !wholeBranch) {
            if (item.type === 'category') {
                const cat = state.tree.categories.find(c => c.id === item.id)
                for (const id of cat?.plugins || []) keys.add('plugin:' + id)
            } else if (item.type === 'main') {
                const main = state.tree.mains.find(m => m.id === item.id)
                for (const id of main?.plugins || []) keys.add('plugin:' + id)
            } else if (item.type === 'root') {
                const root = state.tree.roots.find(r => r.id === item.id)
                for (const id of root?.plugins || []) keys.add('plugin:' + id)
            }
        } else if (item.type === 'category') {
            addCategoryTree(state.tree.categories.find(c => c.id === item.id))
        } else if (item.type === 'main') {
            const main = state.tree.mains.find(m => m.id === item.id)
            for (const id of main?.plugins || []) keys.add('plugin:' + id)
            for (const cat of state.tree.categories.filter(c => c.main === item.id && !c.parent)) addCategoryTree(cat)
        } else if (item.type === 'root') {
            const root = state.tree.roots.find(r => r.id === item.id)
            for (const id of root?.plugins || []) keys.add('plugin:' + id)
            for (const main of state.tree.mains.filter(m => m.root === item.id)) {
                if (mainIsLocked(main.id)) continue
                keys.add('main:' + main.id)
                for (const id of main.plugins || []) keys.add('plugin:' + id)
                for (const cat of state.tree.categories.filter(c => c.main === main.id && !c.parent))
                    addCategoryTree(cat)
            }
        }
        const origins = [...keys].map(key => {
            const current = state.layout[key]
            return current ? { key, x: current.x, y: current.y } : null
        }).filter(Boolean)
        let moved = false
        const move = e => {
            if (state.pinching) return
            if (e.pointerType === 'mouse' && e.buttons !== 1) return
            if (!moved) {
                // A click/tap on the bar must not turn into a tiny drag/reorder.
                const threshold = e.pointerType === 'touch' ? 14 : 6
                if (Math.hypot(e.clientX - start.x, e.clientY - start.y) < threshold) return
                moved = true
                el.classList.add('dragging')
            }
            const dx = (e.clientX - start.x) / state.treeZoom
            const dy = (e.clientY - start.y) / state.treeZoom
            for (const o of origins) {
                positions[o.key] = { x: Math.round(o.x + dx), y: Math.round(o.y + dy) }
            }
            if (item.type === 'plugin') {
                const viewport = state.skillPanel?.querySelector('[data-skill-viewport]')
                if (viewport && e.clientY <= viewport.getBoundingClientRect().bottom) {
                    const near = nearestCategoryAt(e.clientX, e.clientY)
                    const p = positions[item.key]
                    if (near && p) {
                        const world = treeWorldPoint(e.clientX, e.clientY)
                        const siblings = (state.tree.categories.find(c => c.id === near.id)?.plugins || [])
                            .filter(x => x !== item.id)
                        let index = siblings.length
                        if (world) {
                            index = siblings.findIndex(other => {
                                const l = state.layout['plugin:' + other]
                                return l && world.y < l.y + l.h / 2
                            })
                            if (index < 0) index = siblings.length
                        }
                        p.x = near.x
                        p.y = near.y + 56 + index * 56
                    }
                }
            }
            for (const node of nodeEls()) {
                const l = state.layout[node.dataset.key]
                if (!l) continue
                const p = positions[node.dataset.key]
                if (p) { l.x = p.x; l.y = p.y; setNodeXY(node, p.x, p.y) }
            }
            updateConnectors()
        }
        const up = e => {
            window.removeEventListener('pointermove', move)
            window.removeEventListener('pointerup', up)
            window.removeEventListener('pointercancel', cancel)
            if (!moved) {
                el.classList.remove('dragging')
                return
            }
            // Snap every moved node to the visible grid.
            for (const o of origins) {
                const p = positions[o.key]
                if (p) {
                    p.x = Math.round(p.x / GRID_X) * GRID_X
                    p.y = Math.round(p.y / GRID_Y) * GRID_Y
                }
            }
            if (item.type === 'plugin') {
                const under = document.elementFromPoint(e.clientX, e.clientY)
                const cat = under?.closest('.skill-category')
                const tray = under?.closest('.skill-tray')
                const vpRect = state.skillPanel?.querySelector('[data-skill-viewport]')?.getBoundingClientRect()
                const outside = vpRect && (e.clientX < vpRect.left || e.clientX > vpRect.right || e.clientY < vpRect.top || e.clientY > vpRect.bottom)
                if (tray || outside) {
                    removePluginFromTree(item.id)
                } else {
                    const pluginEl = under?.closest('.skill-plugin')
                    const targetId = pluginEl?.dataset.id
                    const target = targetId && targetId !== item.id ? state.layout['plugin:' + targetId] : null
                    if (target) {
                        if (target.cat) reorderPluginInCategory(item.id, target.cat, e.clientY)
                        else if (target.main) reorderPluginInMain(item.id, target.main, e.clientY)
                        else if (target.root) reorderPluginInRoot(item.id, target.root, e.clientY)
                    } else {
                        const branchEl = under?.closest('.skill-main, .skill-root')
                        const catEl = under?.closest('.skill-category')
                        if (branchEl?.dataset.key) {
                            const [type, id] = branchEl.dataset.key.split(':')
                            dropPluginOnBranch(item.id, { type, id })
                        } else {
                            const near = catEl?.dataset.category ? { id: catEl.dataset.category } : nearestCategoryAt(e.clientX, e.clientY)
                            if (near?.id) reorderPluginInCategory(item.id, near.id, e.clientY)
                            else avoidPluginOverlap(item.key)
                        }
                    }
                }
            } else if (item.type === 'category') {
                const under = document.elementFromPoint(e.clientX, e.clientY)
                const target = under?.closest('.skill-category')
                if (!target?.dataset.id || target.dataset.id === item.id
                    || !reparentCategoryTo(item.id, target.dataset.id)) {
                    avoidBranchOverlap(item)
                }
            } else if (item.type === 'main') {
                const under = document.elementFromPoint(e.clientX, e.clientY)
                const target = under?.closest('.skill-category')
                if (!target?.dataset.id || !convertMainToCategory(item.id, target.dataset.id)) {
                    avoidBranchOverlap(item)
                }
            } else {
                avoidBranchOverlap(item)
            }
            el.classList.remove('dragging')
            saveTreeNow()
            renderTree()
            scheduleTreeRefresh(500)
        }
        const cancel = () => {
            window.removeEventListener('pointermove', move)
            window.removeEventListener('pointerup', up)
            window.removeEventListener('pointercancel', cancel)
            el.classList.remove('dragging')
            renderTree()
        }
        window.addEventListener('pointermove', move)
        window.addEventListener('pointerup', up)
        window.addEventListener('pointercancel', cancel)
    }

    function rectsOverlap(a, b, gap = 4) {
        return a.x < b.x + b.w + gap && a.x + a.w + gap > b.x
            && a.y < b.y + b.h + gap && a.y + a.h + gap > b.y
    }

    function groupKeysFor(item) {
        const keys = [item.key]
        if (item.type === 'category') {
            for (const id of state.tree.categories.find(c => c.id === item.id)?.plugins || []) keys.push('plugin:' + id)
        } else if (item.type === 'main') {
            const main = state.tree.mains.find(m => m.id === item.id)
            for (const id of main?.plugins || []) keys.push('plugin:' + id)
            for (const cat of state.tree.categories.filter(c => c.main === item.id)) {
                keys.push('cat:' + cat.id)
                for (const id of cat.plugins || []) keys.push('plugin:' + id)
            }
        } else if (item.type === 'root') {
            const root = state.tree.roots.find(r => r.id === item.id)
            for (const id of root?.plugins || []) keys.push('plugin:' + id)
            for (const main of state.tree.mains.filter(m => m.root === item.id)) {
                keys.push('main:' + main.id)
                for (const id of main.plugins || []) keys.push('plugin:' + id)
                for (const cat of state.tree.categories.filter(c => c.main === main.id)) {
                    keys.push('cat:' + cat.id)
                    for (const id of cat.plugins || []) keys.push('plugin:' + id)
                }
            }
        }
        return keys
    }

    function avoidBranchOverlap(item) {
        const keys = groupKeysFor(item)
        const keySet = new Set(keys)
        const positions = state.tree.positions || (state.tree.positions = {})
        let guard = 0
        while (guard++ < 30) {
            const layout = computeTreeLayout()
            const me = layout[item.key]
            if (!me) return
            const others = Object.values(layout).filter(n => !keySet.has(n.key))
            if (!others.some(n => rectsOverlap(me, n, 8))) return
            for (const key of keys) {
                const node = layout[key]
                if (!node) continue
                positions[key] = { x: node.x, y: node.y + GRID_Y * 2 }
            }
        }
    }

    function avoidPluginOverlap(key) {
        const layout = computeTreeLayout()
        const me = layout[key]
        if (!me) return
        const others = Object.values(layout).filter(n => n.type === 'plugin' && n.key !== key)
        let guard = 0
        while (others.some(o => rectsOverlap(me, o)) && guard++ < 40) {
            me.y += GRID_Y * 2
            state.tree.positions[key] = { x: me.x, y: me.y }
        }
    }

    function treeWorldPoint(clientX, clientY) {
        const viewport = state.skillPanel?.querySelector('[data-skill-viewport]')
        if (!viewport) return null
        const rect = viewport.getBoundingClientRect()
        return {
            x: (clientX - rect.left - state.treePan.x) / state.treeZoom,
            y: (clientY - rect.top - state.treePan.y) / state.treeZoom,
        }
    }

    function nearestCategoryAt(clientX, clientY) {
        if (!state.layout) return null
        const point = treeWorldPoint(clientX, clientY)
        if (!point) return null
        let best = null
        let bestDist = Infinity
        for (const cat of Object.values(state.layout)) {
            if (cat.type !== 'category') continue
            if (point.x < cat.x - 80 || point.x > cat.x + cat.w + 80) continue
            const kids = (state.tree.categories.find(c => c.id === cat.id)?.plugins || [])
                .map(id => state.layout['plugin:' + id]).filter(Boolean)
            const bottom = kids.length ? Math.max(...kids.map(n => n.y + n.h)) : cat.y + 80
            if (point.y < cat.y - 40 || point.y > bottom + 80) continue
            const dist = Math.abs(point.x - (cat.x + cat.w / 2))
            if (dist < bestDist) { bestDist = dist; best = cat }
        }
        return best
    }

    function toggleMainUnloaded(mainId) {
        const key = 'main:' + mainId
        if (state.treeShowUnloaded.has(key)) {
            state.treeShowUnloaded.delete(key)
        } else {
            state.treeShowUnloaded.add(key)
            const main = state.tree.mains.find(m => m.id === mainId)
            for (const id of main?.plugins || []) {
                const row = state.installed.get(id)
                if (row && !row.started) delete state.tree.positions['plugin:' + id]
            }
        }
        renderTree()
        queueUiSave()
    }

    function toggleCategoryUnloaded(catId) {
        if (state.treeShowUnloaded.has(catId)) {
            state.treeShowUnloaded.delete(catId)
        } else {
            state.treeShowUnloaded.add(catId)
            const cat = state.tree.categories.find(c => c.id === catId)
            for (const id of cat?.plugins || []) {
                const row = state.installed.get(id)
                if (row && !row.started) delete state.tree.positions['plugin:' + id]
            }
        }
        renderTree()
        queueUiSave()
    }

    function reorderPluginInCategory(id, catId, clientY) {
        const cat = state.tree.categories.find(c => c.id === catId)
        if (!cat) return
        if (categoryIsLocked(cat.id)) return
        const world = clientY == null ? null : treeWorldPoint(0, clientY)
        for (const c of state.tree.categories) c.plugins = (c.plugins || []).filter(x => x !== id)
        for (const m of state.tree.mains) m.plugins = (m.plugins || []).filter(x => x !== id)
        for (const r of state.tree.roots) r.plugins = (r.plugins || []).filter(x => x !== id)
        const plugins = cat.plugins
        let index = plugins.length
        if (world) {
            index = plugins.findIndex(other => {
                const l = state.layout['plugin:' + other]
                return l && world.y < l.y + l.h / 2
            })
            if (index < 0) index = plugins.length
        }
        plugins.splice(index, 0, id)
        // Magnetic column: clear per-plugin offsets so the branch re-aligns itself.
        for (const other of plugins) delete state.tree.positions['plugin:' + other]
        saveTreeNow()
        renderTree()
        scheduleTreeRefresh()
    }

    function swapMainOrder(mainId, targetId) {
        const main = state.tree.mains.find(m => m.id === mainId)
        const target = state.tree.mains.find(m => m.id === targetId)
        if (!main || !target || main.root !== target.root) return false
        const siblings = state.tree.mains
            .filter(m => m.root === main.root)
            .sort((a, b) => (a.order || 0) - (b.order || 0))
        const a = siblings.findIndex(m => m.id === mainId)
        const b = siblings.findIndex(m => m.id === targetId)
        if (a < 0 || b < 0 || a === b) return false
        ;[siblings[a], siblings[b]] = [siblings[b], siblings[a]]
        siblings.forEach((m, i) => {
            m.order = i
            delete state.tree.positions['main:' + m.id]
        })
        saveTreeNow()
        renderTree()
        scheduleTreeRefresh()
        return true
    }

    function swapCategoryOrder(catId, targetId) {
        const cat = state.tree.categories.find(c => c.id === catId)
        const target = state.tree.categories.find(c => c.id === targetId)
        if (!cat || !target || cat.main !== target.main) return false
        const a = state.tree.categories.indexOf(cat)
        const b = state.tree.categories.indexOf(target)
        if (a < 0 || b < 0 || a === b) return false
        ;[state.tree.categories[a], state.tree.categories[b]] = [state.tree.categories[b], state.tree.categories[a]]
        delete state.tree.positions['cat:' + cat.id]
        delete state.tree.positions['cat:' + target.id]
        saveTreeNow()
        renderTree()
        scheduleTreeRefresh()
        return true
    }

    function reorderCategoryInMain(catId, clientX) {
        const cat = state.tree.categories.find(c => c.id === catId)
        if (!cat) return
        const siblings = state.tree.categories.filter(c => c.main === cat.main)
        if (siblings.length < 2) return
        const others = siblings.filter(c => c.id !== catId)
        let index = others.length
        for (let i = 0; i < others.length; i++) {
            const l = state.layout['cat:' + others[i].id]
            if (!l) continue
            if (clientX < l.x + l.w / 2) { index = i; break }
        }
        const remaining = state.tree.categories.filter(c => c.id !== catId)
        let insertAt = remaining.length
        if (index < others.length) {
            insertAt = remaining.findIndex(c => c.id === others[index].id)
        } else if (others.length) {
            insertAt = remaining.findIndex(c => c.id === others[others.length - 1].id) + 1
        }
        remaining.splice(insertAt, 0, cat)
        state.tree.categories = remaining
        for (const sibling of siblings) delete state.tree.positions['cat:' + sibling.id]
        saveTreeNow()
        renderTree()
        scheduleTreeRefresh()
    }

    function reorderMainInRoot(mainId, clientX, clientY) {
        const main = state.tree.mains.find(m => m.id === mainId)
        if (!main) return
        const siblings = state.tree.mains
            .filter(m => m.root === main.root)
            .sort((a, b) => (a.order || 0) - (b.order || 0))
        if (siblings.length < 2) return
        const others = siblings.filter(m => m.id !== mainId)
        const point = clientY
        let index = others.length
        for (let i = 0; i < others.length; i++) {
            const l = state.layout['main:' + others[i].id]
            if (!l) continue
            const center = l.y + l.h / 2
            if (point < center) { index = i; break }
        }
        const ordered = [...others]
        ordered.splice(index, 0, main)
        ordered.forEach((m, i) => {
            m.order = i
            delete state.tree.positions['main:' + m.id]
        })
        saveTreeNow()
        renderTree()
        scheduleTreeRefresh()
    }

    function reorderPluginInMain(id, mainId, clientY) {
        const main = state.tree.mains.find(m => m.id === mainId)
        if (!main) return
        if (mainIsLocked(main.id)) return
        for (const c of state.tree.categories) c.plugins = (c.plugins || []).filter(x => x !== id)
        for (const m of state.tree.mains) m.plugins = (m.plugins || []).filter(x => x !== id)
        for (const r of state.tree.roots) r.plugins = (r.plugins || []).filter(x => x !== id)
        const world = clientY == null ? null : treeWorldPoint(0, clientY)
        const plugins = main.plugins
        let index = plugins.length
        if (world) {
            index = plugins.findIndex(other => {
                const l = state.layout['plugin:' + other]
                return l && world.y < l.y + l.h / 2
            })
            if (index < 0) index = plugins.length
        }
        plugins.splice(index, 0, id)
        for (const other of plugins) delete state.tree.positions['plugin:' + other]
        saveTreeNow()
        renderTree()
        scheduleTreeRefresh()
    }

    function reorderPluginInRoot(id, rootId, clientY) {
        const root = state.tree.roots.find(r => r.id === rootId)
        if (!root) return
        if (rootIsLocked(root.id)) {

            return
        }
        for (const c of state.tree.categories) c.plugins = (c.plugins || []).filter(x => x !== id)
        for (const m of state.tree.mains) m.plugins = (m.plugins || []).filter(x => x !== id)
        for (const r of state.tree.roots) r.plugins = (r.plugins || []).filter(x => x !== id)
        const world = clientY == null ? null : treeWorldPoint(0, clientY)
        const plugins = root.plugins
        let index = plugins.length
        if (world) {
            index = plugins.findIndex(other => {
                const l = state.layout['plugin:' + other]
                return l && world.y < l.y + l.h / 2
            })
            if (index < 0) index = plugins.length
        }
        plugins.splice(index, 0, id)
        for (const other of plugins) delete state.tree.positions['plugin:' + other]
        saveTreeNow()
        renderTree()
        scheduleTreeRefresh()
    }

    function movePluginToCategory(id, catId) {
        reorderPluginInCategory(id, catId, null)
    }

    function removePluginFromTree(id) {
        for (const cat of state.tree.categories)
            cat.plugins = (cat.plugins || []).filter(x => x !== id)
        for (const main of state.tree.mains)
            main.plugins = (main.plugins || []).filter(x => x !== id)
        for (const root of state.tree.roots)
            root.plugins = (root.plugins || []).filter(x => x !== id)
        delete state.tree.positions['plugin:' + id]
        saveTreeNow()
        scheduleTreeRefresh()
    }

    async function performPowerAction(id, running) {
        try {
            const canonical = state.installed.get(id)?.id || id
            if (running) await apiCall('stop_plugin', { id: canonical })
            else await apiCall('start_plugin', { id: canonical })
            const expectedStarted = !running
            const row = state.installed.get(canonical)
            if (row) row.started = expectedStarted ? new Date().toISOString() : null
            renderTree()
            toast((running ? 'Stopped ' : 'Started ') + canonical)
            await refreshTreeInstalled({ id: canonical, started: expectedStarted })
            scheduleTreeRefresh(900)
        } catch (e) {
            toast('Power action failed: ' + e.message, 'error')
            refreshTreeInstalled().catch(() => {})
        }
    }

    async function performUpdate(canonical) {
        try {
            await apiCall('update_plugin', { id: canonical }, { timeout: 240000 })
            for (const key of [...state.updates]) {
                if (samePluginId(key, canonical)) state.updates.delete(key)
            }
            toast('Updated ' + canonical, undefined, 6000)
            await refreshTreeInstalled()
            scheduleTreeRefresh(900)
        } catch (e) {
            toast('Update failed: ' + e.message, 'error', 9000)
            refreshTreeInstalled().catch(() => {})
        }
    }

    async function updateTreePlugin(id) {
        const canonical = state.installed.get(id)?.id || id
        if (actionRunning || queueEntries().length || readTreeActions().length) {
            queueTreeAction('update', canonical)
            return
        }
        await performUpdate(canonical)
    }

    async function togglePluginPower(id, running) {
        if (actionRunning || queueEntries().length || readTreeActions().length) {
            queueTreeAction(running ? 'stop' : 'start', id)
            return
        }
        await performPowerAction(id, running)
    }

    function openTreeConfirm(text, okLabel, action) {
        const modal = state.skillPanel?.querySelector('[data-skill-confirm]')
        if (!modal) return
        const msg = modal.querySelector('[data-skill-confirm-text]')
        const ok = modal.querySelector('[data-skill-confirm-ok]')
        const box = modal.querySelector('.skill-confirm-box')
        paintConfirmSurface(modal, box || modal)
        if (msg) msg.textContent = text
        if (ok) ok.textContent = okLabel || 'Confirm'
        state.confirmAction = action || null
        modal.hidden = false
    }

    function closeTreeConfirm() {
        const modal = state.skillPanel?.querySelector('[data-skill-confirm]')
        if (modal) modal.hidden = true
        state.confirmAction = null
    }

    function toggleStar(id) {
        if (!state.tree) return
        state.tree.stars = Array.isArray(state.tree.stars) ? state.tree.stars : []
        const canonical = state.installed.get(id)?.id || id
        if (treeIsStarred(canonical)) {
            openTreeConfirm('Remove star from ' + canonical + '? It can then be lost when uninstalled.', 'Remove star', () => {
                state.tree.stars = state.tree.stars.filter(x => !samePluginId(x, canonical))
                saveTreeNow()
                renderTree()
                refreshHiddenVisibility()
                scheduleTreeRefresh(500)
                toast('Removed star: ' + canonical)
            })
            return
        }
        state.tree.stars.push(canonical)
        const meta = treeMeta(canonical)
        if (meta.repo) {
            state.tree.pluginMeta = state.tree.pluginMeta || {}
            state.tree.pluginMeta[canonical] = { repo: meta.repo, hug3o: meta.hug3o }
        }
        saveTreeNow()
        renderTree()
        refreshHiddenVisibility()
        cachePluginDescription(canonical, meta).catch(() => {})
        scheduleTreeRefresh(500)
        toast('Starred: ' + canonical + ' | included in Save default')
    }

    async function performUninstall(canonical) {
        try {
            await apiCall('uninstall_plugin', { id: canonical, deleteConfig: true }, { timeout: 60000 })
            toast('Uninstalled ' + canonical)
            await refreshTreeInstalled({ id: canonical, installed: false })
            scheduleTreeRefresh(900)
        } catch (e) { toast('Uninstall failed: ' + e.message, 'error') }
    }

    async function uninstallTreePlugin(id) {
        const canonical = state.installed.get(id)?.id || id
        if (isSelfPlugin(canonical)) {
            toast('Plugins-Optimizer cannot uninstall itself', 'error', 7000)
            return
        }
        if (!(await uiConfirm('Uninstall ' + canonical + ' and delete its plugin config?', 'Uninstall'))) return
        if (actionRunning || queueEntries().length || readTreeActions().length) {
            queueTreeAction('uninstall', canonical)
            return
        }
        await performUninstall(canonical)
    }

    const PENDING_DOWNLOADS_KEY = 'pluginsOptimizer.pendingDownloads.v1'
    const TREE_ACTIONS_KEY = 'pluginsOptimizer.actionQueue.v1'
    const PENDING_DOWNLOAD_MAX_AGE = 30 * 60 * 1000
    let queueRunning = false
    let actionRunning = false
    let activeDownloadController = null
    const canceledDownloads = new Set()

    function readPendingDownloads() {
        try {
            const raw = JSON.parse(localStorage.getItem(PENDING_DOWNLOADS_KEY) || '{}')
            return raw && typeof raw === 'object' ? raw : {}
        } catch { return {} }
    }

    function writePendingDownloads(value) {
        try { localStorage.setItem(PENDING_DOWNLOADS_KEY, JSON.stringify(value)) } catch {}
    }

    function pendingKey(id) {
        return pluginIdKey(id)
    }

    function readTreeActions() {
        try {
            const raw = JSON.parse(localStorage.getItem(TREE_ACTIONS_KEY) || '[]')
            return Array.isArray(raw) ? raw : []
        } catch { return [] }
    }

    function writeTreeActions(value) {
        try { localStorage.setItem(TREE_ACTIONS_KEY, JSON.stringify(value)) } catch {}
    }

    function queueTreeAction(type, id) {
        const actions = readTreeActions()
        if (!actions.some(item => item.type === type && samePluginId(item.id, id))) {
            actions.push({ type, id, queuedAt: Date.now() })
            writeTreeActions(actions)
        }
        applyQueuedActionFeedback()
        updateSkillSummary()
        toast('Queued ' + type + ' ' + pluginDisplayName(id) + ' (waiting for downloads)', undefined, 6000)
    }

    function applyQueuedActionFeedback() {
        const panel = state.skillPanel
        if (!panel) return
        const actions = readTreeActions()
        for (const node of panel.querySelectorAll('.skill-node.skill-plugin')) {
            node.classList.remove('action-queued-start', 'action-queued-update')
        }
        for (const action of actions) {
            if (action.type !== 'start' && action.type !== 'update') continue
            const node = inlineNode(action.id)
            if (node) node.classList.add(action.type === 'start' ? 'action-queued-start' : 'action-queued-update')
        }
    }

    async function processTreeActions() {
        if (actionRunning || queueEntries().length) return
        const actions = readTreeActions()
        if (!actions.length) return
        const next = actions.shift()
        writeTreeActions(actions)
        actionRunning = true
        updateSkillSummary()
        toast((next.type === 'uninstall' ? 'Uninstalling ' : next.type === 'update' ? 'Updating ' : next.type === 'stop' ? 'Stopping ' : 'Starting ')
            + pluginDisplayName(next.id) + ' (queued)...', undefined, 5000)
        try {
            if (next.type === 'uninstall') await performUninstall(next.id)
            else if (next.type === 'update') await performUpdate(next.id)
            else await performPowerAction(next.id, next.type === 'stop')
        } finally {
            actionRunning = false
            applyQueuedActionFeedback()
            updateSkillSummary()
            if (readTreeActions().length) processTreeActions()
            else processDownloadQueue()
        }
    }

    function treeIdForRepo(repo) {
        if (!repo || !state.tree) return String(repo).split('/').pop()
        const ids = []
        for (const root of state.tree.roots || []) ids.push(...(root.plugins || []))
        for (const main of state.tree.mains || []) ids.push(...(main.plugins || []))
        for (const cat of state.tree.categories || []) ids.push(...(cat.plugins || []))
        const found = ids.find(id => samePluginId(treeMeta(id).repo, repo))
        return found || String(repo).split('/').pop()
    }

    async function loadServerDownloads() {
        let data
        try { data = await rest('pluginsOptimizer_downloads') } catch { return }
        const active = new Set()
        const pending = readPendingDownloads()
        for (const item of data?.downloads || []) {
            const repo = item?.repo
            if (!repo) continue
            active.add(repo)
            const id = treeIdForRepo(repo)
            const key = pendingKey(id)
            const existing = pending[key]
            pending[key] = {
                ...(existing || {}),
                id,
                repo,
                status: 'downloading',
                startedAt: Number(item.startedAt) || existing?.startedAt || Date.now(),
                queuedAt: existing?.queuedAt || Number(item.startedAt) || Date.now(),
                serverOnly: existing ? existing.serverOnly : true,
            }
        }
        for (const [key, record] of Object.entries(pending)) {
            if (record.serverOnly && !active.has(record.repo)) {
                delete pending[key]
                stopDownloadFeedback(record.id)
            }
        }
        state.serverDownloads = active
        writePendingDownloads(pending)
        applyPendingDownloadFeedback()
    }

    function queueEntries() {
        return Object.entries(readPendingDownloads())
            .map(([key, record]) => ({ ...record, key, status: record.status || 'downloading' }))
            .filter(record => record?.id)
            .sort((a, b) => Number(a.queuedAt || a.startedAt || 0) - Number(b.queuedAt || b.startedAt || 0))
    }

    function enqueueDownload(id, repo) {
        const pending = readPendingDownloads()
        const key = pendingKey(id)
        if (pending[key]) return false
        if (Object.keys(pending).length >= 1) return false
        pending[key] = { id, repo, status: 'queued', queuedAt: Date.now() }
        writePendingDownloads(pending)
        return true
    }

    function removePendingDownload(id) {
        const pending = readPendingDownloads()
        delete pending[pendingKey(id)]
        writePendingDownloads(pending)
    }

    function markDownloading(id) {
        const pending = readPendingDownloads()
        const key = pendingKey(id)
        if (!pending[key]) return false
        pending[key].status = 'downloading'
        pending[key].startedAt = Date.now()
        writePendingDownloads(pending)
        return true
    }

    function stopDownloadFeedback(id) {
        const node = inlineNode(id)
        const power = node?.querySelector('.skill-icon.power')
        if (!power) return
        if (power.__optDownloadTimer) clearInterval(power.__optDownloadTimer)
        delete power.__optDownloadTimer
        node.classList.remove('download-active', 'download-queued')
        power.classList.remove('downloading', 'queued')
        power.disabled = false
        if (node.classList.contains('missing')) power.title = 'Install ' + pluginDisplayName(id)
        node.querySelectorAll('.skill-download-progress').forEach(el => el.remove())
    }

    function showQueuedFeedback(id, position) {
        const node = inlineNode(id)
        const power = node?.querySelector('.skill-icon.power')
        if (!power) return
        if (power.__optDownloadTimer) clearInterval(power.__optDownloadTimer)
        delete power.__optDownloadTimer
        node.querySelectorAll('.skill-download-progress').forEach(el => el.remove())
        node.classList.remove('download-active')
        node.classList.add('download-queued')
        power.classList.remove('downloading')
        power.classList.add('queued')
        power.disabled = false
        power.title = 'Cancel queued download of ' + pluginDisplayName(id)
        const label = document.createElement('span')
        label.className = 'skill-download-progress queued'
        label.textContent = 'Queued'
        label.title = 'Queued download position ' + position
        power.insertAdjacentElement('afterend', label)
    }

    function startDownloadFeedback(id, startedAt = Date.now()) {
        const node = inlineNode(id)
        const power = node?.querySelector('.skill-icon.power')
        if (!power) return { done() {} }
        if (power.__optDownloadTimer) clearInterval(power.__optDownloadTimer)
        node.querySelectorAll('.skill-download-progress').forEach(el => el.remove())
        node.classList.remove('download-failed', 'download-queued')
        node.classList.add('download-active')
        power.classList.remove('queued')
        power.classList.add('downloading')
        power.disabled = false
        power.title = 'Cancel download of ' + pluginDisplayName(id)
        const label = document.createElement('span')
        label.className = 'skill-download-progress'
        const started = Number(startedAt) || Date.now()
        const paint = () => {
            const percent = Math.min(95, Math.round((Date.now() - started) / 200))
            label.textContent = '~' + percent + '%'
        }
        paint()
        power.insertAdjacentElement('afterend', label)
        const timer = setInterval(paint, 500)
        power.__optDownloadTimer = timer
        return {
            done(ok) {
                if (power.__optDownloadTimer !== timer) return
                clearInterval(timer)
                delete power.__optDownloadTimer
                node.classList.remove('download-active', 'download-queued')
                power.classList.remove('downloading')
                power.disabled = false
                label.textContent = ok ? '100%' : 'Failed'
                label.classList.toggle('error', !ok)
                if (ok) {
                    node.classList.remove('download-failed')
                } else {
                    node.classList.add('download-failed')
                    setTimeout(() => node.classList.remove('download-failed'), 12000)
                }
                setTimeout(() => label.remove(), 1400)
            },
        }
    }

    function cancelDownload(id) {
        const key = pendingKey(id)
        const entry = queueEntries().find(item => item.key === key)
        if (!entry) return
        canceledDownloads.add(key)
        const wasActive = entry.status === 'downloading'
        removePendingDownload(id)
        if (wasActive) {
            try { activeDownloadController?.abort() } catch {}
        }
        stopDownloadFeedback(id)
        applyPendingDownloadFeedback()
        toast((wasActive ? 'Canceled download: ' : 'Removed from queue: ') + pluginDisplayName(id), undefined, 6000)
        if (!queueEntries().some(item => item.status === 'downloading')) processDownloadQueue()
    }

    function applyPendingDownloadFeedback(announce = false) {
        if (!state.skillPanel) return
        let announced = false
        const pending = readPendingDownloads()
        const entries = queueEntries()
        let queuedPosition = 0
        for (const key of [...canceledDownloads]) {
            const row = state.installed.get(key)
            if (row) {
                canceledDownloads.delete(key)
                toast('Canceled download completed on server; left disabled: ' + pluginDisplayName(row.id), 'error', 8000)
            }
        }
        for (const record of entries) {
            const row = state.installed.get(record.id)
            const serverActive = record.repo && state.serverDownloads.has(record.repo)
            if (row && !row.downloading && !serverActive) {
                delete pending[record.key]
                toast('Download finished: ' + pluginDisplayName(record.id), undefined, 5000)
                stopDownloadFeedback(record.id)
                continue
            }
            if (Date.now() - Number(record.queuedAt || record.startedAt || 0) > PENDING_DOWNLOAD_MAX_AGE) {
                delete pending[record.key]
                stopDownloadFeedback(record.id)
                toast('Download timed out: ' + pluginDisplayName(record.id), 'error', 7000)
                continue
            }
            if (record.status === 'downloading') {
                startDownloadFeedback(record.id, record.startedAt)
                if (announce && !announced) {
                    announced = true
                    const waiting = entries.filter(x => x.status !== 'downloading').length
                    toast('Downloading ' + pluginDisplayName(record.id) + (waiting ? ` (+${waiting} queued)` : '') + '...', undefined, 5000)
                }
            } else {
                queuedPosition += 1
                showQueuedFeedback(record.id, queuedPosition)
            }
        }
        writePendingDownloads(pending)
        updateSkillSummary()
        if (announce && !announced) {
            const first = entries.find(x => x.status !== 'downloading')
            if (first) toast('Queued ' + pluginDisplayName(first.id) + ` (+${entries.length - 1} waiting)`, undefined, 5000)
        }
    }

    function fallbackRepoKey(value) {
        return String(value || '').split('/').pop().toLowerCase()
            .replace(/^hfs-/, '').replace(/-main$/, '').replace(/[^a-z0-9]/g, '')
    }

    function hugoFallbackRepos(repo, id) {
        if (!/Hug3O/i.test(repo)) return []
        const names = []
        for (const source of [repo, id]) {
            const tail = String(source || '').split('/').pop()
            if (!tail) continue
            names.push(tail, tail.replace(/-main$/i, ''))
        }
        const expanded = []
        for (const name of names) {
            if (!name) continue
            expanded.push(name)
            if (!/^hfs-/i.test(name)) expanded.push('hfs-' + name)
        }
        const candidates = []
        for (const name of expanded.filter(Boolean)) {
            candidates.push('hugo529100/' + name, 'Hugo29100/' + name)
        }
        return [...new Set(candidates)]
    }

    async function downloadTreePlugin(id, repo, opts = {}) {
        try {
            return await apiCall('download_plugin', { id: repo, branch: 'main', stop: false }, { timeout: 180000, signal: opts.signal })
        } catch (firstError) {
            if (opts.signal?.aborted) throw firstError
            if (firstError?.code === 424) throw firstError
            const fallbacks = hugoFallbackRepos(repo, id)
            if (/Hug3O/i.test(repo)) {
                try {
                    const catalog = await rest('pluginsOptimizer_catalog')
                    const keys = new Set([fallbackRepoKey(repo), fallbackRepoKey(id)].filter(Boolean))
                    const hugo = []
                    const other = []
                    for (const entry of catalog?.entries || []) {
                        const candidate = entry?.repo || entry?.id
                        if (!candidate) continue
                        const candidateKey = fallbackRepoKey(candidate)
                        if (!candidateKey || !keys.has(candidateKey)) continue
                        if (/^(hugo529100|Hugo29100)\//i.test(candidate)) hugo.push(candidate)
                        else other.push(candidate)
                    }
                    fallbacks.push(...hugo, ...other)
                } catch {}
            }
            let lastError = firstError
            for (const fallback of [...new Set(fallbacks)]) {
                if (fallback === repo) continue
                try {
                    return await apiCall('download_plugin', { id: fallback, branch: 'main', stop: false }, { timeout: 180000, signal: opts.signal })
                } catch (e) { lastError = e }
            }
            throw lastError
        }
    }

    async function processDownloadQueue() {
        if (queueRunning || actionRunning) return
        const entries = queueEntries()
        if (entries.some(entry => entry.status === 'downloading')) return
        const next = entries[0]
        if (!next) return
        queueRunning = true
        markDownloading(next.id)
        updateSkillSummary()
        const feedback = startDownloadFeedback(next.id)
        const controller = typeof AbortController !== 'undefined' ? new AbortController() : null
        activeDownloadController = controller
        toast('Downloading ' + pluginDisplayName(next.id) + '...', undefined, 5000)
        try {
            const dl = await downloadTreePlugin(next.id, next.repo, { signal: controller?.signal })
            const installedId = dl?.id || next.id
            removePendingDownload(next.id)
            removePendingDownload(installedId)
            feedback.done(true)
            toast('Downloaded ' + next.id + ' — not enabled', undefined, 6000)
            await refreshTreeInstalled({ id: installedId, started: false })
            const installedRow = state.installed.get(installedId)
            cachePluginDescription(installedId, {
                row: installedRow,
                repo: installedRow?.repo || dl?.repo || next.repo,
                description: installedRow?.description || dl?.description || '',
                version: installedRow?.version ?? dl?.version ?? null,
            }).catch(() => {})
            scheduleTreeRefresh(900)
        } catch (e) {
            if (canceledDownloads.has(pendingKey(next.id))) {
                // The queue entry was already removed by cancelDownload().
            } else if (/already downloading|timeout|abort/i.test(e.message || '')) {
                toast('Still downloading ' + pluginDisplayName(next.id) + '...', undefined, 7000)
            } else {
                removePendingDownload(next.id)
                feedback.done(false)
                toast('Install failed: ' + e.message, 'error', 8000)
            }
        } finally {
            activeDownloadController = null
            queueRunning = false
            applyPendingDownloadFeedback()
            const remaining = queueEntries()
            if (!remaining.some(entry => entry.status === 'downloading') && remaining.length)
                processDownloadQueue()
            else if (!remaining.length)
                processTreeActions()
        }
    }

    function installTreePlugin(id, repo) {
        if (!repo) {
            toast('No repository metadata for ' + id, 'error', 7000)
            return
        }
        const existing = readPendingDownloads()[pendingKey(id)]
        if (existing) {
            cancelDownload(id)
            return
        }
        if (enqueueDownload(id, repo)) {
            const entries = queueEntries()
            const position = entries.findIndex(entry => pendingKey(entry.id) === pendingKey(id)) + 1
            applyPendingDownloadFeedback()
            toast('Queued ' + pluginDisplayName(id) + ` (#${position})`, undefined, 5000)
            processDownloadQueue()
        } else {
            toast('Download queue is full — only one download is allowed at a time', 'error', 7000)
        }
    }

    function showTreeDesc(anchor, text, pinned = false) {
        const el = state.skillPanel?.querySelector('[data-skill-desc]')
        if (!el) return
        const body = el.querySelector('[data-skill-desc-text]')
        if (body) body.textContent = text
        state.descPinned = !!pinned
        el.classList.toggle('pinned', state.descPinned)
        el.hidden = false
        el.style.setProperty('background-color', 'var(--active-bg, #1e1e1e)', 'important')
        el.style.setProperty('color', 'var(--active-text, #eee)', 'important')
        el.style.setProperty('opacity', '1', 'important')
        const r = anchor.getBoundingClientRect()
        const pr = state.skillPanel.getBoundingClientRect()
        el.style.left = Math.min(pr.width - 340, Math.max(8, r.left - pr.left)) + 'px'
        let top = Math.max(6, r.bottom - pr.top + 6)
        el.style.top = top + 'px'
        const h = el.offsetHeight
        if (top + h > pr.height - 6) top = Math.max(6, r.top - pr.top - h - 6)
        el.style.top = top + 'px'
    }

    function closeTreeDesc() {
        state.descPinned = false
        const el = state.skillPanel?.querySelector('[data-skill-desc]')
        if (el) {
            el.hidden = true
            el.classList.remove('pinned')
        }
    }

    function hideTreeDescSoon() {
        if (state.descPinned) return
        setTimeout(() => {
            if (state.descPinned) return
            const el = state.skillPanel?.querySelector('[data-skill-desc]')
            if (el) el.hidden = true
        }, 180)
    }

    function treeNewId(prefix) {
        const used = new Set([
            ...(state.tree.roots || []).map(x => x.id),
            ...(state.tree.mains || []).map(x => x.id),
            ...(state.tree.categories || []).map(x => x.id),
        ])
        let id
        do { id = `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}` }
        while (used.has(id))
        return id
    }

    function setSkillFullscreen(on) {
        const panel = state.skillPanel
        if (!panel) return
        panel.classList.toggle('skill-fullscreen', on)
        document.body.classList.toggle('skill-fullscreen-active', on)
        const btn = panel.querySelector('[data-skill-fullscreen]')
        if (btn) {
            btn.textContent = 'Fullscreen'
            btn.title = on ? 'Exit fullscreen Skill Tree' : 'Enter fullscreen Skill Tree'
            btn.setAttribute('aria-label', on ? 'Exit fullscreen' : 'Fullscreen')
        }
        if (on) setTimeout(() => { fitTree(); applyWorldTransform() }, 50)
    }

    async function refreshSkillTree() {
        const panel = state.skillPanel
        if (!panel) return
        const btn = panel.querySelector('[data-skill-refresh]')
        const wasFullscreen = panel.classList.contains('skill-fullscreen')
        if (btn) {
            btn.disabled = true
            btn.textContent = 'Refreshing...'
        }
        try {
            await loadTree(true)
            await loadTreeUpdates()
            await loadServerDownloads()
            applyPendingDownloadFeedback(true)
            if (wasFullscreen && !panel.classList.contains('skill-fullscreen'))
                setSkillFullscreen(true)
            toast('PluginTree refreshed')
        } catch (e) {
            toast('Refresh failed: ' + (e.message || 'unknown error'), 'error', 9000)
        } finally {
            if (btn) {
                btn.disabled = false
                btn.textContent = 'Refresh'
            }
        }
    }

    async function exitSkillFullscreen() {
        const panel = state.skillPanel
        if (panel && document.fullscreenElement === panel) {
            try { await document.exitFullscreen() } catch {}
        }
        state.nativeFullscreen = false
        setSkillFullscreen(false)
    }

    async function toggleSkillFullscreen() {
        const panel = state.skillPanel
        if (!panel) return
        if (document.fullscreenElement === panel) {
            await exitSkillFullscreen()
            return
        }
        if (panel.classList.contains('skill-fullscreen')) {
            setSkillFullscreen(false)
            return
        }
        try {
            if (panel.requestFullscreen) {
                try {
                    await panel.requestFullscreen({ navigationUI: 'hide' })
                } catch {
                    await panel.requestFullscreen()
                }
                state.nativeFullscreen = true
                setSkillFullscreen(true)
                return
            }
        } catch (e) {
            debugLog('native fullscreen unavailable', e)
        }
        // Fallback for browsers that block element fullscreen (e.g. iOS Safari):
        // fill the whole browser viewport.
        setSkillFullscreen(true)
    }

    function hideBranchMenu() {
        const menu = state.skillPanel?.querySelector('[data-skill-menu]')
        if (menu) menu.hidden = true
    }

    async function restoreLatestTreeLayout() {
        if (!(await uiConfirm('Restore the latest saved layout (Save default or before the last Reset)? This overwrites current storage.', 'Restore'))) return
        try {
            await withTreeLock(async () => {
                const r = await rest('pluginsOptimizer_restoreLatest')
                state.tree = normalizeTree(r.tree)
                writeTreeBackup(state.tree)
                state.treeLoaded = true
                renderTree()
                refreshHiddenVisibility()
                toast('Restored latest saved tree and layout')
            })
        } catch (e) { toast('Restore failed: ' + e.message, 'error') }
    }

    async function restoreTreeBeforeReset() {
        if (!(await uiConfirm('Restore the tree and all layout positions saved before the last Reset? This overwrites current storage.', 'Restore'))) return
        try {
            await withTreeLock(async () => {
                const r = await rest('pluginsOptimizer_restoreBeforeReset')
                state.tree = normalizeTree(r.tree)
                writeTreeBackup(state.tree)
                state.treeLoaded = true
                renderTree()
                refreshHiddenVisibility()
                toast('Restored tree and layout positions from before the last Reset')
            })
        } catch (e) { toast('Restore failed: ' + e.message, 'error') }
    }

    async function restoreLocalTreeSnapshot() {
        const backup = readTreeBackup()
        if (!backup?.tree) { toast('No local tree snapshot found', 'error'); return }
        if (!(await uiConfirm('Restore the last tree snapshot saved by this browser? This overwrites current storage.', 'Restore'))) return
        try {
            await withTreeLock(async () => {
                state.tree = normalizeTree(backup.tree)
                state.tree.updatedAt = Date.now()
                writeTreeBackup(state.tree)
                await rest('pluginsOptimizer_saveTree', { tree: state.tree })
                state.treeLoaded = true
                renderTree()
                refreshHiddenVisibility()
                toast('Restored local browser snapshot')
            })
        } catch (e) { toast('Restore failed: ' + e.message, 'error') }
    }

    function showRestoreMenu(anchor) {
        const menu = state.skillPanel?.querySelector('[data-skill-menu]')
        if (!menu) return
        menu.innerHTML = ''
        const add = (label, fn) => {
            const b = document.createElement('button')
            b.type = 'button'
            b.textContent = label
            b.addEventListener('click', ev => {
                ev.stopPropagation()
                hideBranchMenu()
                fn()
            })
            menu.appendChild(b)
        }
        add('Latest saved layout', restoreLatestTreeLayout)
        add('Layout before last Reset', restoreTreeBeforeReset)
        const local = readTreeBackup()
        if (local?.tree) {
            const stamp = local.savedAt ? new Date(local.savedAt).toLocaleString() : 'local'
            add('Local snapshot | ' + stamp, restoreLocalTreeSnapshot)
        }
        const pr = state.skillPanel.getBoundingClientRect()
        const ar = anchor.getBoundingClientRect()
        menu.hidden = false
        menu.style.left = Math.min(pr.width - 230, Math.max(6, ar.left - pr.left)) + 'px'
        menu.style.top = Math.min(pr.height - 20, ar.bottom - pr.top + 4) + 'px'
    }

    function showBranchMenu(item, anchor) {
        const menu = state.skillPanel?.querySelector('[data-skill-menu]')
        if (!menu) return
        menu.innerHTML = ''
        const add = (label, fn, danger = false) => {
            const b = document.createElement('button')
            b.type = 'button'
            b.textContent = label
            if (danger) b.className = 'danger'
            b.addEventListener('click', ev => {
                ev.stopPropagation()
                hideBranchMenu()
                fn()
            })
            menu.appendChild(b)
        }
        if (item.type === 'root') {
            add('Add branch', () => addTreeMain(item.id))
            add('Rename trunk', () => renameTreeBranch(item))
            add('Delete trunk', () => deleteTreeBranch(item), true)
        } else if (item.type === 'main') {
            add('Add category', () => addTreeCategory(item.id))
            add('Rename branch', () => renameTreeBranch(item))
            add('Delete branch', () => deleteTreeBranch(item), true)
        } else {
            const cat = state.tree.categories.find(c => c.id === item.id)
            if (cat) add('Add subcategory', () => addTreeCategory(cat.main, cat.id))
            if (cat?.parent) add('Move to top level', () => {
                delete cat.parent
                clearCategoryPositions(cat.id)
                saveTreeNow()
                renderTree()
                scheduleTreeRefresh()
            })
            add('Rename category', () => renameTreeBranch(item))
            add('Delete category', () => deleteTreeBranch(item), true)
        }
        const pr = state.skillPanel.getBoundingClientRect()
        const ar = anchor.getBoundingClientRect()
        menu.hidden = false
        menu.style.left = Math.min(pr.width - 180, Math.max(6, ar.left - pr.left)) + 'px'
        menu.style.top = Math.min(pr.height - 20, ar.bottom - pr.top + 4) + 'px'
    }

    async function addTreeTrunk() {
        const label = await uiPrompt('New trunk name', 'New Trunk')
        if (!label || !label.trim()) return
        state.tree.roots.push({ id: treeNewId('trunk'), label: label.trim() })
        saveTreeNow()
        renderTree()
        scheduleTreeRefresh(500)
    }

    async function addTreeMain(rootId) {
        const label = await uiPrompt('New branch name', 'New Branch')
        if (!label || !label.trim()) return
        const orders = (state.tree.mains || []).filter(m => m.root === rootId).map(m => Number(m.order) || 0)
        state.tree.mains.push({
            id: treeNewId('branch'),
            label: label.trim(),
            root: rootId,
            order: (orders.length ? Math.max(...orders) : -1) + 1,
            plugins: [],
        })
        saveTreeNow()
        renderTree()
        scheduleTreeRefresh(500)
    }

    async function addTreeCategory(mainId, parentId = null) {
        const label = await uiPrompt('New category name', 'New Category')
        if (!label || !label.trim()) return
        state.tree.categories.push({
            id: treeNewId('cat'),
            label: label.trim(),
            main: mainId,
            ...(parentId ? { parent: parentId } : {}),
            plugins: [],
        })
        saveTreeNow()
        renderTree()
        scheduleTreeRefresh(500)
    }

    async function renameTreeBranch(item) {
        let node
        if (item.type === 'root') node = state.tree.roots.find(x => x.id === item.id)
        else if (item.type === 'main') node = state.tree.mains.find(x => x.id === item.id)
        else node = state.tree.categories.find(x => x.id === item.id)
        if (!node) return
        const label = await uiPrompt('Rename', node.label || '')
        if (!label || !label.trim()) return
        node.label = label.trim()
        saveTreeNow()
        renderTree()
        scheduleTreeRefresh(500)
    }

    async function deleteTreeBranch(item) {
        if (!(await uiConfirm(`Delete ${item.label || item.id}? Plugins inside will move to Unarranged.`, 'Delete'))) return
        const positions = state.tree.positions || (state.tree.positions = {})
        if (item.type === 'root') {
            const mains = state.tree.mains.filter(m => m.root === item.id)
            const mainIds = new Set(mains.map(m => m.id))
            const cats = state.tree.categories.filter(c => mainIds.has(c.main))
            for (const cat of cats) {
                for (const id of cat.plugins || []) delete positions['plugin:' + id]
                delete positions['cat:' + cat.id]
            }
            for (const main of mains) {
                for (const id of main.plugins || []) delete positions['plugin:' + id]
                delete positions['main:' + main.id]
            }
            const root = state.tree.roots.find(r => r.id === item.id)
            for (const id of root?.plugins || []) delete positions['plugin:' + id]
            delete positions['root:' + item.id]
            state.tree.roots = state.tree.roots.filter(r => r.id !== item.id)
            state.tree.mains = state.tree.mains.filter(m => !mainIds.has(m.id))
            state.tree.categories = state.tree.categories.filter(c => !mainIds.has(c.main))
        } else if (item.type === 'main') {
            const cats = state.tree.categories.filter(c => c.main === item.id)
            for (const cat of cats) {
                for (const id of cat.plugins || []) delete positions['plugin:' + id]
                delete positions['cat:' + cat.id]
            }
            const main = state.tree.mains.find(m => m.id === item.id)
            for (const id of main?.plugins || []) delete positions['plugin:' + id]
            delete positions['main:' + item.id]
            state.tree.mains = state.tree.mains.filter(m => m.id !== item.id)
            state.tree.categories = state.tree.categories.filter(c => c.main !== item.id)
        } else {
            const cat = state.tree.categories.find(c => c.id === item.id)
            for (const id of cat?.plugins || []) delete positions['plugin:' + id]
            delete positions['cat:' + item.id]
            for (const child of state.tree.categories.filter(c => c.parent === item.id)) {
                if (cat?.parent) child.parent = cat.parent
                else delete child.parent
                if (cat?.main) child.main = cat.main
            }
            state.tree.categories = state.tree.categories.filter(c => c.id !== item.id)
        }
        saveTreeNow()
        renderTree()
        scheduleTreeRefresh(500)
    }

    function positionTreeSettings(nodeEl, box) {
        const viewport = state.skillPanel?.querySelector('[data-skill-viewport]')
        if (!viewport) return
        const zoom = state.treeZoom || 1
        const vpRect = viewport.getBoundingClientRect()
        const nodeRect = nodeEl.getBoundingClientRect()
        const below = vpRect.bottom - nodeRect.bottom - 6
        const above = nodeRect.top - vpRect.top - 6
        const openAbove = above > below
        const available = Math.max(80, (openAbove ? above : below) / zoom)
        box.style.maxHeight = Math.min(340, available) + 'px'
        box.style.top = openAbove ? 'auto' : 'calc(100% + 4px)'
        box.style.bottom = openAbove ? 'calc(100% + 4px)' : 'auto'
    }

    function dockSettingsPop() {
        const pop = state.settingsEl
        const panel = state.skillPanel
        if (!pop || !panel || !state.settingsOpenId) return
        const node = [...panel.querySelectorAll('.skill-node')].find(n => n.dataset.id === state.settingsOpenId)
        if (!node) {
            panel.appendChild(pop)
            pop.hidden = true
            pop.classList.remove('inline')
            state.settingsOpenId = null
            return
        }
        if (pop.parentElement !== node) node.appendChild(pop)
        pop.classList.add('inline')
        pop.hidden = false
        node.classList.add('settings-open')
    }

    function closeTreeSettings() {
        const pop = state.settingsEl
        const panel = state.skillPanel
        if (pop) {
            pop.hidden = true
            pop.classList.remove('inline')
            pop.removeAttribute('style')
            if (panel) panel.appendChild(pop)
        }
        state.settingsOpenId = null
        renderTree()
    }

    function positionFloatingSettings(anchorEl) {
        const pop = state.skillPanel?.querySelector('[data-skill-settings-pop]')
        if (!pop || !anchorEl) return
        const ar = anchorEl.getBoundingClientRect()
        const pr = state.skillPanel.getBoundingClientRect()
        const width = Math.min(420, Math.max(260, pr.width - 24))
        pop.style.width = width + 'px'
        let left = ar.right - pr.left + 8
        if (left + width > pr.width - 8) left = Math.max(8, ar.left - pr.left - width - 8)
        pop.style.left = left + 'px'
        pop.style.top = Math.max(8, ar.top - pr.top) + 'px'
        const h = pop.offsetHeight
        if (parseFloat(pop.style.top) + h > pr.height - 8) {
            pop.style.top = Math.max(8, pr.height - h - 8) + 'px'
        }
    }

    function fitInlineSettings() {
        const pop = state.settingsEl
        if (!pop || !pop.classList.contains('inline') || pop.hidden) return
        const h = Math.min(320, Math.max(70, pop.scrollHeight))
        const next = h + 12
        if (Math.abs((state.settingsHeight || 0) - next) > 4) {
            state.settingsHeight = next
            renderTree()
        }
    }

    function configOptions(field) {
        if (!field?.options) return []
        if (Array.isArray(field.options))
            return field.options.map(o => {
                if (o && typeof o === 'object') {
                    const value = String(o.value ?? '')
                    return { value, label: String(o.label ?? o.value ?? value) }
                }
                const value = String(o ?? '')
                return { value, label: value ? value.charAt(0).toUpperCase() + value.slice(1) : '' }
            }).filter(o => o.value !== '')
        return Object.entries(field.options).map(([label, value]) => ({ value: String(value), label }))
    }

    function configFieldVisible(field, values) {
        if (!field?.showIf) return true
        try {
            const fn = new Function('x', 'return (' + field.showIf + ')')
            const expr = fn(values)
            return typeof expr === 'function' ? !!expr(values) : !!expr
        } catch { return true }
    }

    function createArrayEditor(field, list, onChange) {
        const wrap = document.createElement('div')
        wrap.className = 'skill-array-editor'
        const table = document.createElement('div')
        table.className = 'skill-array-table'
        wrap.appendChild(table)
        const fields = field?.fields && typeof field.fields === 'object' ? field.fields : {}
        const keys = Object.keys(fields)
        const cols = keys.filter(key => fields[key]?.type !== 'array')
        const nested = keys.filter(key => fields[key]?.type === 'array')
        const template = `grid-template-columns: repeat(${Math.max(1, cols.length)}, minmax(86px, 1fr)) 26px`
        const makeSwitch = (checked, onchange) => {
            const sw = document.createElement('span')
            sw.className = 'skill-switch'
            const input = document.createElement('input')
            input.type = 'checkbox'
            input.checked = !!checked
            input.addEventListener('change', onchange)
            sw.appendChild(input)
            return sw
        }
        const header = document.createElement('div')
        header.className = 'skill-array-row skill-array-head'
        header.style.gridTemplateColumns = template
        for (const key of cols) {
            const cell = document.createElement('span')
            cell.textContent = fields[key]?.label || key
            cell.title = fields[key]?.label || key
            header.appendChild(cell)
        }
        header.appendChild(document.createElement('span'))
        table.appendChild(header)
        const renderRows = () => {
            table.querySelectorAll('.skill-array-data').forEach(node => node.remove())
            list.forEach((row, index) => {
                if (!row || typeof row !== 'object') row = list[index] = {}
                const rowEl = document.createElement('div')
                rowEl.className = 'skill-array-row skill-array-data'
                rowEl.style.gridTemplateColumns = template
                rowEl.dataset.index = String(index)
                for (const key of cols) {
                    const sub = fields[key] || {}
                    const cell = document.createElement('div')
                    cell.className = 'skill-array-cell'
                    let input
                    if (sub.type === 'boolean') {
                        input = makeSwitch(row[key] ?? sub.defaultValue, () => {
                            row[key] = !!input.checked
                            onChange()
                        })
                    } else if (sub.type === 'number') {
                        input = document.createElement('input')
                        input.type = 'number'
                        if (sub.min != null) input.min = sub.min
                        if (sub.max != null) input.max = sub.max
                        input.value = row[key] ?? sub.defaultValue ?? ''
                        input.addEventListener('input', () => {
                            row[key] = input.value === '' ? undefined : Number(input.value)
                            onChange()
                        })
                    } else if (sub.type === 'select' && sub.options) {
                        input = document.createElement('select')
                        for (const opt of configOptions(sub)) {
                            const o = document.createElement('option')
                            o.value = opt.value
                            o.textContent = opt.label
                            input.appendChild(o)
                        }
                        input.value = String(row[key] ?? sub.defaultValue ?? '')
                        input.addEventListener('change', () => {
                            row[key] = input.value
                            onChange()
                        })
                    } else {
                        input = document.createElement('input')
                        input.type = sub.type === 'password' ? 'password' : 'text'
                        input.value = row[key] ?? sub.defaultValue ?? ''
                        input.addEventListener('input', () => {
                            row[key] = input.value
                            onChange()
                        })
                    }
                    cell.appendChild(input)
                    rowEl.appendChild(cell)
                }
                const remove = document.createElement('button')
                remove.type = 'button'
                remove.className = 'skill-array-remove'
                remove.textContent = '×'
                remove.title = 'Remove this row'
                remove.addEventListener('click', () => {
                    list.splice(index, 1)
                    renderRows()
                    onChange()
                })
                rowEl.appendChild(remove)
                for (const key of nested) {
                    const sub = fields[key] || {}
                    const details = document.createElement('details')
                    details.className = 'skill-array-nested'
                    const summary = document.createElement('summary')
                    const childList = Array.isArray(row[key]) ? row[key] : (row[key] = Array.isArray(sub.defaultValue) ? sub.defaultValue : [])
                    summary.textContent = (sub.label || key) + ` (${childList.length})`
                    details.appendChild(summary)
                    details.appendChild(createArrayEditor(sub, childList, onChange))
                    rowEl.appendChild(details)
                }
                table.appendChild(rowEl)
            })
        }
        renderRows()
        const add = document.createElement('button')
        add.type = 'button'
        add.className = 'skill-array-add'
        add.textContent = '+ Add'
        add.addEventListener('click', () => {
            const row = {}
            for (const key of keys) {
                const sub = fields[key] || {}
                row[key] = sub.type === 'array'
                    ? (Array.isArray(sub.defaultValue) ? structuredClone(sub.defaultValue) : [])
                    : (sub.defaultValue ?? (sub.type === 'boolean' ? false : ''))
            }
            list.push(row)
            renderRows()
            onChange()
        })
        wrap.appendChild(add)
        return wrap
    }

    function arrayRowDefaults(field) {
        const row = {}
        for (const [key, sub] of Object.entries(field?.fields || {})) {
            row[key] = sub?.type === 'array'
                ? (Array.isArray(sub.defaultValue) ? structuredClone(sub.defaultValue) : [])
                : (sub?.defaultValue ?? (sub?.type === 'boolean' ? false : ''))
        }
        return row
    }

    function openArrayRowDialog(field, initial, title, onSave) {
        const overlay = document.createElement('div')
        overlay.className = 'opt-confirm skill-array-dialog'
        const box = document.createElement('div')
        box.className = 'opt-confirm-box skill-array-dialog-box'
        const heading = document.createElement('div')
        heading.className = 'skill-array-dialog-title'
        heading.textContent = title
        const form = document.createElement('div')
        form.className = 'skill-array-dialog-form'
        const draft = initial ? structuredClone(initial) : arrayRowDefaults(field)
        const fields = field?.fields || {}
        for (const [key, sub] of Object.entries(fields)) {
            if (sub?.type === 'array') continue
            const wrap = document.createElement('label')
            wrap.className = 'skill-array-dialog-field'
            const label = document.createElement('span')
            label.textContent = sub?.label || key
            wrap.appendChild(label)
            let input
            if (sub?.type === 'boolean') {
                const sw = document.createElement('span')
                sw.className = 'skill-switch'
                input = document.createElement('input')
                input.type = 'checkbox'
                input.checked = !!draft[key]
                input.addEventListener('change', () => { draft[key] = !!input.checked })
                sw.appendChild(input)
                wrap.appendChild(sw)
            } else if (sub?.type === 'select' && sub.options) {
                input = document.createElement('select')
                for (const opt of configOptions(sub)) {
                    const o = document.createElement('option')
                    o.value = opt.value
                    o.textContent = opt.label
                    input.appendChild(o)
                }
                input.value = String(draft[key] ?? sub.defaultValue ?? '')
                input.addEventListener('change', () => { draft[key] = input.value })
                wrap.appendChild(input)
            } else {
                input = document.createElement('input')
                input.type = sub?.type === 'password' ? 'password' : sub?.type === 'number' ? 'number' : 'text'
                if (sub?.min != null) input.min = sub.min
                if (sub?.max != null) input.max = sub.max
                input.value = draft[key] ?? sub.defaultValue ?? ''
                input.addEventListener('input', () => {
                    draft[key] = sub?.type === 'number'
                        ? (input.value === '' ? undefined : Number(input.value))
                        : input.value
                })
                wrap.appendChild(input)
            }
            form.appendChild(wrap)
        }
        for (const [key, sub] of Object.entries(fields)) {
            if (sub?.type !== 'array') continue
            const nestedWrap = document.createElement('div')
            nestedWrap.className = 'skill-array-dialog-nested'
            const label = document.createElement('div')
            label.className = 'skill-array-dialog-label'
            label.textContent = sub.label || key
            nestedWrap.appendChild(label)
            if (!Array.isArray(draft[key])) draft[key] = []
            nestedWrap.appendChild(createArrayEditorNative(sub, draft[key], () => {}))
            form.appendChild(nestedWrap)
        }
        const actions = document.createElement('div')
        actions.className = 'opt-confirm-actions'
        const cancel = document.createElement('button')
        cancel.type = 'button'
        cancel.className = 'opt-btn'
        cancel.textContent = 'Cancel'
        const save = document.createElement('button')
        save.type = 'button'
        save.className = 'opt-btn opt-primary'
        save.textContent = 'Save'
        cancel.addEventListener('click', () => overlay.remove())
        save.addEventListener('click', () => {
            onSave(draft)
            overlay.remove()
        })
        actions.append(cancel, save)
        box.append(heading, form, actions)
        overlay.appendChild(box)
        document.body.appendChild(overlay)
        let surface = getComputedStyle(box).backgroundColor
        const settingsSurface = state.skillPanel?.querySelector('.skill-inline-settings')
        const panelSurface = settingsSurface ? getComputedStyle(settingsSurface).backgroundColor : ''
        if (!surface || surface === 'rgba(0, 0, 0, 0)' || surface === 'transparent')
            surface = panelSurface
        if (!surface || surface === 'rgba(0, 0, 0, 0)' || surface === 'transparent')
            surface = getComputedStyle(state.skillPanel?.querySelector('.skill-card') || document.body).backgroundColor
        if (surface && surface !== 'rgba(0, 0, 0, 0)' && surface !== 'transparent')
            box.style.setProperty('background-color', surface, 'important')
        requestAnimationFrame(() => form.querySelector('input,select')?.focus())
    }

    function createArrayEditorNative(field, list, onChange) {
        const wrap = document.createElement('div')
        wrap.className = 'skill-array-editor'
        const table = document.createElement('div')
        table.className = 'skill-array-table'
        wrap.appendChild(table)
        const fields = field?.fields && typeof field.fields === 'object' ? field.fields : {}
        const keys = Object.keys(fields)
        const cols = keys.filter(key => fields[key]?.type !== 'array')
        const nested = keys.filter(key => fields[key]?.type === 'array')
        if (cols.length > 4) wrap.classList.add('array-many')
        const template = `grid-template-columns: repeat(${Math.max(1, cols.length)}, minmax(76px, 1fr)) 52px`
        const header = document.createElement('div')
        header.className = 'skill-array-row skill-array-head'
        header.style.gridTemplateColumns = template
        for (const key of cols) {
            const cell = document.createElement('span')
            cell.textContent = fields[key]?.label || key
            cell.title = fields[key]?.label || key
            header.appendChild(cell)
        }
        const addCell = document.createElement('span')
        addCell.className = 'skill-array-head-actions'
        const add = document.createElement('button')
        add.type = 'button'
        add.className = 'skill-array-add-head'
        add.textContent = '+'
        add.title = 'Add'
        add.addEventListener('click', () => {
            openArrayRowDialog(field, null, 'Add', row => {
                list.push(row)
                renderRows()
                onChange()
            })
        })
        addCell.appendChild(add)
        header.appendChild(addCell)
        table.appendChild(header)
        const renderRows = () => {
            table.querySelectorAll('.skill-array-data').forEach(node => node.remove())
            if (!list.length) {
                const empty = document.createElement('div')
                empty.className = 'skill-array-empty skill-array-data'
                empty.textContent = 'No entries'
                table.appendChild(empty)
                return
            }
            list.forEach((row, index) => {
                if (!row || typeof row !== 'object') row = list[index] = {}
                const rowEl = document.createElement('div')
                rowEl.className = 'skill-array-row skill-array-data'
                rowEl.style.gridTemplateColumns = template
                for (const key of cols) {
                    const cell = document.createElement('span')
                    cell.className = 'skill-array-cell'
                    cell.dataset.label = fields[key]?.label || key
                    const sub = fields[key] || {}
                    const value = row[key]
                    if (sub.type === 'boolean') {
                        cell.textContent = value ? '✓' : ''
                        cell.title = value ? 'Enabled' : 'Disabled'
                        cell.className += value ? ' bool-on' : ' bool-off'
                    } else {
                        cell.textContent = value ?? ''
                        cell.title = String(value ?? '')
                    }
                    rowEl.appendChild(cell)
                }
                const actions = document.createElement('span')
                actions.className = 'skill-array-actions'
                const edit = document.createElement('button')
                edit.type = 'button'
                edit.className = 'skill-array-action'
                edit.innerHTML = '<svg viewBox="0 0 24 24" width="13" height="13"><path fill="currentColor" d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>'
                edit.title = 'Modify'
                edit.addEventListener('click', () => {
                    openArrayRowDialog(field, row, 'Modify', updated => {
                        list[index] = updated
                        renderRows()
                        onChange()
                    })
                })
                const remove = document.createElement('button')
                remove.type = 'button'
                remove.className = 'skill-array-action danger'
                remove.innerHTML = '<svg viewBox="0 0 24 24" width="13" height="13"><path fill="currentColor" d="M6 19a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>'
                remove.title = 'Delete'
                remove.addEventListener('click', () => {
                    list.splice(index, 1)
                    renderRows()
                    onChange()
                })
                actions.append(edit, remove)
                rowEl.appendChild(actions)
                for (const key of nested) {
                    const sub = fields[key] || {}
                    const details = document.createElement('details')
                    details.className = 'skill-array-nested'
                    const summary = document.createElement('summary')
                    const childList = Array.isArray(row[key]) ? row[key] : (row[key] = Array.isArray(sub.defaultValue) ? structuredClone(sub.defaultValue) : [])
                    summary.textContent = (sub.label || key) + ` (${childList.length})`
                    details.appendChild(summary)
                    details.appendChild(createArrayEditorNative(sub, childList, onChange))
                    rowEl.appendChild(details)
                }
                table.appendChild(rowEl)
            })
        }
        renderRows()
        return wrap
    }

    function renderConfigForm(id, row, fields, values, panel) {
        const body = panel?.body
        if (!body) return
        body.innerHTML = ''
        const tabKey = Object.keys(fields).find(k => /^config_?tab$/i.test(k)
            || (fields[k]?.type === 'select' && (/configuration category/i.test(fields[k]?.label || '')
                || /select a category to view/i.test(fields[k]?.helperText || ''))))
        const tabField = tabKey ? fields[tabKey] : null
        const tabs = configOptions(tabField || {})
        let activeTab = values.config_tab ?? tabField?.defaultValue ?? tabs[0]?.value ?? ''
        if (tabs.length && !tabs.some(t => t.value === String(activeTab))) activeTab = tabs[0].value
        values.config_tab = activeTab
        if (tabs.length) {
            const block = document.createElement('div')
            block.className = 'skill-settings-tab-block'
            const bar = document.createElement('div')
            bar.className = 'skill-settings-tabs'
            for (const tab of tabs) {
                const b = document.createElement('button')
                b.type = 'button'
                b.setAttribute('role', 'tab')
                b.setAttribute('aria-selected', String(activeTab) === tab.value ? 'true' : 'false')
                b.className = 'skill-settings-tab' + (String(activeTab) === tab.value ? ' active' : '')
                b.textContent = tab.label
                b.addEventListener('click', ev => {
                    ev.stopPropagation()
                    values.config_tab = tab.value
                    renderConfigForm(id, row, fields, values, panel)
                })
                bar.appendChild(b)
            }
            block.appendChild(bar)
            body.appendChild(block)
        }
        const keys = Object.keys(fields).filter(k => k !== tabKey)
        const blocks = []
        for (const key of keys) {
            const f = fields[key] || {}
            const block = document.createElement('div')
            block.className = 'skill-field-block'
            block.dataset.fieldKey = key
            blocks.push(block)
            if (f.type === 'array') {
                const title = document.createElement('div')
                title.className = 'skill-array-title'
                title.textContent = f.label || key
                block.appendChild(title)
                if (f.helperText) {
                    const help = document.createElement('div')
                    help.className = 'skill-field-help'
                    help.textContent = f.helperText
                    block.appendChild(help)
                }
                const list = Array.isArray(values[key])
                    ? values[key]
                    : (values[key] = Array.isArray(f.defaultValue) ? structuredClone(f.defaultValue) : [])
                block.appendChild(createArrayEditorNative(f, list, () => {
                    values[key] = list
                    body.dispatchEvent(new Event('input', { bubbles: true }))
                }))
                body.appendChild(block)
                continue
            }
            const label = document.createElement('label')
            label.className = 'skill-field'
            const span = document.createElement('span')
            span.textContent = f.label || key
            label.appendChild(span)
            let input
            if (f.type === 'boolean') {
                const toggle = document.createElement('span')
                toggle.className = 'skill-switch'
                input = document.createElement('input')
                input.type = 'checkbox'
                input.checked = values[key] ?? !!f.defaultValue
                toggle.append(input)
                label.appendChild(toggle)
            } else if (f.type === 'number') {
                input = document.createElement('input')
                input.type = 'number'
                if (f.min != null) input.min = f.min
                if (f.max != null) input.max = f.max
                input.value = values[key] ?? f.defaultValue ?? ''
                label.appendChild(input)
            } else if (f.type === 'select' && f.options) {
                input = document.createElement('select')
                for (const opt of configOptions(f)) {
                    const o = document.createElement('option')
                    o.value = opt.value
                    o.textContent = opt.label
                    input.appendChild(o)
                }
                input.value = String(values[key] ?? f.defaultValue ?? '')
                label.appendChild(input)
            } else if (f.multiline || f.inputProps?.rows) {
                input = document.createElement('textarea')
                input.rows = Number(f.inputProps?.rows) || 3
                input.value = values[key] ?? f.defaultValue ?? ''
                label.appendChild(input)
            } else {
                input = document.createElement('input')
                input.type = f.type === 'password' ? 'password' : 'text'
                if (f.type === 'vfs_path' || f.type === 'real_path')
                    input.placeholder = 'Server path'
                input.value = values[key] ?? f.defaultValue ?? ''
                label.appendChild(input)
            }
            input.dataset.key = key
            block.appendChild(label)
            if (f.helperText) {
                const help = document.createElement('div')
                help.className = 'skill-field-help'
                help.textContent = f.helperText
                block.appendChild(help)
            }
            body.appendChild(block)
        }
        const empty = document.createElement('div')
        empty.className = 'skill-settings-empty'
        empty.textContent = 'No quick settings'
        body.appendChild(empty)
        const valuesFromInputs = () => {
            for (const input of body.querySelectorAll('[data-key]')) {
                values[input.dataset.key] = input.type === 'checkbox'
                    ? input.checked
                    : input.tagName === 'SELECT' ? input.value
                    : input.type === 'number' ? (input.value === '' ? undefined : Number(input.value))
                    : input.value
            }
            return values
        }
        const updateVisibility = () => {
            valuesFromInputs()
            const visibleBlocks = []
            for (const block of blocks) {
                const key = block.dataset.fieldKey
                const show = configFieldVisible(fields[key], values)
                block.hidden = !show
                if (show) visibleBlocks.push(block)
            }
            for (const block of visibleBlocks) {
                block.classList.toggle('field-sep', block !== visibleBlocks[visibleBlocks.length - 1])
            }
            empty.hidden = !!(visibleBlocks.length || tabs.length)
        }
        updateVisibility()
        const saveBtn = panel?.save
        if (!saveBtn) return
        if (!row || (!blocks.some(block => !block.hidden) && !tabs.length)) {
            saveBtn.hidden = true
            saveBtn.disabled = true
            saveBtn.classList.remove('dirty')
            return
        }
        const readConfig = () => {
            const config = {}
            if (tabKey) config.config_tab = values.config_tab
            for (const [key, field] of Object.entries(fields)) {
                if (field?.type === 'array') config[key] = Array.isArray(values[key]) ? values[key] : []
            }
            for (const input of body.querySelectorAll('[data-key]')) {
                const key = input.dataset.key
                config[key] = input.type === 'checkbox' ? input.checked
                    : input.type === 'number' ? Number(input.value)
                    : input.value
            }
            return config
        }
        const initial = JSON.stringify(readConfig())
        const markDirty = () => {
            const dirty = JSON.stringify(readConfig()) !== initial
            saveBtn.classList.toggle('dirty', dirty)
            saveBtn.disabled = !dirty
        }
        saveBtn.hidden = false
        saveBtn.disabled = true
        saveBtn.classList.remove('dirty')
        const onFieldChange = () => {
            updateVisibility()
            markDirty()
        }
        body.oninput = onFieldChange
        body.onchange = onFieldChange
        saveBtn.onclick = async ev => {
            ev.stopPropagation()
            try {
                await apiCall('set_plugin', { id, config: readConfig() })
                markPluginConfigChanged(id)
                toast('Settings saved: ' + id)
                saveBtn.classList.remove('dirty')
                saveBtn.disabled = true
                scheduleTreeRefresh(500)
            } catch (e) { toast('Save failed: ' + e.message, 'error') }
        }
    }

    async function toggleTreeSettings(id, nodeEl) {
        const pop = state.settingsEl
        if (!pop) return
        // The gear never closes the panel; the explicit close button does.
        if (!pop.hidden && state.settingsOpenId === id && pop.parentElement?.classList.contains('settings-open')) return
        state.settingsOpenId = id
        renderTree()
        const body = state.settingsEl?.querySelector('[data-skill-settings-body]')
        const title = state.settingsEl?.querySelector('[data-skill-settings-title]')
        if (!body || !title) return
        title.textContent = 'Settings | ' + id
        body.innerHTML = '<div class="skill-settings-loading">Loading...</div>'
        const row = state.installed.get(id)
        const fields = row?.config && typeof row.config === 'object' ? row.config : {}
        let values = {}
        let fetchError = null
        if (row) {
            try {
                const data = await apiCall('get_plugin', { id })
                values = data?.config || {}
            } catch (e) {
                fetchError = e
            }
        }
        renderConfigForm(id, row, fields, values, nodeEl)
        if (!row || fetchError) {
            const note = document.createElement('div')
            note.className = 'skill-settings-empty'
            note.textContent = !row
                ? 'Plugin is not installed. Install it to edit settings.'
                : 'Offline preview (plugin is stopped) - values show saved defaults.'
            body.insertBefore(note, body.firstChild)
            fitInlineSettings()
        }
    }

    function renderTray() {
        const panel = state.skillPanel
        if (!panel || !state.tree) return
        const tray = panel.querySelector('[data-skill-tray]')
        const count = panel.querySelector('[data-skill-tray-count]')
        const trayWrap = panel.querySelector('.skill-tray')
        if (!tray) return
        const inTree = treePluginIds()
        const stars = Array.isArray(state.tree.stars) ? state.tree.stars : []
        const inTreeKey = id => inTree.has(id) || inTree.has(pluginMatchKey(id))
        const unlisted = [...state.installed.keys()].filter(id => !inTreeKey(id))
        const starredMissing = stars.filter(id => !state.installed.has(id) && !inTreeKey(id))
        const listed = [...unlisted, ...starredMissing]
        if (count) count.textContent = String(listed.length)
        if (trayWrap) {
            trayWrap.hidden = false
            trayWrap.classList.toggle('empty', listed.length === 0)
        }
        tray.innerHTML = ''
        if (!listed.length) {
            tray.innerHTML = '<span class="skill-tray-empty" title="Drag plugins here to unarrange them.">Drag plugins here</span>'
            return
        }
        for (const id of listed) {
            const row = state.installed.get(id)
            const { repo } = treeMeta(id)
            const starred = treeIsStarred(id)
            const item = document.createElement('span')
            item.className = 'skill-tray-item' + (row ? (row.started ? '' : ' stopped') : ' missing starred')
            item.draggable = true
            item.dataset.id = id
            item.innerHTML = `<strong>${pluginDisplayName(id)}</strong><small>v${row?.version ?? '-'}</small>`
            item.title = row?.description || (starred ? 'Starred missing plugin - install to restore' : 'Drag into a category')
            if (row?.description) {
                item.addEventListener('mouseenter', () => { if (!state.descPinned) showTreeDesc(item, row.description, false) })
                item.addEventListener('mouseleave', hideTreeDescSoon)
                item.addEventListener('click', ev => {
                    if (ev.target.closest('button')) return
                    showTreeDesc(item, row.description, true)
                })
            }
            const star = document.createElement('button')
            star.type = 'button'
            star.className = 'skill-icon star' + (starred ? ' on' : '')
            star.innerHTML = starred ? ICONS.starFilled : ICONS.star
            star.title = starred ? 'Unstar ' + id : 'Star ' + id + ' (keep in Save default)'
            star.addEventListener('click', ev => { ev.stopPropagation(); toggleStar(id) })
            item.appendChild(star)
            if (row && !row.started) {
                const load = document.createElement('button')
                load.type = 'button'
                load.className = 'skill-icon power'
                load.innerHTML = treeIcon('power', 14)
                load.title = 'Load ' + id
                load.addEventListener('click', ev => {
                    ev.stopPropagation()
                    togglePluginPower(id, false)
                })
                item.appendChild(load)
            } else if (!row) {
                const install = document.createElement('button')
                install.type = 'button'
                install.className = 'skill-icon'
                install.innerHTML = treeIcon('install', 14)
                install.title = repo ? 'Reinstall ' + id : 'No repository for ' + id
                install.disabled = !repo
                install.addEventListener('click', ev => {
                    ev.stopPropagation()
                    if (repo) installTreePlugin(id, repo)
                })
                item.appendChild(install)
            }
            item.addEventListener('dragstart', ev => {
                hideTreeDescSoon()
                ev.dataTransfer.setData('text/plain', id)
                ev.dataTransfer.effectAllowed = 'move'
            })
            tray.appendChild(item)
        }
    }

    // ============================================================
    //  CSS
    // ============================================================
    function ensureStyle() {
        if (document.getElementById('optimizer-css')) return
        const style = document.createElement('style')
        style.id = 'optimizer-css'
        style.textContent = `
            .opt-tab { display: inline-flex !important; align-items: center; gap: 6px; }
            .opt-refresh-btn { white-space: nowrap; }
            .opt-tab svg { width: 18px; height: 18px; }
            .opt-toolbar-btn { position: relative !important; width: 28px; height: 28px; padding: 4px; }
            .opt-toolbar-btn.opt-active { color: #ff9800; }
            .opt-footer-btn { position: relative !important; }
            .opt-badge { position: absolute; top: -3px; right: 0; min-width: 13px; height: 13px; padding: 0 3px; border-radius: 7px; background: #ff9800; color: #1a1a1a; font-size: 9px; line-height: 13px; font-weight: 700; text-align: center; }
            .opt-name-cell { position: relative !important; padding-left: 40px !important; }
            .opt-name-cell > .opt-row-hide { position: absolute !important; left: 4px; top: 50%; transform: translateY(-50%); }
            .MuiDataGrid-row .opt-row-hide { color: rgba(160,160,160,.75) !important; opacity: .85; }
            .MuiDataGrid-row .opt-row-hide:hover { color: rgba(210,210,210,.95) !important; opacity: 1; }
            .MuiDataGrid-row .opt-row-hide.opt-restore { color: #ff9800 !important; opacity: 1; }
            .MuiDataGrid-row.opt-row-hidden { display: none !important; }
            .MuiDataGrid-row.opt-row-revealed { opacity: .42; }
            .MuiDataGrid-row.opt-row-revealed:hover { opacity: .8; }
            .opt-panel { flex: 1 1 auto; min-height: 0; overflow: auto; padding: 14px 16px 28px; box-sizing: border-box; font: inherit; }
            .opt-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; margin-bottom: 12px; }
            .opt-title { font-size: 1.15rem; font-weight: 700; }
            .opt-sub { font-size: .78rem; opacity: .72; margin-top: 3px; }
            .opt-head-actions { display: flex; gap: 6px; flex-wrap: wrap; justify-content: flex-end; }
            .opt-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
            .opt-card { border: 1px solid rgba(127,127,127,.32); border-radius: 10px; padding: 12px 14px; background: rgba(127,127,127,.07); min-width: 0; }
            .opt-card h3 { margin: 0 0 10px; font-size: .95rem; font-weight: 600; display: flex; align-items: center; gap: 8px; }
            .opt-wide { grid-column: 1 / -1; }
            .opt-check { display: flex; align-items: center; gap: 8px; font-size: .86rem; margin: 6px 0; cursor: pointer; }
            .opt-check input { accent-color: #ff9800; }
            .opt-master { margin: 0 0 12px; padding: 8px 12px; border: 1px solid rgba(127,127,127,.35); border-radius: 8px; background: rgba(127,127,127,.08); }
            .opt-master .opt-muted { font-size: .72rem; }
            .opt-fields { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px 10px; margin: 8px 0; }
            .opt-fields-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
            .opt-fields label, .opt-wide { font-size: .78rem; opacity: .92; display: flex; flex-direction: column; gap: 3px; }
            .opt-fields input, .opt-card textarea, .opt-row input[type=number] { background: rgba(127,127,127,.12); color: inherit; border: 1px solid rgba(127,127,127,.4); border-radius: 6px; padding: 5px 7px; font: inherit; font-size: .82rem; outline: none; }
            .opt-fields input:focus, .opt-card textarea:focus { border-color: #ff9800; }
            .opt-card textarea { resize: vertical; width: 100%; box-sizing: border-box; }
            .opt-hint { font-size: .73rem; opacity: .62; line-height: 1.35; margin: 7px 0; }
            .opt-hint code { font-size: .72rem; }
            .opt-row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-top: 9px; }
            .opt-stats { font-size: .76rem; opacity: .78; margin-top: 8px; line-height: 1.4; }
            .opt-btn { border: 1px solid rgba(127,127,127,.45); background: rgba(127,127,127,.12); color: inherit; border-radius: 6px; padding: 5px 10px; font: inherit; font-size: .78rem; cursor: pointer; display: inline-flex; align-items: center; gap: 5px; }
            .opt-btn:hover { border-color: #ff9800; }
            .opt-btn:disabled { opacity: .45; cursor: default; }
            .opt-primary { background: #ff9800; border-color: #ff9800; color: #171717; font-weight: 600; }
            .opt-primary:hover { background: #ffad32; }
            .opt-test-result { font-size: .76rem; opacity: .8; }
            .opt-test-result.opt-ok { color: #4caf50; opacity: 1; }
            .opt-test-result.opt-fail { color: #ef5350; opacity: 1; }
            .opt-hidden-list { display: flex; flex-wrap: wrap; gap: 5px; max-height: 120px; overflow: auto; margin: 6px 0; }
            .opt-chip { display: inline-flex; align-items: center; gap: 5px; border: 1px solid rgba(127,127,127,.4); border-radius: 999px; padding: 2px 4px 2px 8px; font-size: .73rem; background: rgba(127,127,127,.1); }
            .opt-chip-x { border: 0; background: transparent; color: inherit; cursor: pointer; font-size: .95rem; line-height: 1; padding: 0 3px; opacity: .7; }
            .opt-chip-x:hover { opacity: 1; color: #ef5350; }
            .opt-count { font-size: .72rem; font-weight: 400; opacity: .65; }
            .opt-muted { opacity: .55; font-size: .76rem; }
            .opt-footer { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; margin-top: 14px; padding-top: 12px; border-top: 1px solid rgba(127,127,127,.25); }
            .opt-save-result { font-size: .76rem; opacity: .75; }
            #optimizer-toast-host { position: fixed; right: 16px; top: 70px; bottom: auto; z-index: 100000; display: flex; flex-direction: column; gap: 8px; pointer-events: none; }
            .opt-toast { pointer-events: auto; background: color-mix(in srgb, var(--active-bg, #1e1e1e) 82%, #000); color: var(--active-text, #eee) !important; border: 1px solid rgba(255,255,255,.14); border-left: 4px solid #ff9800; border-radius: 6px; padding: 9px 13px; font-size: .82rem; box-shadow: 0 6px 20px rgba(0,0,0,.35); max-width: min(460px, 80vw); transition: opacity .2s, transform .2s; }
            .opt-toast-error { border-left-color: #ef5350; }
            @keyframes opt-error-border { 0%, 100% { border-color: rgba(239,83,80,.35); } 50% { border-color: rgba(239,83,80,.95); } }
            .opt-toast-out { opacity: 0; transform: translateY(-6px); }
            .opt-confirm { position: fixed; inset: 0; z-index: 100001; display: flex; align-items: center; justify-content: center; padding: 20px; background: transparent !important; pointer-events: none; }
            .opt-confirm-box { width: min(420px, 92vw); padding: 14px 16px; border: 1px solid var(--active-grid-contrast, rgba(127,127,127,.6)); border-radius: 6px; background: #1e1e1e; color: var(--active-text, #eee) !important; box-shadow: 0 10px 30px rgba(0,0,0,.5); pointer-events: auto; }
            .opt-confirm-text { font-size: .86rem; line-height: 1.45; white-space: pre-wrap; }
            .opt-confirm-input { box-sizing: border-box; width: 100%; margin-top: 10px; padding: 6px 8px; font: inherit; font-size: .82rem; color: var(--active-text, #f0f0f0) !important; background: var(--active-button-bg, #2a2a2a) !important; border: 1px solid var(--active-grid-contrast, rgba(127,127,127,.5)); border-radius: 3px; }
            .opt-confirm-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 14px; }
            /* The optional AdminThemeCustomizer plugin paints every element with
               background/color !important. Keep the Optimizer controls readable. */
            #optimizer-panel .opt-primary { background-color: #ff9900 !important; border-color: #ff9900 !important; color: #171717 !important; }
            #optimizer-panel .opt-primary:hover { background-color: #ffad32 !important; }
            #optimizer-panel .opt-test-result.opt-ok { color: #4caf50 !important; }
            #optimizer-panel .opt-test-result.opt-fail { color: #ef5350 !important; }
            #optimizer-panel .opt-chip-x:hover { color: #ef5350 !important; }
            #optimizer-toast-host .opt-toast { background-color: color-mix(in srgb, var(--active-bg, #1e1e1e) 82%, #000) !important; color: var(--active-text, #eee) !important; border-color: rgba(255,255,255,.14) !important; }
            #optimizer-toast-host .opt-toast-error { border-color: rgba(239,83,80,.95) !important; border-left: 4px solid #ef5350 !important; animation: opt-error-border 1.8s ease-in-out infinite; }
            #optimizer-hide-toggle .opt-badge { background-color: #ff9900 !important; color: #171717 !important; }
            #optimizer-hide-toggle.opt-active { color: #ff9800 !important; }
            .MuiDataGrid-row .opt-row-hide.opt-restore { color: #ff9800 !important; }
            /* Dedicated separator row between the pinned rejetto group and the rest. */
            .MuiDataGrid-row.opt-divider-row { pointer-events: none !important; background: transparent !important; overflow: visible !important; }
            .MuiDataGrid-row.opt-divider-row:hover { background: transparent !important; }
            .MuiDataGrid-row.opt-divider-row::before {
                content: '';
                position: absolute;
                left: 8px;
                right: 8px;
                top: 50%;
                border-top: 1px solid rgba(127,127,127,.5);
                pointer-events: none;
            }
            .MuiDataGrid-row.opt-divider-row .MuiDataGrid-cell { display: none !important; border: 0 !important; }
            .MuiDataGrid-row.opt-divider-row .MuiDataGrid-cell[data-field="id"] {
                display: flex !important;
                width: 100% !important;
                max-width: none !important;
                flex: 1 1 100% !important;
                justify-content: center !important;
                align-items: center !important;
                padding: 0 !important;
            }
            .MuiDataGrid-row.opt-divider-row .opt-divider-label {
                display: inline-block;
                font-size: 16px !important;
                font-weight: 700 !important;
                letter-spacing: .5px;
                border: 1px solid rgba(127,127,127,.8) !important;
                border-radius: 6px;
                padding: 5px 18px !important;
                background-color: var(--active-bg, #121212) !important;
                box-shadow: 0 0 0 3px rgba(127,127,127,.1);
                position: relative;
                z-index: 2;
            }
            /* Skill Tree */
            .opt-skill-tab { order: -1; white-space: nowrap; }
            .opt-skill-tab.Mui-selected { color: var(--active-text, #ff9800) !important; font-weight: 600; }
            .skill-panel, .skill-panel *, .opt-toast {
                box-shadow: none !important;
                text-shadow: none !important;
                backdrop-filter: none !important;
            }
            .skill-panel { position: relative; flex: 1 1 0; width: 100%; max-width: 100%; min-width: 0; min-height: 0; display: flex; flex-direction: column; overflow: hidden; padding: 6px 12px 0; box-sizing: border-box; font-family: inherit; font-size: .86rem; }
            body.skill-fullscreen-active { overflow: hidden !important; }
            .skill-panel.skill-fullscreen,
            .skill-panel:fullscreen { position: fixed !important; inset: 0 !important; z-index: 99999; width: 100vw !important; max-width: 100vw !important; height: 100vh !important; height: 100dvh !important; max-height: 100dvh !important; padding: 6px 12px env(safe-area-inset-bottom, 0px) !important; border-radius: 0 !important; background-color: var(--active-bg, #101010) !important; }
            .skill-panel.skill-fullscreen .skill-viewport,
            .skill-panel:fullscreen .skill-viewport { min-height: 0; }
            .skill-zoom { position: absolute; right: 22px; bottom: 62px; z-index: 25; display: none; flex-direction: column; gap: 4px; }
            .skill-zoom button { width: 34px; height: 34px; padding: 0; border: 1px solid var(--active-grid-contrast, rgba(127,127,127,.5)); border-radius: 4px; background-color: var(--active-bg, #1e1e1e) !important; color: var(--active-text, #ddd) !important; font: inherit; font-size: 1rem; cursor: pointer; touch-action: manipulation; }
            .skill-zoom button:active { background-color: var(--active-mild-contrast, rgba(127,127,127,.2)) !important; }
            .skill-head { flex: 0 0 auto; width: 100%; max-width: 100%; min-width: 0; display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 4px; }
            .skill-titlebar { display: flex; align-items: baseline; gap: 10px; min-width: 0; flex-wrap: wrap; }
            .skill-title { font-size: 1.05rem; font-weight: 700; white-space: nowrap; }
            .skill-sub { font-size: .74rem; opacity: .68; margin-top: 0; white-space: nowrap; }
            .skill-actions { display: flex; min-width: 0; max-width: 100%; gap: 4px; flex-wrap: wrap; justify-content: flex-end; }
            .skill-actions .opt-btn { min-height: 26px; padding: 3px 7px; font-size: .76rem; }
            .skill-viewport { position: relative; flex: 1 1 0; width: 100%; max-width: 100%; min-width: 0; min-height: 160px; overflow: hidden; box-sizing: border-box; border: 1px solid var(--active-grid-contrast, rgba(127,127,127,.3)); border-radius: 6px; background-color: var(--active-bg, #101010) !important; cursor: grab; touch-action: none; }
            .skill-viewport.panning { cursor: grabbing; }
            .skill-world { position: absolute; left: 0; top: 0; transform-origin: 0 0; }
            .skill-panel, .skill-inline-panel, .skill-settings-pop { -webkit-font-smoothing: antialiased; text-rendering: geometricPrecision; }
            .skill-links { position: absolute; left: 0; top: 0; overflow: visible; pointer-events: none; opacity: .55; }
            .skill-links path { fill: none; stroke: #9a9a9a; stroke-opacity: 1; stroke-width: 1.25; stroke-linejoin: miter; stroke-linecap: square; shape-rendering: geometricPrecision; }
            body.opt-tree-light .skill-links path { stroke: #777777; }
            @media (hover: none), (pointer: coarse) { .skill-panel [data-skill-desc] { display: none !important; } }
            .skill-node { position: absolute; z-index: 2; user-select: none; touch-action: none; }
            .skill-node.dragging { z-index: 60; pointer-events: none; }
            .skill-node.settings-focus { z-index: 70; }
            .skill-node.settings-open { z-index: 90; }
            .skill-branch-card { position: relative; display: flex; flex-direction: column; justify-content: center; gap: 2px; min-height: 42px; padding: 6px 10px; border: 1px solid var(--active-grid-contrast, rgba(127,127,127,.45)); border-radius: 4px; background-color: var(--active-button-bg, #1b1b1b) !important; color: var(--active-text, #e6e6e6) !important; overflow: hidden; }
            .skill-root .skill-branch-card { align-items: center; border-color: var(--active-text-high-contrast, #f0c27b) !important; border-width: 2px; color: var(--active-text-high-contrast, #f0c27b) !important; font-size: .95rem; }
            .skill-main .skill-branch-card { border-color: var(--active-text, rgba(255,153,0,.45)); height: 56px; min-height: 56px; max-height: 56px; padding-top: 6px; padding-bottom: 6px; padding-right: 52px; overflow: hidden; }
            .skill-main.has-visibility .skill-branch-card { padding-right: 78px; }
            .skill-main .skill-branch-card strong,
            .skill-main .skill-branch-card small { display: block; max-width: 100%; min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
            .skill-category .skill-branch-card { border-color: var(--active-grid-contrast, rgba(127,127,127,.4)); color: var(--active-text, #e0e0e0) !important; height: 56px; min-height: 56px; max-height: 56px; padding-top: 6px; padding-bottom: 6px; overflow: hidden; }
            .skill-category .skill-branch-card strong,
            .skill-category .skill-branch-card small { display: block; max-width: 100%; min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
            .skill-branch-card { border-width: 2px; border-color: var(--active-text-high-contrast, #f0c27b) !important; box-sizing: border-box; }
            .skill-root .skill-branch-card,
            .skill-main .skill-branch-card,
            .skill-category .skill-branch-card { border-width: 2px; border-color: var(--active-text-high-contrast, #f0c27b) !important; }
            .skill-branch-card strong { font-size: 1.02rem; font-weight: 600; cursor: pointer; }
            .skill-node.has-color > .skill-branch-card { border-color: var(--branch-color) !important; background-image: linear-gradient(315deg, color-mix(in srgb, var(--branch-color) 18%, transparent), transparent 66%) !important; background-repeat: no-repeat !important; }
            .skill-root .skill-branch-card strong { font-size: 1.1rem; }
            .skill-branch-card small { font-size: .78rem; opacity: .7; }
            .skill-glow { display: none !important; }
            .skill-drag-handle { position: relative; flex: 0 0 auto; display: inline-flex; align-items: center; justify-content: center; width: 24px; height: 30px; color: var(--active-comment-contrast, #888) !important; cursor: grab; font-size: 16px; line-height: 1; touch-action: none; }
            .skill-drag-handle::before { content: ''; position: absolute; inset: -6px; }
            .skill-drag-handle:active { cursor: grabbing; }
            .skill-branch-card { padding-left: 34px; padding-right: 48px; }
            .skill-branch-card .skill-drag-handle { position: absolute; left: 2px; top: 50%; width: 28px; height: 32px; transform: translateY(-50%); }
            .skill-branch-menu { position: absolute; right: 2px; top: 1px; width: 22px; height: 22px; padding: 0; border: 0; border-radius: 3px; background: transparent; color: var(--active-comment-contrast, #aaa) !important; cursor: pointer; font-size: 16px; line-height: 1; }
            .skill-branch-menu:hover { background-color: var(--active-mild-contrast, rgba(127,127,127,.16)) !important; color: var(--active-text, #fff) !important; }
            .skill-lock { position: absolute; right: 26px; top: 2px; width: 22px; height: 22px; padding: 0; display: inline-flex; align-items: center; justify-content: center; border: 0; border-radius: 3px; background: transparent; cursor: pointer; }
            .skill-lock:hover { background-color: var(--active-mild-contrast, rgba(127,127,127,.16)) !important; }
            .skill-branch-tools { position: absolute; right: 2px; top: 1px; z-index: 5; display: flex; align-items: center; gap: 2px; }
            .skill-branch-tools > button { width: 22px; height: 22px; min-width: 22px; min-height: 22px; padding: 0; box-sizing: border-box; }
            .skill-branch-tools > button svg { width: 15px; height: 15px; }
            .skill-branch-tools .skill-lock,
            .skill-branch-tools .skill-branch-menu,
            .skill-branch-tools .skill-branch-visibility { position: static; right: auto; top: auto; left: auto; margin: 0; flex: 0 0 auto; }
            .skill-category .skill-branch-card { padding-right: 78px; }
            .skill-lock.locked { color: var(--active-text-high-contrast, #f0c27b) !important; }
            .skill-lock.unlocked { color: var(--active-good-contrast, #4caf50) !important; }
            .skill-main .skill-lock.unlocked { color: var(--active-comment-contrast, rgba(170,170,170,.9)) !important; }
            .skill-main.has-visibility .skill-lock { right: 50px; }
            .skill-lock,
            .skill-lock.locked,
            .skill-lock.unlocked,
            .skill-main .skill-lock.unlocked,
            .skill-icon.info,
            .skill-branch-visibility { color: var(--active-text, #ff9800) !important; opacity: 1; }
            .skill-lock:hover,
            .skill-icon.info:hover,
            .skill-branch-visibility:hover { color: var(--active-text, #fff) !important; }
            .skill-branch-visibility svg { color: currentColor !important; }
            .skill-branch-visibility { position: absolute; right: 24px; left: auto; top: 1px; display: inline-flex; align-items: center; justify-content: center; width: 22px; height: 22px; padding: 0; border: 0; border-radius: 3px; background: transparent; color: var(--active-comment-contrast, #aaa) !important; cursor: pointer; touch-action: manipulation; }
            .skill-branch-visibility:hover { background-color: var(--active-mild-contrast, rgba(127,127,127,.16)) !important; color: var(--active-text, #fff) !important; }
            .skill-branch-visibility svg { width: 15px; height: 15px; color: var(--active-comment-contrast, #aaa) !important; fill: currentColor !important; }
            .skill-branch-visibility svg path { fill: currentColor !important; }
            .skill-category .skill-branch-card, .skill-main .skill-branch-card { padding-left: 34px; }
            .skill-root .skill-branch-card { padding-right: 78px; }
            .skill-trunk-stat { margin-top: 2px; align-self: center; font-size: .72rem; color: var(--active-comment-contrast, #aaa) !important; white-space: nowrap; }
            .skill-menu { position: absolute; z-index: 2000; min-width: 170px; padding: 4px; border: 1px solid var(--active-grid-contrast, rgba(127,127,127,.5)); border-radius: 4px; background-color: var(--active-bg, #1e1e1e) !important; box-shadow: 0 8px 20px rgba(0,0,0,.5); }
            .skill-menu[hidden] { display: none !important; }
            .skill-menu button { display: block; width: 100%; padding: 6px 8px; border: 0; border-radius: 3px; background: transparent; color: var(--active-text, #ddd) !important; text-align: left; font: inherit; font-size: .82rem; cursor: pointer; }
            .skill-menu button:hover { background-color: var(--active-mild-contrast, rgba(127,127,127,.16)) !important; }
            .skill-menu button.danger { color: var(--active-danger, #ef5350) !important; }
            .skill-card { display: flex; align-items: center; gap: 4px; height: 52px; padding: 0 4px 0 3px; border: 1px solid var(--active-grid-contrast, rgba(127,127,127,.4)); border-radius: 4px; background-color: var(--active-button-bg, #1b1b1b) !important; color: var(--active-text, #e8e8e8) !important; cursor: grab; }
            .skill-plugin.running .skill-card { border-color: var(--active-good-contrast, #4caf50); border-left: 3px solid var(--active-focus-color, #ff9800) !important; }
            .skill-plugin.stopped .skill-card { opacity: 1; filter: none; }
            .skill-plugin.missing .skill-card { border-style: dashed; opacity: 1; filter: none; }
            .skill-plugin.stopped .skill-card > *,
            .skill-plugin.missing .skill-card > * { opacity: .7; filter: grayscale(1) brightness(.82); }
            .skill-node.hidden-expanded { z-index: 60; }
            .skill-node.hidden-expanded::before {
                content: '';
                position: absolute;
                left: 0;
                top: -3px;
                width: 100%;
                height: calc(100% + 6px);
                border-radius: 4px;
                background-color: color-mix(in srgb, var(--active-button-bg, #1b1b1b) 76%, #000) !important;
                pointer-events: none;
                z-index: -1;
            }
            .skill-plugin.version-changed .skill-card,
            .skill-plugin.config-changed .skill-card { position: relative; isolation: isolate; }
            .skill-plugin.version-changed .skill-card::before,
            .skill-plugin.config-changed .skill-card::after {
                content: '';
                position: absolute;
                top: 50%;
                width: 2px;
                height: calc(33.333% - 2px);
                transform: translateY(-50%);
                border-radius: 2px;
                pointer-events: none;
                z-index: 1;
                animation: opt-signal-glow 2.2s ease-in-out infinite;
            }
            .skill-plugin.version-changed .skill-card::before {
                left: 0;
                background: rgb(255,170,0);
            }
            .skill-plugin.config-changed .skill-card::after {
                right: 0;
                background: rgb(76,175,80);
            }
            @keyframes opt-signal-glow { 0%, 100% { opacity: 0; } 50% { opacity: 1; } }
            .skill-plugin.has-color .skill-card { border-color: var(--branch-color) !important; }
            .skill-plugin.has-category-marker .skill-card { border-left-color: var(--category-marker-color) !important; }
            .skill-plugin.has-branch-marker .skill-card { border-left-color: var(--branch-marker-color) !important; }
            .skill-plugin.missing.hug3o .skill-card { border-color: var(--active-text, rgba(255,153,0,.45)); }
            .skill-name { flex: 1 1 auto; min-width: 0; overflow: hidden; font-size: .94rem; font-weight: 500; line-height: 1.15; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; white-space: normal; cursor: pointer; }
            .skill-ver { flex: 0 0 auto; font-size: .8rem; opacity: .7; color: var(--active-comment-contrast, inherit) !important; }
            .skill-card-actions { display: flex; flex: 0 0 auto; gap: 0; }
            .skill-icon { display: inline-flex; align-items: center; justify-content: center; width: 24px; height: 24px; padding: 3px; border: 0; border-radius: 4px; background: transparent; color: var(--active-comment-contrast, rgba(170,170,170,.9)) !important; cursor: pointer; }
            .skill-icon:hover { background: var(--active-mild-contrast, rgba(255,255,255,.08)) !important; color: var(--active-text, #fff) !important; }
            .skill-icon.power.on { color: var(--active-good-contrast, #4caf50) !important; }
            .skill-icon.info { color: var(--active-text, #ff9800) !important; }
            .skill-icon.symbol-text { font-size: 1rem; font-weight: 700; line-height: 1; }
            .skill-icon.danger:hover { color: #ef5350 !important; }
            .skill-icon:disabled { opacity: .3; cursor: default; }
            .skill-settings { position: absolute; left: 0; top: calc(100% + 4px); width: 340px; max-height: 340px; overflow: auto; z-index: 30; padding: 8px 10px; border: 1px solid var(--active-grid-contrast, rgba(127,127,127,.6)); border-radius: 4px; background-color: var(--active-bg, #1e1e1e) !important; box-shadow: 0 8px 20px rgba(0,0,0,.5); }
            .skill-settings[hidden] { display: none !important; }
            .skill-settings { overscroll-behavior: contain; scrollbar-width: thin; scrollbar-color: var(--active-comment-contrast, #777) var(--active-bg, #222); touch-action: pan-y; -webkit-overflow-scrolling: touch; }
            .skill-settings::-webkit-scrollbar { width: 8px; height: 8px; }
            .skill-settings::-webkit-scrollbar-track { background: #222; }
            .skill-settings::-webkit-scrollbar-thumb { background: #777; border-radius: 4px; }
            .skill-field { display: grid; grid-template-columns: minmax(0, 1fr) auto; align-items: center; gap: 8px; min-height: 23px; margin: 3px 0; font-size: .78rem; }
            .skill-field > span { min-width: 0; color: var(--active-text, #ddd) !important; line-height: 1.3; }
            .skill-field input[type="text"], .skill-field input[type="number"], .skill-field input[type="password"], .skill-field select { width: 148px; padding: 3px 5px; font: inherit; font-size: .75rem; color: var(--active-text, #f0f0f0) !important; background-color: var(--active-button-bg, #2a2a2a) !important; border: 1px solid var(--active-grid-contrast, rgba(127,127,127,.5)); border-radius: 3px; }
            .skill-field input[type="checkbox"],
            #optimizer-panel input[type="checkbox"] { appearance: none; -webkit-appearance: none; width: 16px; height: 16px; margin: 0 6px 0 0; border: 1px solid var(--active-grid-contrast, rgba(127,127,127,.6)); border-radius: 3px; background-color: var(--active-bg, #1e1e1e) !important; display: inline-grid; place-content: center; vertical-align: middle; cursor: pointer; accent-color: #ff9800; }
            .skill-field input[type="checkbox"]:checked,
            #optimizer-panel input[type="checkbox"]:checked { background-color: #ff9800 !important; border-color: #ff9800; }
            .skill-field input[type="checkbox"]:checked::after,
            #optimizer-panel input[type="checkbox"]:checked::after { content: ''; width: 8px; height: 4px; border-left: 2px solid #111; border-bottom: 2px solid #111; transform: rotate(-45deg) translate(0, -1px); }
            .skill-field input[type="checkbox"]:focus-visible,
            #optimizer-panel input[type="checkbox"]:focus-visible { outline: 2px solid #ff9800; outline-offset: 2px; }
            .skill-switch { position: relative; display: inline-flex; flex: 0 0 auto; width: 40px; height: 20px; vertical-align: middle; }
            .skill-switch input[type="checkbox"] { position: absolute; inset: 0; width: 100%; height: 100%; margin: 0; opacity: 0; appearance: none; -webkit-appearance: none; background: transparent !important; border: 0 !important; cursor: pointer; z-index: 1; }
            .skill-switch input[type="checkbox"]::after { content: none !important; }
            .skill-switch::before { content: ''; position: absolute; left: 6px; top: 4px; width: 28px; height: 12px; border-radius: 6px; background-color: rgba(0,0,0,.38); box-shadow: inset 0 0 0 1px rgba(255,255,255,.1); transition: background-color .15s ease, box-shadow .15s ease; }
            .skill-switch::after { content: ''; position: absolute; left: 5px; top: 3px; width: 14px; height: 14px; border-radius: 50%; background: rgba(165,165,165,.9); box-shadow: rgba(0,0,0,.2) 0 2px 1px -1px, rgba(0,0,0,.14) 0 1px 1px 0, rgba(0,0,0,.12) 0 1px 3px 0; transition: left .15s ease, background-color .15s ease; }
            .skill-switch:has(input[type="checkbox"]:checked)::before { background-color: rgba(255,153,0,.9); box-shadow: none; }
            .skill-switch:has(input[type="checkbox"]:checked)::after { left: 20px !important; background: #ff9900; }
            .skill-field textarea { width: 148px; min-height: 52px; padding: 3px 5px; font: inherit; font-size: .75rem; color: var(--active-text, #f0f0f0) !important; background-color: var(--active-button-bg, #2a2a2a) !important; border: 1px solid var(--active-grid-contrast, rgba(127,127,127,.5)); border-radius: 3px; box-sizing: border-box; resize: vertical; }
            .skill-field-block[hidden], .skill-settings-empty[hidden] { display: none !important; }
            .skill-settings-save { margin-top: 6px; width: 100%; }
            .skill-settings-start { display: block; margin-top: 8px; }
            .skill-settings-loading, .skill-settings-empty { font-size: .76rem; color: #bbb !important; padding: 4px; }
            .skill-settings-online { display: flex; flex-direction: column; gap: 5px; align-items: flex-start; }
            .skill-settings-online strong { color: var(--active-text, #eee) !important; font-size: .8rem; }
            .skill-settings-online p { margin: 0; line-height: 1.38; color: var(--active-text, #eee) !important; opacity: .9; }
            .skill-settings-online small { opacity: .65; word-break: break-all; font-size: .7rem; }
            .skill-settings-repo { margin: 0 0 5px; font-size: .7rem; color: var(--active-comment-contrast, #aaa) !important; opacity: .75; word-break: break-all; }
            .skill-settings-meta { margin-bottom: 6px; padding-bottom: 6px; border-bottom: 1px solid rgba(127,127,127,.18); }
            .skill-settings-description { margin: 0 0 5px; font-size: .72rem; line-height: 1.35; color: var(--active-text, #ddd) !important; opacity: .86; }
            .skill-node.output-open { z-index: 100; }
            .skill-output-pop { position: absolute; left: 0; top: calc(100% + 4px); z-index: 110; transition: top .15s ease; display: flex; flex-direction: column; width: 100%; max-height: 280px; overflow: hidden; border: 1px solid var(--active-grid-contrast, rgba(127,127,127,.6)); border-radius: 4px; background-color: var(--active-bg, #1e1e1e) !important; color: var(--active-text, #eee) !important; box-shadow: 0 0 0 4px var(--active-bg, #1e1e1e), 0 14px 20px -8px rgba(0,0,0,.72) !important; isolation: isolate; }
            .skill-panel .skill-output-pop .skill-output-head { flex: 0 0 auto; display: flex; align-items: center; gap: 4px; padding: 4px 6px; border-bottom: 1px solid rgba(127,127,127,.22); background-color: var(--active-bg, #1e1e1e) !important; }
            .skill-output-title { flex: 1 1 auto; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: .7rem; font-weight: 600; }
            .skill-output-count { font-weight: 400; opacity: .6; }
            .skill-output-refresh, .skill-output-close { width: 20px; height: 20px; padding: 0; border: 0; border-radius: 3px; background: transparent !important; color: var(--active-comment-contrast, #bbb) !important; cursor: pointer; line-height: 1; }
            .skill-output-refresh:hover, .skill-output-close:hover { background: rgba(127,127,127,.16) !important; color: var(--active-text, #fff) !important; }
            .skill-output-log { flex: 1 1 auto; margin: 0; padding: 5px 6px; min-height: 48px; max-height: 230px; overflow: auto; white-space: pre-wrap; word-break: break-word; font: .66rem/1.35 ui-monospace, SFMono-Regular, Consolas, monospace; color: var(--active-text, #ddd) !important; background: var(--active-button-bg, #181818) !important; box-shadow: inset 0 1px 0 rgba(127,127,127,.12); }
            .skill-icon.output { color: var(--active-text, #ff9800) !important; }
            .skill-plugin.download-active .skill-card { outline: 2px solid rgba(33,150,243,.55); outline-offset: 1px; box-shadow: 0 0 9px 2px rgba(33,150,243,.3) !important; animation: opt-download-outline-blue 2.2s ease-in-out infinite; }
            .skill-plugin.download-queued .skill-card { outline: 2px solid rgba(156,39,176,.55); outline-offset: 1px; box-shadow: 0 0 9px 2px rgba(156,39,176,.3) !important; animation: opt-download-outline-purple 2.2s ease-in-out infinite; }
            .skill-plugin.action-queued-start .skill-card { outline: 2px solid rgba(76,175,80,.55); outline-offset: 1px; box-shadow: 0 0 9px 2px rgba(76,175,80,.3) !important; animation: opt-action-outline-green 2.2s ease-in-out infinite; }
            .skill-plugin.action-queued-update .skill-card { outline: 2px solid rgba(255,193,7,.55); outline-offset: 1px; box-shadow: 0 0 9px 2px rgba(255,193,7,.3) !important; animation: opt-action-outline-yellow 2.2s ease-in-out infinite; }
            @keyframes opt-download-outline-blue { 0%, 100% { outline-color: rgba(33,150,243,.25); } 50% { outline-color: rgba(100,181,246,.8); } }
            @keyframes opt-download-outline-purple { 0%, 100% { outline-color: rgba(156,39,176,.25); } 50% { outline-color: rgba(186,104,200,.8); } }
            @keyframes opt-action-outline-green { 0%, 100% { outline-color: rgba(76,175,80,.25); } 50% { outline-color: rgba(129,199,132,.8); } }
            @keyframes opt-action-outline-yellow { 0%, 100% { outline-color: rgba(255,193,7,.25); } 50% { outline-color: rgba(255,213,79,.8); } }
            .skill-icon.update { color: #ffc107 !important; }
            .skill-icon.power.downloading { animation: opt-download-flash .55s ease-in-out infinite alternate; color: var(--active-focus-color, #ff9800) !important; }
            .skill-icon.power.queued { opacity: .7; color: var(--active-comment-contrast, #aaa) !important; }
            .skill-download-progress.queued { color: var(--active-comment-contrast, #aaa) !important; }
            .skill-plugin.plugin-error .skill-card { border-color: #ef5350 !important; }
            .skill-plugin-error { flex: 0 0 auto; display: inline-flex; align-items: center; justify-content: center; width: 15px; height: 15px; border-radius: 50%; background: #ef5350 !important; color: #fff !important; font-size: .68rem; font-weight: 700; cursor: help; }
            .skill-plugin.has-update .skill-card { border-color: rgba(255,193,7,.9) !important; outline: 2px solid rgba(255,193,7,.55); outline-offset: 1px; box-shadow: 0 0 10px 2px rgba(255,193,7,.45) !important; animation: opt-update-outline 2.2s ease-in-out infinite; }
            @keyframes opt-update-outline { 0%, 100% { outline-color: rgba(255,193,7,.25); border-color: rgba(255,193,7,.45); } 50% { outline-color: rgba(255,213,79,.8); border-color: #ffc107; } }
            .skill-plugin.download-failed .skill-card { border-color: #ef5350 !important; animation: opt-error-border 1.8s ease-in-out infinite; box-shadow: 0 0 0 rgba(0,0,0,0) !important; }
            .skill-download-progress { flex: 0 0 auto; min-width: 30px; font-size: .62rem; line-height: 1; color: var(--active-focus-color, #ff9800) !important; white-space: nowrap; }
            .skill-download-progress.error { color: #ef5350 !important; }
            @keyframes opt-download-flash { from { opacity: .3; } to { opacity: 1; } }
            .skill-field-block { margin: 4px 0; }
            .skill-array-title { margin-bottom: 3px; font-size: .74rem; font-weight: 600; color: var(--active-text, #ddd) !important; }
            .skill-array-editor { width: 100%; min-width: 0; overflow-x: auto; padding-bottom: 2px; }
            .skill-array-table { display: flex; flex-direction: column; gap: 3px; min-width: 100%; }
            .skill-array-row { display: grid; gap: 3px; align-items: center; min-width: 100%; }
            .skill-array-head span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: .62rem; color: var(--active-comment-contrast, #999) !important; }
            .skill-array-cell { display: flex; align-items: center; min-width: 0; min-height: 22px; padding: 1px 3px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: .68rem; color: var(--active-text, #ddd) !important; }
            .skill-array-cell.bool-on { color: var(--active-good-contrast, #4caf50) !important; justify-content: center; }
            .skill-array-empty { padding: 6px 3px; font-size: .68rem; color: var(--active-comment-contrast, #888) !important; }
            .skill-array-head-actions { display: flex; justify-content: center; }
            .skill-array-add-head { width: 22px; height: 22px; padding: 0; border: 0; border-radius: 3px; background: transparent !important; color: var(--active-text, #ff9800) !important; cursor: pointer; font-size: 1rem; line-height: 1; }
            .skill-array-add-head:hover { background: rgba(127,127,127,.16) !important; }
            .skill-array-actions { display: flex; align-items: center; justify-content: flex-end; gap: 1px; }
            .skill-array-action { width: 22px; height: 22px; padding: 0; border: 0; border-radius: 3px; background: transparent !important; color: var(--active-comment-contrast, #aaa) !important; cursor: pointer; line-height: 1; }
            .skill-array-action:hover { background: rgba(127,127,127,.16) !important; color: var(--active-text, #fff) !important; }
            .skill-array-action.danger:hover { color: #ef5350 !important; background: rgba(239,83,80,.12) !important; }
            @media (min-width: 761px) {
                .skill-array-editor.array-many .skill-array-table { min-width: 0; }
                .skill-array-editor.array-many .skill-array-head { display: flex; justify-content: flex-end; padding: 2px 0; }
                .skill-array-editor.array-many .skill-array-head > span:not(.skill-array-head-actions) { display: none; }
                .skill-array-editor.array-many .skill-array-data { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); align-items: start; gap: 4px 8px; min-width: 0; padding: 5px; border: 1px solid rgba(127,127,127,.2); border-radius: 3px; }
                .skill-array-editor.array-many .skill-array-cell { display: block; min-width: 0; padding: 0; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
                .skill-array-editor.array-many .skill-array-cell::before { content: attr(data-label); display: block; overflow: hidden; text-overflow: ellipsis; color: var(--active-comment-contrast, #999); font-size: .6rem; }
                .skill-array-editor.array-many .skill-array-cell.bool-on { justify-content: start; }
                .skill-array-editor.array-many .skill-array-actions { grid-column: 1 / -1; justify-content: flex-end; margin-top: 2px; }
                .skill-array-editor.array-many .skill-array-nested { grid-column: 1 / -1; }
                .skill-array-dialog .skill-array-editor.array-many .skill-array-data { grid-template-columns: 1fr; }
            }
            .skill-array-dialog-box { width: min(540px, 94vw) !important; max-height: 84vh; overflow: auto; background-color: var(--active-button-bg, #1b1b1b) !important; }
            .skill-array-dialog-title { margin-bottom: 8px; font-size: .9rem; font-weight: 700; }
            .skill-array-dialog-form { display: flex; flex-direction: column; gap: 6px; }
            .skill-array-dialog-field { display: flex; align-items: center; gap: 8px; }
            .skill-array-dialog-field > span:first-child { flex: 0 0 120px; font-size: .72rem; color: var(--active-text, #ddd) !important; }
            .skill-array-dialog-field input[type="text"], .skill-array-dialog-field input[type="number"], .skill-array-dialog-field input[type="password"], .skill-array-dialog-field select { flex: 1 1 auto; min-width: 0; padding: 3px 5px; font: inherit; font-size: .74rem; color: var(--active-text, #eee) !important; background-color: var(--active-button-bg, #2a2a2a) !important; border: 1px solid var(--active-grid-contrast, rgba(127,127,127,.5)); border-radius: 3px; box-sizing: border-box; }
            .skill-array-dialog-nested { margin-top: 4px; padding-top: 4px; border-top: 1px solid rgba(127,127,127,.18); }
            .skill-array-dialog-label { margin-bottom: 3px; font-size: .72rem; font-weight: 600; }
            @media (pointer: coarse), (max-width: 760px) {
                .skill-array-table { min-width: 0; }
                .skill-array-head { display: flex !important; justify-content: flex-end; min-width: 0; padding: 2px 0; }
                .skill-array-head > span:not(.skill-array-head-actions) { display: none; }
                .skill-array-data { display: flex !important; flex-direction: column; align-items: stretch; gap: 2px; min-width: 0; padding: 5px 6px; border: 1px solid rgba(127,127,127,.2); border-radius: 3px; }
                .skill-array-cell { display: grid; grid-template-columns: 108px minmax(0, 1fr); gap: 6px; align-items: center; min-height: 0; padding: 1px 0; white-space: normal; }
                .skill-array-cell::before { content: attr(data-label); overflow: hidden; text-overflow: ellipsis; color: var(--active-comment-contrast, #999); font-size: .64rem; }
                .skill-array-cell.bool-on { justify-content: start; }
                .skill-array-actions { justify-content: flex-end; margin-top: 2px; }
                .skill-array-nested { width: 100%; margin-top: 3px; }
                .skill-array-dialog-box { width: calc(100vw - 20px) !important; max-height: calc(100vh - 24px); padding: 10px 12px !important; }
                .skill-array-dialog-field > span:first-child { flex-basis: 96px; }
            }
            .skill-array-nested { grid-column: 1 / -1; margin: 2px 0; padding-left: 6px; border-left: 1px solid rgba(127,127,127,.2); }
            .skill-array-nested > summary { cursor: pointer; font-size: .68rem; color: var(--active-comment-contrast, #aaa); }
            .skill-field-block.field-sep { padding-bottom: 6px; margin-bottom: 6px; border-bottom: 1px solid rgba(127,127,127,.16); }
            .skill-field-help { margin: 2px 0 0; font-size: .68rem; line-height: 1.32; color: var(--active-comment-contrast, #aaa) !important; opacity: .9; }
            .skill-settings-tab-block { margin: 4px 0 6px; min-width: 0; }
            .skill-settings-tabs { display: flex; align-items: flex-end; gap: 3px 2px; flex: 1; min-width: 0; flex-wrap: wrap; overflow: visible; padding: 0 2px; border-bottom: 1px solid rgba(127,127,127,.4); }
            .skill-panel .skill-settings-tabs .skill-settings-tab { display: inline-flex; align-items: center; flex: 0 0 auto; min-height: 22px; padding: 2px 10px; border: 1px solid rgba(127,127,127,.38) !important; border-bottom: 0 !important; border-radius: .4em .4em 0 0 !important; background: transparent !important; box-shadow: none !important; appearance: none; color: var(--active-comment-contrast, #aaa) !important; font: inherit; font-size: .72rem; font-weight: normal; white-space: nowrap; cursor: pointer; }
            .skill-panel .skill-settings-tabs .skill-settings-tab:hover { color: var(--active-text, #eee) !important; border-color: rgba(255,255,255,.55) !important; border-bottom-color: transparent !important; background: transparent !important; }
            .skill-panel .skill-settings-tabs .skill-settings-tab.active { color: var(--active-text, #eee) !important; font-weight: bold; border-color: var(--active-text, #eee) !important; border-bottom: 0 !important; border-bottom-left-radius: 0 !important; border-bottom-right-radius: 0 !important; background: transparent !important; }
            .skill-tray { flex: 0 0 auto; width: 100%; max-width: 100%; min-width: 0; display: flex; align-items: center; gap: 4px; padding: 0 2px 1px; border-top: 1px solid rgba(127,127,127,.25); margin-top: 0; overflow: hidden; box-sizing: border-box; }
            .skill-tray[hidden] { display: none !important; }
            .skill-tray.empty { min-height: 24px; padding: 1px 6px; background-color: rgba(127,127,127,.035); }
            .skill-tray-empty { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: .7rem; }
            .skill-tray.empty .skill-tray-items { align-items: center; }
            .skill-tray.empty .skill-tray-head { opacity: .5; }
            .skill-tray.drop-target { background-color: var(--active-mild-contrast, rgba(255,153,0,.12)) !important; }
            .skill-tray-head { flex: 0 0 auto; font-size: .72rem; color: var(--active-comment-contrast, #ccc) !important; white-space: nowrap; }
            .skill-tray-items { display: flex; flex: 1 1 0; gap: 3px; min-width: 0; max-width: 100%; overflow-x: auto; overflow-y: hidden; padding-bottom: 0; min-height: 20px; touch-action: pan-x; overscroll-behavior-x: contain; scrollbar-width: none; }
            .skill-tray-items::-webkit-scrollbar { width: 0; height: 0; display: none; }
            .skill-tray-item { flex: 0 0 auto; display: inline-flex; align-items: center; gap: 3px; max-width: 220px; padding: 1px 5px; border: 1px solid var(--active-grid-contrast, rgba(127,127,127,.4)); border-radius: 3px; background-color: var(--active-button-bg, #1b1b1b) !important; color: var(--active-text, #e0e0e0) !important; font-size: .74rem; cursor: grab; }
            .skill-tray-item .skill-icon { width: 20px; height: 20px; padding: 1px; }
            .skill-tray-item .skill-icon svg { width: 13px; height: 13px; }
            .skill-tray-item strong { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
            .skill-tray-item small { opacity: .65; }
            .skill-tray-empty { font-size: .72rem; color: var(--active-comment-contrast, #777) !important; opacity: .5; user-select: none; }
            .skill-desc { position: absolute; z-index: 1000; max-width: 340px; max-height: 55vh; overflow: auto; padding: 24px 10px 8px; border: 1px solid var(--active-grid-contrast, rgba(127,127,127,.6)); border-radius: 4px; background-color: var(--active-bg, #1e1e1e) !important; color: var(--active-text, #eee) !important; font-size: .82rem; line-height: 1.4; box-shadow: 0 8px 20px rgba(0,0,0,.55); opacity: 1 !important; }
            .skill-desc.pinned { border-color: var(--active-focus-color, #ff9800); }
            .skill-desc[hidden] { display: none !important; }
            .skill-desc-close { position: absolute; top: 2px; right: 2px; width: 22px; height: 22px; padding: 0; border: 0; border-radius: 3px; background: transparent; color: var(--active-comment-contrast, #aaa) !important; cursor: pointer; font-size: 16px; line-height: 1; }
            .skill-desc-close:hover { background-color: var(--active-mild-contrast, rgba(127,127,127,.16)) !important; color: var(--active-text, #fff) !important; }
            .skill-settings-pop { position: absolute; z-index: 1200; max-height: 60vh; overflow: auto; padding: 0 10px 8px; border: 1px solid var(--active-grid-contrast, rgba(127,127,127,.6)); border-radius: 5px; background-color: var(--active-bg, #1e1e1e) !important; color: var(--active-text, #eee) !important; box-shadow: 0 10px 24px rgba(0,0,0,.6); box-sizing: border-box; touch-action: pan-y; }
            .skill-settings-pop[hidden] { display: none !important; }
            .skill-inline-panel { position: absolute; left: 0; width: 100%; z-index: 40; display: flex; flex-direction: column; overflow: hidden; box-sizing: border-box; border: 1px solid var(--active-grid-contrast, rgba(127,127,127,.6)); border-radius: 4px; background-color: var(--active-bg, #1e1e1e) !important; color: var(--active-text, #eee) !important; box-shadow: 0 6px 16px rgba(0,0,0,.5); }
            .skill-node .skill-inline-panel { box-shadow: 0 14px 20px -8px rgba(0,0,0,.72) !important; }
            .skill-inline-panel[hidden] { display: none !important; }
            .skill-inline-head { flex: 0 0 auto; display: flex; align-items: center; justify-content: flex-start; gap: 6px; padding: 5px 6px; border-bottom: 1px solid var(--active-grid-contrast, rgba(127,127,127,.3)); background-color: var(--active-bg, #1e1e1e) !important; }
            .skill-inline-head strong { flex: 1 1 auto; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: .8rem; }
            .skill-inline-head button { flex: 0 0 auto; width: 22px; height: 22px; padding: 0; border: 0; border-radius: 3px; background: transparent; color: var(--active-comment-contrast, #aaa) !important; cursor: pointer; font-size: 16px; line-height: 1; }
            .skill-inline-head button:hover { background-color: var(--active-mild-contrast, rgba(127,127,127,.16)) !important; color: var(--active-text, #fff) !important; }
            .skill-inline-head .skill-inline-save { width: auto !important; min-width: 44px; height: 22px; margin-left: auto; padding: 0 8px !important; border: 1px solid var(--active-grid-contrast, rgba(127,127,127,.45)) !important; border-radius: 3px; font-size: .68rem !important; line-height: 20px !important; opacity: .35; }
            .skill-inline-head .skill-inline-save.dirty { opacity: 1; color: var(--active-focus-color, #ff9800) !important; border-color: var(--active-focus-color, #ff9800) !important; }
            .skill-inline-head .skill-inline-save:disabled { cursor: default; }
            .skill-inline-body { flex: 1 1 auto; min-height: 0; overflow: auto; padding: 5px 7px; font-size: .76rem; line-height: 1.38; touch-action: pan-y; }
            .skill-inline-resizer { position: relative; flex: 0 0 10px; cursor: ns-resize; touch-action: none; background: linear-gradient(to bottom, transparent, var(--active-mild-contrast, rgba(127,127,127,.18))); border-top: 1px solid var(--active-grid-contrast, rgba(127,127,127,.3)); }
            .skill-inline-resizer::after { content: ''; position: absolute; right: 5px; bottom: 2px; width: 18px; height: 7px; border-right: 2px solid var(--panel-accent, var(--active-text, #ff9800)); border-bottom: 2px solid var(--panel-accent, var(--active-text, #ff9800)); opacity: .8; pointer-events: none; }
            .skill-settings-pop.inline { position: absolute !important; left: 0 !important; top: 56px !important; width: 100% !important; max-width: 100%; height: auto; max-height: 320px; z-index: 40; padding: 0 8px 8px; border-radius: 4px; box-shadow: 0 6px 16px rgba(0,0,0,.45); }
            .skill-settings-pop-head { position: sticky; top: 0; z-index: 1; display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 7px 0 5px; background-color: var(--active-bg, #1e1e1e) !important; border-bottom: 1px solid var(--active-grid-contrast, rgba(127,127,127,.3)); }
            .skill-settings-pop-head strong { font-size: .86rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
            .skill-settings-pop-head button { flex: 0 0 auto; width: 24px; height: 24px; padding: 0; border: 0; border-radius: 3px; background: transparent; color: var(--active-comment-contrast, #aaa) !important; cursor: pointer; font-size: 17px; }
            .skill-settings-pop-head button:hover { background-color: var(--active-mild-contrast, rgba(127,127,127,.16)) !important; color: var(--active-text, #fff) !important; }
            .skill-icon.star { color: var(--active-comment-contrast, #aaa) !important; }
            .skill-icon.star.on { color: #ffd54f !important; }
            .skill-icon.star svg { width: 16px; height: 16px; }
            .skill-tray-item.missing.starred { border-style: dashed; opacity: 1; filter: grayscale(1) brightness(.82); }
            .skill-tray-item.stopped { opacity: 1; filter: grayscale(1) brightness(.82); }
            .skill-tray-item.stopped > *,
            .skill-tray-item.missing.starred > * { opacity: .7; }
            .skill-confirm { position: absolute; inset: 0; z-index: 2000; display: flex; align-items: center; justify-content: center; padding: 16px; background: transparent !important; box-sizing: border-box; pointer-events: none; }
            .skill-confirm > .skill-confirm-box { pointer-events: auto; }
            .skill-confirm[hidden] { display: none !important; }
            .skill-confirm-box { width: min(360px, 100%); padding: 14px; border: 1px solid var(--active-grid-contrast, rgba(127,127,127,.6)); border-radius: 6px; background-color: var(--active-bg, #1e1e1e) !important; color: var(--active-text, #eee) !important; box-shadow: 0 12px 30px rgba(0,0,0,.65); }
            .skill-confirm-text { margin-bottom: 12px; font-size: .9rem; line-height: 1.4; }
            .skill-confirm-actions { display: flex; justify-content: flex-end; gap: 8px; }
            .skill-category.drop-target .skill-branch-card,
            .skill-main.drop-target .skill-branch-card,
            .skill-root.drop-target .skill-branch-card { border-color: var(--active-focus-color, #ff9800) !important; background-color: var(--active-mild-contrast, #2a2418) !important; }
            /* Higher specificity than the orange theme's global transparent-background rule. */
            .skill-panel .skill-viewport { background-color: var(--active-bg, #101010) !important; }
            .skill-panel .skill-card, .skill-panel .skill-branch-card { background-color: var(--active-button-bg, #1b1b1b) !important; }
            .skill-panel .skill-name, .skill-panel .skill-branch-card strong, .skill-panel .skill-branch-card small { color: var(--active-text, #e8e8e8) !important; }
            .skill-panel .skill-root .skill-branch-card strong { color: var(--active-text-high-contrast, #f0c27b) !important; }
            .skill-panel .skill-branch-card strong { color: var(--active-text-high-contrast, #f0c27b) !important; }
            .skill-panel .skill-settings { background-color: var(--active-bg, #1e1e1e) !important; }
            .skill-panel .skill-settings-pop, .skill-panel .skill-confirm-box, .skill-panel .skill-inline-panel, .skill-panel .skill-output-pop { background-color: var(--active-bg, #1e1e1e) !important; color: var(--active-text, #eee) !important; }
            .skill-panel .skill-confirm { background-color: transparent !important; }
            .skill-panel .skill-field > span { color: var(--active-text, #ddd) !important; }
            .skill-panel .skill-field input[type="text"], .skill-panel .skill-field input[type="number"], .skill-panel .skill-field input[type="password"], .skill-panel .skill-field select { background-color: var(--active-button-bg, #2a2a2a) !important; color: var(--active-text, #f0f0f0) !important; }
            .skill-panel .skill-tray-item { background-color: var(--active-button-bg, #1b1b1b) !important; color: var(--active-text, #e0e0e0) !important; }
            .skill-panel .skill-desc { background-color: var(--active-bg, #1e1e1e) !important; color: var(--active-text, #eee) !important; opacity: 1 !important; }
            .skill-icon, .skill-branch-menu, .skill-zoom button, .opt-btn, .skill-tray-item { touch-action: manipulation; }
            @media (pointer: coarse), (max-width: 760px) {
                .skill-head { flex-direction: column; align-items: stretch; gap: 6px; }
                .skill-actions { justify-content: flex-start; flex-wrap: nowrap; gap: 3px; width: 100%; }
                .skill-actions .opt-btn { min-height: 32px; padding: 4px 6px; font-size: .68rem; white-space: nowrap; flex: 0 1 auto; }
                .skill-title { font-size: 1rem; }
                .skill-sub { font-size: .72rem; }
                .skill-viewport { min-height: 200px; }
                .skill-icon { width: 34px; height: 34px; padding: 4px; }
                .skill-icon svg { width: 16px; height: 16px; }
                .skill-drag-handle { width: 40px; height: 40px; font-size: 20px; }
                .skill-drag-handle::before { inset: -4px; }
                .skill-card { gap: 2px; padding: 0 2px; }
                .skill-branch-menu { width: 36px; height: 36px; font-size: 22px; }
                .skill-branch-visibility { width: 34px; height: 34px; right: 40px; left: auto; }
                .skill-branch-visibility svg { width: 20px; height: 20px; color: var(--active-comment-contrast, #aaa) !important; fill: currentColor !important; }
                .skill-category .skill-branch-card, .skill-main .skill-branch-card, .skill-root .skill-branch-card { padding-left: 52px; padding-right: 78px; }
                .skill-branch-tools { right: 2px; gap: 1px; }
                .skill-branch-tools > button,
                .skill-branch-tools .skill-lock,
                .skill-branch-tools .skill-branch-menu,
                .skill-branch-tools .skill-branch-visibility { width: 32px; height: 32px; min-width: 32px; min-height: 32px; font-size: 20px; }
                .skill-branch-tools > button svg,
                .skill-branch-tools .skill-branch-visibility svg { width: 18px; height: 18px; }
                .skill-root .skill-branch-card,
                .skill-main .skill-branch-card,
                .skill-category .skill-branch-card { padding-right: 108px; }
                .skill-main .skill-branch-card { padding-right: 78px; }
                .skill-main.has-visibility .skill-branch-card,
                .skill-category.has-visibility .skill-branch-card { padding-right: 104px; }
                .skill-root .skill-branch-card { padding-right: 78px; }
                .skill-zoom { display: none !important; }
                .skill-card { gap: 2px; }
                .skill-drag-handle { width: 20px; margin-right: -1px; }
                .skill-icon.power { margin-left: 0; }
                .skill-name { display: block; font-size: .82rem; line-height: 1.15; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; -webkit-line-clamp: unset; -webkit-box-orient: initial; }
                .skill-ver { display: inline-block; flex: 0 0 auto; max-width: 38px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: .64rem; opacity: .7; }
                .skill-trunk-stat { font-size: .82rem; }
                .skill-tray { flex-direction: row; align-items: center; gap: 3px; padding: 0 2px; min-height: 22px; }
                .skill-tray-items { flex: 1 1 0; width: auto; max-width: 100%; min-height: 18px; }
                .skill-tray-head { font-size: .74rem; }
                .skill-tray-item { padding: 2px 6px; font-size: .76rem; }
                .skill-menu button { padding: 10px; font-size: .95rem; }

            }
            @media (orientation: landscape) and (max-height: 600px), (pointer: coarse) and (min-width: 601px) {
                .skill-head { flex-direction: row !important; flex-wrap: nowrap !important; align-items: center !important; gap: 4px !important; margin-bottom: 2px !important; }
                .skill-titlebar { flex: 1 1 auto; min-width: 0; flex-wrap: nowrap !important; gap: 5px !important; overflow: hidden; }
                .skill-title { flex: 0 0 auto; font-size: clamp(.76rem, 1.7vw, .94rem) !important; white-space: nowrap; }
                .skill-sub { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: clamp(.56rem, 1.25vw, .7rem) !important; }
                .skill-actions { flex: 0 1 auto; width: auto !important; min-width: 0; justify-content: flex-end !important; flex-wrap: nowrap !important; gap: 2px !important; margin-left: auto; }
                .skill-actions .opt-btn { flex: 0 1 auto; min-width: 0; padding: 1px 4px !important; font-size: clamp(.54rem, 1.35vw, .66rem) !important; line-height: 1.25; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
                .skill-actions .opt-btn svg { width: 12px; height: 12px; }
                .skill-viewport { min-height: 0; }
            }
            body.opt-tree-light {
                --opt-page: #f5f5f5;
                --opt-card: #ffffff;
                --opt-soft: #ededed;
                --opt-ink: #1f1f1f;
                --opt-muted: #666666;
                --opt-line: rgba(0, 0, 0, .18);
                --opt-hover: rgba(0, 0, 0, .06);
            }
            body.opt-tree-light .skill-panel,
            body.opt-tree-light .skill-viewport { background-color: var(--opt-page) !important; color: var(--opt-ink) !important; }
            body.opt-tree-light .skill-card,
            body.opt-tree-light .skill-branch-card { background-color: var(--opt-card) !important; color: var(--opt-ink) !important; border-color: var(--opt-line) !important; box-shadow: 0 1px 2px rgba(0,0,0,.08) !important; }
            body.opt-tree-light .skill-name,
            body.opt-tree-light .skill-branch-card strong,
            body.opt-tree-light .skill-title,
            body.opt-tree-light .skill-settings-title { color: var(--opt-ink) !important; }
            body.opt-tree-light .skill-ver,
            body.opt-tree-light .skill-branch-card small,
            body.opt-tree-light .skill-field-help,
            body.opt-tree-light .skill-settings-empty { color: var(--opt-muted) !important; }
            body.opt-tree-light .skill-icon,
            body.opt-tree-light .skill-drag-handle,
            body.opt-tree-light .skill-branch-menu { color: #555 !important; }
            body.opt-tree-light .skill-icon:hover,
            body.opt-tree-light .skill-drag-handle:hover { background: var(--opt-hover) !important; color: #000 !important; }
            body.opt-tree-light .opt-btn,
            body.opt-tree-light .skill-head button,
            body.opt-tree-light .skill-array-add-head { background: var(--opt-soft) !important; color: var(--opt-ink) !important; border-color: var(--opt-line) !important; }
            body.opt-tree-light .skill-tray,
            body.opt-tree-light .skill-tray-item { background: var(--opt-card) !important; color: var(--opt-ink) !important; border-color: var(--opt-line) !important; }
            body.opt-tree-light .skill-inline-panel,
            body.opt-tree-light .skill-output-pop,
            body.opt-tree-light .skill-settings-pop,
            body.opt-tree-light .skill-confirm-box,
            body.opt-tree-light .skill-array-dialog-box { background: var(--opt-card) !important; color: var(--opt-ink) !important; border-color: var(--opt-line) !important; }
            body.opt-tree-light .skill-inline-head,
            body.opt-tree-light .skill-output-head,
            body.opt-tree-light .skill-settings-pop-head { background: var(--opt-card) !important; color: var(--opt-ink) !important; border-color: var(--opt-line) !important; }
            body.opt-tree-light .skill-output-log { background: #f7f7f7 !important; color: #222 !important; }
            body.opt-tree-light .skill-settings-tab { background: var(--opt-soft) !important; color: #333 !important; border-color: var(--opt-line) !important; }
            body.opt-tree-light .skill-settings-tab.active { background: var(--opt-card) !important; color: #000 !important; border-color: #e67e00 !important; }
            body.opt-tree-light .skill-panel .skill-field input[type="text"],
            body.opt-tree-light .skill-panel .skill-field input[type="number"],
            body.opt-tree-light .skill-panel .skill-field input[type="password"],
            body.opt-tree-light .skill-panel .skill-field select,
            body.opt-tree-light .skill-panel .skill-field textarea,
            body.opt-tree-light .skill-array-dialog .skill-array-dialog-field input[type="text"],
            body.opt-tree-light .skill-array-dialog .skill-array-dialog-field input[type="number"],
            body.opt-tree-light .skill-array-dialog .skill-array-dialog-field input[type="password"],
            body.opt-tree-light .skill-array-dialog .skill-array-dialog-field select,
            body.opt-tree-light .opt-confirm-input { background-color: #fff !important; color: #111 !important; border-color: #bbb !important; box-shadow: none !important; }
            body.opt-tree-light .skill-array-head span,
            body.opt-tree-light .skill-array-cell::before { color: #666 !important; }
            body.opt-tree-light .skill-array-cell { color: #222 !important; }
            body.opt-tree-light .skill-array-data,
            body.opt-tree-light .skill-array-nested { border-color: rgba(0,0,0,.14) !important; }
            body.opt-tree-light .skill-array-action { color: #555 !important; }
            body.opt-tree-light .skill-array-action:hover { background: var(--opt-hover) !important; color: #000 !important; }
            body.opt-tree-light .skill-field-block.field-sep { border-bottom-color: rgba(0,0,0,.12) !important; }
            body.opt-tree-light .skill-settings-meta { border-bottom-color: rgba(0,0,0,.12) !important; }
            body.opt-tree-light .skill-switch::before { background: rgba(0,0,0,.22) !important; box-shadow: inset 0 0 0 1px rgba(0,0,0,.12) !important; }
            body.opt-tree-light .skill-switch::after { background: #fff !important; border-color: #bbb !important; }
            body.opt-tree-light .skill-switch:has(input:checked)::before { background: #ff9900 !important; }
            body.opt-tree-light .skill-switch:has(input:checked)::after { background: #ff9900 !important; }
            body.opt-tree-light .skill-inline-resizer { background: linear-gradient(to bottom, transparent, rgba(0,0,0,.08)) !important; border-top-color: rgba(0,0,0,.15) !important; }
            body.opt-tree-light .opt-confirm-text,
            body.opt-tree-light .skill-array-dialog-title,
            body.opt-tree-light .skill-output-title { color: #222 !important; }
            body.opt-tree-light .opt-toast { background: #fff !important; color: #222 !important; border-color: var(--opt-line) !important; }
            body.opt-tree-light .skill-menu { background: #fff !important; color: #222 !important; border-color: var(--opt-line) !important; }
            body.opt-tree-light .skill-menu button { color: #222 !important; }
            body.opt-tree-light .skill-menu button:hover { background: var(--opt-hover) !important; }
            @media (max-width: 900px) { .opt-grid { grid-template-columns: 1fr; } .opt-fields-3 { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
        `
        document.head.appendChild(style)
    }

    // ============================================================
    //  Bootstrap
    // ============================================================
    let scheduled = false
    function schedule() {
        if (scheduled) return
        scheduled = true
        requestAnimationFrame(() => {
            scheduled = false
            try { ensureUi() } catch (e) { debugError('UI', e) }
        })
    }

    function ensureUi() {
        ensureSidebarButton()
        const list = findTablist()
        if (!list) return
        const tabsRoot = list.closest('.MuiTabs-root')
        if (!tabsRoot) return
        state.tabsRoot = tabsRoot
        state.root = tabsRoot.parentElement
        ensureTab(list)
        ensureSkillTab(list)
        ensureSkillPanel(list)
        if (isPluginTreePage() && !state.skillActive) state.sidebarPending = true
        if (state.sidebarPending && location.hash.includes('/plugins/installed')) {
            state.sidebarPending = false
            setTimeout(() => {
                try { activateSkillTab() } catch (e) { debugError('skill tree', e) }
            }, 0)
        }
        if (state.active) {
            hideNativePane()
            if (state.panel) state.panel.style.display = 'block'
            if (state.skillPanel) state.skillPanel.style.display = 'none'
            if (state.tab) {
                state.tab.classList.add('Mui-selected')
                state.tab.setAttribute('aria-selected', 'true')
            }
        }
        if (state.skillActive) {
            hideNativePane()
            setNativeTabsVisible(false)
            if (state.skillPanel) state.skillPanel.style.display = 'flex'
            if (state.panel) state.panel.style.display = 'none'
            if (state.skillTab) {
                state.skillTab.classList.add('Mui-selected')
                state.skillTab.setAttribute('aria-selected', 'true')
            }
        }
        ensureToolbar()
        applyHidden()
        ensureRows()
        restoreNativeSort()
        setIndicator()
        updateSidebarActive()
    }

    function uiColorLuminance(color) {
        const match = String(color || '').match(/rgba?\(([^)]+)\)/i)
        if (!match) return null
        const parts = match[1].split(',').map(Number)
        if (parts.length < 3 || parts.some((n, i) => i < 3 && !Number.isFinite(n))) return null
        if ((parts[3] ?? 1) < 0.2) return null
        return (0.2126 * parts[0] + 0.7152 * parts[1] + 0.0722 * parts[2]) / 255
    }

    function applyLightControlStyles() {
        const light = document.body.classList.contains('opt-tree-light')
        const controls = document.querySelectorAll([
            '.skill-panel .skill-field input[type="text"]',
            '.skill-panel .skill-field input[type="number"]',
            '.skill-panel .skill-field input[type="password"]',
            '.skill-panel .skill-field select',
            '.skill-panel .skill-field textarea',
            '.skill-array-dialog .skill-array-dialog-field input',
            '.skill-array-dialog .skill-array-dialog-field select',
            '.opt-confirm-input',
        ].join(','))
        for (const control of controls) {
            if (light) {
                control.dataset.optLightStyle = '1'
                control.style.setProperty('background-color', '#ffffff', 'important')
                control.style.setProperty('color', '#111111', 'important')
                control.style.setProperty('border-color', '#bbbbbb', 'important')
                control.style.setProperty('box-shadow', 'none', 'important')
            } else if (control.dataset.optLightStyle) {
                delete control.dataset.optLightStyle
                control.style.removeProperty('background-color')
                control.style.removeProperty('color')
                control.style.removeProperty('border-color')
                control.style.removeProperty('box-shadow')
            }
        }
    }

    function updateTreeTheme() {
        let light = null
        const candidates = [
            document.body,
            document.querySelector('#root'),
            document.querySelector('main'),
            document.querySelector('.MuiPaper-root'),
        ]
        for (const el of candidates) {
            if (!el) continue
            const luminance = uiColorLuminance(getComputedStyle(el).backgroundColor)
            if (luminance != null) {
                light = luminance > 0.55
                break
            }
        }
        if (light == null) light = window.matchMedia?.('(prefers-color-scheme: light)').matches || false
        document.body.classList.toggle('opt-tree-light', !!light)
        if (state.outputEl) {
            const surface = light ? '#ffffff' : getComputedStyle(state.outputEl).backgroundColor
            const head = state.outputEl.querySelector('.skill-output-head')
            const log = state.outputEl.querySelector('.skill-output-log')
            if (head) head.style.setProperty('background-color', surface, 'important')
            if (log) log.style.setProperty('background-color', surface, 'important')
        }
        applyLightControlStyles()
    }

    function start() {
        ensureStyle()
        loadLocalHidden()
        ensureSidebarButton()
        ensureUi()
        refreshStatus().catch(() => {})
        try {
            new MutationObserver(schedule).observe(document.body, { childList: true, subtree: true })
        } catch {}
        window.addEventListener('popstate', () => {
            if (isPluginTreePage()) {
                state.sidebarPending = true
                schedule()
            } else if (state.skillActive) {
                deactivateSkillTab()
            }
        })
        window.addEventListener('hashchange', () => {
            updateRouteAttribute()
            state.gridApi = null
            if (!location.hash.includes('/plugins/installed')) state.sidebarPending = false
            if (state.active) deactivateTab()
            if (state.skillActive && !location.hash.includes('/plugins/installed')) deactivateSkillTab()
            updateSidebarActive()
            schedule()
        })
        window.addEventListener('resize', schedule)
        setInterval(() => {
            // Safety net for React re-renders that replace the tab list.
            if (!state.tab || !state.tab.isConnected) schedule()
            else if (state.active) applyHidden()
            else if (onInstalledList()) restoreNativeSort()
        }, 2500)
        setInterval(() => { if (state.skillActive) loadTreeUpdates() }, 600000)
        updateTreeTheme()
        try {
            new MutationObserver(updateTreeTheme).observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'style'] })
            new MutationObserver(updateTreeTheme).observe(document.body, { attributes: true, attributeFilter: ['class', 'style'] })
        } catch {}
        setInterval(updateTreeTheme, 1500)
        setInterval(async () => {
            if (!state.skillActive) return
            await loadServerDownloads()
            if (!Object.keys(readPendingDownloads()).length) return
            try { await refreshTreeInstalled() } catch {}
            applyPendingDownloadFeedback()
            processDownloadQueue()
            processTreeActions()
        }, 5000)
    }

    if (document.body) start()
    else document.addEventListener('DOMContentLoaded', start, { once: true })
})()


