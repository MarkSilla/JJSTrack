const StatCard = ({ label, value, sub, icon: Icon, color }) => (
    <div
        className="bg-white rounded-2xl py-3 px-4 relative overflow-hidden group transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 cursor-default"
        style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.04)" }}
    >
        <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full opacity-[0.07] group-hover:opacity-[0.12] transition-opacity duration-500" style={{ background: color }} />
        <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110" style={{ background: color + "1A" }}>
                    <Icon size={16} color={color} strokeWidth={2.2} />
                </div>
                <span className="text-[12px] font-semibold text-gray-500">{label}</span>
            </div>
        </div>
        <div className=" mt-[-14px] text-[22px] font-extrabold text-gray-900 leading-none tracking-tight pl-[45px]">{value}</div>
        <div className="text-[10px] text-gray-400 mt-0.5 pl-[45px]">{sub}</div>
    </div>
);

export default StatCard;
