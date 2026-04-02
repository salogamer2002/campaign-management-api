const { alertRulesDb } = require('../services/database');

/**
 * GET /api/rules
 */
function getRules(req, res) {
  const { campaign_id } = req.query;
  const rules = campaign_id
    ? alertRulesDb.getByCampaignId(parseInt(campaign_id))
    : alertRulesDb.getAll();

  res.json({ success: true, data: rules });
}

/**
 * GET /api/rules/:id
 */
function getRule(req, res) {
  const rule = alertRulesDb.getById(req.params.id);
  if (!rule) {
    return res.status(404).json({ success: false, error: 'Rule not found' });
  }
  res.json({ success: true, data: rule });
}

/**
 * POST /api/rules
 */
function createRule(req, res) {
  const { campaign_id, metric, operator, threshold, severity } = req.body;

  if (!campaign_id || !metric || !operator || threshold === undefined) {
    return res.status(400).json({
      success: false,
      error: 'Missing required fields: campaign_id, metric, operator, threshold',
    });
  }

  const validMetrics = ['ctr', 'cpc', 'cpa', 'spend_pct', 'impressions', 'clicks'];
  const validOperators = ['<', '>', '<=', '>=', '=='];

  if (!validMetrics.includes(metric)) {
    return res.status(400).json({
      success: false,
      error: `Invalid metric. Must be one of: ${validMetrics.join(', ')}`,
    });
  }

  if (!validOperators.includes(operator)) {
    return res.status(400).json({
      success: false,
      error: `Invalid operator. Must be one of: ${validOperators.join(', ')}`,
    });
  }

  try {
    const rule = alertRulesDb.create({ campaign_id, metric, operator, threshold, severity });
    res.status(201).json({ success: true, data: rule });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
}

/**
 * PUT /api/rules/:id
 */
function updateRule(req, res) {
  const existing = alertRulesDb.getById(req.params.id);
  if (!existing) {
    return res.status(404).json({ success: false, error: 'Rule not found' });
  }

  const updated = alertRulesDb.update(req.params.id, req.body);
  res.json({ success: true, data: updated });
}

/**
 * DELETE /api/rules/:id
 */
function deleteRule(req, res) {
  const existing = alertRulesDb.getById(req.params.id);
  if (!existing) {
    return res.status(404).json({ success: false, error: 'Rule not found' });
  }

  alertRulesDb.delete(req.params.id);
  res.json({ success: true, message: 'Rule deleted' });
}

module.exports = { getRules, getRule, createRule, updateRule, deleteRule };
