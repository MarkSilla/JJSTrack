import mongoose from 'mongoose';

const pageViewSchema = new mongoose.Schema(
  {
    page: { type: String, required: true, unique: true, default: 'landing' },
    count: { type: Number, required: true, default: 0 },
  },
  { timestamps: true }
);

const pageViewModel = mongoose.models.PageView || mongoose.model('PageView', pageViewSchema);
export default pageViewModel;
