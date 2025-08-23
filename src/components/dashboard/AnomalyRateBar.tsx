interface AnomalyRateBarProps {
    title: string;
    percentage: number;
}

export default function AnomalyRateBar({ title, percentage }: AnomalyRateBarProps) {
    const safePercentage = Math.max(0, Math.min(100, percentage));

    return (
        <div className="flex flex-col justify-center h-full w-full">
            <div className='flex justify-end items-start'>
                <p className="text-[50px] font-bold text-white font-lato">
                    {safePercentage.toFixed(2)}<span className="text-lg">%&nbsp;<span className="font-vietnam">Anomaly</span></span>
                </p>
            </div>
            <div className="relative w-full h-[3px] bg-[#E0E0E080] rounded-full mt-3">
                <div
                    className="absolute top-0 left-0 h-[4px] bg-[#E0E0E0] rounded-full transition-all duration-500"
                    style={{ width: `${safePercentage}%` }}
                />
                <div
                    className="absolute -top-[6px] w-[18px] h-[18px] bg-[#E0E0E0] rounded-full border-[4px] border-[rgba(101,121,165)] transition-all duration-500"
                    style={{ left: `calc(${safePercentage}% - 8px)` }}
                />
            </div>
        </div>
    );
}