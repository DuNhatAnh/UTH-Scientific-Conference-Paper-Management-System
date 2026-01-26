"""
Author AI Services
Provides AI assistance for authors during paper submission
Focus: Vietnamese spell checking and keyword extraction
"""

import re
from typing import List, Dict
from collections import Counter
import nltk
from sklearn.feature_extraction.text import TfidfVectorizer
import numpy as np
from groq import Groq

from models import (
    SpellCheckRequest, SpellCheckResponse, TextCorrection,
    PolishRequest, PolishResponse,
    KeywordSuggestionRequest, KeywordSuggestionResponse,
    AIFeature, UserRole
)
from config import settings
from audit_logging import audit_logger


class AuthorAIService:
    """AI service for author support - Vietnamese spell checking and keyword extraction"""
    
    def __init__(self):
        self.vietnamese_dict = self._build_dictionary()
        self.vietnamese_stopwords = self._build_vietnamese_stopwords()
        
        # Initialize Groq client if API key is available
        self.groq_client = None
        if settings.GROQ_API_KEY and settings.GROQ_API_KEY != "your_groq_api_key_here":
            try:
                self.groq_client = Groq(api_key=settings.GROQ_API_KEY)
            except Exception as e:
                print(f"Warning: Failed to initialize Groq client: {e}")
                self.groq_client = None
    
    def _build_vietnamese_stopwords(self) -> set:
        """Build Vietnamese stopwords set"""
        stopwords_vi = {
            # Đại từ
            'tôi', 'bạn', 'anh', 'chị', 'em', 'họ', 'chúng', 'ta', 'mình',
            # Liên từ
            'và', 'hoặc', 'nhưng', 'mà', 'hay', 'còn', 'cũng', 'vì', 'do',
            # Giới từ
            'của', 'cho', 'với', 'từ', 'trong', 'ngoài', 'trên', 'dưới', 'về',
            'đến', 'tại', 'qua', 'theo', 'bằng', 'để', 'khi', 'sau', 'trước',
            # Trợ từ
            'là', 'được', 'có', 'không', 'đã', 'sẽ', 'đang', 'vẫn', 'còn',
            'thì', 'nếu', 'như', 'bởi', 'nên', 'rằng', 'mỗi', 'các', 'này',
            'đó', 'kia', 'nào', 'gì', 'ai', 'đâu', 'thế', 'nào',
            # Động từ phổ biến
            'làm', 'đi', 'đến', 'ra', 'vào', 'lên', 'xuống', 'về', 'qua',
            # Số từ
            'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín',
            'mười', 'trăm', 'nghìn', 'triệu', 'tỷ',
            # English common words
            'the', 'and', 'for', 'this', 'that', 'with', 'from', 'are', 'was',
            'were', 'been', 'have', 'has', 'had', 'can', 'will', 'would', 'could'
        }
        return stopwords_vi
    
    def _build_dictionary(self) -> Dict[str, str]:
        """Build Vietnamese dictionary: no-diacritics -> correct form"""
        correct_words = [
            # Từ học thuật phổ biến
            'bài', 'báo', 'cáo', 'này', 'nay', 'trình', 'bày', 'kết', 'quả',
            'nghiên', 'cứu', 'phương', 'pháp', 'về', 'sử', 'dụng', 'công', 'nghệ',
            'thông', 'tin', 'giáo', 'dục', 'hệ', 'thống', 'dữ', 'liệu',
            'phân', 'tích', 'đánh', 'giá', 'thiết', 'kế', 'phát', 'triển',
            'nghiệp', 'sinh', 'viên', 'giảng', 'môn', 'học', 'khoa',
            'đề', 'tài', 'liệu', 'chuyên', 'mục', 'tiêu', 'yêu', 'cầu',
            'thực', 'hiện', 'ứng', 'dụng', 'giải', 'pháp', 'vấn', 'đề',
            
            # Đại từ và liên từ
            'tôi', 'tui', 'chúng', 'chung', 'anh', 'chị', 'em',
            'khi', 'được', 'các', 'cho', 'của', 'từ', 'với', 'và',
            'có', 'không', 'là', 'đã', 'sẽ', 'để', 'theo', 'nhưng',
            'mà', 'nếu', 'thì', 'cũng', 'đến', 'trong', 'trên', 'tại',
            'sau', 'trước', 'đây', 'đó', 'người', 'năm', 'ngày', 'thời',
            
            # Động từ phổ biến
            'thập', 'làm', 'việc', 'đào', 'tạo', 'gian', 
            'liên', 'quan', 'hệ', 'thứ', 'kiểm', 'tra',
            
            # Từ về địa danh
            'nước', 'thế', 'giới', 'quốc', 'tế', 'Hồ', 'Chí', 'Minh',
            'Hà', 'Nội', 'Đà', 'Nẵng', 'Cần', 'Thơ', 'Huế', 'Hải', 'Phòng',
            
            # Từ chính trị - kinh tế - xã hội
            'chính', 'trị', 'kinh', 'tế', 'xã', 'hội', 'văn', 'hóa',
            'khách', 'hàng', 'sản', 'phẩm', 'dịch', 'vụ', 'quản', 'lý',
            
            # Từ về tổ chức
            'tổ', 'chức', 'doanh', 'công', 'ty', 'cơ', 'quan', 'đơn', 'vị',
            'địa', 'điểm', 'vị', 'trí', 'khu', 'vực', 'miền', 'tỉnh', 'thành',
            'phố', 'thị', 'trường', 'trường', 'lớp', 'trường', 'hợp',
            
            # Từ mô tả
            'hình', 'thức', 'loại', 'kiểu', 'mẫu', 'số', 'lượng',
            'chất', 'lượng', 'tiêu', 'chuẩn', 'quy', 'định', 'luật', 'pháp',
            
            # Từ về vai trò
            'quyền', 'lợi', 'nghĩa', 'vụ', 'trách', 'nhiệm', 'ủy', 'ban',
            'hội', 'đồng', 'đại', 'biểu', 'ủy', 'viên', 'chủ', 'tịch',
            'phó', 'ký', 'kế', 'toán', 'giám', 'đốc', 'hiệu', 'trưởng',
            
            # Từ công nghệ
            'máy', 'tính', 'điện', 'thoại', 'mạng', 'internet', 'website',
            'email', 'phần', 'mềm', 'cứng', 'lập', 'trình', 'chương', 'trình',
            'tệp', 'tin', 'dữ', 'liệu', 'cơ', 'sở', 'bảng', 'trường', 'bản', 'ghi',
            
            # Từ về hệ thống
            'giao', 'diện', 'người', 'dùng', 'đăng', 'nhập', 'đăng', 'ký',
            'tài', 'khoản', 'mật', 'khẩu', 'bảo', 'mật', 'an', 'toàn',
            'sao', 'lưu', 'phục', 'hồi', 'cập', 'nhật', 'nâng', 'cấp',
            
            # Từ về hành động
            'khởi', 'động', 'tắt', 'khởi', 'chạy', 'dừng', 'tạm', 'dừng',
            'kết', 'nối', 'ngắt', 'tải', 'lên', 'xuống', 'gửi', 'nhận',
            'mở', 'đóng', 'lưu', 'xóa', 'sửa', 'thêm', 'bớt', 'tìm', 'kiếm',
            'tìm', 'tra', 'cứu', 'tra', 'tìm', 'xem', 'đọc', 'viết', 'in',
            'chỉnh', 'sửa', 'điều', 'chỉnh', 'thay', 'đổi', 'cải', 'tiến',
            
            # Từ về quy trình
            'nộp', 'gửi', 'nhận', 'duyệt', 'phê', 'duyệt', 'từ', 'chối',
            'chấp', 'nhận', 'đồng', 'ý', 'hủy', 'bỏ', 'hủy', 'hoàn', 'thành',
            'hoàn', 'tất', 'kết', 'thúc', 'bắt', 'đầu', 'khởi', 'đầu',
        ]
        
        viet_dict = {}
        for word in correct_words:
            key = self._remove_diacritics(word).lower()
            if key != word.lower():
                viet_dict[key] = word
        
        return viet_dict
    
    def _remove_diacritics(self, text: str) -> str:
        """Remove all Vietnamese diacritics"""
        replacements = {
            'à': 'a', 'á': 'a', 'ả': 'a', 'ã': 'a', 'ạ': 'a',
            'ă': 'a', 'ằ': 'a', 'ắ': 'a', 'ẳ': 'a', 'ẵ': 'a', 'ặ': 'a',
            'â': 'a', 'ầ': 'a', 'ấ': 'a', 'ẩ': 'a', 'ẫ': 'a', 'ậ': 'a',
            'è': 'e', 'é': 'e', 'ẻ': 'e', 'ẽ': 'e', 'ẹ': 'e',
            'ê': 'e', 'ề': 'e', 'ế': 'e', 'ể': 'e', 'ễ': 'e', 'ệ': 'e',
            'ì': 'i', 'í': 'i', 'ỉ': 'i', 'ĩ': 'i', 'ị': 'i',
            'ò': 'o', 'ó': 'o', 'ỏ': 'o', 'õ': 'o', 'ọ': 'o',
            'ô': 'o', 'ồ': 'o', 'ố': 'o', 'ổ': 'o', 'ỗ': 'o', 'ộ': 'o',
            'ơ': 'o', 'ờ': 'o', 'ớ': 'o', 'ở': 'o', 'ỡ': 'o', 'ợ': 'o',
            'ù': 'u', 'ú': 'u', 'ủ': 'u', 'ũ': 'u', 'ụ': 'u',
            'ư': 'u', 'ừ': 'u', 'ứ': 'u', 'ử': 'u', 'ữ': 'u', 'ự': 'u',
            'ỳ': 'y', 'ý': 'y', 'ỷ': 'y', 'ỹ': 'y', 'ỵ': 'y',
            'đ': 'd', 'Đ': 'D',
        }
        return ''.join(replacements.get(c, c) for c in text)
    
    def _check_vietnamese_spelling(self, text: str) -> List[TextCorrection]:
        """Check Vietnamese spelling using regex word boundaries"""
        corrections = []
        
        # 1. Check common academic phrases FIRST (bigram priority)
        phrase_dict = {
            'bai bao': 'bài báo',  # scientific paper (NOT "báo cáo")
            'nghien cuu': 'nghiên cứu',
            'phuong phap': 'phương pháp',
            'ket qua': 'kết quả',
            'du lieu': 'dữ liệu',
            'phan tich': 'phân tích',
            'thac si': 'thạc sĩ',
            'tien si': 'tiến sĩ',
        }
        
        for no_dia, correct in phrase_dict.items():
            phrase_pattern = r'\b' + no_dia.replace(' ', r'\s+') + r'\b'
            for match in re.finditer(phrase_pattern, text, re.IGNORECASE):
                original = match.group()
                if original.lower() != correct.lower():
                    corrections.append(TextCorrection(
                        original=original,
                        suggested=correct if original[0].islower() else correct.capitalize(),
                        position=match.start(),
                        error_type="phrase",
                        explanation=f"Cụm từ học thuật thiếu dấu"
                    ))
        
        # 2. Check single words (skip positions already corrected)
        corrected_ranges = [(c.position, c.position + len(c.original)) for c in corrections]
        
        # Match Vietnamese words (3+ chars only to avoid false positives)
        pattern = r'\b[a-zA-ZàáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđĐ]{3,}\b'
        
        for match in re.finditer(pattern, text):
            word = match.group()
            position = match.start()
            
            # Skip if overlaps with phrase correction
            if any(start <= position < end for start, end in corrected_ranges):
                continue
            
            # Check dictionary
            word_no_dia = self._remove_diacritics(word).lower()
            
            if word_no_dia in self.vietnamese_dict:
                correct = self.vietnamese_dict[word_no_dia]
                
                # Preserve capitalization
                if word[0].isupper():
                    correct = correct.capitalize()
                
                if word != correct:
                    corrections.append(TextCorrection(
                        original=word,
                        suggested=correct,
                        position=position,
                        error_type="spelling",
                        explanation=f"Thiếu dấu tiếng Việt"
                    ))
        
        return corrections
    
    def _check_contextual_errors_with_ai(self, text: str) -> List[TextCorrection]:
        """Use Groq AI to detect contextual errors (e.g., 'moi' vs 'mới')"""
        corrections = []
        
        if not self.groq_client:
            return corrections
        
        try:
            prompt = f"""Bạn là chuyên gia tiếng Việt chuyên về văn bản KHOA HỌC/HỌC THUẬT.
            
NGỮ CẢNH: Đây là văn bản trong hệ thống quản lý BÀI BÁO KHOA HỌC (scientific paper/conference paper).

Tìm LỖI NGỮ CẢNH (ví dụ: "phương pháp moi" → "phương pháp mới", "bai bao" → "bài báo").

LƯU Ý:
- "bài báo" = scientific paper (ĐÚNG)
- "bài bảo" hoặc "báo cáo" = report (SAI trong ngữ cảnh này)
- Chỉ sửa từ SAI RÕ RÀNG, không sửa từ đúng ngữ pháp

CHỈ TRẢ VỀ JSON:
{{"errors": [{{"original": "từ sai", "correct": "từ đúng", "context": "ngữ cảnh"}}]}}

Nếu không có lỗi: {{"errors": []}}

Văn bản:
{text}"""

            response = self.groq_client.chat.completions.create(
                messages=[
                    {"role": "system", "content": "Bạn là chuyên gia kiểm tra tiếng Việt. Chỉ trả về JSON."},
                    {"role": "user", "content": prompt}
                ],
                model=settings.GROQ_MODEL,
                temperature=0.3,
                max_tokens=500,
            )
            
            result_text = response.choices[0].message.content.strip()
            
            # Parse JSON response
            import json
            import re
            
            # Extract JSON from markdown code blocks if present
            json_match = re.search(r'```(?:json)?\s*(\{.*?\})\s*```', result_text, re.DOTALL)
            if json_match:
                result_text = json_match.group(1)
            
            result = json.loads(result_text)
            
            if "errors" in result and isinstance(result["errors"], list):
                for error in result["errors"]:
                    original = error.get("original", "")
                    correct = error.get("correct", "")
                    context = error.get("context", "")
                    
                    if original and correct and original != correct:
                        # Find position in text
                        position = text.find(original)
                        if position >= 0:
                            corrections.append(TextCorrection(
                                original=original,
                                suggested=correct,
                                position=position,
                                error_type="contextual",
                                explanation=f"Lỗi ngữ cảnh: {context[:50]}"
                            ))
        
        except Exception as e:
            # Silently fail, don't break spell checking
            print(f"AI contextual check error: {e}")
        
        return corrections
    
    def spell_and_grammar_check(self, request: SpellCheckRequest) -> SpellCheckResponse:
        """Check Vietnamese spelling + AI contextual errors"""
        if not settings.ENABLE_AUTHOR_SPELLCHECK:
            audit_logger.log_feature_disabled(request.user_id, AIFeature.AUTHOR_SPELLCHECK)
            raise ValueError("Spell check feature is disabled")
        
        original_text = request.text
        
        # 1. Dictionary-based spelling check
        corrections = self._check_vietnamese_spelling(original_text)
        
        # 2. AI-powered contextual check (if available)
        ai_corrections = self._check_contextual_errors_with_ai(original_text)
        
        # Merge corrections (avoid duplicates)
        existing_positions = {c.position for c in corrections}
        for ai_corr in ai_corrections:
            if ai_corr.position not in existing_positions:
                corrections.append(ai_corr)
        
        # Apply corrections
        suggested_text = original_text
        if corrections:
            for corr in sorted(corrections, key=lambda x: x.position, reverse=True):
                suggested_text = (
                    suggested_text[:corr.position] +
                    corr.suggested +
                    suggested_text[corr.position + len(corr.original):]
                )
        
        # Log operation
        audit_logger.log_ai_operation(
            user_id=request.user_id,
            user_role=UserRole.AUTHOR,
            feature=AIFeature.AUTHOR_SPELLCHECK,
            input_text=original_text,
            output_data={
                "corrections_count": len(corrections),
                "dict_corrections": len(corrections) - len(ai_corrections),
                "ai_corrections": len(ai_corrections)
            },
            applied=False,
            metadata={"field_type": request.field_type}
        )
        
        return SpellCheckResponse(
            original_text=original_text,
            suggested_text=suggested_text,
            corrections=corrections,
            applied=False
        )
    
    def polish_abstract(self, request: PolishRequest) -> PolishResponse:
        """Polish abstract using Groq AI"""
        if not settings.ENABLE_AUTHOR_ABSTRACT_POLISHING:
            audit_logger.log_feature_disabled(request.user_id, AIFeature.AUTHOR_POLISH)
            raise ValueError("Polish feature is disabled")
        
        # Check if Groq is available
        if not self.groq_client:
            # Fallback: return original text
            audit_logger.log_ai_operation(
                user_id=request.user_id,
                user_role=UserRole.AUTHOR,
                feature=AIFeature.AUTHOR_POLISH,
                input_text=request.abstract,
                output_data={"polished": False, "method": "fallback", "reason": "Groq API not configured"},
                applied=False,
                metadata={}
            )
            
            return PolishResponse(
                original_abstract=request.abstract,
                polished_abstract=request.abstract,
                improvements=[],
                applied=False
            )
        
        try:
            # Create prompt for Groq
            prompt = f"""Bạn là một chuyên gia viết bài báo khoa học. Hãy cải thiện đoạn văn sau để phù hợp với phong cách học thuật (academic writing), giữ nguyên ý nghĩa nhưng làm cho văn phong chuyên nghiệp hơn.

Yêu cầu:
- Giữ nguyên ngôn ngữ gốc (tiếng Việt hoặc tiếng Anh)
- Sửa lỗi ngữ pháp nếu có
- Cải thiện cấu trúc câu cho rõ ràng hơn
- Dùng từ ngữ học thuật phù hợp
- KHÔNG thêm hoặc bớt thông tin
- CHỈ trả về văn bản đã chỉnh sửa, KHÔNG giải thích

Văn bản gốc:
{request.abstract}

Văn bản đã cải thiện:"""

            # Call Groq API
            chat_completion = self.groq_client.chat.completions.create(
                messages=[
                    {
                        "role": "system",
                        "content": "Bạn là chuyên gia viết bài báo khoa học, giúp tác giả cải thiện văn phong academic."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                model=settings.GROQ_MODEL,
                temperature=settings.GROQ_TEMPERATURE,
                max_tokens=settings.GROQ_MAX_TOKENS,
            )
            
            polished_text = chat_completion.choices[0].message.content.strip()
            
            # Basic improvements detection (compare lengths, word changes)
            improvements = []
            if len(polished_text) != len(request.abstract):
                improvements.append("Cấu trúc câu được cải thiện")
            if polished_text != request.abstract:
                improvements.append("Văn phong academic được nâng cao")
            
            # Log operation
            audit_logger.log_ai_operation(
                user_id=request.user_id,
                user_role=UserRole.AUTHOR,
                feature=AIFeature.AUTHOR_POLISH,
                input_text=request.abstract,
                output_data={
                    "polished": True,
                    "method": "groq",
                    "model": settings.GROQ_MODEL,
                    "improvements_count": len(improvements)
                },
                applied=False,
                metadata={}
            )
            
            return PolishResponse(
                original_abstract=request.abstract,
                polished_abstract=polished_text,
                improvements=improvements,
                applied=False
            )
            
        except Exception as e:
            # Fallback on error
            audit_logger.log_ai_operation(
                user_id=request.user_id,
                user_role=UserRole.AUTHOR,
                feature=AIFeature.AUTHOR_POLISH,
                input_text=request.abstract,
                output_data={"polished": False, "method": "error", "error": str(e)},
                applied=False,
                metadata={}
            )
            
            return PolishResponse(
                original_abstract=request.abstract,
                polished_abstract=request.abstract,
                improvements=[],
                applied=False
            )
    
    def suggest_keywords(self, request: KeywordSuggestionRequest) -> KeywordSuggestionResponse:
        """Extract keywords using TF-IDF"""
        if not settings.ENABLE_AUTHOR_KEYWORD_SUGGESTION:
            audit_logger.log_feature_disabled(request.user_id, AIFeature.AUTHOR_KEYWORDS)
            raise ValueError("Keywords feature is disabled")
        
        try:
            # Clean and tokenize text
            text = request.abstract.lower()
            
            # Extract words (Vietnamese + English, min 3 chars)
            words = re.findall(
                r'\b[a-zA-ZàáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđĐ]{3,}\b',
                text
            )
            
            # Filter stopwords
            filtered_words = [w for w in words if w not in self.vietnamese_stopwords]
            
            # Need at least 5 words for TF-IDF
            if len(filtered_words) < 5:
                keywords = list(set(filtered_words))[:5]
            else:
                # Use TF-IDF for keyword extraction
                # Create a "corpus" from the single document by treating sentences as documents
                sentences = re.split(r'[.!?;]\s+', request.abstract)
                sentences = [s for s in sentences if len(s.strip()) > 10]
                
                if len(sentences) >= 2:
                    # TF-IDF across sentences
                    vectorizer = TfidfVectorizer(
                        max_features=20,
                        ngram_range=(1, 2),  # Unigrams and bigrams
                        min_df=1,
                        token_pattern=r'\b[a-zA-ZàáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđĐ]{3,}\b'
                    )
                    
                    tfidf_matrix = vectorizer.fit_transform(sentences)
                    feature_names = vectorizer.get_feature_names_out()
                    
                    # Get average TF-IDF score across all sentences
                    avg_scores = np.asarray(tfidf_matrix.mean(axis=0)).ravel()
                    
                    # Get top keywords
                    top_indices = avg_scores.argsort()[-15:][::-1]
                    candidate_keywords = [feature_names[i] for i in top_indices]
                    
                    # Filter stopwords and short words
                    keywords = []
                    for kw in candidate_keywords:
                        # Check if any word in the keyword is a stopword
                        kw_words = kw.split()
                        if not any(w in self.vietnamese_stopwords for w in kw_words):
                            keywords.append(kw)
                        
                        if len(keywords) >= 10:
                            break
                else:
                    # Fallback to word frequency
                    freq = Counter(filtered_words)
                    keywords = [word for word, count in freq.most_common(10)]
            
            # Limit to max 10 keywords
            keywords = keywords[:10]
            
            # Create confidence scores (TF-IDF scores normalized)
            confidence_scores = {}
            if len(sentences) >= 2 and len(keywords) > 0:
                for kw in keywords:
                    # Find keyword index in feature names
                    try:
                        idx = list(feature_names).index(kw)
                        confidence_scores[kw] = float(avg_scores[idx])
                    except:
                        confidence_scores[kw] = 0.5
            else:
                # Frequency-based confidence
                for kw in keywords:
                    confidence_scores[kw] = 0.7
            
            audit_logger.log_ai_operation(
                user_id=request.user_id,
                user_role=UserRole.AUTHOR,
                feature=AIFeature.AUTHOR_KEYWORDS,
                input_text=request.abstract,
                output_data={"keywords_count": len(keywords), "method": "tfidf"},
                applied=False,
                metadata={}
            )
            
            return KeywordSuggestionResponse(
                original_keywords=request.existing_keywords,
                suggested_keywords=keywords,
                confidence_scores=confidence_scores,
                applied=False
            )
            
        except Exception as e:
            # Fallback to simple word frequency if TF-IDF fails
            words = re.findall(
                r'\b[a-zA-ZàáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđĐ]{4,}\b',
                request.abstract.lower()
            )
            filtered = [w for w in words if w not in self.vietnamese_stopwords]
            freq = Counter(filtered)
            keywords = [word for word, count in freq.most_common(10)][:5]
            
            # Simple confidence based on frequency
            confidence_scores = {kw: 0.6 for kw in keywords}
            
            audit_logger.log_ai_operation(
                user_id=request.user_id,
                user_role=UserRole.AUTHOR,
                feature=AIFeature.AUTHOR_KEYWORDS,
                input_text=request.abstract,
                output_data={"keywords_count": len(keywords), "method": "fallback", "error": str(e)},
                applied=False,
                metadata={}
            )
            
            return KeywordSuggestionResponse(
                original_keywords=request.existing_keywords,
                suggested_keywords=keywords,
                confidence_scores=confidence_scores,
                applied=False
            )


# Create service instance
author_service = AuthorAIService()
