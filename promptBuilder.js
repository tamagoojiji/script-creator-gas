/**
 * プロンプトビルダー - 個性心理学+テンプレ+口調ルールを統合
 */

/**
 * 台本生成プロンプトを構築
 * @param {string} transcript - 音声入力テキスト
 * @param {string} templateType - 'prep' or 'aida'
 * @param {string[]} targets - 投稿先（リール, ストーリーズ, Threads, X）
 * @returns {string} 完成したプロンプト
 */
function buildPrompt(transcript, templateType, targets) {
  var template = CONFIG.TEMPLATES[templateType];
  if (!template) {
    throw new Error('未対応のテンプレート: ' + templateType);
  }

  var targetStr = targets.join('・');

  var prompt = [
    '# 指示',
    'あなたはInstagramリール台本の作成AIです。',
    '以下のルールに厳密に従い、ユーザーの音声メモからリール台本を生成してください。',
    '',
    '# 投稿先',
    targetStr,
    '',
    '# テンプレート: ' + template.name,
    template.description,
    '',
    buildTemplateStructure(template),
    '',
    buildVoiceRules(),
    '',
    buildPersonalityRules(),
    '',
    buildOutputFormat(templateType),
    '',
    '# ユーザーの音声メモ（これを元に台本を作成）',
    '```',
    transcript,
    '```',
    '',
    '上記の音声メモの内容を活かしつつ、テンプレート構成に沿った台本を生成してください。',
    '必ず ```json ブロックでJSON形式のみ出力してください。説明文は不要です。'
  ].join('\n');

  return prompt;
}

/**
 * テンプレート構造の説明を生成
 */
function buildTemplateStructure(template) {
  var lines = ['# テンプレート構成（' + template.sceneCount + '）'];

  for (var i = 0; i < template.structure.length; i++) {
    var scene = template.structure[i];
    lines.push('- シーン' + (i + 1) + ': ' + scene.role + '（個性心理学: ' + scene.personality + '、推奨表情: ' + scene.expression + '）');
  }

  lines.push('- CTA: 行動を促す（表情: bow）');
  lines.push('');
  lines.push('※ シーン数は内容に応じて増減OK。ただし最低' + template.sceneCount.split('-')[0] + 'シーン。');

  return lines.join('\n');
}

/**
 * tamago口調ルール
 */
function buildVoiceRules() {
  return [
    '# tamago口調ルール（厳守）',
    '- 一人称は「自分」。「僕」「私」は使わない',
    '- 完全タメ口。敬語は絶対NG（「です」「ます」「っす」は全部NG）',
    '- 語尾: 体言止め、「〜って」「〜かな」「〜やつ」「〜みたい」「〜感じ」',
    '- 語尾伸ばし（「ー」）は使わない',
    '- 断言を避け「〜かな」「〜かと」で柔らかくする',
    '- 基本は標準語。感情が入ると関西弁が出る（「ほんまそれ」「あかん」「たまらん」）',
    '- 短文テンポ。1〜2文で区切る',
    '- 上から教えない。友達に話す感じ',
    '',
    '## 語尾OK例',
    '「〜みたい」「〜って」「〜やつ」「〜かな」「〜感じ」「〜楽しもう」',
    '',
    '## 語尾NG例',
    '「〜みたいっすよ」「〜ですよね」「〜かと思いますね」「〜楽しみましょ」'
  ].join('\n');
}

/**
 * 個性心理学ルール
 */
function buildPersonalityRules() {
  return [
    '# 個性心理学ルール（必須）',
    '1本の台本に Moon・Earth・Sun の全3タイプに刺さる要素を必ず含める。',
    '',
    '## Moon（共感・安心・みんなで）',
    '- 刺さるワード: 「家族みんなで」「初めてでも安心」「みんなが笑顔になれる」「思い出に残る」',
    '- 共感・仲間意識・安心感を訴求',
    '',
    '## Earth（数字・効率・お得）',
    '- 刺さるワード: 「待ち時間◯分」「◯円お得」「効率的な回り方」「◯時に行くと空いてる」',
    '- 具体的な数字・データ・実用的な情報を提示',
    '',
    '## Sun（限定・特別・インパクト）',
    '- 刺さるワード: 「今年だけの限定」「ここでしか体験できない」「知る人ぞ知る」「特別な体験」',
    '- 希少性・緊急性・特別感を訴求',
    '',
    '## 配置ルール',
    '- 冒頭フック: Sun要素（インパクト）またはEarth要素（数字）',
    '- 展開・具体例: Earth要素（数字・効率）+ Moon要素（体験・共感）',
    '- CTA: Moon要素（安心・仲間）+ Sun要素（限定・今だけ）'
  ].join('\n');
}

/**
 * 出力フォーマット指示
 */
function buildOutputFormat(templateType) {
  return [
    '# 出力フォーマット（厳守）',
    'JSON形式で出力。以下の構造に従うこと:',
    '',
    '```json',
    '{',
    '  "title": "台本タイトル（内容を端的に表す）",',
    '  "template": "' + templateType + '",',
    '  "scenes": [',
    '    {',
    '      "text": "読み上げテキスト（自然な口語。tamago口調で）",',
    '      "display": "字幕テキスト（短く簡潔に。「、」の位置で改行される）",',
    '      "expression": "表情（' + CONFIG.EXPRESSIONS.join(' / ') + ' から選択）",',
    '      "emphasis": ["強調する", "単語リスト"],',
    '      "personality": "Moon / Earth / Sun（どのタイプに刺さるか）",',
    '      "role": "シーンの役割（フック/問題提起/共感/解決策/CTA等）"',
    '    }',
    '  ],',
    '  "cta": {',
    '    "text": "CTA読み上げテキスト",',
    '    "expression": "bow"',
    '  },',
    '  "hashtags": ["#USJ", "#ユニバ", "...（5-8個）"],',
    '  "caption": "投稿キャプション（2-3行）"',
    '}',
    '```',
    '',
    '## 注意',
    '- text: TTSが読み上げるテキスト。自然な口語で。',
    '- display: 画面に表示する字幕。短く。「、」で改行される。省略時はtextを使用。',
    '- expression: キャラクターの表情。シーンの感情に合わせる。',
    '- emphasis: 字幕で強調表示する単語。1-3個。',
    '- personality: Moon/Earth/Sunのどれに刺さるシーンか明記。',
    '- 全シーンでMoon/Earth/Sunが最低1回ずつ登場すること。'
  ].join('\n');
}
