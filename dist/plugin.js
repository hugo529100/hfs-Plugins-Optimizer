// plugin.js - Plugins Optimizer
// One plugin for:
//   1) a GitHub-only outbound HTTP proxy (VPN tunnel) used by plugin installs/updates and HFS updates;
//   2) a persistent on-disk cache for GitHub API / raw plugin files;
//   3) a portable plugin-catalog mirror in the plugin's storage folder;
//   4) an admin-panel extension: hide/show installed plugins and an "Optimizer" settings tab.
//
// The proxy is deliberately scoped: only hostnames in `githubHosts` are tunneled.
// Everything else keeps using the normal network path.

exports.version = 38.1
exports.apiRequired = [12.7, 13.72]
exports.description = "GitHub-only VPN proxy + persistent cache for plugin/HFS updates, a portable plugin catalog mirror, admin-panel Installed enhancements, and a draggable visual Plugin Skill Tree."
exports.repo = "Hug3O/Plugins-Optimizer"
exports.preview = []
exports.changelog = [
    { version: 38.1, message: "Support string-array select options so Video-player's Error Notification Style shows Overlay/Toast instead of undefined." },
    { version: 38, message: "Keep the version-change strip on the left border and move the config-change strip to the right border." },
    { version: 37.9, message: "Make change-signal strip colors fully opaque while keeping the fade pulse animation." },
    { version: 37.8, message: "Compare versions from each plugin.js file on every tree load/refresh so direct source edits are detected too." },
    { version: 37.7, message: "Dropping a plugin on a trunk now assigns it directly to the root and renders it below the trunk card." },
    { version: 37.6, message: "Remove the left-side hierarchy clamp so child branches can be placed left of their parents." },
    { version: 37.5, message: "Move a branch card together with its directly contained plugins; Shift also includes unlocked sub-branches." },
    { version: 37.4, message: "Allow moving only through the grip: default moves one card, Shift moves only unlocked descendants; card bodies no longer drag." },
    { version: 37.3, message: "Invert drag behavior: card drag moves only the node, Shift+drag moves the whole branch." },
    { version: 37.2, message: "Alt/Option-drag a branch card to move only that branch node, leaving all descendants in place." },
    { version: 37.1, message: "Move the full recursive branch when dragging a branch card, while the grip handle moves only that node." },
    { version: 37, message: "On locked branches, dragging a node pans the tree instead of doing nothing." },
    { version: 36.9, message: "Deduplicate connector paths and composite them once at group opacity so overlaps no longer brighten into white lines." },
    { version: 36.8, message: "Equalize the lock, visibility and menu button sizes on branch headers, including touch layouts." },
    { version: 36.7, message: "Version bump." },
    { version: 36.6, message: "Speed up the change-strip pulse from 3.2s to 2.2s." },
    { version: 36.5, message: "Use a flat solid color for the change strip instead of a vertical gradient." },
    { version: 36.4, message: "Pin the change strip to the inner left edge and raise its center opacity to 70%." },
    { version: 36.3, message: "Move the change strip closer to the inner border and shorten it to one third of the card height." },
    { version: 36.2, message: "Use a semi-transparent gradient strip immediately beside the category color bar as the change signal." },
    { version: 36.1, message: "Turn the change signal into a soft color wash along the inner left edge instead of a cast shadow." },
    { version: 36, message: "Shift the change glow just inside the left color strip and cast it to the right so the strip stays clear." },
    { version: 35.9, message: "Paint the left signal glow behind the card surface and reduce its spread." },
    { version: 35.8, message: "Replace change-signal inner shadows with a soft glowing outer bar on the card's left border." },
    { version: 35.7, message: "Apply the compact one-row toolbar layout on coarse-pointer tablets including iPad portrait and landscape." },
    { version: 35.6, message: "Fade change-signal glows from fully transparent and tighten inner corner radius to hug the card border." },
    { version: 35.5, message: "Reduce the orange-yellow version-change glow opacity." },
    { version: 35.4, message: "Tighten the signal-glow edge and shift the version-change glow to orange-yellow." },
    { version: 35.3, message: "Increase change-signal inner-shadow opacity and spread so version and config changes are clearly distinguishable." },
    { version: 35.2, message: "Remove the crisp inset outline from change signals, leaving only the soft blurred inner glow." },
    { version: 35.1, message: "Track plugin version/config changes and show 3-day yellow or 1-day green inner-glow signals on cards." },
    { version: 35, message: "Move + Trunk to the first position in the PluginTree toolbar." },
    { version: 34.9, message: "Make the PLUGIN TREE tab enter the same tree-only page as the sidebar entry: tabs hidden and PluginTree sidebar selected." },
    { version: 34.8, message: "Use the dark plugin-card surface mix for expanded hidden-row masks instead of the category accent color." },
    { version: 34.7, message: "Make the PLUGIN TREE tab navigate to /~/admin/?pluginTree=1#/plugins/installed instead of only swapping the current tab content." },
    { version: 34.6, message: "Render the PLUGIN TREE tab first with CSS order while keeping it last in the React tablist, preserving native tab indices." },
    { version: 34.5, message: "Add a PLUGIN TREE tab to the left of INSTALLED for quick access, while keeping the tab bar visible." },
    { version: 34.4, message: "Give expanded hidden plugin rows a same-width accent backdrop and temporarily raise their stacking layer." },
    { version: 34.3, message: "Keep the bottom unarranged tray on a single compact line on desktop and mobile." },
    { version: 34.2, message: "In short landscape viewports, place Reset/Restore/Save/Trunk/Refresh/Fullscreen on the title row with fluid compact text." },
    { version: 34.1, message: "Persist the open Plugin output window across tree refreshes and full page reloads until it is closed manually." },
    { version: 34, message: "Keep a 1px gap between the mobile drag handle and power button instead of overlapping their hit areas." },
    { version: 33.9, message: "Tighten the drag/power spacing on mobile and show the plugin version in the card bar." },
    { version: 33.8, message: "Remove the Exit label from the fullscreen button and add a Refresh button that reloads the tree without leaving fullscreen." },
    { version: 33.7, message: "Replace the Plugin Tree tab with the dedicated Optimizer settings tab that was recently removed." },
    { version: 33.6, message: "Restore a dedicated PLUGIN TREE tab in the Installed plugins tab bar, alongside the native tabs." },
    { version: 33.5, message: "Apply light-theme control colors inline so admin accent rules cannot make settings inputs orange." },
    { version: 33.4, message: "Strengthen light-theme input selectors so accent-colored admin styles cannot paint settings inputs orange." },
    { version: 33.3, message: "Detect the admin light/day theme and adapt Plugin Skill Tree surfaces, text, inputs, dialogs and arrays." },
    { version: 33.2, message: "Color the settings panel bottom resizer border and corner grip with the plugin accent." },
    { version: 33.1, message: "Force the panel accent border color with !important so theme border overrides cannot replace it." },
    { version: 33, message: "Match each expanded panel/output left border color and width to its plugin card accent." },
    { version: 32.9, message: "Render wide array tables with many columns as compact two-column cards with ellipsized values instead of a broken horizontal grid." },
    { version: 32.8, message: "Stretch mobile array rows full width so field labels and values align at the card edges." },
    { version: 32.7, message: "Stack array table fields on mobile portrait so nested schedule-window rows no longer collapse into a broken grid." },
    { version: 32.6, message: "Initialize the output element before positioning it below an open settings panel." },
    { version: 32.5, message: "Stack Plugin output below an open settings panel instead of overlapping it, and swap the output/delete button order." },
    { version: 32.4, message: "Give the array Add/Modify dialog an opaque base surface matching the settings panel." },
    { version: 32.3, message: "Force Plugin output header and log to use the same opaque surface color as the popup background." },
    { version: 32.2, message: "Give the Plugin output window the same opaque base mask as the settings panel and lift it above neighboring plugins." },
    { version: 32.1, message: "Match the native array table: read-only grid rows, header + Add, Modify/Delete row actions, and a row dialog for editing." },
    { version: 32, message: "Merge descriptions into expanded settings under the repo line, and turn the freed card button into a live Plugin output window." },
    { version: 31.9, message: "Render native array/table config fields (targets and nested schedule windows) in PluginTree settings." },
    { version: 31.8, message: "Remove the 500px cap so inline settings panels expand to the full content height." },
    { version: 31.7, message: "Add a subtle bottom shadow under expanded inline panels for better visual hierarchy." },
    { version: 31.6, message: "Keep following plugins in place when a settings panel expands; the focused branch layer overlays them instead." },
    { version: 31.5, message: "Let inline panels scale with the tree zoom instead of counter-scaling, keeping layout stable at every zoom level." },
    { version: 31.4, message: "Convert inline panel visual height back into world units before laying out following plugins." },
    { version: 31.3, message: "Trigger one relayout after the rendered settings-panel height changes, even when the stored height did not." },
    { version: 31.2, message: "Use the rendered inline panel height when laying out following plugins so expanded settings cannot overlap them." },
    { version: 31.1, message: "Relayout the tree when an inline settings panel auto-resizes, preventing overlap with following plugins." },
    { version: 31, message: "Keep expanded settings close to the following plugin and raise the focused directory branch above neighboring plugins." },
    { version: 30.9, message: "Smooth pinch zoom by updating transforms once per frame and only snapping to integer pixels after the gesture ends." },
    { version: 30.8, message: "Hide the zoom +/- buttons on touch/mobile layouts; pinch zoom remains available." },
    { version: 30.7, message: "Deduplicate tree nodes only when their versions match (or one is unknown); different versions stay separate." },
    { version: 30.6, message: "Deduplicate tree plugin entries that normalize to the same plugin ID, such as Prevent-disk-sleep/Prevent-disksleep." },
    { version: 30.5, message: "Automatically prune description entries that are neither installed, starred, nor referenced by the tree." },
    { version: 30.4, message: "Add a faint bottom-right-to-transparent gradient to color-customized branch/category cards, excluding plugin rows." },
    { version: 30.3, message: "Match every confirmation dialog background to the plugin card background color." },
    { version: 30.2, message: "Separate visible settings fields with a subtle horizontal divider." },
    { version: 30.1, message: "Remove the small overlap between the plugin card and its attached inline panel." },
    { version: 30, message: "Size inline settings/description panels to the plugin card's visual width and attach them flush beneath the card." },
    { version: 29.9, message: "Keep inline description/settings panels at native scale so switching tabs no longer blurs their text; remove the tree's will-change rasterization." },
    { version: 29.8, message: "Remove per-tab bottom borders and draw one continuous baseline beneath the category tab strip." },
    { version: 29.7, message: "Wrap overflowing category tabs, outline inactive tabs, and remove the active tab bottom border/rounding." },
    { version: 29.6, message: "Shrink the switch track/thumb slightly so it sits in proportion with the settings text." },
    { version: 29.5, message: "Use theme-proof Notes-style category tabs with transparent inactive tabs and top-rounded active outline." },
    { version: 29.4, message: "Style Configuration Category selectors like the Notes plugin tab strip, including automatic detection by label/helper text." },
    { version: 29.3, message: "Shrink the switch thumb and give the unchecked switch a translucent dark track." },
    { version: 29.2, message: "Render Configuration Category as compact text tabs instead of a labeled bordered tab strip." },
    { version: 29.1, message: "Match the switch controls to the native HFS/MUI switch dimensions and colors." },
    { version: 29, message: "Make PluginTree settings behave like native HFS forms: dynamic show-if fields, multiline/path inputs, and small switch controls." },
    { version: 28.2, message: "Limit the PluginTree download queue to one entry at a time." },
    { version: 28.1, message: "Show green outlines for queued start actions, yellow outlines for queued updates, and a yellow outline on update-available cards." },
    { version: 28, message: "Track HFS pluginDownload events server-side and restore active downloads after page refreshes, including downloads not started by PluginTree." },
    { version: 27.9, message: "Add an Update button to plugins with an available update, including queued updates during downloads." },
    { version: 27.8, message: "Use a blue slow outline for the active download and a purple slow outline for queued downloads." },
    { version: 27.7, message: "Show a slow semi-transparent purple outline while a plugin download is active." },
    { version: 27.6, message: "Replace raw 404 stack traces with a readable package/support-plugin message." },
    { version: 27.5, message: "Queue plugin start/stop/uninstall actions while downloads are active, and persist those actions across page refreshes." },
    { version: 27.4, message: "Apply the same fuzzy ID matching to the Unarranged count in the PluginTree header." },
    { version: 27.3, message: "Fuzzy-match PluginTree IDs across case, hugo529100-/hfs- prefixes and trailing + so already-arranged plugins no longer appear in Unarranged." },
    { version: 27.2, message: "Click the flashing/queued install button again to cancel that download or remove it from the queue." },
    { version: 27.1, message: "Show plugin dependency/runtime errors on PluginTree cards and turn HTTP 424 into a named missing-support-plugin message." },
    { version: 27, message: "Add a persistent download queue for PluginTree: multiple installs wait in order and the active/queued state is restored after a page refresh." },
    { version: 26.9, message: "Persist active PluginTree downloads across page refreshes and restore their flashing progress until the plugin appears." },
    { version: 26.8, message: "Downloading a plugin from PluginTree no longer enables or starts it; the user starts it explicitly." },
    { version: 26.7, message: "Move the Debug logging switch to the bottom of the settings form." },
    { version: 26.6, message: "Remove the Enable network modules master switch; proxy and cache modules are now configured only by their own switches." },
    { version: 26.5, message: "Hide the trailing -main suffix in PluginTree display names while keeping it in stored IDs." },
    { version: 26.4, message: "Pulse the plugin card border with a slow yellow glow when HFS reports an available update." },
    { version: 26.3, message: "Prevent PluginTree from uninstalling Plugins-Optimizer itself; hide its delete control and guard the uninstall action." },
    { version: 26.2, message: "Treat hfs- and -main as naming aliases so downloaded plugins light up their existing tree node and stay out of Unarranged; hide the hfs- prefix in labels." },
    { version: 26.1, message: "Suppress HFS's stale 'plugin failing' banner after verifying that no installed plugin reports an error or bad API." },
    { version: 26, message: "Declare an HFS API compatibility range so HFS no longer flags this plugin as designed for an older server." },
    { version: 25.9, message: "Flash the failed plugin's card border red for 12 seconds after an install failure." },
    { version: 25.8, message: "Pulse error/failure toasts with a slow red outer border; mark failed download percentages red." },
    { version: 25.7, message: "Flash the install button and show an estimated download percentage while a PluginTree install is running." },
    { version: 25.6, message: "Show immediate install/start/failure toasts, keep them visible in fullscreen, and refresh the PluginTree card after activation." },
    { version: 25.5, message: "Add a per-load admin-page token for custom REST calls, so admin-only endpoints work even when HFS account APIs differ across servers." },
    { version: 25.4, message: "Recognize custom-named HFS admin accounts instead of only the literal admin username." },
    { version: 25.3, message: "Remove the Installed-page EventSource interceptor and custom footer Refresh button." },
    { version: 25.2, message: "Remove the injected Optimizer tab now that Skill Tree is opened from the sidebar; clean up its old panel." },
    { version: 25.1, message: "Render the empty Unarranged label and hint at 50% opacity." },
    { version: 25, message: "Replace the hidden empty Unarranged tray with a dim drop-zone hint that accepts dragged plugins." },
    { version: 24.9, message: "Hide the Unarranged tray entirely when no plugins are unarranged." },
    { version: 24.8, message: "Mount built-in confirm dialogs inside the fullscreen Skill Tree so they remain visible in fullscreen mode." },
    { version: 24.7, message: "Always show the resolved repo at the top of a plugin's settings form, without displaying the author." },
    { version: 24.6, message: "Remove author from the settings preview and restore repo display, now also falling back to the repo stored in descriptions." },
    { version: 24.5, message: "Include repo and author in descriptions.json/descriptions.js and show them in online settings previews." },
    { version: 24.4, message: "Use a deeper theme-derived confirm surface without a full-page dimming overlay." },
    { version: 24.3, message: "Force an opaque dark background on every built-in confirmation dialog so theme overrides cannot make it transparent." },
    { version: 24.2, message: "Move toasts below the top-right toolbar and use a darker shade of the current theme background." },
    { version: 24.1, message: "Place the destructive/confirm action on the left and Cancel on the right in all built-in dialogs." },
    { version: 24, message: "Swap Uninstall and settings icon positions, replace all native confirm/prompt dialogs with the built-in dialog, and move toasts to the top-right." },
    { version: 23.9, message: "Measure settings content with auto height so short panels shrink to their real content instead of staying at 260px." },
    { version: 23.8, message: "Auto-size inline settings panels to their content (up to 500px) when first opened or when content grows." },
    { version: 23.7, message: "Slightly reduce settings font sizes and regularize field rows with a two-column grid." },
    { version: 23.6, message: "Pin the inline Save button directly beside the Close button." },
    { version: 23.5, message: "Move Save quick settings into the panel header left of Close; keep it translucent/disabled until a field changes." },
    { version: 23.4, message: "Prefer the installed plugin's local plugin.js when previewing settings, falling back to the remote repo only for missing plugins." },
    { version: 23.3, message: "Parse and preview plugin config fields from online plugin.js for stopped/uninstalled plugins, so their control panels are not empty." },
    { version: 23.2, message: "Automatically refresh descriptions.js on plugin install/update, prefer installed plugin descriptions, and use catalog/online descriptions only as missing-plugin fallback." },
    { version: 23.1, message: "Remove the leftover loading placeholder from stopped plugin settings previews." },
    { version: 23, message: "Show online plugin.js descriptions for uninstalled/stopped plugins and persist descriptions for starred plugins to storage/descriptions.json plus public/descriptions.js." },
    { version: 22.9, message: "Default the independent VPN proxy and GitHub cache modules to off on fresh installs." },
    { version: 22.8, message: "Remove the Network & cache master and Admin panel switches; keep admin UI always active, split proxy/cache settings, and document HFS outbound_proxy precedence." },
    { version: 22.7, message: "Honor HFS' global outbound_proxy setting for GitHub requests, taking precedence over the plugin's own proxy configuration." },
    { version: 22.6, message: "Only inherit marker color from a main branch when it has its own color; root color applies only to plugins attached directly to the root." },
    { version: 22.5, message: "Place direct main plugins 2px below the branch and propagate branch/root colors to their left border marker." },
    { version: 22.4, message: "Enable a freshly downloaded plugin with set_plugin before starting it, so the PluginTree card lights up after install." },
    { version: 22.3, message: "Pass branch=main to download_plugin so installs skip GitHub branch probing, which returned 404 for mirrored Hug3O repos." },
    { version: 22.2, message: "Try both hugo529100 and Hugo29100 owner aliases for Hug3O install fallback." },
    { version: 22.1, message: "Use both plugin id and repo names for Hug3O fallback candidates, including stripping -main and adding hfs-, then exact catalog repo matches." },
    { version: 22, message: "Improve Hug3O install fallback: try hugo529100 name variants from both repo and plugin id, then exact catalog matches, instead of one owner-only URL." },
    { version: 21.9, message: "Route all optimizer console/backend messages through a strict debug check, and retry failed Hug3O plugin downloads against the hugo529100 owner." },
    { version: 21.8, message: "Remove the rejetto divider/grouping and forced Name sort; restore the native Installed grid ordering." },
    { version: 21.7, message: "Stop coloring plugins on normal name clicks; use right-click to cycle plugin color and long-press to reset." },
    { version: 21.6, message: "Allow plugin names to cycle/reset their own color even when the containing category or main is locked; branch lock still protects branch colors." },
    { version: 21.5, message: "Hide the native Plugins tab bar while PluginTree is active, removing stray tabs from the tree layout." },
    { version: 21.4, message: "Fix PluginTree being marked selected while inactive by targeting the native Plugins anchor instead of the injected link." },
    { version: 21.3, message: "Remove the in-page Skill Tree tab and make PluginTree the primary entry with a selected background; deselect Plugins visually while PluginTree is active." },
    { version: 21.2, message: "Keep both PluginTree and Plugins sidebar entries on the normal transparent background." },
    { version: 21.1, message: "Place PluginTree above Plugins and remove the copied selected-state background so both sidebar entries keep the normal background." },
    { version: 21, message: "Remove the Auto-open Skill Tree option and automatic switching; add a PluginTree sidebar item below Plugins that opens the Skill Tree view." },
    { version: 20.8, message: "Match the category-to-first-plugin visual gap to the 2px actual plugin-to-plugin gap." },
    { version: 20.7, message: "Match the category-to-first-plugin gap to the regular 4px plugin-to-plugin gap." },
    { version: 20.6, message: "Add a compact 6px gap between a category card and its first plugin." },
    { version: 20.5, message: "Place category plugins flush against the category card and remove the now-unnecessary category-to-plugin connector lines." },
    { version: 20.4, message: "Give nested category connectors the same small 45-degree chamfer as the parent-level branch connectors." },
    { version: 20.3, message: "Fix nested category connectors with a horizontal lead, and make all category children (including custom-trunk plugins) follow the category marker color." },
    { version: 20.2, message: "Allow dragging a category group into another category, and dragging a main branch into a category to convert it into a category node; add Move to top level." },
    { version: 20.1, message: "Support nested categories (category.parent), with Add subcategory, recursive layout/connectors, locks/colors per level, and reparenting on delete." },
    { version: 20, message: "Fix restoring expanded hidden-item state for categories, whose saved keys are raw category IDs." },
    { version: 19.9, message: "Persist each main/category's hidden-items expanded state in storage/ui.json so eye state survives page reloads." },
    { version: 19.8, message: "Prevent changing or resetting border colors on locked nodes; unlock the node before recoloring." },
    { version: 19.7, message: "Allow Unarranged drag/drop into locked categories without unlocking, and stop auto-expanding collapsed categories when a plugin is added." },
    { version: 19.6, message: "Make a colored category's running child plugins use the same color for their 3px left border marker." },
    { version: 19.5, message: "Keep the 12-color cycle looping, and add a 600ms long-press on branch titles/plugin names to reset that node to its default border color." },
    { version: 19.4, message: "Fix category title clicks: bind the independent color cycle on every category so all categories can be colored." },
    { version: 19.3, message: "Make every node's border color fully independent again; parent colors no longer propagate to children." },
    { version: 19.2, message: "Propagate branch and plugin border colors down the hierarchy unless a deeper node defines its own color." },
    { version: 19.1, message: "Allow plugin cards to cycle the same 12 border colors by clicking the plugin name, persisted in tree.pluginColors." },
    { version: 19, message: "Add per-branch border colors: click a branch title to cycle 12 spectrum colors (default -> red/orange/yellow/green/cyan/blue/purple -> default), persisted in tree JSON." },
    { version: 18.9, message: "Theme unchecked checkboxes dark instead of native white, and show a clear not-loaded state with a Start plugin button when gear settings cannot load." },
    { version: 18.8, message: "Make the info/description button a toggle: pressing it again closes the inline description panel." },
    { version: 18.7, message: "Fix lock inheritance: main/category/plugin locks now honor their own level, so a child can be unlocked and moved locally without unlocking the whole root." },
    { version: 18.6, message: "Replace the exclamation description glyph with an info icon; on touch devices only the inline description opens, with hover popovers disabled." },
    { version: 18.5, message: "Persist opened plugin settings panels and their custom heights in storage/ui.json; gear toggles the panel closed, and the bottom-right resize grip saves height." },
    { version: 18.4, message: "Rename the auto-open setting to entering Plugins and make it enabled by default." },
    { version: 18.3, message: "Compact the mobile Skill Tree toolbar (smaller padding/font, 3px gaps, no wrapping) so Fullscreen stays on the same row." },
    { version: 18.2, message: "Add a 3px highlighted left border marker to every running/loaded plugin card." },
    { version: 18.1, message: "Fix the later info-button rule so the exclamation button also uses the gear's orange highlight color." },
    { version: 18, message: "Use the same orange highlight color as the gear/settings button for the visibility eye, exclamation info and lock buttons." },
    { version: 17.9, message: "Use one neutral action color for the visibility eye, exclamation info button and lock button (locked/unlocked differ only by icon)." },
    { version: 17.8, message: "Show the number of currently running plugins in the Skill Tree header next to installed and unarranged counts." },
    { version: 17.7, message: "Make the root lock a master switch: clicking it unlocks or locks every main branch and category in that trunk at once." },
    { version: 17.6, message: "Make every root, main branch and category locked by default; unlock each level explicitly to edit." },
    { version: 17.5, message: "Add an individual lock to every category card (all branches now lockable), pinning its plugins and preventing drops/reorders." },
    { version: 17.4, message: "Remove all lock/unlock toast popups; locked nodes silently ignore drag attempts." },
    { version: 17.3, message: "Match the mobile lock button to the 32px eye/menu buttons and reserve enough right padding for the tight toolbar." },
    { version: 17.2, message: "Group lock, visibility and menu buttons into one tight flex toolbar so the lock is never covered on mobile." },
    { version: 17.1, message: "Enforce the 80px root-to-main gap even for custom main positions and force the eye visibility button to the shared neutral action color." },
    { version: 17, message: "Widen root cards to 340px for a longer root lead-in, add per-main-branch locks that pin the whole subtree, and unify info/visibility icon colors." },
    { version: 16.9, message: "Remove the Fit toolbar button and add a per-trunk lock (locked by default); the trunk and its branches/plugins cannot be moved or re-targeted until unlocked." },
    { version: 16.8, message: "Shift the vertical connector spine slightly left to 44px from the card edge, next to the power switch." },
    { version: 16.7, message: "Position the vertical connector spine at 52px from the card's left edge, right next to the power switch." },
    { version: 16.6, message: "Move the vertical connector spine to 20% of the child card width (the opposite side)." },
    { version: 16.5, message: "Move the category/direct-plugin vertical spine from the left edge to 80% of the child card width, behind the cards." },
    { version: 16.4, message: "Route category/direct-plugin vertical connectors along the left edge (14px rail) instead of the card center, with a short horizontal entry into each child." },
    { version: 16.3, message: "Remove the small left horizontal stub from root trunks; main/category connector paths keep their horizontal lead-in." },
    { version: 16.2, message: "Enforce an 80px minimum horizontal gap between a main branch and every category, including custom-dragged categories." },
    { version: 16.1, message: "Increase the main-to-category horizontal gap and remove duplicate standalone stubs on mains/categories; their connector paths already end with the horizontal lead-in." },
    { version: 16, message: "Fix category/plugin connector overlap by using the real 56px category height, start plugin slots 14px below the category, and make left stubs the same neutral line color." },
    { version: 15.9, message: "Connect the left horizontal stub into the incoming branch path for every root, main branch and category, so no connector ends as a bare vertical line." },
    { version: 15.8, message: "Remove the heavy animated dots from branch connectors and disable all box/text shadows and backdrop blur inside the Skill Tree panel." },
    { version: 15.7, message: "Restore now selects the newest saved layout between Save default and the pre-Reset snapshot, preventing older layouts from shifting the tree." },
    { version: 15.6, message: "Keep the connector dot animation active even when the OS requests reduced motion." },
    { version: 15.5, message: "Add animated dots travelling along every branch connector and a short horizontal lead-in stub on the left of each root and main branch." },
    { version: 15.4, message: "Remove branch swap/order mechanics (free placement + Reset/Save default instead) and make direct plugins sit 14px magnetically under their main branch." },
    { version: 15.3, message: "Make the Restore button directly restore the pre-Reset layout snapshot; right-click opens local/other snapshot choices." },
    { version: 15.2, message: "Reset now snapshots the full tree including all custom coordinates, so Restore can bring back the exact pre-reset layout." },
    { version: 15.1, message: "Reset now ranks sibling branches, categories and plugins by their distance to the parent node, so items closest to the parent are placed earlier in the reset sequence." },
    { version: 15, message: "Save default now records the current coordinates of every visible root, branch, category and plugin before freezing the public tree." },
    { version: 14.9, message: "Dragging a branch onto another branch now swaps one position instead of pinning it on top; dropping in empty space still allows custom placement." },
    { version: 14.8, message: "Reset now preserves the current tree and only clears custom positions, laying the existing branches out with the exact HFS3 sequence template." },
    { version: 14.7, message: "Align direct child plugins magnetically under their main branch instead of offsetting them into the category column." },
    { version: 14.6, message: "Unify every main branch to the same 340x56 card, prevent labels from wrapping, and let category headers be dragged to reorder their saved/Reset column sequence." },
    { version: 14.5, message: "Honor saved custom root/main/category positions for free drag placement; Reset clears them to the sequence layout: branches vertically, categories horizontally, plugin entries vertically." },
    { version: 14.4, message: "Honor saved custom root/main/category positions again, keep plugin reordering, and make Reset clear custom coordinates to a deterministic sequence layout." },
    { version: 14.3, message: "Apply the HFS3 layout preset uniformly to Server and every later-created trunk: vertical main branches, horizontal categories, vertical plugin slots." },
    { version: 14.2, message: "Allow horizontal dragging of Server secondary branches to reorder them; HFS3 branches can be reordered vertically the same way." },
    { version: 14.1, message: "Arrange Server root's secondary branches in one horizontal band, with each branch's categories/plugins following the standard HFS3 column layout." },
    { version: 14, message: "Pin the Unarranged strip flush to the bottom, compact it to a single slim row, hide its native scrollbar and add wheel-based horizontal scrolling." },
    { version: 13.9, message: "Allow dragging a plugin over another plugin to reorder it within a category, a main branch's direct list, or a trunk's direct list." },
    { version: 13.8, message: "Auto-position the Server root beside its first branch and use a compact 80px gap between auto-stacked Server branches." },
    { version: 13.7, message: "Auto-stack all Server root branches at the standard branch column so newly added Server branches and their children align magnetically without manual reset." },
    { version: 13.6, message: "Make a branch's categories and direct plugins follow its X position, and make Reset clear all saved layout coordinates so magnetic auto-layout can tidy Server branches." },
    { version: 13.5, message: "Match plugin IDs ignoring both case and an optional leading hfs- prefix, so renamed plugin folders stay linked to their existing tree/star assignments." },
    { version: 13.4, message: "Reset now collapses every temporarily revealed hidden/unloaded group in the Skill Tree." },
    { version: 13.3, message: "Match plugin IDs case-insensitively across the tree, stars, plugin metadata and actions, and canonicalize stored tree references to the installed casing." },
    { version: 13.2, message: "Remove the Installed hide button series, toolbar hide toggle, hidden CSS/row filtering and Hidden plugins panel; retained hidden.json data no longer affects the list." },
    { version: 13.1, message: "Darken stopped/missing plugin content with 70% opacity and reduced brightness while keeping the card background opaque." },
    { version: 13, message: "Render stopped/missing plugin entries in grayscale while keeping their background fully opaque." },
    { version: 12.9, message: "Use a 56px uniform magnetic plugin step for active/unloaded/starred slots and raise the touch drag threshold to 14px to prevent tap jitter from moving or overlapping cards." },
    { version: 12.8, message: "Silence all backend console output unless Debug logging is enabled; info/error summaries no longer print in production." },
    { version: 12.7, message: "Keep starred stopped/missing plugins visible but pinned to the bottom of their branch, and remove translucent backgrounds from stopped/missing plugin cards." },
    { version: 12.6, message: "Auto-refresh after drag/branch/settings actions too, keeping the status list current without a Refresh button." },
    { version: 12.5, message: "Refresh plugin status automatically after power/drag/star/install actions, remove the Refresh button, and keep the power icon correct while a starred plugin is stopping." },
    { version: 12.4, message: "Starred plugins stay visible regardless of the unloaded/eye hidden state or the native Installed hidden list." },
    { version: 12.3, message: "Dock descriptions inline like settings, support manual settings height, lazy-load settings, and keep multiple plugin settings/description panels open simultaneously." },
    { version: 12.2, message: "Snapshot the tree before every Reset and add a Restore menu for the pre-reset or browser-local snapshot; code updates continue to load storage/tree.json without resetting it." },
    { version: 12.1, message: "Shrink the inline settings expansion to its content height so it stays attached and does not leave a large empty gap in the column." },
    { version: 12, message: "Use a drag threshold so clicking a plugin bar cannot jump/reorder it, and dock the settings panel inline under the plugin bar with reserved layout space instead of floating over the canvas." },
    { version: 11.9, message: "Store pan/zoom separately for portrait and landscape, and keep mobile plugin names on one ellipsized line with smaller action controls." },
    { version: 11.8, message: "Persist pan/zoom in localStorage and restore it after refresh, and magnetically align plugin columns for custom main branches and categories." },
    { version: 11.7, message: "Compact the Unarranged tray and thin its horizontal scrollbar, and use the native Fullscreen API so Fullscreen fills the entire monitor with a viewport fallback." },
    { version: 11.6, message: "Put the Skill Tree title and installed/unarranged count on one compact line and reduce header/toolbar height." },
    { version: 11.5, message: "Force the high-contrast branch border on root, main and category nodes so all branch types match HFS3 and differ from plugin cards." },
    { version: 11.4, message: "Give every trunk/branch node the same strong high-contrast border and gold label as HFS3, visually separating branches from plugin cards." },
    { version: 11.3, message: "Refresh the native Installed row cache after a power action so the running-plugin group stays on top." },
    { version: 11.2, message: "Fix showIf evaluation so Image-browser configuration category tabs only display the fields for the selected tab." },
    { version: 11.1, message: "Group running plugins at the top of the native Installed list, render plugin config tabs/categories, helper comments, min/max and showIf visibility in Skill Tree settings." },
    { version: 11, message: "Add a persistent floating settings preview with a manual close button (including stopped/missing plugins), pinned descriptions with a close button, and star favourites that persist through Save default with a confirm/cancel unstar dialog and missing-star reinstall lane." },
    { version: 10.9, message: "Serialize save, save-default and reset operations so pressing Reset immediately after Save default waits for the new public baseline." },
    { version: 10.8, message: "Fix the desktop page horizontal scrollbar by allowing the MUI main flex item to shrink, match the root border to its text colour, and enlarge branch names." },
    { version: 10.7, message: "Widen root cards and rebalance root/main columns so the trunk label stays readable in mobile fullscreen fit." },
    { version: 10.6, message: "Keep the mobile Unarranged tray visible in a column layout, use a larger minimum fit zoom on coarse pointers, and fit the tree after entering fullscreen." },
    { version: 10.5, message: "Constrain the Unarranged tray width, let card bodies and larger handles start drags, support pointer drops to parent branches, add pinch zoom and a fullscreen Skill Tree, and keep a tree.backup.json fallback so plugin updates do not erase assignments." },
    { version: 10.4, message: "Show the hidden count on a main branch too, so an all-unloaded branch reads 0 loaded and N hidden instead of only 0 loaded." },
    { version: 10.3, message: "Add a synchronous localStorage tree snapshot so a refresh immediately after dragging cannot lose the new layout; restore it before the async save completes." },
    { version: 10.2, message: "Constrain the Unarranged tray so large counts do not widen the page, and show plugin descriptions on tray hover." },
    { version: 10.1, message: "Save drag/drop immediately to storage, flush storage before Save default, merge Reset layout/tree, and group missing plugins with unloaded under the eye toggle." },
    { version: 10, message: "Place plugins dropped directly on an empty trunk under the trunk itself instead of inventing a General main branch." },
    { version: 9.9, message: "Widen main branch cards so loaded counters and the visibility eye do not wrap the branch name." },
    { version: 9.8, message: "Let main branches hold plugins directly (no auto General layer), and remove plugins by dragging outside the viewport into Unarranged." },
    { version: 9.7, message: "Replace the trunk Load button with read-only loaded-plugin counters on every trunk, main branch and category." },
    { version: 9.6, message: "Force the branch eye SVG to the shared theme tone with an inline color." },
    { version: 9.5, message: "Match the branch eye icon to the shared theme tone." },
    { version: 9.4, message: "Move the branch visibility eye to the left and show zoom controls only on touch/mobile layouts." },
    { version: 9.3, message: "Hide unloaded plugins by default with a per-branch eye toggle, place shown unloaded items below loaded ones, and make custom branches accept dragged plugins." },
    { version: 9.2, message: "Enlarge mobile touch targets and use a larger default zoom on coarse-pointer devices." },
    { version: 9.1, message: "Skill Tree no longer auto-opens by default; add an Auto-open Skill Tree setting. Improve touch targets, touch panning, zoom buttons and mobile layout." },
    { version: 9, message: "Add a Load power control to Unarranged items so stopped unarranged plugins can be loaded without the removed Unloaded tray." },
    { version: 8.9, message: "Remove the Unloaded tray; unloaded plugins stay in their branches and are collected in each trunk's Load button. Add magnetic plugin ordering and text-presentation glyphs." },
    { version: 8.8, message: "Preserve an intentionally empty tree after deleting the last trunk." },
    { version: 8.7, message: "Show empty trunks near HFS3 so the new Server trunk is immediately visible." },
    { version: 8.6, message: "Remove the background grid; add a Server trunk; make trunks/branches creatable, renamable and deletable; auto-group unloaded plugins in Unloaded and resolve branch overlaps." },
    { version: 8.5, message: "Give the 45-degree connector chamfers a little more room between the main branch and categories." },
    { version: 8.4, message: "Soften the themed grid so the 45-degree connector routing stays readable." },
    { version: 8.3, message: "Use H/V connectors with short 45-degree chamfers and inherit AdminThemeCustomizer's active color variables." },
    { version: 8.2, message: "Keep stopped plugins visible in Unarranged after dragging them out of a category." },
    { version: 8.1, message: "Widen plugin bars for three-line names and make Unloaded/Unarranged items draggable into any category." },
    { version: 8, message: "Keep Skill Tree quick settings inside the viewport and let them scroll independently of canvas zoom." },
    { version: 7.8, message: "Compact the Skill Tree status line and toolbar so the Unloaded/Unarranged summary fits cleanly." },
    { version: 7.7, message: "Add an Unloaded tray for installed but stopped plugins, with quick load buttons." },
    { version: 7.6, message: "Add a Backend > Security branch and move hfs-keepass-main into it." },
    { version: 7.5, message: "Widen Skill Tree cards, allow two-line names, add explicit drag handles, and default Network & cache sync off." },
    { version: 7.3, message: "Increase Skill Tree text size and default zoom for a clearer, native-looking layout." },
    { version: 7.2, message: "Use straight horizontal/vertical/diagonal Skill Tree connectors instead of curves." },
    { version: 7.1, message: "Skill Tree is fully English, flatter and more legible with native CSS, opaque description/settings panels, grid snapping, overlap avoidance, and orthogonal H/V connectors. Network & cache sync now defaults off on fresh installs." },
    { version: 7, message: "Skill Tree v1: default zoom, expandable quick settings above sibling cards, and the full frontend/backend plugin tree with storage/public JSON layout." },
    { version: 6.8, message: "Deactivate the Skill Tree when leaving the Installed route; ignore synthetic pointer events so programmatic clicks cannot drag branches." },
    { version: 6.7, message: "Refine the Skill Tree layout and add reset/freeze controls for storage/tree.json and public/tree.default.json." },

    { version: 6, message: "Add the Skill Tree tab: horizontal frontend/backend plugin tree, drag/drop, quick power/settings/uninstall actions, Hug3O placeholders and storage/public JSON layouts." },

    { version: 5.4, message: "Add a Network & cache sync master switch; fix the rejetto pin/divider disappearing after switching admin tabs (stale DataGrid API)." },
    { version: 5.3, message: "Force the hide icon path fill gray as well as its color, so the orange admin theme cannot tint it." },
    { version: 5.2, message: "Position the Name-cell hide icon absolutely so two-line plugin names keep their normal layout." },
    { version: 5.1, message: "Force the Name-cell hide icon to a gray color inline, overriding the admin theme accent." },
    { version: 5, message: "Move the per-row hide button to the Name cell, left of the plugin name, with a gray trash-like appearance; restore the Actions column to its normal width." },
    { version: 4.9, message: "Make the rejetto divider label background opaque so the divider line does not cross the text." },
    { version: 4.8, message: "Filter hidden rows out of the DataGrid data (fixes missing rows after scrolling), dedicated rejetto divider row, no Optimizer tab icon, always-visible Advanced settings, and hidden list stored in storage/hidden.json." },
    { version: 4.7, message: "Keep the hidden-count badge inside the eye button so it no longer overlaps the filter button." },
    { version: 4.6, message: "Move Refresh and Show/Hide to the left of the footer filter button, in the requested order: Refresh, Show/Hide, Filter." },
    { version: 4.5, message: "Manual refresh now re-fetches and replaces the grid rows in place (one POST) instead of reloading the whole admin page." },
    { version: 4.4, message: "Scope the early hidden-row CSS to the Installed route so Check updates is never filtered." },
    { version: 4.3, message: "Detect the nested LIST ready packet so the one-shot get_plugins SSE really closes after the initial snapshot." },
    { version: 4.2, message: "Set explicit 24px dimensions on custom SVGs so they render at the same size as native action icons." },
    { version: 4.1, message: "Use the same 24px SVG size as the native action icons for the hide/toggle icons." },
    { version: 4, message: "Widen the Actions column for the extra hide button and use a neutral native action-button style." },
    { version: 3.9, message: "Row hide buttons use the native action-button style; one-shot get_plugins SSE; manual refresh button left of Pause; early CSS hiding from frontend config." },
    { version: 3.8, message: "Periodic retry for the rejetto pin/divider if the grid was not ready on first paint." },
    { version: 3.7, message: "Divider detection follows the rendered/filtered DOM order, so quick filters behave correctly." },
    { version: 3.6, message: "Final rejetto pinning implementation via a DataGrid sort comparator and a --text separator; removed diagnostics." },
    { version: 3.3, message: "Pin plugins authored by rejetto at the top of the Installed list, separated by a --text divider." },
    { version: 3.2, message: "Avoid needless DOM writes from the MutationObserver loop (icons/badges/hidden chips are updated only when changed)." },
    { version: 3.1, message: "Proxy self-test uses github.com instead of api.github.com so it does not consume the REST quota." },
    { version: 3, message: "Final polish: disabled native-options guard, rate-limit cache cooldown, scoped bypass, Installed-only hiding." },
    { version: 2.9, message: "Cached GitHub 403/429 responses expire after 60s instead of lingering for the whole max-age window." },
    { version: 2.8, message: "Hide/show applies only to the Installed list; Check updates is never filtered." },
    { version: 2.7, message: "Language-independent detection of the Get more route for the hide/show helpers." },
    { version: 2.6, message: "Use AsyncLocalStorage to scope the internal bypass, so concurrent HFS requests cannot accidentally skip the GitHub proxy." },
    { version: 2.5, message: "Catalog mirror stores clean numeric version/apiRequired values (comments removed)." },
    { version: 2.4, message: "Native options helper clears its temporary quick filter after opening the dialog." },
    { version: 2.3, message: "Native options helper now finds the quick-filter box used by this HFS admin version." },
    { version: 2.2, message: "Theme-proof Optimizer controls when AdminThemeCustomizer uses global !important colors; minor hidden-list polish." },
    { version: 2.1, message: "Fix the Optimizer tab's Native options button for plugins outside the virtualized viewport (uses the native quick filter)." },
    { version: 2, message: "Admin UI: hide/show installed plugins, Optimizer settings tab, durable hidden list. Safer VPN scoping (GitHub only), preset 192.168.1.224:10809, proxy self-test, persistent plugin catalog mirror." },
    { version: 1, message: "Combined GitHub proxy + disk cache." },
]

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
        let tree = await readJson(TREE_FILE).catch(() => null)
        let fromBackup = false
        if (!isValidTree(tree)) {
            tree = await readJson(TREE_BACKUP_FILE).catch(() => null)
            fromBackup = isValidTree(tree)
        }
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
            const data = `<script>window.__OPTIMIZER_HIDDEN__=${hidden};window.__OPTIMIZER_TOKEN__=${JSON.stringify(ADMIN_TOKEN)}</script>`
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

