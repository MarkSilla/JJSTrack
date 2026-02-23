import serviceModel from '../models/serviceModel.js';

// Create a new service
export const createService = async (req, res) => {
  try {
    const { name, description, category, basePrice, unit, options, addOns, isActive } = req.body;

    const service = new serviceModel({
      name,
      description,
      category,
      basePrice,
      unit,
      options,
      addOns,
      isActive,
    });

    await service.save();

    res.status(201).json({
      success: true,
      message: 'Service created successfully',
      service,
    });
  } catch (error) {
    console.error('Create Service Error:', error);
    res.status(500).json({ success: false, message: 'Failed to create service' });
  }
};

// Get all services
export const getServices = async (req, res) => {
  try {
    const { category, isActive } = req.query;
    let query = {};

    if (category) {
      query.category = category;
    }

    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    const services = await serviceModel.find(query).sort({ createdAt: -1 });

    res.json({
      success: true,
      services,
    });
  } catch (error) {
    console.error('Get Services Error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch services' });
  }
};

// Get single service by ID
export const getServiceById = async (req, res) => {
  try {
    const { id } = req.params;
    const service = await serviceModel.findById(id);

    if (!service) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }

    res.json({
      success: true,
      service,
    });
  } catch (error) {
    console.error('Get Service By ID Error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch service' });
  }
};

// Update service
export const updateService = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, category, basePrice, unit, options, addOns, isActive } = req.body;

    const service = await serviceModel.findByIdAndUpdate(
      id,
      { name, description, category, basePrice, unit, options, addOns, isActive },
      { new: true }
    );

    if (!service) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }

    res.json({
      success: true,
      message: 'Service updated successfully',
      service,
    });
  } catch (error) {
    console.error('Update Service Error:', error);
    res.status(500).json({ success: false, message: 'Failed to update service' });
  }
};

// Delete service
export const deleteService = async (req, res) => {
  try {
    const { id } = req.params;
    const service = await serviceModel.findByIdAndDelete(id);

    if (!service) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }

    res.json({
      success: true,
      message: 'Service deleted successfully',
    });
  } catch (error) {
    console.error('Delete Service Error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete service' });
  }
};

// Seed default services
export const seedServices = async (req, res) => {
  try {
    const defaultServices = [
      {
        name: 'Jersey Repair',
        description: 'Professional jersey repair services including sewing, patching, and alterations',
        category: 'repair',
        basePrice: 250,
        unit: 'piece',
        options: [
          { name: 'Sewing', price: 150, description: 'Basic sewing repairs' },
          { name: 'Patching', price: 200, description: 'Patch work for holes and tears' },
          { name: 'Alteration', price: 300, description: 'Size adjustments' },
          { name: 'Embroidery', price: 350, description: 'Custom embroidery work' },
        ],
        addOns: [
          { name: 'Express Service', price: 100, description: '24-hour turnaround' },
          { name: 'Premium Thread', price: 50, description: 'High-quality thread for durability' },
        ],
        isActive: true,
      },
      {
        name: 'Team Jersey',
        description: 'Custom team jerseys with player names and numbers',
        category: 'jersey',
        basePrice: 650,
        unit: 'piece',
        options: [
          { name: 'Sublimation', price: 0, description: 'Full color sublimation printing' },
          { name: 'Embroidery', price: 150, description: 'Team logo embroidery' },
          { name: 'Numbering', price: 50, description: 'Player numbers' },
        ],
        addOns: [
          { name: 'Pocket Shorts', price: 100, description: 'Matching shorts with pocket' },
          { name: 'Jersey Bag', price: 150, description: 'Custom jersey carrying bag' },
          { name: 'Logo Design', price: 500, description: 'Custom team logo design' },
        ],
        isActive: true,
      },
      {
        name: 'Organizational Uniform',
        description: 'Custom uniforms for organizations, schools, and companies',
        category: 'organizational',
        basePrice: 700,
        unit: 'piece',
        options: [
          { name: 'Sublimation', price: 0, description: 'Full color sublimation' },
          { name: 'Embroidery', price: 200, description: 'Organization logo embroidery' },
          { name: 'Custom Design', price: 1000, description: 'Unique custom design' },
        ],
        addOns: [
          { name: 'Pocket Shorts', price: 120, description: 'Matching shorts with pocket' },
          { name: 'Socks Pair', price: 150, description: 'Matching socks pair' },
          { name: 'Jacket', price: 800, description: 'Matching warm-up jacket' },
        ],
        isActive: true,
      },
      {
        name: 'Alteration',
        description: 'Professional alteration services for various garments',
        category: 'general',
        basePrice: 200,
        unit: 'piece',
        options: [
          { name: 'Hemming', price: 100, description: 'Shorten or lengthen' },
          { name: 'Waist Adjustment', price: 150, description: 'Take in or let out' },
          { name: 'Sleeve Shortening', price: 120, description: 'Adjust sleeve length' },
        ],
        addOns: [
          { name: 'Rush Service', price: 150, description: 'Same-day or next-day service' },
        ],
        isActive: true,
      },
    ];

    // Check if services already exist
    const existingCount = await serviceModel.countDocuments();
    if (existingCount > 0) {
      return res.json({
        success: true,
        message: 'Services already seeded',
        count: existingCount,
      });
    }

    const services = await serviceModel.insertMany(defaultServices);

    res.status(201).json({
      success: true,
      message: 'Services seeded successfully',
      count: services.length,
    });
  } catch (error) {
    console.error('Seed Services Error:', error);
    res.status(500).json({ success: false, message: 'Failed to seed services' });
  }
};
