export default function TableOfContents({ sections, active, onSelect }) {
    return (
        <nav className="font-inter hidden lg:block sticky top-28 self-start bg-white p-6 rounded-xl border border-stone-100 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-widest text-stone-400 mb-4">
                On this page
            </p>
            <ul className="space-y-2">
                {sections.map((s) => {
                    const match = s.title.match(/^(\d+)\.\s+(.*)$/);
                    const num = match ? match[1] : "";
                    const text = match ? match[2] : s.title;

                    return (
                        <li key={s.id}>
                            <div
                                onClick={() => onSelect(s.id)}
                                className={`text-left w-full text-sm py-2 px-3 rounded-md transition-all duration-150 cursor-pointer flex items-center gap-3 ${active === s.id
                                        ? "bg-blue-50 border border-blue-100 text-blue-700 font-semibold"
                                        : "text-stone-500 hover:text-stone-800 hover:bg-stone-50"
                                    }`}
                            >
                                {num && (
                                    <span className={`font-bold shrink-0 ${active === s.id ? "text-blue-700" : "text-stone-400"
                                        }`}>
                                        {num}.
                                    </span>
                                )}
                                <span>{text}</span>
                            </div>
                        </li>
                    );
                })}
            </ul>
        </nav>
    );
}