"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export interface SlayTheSpireRun {
  character_chosen: string;
  ascension_level: number;
  victory: boolean;
  floor_reached: number;
  killed_by?: string;
  playtime: number;
  seed_played?: string;
  gold: number;
  score: number;
  play_id: string;
  local_time: string;
  formatted_time?: string;
  is_daily: boolean;
  is_trial: boolean;
  is_endless: boolean;
  is_ascension_mode: boolean;
  master_deck: string[];
  relics: string[];
  potions_obtained?: Array<{ floor: number; key: string }>;
  potions_floor_usage?: number[];
  damage_taken?: Array<{
    damage: number;
    enemies: string;
    floor: number;
    turns: number;
  }>;
  path_per_floor?: string[];
  path_taken?: string[];
  items_purchased?: string[];
  // その他のフィールド
  [key: string]: unknown;
}

export interface RunDataContextType {
  runData: {
    runs: SlayTheSpireRun[];
    count: number;
  } | null;
  setRunData: React.Dispatch<
    React.SetStateAction<{
      runs: SlayTheSpireRun[];
      count: number;
    } | null>
  >;
  directoryPath: string;
  setDirectoryPath: React.Dispatch<React.SetStateAction<string>>;
  clearSavedData: () => void;
  isDataLoaded: boolean;
}

const RunDataContext = createContext<RunDataContextType | undefined>(undefined);

// ローカルストレージのキー
const STORAGE_KEYS = {
  RUN_DATA: "slayTheSpire_runData",
  DIRECTORY_PATH: "slayTheSpire_directoryPath",
};

export function RunDataProvider({ children }: { children: React.ReactNode }) {
  const [runData, setRunData] = useState<{
    runs: SlayTheSpireRun[];
    count: number;
  } | null>(null);
  const [directoryPath, setDirectoryPath] = useState<string>("");
  const [isDataLoaded, setIsDataLoaded] = useState<boolean>(false);

  // 初回レンダリング時にローカルストレージからデータを読み込む
  useEffect(() => {
    try {
      // ディレクトリパスの読み込み
      const savedPath = localStorage.getItem(STORAGE_KEYS.DIRECTORY_PATH);
      if (savedPath) {
        setDirectoryPath(savedPath);
      }

      // 実行データの読み込み
      const savedData = localStorage.getItem(STORAGE_KEYS.RUN_DATA);
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        setRunData(parsedData);
        setIsDataLoaded(true);
      }
    } catch (error) {
      console.error("Failed to load data from localStorage:", error);
    }
  }, []);

  // runDataが変更されたときにローカルストレージに保存
  useEffect(() => {
    try {
      if (runData) {
        localStorage.setItem(STORAGE_KEYS.RUN_DATA, JSON.stringify(runData));
        setIsDataLoaded(true);
      }
    } catch (error) {
      console.error("Failed to save runData to localStorage:", error);
    }
  }, [runData]);

  // directoryPathが変更されたときにローカルストレージに保存
  useEffect(() => {
    try {
      if (directoryPath) {
        localStorage.setItem(STORAGE_KEYS.DIRECTORY_PATH, directoryPath);
      }
    } catch (error) {
      console.error("Failed to save directoryPath to localStorage:", error);
    }
  }, [directoryPath]);

  // 保存データをクリアする関数
  const clearSavedData = () => {
    try {
      localStorage.removeItem(STORAGE_KEYS.RUN_DATA);
      localStorage.removeItem(STORAGE_KEYS.DIRECTORY_PATH);
      setRunData(null);
      setDirectoryPath("");
      setIsDataLoaded(false);
    } catch (error) {
      console.error("Failed to clear saved data:", error);
    }
  };

  return (
    <RunDataContext.Provider
      value={{
        runData,
        setRunData,
        directoryPath,
        setDirectoryPath,
        clearSavedData,
        isDataLoaded,
      }}
    >
      {children}
    </RunDataContext.Provider>
  );
}

export function useRunData() {
  const context = useContext(RunDataContext);
  if (context === undefined) {
    throw new Error("useRunData must be used within a RunDataProvider");
  }
  return context;
}
