import { NavLink } from 'react-router-dom';

const menuItems = [
  {
    path: '/estimate',
    label: '견적서 생성',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
];

export default function Sidebar() {
  return (
    <aside className="w-60 flex-shrink-0 bg-[#1a3352] text-white flex flex-col shadow-xl">
      {/* Logo */}
      <div className="px-6 py-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-[#2E75B6] rounded-lg flex items-center justify-center font-bold text-lg">
            C
          </div>
          <div>
            <div className="font-bold text-white text-base leading-tight">컨빌 디자인</div>
            <div className="text-xs text-blue-300 leading-tight">견적 관리 시스템</div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-[#2E75B6] text-white shadow-md'
                  : 'text-blue-200 hover:bg-white/10 hover:text-white'
              }`
            }
          >
            {item.icon}
            {item.label}
          </NavLink>
        ))}

        {/* Placeholder items for future features */}
        <div className="pt-4 border-t border-white/10 mt-4">
          <p className="px-4 text-xs font-semibold text-blue-400 uppercase tracking-wider mb-2">
            예정 기능
          </p>
          {[
            { label: '견적 이력', icon: '📋' },
            { label: '고객 관리', icon: '👥' },
            { label: '설정', icon: '⚙️' },
          ].map((item) => (
            <div
              key={item.label}
              className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm text-blue-300/50 cursor-not-allowed"
            >
              <span>{item.icon}</span>
              {item.label}
              <span className="ml-auto text-xs bg-blue-900/50 text-blue-400 px-2 py-0.5 rounded-full">
                준비중
              </span>
            </div>
          ))}
        </div>
      </nav>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-white/10">
        <p className="text-xs text-blue-400">© 2024 컨빌 디자인</p>
        <p className="text-xs text-blue-400">www.convil.net</p>
      </div>
    </aside>
  );
}
