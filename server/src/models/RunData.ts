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

// Slay the Spireのrunファイルを解析する関数
export function parseRunFile(fileContent: string): SlayTheSpireRun {
  try {
    // JSONとして解析
    const runData = JSON.parse(fileContent);
    
    // 必要なフィールドの確認と適切なデフォルト値の設定
    if (!runData.character_chosen) {
      throw new Error('Invalid run file format: missing character_chosen field');
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