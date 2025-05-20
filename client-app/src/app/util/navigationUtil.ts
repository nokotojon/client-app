/**
 * キャラクター名からURL用の名前を取得する関数
 */
export function getCharacterUrlName(characterName: string): string {
  const nameMapping: Record<string, string> = {
    アイアンクラッド: "ironclad",
    サイレント: "silent",
    ディフェクト: "defect",
    ウォッチャー: "watcher",
    // 英語名のフォールバック
    Ironclad: "ironclad",
    Silent: "silent",
    Defect: "defect",
    Watcher: "watcher",
  };

  return nameMapping[characterName] || characterName.toLowerCase();
}

/**
 * URL用の名前からキャラクター表示名を取得する関数
 */
export function getCharacterDisplayName(urlName: string): string {
  const nameMapping: Record<string, string> = {
    ironclad: "アイアンクラッド",
    silent: "サイレント",
    defect: "ディフェクト",
    watcher: "ウォッチャー",
  };

  return nameMapping[urlName] || urlName;
}
