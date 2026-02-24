/**
 * 台本作成GAS - メインエントリーポイント
 */

/**
 * Webアプリ POST エンドポイント
 * Content-Type: text/plain で受け取る（CORS preflight回避）
 */
function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var action = data.action || 'generate';

    var result;
    switch (action) {
      case 'generate':
        result = handleGenerate(data);
        break;
      case 'test':
        result = { ok: true, message: '接続成功' };
        break;
      default:
        throw new Error('未対応のaction: ' + action);
    }

    return ContentService
      .createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    Logger.log('doPost エラー: ' + error.message);
    return ContentService
      .createTextOutput(JSON.stringify({
        ok: false,
        error: error.message
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * GET エンドポイント（接続テスト用）
 */
function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({ ok: true, message: 'Script Creator GAS is running' }))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * 台本生成処理
 * @param {Object} data - { transcript, template, targets }
 * @returns {Object} { ok, script, yaml }
 */
function handleGenerate(data) {
  var transcript = data.transcript;
  var templateType = data.template || 'prep';
  var targets = data.targets || ['リール'];

  if (!transcript || transcript.trim() === '') {
    throw new Error('音声メモが空です');
  }

  Logger.log('台本生成開始: template=' + templateType + ', targets=' + targets.join(','));
  Logger.log('入力テキスト: ' + transcript.substring(0, 100) + '...');

  // プロンプト構築
  var prompt = buildPrompt(transcript, templateType, targets);
  Logger.log('プロンプト文字数: ' + prompt.length);

  // Gemini API呼び出し
  var scriptData = callGemini(prompt);
  Logger.log('台本生成成功: ' + scriptData.scenes.length + 'シーン');

  // YAML変換
  var yaml = toYaml(scriptData);

  return {
    ok: true,
    script: scriptData,
    yaml: yaml
  };
}

/**
 * 初回セットアップ: GASエディタでこの関数を実行してAPIキーを設定
 * 引数なしで実行 → プロンプトでAPIキーを入力
 */
function setupApiKey() {
  var key = Browser.inputBox('Gemini API Keyを入力してください:');
  if (key && key !== 'cancel') {
    PropertiesService.getScriptProperties().setProperty('GEMINI_API_KEY', key);
    Logger.log('GEMINI_API_KEY を設定しました');
    Browser.msgBox('APIキー設定完了');
  }
}

/**
 * テスト用関数（GASエディタから直接実行）
 */
function testGenerate() {
  var testData = {
    transcript: 'USJのニンテンドーワールドって朝イチで行かないとめっちゃ待つんよ。整理券も午前中になくなることあるし。効率的な回り方を教えたい。',
    template: 'prep',
    targets: ['リール']
  };

  var result = handleGenerate(testData);
  Logger.log('=== 結果 ===');
  Logger.log(JSON.stringify(result.script, null, 2));
  Logger.log('=== YAML ===');
  Logger.log(result.yaml);
}
