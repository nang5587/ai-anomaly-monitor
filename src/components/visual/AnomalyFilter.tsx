import React from 'react';

const AnomalyFilter: React.FC = () => {
    const buttonStyle: React.CSSProperties = {
        flex: 1, padding: '8px 10px', border: '1px solid #757575',
        borderRadius: '25px', color: '#E0E0E0', fontSize: '13px', cursor: 'pointer',
        textAlign: 'center',
    };

    return (
        <div style={{
            fontFamily: 'Inter, sans-serif',
            background: 'linear-gradient(145deg, #2A2A2A, #1E1E1E)',
            boxShadow: '0 0 0 1px rgba(255,255,255,0.05), 0 8px 24px rgba(0,0,0,0.4)',
            backdropFilter: 'blur(6px)',
            borderRadius: '25px',
            padding: '20px',
        }}>
            <h3 style={{
                fontSize: '18px', margin: '0 0 15px 0', color: '#FFFFFF',
            }}>
                Filter
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button style={buttonStyle} className='whitespace-nowrap'>Time Range ▼</button>
                    <button style={buttonStyle} className='whitespace-nowrap'>Location ▼</button>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button style={buttonStyle} className='whitespace-nowrap'>Event Type ▼</button>
                    <button style={buttonStyle} className='whitespace-nowrap'>Anomaly Type ▼</button>
                </div>
            </div>
        </div>
    );
};

export default AnomalyFilter;