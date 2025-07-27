import { CoverLetterProps } from "@/types/file";

export default function ReportCoverLetter({ data }: { data: CoverLetterProps }) {
    return (
        <div className="p-12 bg-white text-black flex flex-col justify-between h-full" style={{ width: '210mm', minHeight: '297mm' }}
        >

            {/* 2. 헤더: 페이지 상단에 위치 */}
            <header className="text-center font-sans">
                <div className="border-y-2 border-black py-4">
                    <h1 className="text-4xl font-bold tracking-widest">
                        물류 경로 이상탐지 분석 보고서
                    </h1>
                </div>
            </header>

            {/* 3. 중앙 본문: 남는 공간을 모두 차지하고(flex-grow), 내부 내용을 중앙에 배치 */}
            <main className="flex-grow flex items-center justify-center">
                <div className="text-center font-sans">
                    {/* 정보 */}
                    <div className="space-y-4 text-lg leading-relaxed inline-block text-left">
                        <p><span className="font-semibold w-32 inline-block">분석 파일명</span>: {data.fileName}</p>
                        <p><span className="font-semibold w-32 inline-block">분석 공장</span>: {data.locationName}</p>
                        <p><span className="font-semibold w-32 inline-block">분석 기간</span>: {data.analysisPeriod}</p>
                        <p><span className="font-semibold w-32 inline-block">작성일</span>: {data.createdAt}</p>
                    </div>

                    {/* 작성자 정보 */}
                    <div className="mt-20 space-y-2 text-md">
                        <p><span className="font-semibold">작성자</span>: {data.userName}</p>
                        {data.companyName && (
                            <p><span className="font-semibold">회사명</span>: {data.companyName}</p>
                        )}
                    </div>
                </div>
            </main>

            {/* 4. 푸터: 페이지 하단에 위치 */}
            <footer className="flex justify-between items-end">
                <div className="text-center font-sans">
                    <div className="border-2 border-black px-4 py-1 font-bold text-sm">
                        ■ INTERNAL USE ONLY ■
                    </div>
                </div>
                <div className="text-right">
                    {data.companyLogoUrl ? (
                        <img src={data.companyLogoUrl} alt="로고" className="h-12 w-auto" />
                    ) : (
                        <div className="h-12 w-28 border border-dashed flex items-center justify-center text-gray-400 text-xs">
                            Logo Area
                        </div>
                    )}
                </div>
            </footer>

        </div>
    );
}