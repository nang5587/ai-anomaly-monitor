import React, { ReactNode } from 'react';

interface StatCardProps {
    title: string;
    value: string;
    change?: string; // (선택) 전일 대비 변화량 등
    changeType?: 'increase' | 'decrease';
    icon?: ReactNode;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, change, changeType, icon }) => {
    const changeColor = changeType === 'increase' ? 'text-[#6EE7B7]' : 'text-[#FCA5A5]';

    return (
        <div className='flex items-center'>
            <div className="bg-[rgba(40,40,40)] p-8 rounded-3xl flex items-center justify-center">
                {React.isValidElement(icon) ?
                    React.cloneElement(icon as React.ReactElement, {
                        className: `${icon.props.className || ''} w-10 h-10`
                    })
                    : icon
                }
            </div>

            <div className='flex flex-col pl-4'>
                <h3 className="text-sm text-gray-300 mb-2">{title}</h3>
                <div className='flex items-end gap-7'>
                    <p className="text-[50px] font-bold text-white font-lato">{value}</p>
                    {change && (
                        <p className={`font-lato text-base mt-1 ${changeColor}`}>
                            {change}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default StatCard;