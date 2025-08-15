import React from 'react';

const renderCell = (cellData: any, isHeader: boolean) => {
    const Tag = isHeader ? 'th' : 'td';
    if (typeof cellData === 'object' && cellData !== null) {
        const { content, rowSpan, colSpan, styles } = cellData;
        const cellStyle: React.CSSProperties = {
            padding: '8px 12px',
            border: '1px solid rgb(229, 231, 235)',
            textAlign: styles?.halign || (isHeader ? 'center' : 'left'),
            verticalAlign: styles?.valign || 'middle',
            fontWeight: styles?.fontStyle === 'bold' ? 'bold' : 'normal',
            backgroundColor: styles?.fillColor ? `rgb(${styles.fillColor.join(',')})` : (isHeader ? 'rgb(243, 244, 246)' : 'white'),
            color: styles?.textColor ? (typeof styles.textColor === 'number' ? `rgb(${styles.textColor},${styles.textColor},${styles.textColor})` : `rgb(${styles.textColor.join(',')})`) : 'inherit',
        };
        return (
            <Tag rowSpan={rowSpan} colSpan={colSpan} style={cellStyle}>
                {content}
            </Tag>
        );
    }

    const cellStyle: React.CSSProperties = {
        padding: '8px 12px',
        border: '1px solid rgb(229, 231, 235)',
        textAlign: isHeader ? 'center' : 'left',
        verticalAlign: 'middle',
    };
    return (
        <Tag style={cellStyle}>{cellData}</Tag>
    );
};


interface AnomalyDetailsPageProps {
    tableData: {
        head: any[][];
        body: any[][];
    } | null;
}

const AnomalyDetailsPage: React.FC<AnomalyDetailsPageProps> = ({ tableData }) => {
    if (!tableData) {
        return <div>데이터가 없습니다.</div>;
    }
    const { head, body } = tableData;

    return (
        <div className="a4-page-container">
            <div className="a4-page-content">
                <main className="flex-grow flex flex-col gap-8">
                    <h2 style={{ fontSize: '16px', fontWeight: 'bold', color: 'rgb(75, 85, 99)' }}>
                        3. 이상 탐지 상세 내역
                    </h2>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px', color: 'rgb(75, 85, 99)' }}>
                        <thead>
                            {head.map((headerRow, rowIndex) => (
                                <tr key={`header-${rowIndex}`}>
                                    {headerRow.map((cell, cellIndex) => renderCell(cell, true))}
                                </tr>
                            ))}
                        </thead>
                        <tbody>
                            {body.map((bodyRow, rowIndex) => (
                                <tr key={`body-${rowIndex}`}>
                                    {bodyRow.map((cell, cellIndex) => renderCell(cell, false))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </main>
                <footer className="report-footer"></footer>
            </div>
        </div>
    );
};

export default AnomalyDetailsPage;