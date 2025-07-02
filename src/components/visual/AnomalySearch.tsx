import React from 'react';

const AnomalySearch: React.FC = () => {
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
                Search
            </h3>
            <input
                type="text"
                placeholder="Search by EPC or LotID..."
                style={{
                    width: '100%', padding: '6px 12px', background: 'rgba(20, 22, 25)',
                    border: '1px solid #757575', borderRadius: '25px', color: '#E0E0E0',
                    fontSize: '14px', marginBottom: '15px', boxSizing: 'border-box'
                }}
            />
        </div>
    );
};

export default AnomalySearch;