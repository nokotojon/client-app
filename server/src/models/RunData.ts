// RunData.ts - Model representing Slay the Spire run data

// Basic interface for a Slay the Spire run
export interface SlayTheSpireRun {
  // 基本情報
  character_chosen: string;
  ascension_level: number;
  victory: boolean;
  floor_reached: number;
  killed_by?: string;
  playtime: number; // in seconds
  seed_played?: string;
  
  // 詳細情報
  gold: number;
  score: number;
  play_id: string;
  local_time: string;
  formatted_time?: string; // フォーマットされた日時文字列
  is_daily: boolean;
  is_trial: boolean;
  is_endless: boolean;
  is_ascension_mode: boolean;
  
  // カード・レリック・ポーション情報
  master_deck: string[];
  relics: string[];
  potions_obtained?: Array<{floor: number, key: string}>;
  potions_floor_usage?: number[];
  
  // 戦闘情報
  damage_taken?: Array<{
    damage: number;
    enemies: string;
    floor: number;
    turns: number;
  }>;
  
  // ルート情報
  path_per_floor?: string[];
  path_taken?: string[];
  
  // 追加詳細
  items_purchased?: string[];
  campfire_choices?: any[];
  boss_relics?: any[];
  
  // ファイルパス情報（追跡用）
  filePath?: string;
  
  // その他の情報（.runファイルに含まれる可能性のあるフィールド）
  [key: string]: any;
}

/**
 * Slay the SpireのYYYYMMDDHHMMSS形式の日時文字列をDate形式に変換する関数
 * @param dateString YYYYMMDDHHMMSSの形式の文字列
 * @returns フォーマットされた日時文字列（YYYY-MM-DD HH:MM:SS）
 */
export function parseSlayTheSpireDate(dateString: string): string {
  // 正規表現で日付形式をチェック
  if (!/^\d{14}$/.test(dateString)) {
    // 14桁の数字でない場合はそのまま返す
    return dateString;
  }

  try {
    // YYYYMMDDHHMMSSを分解
    const year = dateString.substring(0, 4);
    const month = dateString.substring(4, 6);
    const day = dateString.substring(6, 8);
    const hour = dateString.substring(8, 10);
    const minute = dateString.substring(10, 12);
    const second = dateString.substring(12, 14);
    
    // ISO形式の日時文字列に変換（YYYY-MM-DDTHH:MM:SS）
    const isoString = `${year}-${month}-${day}T${hour}:${minute}:${second}`;
    
    // Date型に変換して正しくパースできるか確認
    const date = new Date(isoString);
    if (isNaN(date.getTime())) {
      // 無効な日付の場合はそのまま返す
      return dateString;
    }
    
    // フォーマットした日付を返す
    return date.toLocaleString();
  } catch (e) {
    // パースに失敗した場合はそのまま返す
    console.error("Failed to parse date:", e);
    return dateString;
  }
}

// Slay the Spireのrunファイルを解析する関数
export function parseRunFile(fileContent: string): SlayTheSpireRun {
  try {
    // JSONとして解析
    const runData = JSON.parse(fileContent);
    
    // 必要なフィールドの確認と適切なデフォルト値の設定
    if (!runData.character_chosen) {
      throw new Error('Invalid run file format: missing character_chosen field');
    }
    
    // local_timeフィールドを処理して、フォーマットされた日時を追加
    let formattedTime = '';
    if (runData.local_time) {
      formattedTime = parseSlayTheSpireDate(runData.local_time);
    }
    
    // インターフェースに合わせて整形して返す
    return {
      character_chosen: runData.character_chosen || '',
      ascension_level: runData.ascension_level || 0,
      victory: runData.victory || false,
      floor_reached: runData.floor_reached || 0,
      killed_by: runData.killed_by,
      playtime: runData.playtime || 0,
      seed_played: runData.seed_played || runData.seed || '',
      
      gold: runData.gold || 0,
      score: runData.score || 0,
      play_id: runData.play_id || '',
      local_time: runData.local_time || '',
      formatted_time: formattedTime, // フォーマットされた日時を追加
      is_daily: runData.is_daily || false,
      is_trial: runData.is_trial || false,
      is_endless: runData.is_endless || false,
      is_ascension_mode: runData.is_ascension_mode || false,
      
      master_deck: runData.master_deck || [],
      relics: runData.relics || [],
      potions_obtained: runData.potions_obtained || [],
      potions_floor_usage: runData.potions_floor_usage || [],
      
      damage_taken: runData.damage_taken || [],
      
      path_per_floor: runData.path_per_floor || [],
      path_taken: runData.path_taken || [],
      
      items_purchased: runData.items_purchased || [],
      campfire_choices: runData.campfire_choices || [],
      boss_relics: runData.boss_relics || [],
      
      // その他のフィールドはそのまま保持
      ...runData
    };
  } catch (error) {
    throw new Error(`Failed to parse run file: ${error}`);
  }
} 