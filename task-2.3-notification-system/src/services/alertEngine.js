const fetch = require('node-fetch');
const { alertRulesDb, notificationsDb } = require('./database');
const config = require('../config');

/**
 * Alert Rule Engine
 * 
 * Periodically polls the Campaign API for metrics, evaluates them
 * against configured alert rules, and emits notifications via callback.
 */
class AlertEngine {
  constructor(onNotification) {
    this.onNotification = onNotification; // callback(notification)
    this.intervalId = null;
    this.isRunning = false;
  }

  /**
   * Start the polling loop.
   */
  start() {
    if (this.isRunning) return;
    this.isRunning = true;

    console.log(`[AlertEngine] Started — polling every ${config.POLL_INTERVAL_MS / 1000}s`);
    this.check(); // run immediately
    this.intervalId = setInterval(() => this.check(), config.POLL_INTERVAL_MS);
  }

  /**
   * Stop the polling loop.
   */
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    console.log('[AlertEngine] Stopped');
  }

  /**
   * Run a single check cycle across all enabled rules.
   */
  async check() {
    try {
      const rules = alertRulesDb.getAll();
      if (rules.length === 0) return;

      // Group rules by campaign
      const grouped = {};
      for (const rule of rules) {
        if (!grouped[rule.campaign_id]) grouped[rule.campaign_id] = [];
        grouped[rule.campaign_id].push(rule);
      }

      // Check each campaign
      for (const [campaignId, campaignRules] of Object.entries(grouped)) {
        await this.checkCampaign(parseInt(campaignId), campaignRules);
      }
    } catch (err) {
      console.error('[AlertEngine] Check cycle error:', err.message);
    }
  }

  /**
   * Fetch campaign data and evaluate its rules.
   */
  async checkCampaign(campaignId, rules) {
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (config.CAMPAIGN_API_TOKEN) {
        headers['Authorization'] = `Bearer ${config.CAMPAIGN_API_TOKEN}`;
      }

      const response = await fetch(
        `${config.CAMPAIGN_API_URL}/campaigns/${campaignId}`,
        { headers, timeout: 5000 }
      );

      if (!response.ok) {
        console.warn(`[AlertEngine] Campaign ${campaignId} fetch failed: ${response.status}`);
        return;
      }

      const { data: campaign } = await response.json();
      if (!campaign) return;

      // Extract metrics
      const metrics = {
        ctr: campaign.ctr || 0,
        cpc: campaign.cpc || 0,
        cpa: campaign.cpa || 0,
        impressions: campaign.impressions || 0,
        clicks: campaign.clicks || 0,
        spend_pct: campaign.budget > 0
          ? ((campaign.spent || 0) / campaign.budget) * 100
          : 0,
      };

      // Evaluate each rule
      for (const rule of rules) {
        const value = metrics[rule.metric];
        if (value === undefined) continue;

        const triggered = this.evaluate(value, rule.operator, rule.threshold);
        if (triggered) {
          this.triggerAlert(rule, campaign, metrics);
        }
      }
    } catch (err) {
      console.error(`[AlertEngine] Error checking campaign ${campaignId}:`, err.message);
    }
  }

  /**
   * Evaluate: value <op> threshold
   */
  evaluate(value, operator, threshold) {
    switch (operator) {
      case '<': return value < threshold;
      case '>': return value > threshold;
      case '<=': return value <= threshold;
      case '>=': return value >= threshold;
      case '==': return value === threshold;
      default: return false;
    }
  }

  /**
   * Create a notification and emit it.
   */
  triggerAlert(rule, campaign, metrics) {
    const metricLabels = {
      ctr: 'CTR',
      cpc: 'CPC',
      cpa: 'CPA',
      spend_pct: 'Budget Spent',
      impressions: 'Impressions',
      clicks: 'Clicks',
    };

    const label = metricLabels[rule.metric] || rule.metric;
    const value = metrics[rule.metric];
    const title = `${rule.severity.toUpperCase()}: ${campaign.name || `Campaign #${rule.campaign_id}`}`;
    const message = `${label} is ${value.toFixed(2)} (threshold: ${rule.operator} ${rule.threshold})`;

    const notification = notificationsDb.create({
      rule_id: rule.id,
      campaign_id: rule.campaign_id,
      type: 'alert',
      title,
      message,
      severity: rule.severity,
    });

    console.log(`[AlertEngine] 🔔 ${title}: ${message}`);

    if (this.onNotification) {
      this.onNotification(notification);
    }
  }
}

module.exports = AlertEngine;
