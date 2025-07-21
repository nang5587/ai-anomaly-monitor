'use client'

const GlobalLoadingIndicator = () => {
    return (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-20 backdrop-blur-sm">
            <div className="relative w-full h-1 overflow-hidden">
                <div
                    className="absolute top-0 left-0 h-full w-full 
                        bg-gradient-to-r from-transparent via-[rgba(111,131,175)] to-transparent 
                        bg-[length:400%_100%] animate-shimmer-custom"
                ></div>
            </div>
        </div>
    );
};

export default GlobalLoadingIndicator;