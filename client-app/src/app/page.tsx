"use client";

import React, { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient();

interface RunData {
  runs: Array<{
    character_chosen: string;
    ascension_level: number;
    victory: boolean;
  }>;
  count: number;
}

export default function Home() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="max-w-6xl mx-auto p-5">
        <h1 className="text-3xl font-bold mb-6">Slay the Spire 実行分析</h1>
        <DirectoryForm />
      </div>
    </QueryClientProvider>
  );
}

function DirectoryForm() {
  const [directoryPath, setDirectoryPath] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [runData, setRunData] = useState<RunData | null>(null);
  const [toastMessage, setToastMessage] = useState<{
    status: string;
    message: string;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!directoryPath) {
      setToastMessage({
        status: "error",
        message: "ディレクトリパスを入力してください",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(
        "http://localhost:3010/api/runs/from-directory",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ directoryPath }),
        }
      );

      const data = await response.json();
      if (data.success) {
        setRunData(data.data);
        setToastMessage({
          status: "success",
          message: `${data.data.count}件の実行データを読み込みました`,
        });
      } else {
        setToastMessage({
          status: "error",
          message: data.message || "データの取得に失敗しました",
        });
      }
    } catch (error) {
      setToastMessage({
        status: "error",
        message: "サーバーに接続できませんでした",
      });
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {toastMessage && (
        <div
          className={`fixed top-4 right-4 p-3 text-white rounded-md z-50 ${
            toastMessage.status === "success" ? "bg-green-500" : "bg-red-500"
          }`}
        >
          {toastMessage.message}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="flex flex-col gap-4">
          <div>
            <label className="block mb-2">
              Slay the Spireのrunディレクトリパスを入力してください：
            </label>
            <input
              className="w-full p-2 border border-gray-300 rounded"
              placeholder="/Users/username/Library/ApplicationSupport/SlayTheSpire/runs"
              value={directoryPath}
              onChange={(e) => setDirectoryPath(e.target.value)}
            />
            <p className="text-sm text-gray-500 mt-1">
              例: macOSの場合 ~/Library/ApplicationSupport/SlayTheSpire/runs
            </p>
          </div>
          <button
            type="submit"
            className={`px-4 py-2 bg-teal-500 text-white rounded hover:bg-teal-600 ${
              isLoading ? "opacity-50 cursor-not-allowed" : ""
            }`}
            disabled={isLoading}
          >
            {isLoading ? "読み込み中..." : "データを読み込む"}
          </button>
        </div>

        {runData && (
          <div className="mt-6">
            <h2 className="text-xl font-semibold mb-3">実行データ概要</h2>
            <p>読み込んだデータ数: {runData.count}</p>
            {runData.runs && runData.runs.length > 0 && (
              <p className="mt-2">
                最新の実行: {runData.runs[0].character_chosen} (アセンション{" "}
                {runData.runs[0].ascension_level})
                {runData.runs[0].victory ? " - 勝利" : " - 敗北"}
              </p>
            )}
          </div>
        )}
      </form>
    </>
  );
}
