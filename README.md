

This management system makes it convenient for everyone, after installation, to intuitively browse from this blueprint all the plugins I am currently developing, refining, and using, and to easily install and activate them at any time.


GitHub-only VPN proxy + persistent cache for plugin/HFS updates, a portable plugin catalog mirror, admin-panel Installed enhancements, and a draggable visual Plugin Skill Tree.



https://github.com/user-attachments/assets/2daba579-2ce6-448d-ad71-8a643e5e4907



<img width="4096" height="3072" alt="IMG_20261121_003933" src="https://github.com/user-attachments/assets/94fb6965-24f4-40dc-8c00-cdbe6a3eb9fd" />
<img width="4096" height="3072" alt="IMG_20261121_003938" src="https://github.com/user-attachments/assets/c46760e3-34c3-4793-860a-e8edeba53075" />
<img width="4096" height="3072" alt="IMG_20261121_003951" src="https://github.com/user-attachments/assets/6dc476eb-87f9-4225-b1f7-4c203f4db7be" />


https://github.com/user-attachments/assets/4797c9d6-fb02-49f9-a33e-9668d807669d



# Plugins-Optimizer

Plugins-Optimizer is an HFS 3 admin-panel extension with a GitHub-only proxy,
a persistent GitHub cache, a portable plugin catalog mirror, and a visual
PluginTree for arranging installed plugins.

Requires HFS 3.4.2 or newer (plugin API 13.73).

## Features

### GitHub proxy

- Routes only the hosts listed in `githubHosts` through the configured proxy.
- Used for plugin installs, plugin updates, and HFS updates.
- All other traffic keeps using the normal network path.
- Optional GitHub token support for a higher GitHub API rate limit.
- Automatic direct retry when the proxy returns a GitHub API rate-limit
  response. HFS release assets are always fetched directly.

### Persistent GitHub cache

- Cache files live in `storage/cache/`.
- Cache index lives in `storage/meta.json`.
- Supports GET/HEAD, ETag/If-None-Match, stale-while-revalidate, and a
  failure blacklist.
- Failed `403`/`429` responses are never served from cache.

### Plugin catalog mirror

- Snapshot: `storage/catalog.json`.
- Periodic sync from GitHub (default every 6 hours).
- The mirror survives restarts and can be refreshed manually with Sync now.

### Installed page extension

- Adds the OPTIMIZER settings tab next to the native plugin tabs.
- Adds a PluginTree entry in the left sidebar.
- Uses the native Installed grid for plugin actions.
- Hides the duplicate page title so all plugin tabs share the same top edge.

### PluginTree

- Horizontal tree: HFS root, frontend/backend mains, categories, and plugin
  cards.
- Drag a card by its grip handle to move the card and its directly contained
  plugins.
- Hold Shift while dragging to move the whole unlocked subtree.
- Locked branches and cards cannot be moved.
- Right-click a plugin name to cycle its border colour.
- Long-press a plugin name to reset its colour.
- Click a plugin name to confirm opening that plugin's native admin dialog.
- Starred plugins are kept when saving a default layout.
- Plugin version changes show a left yellow strip for 3 days.
- Plugin configuration changes show a right green strip for 1 day.
- Missing, uninstalled plugins stay in the tree until explicitly removed with
  the trash button.

### Inline plugin settings

- Reads the plugin's `exports.config`.
- Supports `config_tab`, `showIf`, helper text, numbers, booleans, selects,
  arrays, and text fields.
- `date_time` fields use the browser's native date/time picker.
- `vfs_path` fields open a virtual-server path browser.
- `real_path` fields open a server-filesystem browser with optional file mask.
- Repo metadata is shown as `Repo: plugin-name author-name`.
- `hugo529100` and `Hugo29100` are displayed as `Hug3O`.

### Layout snapshots

- Current layout: `storage/tree.json`
- Automatic backup: `storage/tree.backup.json`
- Snapshot before Reset: `storage/tree.before-reset.json`
- Default layout: `public/tree.default.json`
- After a plugin update with existing storage, the first PluginTree visit
  offers a one-time Restore toast to refresh the saved layout.

## Configuration

| Key | Default | Description |
| --- | --- | --- |
| `proxyEnabled` | `false` | Enable the GitHub-only proxy |
| `proxyHost` | `192.168.1.224` | Proxy host |
| `proxyPort` | `10809` | Proxy port |
| `githubHosts` | GitHub host list | Hosts routed through the proxy |
| `cacheEnabled` | `false` | Enable the persistent cache |
| `ttlHours` | `24` | General cache TTL |
| `pluginTtlHours` | `6` | Plugin file cache TTL |
| `maxAgeDays` | `30` | Maximum cache retention |
| `catalogSyncHours` | `6` | Catalog sync interval; `0` disables it |
| `githubToken` | empty | Optional GitHub PAT |
| `debug` | `false` | Verbose server/frontend logging |

If HFS has a global outbound proxy configured, HFS uses it first for GitHub
requests; the proxy configured here is only a fallback.

## Storage

```text
storage/
  cache/                 GitHub response cache
  meta.json              Cache index and statistics
  catalog.json           Plugin catalog mirror
  tree.json              Current PluginTree layout
  tree.backup.json       Automatic tree backup
  tree.before-reset.json Snapshot from before Reset
  ui.json                Open panels and panel heights
  hidden.json            Legacy hidden-list data
```

## Notes

- Unauthenticated GitHub API requests are limited to 60 per hour. Configure
  `githubToken` for heavier browsing or catalog syncs.
- The PluginTree layout is stored on the server, so it is shared by all admin
  browsers.
- Reset only reorders the current layout; it does not rebuild or erase saved
  categories.
