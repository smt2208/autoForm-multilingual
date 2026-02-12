"""
OpenAI service for form field mapping
"""
from config.settings import settings
from dotenv import load_dotenv
from config.prompts import get_form_mapping_prompt
from utils.logger import logger
from utils.field_processor import post_process_fields
from langchain_openai import ChatOpenAI


class OpenAIService:
    """Service for OpenAI-based form field mapping"""

    def __init__(self):
        """Initialize OpenAI LLM"""
        self.model = None
        self._load_model()
        load_dotenv()

    def _load_model(self) -> None:
        """Load the OpenAI model"""
        try:
            if not settings.OPENAI_API_KEY or not settings.OPENAI_API_KEY.strip():
                raise ValueError("OpenAI API key is required")

            logger.info("Loading OpenAI model...")
            self.model = ChatOpenAI(
                model=settings.OPENAI_MODEL,
                temperature=0.2
            )
            logger.info("OpenAI model loaded successfully")
        except Exception as e:
            logger.error(f"Error loading OpenAI model: {str(e)}")
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
            
            logger.info(f"Processing transcription: {transcribed_text[:50]}...")
            
            prompt_template, parser = get_form_mapping_prompt()

            chain = prompt_template | self.model | parser
            
            logger.info("Triggering the chain...")
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
            
            logger.info(f"Raw parsed data: {mapped_data}")

            final_data = post_process_fields(mapped_data)
            
            logger.info(f"Final Mapped Data: {final_data}")
            return final_data
            
        except Exception as e:
            logger.error(f"Error during field mapping: {str(e)}")
            return {}


# Singleton instance
_openai_service = None

def get_openai_service() -> OpenAIService:
    global _openai_service
    if _openai_service is None:
        _openai_service = OpenAIService()
    return _openai_service