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

                IMPORTANT CONTEXT:
                The audio is always transcribed to ENGLISH text by the speech engine (Whisper with language="en"),
                regardless of what language the user actually spoke. This means even if the user spoke Bengali,
                the transcription will be an English transliteration/phonetic
                approximation. You must interpret the English transcription intelligently.

                FORM FIELDS:
                {fields_json}

                USER'S SPEECH (RAW TRANSCRIPTION — always in English):
                "{transcribed_text}"

                INSTRUCTIONS:

                ============================================================
                STEP 0: DETECT TARGET LANGUAGE DIRECTIVE (DO THIS FIRST!)
                ============================================================
                Before processing ANY field data, scan the ENTIRE transcription for a language directive.
                The user may say phrases like:
                  - "I am speaking in Bengali" / "I'm speaking Bengali"
                  - "fill in Bengali" / "fill this in Bengali"
                  - "write in Bengali" / "write it in Bengali"
                  - "type in Bengali" / "enter in Bengali"
                  - "use Bengali" / "in Bengali please"

                If such a directive is found:
                  → Set TARGET_LANGUAGE = "Bengali"
                  → ALL free-text field values (text inputs, textareas, names, addresses, descriptions) MUST be
                    written/translated into Bengali script.
                  → The language directive phrase itself is NOT field data — do NOT map it to any form field.

                If NO language directive is found:
                  → Set TARGET_LANGUAGE = "English" (default)
                  → Output all text values in English as usual.

                ============================================================
                1. ANALYZE EACH FORM FIELD:
                ============================================================
                   - Look at the field label, type, and any placeholder text
                   - Determine what type of data it expects (name, email, phone, address, etc.)
                   - Consider common variations and misspellings for that field type

                ============================================================
                2. CORRECT TRANSCRIPTION ERRORS:
                ============================================================
                   - Fix obvious spelling mistakes: "jon" -> "John", "smoth" -> "Smith", "gmial" -> "gmail"
                   - Correct speech recognition errors: "at the rate" -> "@", "dot com" -> ".com", "won too three" -> "123"
                   - Handle homophones and similar sounding words using field context
                   - Fix common typos in names, addresses, emails, etc.
                   - CRITICAL: Since the transcription is always English (even when user speaks Bengali),
                     recognize English phonetic approximations of Bengali words:
                     * "Raju Das" spoken in Bengali → transcribed as "raju das" → if TARGET_LANGUAGE is Bengali, output "রাজু দাস"
                     * "purush" (means male in Bengali) → transcribed as "purush" → understand it means "male"
                     * "bharatiya" (means Indian in Bengali) → transcribed as "bharatiya" → understand it means "Indian"

                ============================================================
                3. INTELLIGENT MAPPING:
                ============================================================
                   - Match user intent to correct field ID based on context
                   - If user says "name", map to appropriate name field (firstName, lastName, fullName)
                   - Use field labels to disambiguate (e.g., "billing address" vs "shipping address")

                ============================================================
                4. DATA FORMATTING BY FIELD TYPE:
                ============================================================
                   - NAMES: If TARGET_LANGUAGE is Bengali, transliterate/translate the name into Bengali script.
                     If TARGET_LANGUAGE is English, capitalize properly and correct spellings (e.g., "jon doe" -> "John Doe").
                   - EMAILS: Always lowercase English, fix domains (e.g., "john at yahoo dot com" -> "john@yahoo.com"). Emails are ALWAYS in English regardless of TARGET_LANGUAGE.
                   - PHONES: Extract digits only, correct common formats. Always use English digits (0-9).
                   - ADDRESSES: If TARGET_LANGUAGE is Bengali, write address text in Bengali script. Otherwise correct street types, city names, state abbreviations.
                   - DATES: Convert to YYYY-MM-DD using ENGLISH digits ONLY (0-9), NEVER use non-Latin digits. Handle various formats.
                   - RADIO BUTTONS: Output the EXACT option label text from the "options" array (e.g., "Male", "Female", "BNS"). These are predefined values — ALWAYS use the EXACT text as given in the form field options, regardless of TARGET_LANGUAGE.
                   - CHECKBOXES: "true" for yes/agree/check, "false" for no/disagree/uncheck. ALWAYS in English.
                   - SELECT/DROPDOWN: Output the EXACT option value or text from the "options" array provided. These are predefined — match the user's intent to the closest available option using its EXACT original text, regardless of TARGET_LANGUAGE.
                   - NUMBER FIELDS: Always use English digits (0-9), never non-Latin digits.

                ============================================================
                5. GENERAL SPELLING CORRECTIONS:
                ============================================================
                   - Use phonetic similarity and context to correct words
                   - Common name corrections: "micheal" -> "Michael", "sarah" -> "Sarah"
                   - Address corrections: "california" -> "California", "newyork" -> "New York"
                   - Email domains: "gmail" from "gmial", "yahoo" from "yaho", "hotmail" from "hotmale"

                ============================================================
                6. CONTEXT-AWARE CORRECTIONS:
                ============================================================
                   - If field is "city", correct to known cities: "la" -> "Los Angeles", "nyc" -> "New York City"
                   - If field is "state", use abbreviations: "california" -> "CA", "texas" -> "TX"
                   - If field is "country", correct common misspellings: "united states" -> "United States"

                ============================================================
                7. LANGUAGE OUTPUT RULES (CRITICAL — READ CAREFULLY):
                ============================================================
                   These rules apply based on the TARGET_LANGUAGE detected in Step 0.

                   A) FIELDS THAT USE BENGALI (only when TARGET_LANGUAGE = Bengali):
                      These are FREE-TEXT fields where the user provides their own content:
                      * text inputs (type="text")
                      * textareas (type="textarea")
                      * name fields (first name, middle name, last name, alias, guardian name)
                      * address fields
                      * description/comment fields
                      * any other open-ended text field
                      → Write the value in Bengali script.
                      → Example: "raju das" → "রাজু দাস"

                   B) FIELDS THAT ALWAYS STAY IN ORIGINAL FORM (regardless of whether Bengali is selected):
                      These fields have PREDEFINED options or require specific formats:
                      * SELECT/DROPDOWN: ALWAYS output the EXACT option text/value from the "options" array as-is
                      * RADIO BUTTONS: ALWAYS output the EXACT option label from the "options" array as-is
                      * CHECKBOXES: ALWAYS output "true" or "false"
                      * DATE fields: ALWAYS use YYYY-MM-DD with English digits
                      * NUMBER fields: ALWAYS use English digits (0-9)
                      * PHONE/MOBILE fields: ALWAYS use English digits (0-9)
                      * EMAIL fields: ALWAYS in English (lowercase)
                      → These fields must NEVER be translated or transliterated.
                      → Match user's spoken intent to the closest predefined option.
                      → Example: User says "purush" (means male in Bengali) → radio field has ["Male","Female"] → output "Male"
                      → Example: User says "bharatiya" (means Indian) → dropdown has ["Indian","Bangladesh"] → output "Indian"

                ============================================================
                8. ONLY INCLUDE FIELDS MENTIONED:
                ============================================================
                   - If user didn't mention a field, don't include it
                   - Return empty JSON {{}} if no relevant information
                   - Do NOT include the language directive as a field value

                ============================================================
                EXAMPLES:
                ============================================================

                EXAMPLE 1 — No language directive (default English):
                Speech: "my name is jon smoth, email john at gmial dot com, phone won too three four five six seven eight nine"
                → firstName: "John", lastName: "Smith", email: "john@gmail.com", phone: "123456789"

                EXAMPLE 2 — Bengali directive detected:
                Speech: "fill in Bengali my name is raju das guardian name is hari das address is 5 number main road kolkata gender male nationality Indian"
                TARGET_LANGUAGE = Bengali
                Form has: gender radio ["Male","Female","Other"], nationality dropdown ["Indian","Bangladesh","Pakistan"]
                → cfname: "রাজু", clname: "দাস", cgname: "হরি দাস", caddress: "৫ নম্বর মেন রোড কলকাতা", cgender: "Male", cnationality: "Indian"
                (Note: Text fields in Bengali script, but radio "Male" and dropdown "Indian" remain EXACT English predefined values)

                EXAMPLE 3 — English with corrections:
                Speech: "i live in nyu york on main streat, zip code won two three four five"
                TARGET_LANGUAGE = English (no directive found)
                → city: "New York", street: "Main Street", zipCode: "12345"

                EXAMPLE 4 — Bengali directive with dropdown/radio intent:
                Speech: "write in Bengali case type is cyber and case act name is arms act and first name is abir mondal"
                TARGET_LANGUAGE = Bengali
                Form has: case_type radio ["Cyber","Public"], case_actname dropdown with options ["Arms Act, 1959", ...]
                → case_type: "Cyber", case_actname: "Arms Act, 1959", cfname: "অবির", clname: "মন্ডল"
                (Note: Radio and dropdown use EXACT predefined English text, names in Bengali)

                {format_instructions}""",
        input_variables=["fields_json", "transcribed_text"],
        partial_variables={"format_instructions": parser.get_format_instructions()}
    )
    
    return prompt_template, parser
