import { Router } from 'express';
import { RunController } from '../controllers/RunController';

const router = Router();

// GET runs from directory
router.post('/from-directory', RunController.getRunsFromDirectory);

// GET run stats by character
router.post('/stats/by-character', RunController.getRunStatsByCharacter);

// GET win rate by ascension level
router.post('/stats/win-rate-by-ascension', RunController.getWinRateByAscension);

export default router; 