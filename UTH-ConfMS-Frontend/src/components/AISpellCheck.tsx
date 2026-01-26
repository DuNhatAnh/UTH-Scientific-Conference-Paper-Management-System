import React, { useState } from 'react';
import { checkSpellingAndGrammar, TextCorrection } from '../services/aiSupport';
import { AIBadge } from './AIBadge';

interface AISpellCheckProps {
  text: string;
  userId: string;
  fieldType: 'title' | 'abstract' | 'keywords';
  onApply: (correctedText: string) => void;
}

export const AISpellCheck: React.FC<AISpellCheckProps> = ({ text, userId, fieldType, onApply }) => {
  const [isChecking, setIsChecking] = useState(false);
  const [corrections, setCorrections] = useState<TextCorrection[]>([]);
  const [suggestedText, setSuggestedText] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCheck = async () => {
    if (!text.trim()) {
      setError('Please enter text to check');
      return;
    }

    setIsChecking(true);
    setError(null);

    try {
      const result = await checkSpellingAndGrammar(text, userId, fieldType);
      setCorrections(result.corrections);
      setSuggestedText(result.suggested_text);
      setShowResults(true);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to check spelling');
    } finally {
      setIsChecking(false);
    }
  };

  const handleApply = () => {
    onApply(suggestedText);
    setShowResults(false);
    setCorrections([]);
  };

  const handleDismiss = () => {
    setShowResults(false);
    setCorrections([]);
  };

  return (
    <div className="space-y-4">
      {/* Check Button */}
      <button
        type="button"
        onClick={handleCheck}
        disabled={isChecking || !text.trim()}
        className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
      >
        {isChecking ? (
          <>
            <span className="material-symbols-outlined animate-spin">progress_activity</span>
            <span>Checking...</span>
          </>
        ) : (
          <>
            <span className="material-symbols-outlined">spellcheck</span>
            <span>Check Spelling & Grammar</span>
            <AIBadge size="sm" label="AI" />
          </>
        )}
      </button>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300">
          <div className="flex items-start gap-2">
            <span className="material-symbols-outlined">error</span>
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Results */}
      {showResults && (
        <div className="space-y-4 p-4 bg-purple-50 dark:bg-purple-900/10 border border-purple-200 dark:border-purple-800 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AIBadge label="AI Suggestions" />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {corrections.length} issue{corrections.length !== 1 ? 's' : ''} found
              </span>
            </div>
          </div>

          {/* Corrections List */}
          {corrections.length > 0 ? (
            <div className="space-y-2">
              <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300">Suggested Corrections:</h4>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {corrections.map((correction, index) => (
                  <div
                    key={index}
                    className="p-3 bg-white dark:bg-gray-800 rounded border border-purple-200 dark:border-purple-700"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded text-xs font-mono">
                            {correction.original}
                          </span>
                          <span className="material-symbols-outlined text-sm text-gray-400">arrow_forward</span>
                          <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded text-xs font-mono">
                            {correction.suggested}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400">{correction.explanation}</p>
                        <span className="inline-block px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded text-[10px] font-semibold">
                          {correction.error_type}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
              <span className="material-symbols-outlined">check_circle</span>
              <span className="text-sm">No spelling or grammar issues found!</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-2 border-t border-purple-200 dark:border-purple-700">
            {corrections.length > 0 && (
              <button
                type="button"
                onClick={handleApply}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-semibold"
              >
                Apply All Corrections
              </button>
            )}
            <button
              type="button"
              onClick={handleDismiss}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors text-sm"
            >
              Dismiss
            </button>
          </div>

          {/* Disclaimer */}
          <div className="text-xs text-gray-500 dark:text-gray-400 italic">
            ⚠️ AI suggestions require your review and approval. You are responsible for the final content.
          </div>
        </div>
      )}
    </div>
  );
};
