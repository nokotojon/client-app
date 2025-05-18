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

      // ディレクトリ内のファイルを取得
      const files = await fs.promises.readdir(directoryPath);
      
      // .jsonファイルと.runファイルをフィルタリング
      const validFiles = files.filter((file: string) => 
        file.endsWith('.json') || file.endsWith('.run')
      );
      
      // 各ファイルを読み込み、解析する
      const runDataPromises = validFiles.map(async (file: string) => {
        const filePath = path.join(directoryPath, file);
        try {
          const fileContent = await fs.promises.readFile(filePath, 'utf8');
          const runData = parseRunFile(fileContent);
          // ファイルパスを追加
          runData.filePath = filePath;
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
      throw new Error(`Failed to load runs from directory: ${error}`);
    }
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