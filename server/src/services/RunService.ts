import fs from 'fs';
import path from 'path';
import { SlayTheSpireRun, parseRunFile } from '../models/RunData';

export class RunService {
  /**
   * 指定されたディレクトリからSlay the Spireのrunファイルを読み込む
   * @param directoryPath ファイルを検索するディレクトリパス
   * @returns 読み込まれたrunデータの配列
   */
  public static async loadRunsFromDirectory(directoryPath: string): Promise<SlayTheSpireRun[]> {
    try {
      // ディレクトリが存在するか確認
      if (!fs.existsSync(directoryPath)) {
        throw new Error(`Directory not found: ${directoryPath}`);
      }

      // ルートディレクトリ内のキャラクターディレクトリを取得
      const characterDirs = await fs.promises.readdir(directoryPath);
      
      // 各キャラクターディレクトリからファイルを読み込む
      const allRunDataPromises: Promise<SlayTheSpireRun[]>[] = [];
      
      for (const characterDir of characterDirs) {
        const characterPath = path.join(directoryPath, characterDir);
        const characterStat = await fs.promises.stat(characterPath);
        
        // ディレクトリの場合のみ処理
        if (characterStat.isDirectory()) {
          const runDataPromise = this.loadRunsFromCharacterDirectory(characterPath, characterDir);
          allRunDataPromises.push(runDataPromise);
        }
      }
      
      // 全てのキャラクターのデータを結合
      const allRunsNested = await Promise.all(allRunDataPromises);
      const allRuns = allRunsNested.flat();
      
      // 全てのランについてキャラクター名を確実に正規化
      allRuns.forEach(run => {
        if (run.character_chosen) {
          // 英語名の場合はカタカナ名に変換
          const normalizedName = this.normalizeCharacterName(run.character_chosen.toUpperCase());
          if (normalizedName !== run.character_chosen) {
            run.character_chosen = normalizedName;
          }
        }
      });
      
      // 日付順にソート（新しい順）
      return allRuns.sort((a, b) => {
        const dateA = new Date(a.local_time).getTime();
        const dateB = new Date(b.local_time).getTime();
        return dateB - dateA;
      });
    } catch (error) {
      throw new Error(`Failed to load runs from directory: ${error}`);
    }
  }
  
  /**
   * 特定のキャラクターのディレクトリからrunファイルを読み込む
   * @param characterPath キャラクターのディレクトリパス
   * @param characterName キャラクター名（ディレクトリ名）
   * @returns 読み込まれたrunデータの配列
   */
  private static async loadRunsFromCharacterDirectory(
    characterPath: string, 
    characterName: string
  ): Promise<SlayTheSpireRun[]> {
    try {
      // キャラクターディレクトリ内のファイルを取得
      const files = await fs.promises.readdir(characterPath);
      
      // .jsonファイルと.runファイルをフィルタリング
      const validFiles = files.filter((file: string) => 
        file.endsWith('.json') || file.endsWith('.run')
      );
      
      // 各ファイルを読み込み、解析する
      const runDataPromises = validFiles.map(async (file: string) => {
        const filePath = path.join(characterPath, file);
        try {
          const fileContent = await fs.promises.readFile(filePath, 'utf8');
          const runData = parseRunFile(fileContent);
          // ファイルパスとキャラクター情報を追加
          runData.filePath = filePath;
          // キャラクター名が設定されていない場合はディレクトリ名を使用
          if (!runData.character_chosen) {
            runData.character_chosen = this.normalizeCharacterName(characterName);
          }
          return runData;
        } catch (error) {
          console.error(`Error reading file ${file}:`, error);
          return null;
        }
      });

      // 全てのファイルの読み込み完了を待つ
      const runDataResults = await Promise.all(runDataPromises);
      
      // nullでない結果のみを返す
      return runDataResults.filter((run: unknown): run is SlayTheSpireRun => run !== null);
    } catch (error) {
      console.error(`Error loading runs from character directory ${characterName}:`, error);
      return []; // エラー時は空配列を返す
    }
  }
  
  /**
   * キャラクター名を正規化する
   * （DIRECTORYタイプからゲーム内表示用の名前に変換）
   */
  private static normalizeCharacterName(dirName: string): string {
    const nameMap: { [key: string]: string } = {
      'IRONCLAD': 'アイアンクラッド',
      'THE_SILENT': 'サイレント',
      'DEFECT': 'ディフェクト',
      'WATCHER': 'ウォッチャー'
    };
    
    return nameMap[dirName] || dirName;
  }

  /**
   * キャラクター名の表示順を決定する値を返す
   * @param character キャラクター名
   * @returns 表示順の値（小さいほど先に表示）
   */
  public static getCharacterSortOrder(character: string): number {
    const orderMap: { [key: string]: number } = {
      'アイアンクラッド': 1,
      'サイレント': 2,
      'ディフェクト': 3,
      'ウォッチャー': 4,
      // 英語名のフォールバック
      'Ironclad': 1,
      'Silent': 2,
      'Defect': 3,
      'Watcher': 4
    };
    
    return orderMap[character] || 999; // 未知のキャラクターは最後に表示
  }

  /**
   * 特定のキャラクターでフィルタリングされたrunを取得
   * @param runs すべてのrunデータ
   * @param character フィルタリングするキャラクター名
   * @returns フィルタリングされたrunデータの配列
   */
  public static filterRunsByCharacter(runs: SlayTheSpireRun[], character: string): SlayTheSpireRun[] {
    return runs.filter(run => run.character_chosen.toLowerCase() === character.toLowerCase());
  }

  /**
   * Ascensionレベルでフィルタリングされたrunを取得
   * @param runs すべてのrunデータ
   * @param level フィルタリングするAscensionレベル
   * @returns フィルタリングされたrunデータの配列
   */
  public static filterRunsByAscensionLevel(runs: SlayTheSpireRun[], level: number): SlayTheSpireRun[] {
    return runs.filter(run => run.ascension_level === level);
  }

  /**
   * 勝利したrunのみを取得
   * @param runs すべてのrunデータ
   * @returns 勝利したrunデータの配列
   */
  public static getVictoryRuns(runs: SlayTheSpireRun[]): SlayTheSpireRun[] {
    return runs.filter(run => run.victory);
  }
} 