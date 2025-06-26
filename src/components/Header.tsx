interface HeaderProps {
  sidebarWidth: number;
}

export default function Header({sidebarWidth}: HeaderProps) {
  return (
    <header
      className="bg-white px-6 py-3 shadow-sm flex items-center justify-between"
      style={{ width: `calc(100vw - ${sidebarWidth}px)` }}
    >
      <h1 className="text-xl font-semibold text-gray-800">2D 바코드 진단 웹</h1>
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-600">관리자</span>
        <img
          src="/avatar.png"
          alt="profile"
          className="w-8 h-8 rounded-full border"
        />
      </div>
    </header>
  );
}
