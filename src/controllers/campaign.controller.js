const CampaignModel = require('../models/campaign.model');
const { AppError } = require('../middleware/errorHandler');

/**
 * GET /api/campaigns
 * List all campaigns with filter, sort, pagination
 */
async function listCampaigns(req, res, next) {
  try {
    const {
      status,
      sort_by = 'created_at',
      sort_order = 'desc',
      page = 1,
      limit = 10,
      search,
    } = req.query;

    const result = await CampaignModel.findAll({
      status,
      sort_by,
      sort_order,
      page: Math.max(1, parseInt(page, 10) || 1),
      limit: Math.min(100, Math.max(1, parseInt(limit, 10) || 10)),
      search,
    });

    res.json({
      success: true,
      data: result.campaigns,
      pagination: result.pagination,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/campaigns/:id
 * Get a single campaign with full metrics
 */
async function getCampaign(req, res, next) {
  try {
    const { id } = req.params;

    if (isNaN(id)) {
      throw new AppError('Campaign ID must be a number.', 400);
    }

    const campaign = await CampaignModel.findById(id);

    if (!campaign) {
      throw new AppError('Campaign not found.', 404);
    }

    res.json({
      success: true,
      data: campaign,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/campaigns
 * Create a new campaign
 */
async function createCampaign(req, res, next) {
  try {
    const campaign = await CampaignModel.create(req.body, req.user.id);

    res.status(201).json({
      success: true,
      message: 'Campaign created successfully.',
      data: campaign,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /api/campaigns/:id
 * Update an existing campaign
 */
async function updateCampaign(req, res, next) {
  try {
    const { id } = req.params;

    if (isNaN(id)) {
      throw new AppError('Campaign ID must be a number.', 400);
    }

    // Check existence first
    const existing = await CampaignModel.findById(id);
    if (!existing) {
      throw new AppError('Campaign not found.', 404);
    }

    const campaign = await CampaignModel.update(id, req.body);

    res.json({
      success: true,
      message: 'Campaign updated successfully.',
      data: campaign,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/campaigns/:id
 * Soft delete a campaign (sets deleted_at)
 */
async function deleteCampaign(req, res, next) {
  try {
    const { id } = req.params;

    if (isNaN(id)) {
      throw new AppError('Campaign ID must be a number.', 400);
    }

    const campaign = await CampaignModel.softDelete(id);

    if (!campaign) {
      throw new AppError('Campaign not found.', 404);
    }

    res.json({
      success: true,
      message: 'Campaign deleted successfully.',
      data: { id: campaign.id, deleted_at: campaign.deleted_at },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listCampaigns,
  getCampaign,
  createCampaign,
  updateCampaign,
  deleteCampaign,
};
