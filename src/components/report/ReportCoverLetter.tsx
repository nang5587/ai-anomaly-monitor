import { CoverLetterProps } from "@/types/file";
interface ReportCoverLetterProps {
    data: CoverLetterProps;
    isLastPage?: boolean;
}
const baseStyle: React.CSSProperties = {
    padding: '48px',
    backgroundColor: 'rgb(255, 255, 255)',
    color: 'rgb(0, 0, 0)',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    height: '297mm',
    width: '210mm',
    boxSizing: 'border-box',
    fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
};

const pageBreakStyle: React.CSSProperties = {
    pageBreakAfter: 'always',
    breakAfter: 'page',
};
export default function ReportCoverLetter({ data, isLastPage = false }: ReportCoverLetterProps) {
    const finalStyle = isLastPage ? baseStyle : { ...baseStyle, ...pageBreakStyle };

    return (
        <div style={finalStyle}>
            <header style={{ textAlign: 'center' }}>
                <div 
                    style={{
                        borderTop: '2px solid rgb(0, 0, 0)',
                        borderBottom: '2px solid rgb(0, 0, 0)',
                        padding: '16px 0'
                    }}
                >
                    <h1 
                        style={{
                            fontSize: '36px',
                            fontWeight: 'bold',
                            letterSpacing: '0.1em',
                            margin: '0'
                        }}
                    >
                        물류 경로 이상탐지 분석 보고서
                    </h1>
                </div>
            </header>
            <main 
                style={{
                    flexGrow: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}
            >
                <div style={{ textAlign: 'center' }}>
                    <div 
                        style={{
                            display: 'inline-block',
                            textAlign: 'left',
                            fontSize: '18px',
                            lineHeight: '1.6'
                        }}
                    >
                        <div style={{ marginBottom: '16px' }}>
                            <span 
                                style={{
                                    fontWeight: '600',
                                    display: 'inline-block',
                                    width: '128px'
                                }}
                            >
                                분석 파일명
                            </span>
                            : {data.fileName}
                        </div>
                        <div style={{ marginBottom: '16px' }}>
                            <span 
                                style={{
                                    fontWeight: '600',
                                    display: 'inline-block',
                                    width: '128px'
                                }}
                            >
                                분석 공장
                            </span>
                            : {data.locationName}
                        </div>
                        <div style={{ marginBottom: '16px' }}>
                            <span 
                                style={{
                                    fontWeight: '600',
                                    display: 'inline-block',
                                    width: '128px'
                                }}
                            >
                                분석 기간
                            </span>
                            : {data.analysisPeriod}
                        </div>
                        <div style={{ marginBottom: '16px' }}>
                            <span 
                                style={{
                                    fontWeight: '600',
                                    display: 'inline-block',
                                    width: '128px'
                                }}
                            >
                                작성일
                            </span>
                            : {data.createdAt}
                        </div>
                    </div>
                    <div 
                        style={{
                            marginTop: '80px',
                            fontSize: '16px',
                            lineHeight: '1.5'
                        }}
                    >
                        <div style={{ marginBottom: '8px' }}>
                            <span style={{ fontWeight: '600' }}>작성자</span>: {data.userName}
                        </div>
                        {data.companyName && (
                            <div style={{ marginBottom: '8px' }}>
                                <span style={{ fontWeight: '600' }}>회사명</span>: {data.companyName}
                            </div>
                        )}
                    </div>
                </div>
            </main>
            <footer 
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-end'
                }}
            >
                <div style={{ textAlign: 'center' }}>
                    <div 
                        style={{
                            border: '2px solid rgb(0, 0, 0)',
                            padding: '4px 16px',
                            fontWeight: 'bold',
                            fontSize: '14px',
                            display: 'inline-block'
                        }}
                    >
                        ■ INTERNAL USE ONLY ■
                    </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                    {data.companyLogoUrl ? (
                        <img 
                            src={data.companyLogoUrl} 
                            alt="로고" 
                            style={{
                                height: '48px',
                                width: 'auto'
                            }}
                        />
                    ) : (
                        <div 
                            style={{
                                height: '48px',
                                width: '112px',
                                border: '1px dashed rgb(156, 163, 175)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'rgb(156, 163, 175)',
                                fontSize: '12px'
                            }}
                        >
                            Logo Area
                        </div>
                    )}
                </div>
            </footer>
        </div>
    );
}