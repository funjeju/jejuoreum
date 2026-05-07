"use client";

import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import Image from "next/image";

interface Props {
  oreum: { nameKo: string; thumbnailUrl: string | null };
  onComplete: () => void;
}

export function DiscoveryMomentAnimation({ oreum, onComplete }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm"
      onClick={onComplete}
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: [0.8, 1.06, 1], opacity: 1 }}
        transition={{ duration: 0.7, ease: [0.34, 1.56, 0.64, 1] }}
        className="relative w-56 h-72 rounded-3xl overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 카드 이미지 — 흑백→컬러 */}
        <motion.div
          initial={{ filter: "grayscale(100%) brightness(0.6)" }}
          animate={{ filter: "grayscale(0%) brightness(1)" }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="h-full w-full relative"
        >
          {oreum.thumbnailUrl ? (
            <Image src={oreum.thumbnailUrl} alt={oreum.nameKo} fill className="object-cover" sizes="224px" />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-primary to-primary/50 flex items-center justify-center">
              <span className="text-5xl font-bold text-white/30">{oreum.nameKo[0]}</span>
            </div>
          )}
        </motion.div>

        {/* 체크 마크 */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.55, type: "spring", stiffness: 220, damping: 16 }}
          className="absolute right-3 top-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary shadow-lg border-2 border-white"
        >
          <CheckCircle2 className="h-7 w-7 text-white" strokeWidth={2.5} />
        </motion.div>

        {/* 하단 텍스트 */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
        <motion.div
          initial={{ y: 16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="absolute bottom-0 left-0 right-0 p-4"
        >
          <p className="text-xs text-white/80 mb-0.5">발견했어요!</p>
          <h2 className="text-2xl font-bold text-white leading-tight">{oreum.nameKo}</h2>
        </motion.div>
      </motion.div>

      {/* 탭 to dismiss */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="absolute bottom-20 text-white/60 text-sm"
      >
        화면을 탭해서 계속하기
      </motion.p>
    </motion.div>
  );
}
