"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useRunData, SlayTheSpireRun } from "../context/RunDataContext";
import { getCharacterUrlName } from "../util/navigationUtil";

export default function AnalysisPage() {
  const { runData, directoryPath, setRunData, clearSavedData } = useRunData();
  const router = useRouter();
  const [excludeAbandonedRuns, setExcludeAbandonedRuns] = useState(true);
  const [enableDateFilter, setEnableDateFilter] = useState(false);
  const [startDate, setStartDate] = useState("");

  useEffect(() => {
    // データがない場合はホームページにリダイレクト
    if (!runData) {
      router.push("/");
    }
  }, [runData, router]);

  if (!runData) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <p>データがありません。ホームページからデータを読み込んでください...</p>
      </div>
    );
  }

  // 捨てランを除外した有効なランの数
  const abandonedRunsCount = runData.runs.filter(
    (run) => !run.victory && run.floor_reached < 4
  ).length;

  // 日付フィルター用の処理
  const filterRunsByDate = (runs: SlayTheSpireRun[]): SlayTheSpireRun[] => {
    if (!enableDateFilter || !startDate) return runs;

    const startDateTime = new Date(startDate).getTime();
    return runs.filter((run) => {
      const runDate = new Date(run.formatted_time || run.local_time).getTime();
      return runDate >= startDateTime;
    });
  };

  // 捨てランと日付フィルターを適用したランを取得
  const filteredRuns = (() => {
    let runs = runData.runs;

    // 日付フィルター適用
    runs = filterRunsByDate(runs);

    // 捨てラン除外フィルター適用
    if (excludeAbandonedRuns) {
      runs = runs.filter((run) => run.victory || run.floor_reached >= 4);
    }

    return runs;
  })();

  // キャラクターごとにランをグループ化
  const characterGroups = filteredRuns.reduce(
    (groups: Record<string, SlayTheSpireRun[]>, run) => {
      const character = run.character_chosen;
      if (!groups[character]) {
        groups[character] = [];
      }
      groups[character].push(run);
      return groups;
    },
    {}
  );

  // 各キャラクターの勝率計算
  const characterStats = Object.entries(characterGroups).map(
    ([character, runs]) => {
      const victories = runs.filter((run) => run.victory);

      // 捨てランも含めた全てのランも計算（日付フィルターは適用）
      const allRuns = filterRunsByDate(runData.runs).filter(
        (run) => run.character_chosen === character
      );
      const abandonedRuns = allRuns.filter(
        (run) => !run.victory && run.floor_reached < 4
      );

      return {
        character,
        totalRuns: runs.length,
        victories: victories.length,
        winRate: runs.length > 0 ? (victories.length / runs.length) * 100 : 0,
        averageFloor:
          runs.length > 0
            ? runs.reduce((sum, run) => sum + run.floor_reached, 0) /
              runs.length
            : 0,
        // 捨てラン情報
        allRunsCount: allRuns.length,
        abandonedRunsCount: abandonedRuns.length,
      };
    }
  );

  // キャラクターの表示順を定義
  const characterOrder: Record<string, number> = {
    アイアンクラッド: 1,
    サイレント: 2,
    ディフェクト: 3,
    ウォッチャー: 4,
    // 英語名のフォールバック
    Ironclad: 1,
    Silent: 2,
    Defect: 3,
    Watcher: 4,
  };

  // キャラクター統計を指定された順番でソート
  const sortedCharacterStats = [...characterStats].sort((a, b) => {
    const orderA = characterOrder[a.character] || 999;
    const orderB = characterOrder[b.character] || 999;
    return orderA - orderB;
  });

  // アセンションレベルごとのデータ
  const ascensionLevels = [
    ...new Set(filteredRuns.map((run) => run.ascension_level)),
  ].sort((a, b) => a - b);

  const ascensionStats = ascensionLevels.map((level) => {
    const levelRuns = filteredRuns.filter(
      (run) => run.ascension_level === level
    );
    const victories = levelRuns.filter((run) => run.victory);

    // 捨てランも含めた全てのランも計算（日付フィルターは適用）
    const allLevelRuns = filterRunsByDate(runData.runs).filter(
      (run) => run.ascension_level === level
    );
    const abandonedRuns = allLevelRuns.filter(
      (run) => !run.victory && run.floor_reached < 4
    );

    return {
      level,
      totalRuns: levelRuns.length,
      victories: victories.length,
      winRate:
        levelRuns.length > 0 ? (victories.length / levelRuns.length) * 100 : 0,
      // 捨てラン情報
      allRunsCount: allLevelRuns.length,
      abandonedRunsCount: abandonedRuns.length,
    };
  });

  // プレイ時間の長い順にランを取得（上位10件）
  const longestRuns = [...filteredRuns]
    .sort((a, b) => b.playtime - a.playtime)
    .slice(0, 10);

  // 日付の最小値（最も古いプレイ日）を取得
  const oldestRunDate = (() => {
    if (runData.runs.length === 0) return "";

    // フォーマットされた日時から最も古いものを探す
    const dates = runData.runs
      .map((run) => new Date(run.formatted_time || run.local_time))
      .filter((date) => !isNaN(date.getTime()))
      .sort((a, b) => a.getTime() - b.getTime());

    if (dates.length === 0) return "";

    // HTML date input用のフォーマット (YYYY-MM-DD) に変換
    const oldest = dates[0];
    return `${oldest.getFullYear()}-${String(oldest.getMonth() + 1).padStart(
      2,
      "0"
    )}-${String(oldest.getDate()).padStart(2, "0")}`;
  })();

  return (
    <div className="max-w-6xl mx-auto p-5">
      <h1 className="text-3xl font-bold mb-6">Slay the Spire 分析結果</h1>

      <div className="mb-8 p-4 bg-gray-50 rounded-lg">
        <h2 className="text-xl font-semibold mb-2">基本情報</h2>
        <p>読み込んだディレクトリ: {directoryPath}</p>
        <p>
          総プレイ回数: {filteredRuns.length}
          {(excludeAbandonedRuns || enableDateFilter) &&
          filteredRuns.length !== runData.runs.length
            ? ` / ${runData.runs.length}`
            : ""}
        </p>
        <p>
          捨てランと思われるプレイ回数: {abandonedRunsCount}{" "}
          (3階層未満で終了したプレイ)
        </p>
        <p>最新のプレイ: {runData.runs[0]?.formatted_time || "日時不明"}</p>

        <div className="mt-4 space-y-2">
          <div className="flex items-center">
            <label className="inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={excludeAbandonedRuns}
                onChange={() => setExcludeAbandonedRuns(!excludeAbandonedRuns)}
                className="sr-only peer"
              />
              <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              <span className="ms-3 text-sm font-medium">
                捨てランを除外する（3階層未満で終了したプレイを除く）
              </span>
            </label>
          </div>

          <div className="flex items-center">
            <label className="inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={enableDateFilter}
                onChange={() => setEnableDateFilter(!enableDateFilter)}
                className="sr-only peer"
              />
              <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              <span className="ms-3 text-sm font-medium">
                日付でフィルターする
              </span>
            </label>
          </div>

          {enableDateFilter && (
            <div className="flex items-center mt-2">
              <label className="mr-2">開始日:</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                min={oldestRunDate}
                max={new Date().toISOString().split("T")[0]}
                className="p-2 border border-gray-300 rounded"
              />
              {startDate && (
                <span className="ml-4 text-sm text-gray-600">
                  {startDate}以降のプレイデータで分析しています
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="p-4 bg-gray-50 rounded-lg">
          <h2 className="text-xl font-semibold mb-3">キャラクター別統計</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-gray-100">
                  <th className="px-4 py-2 text-left">キャラクター</th>
                  <th className="px-4 py-2 text-left">プレイ回数</th>
                  <th className="px-4 py-2 text-left">勝利</th>
                  <th className="px-4 py-2 text-left">勝率</th>
                  <th className="px-4 py-2 text-left">平均到達階層</th>
                  <th className="px-4 py-2 text-left">捨てラン数</th>
                </tr>
              </thead>
              <tbody>
                {sortedCharacterStats.map((stat) => (
                  <tr key={stat.character} className="border-b">
                    <td className="px-4 py-2">
                      <button
                        onClick={() =>
                          router.push(
                            `/character/${getCharacterUrlName(stat.character)}`
                          )
                        }
                        className="text-blue-600 hover:underline cursor-pointer"
                      >
                        {stat.character}
                      </button>
                    </td>
                    <td className="px-4 py-2">
                      {stat.totalRuns}
                      {(excludeAbandonedRuns || enableDateFilter) &&
                      stat.totalRuns !== stat.allRunsCount
                        ? ` / ${stat.allRunsCount}`
                        : ""}
                    </td>
                    <td className="px-4 py-2">{stat.victories}</td>
                    <td className="px-4 py-2">{stat.winRate.toFixed(1)}%</td>
                    <td className="px-4 py-2">
                      {stat.averageFloor.toFixed(1)}
                    </td>
                    <td className="px-4 py-2">
                      {stat.abandonedRunsCount} (
                      {(
                        (stat.abandonedRunsCount / stat.allRunsCount) *
                        100
                      ).toFixed(1)}
                      %)
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="p-4 bg-gray-50 rounded-lg">
          <h2 className="text-xl font-semibold mb-3">
            アセンションレベル別統計
          </h2>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-gray-100">
                  <th className="px-4 py-2 text-left">アセンション</th>
                  <th className="px-4 py-2 text-left">プレイ回数</th>
                  <th className="px-4 py-2 text-left">勝利</th>
                  <th className="px-4 py-2 text-left">勝率</th>
                  <th className="px-4 py-2 text-left">捨てラン数</th>
                </tr>
              </thead>
              <tbody>
                {ascensionStats.map((stat) => (
                  <tr key={stat.level} className="border-b">
                    <td className="px-4 py-2">{stat.level}</td>
                    <td className="px-4 py-2">
                      {stat.totalRuns}
                      {(excludeAbandonedRuns || enableDateFilter) &&
                      stat.abandonedRunsCount > 0
                        ? ` / ${stat.allRunsCount}`
                        : ""}
                    </td>
                    <td className="px-4 py-2">{stat.victories}</td>
                    <td className="px-4 py-2">{stat.winRate.toFixed(1)}%</td>
                    <td className="px-4 py-2">
                      {stat.abandonedRunsCount} (
                      {(
                        (stat.abandonedRunsCount / stat.allRunsCount) *
                        100
                      ).toFixed(1)}
                      %)
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="p-4 bg-gray-50 rounded-lg mb-8">
        <h2 className="text-xl font-semibold mb-3">プレイ時間TOP10</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-4 py-2 text-left">キャラクター</th>
                <th className="px-4 py-2 text-left">アセンション</th>
                <th className="px-4 py-2 text-left">プレイ時間</th>
                <th className="px-4 py-2 text-left">到達階層</th>
                <th className="px-4 py-2 text-left">結果</th>
                <th className="px-4 py-2 text-left">日時</th>
              </tr>
            </thead>
            <tbody>
              {longestRuns.map((run, index) => (
                <tr key={index} className="border-b">
                  <td className="px-4 py-2">{run.character_chosen}</td>
                  <td className="px-4 py-2">{run.ascension_level}</td>
                  <td className="px-4 py-2">{formatPlaytime(run.playtime)}</td>
                  <td className="px-4 py-2">{run.floor_reached}</td>
                  <td className="px-4 py-2">
                    {run.victory ? (
                      <span className="text-green-600">勝利</span>
                    ) : (
                      <span className="text-red-600">
                        敗北{run.killed_by ? ` (${run.killed_by})` : ""}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2">
                    {run.formatted_time || "日時不明"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex gap-3 justify-between">
        <div>
          <button
            onClick={() => router.push("/")}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            ホームに戻る
          </button>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => {
              // 現在のディレクトリパスで再度データを読み込む
              fetch("http://localhost:3010/api/runs/from-directory", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({ directoryPath }),
              })
                .then((response) => response.json())
                .then((data) => {
                  if (data.success) {
                    setRunData(data.data);
                    alert(
                      `${data.data.count}件の実行データを再読み込みしました`
                    );
                  } else {
                    alert(data.message || "データの取得に失敗しました");
                  }
                })
                .catch((error) => {
                  alert("サーバーに接続できませんでした");
                  console.error("Error fetching data:", error);
                });
            }}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            データを再読み込み
          </button>

          <button
            onClick={() => {
              if (
                confirm("保存したデータをクリアしてホームページに戻りますか？")
              ) {
                clearSavedData();
                router.push("/");
              }
            }}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            データをクリア
          </button>
        </div>
      </div>
    </div>
  );
}

// プレイ時間をフォーマットする関数（秒→時間:分:秒）
function formatPlaytime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  return `${hours.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`;
}
