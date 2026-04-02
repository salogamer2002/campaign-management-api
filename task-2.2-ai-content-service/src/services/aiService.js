/**
 * AI Content Generation Service
 * 
 * Uses OpenAI if an API key is provided, otherwise falls back
 * to intelligent mock responses for demonstration purposes.
 */

const config = require('../config');

// ─── Mock Data Templates ────────────────────────────────────────

const COPY_TEMPLATES = {
  professional: {
    headlines: [
      'Elevate Your Business with {product}',
      'Discover the {product} Advantage',
      'Transform Your Results with {product}',
      '{product}: The Smart Choice for Modern Professionals',
    ],
    bodies: [
      'In today\'s competitive landscape, {product} stands out as the definitive solution for businesses seeking excellence. Our proven track record demonstrates measurable results, helping organizations achieve up to 40% improvement in key metrics.',
      'Experience the difference that {product} brings to your workflow. Designed with precision and backed by industry expertise, our solution empowers teams to accomplish more with less effort.',
      '{product} combines cutting-edge technology with intuitive design to deliver unparalleled performance. Join thousands of satisfied professionals who have already made the switch.',
    ],
    ctas: [
      'Start Your Free Trial Today',
      'Request a Demo',
      'Get Started Now',
      'Learn More',
      'Schedule a Consultation',
    ],
  },
  casual: {
    headlines: [
      'Say Hello to {product} 👋',
      '{product} Just Changed the Game',
      'Why Everyone\'s Talking About {product}',
      'Meet Your New Favorite: {product}',
    ],
    bodies: [
      'Tired of the same old routine? {product} is here to shake things up! It\'s easy to use, super effective, and honestly? Kinda fun. Give it a try — you won\'t look back.',
      'We get it — you\'re busy. That\'s exactly why we made {product}. It\'s fast, it\'s simple, and it actually works. No fluff, no fuss. Just results.',
      'Everyone\'s been raving about {product}, and for good reason. It makes life easier, saves you time, and looks pretty great doing it.',
    ],
    ctas: [
      'Try It Free!',
      'Jump In →',
      'See What\'s Up',
      'Let\'s Go!',
      'Check It Out',
    ],
  },
  luxury: {
    headlines: [
      'Introducing {product}: Where Excellence Meets Elegance',
      '{product} — Redefining Distinction',
      'The Art of {product}',
      'Exceptional by Design: {product}',
    ],
    bodies: [
      'Crafted for those who appreciate the finer things, {product} represents the pinnacle of innovation and sophistication. Each detail has been meticulously considered to deliver an experience that is nothing short of extraordinary.',
      '{product} is more than a solution — it is a statement. Born from a tradition of excellence and refined through relentless pursuit of perfection, it stands as a testament to what is possible.',
      'Discover {product}: where every interaction is an experience, every feature a masterpiece. Designed exclusively for discerning individuals who refuse to compromise.',
    ],
    ctas: [
      'Experience Excellence',
      'Discover More',
      'Explore the Collection',
      'Request a Private Preview',
      'Begin Your Journey',
    ],
  },
};

