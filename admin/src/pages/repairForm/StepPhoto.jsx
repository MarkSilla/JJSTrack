import { useCallback } from 'react'
import { MdCloudUpload, MdImage, MdClose } from 'react-icons/md'

const StepPhoto = ({ photos, setPhotos, skipPhoto }) => {
    const handleFiles = useCallback(
        (files) => {
            const added = Array.from(files)
                .filter((f) => f.type.startsWith('image/'))
                .slice(0, 5 - photos.length)
                .map((f) => ({ file: f, preview: URL.createObjectURL(f) }))
            setPhotos((p) => [...p, ...added])
        },
        [photos.length, setPhotos]
    )

    const removePhoto = (idx) =>
        setPhotos((p) => {
            URL.revokeObjectURL(p[idx].preview)
            return p.filter((_, i) => i !== idx)
        })

    return (
        <section>
            <div className="text-center mb-5 font-inter">
                <h2 className="text-2xl md:text-3xl font-extrabold text-gray-800 tracking-tight">Upload Photos</h2>
                <p className="text-gray-500 mt-2 text-sm">Help us understand the repair needed</p>
            </div>

            <div className="max-w-xl mx-auto">
                {photos.length === 0 ? (
                    <label
                        onDrop={(e) => { e.preventDefault(); handleFiles(e.dataTransfer.files) }}
                        onDragOver={(e) => e.preventDefault()}
                        className="group flex flex-col items-center justify-center gap-3 py-14 rounded-2xl border-2 border-dashed border-blue-300/50 bg-blue-50/30 hover:border-blue-400/60 hover:bg-blue-50/60 cursor-pointer transition-all duration-300"
                    >
                        <div className="w-16 h-16 rounded-2xl bg-blue-100 flex items-center justify-center mb-1 group-hover:bg-blue-200/70 transition-colors">
                            <MdCloudUpload size={32} className="text-blue-500" />
                        </div>
                        <p className="text-gray-700 font-semibold text-sm">Drop your image here or click to browse</p>
                        <p className="text-gray-400 text-xs">JPG, PNG up to 5MB</p>
                        <input type="file" className="hidden" accept="image/*" multiple onChange={(e) => handleFiles(e.target.files)} />
                    </label>
                ) : (
                    <div
                        onDrop={(e) => { e.preventDefault(); handleFiles(e.dataTransfer.files) }}
                        onDragOver={(e) => e.preventDefault()}
                        className="relative w-full aspect-[16/9] rounded-2xl border-2 border-transparent hover:border-blue-400 overflow-hidden group transition-all duration-300"
                    >
                        <img src={photos[0].preview} alt="" className="w-full h-full object-cover" />

                        {/* Overlay functionality for adding more & removing main photo */}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center">
                            <label className="cursor-pointer flex flex-col items-center justify-center p-6 rounded-xl hover:bg-white/10 transition-colors">
                                <MdCloudUpload size={36} className="text-white drop-shadow-md" />
                                <span className="text-white font-bold mt-2 drop-shadow-md text-sm">Add More Photos</span>
                                <input type="file" className="hidden" accept="image/*" multiple onChange={(e) => handleFiles(e.target.files)} />
                            </label>

                            <button
                                onClick={() => removePhoto(0)}
                                className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-red-600/90 text-white flex items-center justify-center shadow-lg hover:bg-red-500 hover:scale-105 transition-all cursor-pointer"
                                title="Remove Image"
                            >
                                <MdClose size={18} />
                            </button>
                        </div>
                    </div>
                )}

                {photos.length > 1 && (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mt-4">
                        {photos.slice(1).map((p, i) => (
                            <div key={i + 1} className="relative group/img rounded-xl overflow-hidden aspect-square ring-1 ring-gray-200 shadow-sm">
                                <img src={p.preview} alt="" className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity" />
                                <button
                                    onClick={() => removePhoto(i + 1)}
                                    className="absolute top-2 right-2 z-20 w-6 h-6 rounded-full bg-red-600/90 text-white flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity cursor-pointer shadow-md hover:scale-105"
                                >
                                    <MdClose size={14} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </section>
    )
}

export default StepPhoto
