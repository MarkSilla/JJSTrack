import pricingModel from '../models/pricingModel.js';

const DEFAULT_PRICING = {
  repair: {
    serviceType: 'repair',
    baseFee: 0,
    repairOptions: {
      zipper: 150,
      button: 50,
      hem: 120,
      waist: 200,
      patch: 180,
      lining: 250,
      sleeve: 180,
      general: 100,
      others: 0,
    },
  },
  jersey: {
    serviceType: 'jersey',
    baseFee: 0,
    basePerPlayer: 550,
    pocketPrice: 100,
    jerseyProducts: {
      jersey: 550,
      fullset: 850,
      short: 400,
    },
    jerseyAddOns: {
      warmer: 750,
      hoodie: 700,
    },
  },
  organizational: {
    serviceType: 'organizational',
    baseFee: 0,
    basePerItem: 500,
    organizationalProducts: {
      tshirt: 500,
      polo: 650,
    },
  },
};

const mapToObject = (value = {}) => {
  if (value instanceof Map) return Object.fromEntries(value);
  if (value && typeof value === 'object') return value;
  return {};
};

const serializePricing = (pricing) => {
  const plain = typeof pricing?.toObject === 'function' ? pricing.toObject() : pricing;
  if (!plain) return plain;

  return {
    ...plain,
    repairOptions: mapToObject(plain.repairOptions),
    jerseyProducts: mapToObject(plain.jerseyProducts),
    jerseyAddOns: mapToObject(plain.jerseyAddOns),
    organizationalProducts: mapToObject(plain.organizationalProducts),
  };
};

const getDefaultPricingList = () => Object.values(DEFAULT_PRICING);

const mergeWithDefault = (pricing) => {
  const serialized = serializePricing(pricing);
  const defaults = DEFAULT_PRICING[serialized?.serviceType] || {};
  return {
    ...defaults,
    ...serialized,
    repairOptions: {
      ...mapToObject(defaults.repairOptions),
      ...mapToObject(serialized?.repairOptions),
    },
    jerseyProducts: {
      ...mapToObject(defaults.jerseyProducts),
      ...mapToObject(serialized?.jerseyProducts),
    },
    jerseyAddOns: {
      ...mapToObject(defaults.jerseyAddOns),
      ...mapToObject(serialized?.jerseyAddOns),
    },
    organizationalProducts: {
      ...mapToObject(defaults.organizationalProducts),
      ...mapToObject(serialized?.organizationalProducts),
    },
  };
};

const normalizeNumberMap = (value = {}) =>
  Object.entries(mapToObject(value)).reduce((acc, [key, rawValue]) => {
    const parsed = Number(rawValue);
    acc[key] = Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
    return acc;
  }, {});

// Get all pricing
export const getPricing = async (req, res) => {
  try {
    const pricing = await pricingModel.find();
    const pricingByType = new Map(pricing.map((item) => [item.serviceType, mergeWithDefault(item)]));
    const data = getDefaultPricingList().map((defaults) => ({
      ...defaults,
      ...(pricingByType.get(defaults.serviceType) || {}),
    }));

    res.json({
      success: true,
      pricing: data,
      data,
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
    const defaults = DEFAULT_PRICING[serviceType];
    
    if (!pricing && !defaults) {
      return res.status(404).json({ 
        success: false, 
        message: `Pricing not found for service type: ${serviceType}` 
      });
    }

    const data = pricing ? mergeWithDefault(pricing) : defaults;

    res.json({
      success: true,
      pricing: data,
      data,
    });
  } catch (error) {
    console.error('Get Pricing By Type Error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch pricing' });
  }
};

// Create or update pricing
export const createOrUpdatePricing = async (req, res) => {
  try {
    const {
      serviceType: bodyServiceType,
      baseFee,
      basePerPlayer,
      basePerItem,
      pocketPrice,
      repairOptions,
      jerseyProducts,
      jerseyAddOns,
      organizationalProducts,
    } = req.body;
    const serviceType = bodyServiceType || req.params.serviceType;

    if (!serviceType) {
      return res.status(400).json({ 
        success: false, 
        message: 'Service type is required' 
      });
    }

    let pricing = await pricingModel.findOne({ serviceType });

    const wasNew = !pricing;

    if (pricing) {
      // Update existing
      pricing.baseFee = baseFee ?? pricing.baseFee;
      pricing.basePerPlayer = basePerPlayer ?? pricing.basePerPlayer;
      pricing.basePerItem = basePerItem ?? pricing.basePerItem;
      pricing.pocketPrice = pocketPrice ?? pricing.pocketPrice;
      if (repairOptions) pricing.repairOptions = normalizeNumberMap(repairOptions);
      if (jerseyProducts) pricing.jerseyProducts = normalizeNumberMap(jerseyProducts);
      if (jerseyAddOns) pricing.jerseyAddOns = normalizeNumberMap(jerseyAddOns);
      if (organizationalProducts) pricing.organizationalProducts = normalizeNumberMap(organizationalProducts);
      pricing.updatedAt = new Date();
    } else {
      // Create new
      const defaults = DEFAULT_PRICING[serviceType] || {};
      pricing = new pricingModel({
        serviceType,
        baseFee: baseFee ?? defaults.baseFee ?? 0,
        basePerPlayer: basePerPlayer ?? defaults.basePerPlayer ?? 0,
        basePerItem: basePerItem ?? defaults.basePerItem ?? 0,
        pocketPrice: pocketPrice ?? defaults.pocketPrice ?? 0,
        repairOptions: normalizeNumberMap(repairOptions || defaults.repairOptions),
        jerseyProducts: normalizeNumberMap(jerseyProducts || defaults.jerseyProducts),
        jerseyAddOns: normalizeNumberMap(jerseyAddOns || defaults.jerseyAddOns),
        organizationalProducts: normalizeNumberMap(organizationalProducts || defaults.organizationalProducts),
      });
    }

    await pricing.save();

    res.status(wasNew ? 201 : 200).json({
      success: true,
      message: `Pricing ${wasNew ? 'created' : 'updated'} successfully`,
      pricing: mergeWithDefault(pricing),
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
