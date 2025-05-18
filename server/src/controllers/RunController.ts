import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { RunService } from '../services/RunService';

export class RunController {
  /**
   * 指定されたディレクトリからrunデータを取得する
   */
  public static async getRunsFromDirectory(req: Request, res: Response): Promise<void> {
    try {
      const { directoryPath } = req.body;

      if (!directoryPath) {
        res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: 'Directory path is required'
        });
        return;
      }

      const runs = await RunService.loadRunsFromDirectory(directoryPath);

      res.status(StatusCodes.OK).json({
        success: true,
        data: {
          runs,
          count: runs.length
        }
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get runs';
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: errorMessage
      });
    }
  }

  /**
   * キャラクター別のrun統計を取得する
   */
  public static async getRunStatsByCharacter(req: Request, res: Response): Promise<void> {
    try {
      const { directoryPath } = req.body;

      if (!directoryPath) {
        res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: 'Directory path is required'
        });
        return;
      }

      const runs = await RunService.loadRunsFromDirectory(directoryPath);
      
      // キャラクターごとの統計を計算
      const characters = [...new Set(runs.map(run => run.character_chosen))];
      
      const stats = characters.map(character => {
        const characterRuns = RunService.filterRunsByCharacter(runs, character);
        const victories = RunService.getVictoryRuns(characterRuns);
        
        return {
          character,
          totalRuns: characterRuns.length,
          victories: victories.length,
          winRate: characterRuns.length > 0 ? (victories.length / characterRuns.length) * 100 : 0,
          averageFloor: characterRuns.length > 0 
            ? characterRuns.reduce((sum, run) => sum + run.floor_reached, 0) / characterRuns.length 
            : 0
        };
      });

      res.status(StatusCodes.OK).json({
        success: true,
        data: {
          stats,
          totalRuns: runs.length
        }
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get run stats';
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: errorMessage
      });
    }
  }

  /**
   * アセンションレベル別の勝率を取得する
   */
  public static async getWinRateByAscension(req: Request, res: Response): Promise<void> {
    try {
      const { directoryPath, character } = req.body;

      if (!directoryPath) {
        res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: 'Directory path is required'
        });
        return;
      }

      const runs = await RunService.loadRunsFromDirectory(directoryPath);
      
      // キャラクターでフィルタリング（指定されていれば）
      const filteredRuns = character 
        ? RunService.filterRunsByCharacter(runs, character)
        : runs;
      
      // アセンションレベルごとの統計を計算
      const ascensionLevels = [...new Set(filteredRuns.map(run => run.ascension_level))].sort((a, b) => a - b);
      
      const stats = ascensionLevels.map(level => {
        const levelRuns = RunService.filterRunsByAscensionLevel(filteredRuns, level);
        const victories = RunService.getVictoryRuns(levelRuns);
        
        return {
          ascensionLevel: level,
          totalRuns: levelRuns.length,
          victories: victories.length,
          winRate: levelRuns.length > 0 ? (victories.length / levelRuns.length) * 100 : 0
        };
      });

      res.status(StatusCodes.OK).json({
        success: true,
        data: {
          character: character || 'All Characters',
          stats,
          totalRuns: filteredRuns.length
        }
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get win rate by ascension';
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: errorMessage
      });
    }
  }
} 