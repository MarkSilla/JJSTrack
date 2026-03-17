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
            <div className="text-center mb-10">
                <h2 className="text-2xl md:text-3xl font-extrabold text-gray-800 tracking-tight">Upload Photos</h2>
                <p className="text-gray-500 mt-2 text-sm">Help us understand the repair needed</p>
            </div>

            <div className="max-w-xl mx-auto">
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

                {photos.length > 0 ? (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mt-6">
                        {photos.map((p, i) => (
                            <div key={i} className="relative group/img rounded-xl overflow-hidden aspect-square ring-1 ring-gray-200">
                                <img src={p.preview} alt="" className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover/img:opacity-100 transition-opacity" />
                                <button
                                    onClick={() => removePhoto(i)}
                                    className="absolute top-2 right-2 w-6 h-6 rounded-full bg-red-600/90 text-white flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity cursor-pointer"
                                >
                                    <MdClose size={14} />
                                </button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center mt-10 gap-3 text-gray-400">
                        <MdImage size={44} className="text-gray-300" />
                        <p className="text-sm text-gray-400">No images selected yet</p>
                        <button onClick={skipPhoto} className="text-blue-500 text-sm font-medium underline underline-offset-4 decoration-blue-300/50 hover:decoration-blue-500 hover:text-blue-600 transition-colors cursor-pointer">
                            Skip this step
                        </button>
                    </div>
                )}
            </div>
        </section>
    )
}

export default StepPhoto
