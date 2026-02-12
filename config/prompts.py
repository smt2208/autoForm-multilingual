"""
Prompt templates for form field mapping
"""
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import JsonOutputParser
from models.models import FormFieldMapping


def get_form_mapping_prompt() -> tuple[PromptTemplate, JsonOutputParser]:
    """
    Get the prompt template for form field mapping
    
    Returns:
        Tuple of (PromptTemplate, JsonOutputParser)
    """
    parser = JsonOutputParser(pydantic_object=FormFieldMapping)
    
    prompt_template = PromptTemplate(
        template="""You are an intelligent form-filling assistant. Extract information from the user's voice input and map it to the form fields. You must intelligently correct spelling errors, mishears, typos, and common mistakes in the transcription. Analyze each form field carefully and use context from field labels, types, and common patterns to make smart corrections.

                FORM FIELDS:
                {fields_json}

                USER'S SPEECH (RAW TRANSCRIPTION):
                "{transcribed_text}"

                INSTRUCTIONS:
                1. FIRST, analyze each form field:
                   - Look at the field label, type, and any placeholder text
                   - Determine what type of data it expects (name, email, phone, address, etc.)
                   - Consider common variations and misspellings for that field type

                2. CORRECT TRANSCRIPTION ERRORS:
                   - Fix obvious spelling mistakes: "jon" -> "John", "smoth" -> "Smith", "gmial" -> "gmail"
                   - Correct speech recognition errors: "at the rate" -> "@", "dot com" -> ".com", "won too three" -> "123"
                   - Handle homophones and similar sounding words using field context
                   - Fix common typos in names, addresses, emails, etc.

                3. INTELLIGENT MAPPING:
                   - Match user intent to correct field ID based on context
                   - If user says "name", map to appropriate name field (firstName, lastName, fullName)
                   - Use field labels to disambiguate (e.g., "billing address" vs "shipping address")

                4. DATA FORMATTING BY FIELD TYPE:
                   - NAMES: Capitalize properly, correct spellings (e.g., "jon doe" -> "John Doe")
                   - EMAILS: Lowercase, fix domains (e.g., "john at yahoo dot com" -> "john@yahoo.com")
                   - PHONES: Extract digits only, correct common formats
                   - ADDRESSES: Correct street types, city names, state abbreviations
                   - DATES: Convert to YYYY-MM-DD using ENGLISH digits ONLY (0-9), NEVER use non-Latin digits. Handle various formats.
                   - RADIO BUTTONS: Output the EXACT option label text from the "options" array (e.g., "Male", "Female", "BNS"). These are predefined values — always use the EXACT English text as given, even if the user spoke in Bengali/Hindi.
                   - CHECKBOXES: "true" for yes/agree/check, "false" for no/disagree/uncheck
                   - SELECT/DROPDOWN: Output the EXACT option value or text from the "options" array provided. These are predefined — match the user's intent to the closest available option using its EXACT original text, even if the user spoke in a different language.
                   - NUMBER FIELDS: Always use English digits (0-9), never non-Latin digits.

                5. GENERAL SPELLING CORRECTIONS:
                   - Use phonetic similarity and context to correct words
                   - Common name corrections: "micheal" -> "Michael", "sarah" -> "Sarah"
                   - Address corrections: "california" -> "California", "newyork" -> "New York"
                   - Email domains: "gmail" from "gmial", "yahoo" from "yaho", "hotmail" from "hotmale"

                6. CONTEXT-AWARE CORRECTIONS:
                   - If field is "city", correct to known cities: "la" -> "Los Angeles", "nyc" -> "New York City"
                   - If field is "state", use abbreviations: "california" -> "CA", "texas" -> "TX"
                   - If field is "country", correct common misspellings: "united states" -> "United States"

                7. LANGUAGE PRESERVATION (CRITICAL RULES):
                   - If the user speaks in Bengali, Hindi, or any non-English language, preserve that language ONLY in FREE-TEXT fields:
                     * text inputs, textareas, address fields, name fields, description fields — write in the user's spoken language/script
                   - NEVER use non-English text for fields with PREDEFINED OPTIONS:
                     * SELECT/DROPDOWN fields: Always output the EXACT predefined option text from the "options" array (these are always in English)
                     * RADIO BUTTON fields: Always output the EXACT predefined option label from the "options" array (e.g., "Male", "Female", "Public")
                     * DATE fields: Always use English digits and standard format (YYYY-MM-DD)
                     * NUMBER/PHONE fields: Always use English digits (0-9)
                     * CHECKBOX fields: Always use "true" or "false"
                   - When the user says something in Bengali/Hindi that maps to a dropdown or radio, TRANSLATE the intent and pick the matching English option
                     * Example: User says "পুরুষ" (male) for a radio field with options ["Male", "Female"] → output "Male"
                     * Example: User says "ভারতীয়" (Indian) for a dropdown with options ["Indian", "Bangladesh"] → output "Indian"
                     * Example: User says "নাম রাজু দাস" for a text input → output "রাজু দাস" (preserve Bengali for text)
                   - In summary: Bengali/Hindi script goes into text fields ONLY. Everything else uses the predefined English values.

                8. ONLY INCLUDE FIELDS MENTIONED:
                   - If user didn't mention a field, don't include it
                   - Return empty JSON {{}} if no relevant information

                EXAMPLES OF SMART CORRECTIONS:
                - Speech: "my name is jon smoth, email john at gmial dot com, phone won too three four five six seven eight nine"
                  -> firstName: "John", lastName: "Smith", email: "john@gmail.com", phone: "123456789"

                - Bengali Speech (text fields get Bengali, dropdowns/radios get English):
                  User says: "আমার নাম রাজু দাস, জেন্ডার পুরুষ, জাতীয়তা ভারতীয়, ইমেইল রাজু at জিমেইল dot কম"
                  Form has: gender radio ["Male","Female","Other"], nationality dropdown ["Indian","Bangladesh","Pakistan"]
                  -> firstName: "রাজু", lastName: "দাস", gender: "Male", nationality: "Indian", email: "raju@gmail.com"
                  (Note: Names in Bengali script, but radio/dropdown values use EXACT predefined English text)

                - Speech: "i live in nyu york on main streat, zip code won two three four five"
                  -> city: "New York", street: "Main Street", zipCode: "12345"

                - Speech: "check the terms and conditions, my birthdate is january fifteenth nineteen eighty five"
                  -> termsAccepted: "true", birthDate: "1985-01-15"

                {format_instructions}""",
        input_variables=["fields_json", "transcribed_text"],
        partial_variables={"format_instructions": parser.get_format_instructions()}
    )
    
    return prompt_template, parser
