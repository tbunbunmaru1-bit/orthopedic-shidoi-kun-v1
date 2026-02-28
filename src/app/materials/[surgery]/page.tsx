"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Link from "next/link";

export default function MaterialPage() {
  const params = useParams();
  const router = useRouter();
  const surgeryName = decodeURIComponent(params.surgery as string);
  const slug = params.surgery as string;

  const [content, setContent] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGenerated, setIsGenerated] = useState(false);
  const [error, setError] = useState("");
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stored = localStorage.getItem(`material_${slug}`);
    if (stored) {
      setContent(stored);
      setIsGenerated(true);
    } else {
      generateMaterial();
    }
  }, [slug]);

  const generateMaterial = async () => {
    setIsGenerating(true);
    setContent("");
    setError("");
    setIsGenerated(false);

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ surgeryName }),
      });

      if (!response.ok) throw new Error("生成に失敗しました");

      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let fullContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        fullContent += chunk;
        setContent(fullContent);
      }

      localStorage.setItem(`material_${slug}`, fullContent);

      // 進捗データを更新
      const progressData = JSON.parse(localStorage.getItem("progress") || "{}");
      if (!progressData[slug]) {
        progressData[slug] = { title: surgeryName, quizResults: [], lastStudied: new Date().toISOString() };
      } else {
        progressData[slug].lastStudied = new Date().toISOString();
      }
      localStorage.setItem("progress", JSON.stringify(progressData));

      setIsGenerated(true);
    } catch (err) {
      setError("資料の生成中にエラーが発生しました。もう一度お試しください。");
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRegenerate = () => {
    localStorage.removeItem(`material_${slug}`);
    generateMaterial();
  };

  return (
    <div>
      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 text-slate-400 text-sm mb-2">
            <Link href="/" className="hover:text-white transition-colors">ホーム</Link>
            <span>/</span>
            <span className="text-white">{surgeryName}</span>
          </div>
          <h1 className="text-3xl font-bold text-white">{surgeryName}</h1>
        </div>
        {isGenerated && (
          <div className="flex gap-3">
            <Link
              href={`/slides/${slug}`}
              className="bg-purple-700 hover:bg-purple-600 text-white font-medium px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
            >
              📊 スライド
            </Link>
            <Link
              href={`/quiz/${slug}`}
              className="bg-green-700 hover:bg-green-600 text-white font-medium px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
            >
              🎯 クイズ
            </Link>
            <button
              onClick={handleRegenerate}
              className="bg-slate-700 hover:bg-slate-600 text-white font-medium px-4 py-2 rounded-lg transition-colors"
            >
              🔄 再生成
            </button>
          </div>
        )}
      </div>

      {/* エラー */}
      {error && (
        <div className="bg-red-900/50 border border-red-500 text-red-200 p-4 rounded-xl mb-6">
          {error}
          <button onClick={generateMaterial} className="ml-4 underline">再試行</button>
        </div>
      )}

      {/* 生成中インジケーター */}
      {isGenerating && (
        <div className="bg-blue-900/30 border border-blue-700 rounded-xl p-4 mb-6 flex items-center gap-3">
          <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-blue-300">Claude が専門医レベルの学習資料を生成中...</span>
        </div>
      )}

      {/* コンテンツ */}
      {content && (
        <div className="bg-slate-800 rounded-2xl p-8 border border-slate-700" ref={contentRef}>
          <div className="prose">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
          </div>
        </div>
      )}

      {/* 生成完了後のアクション */}
      {isGenerated && (
        <div className="mt-8 grid grid-cols-2 gap-4">
          <Link
            href={`/slides/${slug}`}
            className="bg-purple-900/50 hover:bg-purple-900/80 border border-purple-700 rounded-xl p-6 text-center transition-colors"
          >
            <div className="text-4xl mb-2">📊</div>
            <div className="text-white font-semibold text-lg">スライドで学ぶ</div>
            <div className="text-purple-300 text-sm mt-1">プレゼンテーション形式で復習</div>
          </Link>
          <Link
            href={`/quiz/${slug}`}
            className="bg-green-900/50 hover:bg-green-900/80 border border-green-700 rounded-xl p-6 text-center transition-colors"
          >
            <div className="text-4xl mb-2">🎯</div>
            <div className="text-white font-semibold text-lg">クイズで確認</div>
            <div className="text-green-300 text-sm mt-1">専門医試験レベルの4択問題</div>
          </Link>
        </div>
      )}
    </div>
  );
}
