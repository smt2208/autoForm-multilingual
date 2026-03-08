"""
Gemini service for form field mapping
"""
from config.settings import settings
from dotenv import load_dotenv
from config.prompts import get_form_mapping_prompt
from utils.logger import logger
from utils.field_processor import post_process_fields
from langchain_google_genai import ChatGoogleGenerativeAI


class GeminiService:
    """Service for Gemini-based form field mapping"""

    def __init__(self):
        """Initialize Google LLM"""
        self.model = None
        self._load_model()
        load_dotenv()

    def _load_model(self) -> None:
        """Load the Google model"""
        try:
            if not settings.GOOGLE_API_KEY or not settings.GOOGLE_API_KEY.strip():
                raise ValueError("Google API key is required")

            logger.info("Loading Google model...")
            self.model = ChatGoogleGenerativeAI(
                model=settings.GOOGLE_MODEL,
                temperature=0.7
            )
            logger.info("Google model loaded successfully")
        except Exception as e:
            logger.error(f"Error loading Google model: {str(e)}")
            raise
    
    def map_text_to_fields(self, transcribed_text: str, fields_json: str) -> dict:
        """
        Map transcribed text to form fields using LLM with structured parsing
        
        Args:
            transcribed_text: The transcribed audio text
            fields_json: JSON string containing form fields structure
            
        Returns:
            Dictionary with mapped field values
        """
        try:
            if self.model is None:
                raise RuntimeError("Model is not initialized")
            
            logger.debug(f"Processing transcription: {transcribed_text[:50]}...")
            
            prompt_template, parser = get_form_mapping_prompt()

            chain = prompt_template | self.model | parser
            
            logger.debug("Invoking LLM chain...")
            parsed_response = chain.invoke({
                "fields_json": fields_json, 
                "transcribed_text": transcribed_text
            })
            
            # Resilient extraction: handle both {"mapped_fields": {...}} and flat {...}
            if isinstance(parsed_response, dict):
                mapped_data = parsed_response.get("mapped_fields", parsed_response)
                # If LLM wrapped it in some other key, try to unwrap
                if len(mapped_data) == 1 and isinstance(list(mapped_data.values())[0], dict):
                    mapped_data = list(mapped_data.values())[0]
            else:
                mapped_data = {}
            
            logger.debug(f"Raw parsed data: {mapped_data}")

            final_data = post_process_fields(mapped_data)
            
            logger.debug(f"Final mapped data: {final_data}")
            return final_data
            
        except Exception as e:
            logger.error(f"Error during field mapping: {str(e)}")
            return {}


# Singleton instance
_gemini_service = None

def get_gemini_service() -> GeminiService:
    global _gemini_service
    if _gemini_service is None:
        _gemini_service = GeminiService()
    return _gemini_service