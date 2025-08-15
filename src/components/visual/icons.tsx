import React from 'react';
import { LocationNode } from '../../types/data';

export const NodeIcon: React.FC<{ type: LocationNode['businessStep'] }> = ({ type }) => {
    const style = { width: '70%', height: '70%', fill: 'white' };
    switch (type) {
        case 'Factory':
            return (
                <svg viewBox="0 0 24 24" style={style}>
                    <path d="M19 7h-1V5h-4v2h-4V5H6v2H5c-1.1 0-2 .9-2 2v11h18V9c0-1.1-.9-2-2-2zm-9 11H6v-4h4v4zm6 0h-4v-4h4v4z" />
                </svg>
            );
        case 'WMS':
            return (
                <svg viewBox="0 0 24 24" style={style}>
                    <path d="M20 7V5h-4v2h4zm-6 2V7h-4v2h4zM4 9h4V7H4v2zm16 4v-2h-4v2h4zm-6 0v-2h-4v2h4zM4 13h4v-2H4v2zm16 4v-2h-4v2h4zm-6 0v-2h-4v2h4zM4 17h4v-2H4v2z" />
                </svg>
            );
        case 'LogiHub':
            return (
                <svg viewBox="0 0 24 24" style={style}>
                    <path d="M20 18h-4v-2h4v2zm-6-2h-4v-2h4v2zm-6-2H4v-2h4v2zM20 8h-4V6h4v2zm-6 0h-4V6h4v2zM4 8h4V6H4v2z" />
                </svg>
            );
        case 'Wholesaler':
            return (
                <svg viewBox="0 0 24 24" style={style}>
                    <path d="M20 2H4c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM8 18H4v-4h4v4zm0-6H4v-4h4v4zm6 6h-4v-4h4v4zm0-6h-4v-4h4v4zm6 6h-4v-4h4v4zm0-6h-4v-4h4v4z" />
                </svg>
            );
        case 'Reseller':
            return (
                <svg viewBox="0 0 24 24" style={style}>
                    <path d="M21.41 11.58l-9-9C12.05 2.22 11.55 2 11 2H4c-1.1 0-2 .9-2 2v7c0 .55.22 1.05.59 1.42l9 9c.36.36.86.58 1.41.58s1.05-.22 1.41-.59l7-7c.37-.36.59-.86.59-1.41s-.22-1.05-.59-1.42zM13 20.01L4 11V4h7l9 9-7 7.01z" /><circle cx="6.5" cy="6.5" r="1.5" />
                </svg>
            );
        default:
            return null;
    }
};

export const getIconAltitude = (node: LocationNode): number => {
    const BUILDING_TOP_Z = 100;
    return BUILDING_TOP_Z;
};