"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function SlidesPage() {
  const params = useParams();
  const surgeryName = decodeURIComponent(params.surgery as string);
  const slug = params.surgery as string;

  const [slides, setSlides] = useState<string[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGenerated, setIsGenerated] = useState(false);
  const [error, setError] = useState("");
  const streamingRef = useRef<HTMLPreElement>(null);
  const fullContentRef = useRef("");

  useEffect(() => {
    const stored = localStorage.getItem(`slides_${slug}`);
    if (stored) {
      const parsed = JSON.parse(stored);
      setSlides(parsed);
      setIsGenerated(true);
    } else {
      const material = localStorage.getItem(`material_${slug}`);
      if (material) {
        generateSlides(material);
      } else {
        setError("先に学習資料を生成してください。");
      }
    }

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        setCurrentSlide((prev) => Math.min(prev + 1, slides.length - 1));
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        setCurrentSlide((prev) => Math.max(prev - 1, 0));
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [slug, slides.length]);

  const generateSlides = async (material: string) => {
    setIsGenerating(true);
    setError("");
    fullContentRef.current = "";

    try {
      const response = await fetch("/api/slides", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ surgeryName, content: material }),
      });

      if (!response.ok) throw new Error("スライド生成に失敗しました");

      const reader = response.body!.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        fullContentRef.current += decoder.decode(value, { stream: true });
        if (streamingRef.current) {
          streamingRef.current.textContent = fullContentRef.current;
        }
      }

      const fullContent = fullContentRef.current;
      // Marpのスライド区切りで分割
      const slideList = fullContent
        .split(/\n---\n/)
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      setSlides(slideList);
      localStorage.setItem(`slides_${slug}`, JSON.stringify(slideList));
      setIsGenerated(true);
    } catch (err) {
      setError("スライドの生成中にエラーが発生しました。");
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRegenerate = () => {
    localStorage.removeItem(`slides_${slug}`);
    const material = localStorage.getItem(`material_${slug}`);
    if (material) generateSlides(material);
  };

  const progress = slides.length > 0 ? ((currentSlide + 1) / slides.length) * 100 : 0;

  return (
    <div>
      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 text-slate-400 text-sm mb-2">
            <Link href="/" className="hover:text-white">ホーム</Link>
            <span>/</span>
            <Link href={`/materials/${slug}`} className="hover:text-white">{surgeryName}</Link>
            <span>/</span>
            <span className="text-white">スライド</span>
          </div>
          <h1 className="text-2xl font-bold text-white">{surgeryName} — スライド</h1>
        </div>
        <div className="flex gap-3">
          <Link href={`/materials/${slug}`} className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg text-sm transition-colors">
            📄 資料に戻る
          </Link>
          <Link href={`/quiz/${slug}`} className="bg-green-700 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm transition-colors">
            🎯 クイズへ
          </Link>
          {isGenerated && (
            <button onClick={handleRegenerate} className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg text-sm transition-colors">
              🔄 再生成
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-900/50 border border-red-500 text-red-200 p-4 rounded-xl mb-6">
          {error}
          <Link href={`/materials/${slug}`} className="ml-4 underline">資料を生成する</Link>
        </div>
      )}

      {isGenerating && (
        <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden mb-6">
          <div className="bg-purple-900/30 border-b border-purple-700 px-6 py-3 flex items-center gap-3">
            <div className="w-3 h-3 border-2 border-purple-400 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-purple-300 text-sm">スライドを生成中...</span>
          </div>
          <pre
            ref={streamingRef}
            className="p-6 text-slate-300 text-sm leading-relaxed whitespace-pre-wrap font-sans overflow-auto"
            style={{ maxHeight: "50vh" }}
          />
        </div>
      )}

      {/* スライドビューアー */}
      {isGenerated && slides.length > 0 && (
        <div>
          {/* プログレスバー */}
          <div className="w-full bg-slate-700 h-1 rounded-full mb-4">
            <div
              className="bg-blue-500 h-1 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* スライド表示 */}
          <div className="relative bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden"
            style={{ minHeight: "500px" }}>
            <div className="p-12 prose max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {slides[currentSlide]?.replace(/^---\nmarp: true[\s\S]*?---\n/, "") || ""}
              </ReactMarkdown>
            </div>

            {/* スライド番号 */}
            <div className="absolute bottom-4 right-6 text-slate-500 text-sm">
              {currentSlide + 1} / {slides.length}
            </div>
          </div>

          {/* ナビゲーション */}
          <div className="flex items-center justify-center gap-6 mt-6">
            <button
              onClick={() => setCurrentSlide((prev) => Math.max(prev - 1, 0))}
              disabled={currentSlide === 0}
              className="bg-slate-700 hover:bg-slate-600 disabled:opacity-40 text-white px-6 py-3 rounded-xl transition-colors flex items-center gap-2"
            >
              ← 前へ
            </button>

            <div className="flex gap-1">
              {slides.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentSlide(i)}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    i === currentSlide ? "bg-blue-500" : "bg-slate-600 hover:bg-slate-500"
                  }`}
                />
              ))}
            </div>

            <button
              onClick={() => setCurrentSlide((prev) => Math.min(prev + 1, slides.length - 1))}
              disabled={currentSlide === slides.length - 1}
              className="bg-slate-700 hover:bg-slate-600 disabled:opacity-40 text-white px-6 py-3 rounded-xl transition-colors flex items-center gap-2"
            >
              次へ →
            </button>
          </div>

          <p className="text-center text-slate-500 text-sm mt-3">
            ← → キーでスライドを移動できます
          </p>
        </div>
      )}
    </div>
  );
}
