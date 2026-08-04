import pageViewModel from '../models/pageViewModel.js';

export const recordPageView = async (req, res) => {
  try {
    const doc = await pageViewModel.findOneAndUpdate(
      { page: 'landing' },
      { $inc: { count: 1 } },
      { new: true, upsert: true }
    );
    return res.status(200).json({ success: true, count: doc.count });
  } catch (error) {
    console.error('Error recording page view:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const getPageViewCount = async (req, res) => {
  try {
    let doc = await pageViewModel.findOne({ page: 'landing' });
    if (!doc) {
      doc = await pageViewModel.create({ page: 'landing', count: 0 });
    }
    return res.status(200).json({ success: true, count: doc.count });
  } catch (error) {
    console.error('Error getting page view count:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const resetPageViewCount = async (req, res) => {
  try {
    const doc = await pageViewModel.findOneAndUpdate(
      { page: 'landing' },
      { $set: { count: 0 } },
      { new: true, upsert: true }
    );
    return res.status(200).json({ success: true, count: doc.count, message: 'View count reset to 0' });
  } catch (error) {
    console.error('Error resetting page view count:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};
