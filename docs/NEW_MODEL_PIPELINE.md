# Bio-3D | 新版建模管線（v1）

**狀態：建模基礎／展示管線完成；正式 AI 生成網格與 Blender 手工精修尚未完成。**

## 路線改變
停止持續修改 `surface-preview.js` 的橢球、帽簷和關節參數。從四視角原畫建立符合角色輪廓的 **獨立 GLB 模型**，以 Blender 編修，再讓 Three.js 只負責載入、選視角、控制動作和截圖。

### 1. 準備原畫
以使用者擁有的原畫 `mascot-character-sheet-v0.1.png`（1448×1086）：
```bash
python -m pip install pillow
python scripts/prepare_refs.py mascot-character-sheet-v0.1.png --output references
```
輸出 `references/front.png`、`three_quarter.png`、`side.png`、`back.png`。請注意原始插畫並不是精確正交投影，不能不校正就直接從側面深度和正面寬度對出體積。

### 2. AI 初稿
使用能接受多視角圖片的圖片轉 3D 服務產生 **GLB** 或 **OBJ**。輸入四視角，優先要求：
- 亮綠色頭殼、身體、靴子，黃色安全帽，大螢幕暗灰綠
- **安全帽與葉片、頭殼與螢幕、胸前儀表、護甲、手套和鞋子分件**，不要生成單體模糊模型
- 保留前／側／背一致性，並比較輪廓與顏色
- 先做 neutral / A-pose，避免手臂交疊造成重建錯誤

AI 輸出只是候選草稿，不直接覆蓋 `models/Bio_Master.glb`。正式上架需人工驗收原畫相似度與網格品質。

### 3. Blender 校正母版
本機安裝 Blender，執行：
```bash
blender -b --python scripts/blender_setup.py -- --references references --output sources/Bio_Master_working.blend
```
進 Blender 將 AI 生成網格匯入 `MODEL_MASTER__EDIT_MESHES_HERE` collection，對照四視角修正頭身比、帽簷、面板曲率、護甲穿戴結構、鞋面厚度及 Logo；必要時 retopology、UV unwrap、重新貼圖。確認後執行：
```bash
blender -b sources/Bio_Master_working.blend --python scripts/blender_export.py -- --output models/Bio_Master.glb
```
匯出腳本會在沒有正式 mesh 時**拒絕匯出**，避免把空白場景誤認為完成的角色。

### 4. GitHub Pages
`master-preview.html` 是真正的 GLB Viewer（不是執行程序化幾何的舊頁面）。可直接上傳本機 `.glb` 作測試，或在 repo 加入 `models/Bio_Master.glb` 後自動載入。支援正面／3/4／側面／背面、轉動縮放、透明背景 PNG。現有 `surface-preview.html` 保留供舊版比較。

### 驗收門檻
先通過正面／側面／背面輪廓比對，才進入骨架和動畫。GLB 至少含完整 3D mesh；未完成時網站會明確顯示缺少模型，而不是以舊球體假裝新模型。

### 使用者參考圖
原圖由使用者提供，並非 CC0 公開素材；擷取照片和 3D 模型不應在未經使用者同意下公開授權。
