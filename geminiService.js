/**
 * Gemini API連携サービス（フォールバック対応）
 */

/**
 * テキストプロンプトでGemini APIを呼び出す
 * @param {string} prompt - プロンプト全文
 * @returns {Object} パース済みJSONオブジェクト
 */
function callGemini(prompt) {
  var apiKey = CONFIG.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEYが設定されていません。スクリプトプロパティに設定してください。');
  }

  var requestBody = {
    contents: [{
      parts: [{ text: prompt }]
    }]
  };

  return callGeminiWithFallback(requestBody);
}

/**
 * フォールバック機能付きGemini API呼び出し
 * @param {Object} requestBody - リクエストボディ
 * @returns {Object} パース済みJSONオブジェクト
 */
function callGeminiWithFallback(requestBody) {
  var apiKey = CONFIG.GEMINI_API_KEY;
  var models = CONFIG.GEMINI_MODELS.slice();

  // 前回成功モデルを優先
  var lastSuccessful = PropertiesService.getScriptProperties().getProperty('LAST_SUCCESSFUL_MODEL');
  if (lastSuccessful) {
    var idx = models.indexOf(lastSuccessful);
    if (idx > 0) {
      models.splice(idx, 1);
      models.unshift(lastSuccessful);
      Logger.log('前回成功モデルを優先: ' + lastSuccessful);
    }
  }

  var lastError = null;
  var retryCount = 0;
  var MAX_RETRIES = 2;

  while (retryCount <= MAX_RETRIES) {
    for (var i = 0; i < models.length; i++) {
      var model = models[i];
      try {
        Logger.log('試行 [' + (i + 1) + '/' + models.length + ']' + (retryCount > 0 ? ' (リトライ' + retryCount + ')' : '') + ': ' + model);

        var url = CONFIG.GEMINI_API_URL + model + ':generateContent?key=' + apiKey;
        var options = {
          method: 'post',
          contentType: 'application/json',
          payload: JSON.stringify(requestBody),
          muteHttpExceptions: true
        };

        var response = UrlFetchApp.fetch(url, options);
        var responseCode = response.getResponseCode();
        var responseData = JSON.parse(response.getContentText());

        if (responseCode === 200) {
          Logger.log('成功: ' + model);
          if (!responseData.candidates || !responseData.candidates[0] || !responseData.candidates[0].content) {
            Logger.log('candidates が空（安全フィルター等）: ' + model);
            lastError = new Error('Geminiがコンテンツを生成できませんでした（安全フィルター）');
            continue;
          }
          var generatedText = responseData.candidates[0].content.parts[0].text;
          var jsonData = parseGeminiResponse(generatedText);

          PropertiesService.getScriptProperties().setProperty('LAST_SUCCESSFUL_MODEL', model);
          return jsonData;
        }

        if (responseCode === 429) {
          Logger.log('クォータ超過: ' + model + ' - 3秒待機');
          lastError = new Error('クォータ超過: ' + model);
          Utilities.sleep(3000);
          continue;
        }

        Logger.log('エラー (' + responseCode + '): ' + model);
        lastError = new Error('API Error (' + responseCode + '): ' + (responseData.error ? responseData.error.message : 'Unknown'));

      } catch (error) {
        Logger.log('例外: ' + model + ' - ' + error.message);
        lastError = error;
        continue;
      }
    }

    retryCount++;
    if (retryCount <= MAX_RETRIES) {
      var waitSec = retryCount * 10;
      Logger.log('全モデル失敗 - ' + waitSec + '秒待機後リトライ (' + retryCount + '/' + MAX_RETRIES + ')');
      Utilities.sleep(waitSec * 1000);
    }
  }

  throw new Error('全モデルで失敗（リトライ' + MAX_RETRIES + '回）: ' + (lastError ? lastError.message : 'Unknown'));
}

/**
 * GeminiレスポンスからJSONを抽出
 * @param {string} text - Gemini生成テキスト
 * @returns {Object} パース済みJSON
 */
function parseGeminiResponse(text) {
  try {
    var cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(cleaned);
  } catch (error) {
    Logger.log('JSON parse error: ' + error.message);
    Logger.log('元テキスト: ' + text);
    throw new Error('GeminiのレスポンスをJSON形式で解析できませんでした');
  }
}
