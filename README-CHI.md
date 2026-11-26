# Plugins-Optimizer

HFS 3 插件：GitHub 專用 VPN 代理 + 持久化快取 + 管理面板增強。

## 功能

### 0. 獨立模組與管理面板

- 已移除 **Enable network modules** 主控開關。
- VPN 代理、GitHub 磁碟快取、catalog 同步各自使用獨立設定，網絡模組固定啟用。
- **Admin panel extensions 永久啟用**，沒有開關，也不受 network 模組影響。
- 若 HFS 設定了全域 `outbound_proxy`，GitHub 請求會優先使用 HFS 的代理；插件代理只是 fallback。
- Installed 的隱藏按鈕系列與 `rejetto` 分區已移除。
- 未啟動插件會優先讀取本機插件資料夾的 `plugin.js`；未安裝插件才讀取遠端 repo，解析 `exports.config` 顯示選項預覽，並提供安裝或啟動按鈕。
- 星標插件會把 description、repo、author 持續寫入 `storage/descriptions.json`，並同步產生 `public/descriptions.js`；設定面板只顯示 repo，repo 缺失時會從 descriptions 補讀。
- descriptions 會自動清理未被安裝、未被星標、也未存在於 PluginTree 的孤立條目；清理時機為啟動、catalog 同步後與儲存樹之後。
- 插件描述整合在展開設定面板內：Repo → Description → 設定欄位；卡片上的資訊按鈕改為 Plugin output，開啟即時日誌小視窗（`get_plugin_log`，每 2.5 秒更新）。
- PluginTree 載入時會依模糊 ID 加版本號去重：版本相同（或其中一方未知）才合併為一個節點；版本號不同時分開顯示。合併時會保留位置與顏色。
- 沒有 Unarranged 插件時，底部仍保留一個較矮的暗色拖放區，顯示 `Drag plugins here to unarrange them.`，可直接把插件拖到底部移出樹。
- 插件安裝與更新事件會自動更新 `descriptions.js`；已安裝插件自身的 `exports.description` 優先，catalog／線上描述只在插件缺失時作 fallback。

### 1. VPN 代理（只針對 GitHub）

- 預設代理：`192.168.1.224:10809`，無帳號密碼。
- 只有 `githubHosts` 列出的主機才會走代理，包括：
  - 插件安裝 / 更新（`github.com`、`codeload.github.com`、`raw.githubusercontent.com`、`api.github.com`、`objects.githubusercontent.com` 等）
  - HFS 系統更新（GitHub Releases）
- 其他所有通訊完全不受影響，仍走普通網絡。
- 可在「Optimizer」分頁按 **Test connection** 測試（測試 `github.com`，不消耗 GitHub API 配額）。

### 2. GitHub 持久化快取

- 快取目錄：`storage/cache/`
- 快取索引：`storage/meta.json`
- 支援 GET/HEAD、ETag/If-None-Match、stale-while-revalidate、失敗黑名單。
- 重啟 HFS 後快取仍然有效。
- 403/429 只快取 60 秒，避免長期把配額錯誤當成正常結果。

### 3. 插件資訊庫鏡像

- 檔案：`storage/catalog.json`
- 定期從 GitHub 同步（預設每 6 小時，`catalogSyncHours` 可調，0 = 關閉自動同步）。
- 重啟後仍然保留，可在「Optimizer」分頁查看數量、同步時間、手動 Sync now。
- HFS 3.4.1 本身也會把線上插件目錄持久化到 `data.kv`；本鏡像是額外、可檢查的一份副本，並可幫助預熱 HTTP 快取。

### 4. 管理面板增強

- **Installed 列表**：
  - 已移除每行隱藏按鈕、工具列顯示/隱藏按鈕與 Hidden plugins 管理面板；native Installed 不再套用任何隱藏規則。
  - `storage/hidden.json` 僅保留舊資料，不再影響列表。
  - 不再依作者置頂或插入 `rejetto` 分隔列，恢復 HFS 原生的插件排序。
  - 底部保留刷新按鈕；Installed 列表只載入一次初始快照，需要更新時按刷新，會用一次 `get_plugins` 請求就地更新表格，不會重新載入整個 admin 頁面。
- **Optimizer 分頁**：
  - 位於 Check updates 右側。
  - 可設定 VPN、快取 TTL、catalog 同步、進階參數。
  - 與插件原生 Options 對話框共用同一份設定，雙向互通。
  - **Native options** 按鈕會直接打開原生設定對話框。

### 5. Skill Tree 插件技能樹

