/**
 * JSON→YAML変換（tamago-talk-reel互換フォーマット）
 */

/**
 * 台本JSONをYAML文字列に変換
 * @param {Object} scriptData - Gemini生成の台本JSON
 * @returns {string} YAML文字列
 */
function toYaml(scriptData) {
  var lines = [];

  // ヘッダー
  lines.push('# ' + (scriptData.title || '台本'));
  lines.push('style: natural');
  lines.push('preset: coral');
  lines.push('scenes:');

  // シーン
  var scenes = scriptData.scenes || [];
  for (var i = 0; i < scenes.length; i++) {
    var scene = scenes[i];
    var role = scene.role || '';
    var personality = scene.personality || '';
    var comment = role + (personality ? ' - ' + personality : '');

    if (comment) {
      lines.push('  # ' + comment);
    }

    lines.push('  - text: ' + yamlQuote(scene.text || ''));

    if (scene.display && scene.display !== scene.text) {
      lines.push('    display: ' + yamlQuote(scene.display));
    }

    lines.push('    expression: ' + (scene.expression || 'normal'));

    if (scene.emphasis && scene.emphasis.length > 0) {
      lines.push('    emphasis: [' + scene.emphasis.map(yamlQuote).join(', ') + ']');
    }

    if (scene.overlay) {
      lines.push('    overlay: ' + scene.overlay);
    }

    lines.push('');
  }

  // CTA
  if (scriptData.cta) {
    lines.push('cta:');
    lines.push('  text: ' + yamlQuote(scriptData.cta.text || ''));
    lines.push('  expression: ' + (scriptData.cta.expression || 'bow'));
  }

  return lines.join('\n');
}

/**
 * YAML用に文字列をクォート
 * @param {string} str
 * @returns {string}
 */
function yamlQuote(str) {
  if (!str) return '""';
  // 特殊文字を含む場合はダブルクォート
  if (/[:#\[\]{}&*?|>!%@`,"']/.test(str) || str.indexOf('\n') >= 0) {
    return '"' + str.replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"';
  }
  return '"' + str + '"';
}
