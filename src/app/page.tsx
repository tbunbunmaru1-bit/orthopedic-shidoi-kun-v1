"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const COMMON_SURGERIES = [
  "人工膝関節置換術（TKA）",
  "人工股関節置換術（THA）",
  "前十字靭帯再建術（ACL）",
  "腰椎椎間板ヘルニア摘出術",
  "脊椎固定術（PLIF/TLIF）",
  "肩関節鏡視下腱板修復術",
  "骨折観血的整復固定術（ORIF）",
  "手根管症候群手術",
  "足関節固定術",
  "人工肩関節置換術",
];

export default function Home() {
  const [surgeryName, setSurgeryName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (name: string) => {
    const target = name || surgeryName;
    if (!target.trim()) return;
    setIsLoading(true);
    const slug = encodeURIComponent(target.trim());
    router.push(`/materials/${slug}`);
  };

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center">
      {/* ヒーローセクション */}
      <div className="text-center mb-12">
        <div className="text-6xl mb-4">🦴</div>
        <h1 className="text-4xl font-bold text-white mb-3">
          整形外科しどーい君 <span className="text-blue-400">v1</span>
        </h1>
        <p className="text-slate-400 text-lg max-w-xl">
          手術名を入力するだけで、専門医レベルの学習資料・スライド・クイズを自動生成します
        </p>
      </div>

      {/* 入力フォーム */}
      <div className="w-full max-w-2xl bg-slate-800 rounded-2xl p-8 shadow-2xl border border-slate-700">
        <div className="flex gap-3">
          <input
            type="text"
            value={surgeryName}
            onChange={(e) => setSurgeryName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit(surgeryName)}
            placeholder="手術名を入力（例：人工膝関節置換術）"
            className="flex-1 bg-slate-900 border border-slate-600 rounded-xl px-5 py-4 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
          />
          <button
            onClick={() => handleSubmit(surgeryName)}
            disabled={isLoading || !surgeryName.trim()}
            className="bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-semibold px-8 py-4 rounded-xl transition-colors text-lg whitespace-nowrap"
          >
            {isLoading ? "生成中..." : "資料生成"}
          </button>
        </div>

        {/* よく使う手術 */}
        <div className="mt-6">
          <p className="text-slate-500 text-sm mb-3">よく使われる手術：</p>
          <div className="flex flex-wrap gap-2">
            {COMMON_SURGERIES.map((surgery) => (
              <button
                key={surgery}
                onClick={() => handleSubmit(surgery)}
                className="bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white text-sm px-3 py-1.5 rounded-lg transition-colors"
              >
                {surgery}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 機能説明 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12 w-full max-w-4xl">
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <div className="text-3xl mb-3">📄</div>
          <h3 className="text-white font-semibold text-lg mb-2">学習資料</h3>
          <p className="text-slate-400 text-sm">解剖・手術手技・合併症・術後管理まで網羅した専門医レベルの資料を自動生成</p>
        </div>
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <div className="text-3xl mb-3">📊</div>
          <h3 className="text-white font-semibold text-lg mb-2">スライド</h3>
          <p className="text-slate-400 text-sm">プレゼンテーション形式のスライドで視覚的に学習。カンファレンスでも使用可能</p>
        </div>
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <div className="text-3xl mb-3">🎯</div>
          <h3 className="text-white font-semibold text-lg mb-2">クイズ</h3>
          <p className="text-slate-400 text-sm">専門医試験レベルの4択問題で理解度を確認。詳細な解説付きで確実な習得</p>
        </div>
      </div>
    </div>
  );
}
