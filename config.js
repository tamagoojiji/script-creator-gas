/**
 * 台本作成GAS - 設定
 */
var CONFIG = {
  // Gemini API
  GEMINI_API_KEY: PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY'),
  GEMINI_API_URL: 'https://generativelanguage.googleapis.com/v1beta/models/',

  // フォールバックモデルリスト（優先順）
  GEMINI_MODELS: [
    'gemini-2.5-flash',
    'gemini-2.5-flash-lite',
    'gemini-2.0-flash',
    'gemini-2.0-flash-lite'
  ],

  // 表情の選択肢
  EXPRESSIONS: ['normal', 'surprised', 'idea', 'frustrated', 'dizzy', 'tired', 'cry', 'bow'],

  // テンプレート定義
  TEMPLATES: {
    prep: {
      name: 'PREP型',
      description: '結論先出し（20-30秒・攻略系に最適）',
      sceneCount: '5-7シーン',
      structure: [
        { role: 'フック（結論 or 危機感）', personality: 'Moon/Earth', expression: 'surprised' },
        { role: '理由・背景', personality: 'Earth', expression: 'idea' },
        { role: '具体例1', personality: 'Earth', expression: 'normal' },
        { role: '具体例2（共感）', personality: 'Moon', expression: 'tired' },
        { role: '補足・数字', personality: 'Earth', expression: 'normal' },
        { role: 'まとめ（結論繰り返し）', personality: 'Sun', expression: 'idea' }
      ]
    },
    aida: {
      name: 'AIDA型',
      description: '感情訴求（30-60秒・体験レポート向き）',
      sceneCount: '7-10シーン',
      structure: [
        { role: 'フック（Attention）', personality: 'Sun/Earth', expression: 'surprised' },
        { role: '問題提起', personality: 'Earth', expression: 'frustrated' },
        { role: '痛みポイント', personality: 'Earth', expression: 'dizzy' },
        { role: '共感（Interest）', personality: 'Moon', expression: 'tired' },
        { role: 'みんなもそう', personality: 'Moon', expression: 'normal' },
        { role: '解決策（Desire）', personality: 'Sun', expression: 'idea' },
        { role: '具体手順', personality: 'Earth', expression: 'normal' },
        { role: '結果・ゴール', personality: 'Sun', expression: 'normal' },
        { role: '補足・限定情報', personality: 'Sun/Earth', expression: 'surprised' }
      ]
    },
    empathy: {
      name: 'EMPATHY型',
      description: '失敗共感→情報提供→感情（50-60秒・攻略情報でフォロー獲得）',
      sceneCount: '7-10シーン',
      structure: [
        { role: 'フック（失敗共感）', personality: 'AI判定', expression: 'frustrated' },
        { role: '共感・課題提示', personality: 'AI判定', expression: 'tired' },
        { role: 'メイン情報1', personality: 'AI判定', expression: 'idea' },
        { role: 'メイン情報2', personality: 'AI判定', expression: 'normal' },
        { role: 'メイン情報3', personality: 'AI判定', expression: 'surprised' },
        { role: '感情・ベネフィット1', personality: 'AI判定', expression: 'normal' },
        { role: '感情・ベネフィット2', personality: 'AI判定', expression: 'idea' },
        { role: 'CTA（行動喚起）', personality: 'AI判定', expression: 'bow' }
      ],
      note: '各シーンのpersonalityはAIがテーマに応じて最適なタイプを選択。ただしMoon/Earth/Sun全3タイプが最低1回は登場すること。'
    }
  }
};
