"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Share2, ChevronRight, Mountain, RotateCcw, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import {
  QUIZ_QUESTIONS,
  AUX_QUESTIONS,
  MBTI_RESULTS,
  calculateMbti,
  type MbtiResult,
  type AuxAnswers,
} from "@/lib/quiz/mbtiData";
import { useAuth } from "@/lib/hooks/useAuth";
import { upsertUserProfile } from "@/lib/firestore/users";
import Link from "next/link";

type Step = "intro" | "quiz" | "aux" | "loading" | "result";

const TOTAL_STEPS = QUIZ_QUESTIONS.length + AUX_QUESTIONS.length;

export default function QuizClient() {
  const locale  = useLocale();
  const router  = useRouter();
  const { user } = useAuth();

  const [step, setStep]       = useState<Step>("intro");
  const [qIndex, setQIndex]   = useState(0);
  const [auxIndex, setAuxIndex] = useState(0);
  const [scores, setScores]   = useState<Record<string, number>>({});
  const [auxAnswers, setAuxAnswers] = useState<Partial<AuxAnswers>>({});
  const [result, setResult]   = useState<MbtiResult | null>(null);
  const [saved, setSaved]     = useState(false);

  const currentProgress = step === "quiz"
    ? qIndex
    : step === "aux"
      ? QUIZ_QUESTIONS.length + auxIndex
      : step === "result" ? TOTAL_STEPS : 0;

  const handleMbtiAnswer = (score: Record<string, number>) => {
    const next = { ...scores };
    for (const [k, v] of Object.entries(score)) next[k] = (next[k] ?? 0) + v;
    setScores(next);

    if (qIndex + 1 < QUIZ_QUESTIONS.length) {
      setQIndex(qIndex + 1);
    } else {
      setStep("aux");
      setAuxIndex(0);
    }
  };

  const handleAuxAnswer = (value: string) => {
    const key = AUX_QUESTIONS[auxIndex].id as keyof AuxAnswers;
    const next = { ...auxAnswers, [key]: value };
    setAuxAnswers(next);

    if (auxIndex + 1 < AUX_QUESTIONS.length) {
      setAuxIndex(auxIndex + 1);
    } else {
      setStep("loading");
      setTimeout(() => {
        const mbti = calculateMbti(scores);
        const res  = MBTI_RESULTS[mbti];
        setResult(res);
        setStep("result");
        if (user) {
          upsertUserProfile(user.uid, { oreumMbti: mbti }).catch(() => {});
          setSaved(true);
        } else {
          localStorage.setItem("pending_mbti", mbti);
        }
      }, 1800);
    }
  };

  const handleRetry = () => {
    setStep("intro");
    setQIndex(0);
    setAuxIndex(0);
    setScores({});
    setAuxAnswers({});
    setResult(null);
    setSaved(false);
  };

  const handleShare = () => {
    if (!result) return;
    const url = `${window.location.origin}/${locale}/quiz/result/${result.type.toLowerCase()}`;
    const text = `나는 ${result.type} — 닮은 오름은 ${result.oreumName}이래! 오름 MBTI 테스트 해봐`;
    if (navigator.share) {
      navigator.share({ title: `오름 MBTI: ${result.type}`, text, url }).catch(() => {});
    } else {
      navigator.clipboard.writeText(`${text}\n${url}`).catch(() => {});
    }
  };

  const handleBack = () => {
    if (step === "quiz" && qIndex > 0) { setQIndex(qIndex - 1); return; }
    if (step === "quiz") { setStep("intro"); return; }
    if (step === "aux" && auxIndex > 0) { setAuxIndex(auxIndex - 1); return; }
    if (step === "aux") { setStep("quiz"); setQIndex(QUIZ_QUESTIONS.length - 1); return; }
    router.back();
  };

  return (
    <div className="min-h-screen bg-header flex flex-col">
      {/* 상단 헤더 */}
      <div className="p-4 flex items-center justify-between">
        <button
          onClick={handleBack}
          className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-white"
        >
          <ArrowLeft size={18} />
        </button>
        {(step === "quiz" || step === "aux") && (
          <span className="text-white/60 text-sm">
            {currentProgress + 1} / {TOTAL_STEPS}
          </span>
        )}
        {step === "loading" && <span className="text-white/60 text-sm">분석 중</span>}
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-10">
        <AnimatePresence mode="wait">

          {/* 인트로 */}
          {step === "intro" && (
            <motion.div
              key="intro"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center text-white w-full max-w-sm"
            >
              <div className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-white/10 border border-white/20 flex items-center justify-center">
                <Mountain size={36} className="text-white" />
              </div>
              <h1 className="text-2xl font-bold mb-2">나를 닮은 오름</h1>
              <p className="text-white/60 text-sm mb-2">오름 MBTI 테스트</p>
              <p className="text-white/50 text-xs mb-8 leading-relaxed">
                14개의 질문으로 당신의 성향과 가장 닮은 오름을 찾아드립니다. 약 2분 소요됩니다.
              </p>
              <Button
                className="w-full h-14 rounded-2xl bg-white text-primary font-bold text-base hover:bg-white/90"
                onClick={() => setStep("quiz")}
              >
                테스트 시작 <ChevronRight size={18} className="ml-1" />
              </Button>
            </motion.div>
          )}

          {/* MBTI 10문항 */}
          {step === "quiz" && (
            <motion.div
              key={`q-${qIndex}`}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.25 }}
              className="w-full max-w-sm text-white"
            >
              <div className="mb-8">
                <Progress
                  value={(currentProgress / TOTAL_STEPS) * 100}
                  className="h-1.5 bg-white/20"
                />
              </div>
              <p className="text-lg font-bold mb-8 leading-relaxed text-center">
                {QUIZ_QUESTIONS[qIndex].text}
              </p>
              <div className="space-y-3">
                {[
                  { choice: QUIZ_QUESTIONS[qIndex].a, label: "A" },
                  { choice: QUIZ_QUESTIONS[qIndex].b, label: "B" },
                ].map(({ choice, label }) => (
                  <button
                    key={label}
                    onClick={() => handleMbtiAnswer(choice.score)}
                    className="w-full text-left bg-white/8 hover:bg-white/18 border border-white/15 hover:border-white/30 rounded-2xl px-5 py-4 transition-all active:scale-[0.97]"
                  >
                    <span className="text-xs font-bold text-white/40 mr-2">{label}</span>
                    <span className="text-sm leading-relaxed">{choice.text}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* 보조 4문항 전환 안내 (첫 보조문항) */}
          {step === "aux" && auxIndex === 0 && (
            <motion.div
              key="aux-intro"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className="w-full max-w-sm text-white text-center mb-8"
            >
              <p className="text-white/80 font-semibold text-sm mb-1">거의 다 왔어요!</p>
              <p className="text-white/50 text-xs">4가지 추가 질문으로 더 정확한 오름을 찾아드릴게요</p>
            </motion.div>
          )}

          {/* 보조 4문항 */}
          {step === "aux" && (
            <motion.div
              key={`aux-${auxIndex}`}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.25 }}
              className="w-full max-w-sm text-white"
            >
              <div className="mb-8">
                <Progress
                  value={(currentProgress / TOTAL_STEPS) * 100}
                  className="h-1.5 bg-white/20"
                />
              </div>
              <p className="text-lg font-bold mb-6 leading-relaxed text-center">
                {AUX_QUESTIONS[auxIndex].text}
              </p>
              <div className="grid grid-cols-2 gap-2">
                {AUX_QUESTIONS[auxIndex].options.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => handleAuxAnswer(opt.value)}
                    className="bg-white/8 hover:bg-white/18 border border-white/15 hover:border-white/30 rounded-2xl px-4 py-3.5 text-sm transition-all active:scale-[0.97] text-left"
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* 분석 중 로딩 */}
          {step === "loading" && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-white text-center"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="w-16 h-16 mx-auto mb-6 rounded-full border-2 border-white/20 border-t-white"
              />
              <p className="text-base font-semibold mb-2">당신과 닮은 오름을</p>
              <p className="text-base font-semibold">찾고 있어요...</p>
              <div className="flex gap-1.5 justify-center mt-4">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="w-1.5 h-1.5 rounded-full bg-white/60"
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1, repeat: Infinity, delay: i * 0.3 }}
                  />
                ))}
              </div>
            </motion.div>
          )}

          {/* 결과 */}
          {step === "result" && result && (
            <motion.div
              key="result"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
              className="text-white w-full max-w-sm"
            >
              <div className={cn(
                "rounded-3xl p-6 mb-5 bg-gradient-to-br border border-white/10",
                result.color
              )}>
                <div className="text-center mb-4">
                  <p className="text-white/60 text-xs font-semibold uppercase tracking-wider mb-1">나를 닮은 오름 MBTI</p>
                  <p className="text-5xl font-black tracking-wider mb-1">{result.type}</p>
                  <p className="text-lg font-bold">{result.title}</p>
                </div>
                <div className="flex gap-1.5 justify-center flex-wrap mb-4">
                  {result.keywords.map((kw) => (
                    <span key={kw} className="px-2.5 py-1 rounded-full bg-white/20 text-white/90 text-xs font-medium">
                      #{kw}
                    </span>
                  ))}
                </div>
                <p className="text-white/80 text-sm text-center leading-relaxed">{result.desc}</p>
              </div>

              <div className="bg-white/8 border border-white/15 rounded-2xl p-4 mb-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
                  <Mountain size={20} className="text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-white/50 mb-0.5">추천 오름</p>
                  <p className="font-bold">{result.oreumName}</p>
                </div>
                <Link href={`/${locale}/oreum/${result.oreumSlug}`}>
                  <ChevronRight size={18} className="text-white/40" />
                </Link>
              </div>

              {/* 취향 요약 */}
              {Object.keys(auxAnswers).length > 0 && (
                <div className="bg-white/5 border border-white/10 rounded-2xl p-3 mb-4">
                  <p className="text-xs text-white/50 mb-1.5">내 선호 취향</p>
                  <div className="flex flex-wrap gap-1.5">
                    {auxAnswers.region && auxAnswers.region !== "any" && (
                      <span className="text-xs bg-white/15 px-2 py-0.5 rounded-full">
                        {{ east:"동부", west:"서부", south:"남부", north:"북부", central:"중산간" }[auxAnswers.region] ?? auxAnswers.region}
                      </span>
                    )}
                    {auxAnswers.season && auxAnswers.season !== "any" && (
                      <span className="text-xs bg-white/15 px-2 py-0.5 rounded-full">
                        {{ spring:"봄", summer:"여름", autumn:"가을", winter:"겨울" }[auxAnswers.season] ?? auxAnswers.season}
                      </span>
                    )}
                    {auxAnswers.time && auxAnswers.time !== "any" && (
                      <span className="text-xs bg-white/15 px-2 py-0.5 rounded-full">
                        {{ dawn:"일출", morning:"오전", afternoon:"오후", evening:"일몰" }[auxAnswers.time] ?? auxAnswers.time}
                      </span>
                    )}
                    {auxAnswers.difficulty && auxAnswers.difficulty !== "0" && (
                      <span className="text-xs bg-white/15 px-2 py-0.5 rounded-full">
                        {{ 1:"쉬운 코스", 3:"보통 코스", 5:"도전 코스" }[Number(auxAnswers.difficulty)] ?? ""}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {!user && !saved && (
                <div className="bg-primary/20 border border-primary/30 rounded-2xl p-3 mb-4 text-center">
                  <p className="text-xs text-white/70">이 결과를 저장하고 싶다면?</p>
                  <Link href={`/${locale}/auth/login`} className="text-white text-sm font-semibold underline underline-offset-2">
                    가입하고 결과 저장하기
                  </Link>
                </div>
              )}
              {saved && (
                <div className="flex items-center justify-center gap-2 bg-primary/15 rounded-2xl p-2.5 mb-4">
                  <CheckCircle2 size={14} className="text-primary" />
                  <p className="text-xs text-white/70">프로필에 저장됐어요</p>
                </div>
              )}

              <div className="flex gap-2.5">
                <Button
                  variant="outline"
                  className="flex-1 h-12 border-white/20 text-white/70 hover:bg-white/10"
                  onClick={handleRetry}
                >
                  <RotateCcw size={14} className="mr-1.5" />
                  다시하기
                </Button>
                <Button
                  className="flex-1 h-12 bg-white text-primary font-semibold hover:bg-white/90"
                  onClick={handleShare}
                >
                  <Share2 size={14} className="mr-1.5" />
                  공유하기
                </Button>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
