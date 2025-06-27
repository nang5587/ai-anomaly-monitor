'use client'
import { motion, Variants } from 'framer-motion';
import Image from 'next/image';

// 콜라주에 사용할 이미지 목록
const imageList = [
    { src: '/images/factory-1.jpg', alt: '현대적인 스마트 팩토리의 전경', gridClass: 'col-span-2 row-span-2' },
    { src: '/images/factory-2.jpg', alt: '컨트롤 룸', gridClass: 'col-span-1 row-span-1' },
    { src: '/images/factory-3.jpg', alt: '엔지니어가 설비를 점검하는 모습', gridClass: 'col-span-1 row-span-1' },
    { src: '/images/factory-4.jpg', alt: '자동화 로봇 팔', gridClass: 'col-span-1 row-span-1' },
    { src: '/images/factory-5.jpg', alt: '데이터 분석 대시보드', gridClass: 'col-span-2 row-span-1' },
];

// 1. 컨테이너의 애니메이션 Variants
// staggerChildren: 자식 요소들의 애니메이션을 순차적으로 실행 (0.1초 간격)
const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
        },
    },
};

// 2. 각 이미지 아이템의 애니메이션 Variants
// y: 30 -> 아래쪽 30px에서 시작해서 y: 0 (제자리)으로 올라옴
const itemVariants = {
    hidden: { y: 30, opacity: 0 },
    visible: {
        y: 0,
        opacity: 1,
        transition: {
            duration: 0.5, // 0.5초 동안 애니메이션
            ease: 'easeOut' as const,
        },
    },
};

export default function ImageCollage() {
    return (
        <motion.div
            className="grid h-full w-full grid-cols-3 grid-rows-3 gap-3 p-4"
            variants={containerVariants}
            initial="hidden" // 초기 상태
            animate="visible" // 최종 상태
        >
            {imageList.map((image) => (
                <motion.div
                    key={image.src}
                    className={`relative h-full w-full overflow-hidden ${image.gridClass}`}
                    variants={itemVariants} // 각 아이템에 variants 연결
                >
                    <Image
                        src={image.src}
                        alt={image.alt}
                        fill
                        className="object-cover transition-transform duration-500 hover:scale-110"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                </motion.div>
            ))}
        </motion.div>
    );
}