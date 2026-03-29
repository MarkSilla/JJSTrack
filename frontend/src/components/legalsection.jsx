export default function Section({ section }) {
    const Icon = section.icon;
    const match = section.title.match(/^(\d+)\.\s+(.*)$/);
    const num = match ? match[1] : "";
    const text = match ? match[2] : section.title;

    return (
        <div id={section.id} className="mb-8 scroll-mt-24 bg-white p-6 md:p-8 rounded-xl border border-stone-100 shadow-sm">
            <h3 className="font-inter text-xl font-bold text-stone-800 mb-6 pb-4 border-b border-stone-100 flex items-center gap-3">
                {num ? (
                    <span className="text-blue-600 font-bold shrink-0">
                        {num}.
                    </span>
                ) : (
                    Icon && <Icon className="w-6 h-6 text-blue-600" />
                )}
                <span>{text}</span>
            </h3>
            <div className="font-inter text-stone-600 leading-relaxed text-sm md:text-base">
                {section.content}
            </div>
        </div>
    );
}