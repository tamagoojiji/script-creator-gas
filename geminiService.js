/**
 * Gemini API連携サービス（フォールバック対応）
 */

/**
 * テキストプロンプトでGemini APIを呼び出す
 * @param {string} prompt - プロンプト全文
 * @returns {Object} パース済みJSONオブジェクト
 */
function callGemini(prompt) {
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
  // Vertex proxy 経由（ADC認証・特典クレジット対象）。モデルフォールバックは proxy 側で実施。
  var text = vertexGenerate_(requestBody, CONFIG.GEMINI_MODELS);
  return parseGeminiResponse(text);
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