- 不再有頁內 **Skill Tree** 或 **Optimizer** 分頁；改由側邊欄 **Plugins** 上方的 **PluginTree** 按鈕作為主要入口，設定沿用 HFS 原生 Options。選中 PluginTree 時只有它有背景色，Plugins 會取消選中，原生 Plugins 分頁列亦會隱藏；按側邊欄 Plugins 即返回原本介面。
- 橫向技能樹：`HFS3` 根源 → 前端／後端兩大分支 → 各分類 → 插件卡片。
- 後端包含 **Security** 分支，`hfs-keepass-main` 已歸入其中。
- 每個插件卡片提供：
  - 啟用／停用（電源）
  - 齒輪快速設定（展開後可直接修改常用欄位）
  - 刪除（卸載）
  - 版本號
  - 說明按鈕／hover 泡泡
- `Hug3O` 插件即使未安裝也會保留在樹上；未安裝節點顯示下載安裝按鈕，安裝後會「點亮」。
- 主幹、主分支與分類都顯示 **loaded** 統計數字（唯讀，不彈出選單）。
- 未載入與未下載插件預設一起隱藏；分類／主分支的眼睛按鈕位於 `⋯` 左側，顯示時集中在已載入項目下方。
- 未列入分類的已安裝插件集中在 **Unarranged** 橫向托盤；托盤固定寬度並可水平捲動，不會撐寬頁面。
- Unarranged 貼齊面板底部，使用單行超緊湊高度；原生橫向滾動條隱藏，滑鼠滾輪／觸控板可水平捲動。Fullscreen 使用瀏覽器原生 Fullscreen API 填滿整個螢幕，失敗時才退回頁面內全屏。
- 滑過 Unarranged 插件可查看 description；按下 `!` 會在插件橫條下方就地展開 description，與 settings 同樣對齊，可多個插件同時展開，需手動按 `×` 關閉。
- 齒輪會在插件橫條下方就地展開 settings，佔用實際版面並把後續插件往下推，不再浮動覆蓋畫布；需按 `×` 手動關閉。
- Settings 採懶加載，第一次展開才讀取；底部有 resizer 可手動調整高度，並支援多個插件同時展開。
- 插件條目使用固定 56px 磁力步距，active／unloaded／starred 都對齊同一欄位，列距一致。
- 單純點擊插件橫條不會觸發拖拽／重新排序；滑鼠需移動超過 6px，觸控需超過 14px 才會開始拖拽，避免手機 tap 抖動造成移位或重疊。
- Settings 支援 plugin 的 `config_tab` 分類切換（例如 Image-browser 的 Large Images / Thumbnails）、`showIf` 顯示條件、`helperText` 注釋、min/max 與 select options。
- Native Installed 列表會把已載入／運行中的插件集中在最上方。
- 星標按鈕會將插件保存進 Save default；取消星標會顯示 Remove/Cancel 確認對話框。
- 星標插件不受 Skill Tree 的「未載入隱藏」影響，永遠保持可見；停止／缺少的星標插件會自動排在該分支底部；取消星標後才恢復原本的未載入隱藏規則。
- 插件 ID 比對不分大小寫，也忽略開頭的 `hfs-`；`hfs-nvr-main`、`NVR-Main`、`nvr-main` 會視為同一插件。載入時會把樹內、星標、positions 與 pluginMeta 的引用正規化為實際 installed ID。
- 未啟動或缺少的插件卡片套用 `grayscale(1) brightness(.82)`，內容再以 `opacity: .7` 壓暗；卡片本身保持 `opacity: 1` 與不透明背景，缺少項目另加虛線邊框。
- 已星標但被刪除／解除安裝的插件會留在樹中或以 Unarranged missing 項目顯示，可直接重新安裝。
- 未載入項目可直接按電源載入。
- 任何插件（包含 Unarranged 項目）都可拖到其他分類、主分支或上一級主幹，或拖回 Unarranged。
- 插件拖入分支時會磁力對齊欄位與列距，並依拖放位置自動排序。
- 畫布可拖曳平移、滾輪縮放、雙指捏合；pan/zoom 會保存在 localStorage，重新整理後自動回到上次位置。
- 手機直向（portrait）與橫向（landscape）分別記錄自己的 pan/zoom，旋轉螢幕會各自還原。
- 手機插件名稱保持單行省略，不再因空間不足換行；版本字與操作按鈕同步縮小以保留名稱空間。
- 主幹、主分支、分類、插件節點都可拖動；自訂主分支與分類的插件欄位會磁力對齊，插件卡片固定同寬同列。
- 整個插件卡片與加大的拖曳把手都可開始拖拽；自動 Fit 縮放有最小比例，避免縮得太小難以操作。
- 抓住插件拖到同分支的另一個插件上，可重新排序分類內、主分支直接列表或主幹直接列表中的順序。
- 手機觸控：雙指捏合縮放、單指平移、拖曳卡片或把手、放大／縮小按鈕；可切換 **Fullscreen** 全屏操作 Skill Tree。
- HFS3 與 Server 是同級主幹；右側 `⋯` 可新增／改名／刪除分支與分類，工具列 **+ Trunk** 可新增主幹。
- 已移除 Installed 頁面的 EventSource 攔截與自訂 Refresh 按鈕，恢復 HFS 原生即時插件列表通訊；Skill Tree 操作仍會自行刷新狀態。
- 插件卡片的 Uninstall 圖示位於設定齒輪左側，避免誤觸；所有確認與輸入對話框使用內建樣式，確認／卸載按鈕在左、Cancel 在右；全屏模式下對話框會掛載到全屏面板內，toast 固定在右上角。
- 所有 root／主分支／分類與插件卡片預設使用目前主題外框色。點擊分支標題或插件名稱可依紅→橙→黃→綠→青→藍→紫光譜循環 12 種外框色，再點一次回到預設；分支以 `colorIndex`、插件以 `pluginColors[id]` 保存在 tree JSON。每個節點顏色完全獨立，父節點顏色不會影響子節點。所有分類標題都可以點擊循環 12 色；長按分支標題或插件名稱 600ms 可立即回到該節點原本的預設外框色。分支節點鎖定時不能修改或重置自身顏色；插件名稱左鍵不再著色，改用右鍵循環顏色、長按重置，且不受所屬分類／主分支鎖定影響。分類設定顏色後，其屬下插件的左側標記會同步使用該分類顏色；直接掛在主分支下的插件則使用主分支顏色；主分支無色時保持預設。只有直接掛在 root 下的插件才使用 root 顏色。插件若有自己的顏色則以自己的為準。直接掛在主分支下的第一個插件與分支間距為 2px。已載入／運行中的插件卡片左側有 3px 橘色高亮標記。
- Skill Tree 標題列顯示 `installed · running · unarranged` 三個即時數量。
- 工具列不再有 Fit 按鈕；手機直向時按鈕縮小為 32px 高、3px 間距並禁止換行，Fullscreen 保持同一行。Root 與主分支卡片統一 340px 寬，Root 到主分支最小水平間距 80px，因此 Root 有更長的橫向導入線（自訂主分支位置亦不可更近）。每個 Root、主分支與分類右上角都有鎖頭，全部預設鎖定；Root 鎖是整個主幹的總開關，一按會同時解鎖或鎖定其下所有主分支與分類。子鎖可獨立解鎖，解鎖某個主分支或分類後即可在該層局部移動，不需要先全局解鎖。狀態會隨 tree 保存。分類即使鎖定，仍可從 Unarranged 拖入插件；新增插件不會自動展開已收起的分類，除非手動按眼睛。鎖頭、眼睛與 `⋯` 集中在同一個右上角 flex 工具列，手機上間距 1px、不會互相遮擋。
- 說明按鈕改用 ⓘ 圖示，與隱藏眼睛、鎖頭統一使用齒輪按鈕的橘色高亮。桌面可 hover 顯示小框；觸控裝置只會展開行內描述，不顯示 hover 小框。再按一次 ⓘ 會關閉行內描述。
- 最頂端 Root 左側不再畫水平短線；主分支與分類由父節點連線路徑末端的水平段直接接入。分類／主分支到插件的縱向連線改走在子卡片左側約 44px、貼近電源開關的位置，於卡片後方穿過，只在卡片間隙可見。主分支到分類最小水平間距 80px（自訂拖拽亦不可更近），分類欄步距 400px；分類卡固定 56px 高，第一個插件距分類底部 2px，與插件與插件之間的實際 2px 間距一致；分類到插件的連線不再繪製。面板內不使用 blur、backdrop blur、box-shadow 或 text-shadow。
- 所有主幹（HFS3、Server 及後期新增的 Trunk）統一使用 HFS3 序列預設：第一級主分支縱向排列、第二級分類橫向排列、第三級插件縱向等距排列。主分支卡片統一為 340×56，標題不換行；直接掛在主分支的插件與主分支左緣磁力對齊。
- root／主分支／分類皆可自由拖拽並保存自訂位置；不再使用同級交換／排序機制。Reset 會依目前位置與父節點距離重新排序，Save default 則保存目前自訂排版。
- 額外建立的二級分支若直接掛插件，插件會與主分支同 X、寬度 340，並以 14px 磁力間距緊貼主分支底部，外觀與 HFS3 分類內插件一致。
- 新建分支不會再自動建立 General 分類；插件可直接掛在主分支下，或拖到既有分類。分類的 `⋯` 菜單可新增子分類，支援多層 `parent` 結構；子分類會縮排排在父分類插件下方，連線使用水平導入＋小段 45° 斜角＋垂直，與上層分支轉角一致；刪除父分類時子分類自動上移一層。分類可拖到另一個分類上整組移入；主分支拖到分類上會轉換成 category 節點（連同其插件與子分類）。子分類菜單可用 Move to top level 移回頂層。
- 拖到主分支／主幹時，插件直接成為該分支的直接項目，不再多一層 General。
- 插件拖出畫布外即可移除並回到 Unarranged；亦可拖到其他主幹、主分支或分類。
- 齒輪設定面板首次展開會自動貼合內容高度（上限 500px），內容變多時再自動增高；仍可在右下角拖拽調整高度。Save 按鈕位於關閉按鈕左側，未修改時半透明且不可按，修改後才亮起。展開中的插件與各自高度保存在 `storage/ui.json`，重新整理後會自動恢復展開，再按一次齒輪可關閉。主分支／分類的眼睛展開狀態也保存在同一個 `ui.json`，刷新後會恢復。未載入插件會顯示說明與 Start plugin 按鈕；設定內未勾選 checkbox 使用深色底，不再出現白色方框。
- 樹狀資料：
  - 執行期：`storage/tree.json`
  - 預設：`public/tree.default.json`
  - **Reset** 只重設排版：先將目前完整樹（含所有自訂坐標）快照到 `tree.before-reset.json`，再依「與上一級父節點的距離」由近到遠重排同級順序，清空 `positions`，依 HFS3 序列（主分支縱向、分類橫向、插件縱向）自動排列，並收起臨時展開的隱藏項目。**Save default** 會先把目前所有可見 root／分支／分類／插件的 X／Y 坐標寫入 `positions`，保存目前 tree，再覆寫 public 預設。
  - 按 **Restore** 會比較「Save default」與「Reset 前」快照的更新時間，還原最新的一份完整樹與坐標；右鍵 Restore 可指定 Latest saved layout、Layout before last Reset 或本機快照。
  - 插件版本更新只會讀取既有 storage/tree.json，不會自動 Reset 或重建使用者分類。
  - Save default 與 Reset 會排隊執行，避免 Save default 尚未完成時 Reset 讀到舊基準。
  - 載入時優先讀取 `storage/tree.json`，插件清單只作狀態裝飾，不會重建或清空已保存的分支。
  - 每次保存同時寫入 `storage/tree.backup.json`；若主檔缺失或損壞，會自動用備份還原。
  - 任何拖拽放置、分支建立／改名／刪除都會即時寫入 `storage/tree.json`，並同步保存 localStorage 快照；若重新整理快到非同步儲存尚未完成，會自動還原快照並回寫 storage。
  - 也可以手動把 `storage/tree.json` 複製到 `public/tree.default.json` 固化。