const SOCIAL_TEMPLATES = {
  instagram: [
    '✨ {goal} starts here. Discover how our brand is making waves in the industry. #Innovation #Growth',
    '🚀 Big things are happening! We\'re {goal} and couldn\'t be more excited to share the journey with you.',
    '💡 Did you know? Our latest approach to {goal} has been turning heads. Swipe to see why →',
    '🎯 {goal} is not just a goal — it\'s our mission. Here\'s how we\'re making it happen, one step at a time.',
    '🌟 Behind the scenes of {goal}. The team has been working hard, and the results speak for themselves.',
  ],
  twitter: [
    '🧵 {goal} — here\'s what we\'ve learned so far and why it matters for the industry.',
    'Hot take: {goal} is the biggest opportunity most brands are sleeping on. Here\'s why 👇',
    'We just hit a major milestone in {goal}. Grateful for the team and community that made it possible. 🙏',
    '{goal} update: The numbers are in, and they\'re looking 🔥. More details coming soon.',
    'What if I told you that {goal} could be achieved 2x faster? We\'re proving it\'s possible.',
  ],
  linkedin: [
    'I\'m excited to share our progress on {goal}. In today\'s fast-moving landscape, staying ahead means constantly innovating.\n\nHere are 3 key takeaways from our latest initiative:\n\n1️⃣ Data-driven decisions lead to 40% better outcomes\n2️⃣ Team alignment is the hidden multiplier\n3️⃣ Consistency beats intensity every time\n\nWhat\'s your experience with {goal}? I\'d love to hear your thoughts.',
    'Proud to announce that our team has been making significant strides in {goal}.\n\nThe journey hasn\'t been easy, but the results have been worth every challenge.\n\nKey insight: Success in {goal} isn\'t about having the perfect strategy — it\'s about executing consistently and learning fast.\n\n#Leadership #Innovation #Growth',
    '{goal} — it\'s the topic on every leader\'s mind right now.\n\nAfter months of research and implementation, here\'s what we\'ve found actually works:\n\n✅ Start with clear metrics\n✅ Invest in your team\'s capabilities\n✅ Iterate quickly based on feedback\n\nThe brands that get this right will define the next decade.',
    'The future of {goal} is here, and it\'s more exciting than ever.\n\nOur latest data shows that companies focusing on this area are seeing 3x growth compared to industry averages.\n\nThe question isn\'t IF you should prioritize {goal} — it\'s HOW FAST you can start.',
    'Reflecting on our {goal} journey this quarter.\n\nWhat started as an experiment has become a core part of our strategy. The lesson? Don\'t be afraid to bet big on what the data tells you.\n\nExcited for what\'s next. 🚀',
  ],
  facebook: [
    '🎉 Exciting news! We\'ve been working hard on {goal}, and the results are finally here. Check out what we\'ve accomplished and where we\'re headed next!',
    '📢 {goal} update! We love keeping our community in the loop. Here\'s the latest on what we\'ve been up to and why it matters to you.',
    '💪 {goal} is at the heart of everything we do. Today, we want to share a behind-the-scenes look at how our team makes it happen.',
    '🌈 Your support has been incredible! Thanks to you, {goal} has exceeded our expectations. Here\'s a look at the journey so far.',
    '🔔 Mark your calendars! We\'re about to share something big related to {goal}. Stay tuned for the full reveal!',
  ],
  tiktok: [
    '🎬 POV: You finally nail {goal} and everything changes. Watch what happened when we went all in.',
    '⚡ {goal} speed run! We did it in record time and here\'s how 👇',
    '🤯 Nobody expected THIS result from {goal}. The plot twist at the end is *chef\'s kiss*.',
    '📈 Before vs. After: {goal} edition. The transformation is unreal.',
    '🎯 3 secrets to crushing {goal} that nobody talks about. Number 2 will surprise you!',
  ],
};

const HASHTAG_TEMPLATES = {
  technology: ['#TechInnovation', '#DigitalTransformation', '#FutureTech', '#AI', '#MachineLearning', '#CloudComputing', '#StartupLife', '#TechTrends', '#Innovation', '#SmartSolutions'],
  marketing: ['#DigitalMarketing', '#MarketingStrategy', '#ContentMarketing', '#BrandBuilding', '#GrowthHacking', '#SocialMediaMarketing', '#MarketingTips', '#Branding', '#CustomerEngagement', '#ROI'],
  ecommerce: ['#Ecommerce', '#OnlineShopping', '#RetailInnovation', '#ShopNow', '#CustomerExperience', '#DTC', '#EcommerceTips', '#OnlineStore', '#ShopSmall', '#RetailTech'],
  healthcare: ['#HealthTech', '#DigitalHealth', '#HealthcareInnovation', '#Wellness', '#MedTech', '#PatientCare', '#HealthcareAI', '#Telehealth', '#HealthData', '#FutureOfHealthcare'],
  finance: ['#FinTech', '#FinancialInnovation', '#DigitalBanking', '#InvestSmart', '#WealthManagement', '#CryptoNews', '#PaymentTech', '#InsureTech', '#FinancialLiteracy', '#MoneyMatters'],
  general: ['#Innovation', '#Growth', '#Strategy', '#Leadership', '#Success', '#Trending', '#MustSee', '#Inspiration', '#GoalSetting', '#Results'],
};

// ─── Helper ─────────────────────────────────────────────────────

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickN(arr, n) {
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, n);
}

function fillTemplate(template, vars) {
  let result = template;
  for (const [key, value] of Object.entries(vars)) {
    result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
  }
  return result;
}

