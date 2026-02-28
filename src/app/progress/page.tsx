"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ProgressData } from "@/lib/types";

export default function ProgressPage() {
  const [progress, setProgress] = useState<ProgressData>({});

  useEffect(() => {
    const data = JSON.parse(localStorage.getItem("progress") || "{}");
    setProgress(data);
  }, []);

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getBestScore = (results: ProgressData[string]["quizResults"]) => {
    if (results.length === 0) return null;
    return Math.max(...results.map((r) => Math.round((r.score / r.total) * 100)));
  };

  const getLatestScore = (results: ProgressData[string]["quizResults"]) => {
    if (results.length === 0) return null;
    const latest = results[results.length - 1];
    return Math.round((latest.score / latest.total) * 100);
  };

  const totalSurgeries = Object.keys(progress).length;
  const totalQuizzes = Object.values(progress).reduce(
    (sum, p) => sum + p.quizResults.length,
    0
  );
  const avgScore =
    totalQuizzes === 0
      ? 0
      : Math.round(
          Object.values(progress).reduce(
            (sum, p) =>
              sum +
              p.quizResults.reduce(
                (s, r) => s + (r.score / r.total) * 100,
                0
              ),
            0
          ) / totalQuizzes
        );

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">学習進捗</h1>
        <p className="text-slate-400">あなたの整形外科学習の記録</p>
      </div>

      {/* サマリー */}
      <div className="grid grid-cols-3 gap-6 mb-8">
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 text-center">
          <div className="text-4xl font-bold text-blue-400 mb-1">{totalSurgeries}</div>
          <div className="text-slate-400 text-sm">学習した手術</div>
        </div>
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 text-center">
          <div className="text-4xl font-bold text-green-400 mb-1">{totalQuizzes}</div>
          <div className="text-slate-400 text-sm">クイズ受験回数</div>
        </div>
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 text-center">
          <div className="text-4xl font-bold text-purple-400 mb-1">{avgScore}%</div>
          <div className="text-slate-400 text-sm">平均正解率</div>
        </div>
      </div>

      {/* 手術別進捗 */}
      {totalSurgeries === 0 ? (
        <div className="text-center py-20 bg-slate-800 rounded-2xl border border-slate-700">
          <div className="text-5xl mb-4">📚</div>
          <h3 className="text-white text-xl font-semibold mb-3">まだ学習していません</h3>
          <p className="text-slate-400 mb-6">ホームから手術名を入力して学習を始めましょう</p>
          <Link
            href="/"
            className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
          >
            学習を始める
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(progress).map(([slug, data]) => {
            const bestScore = getBestScore(data.quizResults);
            const latestScore = getLatestScore(data.quizResults);

            return (
              <div key={slug} className="bg-slate-800 rounded-xl border border-slate-700 p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-white font-semibold text-lg mb-1">
                      {data.title}
                    </h3>
                    <p className="text-slate-500 text-sm">
                      最終学習: {formatDate(data.lastStudied)}
                      {data.quizResults.length > 0 && (
                        <> · クイズ {data.quizResults.length} 回受験</>
                      )}
                    </p>

                    {/* スコア推移 */}
                    {data.quizResults.length > 0 && (
                      <div className="mt-3 flex items-center gap-6">
                        <div>
                          <span className="text-slate-500 text-xs">最高スコア </span>
                          <span className={`font-bold ${(bestScore ?? 0) >= 80 ? "text-green-400" : (bestScore ?? 0) >= 60 ? "text-yellow-400" : "text-red-400"}`}>
                            {bestScore}%
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500 text-xs">直近スコア </span>
                          <span className={`font-bold ${(latestScore ?? 0) >= 80 ? "text-green-400" : (latestScore ?? 0) >= 60 ? "text-yellow-400" : "text-red-400"}`}>
                            {latestScore}%
                          </span>
                        </div>
                      </div>
                    )}

                    {/* スコアバー */}
                    {bestScore !== null && (
                      <div className="mt-3 w-64 bg-slate-700 h-2 rounded-full">
                        <div
                          className={`h-2 rounded-full transition-all ${
                            bestScore >= 80 ? "bg-green-500" : bestScore >= 60 ? "bg-yellow-500" : "bg-red-500"
                          }`}
                          style={{ width: `${bestScore}%` }}
                        />
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 ml-4">
                    <Link
                      href={`/materials/${slug}`}
                      className="bg-slate-700 hover:bg-slate-600 text-white text-sm px-4 py-2 rounded-lg transition-colors"
                    >
                      📄 資料
                    </Link>
                    <Link
                      href={`/slides/${slug}`}
                      className="bg-purple-900/50 hover:bg-purple-900/80 text-white text-sm px-4 py-2 rounded-lg transition-colors"
                    >
                      📊 スライド
                    </Link>
                    <Link
                      href={`/quiz/${slug}`}
                      className="bg-green-900/50 hover:bg-green-900/80 text-white text-sm px-4 py-2 rounded-lg transition-colors"
                    >
                      🎯 クイズ
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-8 text-center">
        <Link
          href="/"
          className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-6 py-3 rounded-xl transition-colors inline-block"
        >
          + 新しい手術を学ぶ
        </Link>
      </div>
    </div>
  );
}
