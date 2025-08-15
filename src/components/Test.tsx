'use client';

import React from 'react';

type CollectionStatus = '성공' | '지연' | '누락';
interface CollectionLog {
  id: number;
  source: string;
  status: CollectionStatus;
  timestamp: string;
  message: string;
}

const MonitoringDashboard: React.FC = () => {
    const mockLogs: CollectionLog[] = [
        { id: 1, source: '화성 공장 PLC 데이터', status: '성공', timestamp: '15:01:05', message: '정상 수신' },
        { id: 2, source: '수도권 허브 WMS', status: '지연', timestamp: '15:01:03', message: '15초 지연' },
        { id: 3, source: '구미 공장 MES', status: '성공', timestamp: '15:01:02', message: '정상 수신' },
        { id: 4, source: '인천 공장 PLC 데이터', status: '누락', timestamp: '15:00:55', message: '수집 실패 (타임아웃)' },
        { id: 5, source: '경남 허브 WMS', status: '성공', timestamp: '15:00:50', message: '정상 수신' },
    ];

    const styles = {
        page: { padding: '20px', fontFamily: "'Helvetica Neue', 'Segoe UI', 'Malgun Gothic', '맑은 고딕', sans-serif", color: '#333' },
        header: { fontSize: '28px', fontWeight: 'bold', marginBottom: '20px' },
        grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' },
        card: { backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' },
        cardTitle: { fontSize: '18px', fontWeight: '600', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' },
        refreshControls: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
        controlGroup: { display: 'flex', alignItems: 'center', gap: '15px' },
        toggleSwitch: { position: 'relative' as 'relative', display: 'inline-block', width: '50px', height: '28px' },
        toggleInput: { opacity: 0, width: 0, height: 0 },
        slider: { position: 'absolute' as 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#ccc', transition: '.4s', borderRadius: '28px' },
        sliderBefore: { position: 'absolute' as 'absolute', content: '""', height: '20px', width: '20px', left: '4px', bottom: '4px', backgroundColor: 'white', transition: '.4s', borderRadius: '50%' },
        checkedSlider: { backgroundColor: '#28a745' },
        checkedSliderBefore: { transform: 'translateX(22px)' },
        select: { padding: '5px 10px', borderRadius: '4px', border: '1px solid #ccc' },
        refreshStatus: { textAlign: 'right' as 'right' },
        statusText: { fontSize: '14px', color: '#555' },
        progressBar: { height: '8px', backgroundColor: '#e9ecef', borderRadius: '4px', overflow: 'hidden', marginTop: '5px' },
        progressBarFill: { width: '83%', height: '100%', backgroundColor: '#007bff', borderRadius: '4px' },
        logList: { listStyle: 'none', padding: 0, margin: 0, maxHeight: '300px', overflowY: 'auto' as 'auto' },
        logItem: { display: 'flex', alignItems: 'center', padding: '12px 5px', borderBottom: '1px solid #f0f0f0' },
        logIcon: { fontSize: '18px', marginRight: '12px' },
        logSource: { flex: 1, fontWeight: 500 },
        logStatus: { padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold', width: '60px', textAlign: 'center' as 'center', marginRight: '15px' },
        logTimestamp: { fontSize: '14px', color: '#888' },
    };
    const isChecked = true;

    const getStatusStyle = (status: CollectionStatus) => {
        switch (status) {
            case '성공': return { icon: '✅', style: { backgroundColor: '#d9f7be', color: '#389e0d' } };
            case '지연': return { icon: '⚠️', style: { backgroundColor: '#fff1b8', color: '#d48806' } };
            case '누락': return { icon: '❌', style: { backgroundColor: '#ffccc7', color: '#a8071a' } };
            default: return { icon: '', style: {} };
        }
    };

    return (
        <div style={styles.page}>
            <h1 style={styles.header}>실시간 데이터 모니터링</h1>

            <div style={styles.grid}>
                <div style={styles.card}>
                    <h2 style={styles.cardTitle}><span>🔄</span> 데이터 자동 갱신 설정</h2>
                    <div style={styles.refreshControls}>
                        <div style={styles.controlGroup}>
                            <label style={styles.toggleSwitch}>
                                <input type="checkbox" style={styles.toggleInput} defaultChecked={isChecked} />
                                <span style={{ ...styles.slider, ...(isChecked ? styles.checkedSlider : {}) }}>
                                    <span style={{ ...styles.sliderBefore, ...(isChecked ? styles.checkedSliderBefore : {}) }}></span>
                                </span>
                            </label>
                            <select style={styles.select}>
                                <option>30초</option>
                                <option>1분</option>
                                <option>5분</option>
                            </select>
                        </div>
                        <div style={styles.refreshStatus}>
                            <span style={styles.statusText}>다음 갱신까지: 25초</span>
                            <div style={styles.progressBar}><div style={styles.progressBarFill}></div></div>
                        </div>
                    </div>
                </div>
                <div style={styles.card}>
                    <h2 style={styles.cardTitle}><span>⚙️</span> 추가 설정</h2>
                    <p style={{fontSize: '14px', color: '#777'}}>관리자 알림 설정, API 키 관리 등 추가적인 모니터링 관련 설정을 이곳에 배치할 수 있습니다.</p>
                </div>
                <div style={{...styles.card, gridColumn: '1 / -1'}}>
                    <h2 style={styles.cardTitle}><span>📡</span> 데이터 수집 상태 모니터링</h2>
                    <ul style={styles.logList}>
                        {mockLogs.map(log => {
                            const statusInfo = getStatusStyle(log.status);
                            return (
                                <li key={log.id} style={styles.logItem}>
                                    <span style={styles.logIcon}>{statusInfo.icon}</span>
                                    <span style={styles.logSource}>{log.source}</span>
                                    <span style={{...styles.logStatus, ...statusInfo.style}}>{log.status}</span>
                                    <span style={styles.logTimestamp}>{log.timestamp}</span>
                                </li>
                            );
                        })}
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default MonitoringDashboard;