## 設定

- 所有 Optimizer 後端／前端 console 訊息只在 `debug` 為 `true` 時輸出。
- 自訂名稱的 HFS 管理員帳號（`admin: true`）亦可使用 Optimizer API，不再只認 `admin` 這個名稱。
- 若 HFS 設定了全域 `outbound_proxy`，GitHub 請求會優先使用它；HFS 的設定優先於本插件的 GitHub-only proxy。
- Skill Tree 安裝 Hug3O 插件失敗時，會依序嘗試 `hugo529100` 的 owner 改名、去除 `-main`／補 `hfs-` 的變體，再比對 catalog 中標準化名稱相同的 repo；owner 同時嘗試 `hugo529100` 與 `Hugo29100`，並直接指定 `branch=main` 以避免 GitHub 分支偵測回傳 404。下載完成後會先 `set_plugin enabled:true`，再 `start_plugin`，確保 PluginTree 卡片立即點亮。


| 設定 | 預設 | 說明 |
| --- | --- | --- |
| `proxyEnabled` | `false` | 啟用 GitHub 代理模組 |
| `proxyHost` | `192.168.1.224` | 代理主機（HFS outbound_proxy 未設定時使用） |
| `proxyPort` | `10809` | 代理連接埠 |
| `cacheEnabled` | `false` | 啟用 GitHub 磁碟快取模組 |
| `ttlHours` | `24` | 一般快取新鮮時間 |
| `pluginTtlHours` | `6` | plugin.js 快取新鮮時間 |
| `maxAgeDays` | `30` | 快取最大保留天數 |
| `catalogSyncHours` | `6` | catalog.json 同步間隔 |
| `githubToken` | 空 | 可選 GitHub PAT，提高 API 配額 |
| `debug` | `false` | 所有後端 console／`api.log` 輸出（含 info 與 error）只在開啟時顯示 |
| — | — | `storage/hidden.json` 僅保留舊資料；Installed 隱藏功能已停用 |

## 注意

- GitHub 未登入 API 配額為每小時 60 次；大量使用「Check updates」或「Get more」時建議設定 `githubToken`。
- 若透過 HFS 的「Check updates」更新本插件，GitHub 倉庫中的版本會覆蓋本機 `plugin.js` 與 `public/admin.js`；請先把這兩個檔案提交到倉庫。
