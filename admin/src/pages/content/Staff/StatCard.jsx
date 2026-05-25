const StatCard = ({ label, value, sub, icon: Icon, color, onClick }) => (
    <div
        className="bg-white rounded-2xl p-2 sm:py-3 sm:px-4 relative overflow-hidden group transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 cursor-pointer border-none text-left w-full focus:outline-none"
        style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.04)" }}
        onClick={onClick}
    >
        <div className="absolute -top-8 -right-12 w-24 h-24 rounded-full opacity-[0.07] group-hover:opacity-[0.12] transition-opacity duration-500" style={{ background: color }} />
        <div className="flex items-center justify-between mb-1.5 sm:mb-3">
            <div className="flex items-center gap-2 sm:gap-2.5">
                <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110" style={{ background: color + "1A" }}>
                    <Icon size={13} color={color} strokeWidth={2.5} className="sm:hidden" />
                    <Icon size={16} color={color} strokeWidth={2.2} className="hidden sm:block" />
                </div>
                <span className="text-[8px] sm:text-[12px] font-bold sm:font-semibold text-gray-500 leading-tight">{label}</span>
            </div>
        </div>
        <div className="mt-[-4px] sm:mt-[-14px] text-[14px] sm:text-[22px] font-black sm:font-extrabold text-gray-900 leading-none tracking-tight pl-[36px] sm:pl-[45px] text-left">{value}</div>
        <div className="block text-[9px] text-gray-400 mt-1 sm:mt-0.5 pl-[36px] sm:pl-[45px] opacity-80 sm:opacity-100">{sub}</div>
    </div>
);

export default StatCard;

