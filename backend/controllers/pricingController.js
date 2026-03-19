import pricingModel from '../models/pricingModel.js';

// Get all pricing
export const getPricing = async (req, res) => {
  try {
    const pricing = await pricingModel.find();
    res.json({
      success: true,
      pricing,
      data: pricing,
    });
  } catch (error) {
    console.error('Get Pricing Error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch pricing' });
  }
};

// Get pricing by service type
export const getPricingByType = async (req, res) => {
  try {
    const { serviceType } = req.params;
    
    const pricing = await pricingModel.findOne({ serviceType });
    
    if (!pricing) {
      return res.status(404).json({ 
        success: false, 
        message: `Pricing not found for service type: ${serviceType}` 
      });
    }

    res.json({
      success: true,
      pricing,
      data: pricing,
    });
  } catch (error) {
    console.error('Get Pricing By Type Error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch pricing' });
  }
};

// Create or update pricing
export const createOrUpdatePricing = async (req, res) => {
  try {
    const { serviceType, baseFee, basePerPlayer, basePerItem, pocketPrice } = req.body;

    if (!serviceType) {
      return res.status(400).json({ 
        success: false, 
        message: 'Service type is required' 
      });
    }

    let pricing = await pricingModel.findOne({ serviceType });

    if (pricing) {
      // Update existing
      pricing.baseFee = baseFee ?? pricing.baseFee;
      pricing.basePerPlayer = basePerPlayer ?? pricing.basePerPlayer;
      pricing.basePerItem = basePerItem ?? pricing.basePerItem;
      pricing.pocketPrice = pocketPrice ?? pricing.pocketPrice;
      pricing.updatedAt = new Date();
    } else {
      // Create new
      pricing = new pricingModel({
        serviceType,
        baseFee: baseFee || 0,
        basePerPlayer: basePerPlayer || 0,
        basePerItem: basePerItem || 0,
        pocketPrice: pocketPrice || 0,
      });
    }

    await pricing.save();

    res.status(pricing.isNew ? 201 : 200).json({
      success: true,
      message: `Pricing ${pricing.isNew ? 'created' : 'updated'} successfully`,
      pricing,
    });
  } catch (error) {
    console.error('Create/Update Pricing Error:', error);
    res.status(500).json({ success: false, message: 'Failed to save pricing' });
  }
};

// Delete pricing
export const deletePricing = async (req, res) => {
  try {
    const { serviceType } = req.params;

    const pricing = await pricingModel.findOneAndDelete({ serviceType });

    if (!pricing) {
      return res.status(404).json({ 
        success: false, 
        message: 'Pricing not found' 
      });
    }

    res.json({
      success: true,
      message: 'Pricing deleted successfully',
    });
  } catch (error) {
    console.error('Delete Pricing Error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete pricing' });
  }
};
