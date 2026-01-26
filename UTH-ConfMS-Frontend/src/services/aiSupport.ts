import apiClient from './apiClient';

// ==================== TYPES ====================
export interface TextCorrection {
  original: string;
  suggested: string;
  position: number;
  error_type: string;
  explanation: string;
}

export interface SpellCheckResponse {
  original_text: string;
  suggested_text: string;
  corrections: TextCorrection[];
  applied: boolean;
}

export interface PolishResponse {
  original_text: string;
  polished_text: string;
  improvements: string[];
  applied: boolean;
}

export interface KeywordSuggestionResponse {
  original_keywords: string[];
  suggested_keywords: string[];
  relevance_scores: Record<string, number>;
  applied: boolean;
}

export interface ReviewerSummaryResponse {
  summary: string;
  key_points: string[];
  word_count: number;
  applied: boolean;
}

export interface SimilarityResponse {
  similarity_score: number;
  matching_topics: string[];
  recommendation: string;
  applied: boolean;
}

export interface EmailTemplateResponse {
  template_type: string;
  subject: string;
  body: string;
  placeholders: string[];
  warnings: string[];
  applied: boolean;
}

// ==================== AUTHOR SERVICES ====================

/**
 * Check spelling and grammar for paper text
 * Returns suggestions that user must explicitly approve
 */
export const checkSpellingAndGrammar = async (
  text: string,
  userId: string,
  fieldType: 'title' | 'abstract' | 'keywords'
): Promise<SpellCheckResponse> => {
  const response = await apiClient.post('/api/ai/author/spellcheck', {
    text,
    user_id: userId,
    field_type: fieldType
  });
  return response.data;
};

/**
 * Polish abstract text for better academic writing
 */
export const polishAbstract = async (
  text: string,
  userId: string,
  fieldType: 'abstract' | 'introduction' = 'abstract'
): Promise<PolishResponse> => {
  const response = await apiClient.post('/api/ai/author/polish', {
    text,
    user_id: userId,
    field_type: fieldType
  });
  return response.data;
};

/**
 * Suggest keywords based on paper content
 */
export const suggestKeywords = async (
  text: string,
  currentKeywords: string[],
  userId: string,
  maxKeywords: number = 10
): Promise<KeywordSuggestionResponse> => {
  const response = await apiClient.post('/api/ai/author/keywords', {
    text,
    current_keywords: currentKeywords,
    user_id: userId,
    max_keywords: maxKeywords
  });
  return response.data;
};

// ==================== REVIEWER SERVICES ====================

/**
 * Generate neutral summary of paper for reviewers
 * Preserves double-blind review - no author info
 */
export const generatePaperSummary = async (
  paperContent: string,
  userId: string,
  maxLength: number = 250
): Promise<ReviewerSummaryResponse> => {
  const response = await apiClient.post('/api/ai/reviewer/summary', {
    paper_content: paperContent,
    user_id: userId,
    max_length: maxLength
  });
  return response.data;
};

/**
 * Calculate similarity between reviewer expertise and paper topics
 */
export const calculateReviewerSimilarity = async (
  reviewerExpertise: string[],
  paperKeywords: string[],
  userId: string
): Promise<SimilarityResponse> => {
  const response = await apiClient.post('/api/ai/reviewer/similarity', {
    reviewer_expertise: reviewerExpertise,
    paper_keywords: paperKeywords,
    user_id: userId
  });
  return response.data;
};

// ==================== CHAIR SERVICES ====================

/**
 * Generate email template for conference chairs
 */
export const generateEmailTemplate = async (
  templateType: 'invitation' | 'reminder' | 'acceptance' | 'rejection' | 'general',
  userId: string,
  context?: Record<string, string>
): Promise<EmailTemplateResponse> => {
  const response = await apiClient.post('/api/ai/chair/email-template', {
    template_type: templateType,
    user_id: userId,
    context: context || {}
  });
  return response.data;
};

// ==================== FEATURE STATUS ====================

export interface AIFeatureStatus {
  author_features: {
    spellcheck: boolean;
    abstract_polishing: boolean;
    keyword_suggestion: boolean;
  };
  reviewer_features: {
    summary: boolean;
    key_points: boolean;
    similarity: boolean;
  };
  chair_features: {
    email_templates: boolean;
  };
  audit_logging: boolean;
}

/**
 * Get current AI feature status
 */
export const getAIFeatureStatus = async (): Promise<AIFeatureStatus> => {
  const response = await apiClient.get('/api/ai/features');
  return response.data;
};

// ==================== LEGACY SUPPORT (Keep for compatibility) ====================

// export const checkPlagiarism = async (file: File) => {
//   // TODO: Implement plagiarism checking if needed
//   return {
//     score: 0,
//     flagged: false,
//     reportUrl: '#'
//   };
// };

export const generateReviewSummary = async (reviews: string[]) => {
  // Use the new AI service for review summary
  const combinedReviews = reviews.join('\n\n---\n\n');
  // This would need a logged-in user ID in real usage
  return await generatePaperSummary(combinedReviews, 'current-user', 250);
};
