import React, { ReactNode } from 'react';

interface StatCardProps {
    title: string;
    value: string;
    icon?: ReactNode;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon }) => {
    return (
        <div className='flex items-center justify-center'>
            <div className="bg-[rgba(40,40,40)] p-8 rounded-xl flex items-center justify-center">
                {React.isValidElement(icon) ?
                    React.cloneElement(icon as React.ReactElement, {
                        className: `${icon.props.className || ''} w-12 h-12`
                    })
                    : icon
                }
            </div>
            <div className='flex flex-col pl-4'>
                <h3 className="text-sm text-gray-300 mb-2">{title}</h3>
                <div className='flex items-end gap-7'>
                    <p className="text-[50px] font-bold text-white font-lato">{value}</p>
                </div>
            </div>
        </div>
    );
};

export default StatCard;