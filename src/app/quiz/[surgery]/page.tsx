"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { QuizQuestion, QuizResult } from "@/lib/types";

type Phase = "loading" | "ready" | "quiz" | "result" | "error";

export default function QuizPage() {
  const params = useParams();
  const surgeryName = decodeURIComponent(params.surgery as string);
  const slug = params.surgery as string;

  const [phase, setPhase] = useState<Phase>("loading");
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [answers, setAnswers] = useState<{ correct: boolean; userAnswer: number; correctAnswer: number; question: string }[]>([]);
  const [error, setError] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(`quiz_${slug}`);
    if (stored) {
      setQuestions(JSON.parse(stored));
      setPhase("ready");
    } else {
      const material = localStorage.getItem(`material_${slug}`);
      if (material) {
        generateQuiz(material);
      } else {
        setError("先に学習資料を生成してください。");
        setPhase("error");
      }
    }
  }, [slug]);

  const generateQuiz = async (material: string) => {
    setIsGenerating(true);
    setPhase("loading");

    try {
      const response = await fetch("/api/quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ surgeryName, content: material }),
      });

      const data = await response.json();
      if (!response.ok || !data.questions) throw new Error(data.error || "生成失敗");

      setQuestions(data.questions);
      localStorage.setItem(`quiz_${slug}`, JSON.stringify(data.questions));
      setPhase("ready");
    } catch (err) {
      setError("クイズの生成中にエラーが発生しました。");
      setPhase("error");
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  const startQuiz = () => {
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setIsAnswered(false);
    setAnswers([]);
    setPhase("quiz");
  };

  const handleAnswer = (index: number) => {
    if (isAnswered) return;
    setSelectedAnswer(index);
    setIsAnswered(true);

    const q = questions[currentIndex];
    setAnswers((prev) => [
      ...prev,
      {
        correct: index === q.answer,
        userAnswer: index,
        correctAnswer: q.answer,
        question: q.question,
      },
    ]);
  };

  const handleNext = () => {
    if (currentIndex + 1 >= questions.length) {
      finishQuiz();
    } else {
      setCurrentIndex((prev) => prev + 1);
      setSelectedAnswer(null);
      setIsAnswered(false);
    }
  };

  const finishQuiz = () => {
    const score = answers.filter((a) => a.correct).length;
    const result: QuizResult = {
      surgerySlug: slug,
      surgeryTitle: surgeryName,
      score,
      total: questions.length,
      date: new Date().toISOString(),
      questions: answers,
    };

    // 進捗を保存
    const progressData = JSON.parse(localStorage.getItem("progress") || "{}");
    if (!progressData[slug]) {
      progressData[slug] = { title: surgeryName, quizResults: [], lastStudied: new Date().toISOString() };
    }
    progressData[slug].quizResults.push(result);
    progressData[slug].lastStudied = new Date().toISOString();
    localStorage.setItem("progress", JSON.stringify(progressData));

    setPhase("result");
  };

  const handleRegenerate = () => {
    localStorage.removeItem(`quiz_${slug}`);
    const material = localStorage.getItem(`material_${slug}`);
    if (material) generateQuiz(material);
  };

  const currentQuestion = questions[currentIndex];
  const score = answers.filter((a) => a.correct).length;
  const optionLabels = ["A", "B", "C", "D"];

  // ローディング画面
  if (phase === "loading") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-green-400 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-slate-400">専門医試験レベルのクイズを生成中...</p>
      </div>
    );
  }

  // エラー画面
  if (phase === "error") {
    return (
      <div className="text-center py-20">
        <div className="text-5xl mb-4">⚠️</div>
        <p className="text-red-400 mb-4">{error}</p>
        <Link href={`/materials/${slug}`} className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl">
          資料を生成する
        </Link>
      </div>
    );
  }

  // 開始画面
  if (phase === "ready") {
    return (
      <div>
        <div className="flex items-center gap-2 text-slate-400 text-sm mb-6">
          <Link href="/" className="hover:text-white">ホーム</Link>
          <span>/</span>
          <Link href={`/materials/${slug}`} className="hover:text-white">{surgeryName}</Link>
          <span>/</span>
          <span className="text-white">クイズ</span>
        </div>

        <div className="max-w-2xl mx-auto text-center">
          <div className="text-6xl mb-6">🎯</div>
          <h1 className="text-3xl font-bold text-white mb-3">{surgeryName}</h1>
          <p className="text-slate-400 mb-8">専門医試験レベルの4択問題 {questions.length}問</p>

          <div className="bg-slate-800 rounded-2xl p-8 border border-slate-700 mb-8">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-3xl font-bold text-blue-400">{questions.length}</div>
                <div className="text-slate-400 text-sm">問題数</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-green-400">4択</div>
                <div className="text-slate-400 text-sm">形式</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-purple-400">詳細</div>
                <div className="text-slate-400 text-sm">解説付き</div>
              </div>
            </div>
          </div>

          <div className="flex gap-4 justify-center">
            <button
              onClick={startQuiz}
              className="bg-green-600 hover:bg-green-500 text-white font-bold px-10 py-4 rounded-xl text-lg transition-colors"
            >
              クイズを始める
            </button>
            <button
              onClick={handleRegenerate}
              className="bg-slate-700 hover:bg-slate-600 text-white px-6 py-4 rounded-xl transition-colors"
            >
              🔄 再生成
            </button>
          </div>
        </div>
      </div>
    );
  }

  // クイズ画面
  if (phase === "quiz" && currentQuestion) {
    return (
      <div className="max-w-3xl mx-auto">
        {/* プログレス */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-slate-400 text-sm">問題 {currentIndex + 1} / {questions.length}</span>
          <span className="text-slate-400 text-sm">正解: {score}</span>
        </div>
        <div className="w-full bg-slate-700 h-2 rounded-full mb-8">
          <div
            className="bg-green-500 h-2 rounded-full transition-all"
            style={{ width: `${((currentIndex) / questions.length) * 100}%` }}
          />
        </div>

        {/* カテゴリ */}
        <div className="flex items-center gap-2 mb-4">
          <span className="bg-blue-900/50 text-blue-300 text-xs px-3 py-1 rounded-full border border-blue-700">
            {currentQuestion.category}
          </span>
        </div>

        {/* 問題 */}
        <div className="bg-slate-800 rounded-2xl p-8 border border-slate-700 mb-6">
          <p className="text-white text-xl leading-relaxed">{currentQuestion.question}</p>
        </div>

        {/* 選択肢 */}
        <div className="grid gap-3 mb-6">
          {currentQuestion.options.map((option, i) => {
            let btnClass = "bg-slate-800 border border-slate-700 hover:border-blue-500 hover:bg-slate-700";

            if (isAnswered) {
              if (i === currentQuestion.answer) {
                btnClass = "bg-green-900/50 border-2 border-green-500";
              } else if (i === selectedAnswer && i !== currentQuestion.answer) {
                btnClass = "bg-red-900/50 border-2 border-red-500";
              } else {
                btnClass = "bg-slate-800 border border-slate-700 opacity-50";
              }
            }

            return (
              <button
                key={i}
                onClick={() => handleAnswer(i)}
                disabled={isAnswered}
                className={`w-full text-left p-4 rounded-xl transition-all ${btnClass}`}
              >
                <span className="font-bold text-blue-400 mr-3">{optionLabels[i]}.</span>
                <span className="text-white">{option}</span>
                {isAnswered && i === currentQuestion.answer && (
                  <span className="float-right text-green-400">✓ 正解</span>
                )}
                {isAnswered && i === selectedAnswer && i !== currentQuestion.answer && (
                  <span className="float-right text-red-400">✗</span>
                )}
              </button>
            );
          })}
        </div>

        {/* 解説 */}
        {isAnswered && (
          <div className="bg-amber-900/30 border border-amber-700 rounded-xl p-6 mb-6">
            <h3 className="text-amber-400 font-bold mb-2">📝 解説</h3>
            <p className="text-slate-300 leading-relaxed">{currentQuestion.explanation}</p>
          </div>
        )}

        {isAnswered && (
          <button
            onClick={handleNext}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl text-lg transition-colors"
          >
            {currentIndex + 1 >= questions.length ? "結果を見る" : "次の問題 →"}
          </button>
        )}
      </div>
    );
  }

  // 結果画面
  if (phase === "result") {
    const percentage = Math.round((score / questions.length) * 100);
    const grade = percentage >= 80 ? "合格圏" : percentage >= 60 ? "もう少し" : "要復習";
    const gradeColor = percentage >= 80 ? "text-green-400" : percentage >= 60 ? "text-yellow-400" : "text-red-400";

    return (
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">
            {percentage >= 80 ? "🎉" : percentage >= 60 ? "📚" : "💪"}
          </div>
          <h2 className="text-3xl font-bold text-white mb-2">クイズ完了！</h2>
          <p className="text-slate-400">{surgeryName}</p>
        </div>

        <div className="bg-slate-800 rounded-2xl p-8 border border-slate-700 mb-6 text-center">
          <div className="text-7xl font-bold text-white mb-2">{percentage}<span className="text-3xl">%</span></div>
          <div className={`text-2xl font-bold mb-4 ${gradeColor}`}>{grade}</div>
          <div className="text-slate-400">{score} / {questions.length} 問正解</div>
        </div>

        {/* 問題別結果 */}
        <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden mb-6">
          <div className="p-4 border-b border-slate-700">
            <h3 className="text-white font-semibold">問題別結果</h3>
          </div>
          <div className="divide-y divide-slate-700">
            {answers.map((a, i) => (
              <div key={i} className="p-4 flex items-start gap-3">
                <span className={`text-lg ${a.correct ? "text-green-400" : "text-red-400"}`}>
                  {a.correct ? "✓" : "✗"}
                </span>
                <div>
                  <p className="text-slate-300 text-sm">問{i + 1}: {a.question}</p>
                  {!a.correct && (
                    <p className="text-red-400 text-xs mt-1">
                      あなた: {optionLabels[a.userAnswer]} → 正解: {optionLabels[a.correctAnswer]}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-4">
          <button
            onClick={startQuiz}
            className="flex-1 bg-green-600 hover:bg-green-500 text-white font-bold py-4 rounded-xl transition-colors"
          >
            もう一度挑戦
          </button>
          <Link
            href={`/materials/${slug}`}
            className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-bold py-4 rounded-xl transition-colors text-center"
          >
            資料を復習
          </Link>
          <Link
            href="/progress"
            className="flex-1 bg-blue-700 hover:bg-blue-600 text-white font-bold py-4 rounded-xl transition-colors text-center"
          >
            進捗を確認
          </Link>
        </div>
      </div>
    );
  }

  return null;
}
