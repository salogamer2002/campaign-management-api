const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');
const {
  listCampaigns,
  getCampaign,
  createCampaign,
  updateCampaign,
  deleteCampaign,
} = require('../controllers/campaign.controller');
const {
  createCampaignSchema,
  updateCampaignSchema,
  validate,
} = require('../validators/campaign.validator');

// All campaign routes require authentication
router.use(authenticate);

// GET /api/campaigns — list all with filters/sort/pagination
router.get('/', listCampaigns);

// POST /api/campaigns — create new campaign
router.post('/', validate(createCampaignSchema), createCampaign);

// GET /api/campaigns/:id — single campaign with full metrics
router.get('/:id', getCampaign);

// PUT /api/campaigns/:id — update campaign
router.put('/:id', validate(updateCampaignSchema), updateCampaign);

// DELETE /api/campaigns/:id — soft delete
router.delete('/:id', deleteCampaign);

module.exports = router;
