import { useCallback, useState } from 'react'
import { MdCloudUpload, MdImage, MdClose, MdLink } from 'react-icons/md'

const TeamStepDesign = ({ designFile, setDesignFile, driveLink, setDriveLink }) => {
    const [preview, setPreview] = useState(null)

    const handleFile = useCallback((files) => {
        const file = Array.from(files).find((f) => f.type.startsWith('image/'))
        if (file) {
            setDesignFile(file)
            setPreview(URL.createObjectURL(file))
        }
    }, [setDesignFile])

    const removeFile = () => {
        if (preview) URL.revokeObjectURL(preview)
        setDesignFile(null)
        setPreview(null)
    }

    return (
        <section>
            <div className="text-center mb-10">
                <h2 className="text-2xl md:text-3xl font-extrabold text-gray-800 tracking-tight">Upload Design</h2>
                <p className="text-gray-500 mt-2 text-sm">Share your jersey design reference</p>
            </div>

            <div className="max-w-xl mx-auto">
                {/* Upload */}
                {!preview ? (
                    <label
                        onDrop={(e) => { e.preventDefault(); handleFile(e.dataTransfer.files) }}
                        onDragOver={(e) => e.preventDefault()}
                        className="group flex flex-col items-center justify-center gap-3 py-14 rounded-2xl border-2 border-dashed border-blue-300/50 bg-blue-50/30 hover:border-blue-400/60 hover:bg-blue-50/60 cursor-pointer transition-all duration-300"
                    >
                        <div className="w-16 h-16 rounded-2xl bg-blue-100 flex items-center justify-center mb-1 group-hover:bg-blue-200/70 transition-colors">
                            <MdCloudUpload size={32} className="text-blue-500" />
                        </div>
                        <p className="text-gray-700 font-semibold text-sm">Drop your design here or click to browse</p>
                        <p className="text-gray-400 text-xs">JPG, PNG up to 10MB</p>
                        <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFile(e.target.files)} />
                    </label>
                ) : (
                    <div className="relative rounded-2xl overflow-hidden border border-gray-200">
                        <img src={preview} alt="Design preview" className="w-full max-h-80 object-contain bg-gray-50" />
                        <button
                            onClick={removeFile}
                            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-red-600/90 text-white flex items-center justify-center hover:bg-red-500 transition-colors cursor-pointer shadow-lg"
                        >
                            <MdClose size={16} />
                        </button>
                        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/50 to-transparent px-4 py-3">
                            <p className="text-white text-xs font-medium truncate">{designFile?.name}</p>
                        </div>
                    </div>
                )}
                <div className="flex items-center gap-4 my-8">
                    <div className="flex-1 h-px bg-gray-200" />
                    <span className="text-xs font-bold uppercase tracking-widest text-gray-400">or</span>
                    <div className="flex-1 h-px bg-gray-200" />
                </div>

                {/* GDrive Link */}
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <MdLink size={16} className="text-blue-500/70" />
                        <label className="text-xs font-semibold uppercase tracking-wider text-blue-600/70">Google Drive Link</label>
                    </div>
                    <span className="text-xs font-normal tracking-wider text-gray-600"> Please make sure that the link is set to "Anyone with the link can view" </span>
                    <input
                        value={driveLink}
                        onChange={(e) => setDriveLink(e.target.value)}
                        placeholder="https://drive.google.com/..."
                        className="w-full bg-[#F8FAFC] border border-gray-200 rounded-xl px-4 py-3.5 text-gray-800 text-sm placeholder-gray-400 focus:outline-none focus:border-blue-500/70 focus:ring-2 focus:ring-blue-500/15 transition-all duration-200"
                    />
                </div>

                {!preview && !driveLink && (
                    <div className="flex flex-col items-center mt-8 gap-2 text-gray-400">
                        <MdImage size={44} className="text-gray-300" />
                        <p className="text-sm">No design uploaded yet</p>
                    </div>
                )}
            </div>
        </section>
    )
}

export default TeamStepDesign
