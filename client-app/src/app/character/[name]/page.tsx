"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useRunData, SlayTheSpireRun } from "../../context/RunDataContext";
import { getCharacterDisplayName } from "../../util/navigationUtil";

export default function CharacterPage() {
  const router = useRouter();
  const params = useParams();
  const characterUrlName = params?.name as string;
  const { runData, directoryPath, setRunData } = useRunData();
  const [redirectTriggered, setRedirectTriggered] = useState(false);
  const [excludeAbandonedRuns, setExcludeAbandonedRuns] = useState(true);
  const [enableDateFilter, setEnableDateFilter] = useState(false);
  const [startDate, setStartDate] = useState("");

  // URL名から表示名に変換
  const displayName = getCharacterDisplayName(characterUrlName);

  // データがない場合にのみリダイレクト
  useEffect(() => {
    if (!runData && !redirectTriggered) {
      setRedirectTriggered(true);
      router.push("/");
    }
  }, [runData, router, redirectTriggered]);

  if (!runData) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <p>データがありません。ホームページからデータを読み込んでください...</p>
      </div>
    );
  }

  // 日付フィルター用の処理
  const filterRunsByDate = (runs: SlayTheSpireRun[]): SlayTheSpireRun[] => {
    if (!enableDateFilter || !startDate) return runs;

    const startDateTime = new Date(startDate).getTime();
    return runs.filter((run) => {
      const runDate = new Date(run.formatted_time || run.local_time).getTime();
      return runDate >= startDateTime;
    });
  };

  // このキャラクターのプレイデータを取得
  const allCharacterRuns = runData.runs.filter(
    (run) => run.character_chosen === displayName
  );

  // 日付フィルターを適用
  const dateFilteredRuns = filterRunsByDate(allCharacterRuns);

  // 捨てランの数を計算
  const abandonedRuns = dateFilteredRuns.filter(
    (run) => !run.victory && run.floor_reached < 4
  );

  // 捨てランを除外するかどうかでキャラクターのプレイデータをフィルタリング
  const characterRuns = excludeAbandonedRuns
    ? dateFilteredRuns.filter((run) => run.victory || run.floor_reached >= 4)
    : dateFilteredRuns;

  if (characterRuns.length === 0) {
    return (
      <div className="max-w-6xl mx-auto p-5">
        <h1 className="text-3xl font-bold mb-6">{displayName}のデータ</h1>
        <p>該当するプレイデータが見つかりませんでした。</p>
        <div className="mt-4">
          <button
            onClick={() => router.push("/analysis")}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            分析ページに戻る
          </button>
        </div>
      </div>
    );
  }

  // 勝利数と勝率を計算
  const victories = characterRuns.filter((run) => run.victory);
  const winRate = (victories.length / characterRuns.length) * 100;
  const averageFloor =
    characterRuns.reduce((sum, run) => sum + run.floor_reached, 0) /
    characterRuns.length;

  // アセンションレベルごとのデータ
  const ascensionLevels = [
    ...new Set(characterRuns.map((run) => run.ascension_level)),
  ].sort((a, b) => a - b);
  const ascensionStats = ascensionLevels.map((level) => {
    const levelRuns = characterRuns.filter(
      (run) => run.ascension_level === level
    );
    const levelVictories = levelRuns.filter((run) => run.victory);

    // 捨てランも含めた全てのランも計算
    const allLevelRuns = dateFilteredRuns.filter(
      (run) => run.ascension_level === level
    );
    const abandonedLevelRuns = allLevelRuns.filter(
      (run) => !run.victory && run.floor_reached < 4
    );

    return {
      level,
      totalRuns: levelRuns.length,
      victories: levelVictories.length,
      winRate:
        levelRuns.length > 0
          ? (levelVictories.length / levelRuns.length) * 100
          : 0,
      // 捨てラン情報
      allRunsCount: allLevelRuns.length,
      abandonedRunsCount: abandonedLevelRuns.length,
    };
  });

  // よく使われるカードのランキング
  const cardUsage: Record<string, number> = {};
  characterRuns.forEach((run) => {
    if (run.master_deck) {
      run.master_deck.forEach((card: string) => {
        cardUsage[card] = (cardUsage[card] || 0) + 1;
      });
    }
  });

  const topCards = Object.entries(cardUsage)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  // よく取得されるレリックのランキング
  const relicUsage: Record<string, number> = {};
  characterRuns.forEach((run) => {
    if (run.relics) {
      run.relics.forEach((relic: string) => {
        relicUsage[relic] = (relicUsage[relic] || 0) + 1;
      });
    }
  });

  const topRelics = Object.entries(relicUsage)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  // プレイ時間の長い順にランを取得（上位10件）
  const longestRuns = [...characterRuns]
    .sort((a, b) => b.playtime - a.playtime)
    .slice(0, 10);

  // 日付の最小値（最も古いプレイ日）を取得
  const oldestRunDate = (() => {
    if (allCharacterRuns.length === 0) return "";

    // フォーマットされた日時から最も古いものを探す
    const dates = allCharacterRuns
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
      <h1 className="text-3xl font-bold mb-6">{displayName}の分析</h1>

      <div className="mb-8 p-4 bg-gray-50 rounded-lg">
        <h2 className="text-xl font-semibold mb-3">基本情報</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p>
              総プレイ回数: {characterRuns.length}
              {(excludeAbandonedRuns || enableDateFilter) &&
              characterRuns.length !== allCharacterRuns.length
                ? ` / ${dateFilteredRuns.length}`
                : ""}
              {enableDateFilter &&
              dateFilteredRuns.length !== allCharacterRuns.length
                ? ` (全期間: ${allCharacterRuns.length})`
                : ""}
            </p>
            <p>勝利数: {victories.length}</p>
            <p>勝率: {winRate.toFixed(1)}%</p>
            <p>平均到達階層: {averageFloor.toFixed(1)}</p>
            <p>
              捨てラン: {abandonedRuns.length} (
              {((abandonedRuns.length / dateFilteredRuns.length) * 100).toFixed(
                1
              )}
              %)
            </p>
          </div>
          <div>
            <p>最高アセンション: {Math.max(...ascensionLevels)}</p>
            <p>
              最新のプレイ: {characterRuns[0]?.formatted_time || "日時不明"}
            </p>
            <div className="mt-4 space-y-2">
              <div className="flex items-center">
                <label className="inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={excludeAbandonedRuns}
                    onChange={() =>
                      setExcludeAbandonedRuns(!excludeAbandonedRuns)
                    }
                    className="sr-only peer"
                  />
                  <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  <span className="ms-3 text-sm font-medium">
                    捨てランを除外する（3階層未満で終了したプレイを除く）
                  </span>
                </label>
              </div>

              <div className="flex items-center mt-2">
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
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
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
                      stat.totalRuns !== stat.allRunsCount
                        ? ` / ${stat.allRunsCount}`
                        : ""}
                    </td>
                    <td className="px-4 py-2">{stat.victories}</td>
                    <td className="px-4 py-2">{stat.winRate.toFixed(1)}%</td>
                    <td className="px-4 py-2">
                      {stat.abandonedRunsCount} (
                      {stat.allRunsCount > 0
                        ? (
                            (stat.abandonedRunsCount / stat.allRunsCount) *
                            100
                          ).toFixed(1)
                        : 0}
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
            よく使用されるカード TOP10
          </h2>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-gray-100">
                  <th className="px-4 py-2 text-left">カード名</th>
                  <th className="px-4 py-2 text-left">使用回数</th>
                  <th className="px-4 py-2 text-left">使用率</th>
                </tr>
              </thead>
              <tbody>
                {topCards.map(([card, count], index) => (
                  <tr key={index} className="border-b">
                    <td className="px-4 py-2">{card}</td>
                    <td className="px-4 py-2">{count}</td>
                    <td className="px-4 py-2">
                      {((count / characterRuns.length) * 100).toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="p-4 bg-gray-50 rounded-lg">
          <h2 className="text-xl font-semibold mb-3">
            よく取得されるレリック TOP10
          </h2>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-gray-100">
                  <th className="px-4 py-2 text-left">レリック名</th>
                  <th className="px-4 py-2 text-left">取得回数</th>
                  <th className="px-4 py-2 text-left">取得率</th>
                </tr>
              </thead>
              <tbody>
                {topRelics.map(([relic, count], index) => (
                  <tr key={index} className="border-b">
                    <td className="px-4 py-2">{relic}</td>
                    <td className="px-4 py-2">{count}</td>
                    <td className="px-4 py-2">
                      {((count / characterRuns.length) * 100).toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="p-4 bg-gray-50 rounded-lg">
          <h2 className="text-xl font-semibold mb-3">プレイ時間TOP10</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-gray-100">
                  <th className="px-4 py-2 text-left">アセンション</th>
                  <th className="px-4 py-2 text-left">プレイ時間</th>
                  <th className="px-4 py-2 text-left">結果</th>
                  <th className="px-4 py-2 text-left">日時</th>
                </tr>
              </thead>
              <tbody>
                {longestRuns.map((run, index) => (
                  <tr key={index} className="border-b">
                    <td className="px-4 py-2">{run.ascension_level}</td>
                    <td className="px-4 py-2">
                      {formatPlaytime(run.playtime)}
                    </td>
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
      </div>

      <div className="flex gap-3 justify-between">
        <button
          onClick={() => router.push("/analysis")}
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
        >
          分析ページに戻る
        </button>

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
