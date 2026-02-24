# CLAUDE.md（script-creator-gas 専用）

## 概要
音声メモ → Gemini AIでリール台本を自動生成するGASバックエンド。
個性心理学3タイプ（Moon/Earth/Sun）を全シーンに配置し、tamago口調で台本を生成。

## アーキテクチャ
フロントエンド（script-creator-app）→ GAS doPost → Gemini API → JSON→YAML変換 → レスポンス

## ファイル構成
- main.js: doPost/doGet エントリーポイント
- config.js: モデルリスト・テンプレート定義・定数
- geminiService.js: Gemini APIフォールバック呼び出し
- promptBuilder.js: 個性心理学+テンプレ+口調ルールをプロンプトに統合
- yamlFormatter.js: JSON→YAML変換（tamago-talk-reel互換）

## デプロイ
- **Script ID**: `1OA2YWgYedA6nAWY5hByhOO9n6APZA0f5dH_nmnh9_yjSGsdAJayGCMiV`
- **固定デプロイID**: `AKfycbw1VqskCKAhBHdl6DdDI3iJFVs42-H39oTp2wu5fJWQp6J_FTf-fN8d89ku7PVM7n0P`
- コマンド: `clasp deploy -i AKfycbw1VqskCKAhBHdl6DdDI3iJFVs42-H39oTp2wu5fJWQp6J_FTf-fN8d89ku7PVM7n0P`

## API仕様
### POST（台本生成）
```json
{
  "action": "generate",
  "transcript": "音声メモテキスト",
  "template": "prep",
  "targets": ["リール"]
}
```

### POST（接続テスト）
```json
{ "action": "test" }
```

### GET
接続テスト。`{ ok: true }` を返す。

## Geminiモデルフォールバック
gemini-2.5-flash → gemini-2.5-flash-lite → gemini-2.0-flash → gemini-2.0-flash-lite

## 注意事項
- GEMINI_API_KEY はスクリプトプロパティに設定必須
- CORS対策: フロントからは Content-Type: text/plain でPOST
