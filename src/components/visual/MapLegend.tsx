import React from 'react';
import { LocationNode } from '../../types/data';
import { getNodeColor } from '../../types/colorUtils';
import { NodeIcon } from '../visual/icons';

interface MapLegendProps {
    onHover: (type: LocationNode['businessStep'] | null) => void;
    onToggleVisibility: (type: LocationNode['businessStep']) => void;
    visibleTypes: Record<LocationNode['businessStep'], boolean>;
}

const LEGEND_TYPES: LocationNode['businessStep'][] = ['Factory', 'WMS', 'LogiHub', 'Wholesaler', 'Reseller'];

const MapLegend: React.FC<MapLegendProps> = ({ onHover, onToggleVisibility, visibleTypes }) => {
    return (
        <div style={{
            position: 'absolute',
            top: '10px',
            right: '24px',
            background: 'linear-gradient(145deg, #2A2A2A, #1E1E1E)',
            boxShadow: '0 0 0 1px rgba(255,255,255,0.05), 0 8px 24px rgba(0,0,0,0.4)',
            backdropFilter: 'blur(6px)',
            borderRadius: '10px',
            padding: '20px',
            color: '#E0E0E0',
            fontFamily: 'Inter, sans-serif',
            width: '180px',
            zIndex: 2,
        }}>
            <h3 style={{ 
                margin: '0 0 15px 0', 
                fontSize: '18px', 
                color: '#FFFFFF', 
                paddingBottom: '10px' 
            }}>
                Legend
            </h3>
            {LEGEND_TYPES.map(type => {
                const isVisible = visibleTypes[type];

                return (
                    <div
                        key={type}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            marginBottom: '12px',
                            cursor: 'pointer',
                            opacity: isVisible ? 1 : 0.4,
                            transition: 'opacity 0.2s, transform 0.2s',
                            willChange: 'opacity, transform',
                        }}
                        onMouseEnter={() => onHover(type)}
                        onMouseLeave={() => onHover(null)}
                        onClick={() => onToggleVisibility(type)}
                    >
                        <div style={{
                            width: '28px',
                            height: '28px',
                            minWidth: '28px',
                            borderRadius: '20%',
                            backgroundColor: 'rgb(60, 60, 60)', 
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginRight: '12px',
                            transition: 'all 0.2s ease-out',
                        }}>
                            <NodeIcon type={type} />
                        </div>
                        <span style={{
                            fontSize: '13px',
                            color: isVisible ? '#E0E0E0' : '#888888',
                            textDecoration: isVisible ? 'none' : 'line-through',
                            transition: 'color 0.2s, text-decoration 0.2s',
                        }}>
                            {type}
                        </span>
                    </div>
                );
            })}
        </div>
    );
};

export default MapLegend;