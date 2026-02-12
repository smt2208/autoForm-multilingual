# AutoForm MultiLingual — Complete Project Documentation

> **A privacy-first AI agent that automates web form filling using voice commands in any language.**

This document explains **every single file**, **every function**, **every flow**, and **how the entire system works end-to-end** — from the moment a user clicks "Start Recording" to the instant form fields are filled on a web page. If you have zero programming knowledge, you will still understand this project after reading this document.

---

## Table of Contents

1. [What This Project Does (Plain English)](#1-what-this-project-does-plain-english)
2. [High-Level Architecture](#2-high-level-architecture)
3. [Complete End-to-End Flow (Step by Step)](#3-complete-end-to-end-flow-step-by-step)
4. [Project Folder Structure Explained](#4-project-folder-structure-explained)
5. [Backend (Python / FastAPI) — File-by-File Breakdown](#5-backend-python--fastapi--file-by-file-breakdown)
   - 5.1 [main.py — The Entry Point](#51-mainpy--the-entry-point)
   - 5.2 [config/settings.py — Application Configuration](#52-configsettingspy--application-configuration)
   - 5.3 [config/prompts.py — The AI Prompt Engineering](#53-configpromptspy--the-ai-prompt-engineering)
   - 5.4 [api/routes.py — The API Endpoint](#54-apiroutespy--the-api-endpoint)
   - 5.5 [services/whisper_service.py — Speech-to-Text Engine](#55-serviceswhisper_servicepy--speech-to-text-engine)
   - 5.6 [services/openai_service.py — The AI Brain (LLM)](#56-servicesopenai_servicepy--the-ai-brain-llm)
   - 5.7 [models/models.py — Data Models](#57-modelsmodelspy--data-models)
   - 5.8 [utils/field_processor.py — Post-Processing & Normalization](#58-utilsfield_processorpy--post-processing--normalization)
   - 5.9 [utils/file_handler.py — Temporary File Management](#59-utilsfile_handlerpy--temporary-file-management)
   - 5.10 [utils/logger.py — Logging System](#510-utilsloggerpy--logging-system)
   - 5.11 [requirements.txt — Python Dependencies](#511-requirementstxt--python-dependencies)
6. [Chrome Extension — File-by-File Breakdown](#6-chrome-extension--file-by-file-breakdown)
   - 6.1 [manifest.json — Extension Identity & Permissions](#61-manifestjson--extension-identity--permissions)
   - 6.2 [config.js — Extension Configuration](#62-configjs--extension-configuration)
   - 6.3 [popup.html — The User Interface](#63-popuphtml--the-user-interface)
   - 6.4 [popup.js — UI Logic & Event Handling](#64-popupjs--ui-logic--event-handling)
   - 6.5 [content_loader.js — Module Bootstrap](#65-content_loaderjs--module-bootstrap)
   - 6.6 [content_script.js — The Orchestrator](#66-content_scriptjs--the-orchestrator)
   - 6.7 [formExtractor.js — Form Field Extraction (Deep Dive)](#67-formextractorjs--form-field-extraction-deep-dive)
   - 6.8 [formFiller.js — Form Field Filling (Deep Dive)](#68-formfillerjs--form-field-filling-deep-dive)
   - 6.9 [audioRecorder.js — Microphone Recording](#69-audiorecorderjs--microphone-recording)
   - 6.10 [background.js — Background Service Worker (The Pipeline)](#610-backgroundjs--background-service-worker-the-pipeline)
   - 6.11 [styles.css — Visual Styling](#611-stylescss--visual-styling)
7. [The Chrome Extension Communication Architecture](#7-the-chrome-extension-communication-architecture)
8. [How Form Extraction Works (Technical Deep Dive)](#8-how-form-extraction-works-technical-deep-dive)
9. [How Form Filling Works (Technical Deep Dive)](#9-how-form-filling-works-technical-deep-dive)
10. [How the AI Processes Voice to Form Data](#10-how-the-ai-processes-voice-to-form-data)
11. [Multi-Language Support — How It Works](#11-multi-language-support--how-it-works)
12. [Error Handling & Edge Cases](#12-error-handling--edge-cases)
13. [Sequence Diagram — Complete Flow](#13-sequence-diagram--complete-flow)

---

## 1. What This Project Does (Plain English)

Imagine you have a long web form — maybe a police case registration form with 30+ fields (names, addresses, case numbers, checkboxes, dropdowns, etc.). Instead of typing every field manually, you:

1. **Click a button** in your browser (Chrome Extension).
2. **Speak naturally** — "My name is Raju Das, case number 54, the act is Arms Act, the accused lives in Kolkata..."
3. The system **listens to your voice**, **understands what you said**, **figures out which field each piece of information belongs to**, and **automatically fills the form** — all in seconds.

It works in **any language** — English, Bengali (বাংলা), Hindi, and more. If you speak in Bengali, the form gets filled in Bengali script.

---

## 2. High-Level Architecture

The system has **two major parts**:

```
┌──────────────────────────────────────────────────────────────┐
│                     CHROME EXTENSION                         │
│  (Runs inside the browser — captures voice, reads forms,     │
│   fills forms)                                               │
│                                                              │
│  popup.html/js  ←→  background.js  ←→  content_script.js    │
│                          │              ↕           ↕        │
│                          │         formExtractor  formFiller  │
│                          │              .js          .js      │
│                          │                                    │
│                          │  audioRecorder.js                  │
│                          ↓                                    │
│                    HTTP POST Request                          │
└──────────────────────┬───────────────────────────────────────┘
                       │
                       ↓
┌──────────────────────────────────────────────────────────────┐
│                      BACKEND SERVER                          │
│  (Python FastAPI — processes audio, runs AI)                 │
│                                                              │
│  main.py  →  api/routes.py                                   │
│                   │                                          │
│           ┌───────┴────────┐                                 │
│           ↓                ↓                                 │
│   whisper_service.py   openai_service.py                     │
│   (Voice → Text)       (Text → Form Fields)                 │
│                              │                               │
│                        config/prompts.py                      │
│                        (AI Instructions)                     │
│                              │                               │
│                     utils/field_processor.py                  │
│                     (Clean & Normalize)                       │
└──────────────────────────────────────────────────────────────┘
```

**In plain words:**
- The **Chrome Extension** lives in your browser. It records your voice, scans the web page for form fields, and fills them.
- The **Backend Server** runs on a computer (or cloud). It converts your voice to text (using Whisper AI) and then uses GPT-4.1 to understand what you said and map it to the correct form fields.

---

## 3. Complete End-to-End Flow (Step by Step)

Here is **exactly** what happens from start to finish, in order:

### Step 1: User Opens a Web Page with a Form
The user navigates to any web page that has a form (e.g., a police FIR registration form). The Chrome Extension's **content script** is automatically injected into the page.

### Step 2: User Clicks "Start Recording" in the Popup
- The user clicks the extension icon in Chrome's toolbar.
- `popup.html` opens as a small window.
- The user clicks the **"🎤 Start Recording"** button.
- `popup.js` sends a message to `content_script.js` via Chrome's messaging API: `{ action: 'startRecording' }`.

### Step 3: Microphone Starts Capturing Audio
- `content_script.js` receives the message and calls `startRecording()` from `audioRecorder.js`.
- `audioRecorder.js` calls `navigator.mediaDevices.getUserMedia({ audio: true })` to access the microphone.
- A `MediaRecorder` is created and starts recording. Audio data chunks are collected in an array.

### Step 4: User Speaks Their Information
The user speaks naturally: *"My name is Raju Das, father's name Gopal Das, age 35, address 12 MG Road Kolkata, email raju at gmail dot com, mobile 9876543210, case number 54, section 302..."*

### Step 5: User Clicks "Stop Recording"
- The user clicks **"⏹️ Stop Recording"** in the popup.
- `popup.js` sends `{ action: 'stopRecording' }` to `content_script.js`.
- `audioRecorder.js` stops the `MediaRecorder`, combines all audio chunks into a single `Blob`, converts it to a **base64 data URL** string, and returns it.

### Step 6: Audio is Handed to the Background Service Worker
- `popup.js` receives the base64 audio data.
- It sends it to `background.js` via `chrome.runtime.sendMessage()` with action `'PROCESS_AUDIO'`, along with the current tab's ID.
- **Why the background script?** Because the popup can be closed by the user, but the background service worker keeps running. This ensures processing continues even if the popup is closed.

### Step 7: Background Script Extracts Form Fields from the Page
- `background.js` sends a message to `content_script.js` in the active tab: `{ action: 'extractFields' }`.
- `content_script.js` calls `extractFormFields()` from `formExtractor.js`.
- This function **scans the entire DOM** of the web page and extracts every fillable form field — inputs, selects, textareas, radio buttons, checkboxes — along with their IDs, names, types, labels, placeholder text, current values, and dropdown options.
- The extracted field data (a JSON array) is sent back to `background.js`.

### Step 8: Audio + Form Fields are Sent to the Backend
- `background.js` constructs a `FormData` object containing:
  - `audio_file`: The audio blob (the user's voice recording)
  - `form_data_json`: A JSON string of all extracted form fields
- It sends an HTTP POST request to the backend at `/api/process`.

### Step 9: Backend Receives and Processes the Request
- `api/routes.py` receives the request.
- It saves the audio to a temporary file on disk.

### Step 10: Whisper Transcribes Audio to Text
- The `WhisperService` (from `whisper_service.py`) loads the audio file and runs it through the **Faster-Whisper** model.
- The model converts speech to text. E.g.: *"my name is raju das father name gopal das age 35 address 12 mg road kolkata email raju at gmail dot com mobile 9876543210 case number 54 section 302"*
- The temporary audio file is deleted.

### Step 11: GPT-4.1 Maps Text to Form Fields
- The `OpenAIService` (from `openai_service.py`) takes:
  - The transcribed text
  - The JSON structure of all form fields
- It sends both to **GPT-4.1** with a carefully crafted prompt (from `config/prompts.py`).
- GPT-4.1 analyzes the transcribed text, understands context, corrects spelling errors, and returns a JSON mapping like:
  ```json
  {
    "cfname": "Raju",
    "clname": "Das",
    "cgname": "Gopal Das",
    "cage": "35",
    "caddress": "12 MG Road, Kolkata",
    "cemail": "raju@gmail.com",
    "cmobile": "9876543210",
    "case_no": "54",
    "ipsection": "302"
  }
  ```

### Step 12: Post-Processing Cleans the Data
- `utils/field_processor.py` runs `post_process_fields()` on the result.
- It normalizes emails to lowercase, strips non-digit characters from phone numbers, normalizes gender values, converts boolean strings for checkboxes, and converts non-Latin digits (Bengali/Devanagari/Arabic) to ASCII.

### Step 13: Backend Returns the Response
- The API returns a `ProcessResponse` JSON:
  ```json
  {
    "success": true,
    "transcribed_text": "my name is raju das...",
    "form_data": { "cfname": "Raju", "clname": "Das", ... },
    "message": "Audio processed and form fields mapped successfully"
  }
  ```

### Step 14: Background Script Triggers Form Filling
- `background.js` receives the API response.
- It sends a message to `content_script.js`: `{ action: 'fillFields', data: { "cfname": "Raju", ... } }`.
- `content_script.js` calls `fillFormFields()` from `formFiller.js`.

### Step 15: Form Fields are Filled on the Page
- `formFiller.js` iterates over each key-value pair in the data.
- For each field ID, it finds the corresponding DOM element on the page.
- Depending on the element type (text input, select dropdown, checkbox, radio, textarea), it sets the value using the appropriate method.
- It dispatches `input`, `change`, and `blur` events to trigger framework change detection (React, Angular, Vue, etc.).
- The first filled field is scrolled into view.

### Step 16: User Sees the Filled Form
The form is now completely filled. The user can review and submit.

---

## 4. Project Folder Structure Explained

```
AutoForm_MultiLingual/
│
├── main.py                    # Backend entry point — starts the FastAPI server
├── requirements.txt           # Python package dependencies
├── feilds.md                  # Sample extracted form field data (for reference/testing)
├── LICENSE                    # Project license
├── README.md                  # Project readme
│
├── api/                       # API layer
│   ├── __init__.py            # Makes 'api' a Python package
│   └── routes.py              # Defines the /api/process endpoint
│
├── config/                    # Configuration layer
│   ├── __init__.py            # Makes 'config' a Python package
│   ├── settings.py            # App settings (ports, model names, API keys)
│   └── prompts.py             # AI prompt templates for GPT-4.1
│
├── models/                    # Data models
│   └── models.py              # Pydantic models (request/response schemas)
│
├── services/                  # Business logic layer
│   ├── __init__.py            # Makes 'services' a Python package
│   ├── whisper_service.py     # Speech-to-text using Faster-Whisper
│   └── openai_service.py      # Text-to-form-fields using GPT-4.1
│
├── utils/                     # Utility functions
│   ├── __init__.py            # Makes 'utils' a Python package
│   ├── field_processor.py     # Post-processing of extracted field values
│   ├── file_handler.py        # Temporary file save/delete operations
│   └── logger.py              # Logging configuration (console + file)
│
├── temp_uploads/              # Temporary storage for audio files (auto-cleaned)
├── logs/                      # Log files with daily rotation
│   ├── app.log.2026-01-20
│   ├── app.log.2026-01-21
│   └── ...
│
├── assets/                    # Documentation assets
│   └── PROJECT_DOCUMENTATION.md  # This file
│
└── chrome_extension/          # The Chrome Extension
    ├── manifest.json          # Extension manifest (identity, permissions, scripts)
    ├── config.js              # Backend URL and settings
    ├── popup.html             # Extension popup UI (HTML)
    ├── popup.js               # Popup logic (button clicks, status display)
    ├── styles.css             # Popup styling (CSS)
    ├── content_loader.js      # Bootstraps ES module content scripts
    ├── content_script.js      # Main orchestrator (routes messages to modules)
    ├── formExtractor.js       # Scans DOM and extracts all form fields
    ├── formFiller.js          # Fills form fields with AI-generated data
    ├── audioRecorder.js       # Records microphone audio
    ├── background.js          # Service worker (orchestrates the full pipeline)
    └── images/                # Extension icons
        └── icon.png
```

---

## 5. Backend (Python / FastAPI) — File-by-File Breakdown

### 5.1 `main.py` — The Entry Point

**Purpose:** This is the first file that runs when you start the backend server. It creates the web server and sets everything up.

**What it does, line by line:**

```python
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
```
- Imports FastAPI (the web framework) and CORS middleware (allows the Chrome Extension to talk to the server).

```python
@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing AI models...")
    from services.whisper_service import get_whisper_service
    from services.openai_service import get_openai_service
    get_whisper_service()
    get_openai_service()
    yield
```
- **Lifespan function**: Runs once when the server starts. It pre-loads the Whisper and OpenAI models into memory so the first request doesn't have a long delay. The `yield` means "the server is now running and ready to accept requests."

```python
app = FastAPI(
    title=settings.APP_NAME,
    description="Privacy-first AI agent...",
    version="0.1.0",
    lifespan=lifespan
)
```
- Creates the FastAPI application with a title and description. Hooks up the lifespan function.

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```
- **CORS Middleware**: The Chrome Extension runs on `chrome-extension://...` origin. Without CORS, the browser would block requests to `http://localhost:8000`. This middleware tells the browser "allow requests from any origin."

```python
app.include_router(router)
```
- Plugs in the API routes defined in `api/routes.py`.

```python
@app.get("/")
async def root():
    return { "name": ..., "status": "running" }

@app.get("/health")
async def health_check():
    return { "status": "healthy", "model": ..., "device": ... }
```
- Two simple endpoints:
  - `/` — confirms the server is running.
  - `/health` — shows which Whisper model and device (CPU/GPU) are active.

```python
if __name__ == "__main__":
    uvicorn.run("main:app", host=..., port=..., reload=...)
```
- When you run `python main.py`, it starts the Uvicorn ASGI server. `reload=True` in debug mode means the server auto-restarts when you edit code.

---

### 5.2 `config/settings.py` — Application Configuration

**Purpose:** Centralizes all configurable values (API keys, model names, ports) in one place using environment variables.

```python
class Settings(BaseSettings):
    APP_NAME: str = "FormFiller"
    DEBUG: bool = os.getenv("DEBUG", "false").lower() == "true"
    API_HOST: str = "0.0.0.0"
    API_PORT: int = int(os.getenv("PORT", "8000"))
    UPLOAD_DIR: str = "temp_uploads"
    WHISPER_MODEL: str = os.getenv("WHISPER_MODEL", "base")
    WHISPER_DEVICE: str = os.getenv("WHISPER_DEVICE", "cpu")
    OPENAI_API_KEY: Any = os.getenv("OPENAI_API_KEY", None)
    OPENAI_MODEL: str = "gpt-4.1-2025-04-14"
```

**Key settings explained:**
| Setting | What It Controls | Default |
|---------|-----------------|---------|
| `APP_NAME` | Display name of the application | "FormFiller" |
| `DEBUG` | Enables debug logging and auto-reload | `false` |
| `API_HOST` | IP address to bind to (`0.0.0.0` = all interfaces) | `0.0.0.0` |
| `API_PORT` | Port number for the server | `8000` |
| `WHISPER_MODEL` | Which Whisper model to use (`tiny`, `base`, `small`, `medium`, `large`) | `base` |
| `WHISPER_DEVICE` | Run Whisper on CPU or GPU (`cpu` / `cuda`) | `cpu` |
| `OPENAI_API_KEY` | Your OpenAI API key for GPT-4.1 | None (must be set) |
| `OPENAI_MODEL` | Which GPT model version to use | `gpt-4.1-2025-04-14` |

The `__init__` method also creates the `temp_uploads` directory if it doesn't exist.

---

### 5.3 `config/prompts.py` — The AI Prompt Engineering

**Purpose:** This is the **most critical file for accuracy**. It contains the detailed instructions sent to GPT-4.1, telling it exactly how to interpret voice transcriptions and map them to form fields.

**The function `get_form_mapping_prompt()` returns two things:**
1. A `PromptTemplate` — the text instructions for GPT-4.1
2. A `JsonOutputParser` — forces GPT-4.1 to return valid JSON

**The prompt instructs GPT-4.1 to:**

1. **Analyze each form field** — look at its label, type, placeholder text to understand what data it expects.

2. **Correct transcription errors** — speech recognition is imperfect. The prompt teaches the AI to fix:
   - Spelling mistakes: "jon" → "John", "smoth" → "Smith"
   - Speech artifacts: "at the rate" → "@", "dot com" → ".com"
   - Number words: "won too three" → "123"
   - Common domain typos: "gmial" → "gmail"

3. **Intelligently map data to fields** — if user says "name", figure out whether it goes in `firstName`, `lastName`, or `fullName`.

4. **Format data by field type:**
   - **Names**: Capitalize properly ("jon doe" → "John Doe")
   - **Emails**: Lowercase, fix formatting ("john at yahoo dot com" → "john@yahoo.com")
   - **Phones**: Extract digits only
   - **Dates**: Convert to YYYY-MM-DD format
   - **Radio buttons**: Output the matching option label text
   - **Checkboxes**: Output "true" or "false"

5. **Preserve non-English languages** — if the user speaks in Bengali, all values must stay in Bengali script. E.g., "আমার নাম রাজু" → `firstName: "রাজু"`.

6. **Only include mentioned fields** — don't hallucinate values for fields the user didn't talk about.

The prompt uses LangChain's `PromptTemplate` with two variables:
- `{fields_json}` — the form fields from the web page
- `{transcribed_text}` — what the user said

And `{format_instructions}` — auto-generated instructions that tell GPT-4.1 to return JSON matching the `FormFieldMapping` schema.

---

### 5.4 `api/routes.py` — The API Endpoint

**Purpose:** Defines the single API endpoint that the Chrome Extension calls.

**Endpoint:** `POST /api/process`

**Accepts (multipart form data):**
- `audio_file` — the audio file (WAV, WebM, MP3, OGG, etc.)
- `form_data_json` — a JSON string containing the form field structure

**What happens inside:**

```python
@router.post("/process", response_model=ProcessResponse)
async def process_audio(
    audio_file: UploadFile = File(...),
    form_data_json: str = Form(default="{}")
):
```

1. **Parse form data JSON** — validates it's proper JSON, returns error if not.

2. **Save audio to a temporary file:**
   ```python
   temp_audio = tempfile.NamedTemporaryFile(suffix=file_ext, delete=False)
   shutil.copyfileobj(audio_file.file, temp_audio)
   ```
   - Uses Python's `tempfile` to create a file with the correct extension.
   - Copies the uploaded audio data stream into it.
   - Flushes and closes the file so Whisper can read it.

3. **Transcribe with Whisper:**
   ```python
   whisper_service = get_whisper_service()
   transcribed_text = whisper_service.transcribe(temp_file_path)
   ```

4. **Clean up temp file** — deletes it in a `finally` block (even if transcription fails).

5. **Map with OpenAI:**
   ```python
   openai_service = get_openai_service()
   mapped_form_data = openai_service.map_text_to_fields(transcribed_text, json.dumps(form_data))
   ```

6. **Return response:**
   ```python
   return ProcessResponse(
       success=True,
       transcribed_text=transcribed_text,
       form_data=mapped_form_data,
       message="Audio processed and form fields mapped successfully"
   )
   ```

**Error handling:** Any exception is caught and returned as `success=False` with the error message.

---

### 5.5 `services/whisper_service.py` — Speech-to-Text Engine

**Purpose:** Converts audio files to text using the **Faster-Whisper** library (an optimized C++ implementation of OpenAI's Whisper model).

**How it works:**

```python
class WhisperService:
    def __init__(self):
        self.model = None
        self._load_model()
```
- On initialization, loads the Whisper model into memory.

```python
def _load_model(self):
    self.model = WhisperModel(
        settings.WHISPER_MODEL,     # e.g., "base"
        device=settings.WHISPER_DEVICE,  # "cpu" or "cuda"
        compute_type="int8"         # 8-bit quantization for speed
    )
```
- `int8` compute type uses 8-bit integer quantization, which makes the model run faster with less memory on CPU while maintaining acceptable accuracy.

```python
def transcribe(self, audio_file_path: str) -> str:
    segments, info = self.model.transcribe(
        audio_file_path,
        beam_size=5,      # Beam search width for better accuracy
        language="en"     # Default language
    )
    transcribed_text = " ".join(segment.text for segment in segments)
    return transcribed_text
```
- `beam_size=5` — uses beam search (considers 5 possible interpretations simultaneously) for more accurate results.
- The model returns segments (chunks of text with timestamps). We join them all into a single string.

**Singleton Pattern:**
```python
_whisper_service = None
def get_whisper_service() -> WhisperService:
    global _whisper_service
    if _whisper_service is None:
        _whisper_service = WhisperService()
    return _whisper_service
```
- The model is loaded **once** and reused for all requests. Loading a model is expensive (takes several seconds), so this singleton pattern ensures it's only done once.

---

### 5.6 `services/openai_service.py` — The AI Brain (LLM)

**Purpose:** Takes the transcribed text and the form field structure, sends them to GPT-4.1, and gets back a mapping of field IDs to values.

**How it works:**

```python
def __init__(self):
    self.model = ChatOpenAI(
        model=settings.OPENAI_MODEL,  # "gpt-4.1-2025-04-14"
        temperature=0.2               # Low temperature = more deterministic
    )
```
- Uses LangChain's `ChatOpenAI` wrapper. Temperature 0.2 means the AI gives consistent, predictable answers (not creative/random).

```python
def map_text_to_fields(self, transcribed_text: str, fields_json: str) -> dict:
    prompt_template, parser = get_form_mapping_prompt()
    chain = prompt_template | self.model | parser
    parsed_response = chain.invoke({
        "fields_json": fields_json,
        "transcribed_text": transcribed_text
    })
```
- **LangChain chain**: This uses LangChain's pipe operator (`|`) to create a processing pipeline:
  1. `prompt_template` — fills in the template with the actual data
  2. `self.model` — sends the filled prompt to GPT-4.1
  3. `parser` — parses GPT-4.1's response as JSON

- **Resilient extraction**: The code handles different response formats GPT might return:
  ```python
  if isinstance(parsed_response, dict):
      mapped_data = parsed_response.get("mapped_fields", parsed_response)
      if len(mapped_data) == 1 and isinstance(list(mapped_data.values())[0], dict):
          mapped_data = list(mapped_data.values())[0]
  ```
  - If GPT wraps the result in `{"mapped_fields": {...}}`, it extracts the inner dict.
  - If GPT double-wraps it, it unwraps that too.

- **Post-processing**: Calls `post_process_fields()` to clean up the data before returning.

---

### 5.7 `models/models.py` — Data Models

**Purpose:** Defines the data structures using Pydantic for validation.

```python
class FormFieldMapping(BaseModel):
    mapped_fields: Dict[str, str] = Field(
        description="Dictionary mapping field IDs to extracted values."
    )
```
- Used by the JSON output parser to tell GPT-4.1 what shape the output should be.

```python
class ProcessResponse(BaseModel):
    success: bool
    transcribed_text: str
    form_data: dict
    message: str
```
- Defines the exact shape of the API response. FastAPI uses this to validate and serialize the response automatically.

---

### 5.8 `utils/field_processor.py` — Post-Processing & Normalization

**Purpose:** Cleans up and normalizes the values GPT-4.1 returns before sending them back to the Chrome Extension.

**Key functions:**

**`_to_ascii_digits(value)`** — Converts non-Latin numerals to ASCII:
```python
_DIGIT_MAP = str.maketrans(
    '০১২৩৪৫৬৭৮৯'   # Bengali digits
    '०१२३४५६७८९'   # Devanagari digits
    '٠١٢٣٤٥٦٧٨٩',  # Arabic-Indic digits
    '0123456789' * 3  # Maps all to ASCII 0-9
)
```
- If GPT returns Bengali digits like `৯৮৭৬৫৪৩২১০` for a phone number, this converts them to `9876543210`.

**`_normalize_bool(value)`** — Converts various boolean representations:
- `'yes'`, `'agree'`, `'checked'`, `'1'`, `'on'` → `'true'`
- `'no'`, `'disagree'`, `'unchecked'`, `'0'`, `'off'` → `'false'`

**`post_process_fields(fields)`** — Main processing function:
- **Filters out empty values**: Removes `None`, empty strings, `"none"`, `"null"`, `"n/a"`.
- **Converts types**: Booleans → `'true'`/`'false'` strings; numbers → strings.
- **Email normalization**: Lowercase + remove spaces (`"John @ Gmail . COM"` → `"john@gmail.com"`).
- **Phone normalization**: Convert non-Latin digits to ASCII, then keep only digit characters.
- **Gender normalization**: `'m'`/`'man'`/`'boy'` → `'male'`; `'f'`/`'woman'`/`'girl'` → `'female'`.
- **Checkbox normalization**: Converts boolean-like values to `'true'`/`'false'`.

---

### 5.9 `utils/file_handler.py` — Temporary File Management

**Purpose:** Utility class for saving and deleting temporary audio files.

```python
class FileHandler:
    @staticmethod
    def save_upload(file_path: str, filename: str) -> str:
        # Copies a file to the temp_uploads directory
        
    @staticmethod
    def delete_file(file_path: str) -> bool:
        # Deletes a file, returns True if successful
```
- While the main route uses Python's `tempfile` module directly, this class provides a cleaner interface for file operations if needed elsewhere.

---

### 5.10 `utils/logger.py` — Logging System

**Purpose:** Sets up a comprehensive logging system that writes to both the console and daily-rotated log files.

```python
def setup_logger(name: str = "FormFiller"):
    logger = logging.getLogger(name)
    
    # Console Handler — prints to terminal
    console_handler = logging.StreamHandler(sys.stdout)
    
    # File Handler — daily rotation at midnight
    file_handler = TimedRotatingFileHandler(
        filename=log_dir / "app.log",
        when="midnight",
        interval=1,
        backupCount=30,    # Keep 30 days of logs
        encoding='utf-8'
    )
    file_handler.suffix = "%Y-%m-%d"
```

- Every day at midnight, a new log file is created (e.g., `app.log.2026-02-09`).
- Old logs beyond 30 days are automatically deleted.
- Third-party library logs (httpcore, httpx) are silenced to reduce noise.
- Log format: `2026-02-09 14:30:45 - FormFiller - INFO - Processing audio...`

---

### 5.11 `requirements.txt` — Python Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `fastapi` | 0.115.0 | The web framework for the REST API |
| `uvicorn[standard]` | 0.30.0 | ASGI server to run FastAPI |
| `python-multipart` | 0.0.9 | Parses multipart form data (file uploads) |
| `faster-whisper` | 1.0.3 | Speech-to-text engine (optimized Whisper) |
| `pydantic` | 2.9.0 | Data validation and serialization |
| `pydantic-settings` | 2.5.0 | Settings management with env var support |
| `numpy` | >=1.26, <2.0 | Numerical computing (required by Whisper) |
| `langchain` | 0.3.7 | LLM orchestration framework |
| `langchain-core` | 0.3.15 | Core LangChain abstractions |
| `langchain-openai` | 0.2.0 | OpenAI integration for LangChain |
| `python-dotenv` | 1.0.1 | Loads `.env` file for environment variables |

---

## 6. Chrome Extension — File-by-File Breakdown

### 6.1 `manifest.json` — Extension Identity & Permissions

**Purpose:** The manifest is the Chrome Extension's **identity card**. Chrome reads this file to understand what the extension is, what it can do, and what permissions it needs.

```json
{
  "manifest_version": 3,
```
- Uses **Manifest V3** — the latest Chrome Extension standard.

```json
  "permissions": [
    "activeTab",     // Access the currently active tab
    "scripting",     // Inject scripts into web pages
    "storage"        // Store data locally (for settings)
  ],
```

```json
  "host_permissions": [
    "http://localhost:8000/*",
    "https://localhost:8000/*",
    "<all_urls>"
  ],
```
- Allows the extension to make HTTP requests to the backend server and to any URL (needed to inject content scripts into any web page).

```json
  "action": {
    "default_popup": "popup.html",
    "default_title": "FormFiller",
    "default_icon": { "16": "images/icon.png", ... }
  },
```
- When the user clicks the extension icon, `popup.html` opens as a popup window.

```json
  "background": {
    "service_worker": "background.js"
  },
```
- `background.js` runs as a **service worker** — a persistent background process that handles long-running tasks.

```json
  "content_scripts": [
    {
      "matches": ["<all_urls>", "file://*/*"],
      "js": ["content_loader.js"],
      "run_at": "document_idle"
    }
  ],
```
- `content_loader.js` is automatically injected into **every web page** the user visits, after the page finishes loading (`document_idle`).
- It also works on local `file://` URLs.

```json
  "web_accessible_resources": [
    {
      "resources": [
        "content_script.js",
        "formExtractor.js",
        "formFiller.js",
        "audioRecorder.js"
      ],
      "matches": ["<all_urls>", "file://*/*"]
    }
  ]
```
- These files are made accessible to web pages so they can be dynamically imported as ES modules by `content_loader.js`.

---

### 6.2 `config.js` — Extension Configuration

**Purpose:** Stores the backend server URL and other settings in one place.

```javascript
const CONFIG = {
    BACKEND_URL: 'https://formfiller-backend-dqaehcc5eaevfscs.southindia-01.azurewebsites.net',
    API_ENDPOINTS: {
        process: '/api/process',
        health: '/health'
    },
    AUDIO: {
        sampleRate: 16000,
        channels: 1,
        format: 'wav'
    }
};
```

- `BACKEND_URL` — where the backend server is running. Can be changed to `http://localhost:8000` for local development or a cloud URL for production (currently set to an Azure deployment).
- `API_ENDPOINTS.process` — the path appended to `BACKEND_URL` to form the full API URL.
- `AUDIO` — audio recording settings (sample rate, channels, format).

---

### 6.3 `popup.html` — The User Interface

**Purpose:** The small window that appears when you click the extension icon. It contains the recording controls.

**Structure:**
```
┌─────────────────────────────────────┐
│  [ICON]  AI Form Filler             │  ← Header (gradient blue background)
│          Voice-Powered Intelligence │
├─────────────────────────────────────┤
│  ● Ready to record                  │  ← Status indicator (dot + text)
├─────────────────────────────────────┤
│  [🎤 Start Recording]  [⏹️ Stop]   │  ← Two buttons side by side
├─────────────────────────────────────┤
│  (transcript text appears here)     │  ← Transcript div
│  (error messages appear here)       │  ← Error div
└─────────────────────────────────────┘
```

**Key HTML elements and their IDs:**
| Element | ID | Purpose |
|---------|-----|---------|
| Start button | `startBtn` | Begins audio recording |
| Stop button | `stopBtn` | Stops recording and triggers processing |
| Status dot | `statusIndicator` | Visual indicator (gray = idle, red pulsing = recording) |
| Status text | `statusText` | Shows current state in words |
| Transcript area | `transcript` | Shows status messages and results |
| Error area | `error` | Shows error messages in red |

The popup loads `config.js` first (for the backend URL), then `popup.js` (for all the logic).

---

### 6.4 `popup.js` — UI Logic & Event Handling

**Purpose:** Controls the popup's behavior — handling button clicks, updating the UI, and communicating with other extension scripts.

**DOM element references (lines 1-8):**
```javascript
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const statusIndicator = document.getElementById('statusIndicator');
const statusText = document.getElementById('statusText');
const transcriptDiv = document.getElementById('transcript');
const errorDiv = document.getElementById('error');
```

**Helper functions:**
- `showError(message)` — displays error text in the error div.
- `clearError()` — clears any displayed error.
- `updateStatus(text, isActive)` — updates the status indicator dot and text. When `isActive=true`, the dot turns red and pulses.

**Start Recording button click handler:**
```javascript
startBtn.addEventListener('click', async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const response = await chrome.tabs.sendMessage(tab.id, { action: 'startRecording' });
    // Update UI to show recording state
});
```
1. Gets the currently active tab.
2. Sends a message to the content script in that tab asking it to start recording.
3. If successful, disables the Start button, enables the Stop button, and shows "Recording..." status.

**Stop Recording button click handler:**
```javascript
stopBtn.addEventListener('click', async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    // Update UI immediately to show processing
    const response = await chrome.tabs.sendMessage(tab.id, { action: 'stopRecording' });
    // Hand off to background service worker
    chrome.runtime.sendMessage({
        action: 'PROCESS_AUDIO',
        audioBlobData: response.audioBlob,
        tabId: tab.id
    });
});
```
1. Tells the content script to stop recording.
2. Receives the base64-encoded audio blob back.
3. Sends the audio data to `background.js` for processing.
4. The UI shows "Background Processing..." — the user can close the popup now.

**Status recovery on popup reopen (`checkRecordingStatus`):**
```javascript
async function checkRecordingStatus() {
    // Check if content script is still recording
    const response = await chrome.tabs.sendMessage(tab.id, { action: 'getRecordingStatus' });
    // Check if background is still processing
    const bgState = await chrome.runtime.sendMessage({ action: 'GET_STATUS' });
}
```
- If the user closes and reopens the popup during recording or processing, this function restores the correct UI state.

**Status update listener:**
```javascript
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'STATUS_UPDATE') {
        handleStatusUpdate(request.state);
    }
});
```
- Listens for status updates from `background.js` and updates the UI accordingly (shows "Analyzing...", "Crawling...", "AI Brain...", "Filling...", "Completed!" etc.).

---

### 6.5 `content_loader.js` — Module Bootstrap

**Purpose:** A tiny script that bridges Chrome's content script injection system with ES modules.

```javascript
(async () => {
    const src = chrome.runtime.getURL('content_script.js');
    await import(src);
})();
```

**Why this file exists:**
Chrome's `content_scripts` in `manifest.json` only supports classic scripts, not ES modules. But our `content_script.js` uses `import` statements to load `formExtractor.js`, `formFiller.js`, and `audioRecorder.js` as modules. 

This loader is injected as a classic script, and it dynamically imports `content_script.js` as a module using `import()`. The `chrome.runtime.getURL()` converts the relative file path to the full `chrome-extension://..../content_script.js` URL.

---

### 6.6 `content_script.js` — The Orchestrator

**Purpose:** Runs inside every web page. It's the central message router — it receives commands from the popup and background script, and delegates work to the appropriate module.

```javascript
import { extractFormFields } from './formExtractor.js';
import { fillFormFields } from './formFiller.js';
import { startRecording, stopRecording, isRecording } from './audioRecorder.js';
```
- Imports all three worker modules.

```javascript
chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
    if (request.action === 'getRecordingStatus') {
        sendResponse({ isRecording: isRecording() });
    }
    if (request.action === 'extractFields') {
        const fields = extractFormFields();
        sendResponse({ fields: fields });
    }
    if (request.action === 'fillFields') {
        fillFormFields(request.data);
        sendResponse({ status: 'fields_filled' });
    }
    if (request.action === 'startRecording') {
        startRecording().then(() => sendResponse({ success: true }));
        return true; // Keep channel open for async response
    }
    if (request.action === 'stopRecording') {
        stopRecording().then(audioBlob => sendResponse({ audioBlob }));
        return true; // Keep channel open for async response
    }
    return true;
});
```

**Message routing table:**
| Action | Calls | Returns |
|--------|-------|---------|
| `getRecordingStatus` | `isRecording()` | `{ isRecording: true/false }` |
| `extractFields` | `extractFormFields()` | `{ fields: [...] }` |
| `fillFields` | `fillFormFields(data)` | `{ status: 'fields_filled' }` |
| `startRecording` | `startRecording()` | `{ success: true }` |
| `stopRecording` | `stopRecording()` | `{ audioBlob: "data:audio/webm;base64,..." }` |

**Important:** For async operations (`startRecording`, `stopRecording`), the handler returns `true` to tell Chrome to keep the message channel open until `sendResponse` is called.

---

### 6.7 `formExtractor.js` — Form Field Extraction (Deep Dive)

**Purpose:** Scans the entire DOM of the current web page and builds a JSON representation of every fillable form field. This is one of the most complex files in the project.

**The `extractFormFields()` function:**

#### Step 1: Find All Potential Form Elements
```javascript
const elements = document.querySelectorAll('input, select, textarea');
```
- Queries the DOM for all `<input>`, `<select>`, and `<textarea>` elements on the page. This captures text inputs, dropdowns, textareas, checkboxes, radio buttons, number fields, date fields, etc.

#### Step 2: Filter Out Non-Fillable Elements
```javascript
const type = element.type?.toLowerCase() || 'text';
if (type === 'hidden' || type === 'submit' || type === 'button' || type === 'reset' || type === 'image') {
    return; // Skip these
}
```
- Skips elements that users don't fill: hidden fields, submit buttons, reset buttons, image inputs.

#### Step 3: Skip Hidden Elements (with Select2 Exception)
```javascript
const style = window.getComputedStyle(element);
const isSelect2Hidden = element.classList.contains('select2-hidden-accessible');
if (!isSelect2Hidden) {
    if (style.display === 'none' || style.visibility === 'hidden' || element.offsetParent === null) {
        return;
    }
}
```
- Uses `getComputedStyle()` to check if the element is visually hidden.
- **Select2 exception**: Select2 is a popular jQuery plugin that replaces `<select>` dropdowns with custom styled versions. It hides the original `<select>` element (adds class `select2-hidden-accessible`) but we still need to read its options. So we don't skip these.

#### Step 4: Group Radio Buttons by Name
```javascript
if (type === 'radio' && element.name) {
    const groupKey = 'radiogroup_' + element.name;
    if (seenFields.has(groupKey)) return; // Already processed this group
    seenFields.add(groupKey);
    
    const groupRadios = document.querySelectorAll(`input[type="radio"][name="${element.name}"]`);
    const options = [];
    groupRadios.forEach(radio => {
        // Find label for each radio option
        let optLabel = '';
        // Try: label[for], next sibling label, parent label
        // ...
        options.push(optLabel);
    });
    
    formFields.push({
        id: element.name,
        type: 'radio',
        label: element.name,
        options: options        // e.g., ["Male", "Female", "Other"]
    });
}
```
- Radio buttons with the same `name` attribute form a group. Instead of extracting each radio button separately, they're grouped into one field entry with an `options` array.
- The label for each option is found by checking (in order): `<label for="radioId">`, next sibling `<label>`, parent `<label>`.
- This is crucial so the AI knows the available choices and can output the correct option label.

#### Step 5: Generate Unique Field IDs
```javascript
const fieldId = element.id || 
               element.name || 
               element.getAttribute('data-testid') || 
               element.getAttribute('data-field') ||
               element.getAttribute('data-automation-id') ||
               element.getAttribute('aria-labelledby') ||
               `field_${index}`;
```
- Not all form fields have an `id`. This cascade tries multiple attributes to find a unique identifier. If nothing works, it generates `field_0`, `field_1`, etc.
- `data-testid` and `data-automation-id` are common in React/Angular apps.
- `seenFields` set prevents duplicates.

#### Step 6: Detect Labels (Multi-Strategy)
This is the most sophisticated part. The label text tells the AI what data the field expects. The extractor tries **7 different strategies** in order:

```javascript
// Strategy 1: Explicit label[for] attribute
if (element.id) {
    const label = document.querySelector(`label[for="${element.id}"]`);
    if (label) labelText = label.textContent.trim();
}

// Strategy 2: aria-labelledby attribute
const ariaLabelledBy = element.getAttribute('aria-labelledby');
if (ariaLabelledBy) {
    const labelElement = document.getElementById(ariaLabelledBy);
    // ...
}

// Strategy 3: Parent <label> element
const parentLabel = element.closest('label');
// Extract only direct text nodes (not child elements)

// Strategy 4: Next sibling label (for radio/checkbox)
const nextLabel = element.nextElementSibling;
if (nextLabel && nextLabel.tagName === 'LABEL') { ... }

// Strategy 5: aria-label, placeholder, title attributes
labelText = element.getAttribute('aria-label') || element.placeholder || element.getAttribute('title');

// Strategy 6: Previous sibling (LABEL, SPAN, or DIV)
const prevSibling = element.previousElementSibling;

// Strategy 7: Ancestor container with class containing "field", "form-group", "input"
const parent = element.closest('div[class*="field"], div[class*="form-group"], div[class*="input"]');
```

This multi-strategy approach works on virtually any website, whether it follows HTML best practices or not.

#### Step 7: Extract Select Options
```javascript
if (fieldType === 'select') {
    options = Array.from(element.options)
        .filter(opt => opt.value)
        .map(opt => opt.text.trim());
}
```
- For dropdown `<select>` elements, extracts all option texts.
- **Token optimization**: If there are more than 10 options, only the first 5 are sent (to save API tokens), but the total `optionCount` is included.

#### Step 8: Build the Field Object
```javascript
const fieldInfo = {
    id: fieldId,           // Unique identifier to find the element later
    name: fieldName,       // The name attribute
    type: fieldType,       // "text", "select", "textarea", "radio", "checkbox", "number", "date", etc.
    label: labelText       // Human-readable label like "First Name"
};
// Conditional properties (only if they have values):
if (element.placeholder) fieldInfo.placeholder = element.placeholder;
if (currentValue) fieldInfo.currentValue = currentValue;
if (options.length > 0) fieldInfo.options = options;
if (element.classList.contains('select2-hidden-accessible')) fieldInfo.isSelect2 = true;
```
- Only includes non-empty optional properties to reduce JSON payload size (important since this gets sent to GPT-4.1 and costs tokens).

#### Example Output:
```json
[
  { "id": "cfname", "name": "cfname", "type": "text", "label": "First Name", "placeholder": "First Name" },
  { "id": "ipc_bns", "name": "ipc_bns", "type": "radio", "label": "ipc_bns", "options": ["BNS", "IPC"] },
  { "id": "case_no", "name": "case_no", "type": "number", "label": "Case No :", "currentValue": "54" },
  { "id": "accused_district", "name": "accused_district", "type": "select", "label": "District", "options": ["Alipurduar", "Bankura", ...], "isSelect2": true }
]
```

---

### 6.8 `formFiller.js` — Form Field Filling (Deep Dive)

**Purpose:** Takes a dictionary of `{ fieldId: value }` pairs and fills the corresponding form elements on the web page.

#### Non-Latin Digit Conversion
```javascript
const NON_LATIN_DIGIT_MAP = {
    '০':'0', '১':'1', ... // Bengali
    '०':'0', '१':'1', ... // Devanagari
    '٠':'0', '١':'1', ... // Arabic-Indic
};

function toAsciiDigits(str) {
    return String(str).replace(/[^\x00-\x7F]/g, ch => NON_LATIN_DIGIT_MAP[ch] || ch);
}
```
- Some HTML input types (number, tel, date) **only accept ASCII digits**. If GPT returns Bengali digits for a phone number, they must be converted first.

#### Element Finding Strategy
```javascript
let element = document.getElementById(fieldId) || 
             document.querySelector(`[name="${fieldId}"]`) ||
             document.querySelector(`[data-testid="${fieldId}"]`) ||
             document.querySelector(`[data-field="${fieldId}"]`) ||
             document.querySelector(`[aria-labelledby="${fieldId}"]`) ||
             document.querySelector(`.${fieldId}`);
```
- Tries multiple selectors to find the element, matching the same cascade used during extraction.

#### Smart Scrolling
```javascript
if (!hasScrolled) {
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    hasScrolled = true;
}
```
- Smoothly scrolls the page to the first filled field, so the user can see the results.

#### Filling by Element Type:

**SELECT (Dropdowns):**
```javascript
if (element.tagName.toLowerCase() === 'select') {
    const options = Array.from(element.options);
    const valLower = String(value).toLowerCase();
    
    // 1. Exact value match
    let matchingOption = options.find(opt => opt.value.toLowerCase() === valLower);
    // 2. Exact text match
    if (!matchingOption) matchingOption = options.find(opt => opt.text.toLowerCase() === valLower);
    // 3. Partial text match (includes)
    if (!matchingOption) matchingOption = options.find(opt => opt.text.toLowerCase().includes(valLower));
    // 4. Word-overlap fuzzy match
    if (!matchingOption && valLower.length > 2) {
        // Compare word-by-word for best overlap
    }
    
    if (matchingOption) {
        element.value = matchingOption.value;
        element.dispatchEvent(new Event('change', { bubbles: true }));
    }
}
```
- Uses a **4-level matching strategy** (exact value → exact text → partial text → word overlap) to handle cases where GPT's output doesn't exactly match the dropdown option text.
- Example: GPT says "Arms Act" but the dropdown has "Arms Act, 1959" — partial matching handles this.

**CHECKBOX & RADIO:**
```javascript
if (element.type === 'checkbox' || element.type === 'radio') {
    const isBooleanTrue = ['yes', 'true', '1', 'on'].includes(valStr);
    const isBooleanFalse = ['no', 'false', '0', 'off'].includes(valStr);
    
    // For groups: find the right option by matching value or label text
    if (group.length > 1) {
        // Match by value attribute
        for (const input of group) {
            if (input.value.toLowerCase() === valStr) { targetElement = input; break; }
        }
        // Match by associated label text
        for (const input of group) {
            let labelText = /* find label */;
            if (labelText.includes(valStr)) { targetElement = input; break; }
        }
    }
    
    // Apply the change
    if (!isBooleanFalse) {
        targetElement.checked = true;
        targetElement.dispatchEvent(new Event('click', { bubbles: true }));
        targetElement.dispatchEvent(new Event('change', { bubbles: true }));
    }
}
```
- For radio groups (e.g., "Male" / "Female"), finds the specific radio button whose label matches the value.
- Falls back to class-based grouping for non-standard radio implementations.

**TEXT INPUTS & TEXTAREA:**
```javascript
let fillValue = requiresAsciiValue(element) ? toAsciiDigits(value) : value;

// Special formatting
if (element.type === 'date') fillValue = formatDate(fillValue, true);
if (element.classList.contains('timepicker')) fillValue = formatTime(fillValue);

element.value = fillValue;

// Native setter for React/Angular/Vue compatibility
const nativeSetter = Object.getOwnPropertyDescriptor(
    window[element.constructor.name]?.prototype, 'value'
)?.set;
if (nativeSetter) nativeSetter.call(element, element.value);

element.dispatchEvent(new Event('input', { bubbles: true }));
element.dispatchEvent(new Event('change', { bubbles: true }));
element.dispatchEvent(new Event('blur', { bubbles: true }));
```

**Why the native setter trick?**
Modern JavaScript frameworks (React, Angular, Vue) intercept property changes via `Object.defineProperty`. Simply setting `element.value = "..."` directly bypasses their setters, so the framework doesn't know the value changed. By calling the **native HTMLInputElement prototype's setter**, we ensure the framework's virtual DOM is properly notified.

**Date formatting (`formatDate`):**
- Accepts ISO (`2026-01-15`), DD/MM/YYYY (`15/01/2026`), MM/DD/YYYY formats.
- Converts to `DD/MM/YYYY` for text inputs or `YYYY-MM-DD` for HTML5 date inputs.

**Time formatting (`formatTime`):**
- Accepts `2:30 PM`, `14:30`, etc.
- Converts to 24-hour `HH:MM` format for HTML5 time inputs.

---

### 6.9 `audioRecorder.js` — Microphone Recording

**Purpose:** Handles microphone access and audio recording using the Web Audio API.

**State variables:**
```javascript
let mediaRecorder = null;   // MediaRecorder instance
let audioChunks = [];        // Array of recorded audio data chunks
let audioStream = null;      // The microphone audio stream
```

**`startRecording()`:**
```javascript
async function startRecording() {
    audioChunks = [];
    audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder = new MediaRecorder(audioStream);
    
    mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunks.push(event.data);
    };
    
    mediaRecorder.start();
}
```
1. Clears any previous recording data.
2. Requests microphone access (browser shows permission prompt if first time).
3. Creates a `MediaRecorder` from the audio stream.
4. Sets up `ondataavailable` callback to collect audio chunks.
5. Starts recording.

**`stopRecording()`:**
```javascript
async function stopRecording() {
    return new Promise((resolve, reject) => {
        mediaRecorder.onstop = async () => {
            // Stop all microphone tracks (releases the mic)
            audioStream.getTracks().forEach(track => track.stop());
            
            // Combine chunks into a single Blob
            const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
            
            // Convert Blob to base64 data URL for transmission
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.readAsDataURL(audioBlob);
        };
        
        mediaRecorder.stop();
    });
}
```
1. Sets up the `onstop` callback.
2. Calls `mediaRecorder.stop()` which triggers `onstop`.
3. Stops all audio tracks (frees the microphone).
4. Combines all chunks into a single `Blob` with MIME type `audio/webm`.
5. Converts the blob to a **base64 data URL** (e.g., `data:audio/webm;base64,GkXfo59C...`).

**Why base64?** Chrome's message passing API can only send JSON-serializable data (strings, numbers, objects). Binary Blob objects can't be sent directly. Base64 encoding converts the binary audio data to a string that can be passed through Chrome's messaging.

**`isRecording()`:**
```javascript
function isRecording() {
    return mediaRecorder && mediaRecorder.state === 'recording';
}
```
- Returns `true` if the microphone is currently recording. Used by the popup to restore UI state.

---

### 6.10 `background.js` — Background Service Worker (The Pipeline)

**Purpose:** This is the **main orchestrator** of the entire pipeline. It runs in the background (independent of any web page or popup), coordinates the full audio-to-form-fill workflow, and provides status updates.

**State management:**
```javascript
let processingState = {
    isProcessing: false,
    step: 'IDLE',    // IDLE, ANALYZING, CRAWLING, BRAIN, FILLING, SUCCESS, ERROR
    message: ''
};
```
- Tracks the current processing state. The popup reads this to show the correct UI.

**`updateState(step, message)`:**
```javascript
function updateState(step, message) {
    processingState = { isProcessing: ..., step, message };
    chrome.runtime.sendMessage({
        action: 'STATUS_UPDATE',
        state: processingState
    }).catch(() => {});
}
```
- Updates internal state and broadcasts it to the popup (if open). The `.catch(() => {})` silently handles the case where the popup is closed.

**Message listener:**
```javascript
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'GET_STATUS') sendResponse(processingState);
    if (request.action === 'PROCESS_AUDIO') {
        handleAudioProcessing(request.audioBlobData, request.tabId);
        return true; // async
    }
});
```

**`handleAudioProcessing(audioBlobData, tabId)` — The Full Pipeline:**

This is the heart of the entire system. Here's what happens step by step:

```javascript
async function handleAudioProcessing(audioBlobData, tabId) {
    try {
        // --- STEP 1: Convert base64 data URL back to a Blob ---
        updateState('ANALYZING', '🔍 Analyzing your voice...');
        const audioBlob = await (await fetch(audioBlobData)).blob();
```
- The base64 data URL is converted back to a binary Blob using the `fetch` API trick (`fetch("data:audio/webm;base64,...")` returns a Response that can be converted to a Blob).

```javascript
        // --- STEP 2: Extract form fields from the web page ---
        updateState('CRAWLING', '🐛 Crawling through the form...');
        const response = await chrome.tabs.sendMessage(tabId, { action: 'extractFields' });
        const formFields = response.fields;
        if (!formFields || formFields.length === 0) throw new Error('No form fields found');
```
- Sends a message to the content script to scan the page and extract all form fields.

```javascript
        // --- STEP 3: Prepare and send to backend ---
        updateState('BRAIN', '🧠 Activating AI brain...');
        const formData = new FormData();
        formData.append('audio_file', audioBlob, 'recording.webm');
        formData.append('form_data_json', JSON.stringify({ fields: formFields }));
        
        const backendUrl = CONFIG.BACKEND_URL + CONFIG.API_ENDPOINTS.process;
        const apiResponse = await fetch(backendUrl, { method: 'POST', body: formData });
        const result = await apiResponse.json();
```
- Constructs a `FormData` with the audio file and form fields JSON.
- Sends an HTTP POST request to the backend's `/api/process` endpoint.

```javascript
        // --- STEP 4: Fill the form fields ---
        updateState('FILLING', '✏️ Precision filling in progress...');
        try {
            await chrome.tabs.sendMessage(tabId, {
                action: 'fillFields',
                data: result.form_data
            });
        } catch (fillError) {
            // Fallback: inject script directly
            await chrome.scripting.executeScript({
                target: { tabId: tabId },
                func: (data) => { /* inline form filling code */ },
                args: [result.form_data]
            });
        }
```
- Sends the AI's result to the content script to fill the form.
- **Fallback mechanism**: If the content script messaging fails (can happen if the page reloaded or the content script was unloaded), it uses `chrome.scripting.executeScript()` to inject a form-filling function directly into the page. This fallback function also uses native setters for framework compatibility.

```javascript
        updateState('SUCCESS', '🎉 All fields filled perfectly!');
    } catch (error) {
        updateState('ERROR', `Error: ${error.message}`);
    }
}
```
- On success, broadcasts "SUCCESS" state. On any error, broadcasts "ERROR" with the error message.

**Deliberate delays (`await new Promise(resolve => setTimeout(resolve, ...))`):**
The status updates include artificial delays (1.5-2.5 seconds) between steps. These serve two purposes:
1. Give the user visual feedback that something is happening at each stage.
2. Prevent the UI from flashing through all states too quickly for the user to read.

---

### 6.11 `styles.css` — Visual Styling

**Purpose:** Styles the popup UI with a modern, clean design.

**Key visual elements:**
- **Header**: Blue gradient background (`#4f46e5` to `#3b82f6`) with white text and a custom SVG form icon.
- **Status indicator**: A small circle that's gray when idle and red with a pulsing ripple animation when recording:
  ```css
  @keyframes ripple {
      0% { transform: scale(1); opacity: 1; }
      100% { transform: scale(2.5); opacity: 0; }
  }
  ```
- **Buttons**: Rounded buttons with hover effects that slightly lift (`translateY(-1px)`) and gain a shadow.
- **Disabled state**: Buttons become semi-transparent and lose pointer events.
- **Error text**: Red colored text for error messages.
- **Transcript area**: Gray background with rounded corners for displaying results.

---

## 7. The Chrome Extension Communication Architecture

The extension uses Chrome's messaging system to communicate between its three execution contexts:

```
┌─────────────────┐      chrome.tabs.sendMessage()      ┌─────────────────────┐
│                 │ ──────────────────────────────────→ │                     │
│   popup.js      │      (action: startRecording)       │   content_script.js │
│   (Popup UI)    │ ←────────────────────────────────── │   (Web Page)        │
│                 │      sendResponse({ success })      │                     │
└────────┬────────┘                                     └──────────┬──────────┘
         │                                                         │
         │ chrome.runtime.sendMessage()                            │
         │ (action: PROCESS_AUDIO, audioBlob)                      │
         ↓                                                         │
┌─────────────────┐      chrome.tabs.sendMessage()                 │
│                 │ ───────────────────────────────────────────────→│
│  background.js  │      (action: extractFields / fillFields)      │
│  (Service       │ ←─────────────────────────────────────────────│
│   Worker)       │      sendResponse({ fields / status })        │
│                 │                                                │
│                 │──── fetch(backend_url) ────→ Backend Server    │
│                 │←── { form_data: {...} } ──── Backend Server    │
└─────────────────┘
```

**Message types summary:**
| From | To | Action | Purpose |
|------|----|--------|---------|
| popup.js | content_script.js | `startRecording` | Begin microphone capture |
| popup.js | content_script.js | `stopRecording` | Stop capture, get audio |
| popup.js | content_script.js | `getRecordingStatus` | Check if still recording |
| popup.js | background.js | `PROCESS_AUDIO` | Hand off audio for processing |
| popup.js | background.js | `GET_STATUS` | Get current processing state |
| background.js | content_script.js | `extractFields` | Scan page for form fields |
| background.js | content_script.js | `fillFields` | Fill forms with AI data |
| background.js | popup.js | `STATUS_UPDATE` | Broadcast processing progress |

---

## 8. How Form Extraction Works (Technical Deep Dive)

When `formExtractor.js` runs `extractFormFields()`, here is the exact decision tree for each element:

```
For each <input>, <select>, <textarea> on the page:
│
├── Is type hidden/submit/button/reset/image? → SKIP
│
├── Is element visually hidden?
│   ├── Yes, but has class "select2-hidden-accessible" → CONTINUE (it's a Select2 dropdown)
│   └── Yes, and it's not Select2 → SKIP
│
├── Is it a radio button with a name attribute?
│   ├── Already processed this radio group name? → SKIP
│   └── First time seeing this name:
│       ├── Find all radios with same name
│       ├── For each radio, find its label text
│       ├── Build options array ["Male", "Female", "Other"]
│       └── Push single field with type="radio" and options array
│
├── Generate unique field ID (id → name → data-testid → data-field → aria-labelledby → field_N)
│
├── Already seen this ID? → SKIP (deduplication)
│
├── Detect label using 7-strategy cascade
│
├── If <select>: extract option texts (max 10, else first 5 + count)
│
├── Capture current value (text value, or "checked"/"unchecked" for checkboxes)
│
└── Push { id, name, type, label, [placeholder], [currentValue], [options], [isSelect2] }
```

**Why the label detection is 7 strategies deep:**
Different websites structure their HTML differently:
- Well-structured sites use `<label for="fieldId">`.
- Accessible sites use `aria-labelledby`.
- Bootstrap/Material sites wrap inputs inside `<label>`.
- Some sites put labels as previous siblings.
- Fallback: use the placeholder text.
- Last resort: look at the parent `div.form-group` container.

---

## 9. How Form Filling Works (Technical Deep Dive)

When `formFiller.js` runs `fillFormFields(fieldData)`, here is the exact process:

```
For each { fieldId: value } in the data:
│
├── Is value null/undefined/empty/"null"? → SKIP
│
├── Find DOM element by: id → name → data-testid → data-field → aria-labelledby → class
│
├── Element not found? → console.warn and SKIP
│
├── First element being filled? → Scroll into view (smooth)
│
├── What type of element is it?
│   │
│   ├── <SELECT> (Dropdown):
│   │   ├── Try exact value match
│   │   ├── Try exact text match
│   │   ├── Try partial text match (includes)
│   │   ├── Try word-overlap fuzzy match
│   │   ├── If match found: set element.value and dispatch change event
│   │   └── If no match: do nothing (leave unchanged)
│   │
│   ├── CHECKBOX / RADIO:
│   │   ├── Is value a boolean? (yes/true/1/on vs no/false/0/off)
│   │   ├── Find the correct element in the group:
│   │   │   ├── By matching value attribute
│   │   │   ├── By matching label text
│   │   │   └── By class-based grouping (fallback)
│   │   ├── If false + checkbox: uncheck it
│   │   └── Otherwise: check it + dispatch click/change events
│   │
│   └── TEXT / TEXTAREA / NUMBER / DATE / TEL / etc:
│       ├── Needs ASCII digits? (number, tel, date) → convert non-Latin digits
│       ├── Is timepicker → format to HH:MM
│       ├── Is date field → format to DD/MM/YYYY or YYYY-MM-DD
│       ├── Set element.value
│       ├── Call native setter (for React/Angular/Vue compatibility)
│       └── Dispatch input + change + blur events
```

**Framework compatibility (the native setter trick) explained in detail:**

React, Angular, and Vue override the `value` property setter on input elements. When you do `element.value = "something"`, it calls their custom setter, but in some cases (especially React), the custom setter can prevent the value from being recognized by the framework's state management.

The solution:
```javascript
const proto = window[element.constructor.name]?.prototype;
const nativeSetter = proto ? Object.getOwnPropertyDescriptor(proto, 'value')?.set : null;
if (nativeSetter) nativeSetter.call(element, element.value);
```

This gets the **original** `HTMLInputElement.prototype.value` setter (before React/Angular overwrote it) and calls it directly. Then dispatching `input` and `change` events notifies the framework that the value actually changed.

---

## 10. How the AI Processes Voice to Form Data

The AI processing happens in two stages:

### Stage 1: Speech → Text (Whisper)

```
User's voice → MediaRecorder → WebM audio blob → Backend → Whisper Model → Raw text
"my name is raju das father name gopal das age thirty five address twelve mg road kolkata"
```

**Whisper** is an open-source speech recognition model by OpenAI. The project uses **Faster-Whisper**, which is a CTranslate2-optimized implementation that runs 4x faster than the original.

The `base` model (default) offers a good balance between speed and accuracy. Larger models (`small`, `medium`, `large`) are more accurate but slower.

### Stage 2: Text → Form Mapping (GPT-4.1)

```
Raw text + Form field JSON → GPT-4.1 → { fieldId: value } mapping
```

GPT-4.1 receives:
1. The raw transcribed text
2. A JSON description of every form field (with IDs, types, labels, options)
3. Detailed instructions (the prompt from `prompts.py`)

It outputs structured JSON mapping each field ID to the correct value, with:
- Spelling corrections applied
- Speech artifacts converted (e.g., "at the rate" → "@")
- Proper formatting per field type
- Language preservation (Bengali stays Bengali)
- Only mentioned fields included

### LangChain Pipeline:
```
PromptTemplate → ChatOpenAI (GPT-4.1) → JsonOutputParser
       ↓                    ↓                    ↓
 "You are an          Sends to                Parses the
  intelligent          OpenAI API              JSON response
  form-filling         and gets                into a Python
  assistant..."        raw response            dictionary
```

---

## 11. Multi-Language Support — How It Works

The system supports multilingual form filling at every stage:

1. **Whisper** can transcribe audio in many languages (English, Bengali, Hindi, Spanish, etc.). The `language="en"` parameter is a hint but Whisper can auto-detect.

2. **The prompt** explicitly instructs GPT-4.1:
   > "If the user speaks in Bengali (or any non-English language), output ALL field values in the SAME language and script. Do not translate to English."

3. **`field_processor.py`** handles non-Latin digits:
   - Bengali: ০১২৩৪৫৬৭৮৯ → 0123456789
   - Devanagari: ०१२३४५६७८९ → 0123456789
   - Arabic-Indic: ٠١٢٣٤٥٦٧٨٩ → 0123456789

4. **`formFiller.js`** in the Chrome Extension also has its own non-Latin digit converter for fields that require ASCII (phone numbers, dates).

**Example Bengali flow:**
- User says: "আমার নাম রাজু দাস, বয়স ৩৫, ঠিকানা ১২ এমজি রোড কলকাতা"
- Whisper transcribes: "আমার নাম রাজু দাস বয়স ৩৫ ঠিকানা ১২ এমজি রোড কলকাতা"
- GPT-4.1 maps: `{ "cfname": "রাজু", "clname": "দাস", "cage": "৩৫", "caddress": "১২ এমজি রোড, কলকাতা" }`
- `field_processor.py` converts age: `"৩৫"` → `"35"` (because age field needs digits)
- `formFiller.js` fills the form with Bengali text for text fields and ASCII digits for number fields.

---

## 12. Error Handling & Edge Cases

### Backend Errors
| Error | Where Handled | What Happens |
|-------|---------------|--------------|
| Invalid JSON in form_data | `routes.py` | Returns `success=false` with message |
| Whisper model not loaded | `whisper_service.py` | Raises RuntimeError |
| OpenAI API key missing | `openai_service.py` | Raises ValueError on startup |
| Transcription fails | `routes.py` | Returns error response, temp file still cleaned |
| GPT returns bad JSON | `openai_service.py` | LangChain parser retries, else returns `{}` |
| GPT wraps response oddly | `openai_service.py` | Resilient unwrapping logic handles it |

### Chrome Extension Errors
| Error | Where Handled | What Happens |
|-------|---------------|--------------|
| Microphone permission denied | `audioRecorder.js` | Error propagated to popup, shown to user |
| No form fields on page | `background.js` | Shows error "No form fields found" |
| Backend unreachable | `background.js` | Shows error with HTTP status |
| Content script not loaded | `background.js` | Falls back to `chrome.scripting.executeScript()` |
| Popup closed during processing | `background.js` | Processing continues in background |
| Field not found on page | `formFiller.js` | `console.warn` and skips to next field |
| Dropdown option not matching | `formFiller.js` | Falls through 4-level matching, skips if no match |

### Edge Cases Handled
- **Select2 dropdowns**: Hidden native `<select>` elements are still extracted.
- **Duplicate field IDs**: Tracked with `seenFields` Set.
- **Large dropdown lists**: Truncated to 5 options + count to save API tokens.
- **React/Angular/Vue forms**: Native setter + event dispatching ensures compatibility.
- **Non-Latin digits in numeric fields**: Converted to ASCII on both backend and frontend.
- **User didn't mention some fields**: GPT only returns mentioned fields, empty fields are skipped.

---

## 13. Sequence Diagram — Complete Flow

```
┌──────┐     ┌─────────┐     ┌───────────────┐     ┌──────────────┐     ┌─────────┐
│ User │     │ Popup   │     │ Background    │     │ Content      │     │ Backend │
│      │     │ (popup  │     │ (background   │     │ Script       │     │ Server  │
│      │     │  .js)   │     │  .js)         │     │ (content_    │     │(FastAPI)│
│      │     │         │     │               │     │  script.js)  │     │         │
└──┬───┘     └────┬────┘     └──────┬────────┘     └──────┬───────┘     └────┬────┘
   │              │                  │                     │                  │
   │ Click Start  │                  │                     │                  │
   │─────────────→│                  │                     │                  │
   │              │ startRecording   │                     │                  │
   │              │──────────────────┼────────────────────→│                  │
   │              │                  │                     │ getUserMedia()   │
   │              │                  │                     │ MediaRecorder    │
   │              │                  │                     │ .start()         │
   │              │ { success }      │                     │                  │
   │              │←─────────────────┼─────────────────────│                  │
   │              │                  │                     │                  │
   │ 🎤 Speaking  │                  │                     │ Recording...     │
   │ ░░░░░░░░░░░ │                  │                     │ collecting       │
   │              │                  │                     │ audio chunks     │
   │              │                  │                     │                  │
   │ Click Stop   │                  │                     │                  │
   │─────────────→│                  │                     │                  │
   │              │ stopRecording    │                     │                  │
   │              │──────────────────┼────────────────────→│                  │
   │              │                  │                     │ MediaRecorder    │
   │              │                  │                     │ .stop()          │
   │              │                  │                     │ Blob→base64     │
   │              │ { audioBlob }    │                     │                  │
   │              │←─────────────────┼─────────────────────│                  │
   │              │                  │                     │                  │
   │              │ PROCESS_AUDIO    │                     │                  │
   │              │ + audioBlob      │                     │                  │
   │              │ + tabId          │                     │                  │
   │              │─────────────────→│                     │                  │
   │              │                  │                     │                  │
   │              │ (popup can close)│                     │                  │
   │              │                  │                     │                  │
   │              │                  │ 🔍 ANALYZING        │                  │
   │              │                  │ base64→Blob         │                  │
   │              │                  │                     │                  │
   │              │                  │ extractFields       │                  │
   │              │                  │────────────────────→│                  │
   │              │                  │                     │ Scan DOM         │
   │              │                  │                     │ Extract fields   │
   │              │                  │ { fields: [...] }   │ Find labels      │
   │              │                  │←────────────────────│                  │
   │              │                  │                     │                  │
   │              │                  │ 🧠 AI BRAIN         │                  │
   │              │                  │ POST /api/process   │                  │
   │              │                  │ audio + fields JSON │                  │
   │              │                  │────────────────────────────────────────→│
   │              │                  │                     │                  │
   │              │                  │                     │        Whisper:  │
   │              │                  │                     │        Audio→Text│
   │              │                  │                     │                  │
   │              │                  │                     │        GPT-4.1:  │
   │              │                  │                     │        Text→Map  │
   │              │                  │                     │                  │
   │              │                  │                     │    field_processor│
   │              │                  │                     │    post-process  │
   │              │                  │                     │                  │
   │              │                  │ { success, form_data, transcribed_text }│
   │              │                  │←────────────────────────────────────────│
   │              │                  │                     │                  │
   │              │                  │ ✏️ FILLING           │                  │
   │              │                  │ fillFields + data   │                  │
   │              │                  │────────────────────→│                  │
   │              │                  │                     │ For each field:  │
   │              │                  │                     │ Find element     │
   │              │                  │                     │ Set value        │
   │              │                  │                     │ Dispatch events  │
   │              │                  │ { status: filled }  │                  │
   │              │                  │←────────────────────│                  │
   │              │                  │                     │                  │
   │              │ STATUS_UPDATE    │                     │                  │
   │              │ step: SUCCESS    │                     │                  │
   │              │←─────────────────│                     │                  │
   │              │                  │                     │                  │
   │ Form is      │                  │                     │                  │
   │ filled! ✅   │                  │                     │                  │
   │              │                  │                     │                  │
```

---

## Summary

This project combines:
- **Chrome Extension APIs** (content scripts, background workers, messaging) to interact with web pages
- **Web Audio API** (MediaRecorder) to capture microphone audio
- **DOM manipulation** (QuerySelector, event dispatching) to extract and fill forms
- **FastAPI** (Python web framework) for the REST API backend
- **Faster-Whisper** (speech-to-text) to transcribe voice in any language
- **GPT-4.1** (large language model) to intelligently map voice data to form fields
- **LangChain** (LLM orchestration) to structure prompts and parse outputs
- **Pydantic** (data validation) to ensure clean request/response schemas

The result is a system where a user speaks naturally, and AI fills an entire web form in seconds — in any language, on any website, with intelligent error correction and framework compatibility.
