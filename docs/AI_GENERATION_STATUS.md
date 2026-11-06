# Bio AI 多視角生成狀態

截至 2026-11-06：

- 已完成原始角色設定圖四視角裁切，並在對話中提供可下載參考套件。
- 已建立 `scripts/prepare_refs.py`、`scripts/blender_setup.py`、`scripts/blender_export.py`。
- 已建立 `master-preview.html` 的 GLB 模型載入、四視角及透明 PNG 功能。
- 已在 fal 的即時模型目錄找到可接受多張圖片的 `fal-ai/reconviagen-0.5`，其 API 具有 `image_urls`（最多 16 張）和 `model_glb` 輸出。這是**候選模型**，尚未進行品質驗證。
- **實際生成阻塞：** fal 已連接，但此次上傳原始參考圖時回報 `balance_exhausted`（HTTP 403）。因此尚未上傳參考圖、尚未啟動 AI 3D 生成，也尚無正式 `models/Bio_Master.glb`。請勿將舊 `Bio_v0.1.glb` 誤標為新母版。

## 下一個執行步驟

1. 在已連接的 fal 帳戶中補充可用額度（由帳戶持有人決定）。
2. 上傳四視角參考圖至同一帳戶，使用多圖模型以 `image_urls` 重建候選 GLB。
3. 對照原設定圖從正面／側面／背面逐項驗收安全帽、面板、護甲和靴子。
4. 若輪廓差異過大，不直接上架，先在 Blender 中修正並進行必要的重拓樸與貼圖整理。
5. 合格後輸出 `models/Bio_Master.glb`，使 `master-preview.html` 自動讀取。舊版維持回退與比較用途。

注意：多視角設定圖各角度為插畫而非等比例正交照片。模型輸出的細節和素材保真程度需要實際驗證，不能假定一次生成就能完全重現原圖。
