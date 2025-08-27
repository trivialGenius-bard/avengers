// result-manager.js - Analyzes AI results against thresholds

/**
 * Result Manager - Compares confidence scores with thresholds
 * @param {Object} results - Analysis results from AI models
 * @param {Object} aiSettings - Settings including thresholds
 * @returns {Object} Match results with explanations
 */
export function analyzeResults(results, aiSettings) {
  const thresholds = aiSettings.thresholds || {
    sarcasm: 0.5,
    detoxify: 0.3,
    depression: 0.4,
    zeroshot: 0.6
  };

  const analysis = {
    overall: { match: true, reasons: [] },
    models: {}
  };

  // Analyze sarcasm detection
  if (results.sarcasm && aiSettings.sarcasm) {
    const confidence = results.sarcasm.confidence;
    const threshold = thresholds.sarcasm;
    const match = confidence >= threshold;
    
    analysis.models.sarcasm = {
      match,
      confidence,
      threshold,
      reason: match 
        ? `Sarcasm detected with ${(confidence * 100).toFixed(1)}% confidence (threshold: ${(threshold * 100).toFixed(1)}%)`
        : `Sarcasm confidence ${(confidence * 100).toFixed(1)}% below threshold ${(threshold * 100).toFixed(1)}%`
    };

    if (match) {
      analysis.overall.reasons.push(`High sarcasm detected (${(confidence * 100).toFixed(1)}%)`);
    }
  }

  // Analyze toxicity detection
  if (results.detoxify && aiSettings.detoxify) {
    const toxicity = results.detoxify.toxicity;
    const threshold = thresholds.detoxify;
    const match = toxicity >= threshold;
    
    analysis.models.detoxify = {
      match,
      confidence: toxicity,
      threshold,
      reason: match
        ? `Toxic content detected with ${(toxicity * 100).toFixed(1)}% toxicity (threshold: ${(threshold * 100).toFixed(1)}%)`
        : `Toxicity level ${(toxicity * 100).toFixed(1)}% below threshold ${(threshold * 100).toFixed(1)}%`
    };

    if (match) {
      analysis.overall.reasons.push(`High toxicity detected (${(toxicity * 100).toFixed(1)}%)`);
    }
  }

  // Analyze depression detection
  if (results.depression && aiSettings.depression) {
    const confidence = results.depression.confidence;
    const threshold = thresholds.depression;
    const match = confidence >= threshold;
    
    analysis.models.depression = {
      match,
      confidence,
      threshold,
      reason: match
        ? `Depression indicators detected with ${(confidence * 100).toFixed(1)}% confidence (threshold: ${(threshold * 100).toFixed(1)}%)`
        : `Depression confidence ${(confidence * 100).toFixed(1)}% below threshold ${(threshold * 100).toFixed(1)}%`
    };

    if (match) {
      analysis.overall.reasons.push(`Depression indicators detected (${(confidence * 100).toFixed(1)}%)`);
    }
  }

  // Analyze zero-shot classification
  if (results.zeroshot && aiSettings.zeroshot) {
    const maxScore = Math.max(...results.zeroshot.scores);
    const threshold = thresholds.zeroshot;
    const match = maxScore >= threshold;
    const topLabel = results.zeroshot.labels[results.zeroshot.scores.indexOf(maxScore)];
    
    analysis.models.zeroshot = {
      match,
      confidence: maxScore,
      threshold,
      topLabel,
      reason: match
        ? `High confidence classification: "${topLabel}" (${(maxScore * 100).toFixed(1)}%, threshold: ${(threshold * 100).toFixed(1)}%)`
        : `Top classification "${topLabel}" confidence ${(maxScore * 100).toFixed(1)}% below threshold ${(threshold * 100).toFixed(1)}%`
    };

    if (match) {
      analysis.overall.reasons.push(`Strong classification: ${topLabel} (${(maxScore * 100).toFixed(1)}%)`);
    }
  }

  // Overall assessment
  const anyMatch = Object.values(analysis.models).some(model => model.match);
  analysis.overall.match = anyMatch;
  
  if (!anyMatch && analysis.overall.reasons.length === 0) {
    analysis.overall.reasons.push("All models below threshold - content appears normal");
  }

  return analysis;
}

/**
 * Simple threshold checker for individual results
 * @param {number} confidence - Confidence score (0-1)
 * @param {number} threshold - Threshold value (0-1)
 * @param {string} modelName - Name of the model
 * @returns {Object} Match result with reason
 */
export function checkThreshold(confidence, threshold, modelName) {
  const match = confidence >= threshold;
  
  return {
    match,
    reason: match
      ? `${modelName} confidence ${(confidence * 100).toFixed(1)}% exceeds threshold ${(threshold * 100).toFixed(1)}%`
      : `${modelName} confidence ${(confidence * 100).toFixed(1)}% below threshold ${(threshold * 100).toFixed(1)}%`
  };
}