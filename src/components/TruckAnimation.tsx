"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { useEffect, useState } from "react";

interface TruckAnimationProps {
  progress?: number;
}

export default function TruckAnimation({ progress }: TruckAnimationProps) {
  const [showFinalPosition, setShowFinalPosition] = useState(false);

  useEffect(() => {
    if (progress === undefined) {
      const timer = setTimeout(() => {
        setShowFinalPosition(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [progress]);

  return (
    <div className="relative w-full h-20 overflow-hidden"> {/* 부모 기준으로 이동 */}
      {progress !== undefined ? (
        // 업로드 중 트럭 진행
        <motion.div
          className="absolute top-0"
          animate={{ left: `${progress * 100}%` }}
          style={{ width: 160 }}
          transition={{ ease: "linear" }}
        >
          <Image src="/images/truck100.png" alt="트럭" width={160} height={100} />
        </motion.div>
      ) : showFinalPosition ? (
        // 애니메이션 끝난 후 중앙 고정
        <div className="absolute top-0 -translate-x-1/2 left-1/2">
          <Image src="/images/truck100.png" alt="트럭" width={160} height={100} />
        </div>
      ) : (
        // 초기 화면 - 왼쪽 → 중앙 애니메이션
        <motion.div
          className="absolute top-0"
          initial={{ left: "0%" }}
          animate={{ left: "50%" }}
          style={{ width: 160, transform: "translateX(-50%)" }}
          transition={{ duration: 2, ease: "easeInOut" }}
        >
          <Image src="/images/truck100.png" alt="트럭" width={160} height={100} />
        </motion.div>
      )}
    </div>
  );
}
