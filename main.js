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
      case 'generate-questions':
        result = handleGenerateQuestions(data);
        break;
      case 'generate-empathy':
        result = handleGenerateEmpathy(data);
        break;
      case 'sync-save':
        result = handleSyncSave(data);
        break;
      case 'sync-load':
        result = handleSyncLoad();
        break;
      case 'sync-delete':
        result = handleSyncDelete(data);
        break;
      case 'sync-history-save':
        result = handleSyncHistorySave(data);
        break;
      case 'sync-history-load':
        result = handleSyncHistoryLoad();
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
 * EMPATHY型: 感情引き出し質問を生成
 * @param {Object} data - { transcript, targets }
 * @returns {Object} { ok, questions }
 */
function handleGenerateQuestions(data) {
  var transcript = data.transcript;
  var targets = data.targets || ['リール'];

  if (!transcript || transcript.trim() === '') {
    throw new Error('音声メモが空です');
  }

  Logger.log('質問生成開始');

  var prompt = buildQuestionsPrompt(transcript, targets);
  var result = callGemini(prompt);

  Logger.log('質問生成成功: ' + result.questions.length + '個');

  return {
    ok: true,
    questions: result.questions
  };
}

/**
 * EMPATHY型: 質問回答を含めた台本生成
 * @param {Object} data - { transcript, targets, answers }
 * @returns {Object} { ok, script, yaml }
 */
function handleGenerateEmpathy(data) {
  var transcript = data.transcript;
  var targets = data.targets || ['リール'];
  var answers = data.answers || [];

  if (!transcript || transcript.trim() === '') {
    throw new Error('音声メモが空です');
  }

  Logger.log('EMPATHY台本生成開始: answers=' + answers.length + '個');

  var prompt = buildEmpathyPrompt(transcript, targets, answers);
  Logger.log('プロンプト文字数: ' + prompt.length);

  var scriptData = callGemini(prompt);
  Logger.log('台本生成成功: ' + scriptData.scenes.length + 'シーン');

  var yaml = toYaml(scriptData);

  return {
    ok: true,
    script: scriptData,
    yaml: yaml
  };
}

/**
 * クラウド同期: スクリプトを保存
 * @param {Object} data - { scripts: Script[] }
 * @returns {Object} { ok, count }
 */
function handleSyncSave(data) {
  var scripts = data.scripts;
  if (!scripts || !Array.isArray(scripts)) {
    throw new Error('scriptsが指定されていません');
  }

  var props = PropertiesService.getScriptProperties();

  // 既存のreel-script_*キーを全削除（差分ではなく全置換）
  var allKeys = props.getKeys();
  for (var i = 0; i < allKeys.length; i++) {
    if (allKeys[i].indexOf('reel-script_') === 0) {
      props.deleteProperty(allKeys[i]);
    }
  }

  // 新しいスクリプトを保存
  for (var j = 0; j < scripts.length; j++) {
    var s = scripts[j];
    props.setProperty('reel-script_' + s.id, JSON.stringify(s));
  }

  Logger.log('sync-save: ' + scripts.length + '件保存');

  return {
    ok: true,
    count: scripts.length
  };
}

/**
 * クラウド同期: 全スクリプトをロード
 * @returns {Object} { ok, scripts }
 */
function handleSyncLoad() {
  var props = PropertiesService.getScriptProperties();
  var allKeys = props.getKeys();
  var scripts = [];

  for (var i = 0; i < allKeys.length; i++) {
    if (allKeys[i].indexOf('reel-script_') === 0) {
      try {
        scripts.push(JSON.parse(props.getProperty(allKeys[i])));
      } catch (e) {
        Logger.log('sync-load: パース失敗 key=' + allKeys[i]);
      }
    }
  }

  Logger.log('sync-load: ' + scripts.length + '件取得');

  return {
    ok: true,
    scripts: scripts
  };
}

/**
 * クラウド同期: スクリプトを削除
 * @param {Object} data - { id: string }
 * @returns {Object} { ok }
 */
function handleSyncDelete(data) {
  var id = data.id;
  if (!id) {
    throw new Error('idが指定されていません');
  }

  var props = PropertiesService.getScriptProperties();
  props.deleteProperty('reel-script_' + id);

  Logger.log('sync-delete: id=' + id);

  return { ok: true };
}

/**
 * クラウド同期: 生成履歴を保存
 * @param {Object} data - { history: HistoryItem[] }
 * @returns {Object} { ok, count }
 */
function handleSyncHistorySave(data) {
  var history = data.history;
  if (!history || !Array.isArray(history)) {
    throw new Error('historyが指定されていません');
  }

  var props = PropertiesService.getScriptProperties();

  // 既存のcreate-history_*キーを全削除
  var allKeys = props.getKeys();
  for (var i = 0; i < allKeys.length; i++) {
    if (allKeys[i].indexOf('create-history_') === 0) {
      props.deleteProperty(allKeys[i]);
    }
  }

  // 新しい履歴を保存
  for (var j = 0; j < history.length; j++) {
    var h = history[j];
    props.setProperty('create-history_' + h.id, JSON.stringify(h));
  }

  Logger.log('sync-history-save: ' + history.length + '件保存');

  return {
    ok: true,
    count: history.length
  };
}

/**
 * クラウド同期: 生成履歴をロード
 * @returns {Object} { ok, history }
 */
function handleSyncHistoryLoad() {
  var props = PropertiesService.getScriptProperties();
  var allKeys = props.getKeys();
  var history = [];

  for (var i = 0; i < allKeys.length; i++) {
    if (allKeys[i].indexOf('create-history_') === 0) {
      try {
        history.push(JSON.parse(props.getProperty(allKeys[i])));
      } catch (e) {
        Logger.log('sync-history-load: パース失敗 key=' + allKeys[i]);
      }
    }
  }

  Logger.log('sync-history-load: ' + history.length + '件取得');

  return {
    ok: true,
    history: history
  };
}

/**
 * 初回セットアップ: GASエディタでこの関数を実行してAPIキーを設定
 * 実行前に下の YOUR_API_KEY_HERE を実際のキーに書き換えてから実行。
 * 実行後は必ず元に戻す（キーをコードに残さない）。
 */
function setupApiKey() {
  var key = 'YOUR_API_KEY_HERE';
  PropertiesService.getScriptProperties().setProperty('GEMINI_API_KEY', key);
  Logger.log('GEMINI_API_KEY を設定しました（文字数: ' + key.length + '）');
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