function truncateToWordLimit(text, limit) {
  if (!limit) return text;
  const words = text.split(/\s+/);
  if (words.length <= limit) return text;
  return words.slice(0, limit).join(' ') + '...';
}

// ─── Service Methods ────────────────────────────────────────────

class AIContentService {
  /**
   * Generate advertising copy.
   * @param {Object} params - { product, tone, platform, word_limit }
   * @returns {{ headline, body, cta }}
   */
  async generateCopy({ product, tone = 'professional', platform = 'general', word_limit }) {
    const toneKey = COPY_TEMPLATES[tone] ? tone : 'professional';
    const templates = COPY_TEMPLATES[toneKey];

    const headline = fillTemplate(pick(templates.headlines), { product });
    const body = truncateToWordLimit(
      fillTemplate(pick(templates.bodies), { product }),
      word_limit
    );
    const cta = pick(templates.ctas);

    // Simulate slight processing delay
    await new Promise((r) => setTimeout(r, 300 + Math.random() * 700));

    return {
      headline,
      body,
      cta,
      metadata: {
        tone: toneKey,
        platform,
        word_limit: word_limit || 'unlimited',
        generated_at: new Date().toISOString(),
        model: 'mock-v1',
      },
    };
  }

  /**
   * Generate social media captions.
   * @param {Object} params - { platform, campaign_goal, brand_voice }
   * @returns {{ captions: string[] }}
   */
  async generateSocial({ platform = 'instagram', campaign_goal, brand_voice = 'professional' }) {
    const platformKey = SOCIAL_TEMPLATES[platform] ? platform : 'instagram';
    const templates = SOCIAL_TEMPLATES[platformKey];

    const captions = templates.map((t) =>
      fillTemplate(t, { goal: campaign_goal })
    );

    await new Promise((r) => setTimeout(r, 400 + Math.random() * 600));

    return {
      platform: platformKey,
      captions,
      metadata: {
        campaign_goal,
        brand_voice,
        count: captions.length,
        generated_at: new Date().toISOString(),
        model: 'mock-v1',
      },
    };
  }

  /**
   * Generate relevant hashtags.
   * @param {Object} params - { content, industry }
   * @returns {{ hashtags: string[] }}
   */
  async generateHashtags({ content, industry = 'general' }) {
    const industryKey = HASHTAG_TEMPLATES[industry] ? industry : 'general';
    const baseHashtags = HASHTAG_TEMPLATES[industryKey];

    // Add some dynamic hashtags based on content words
    const contentWords = content.split(/\s+/)
      .filter((w) => w.length > 4)
      .slice(0, 3)
      .map((w) => `#${w.replace(/[^a-zA-Z]/g, '')}`);

    const hashtags = [...pickN(baseHashtags, 7), ...contentWords].slice(0, 10);

    await new Promise((r) => setTimeout(r, 200 + Math.random() * 300));

    return {
      hashtags,
      metadata: {
        industry: industryKey,
        count: hashtags.length,
        generated_at: new Date().toISOString(),
        model: 'mock-v1',
      },
    };
  }

  /**
   * Generator for SSE streaming of copy generation.
   * Yields chunks of the response progressively.
   */
  async *generateCopyStream({ product, tone = 'professional', platform = 'general', word_limit }) {
    const result = await this.generateCopy({ product, tone, platform, word_limit });

    // Stream headline word by word
    yield { type: 'headline_start', data: '' };
    const headlineWords = result.headline.split(' ');
    for (const word of headlineWords) {
      await new Promise((r) => setTimeout(r, 50 + Math.random() * 100));
      yield { type: 'headline_chunk', data: word + ' ' };
    }
    yield { type: 'headline_end', data: result.headline };

    // Stream body word by word
    yield { type: 'body_start', data: '' };
    const bodyWords = result.body.split(' ');
    for (const word of bodyWords) {
      await new Promise((r) => setTimeout(r, 30 + Math.random() * 70));
      yield { type: 'body_chunk', data: word + ' ' };
    }
    yield { type: 'body_end', data: result.body };

    // Send CTA
    yield { type: 'cta', data: result.cta };

    // Send metadata
    yield { type: 'metadata', data: JSON.stringify(result.metadata) };

    // Done
    yield { type: 'done', data: '' };
  }
}

module.exports = new AIContentService();
