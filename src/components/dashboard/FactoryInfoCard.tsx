import { ArrowRightCircle } from 'lucide-react';

// 타입 정의
type Status = 'Normal' | 'Warning' | 'Error';

type FactoryInfoCardProps = {
    name: string;
    status: Status;
    inventory: number;
    lastUpdate: string;
    fullWidth?: boolean;
};

const statusStyles: { [key in Status]: string } = {
    Normal: 'bg-green-500',
    Warning: 'bg-yellow-500',
    Error: 'bg-red-500',
};

export default function FactoryInfoCard({
    name,
    status,
    inventory,
    lastUpdate,
    fullWidth = false
}: FactoryInfoCardProps): JSX.Element {
    return (
        <div className={`bg-[rgba(40,40,40)] p-6 rounded-3xl shadow-lg text-white flex flex-col justify-between ${fullWidth ? 'md:col-span-2' : ''}`}>
            <div>
                <div className="flex justify-between items-start mb-4">
                    <h4 className="text-2xl font-bold">{name}</h4>
                    <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${statusStyles[status]}`}></div>
                        <span className="text-sm">{status}</span>
                    </div>
                </div>
                <p className="text-gray-400">현재 재고</p>
                <p className="text-4xl font-light mb-4">{inventory.toLocaleString()}</p>
            </div>
            <div className="flex justify-between items-end text-sm text-gray-400">
                <span>Last update: {lastUpdate}</span>
                <button className="hover:text-orange-400 transition-colors">
                    <ArrowRightCircle size={24} />
                </button>
            </div>
        </div>
    );
}