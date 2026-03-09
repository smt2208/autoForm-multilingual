# FormFiller — Multilingual Voice Form Automation

> A privacy-first AI agent that fills web forms using your voice — in any language, including Bengali (বাংলা).

---

## 📌 What Does This Project Do?

Imagine you have a long web form — a government registration form, a police FIR form, a job application — with 20+ fields. Instead of typing everything by hand, you:

1. **Click the extension icon** in Chrome.
2. **Speak naturally** — *"My name is Raju Das, age 35, email raju at gmail dot com, mobile 9876543210"*
3. The system **listens**, **understands**, and **fills every field automatically**.

It works on **any website** with a standard HTML form. No training, no configuration per site needed.

---

## 🌐 Multilingual Support — Speak in Bengali!

This is a core feature of the project. You can speak in **Bengali (বাংলা)** and the form will be filled in Bengali script automatically.

**How it works:**
- The speech engine (Whisper) always transcribes audio to English text — even if you speak Bengali. So *"রাজু দাস"* becomes `"raju das"` in the transcript.
- The AI (Google Gemini) then intelligently detects your language intent and maps the phonetic English back to the correct Bengali script.

**To fill a form in Bengali**, simply say anywhere in your speech:
- *"I am speaking in Bengali"*
- *"Fill in Bengali"*
- *"Write it in Bengali"*
- *"In Bengali please"*

The AI will then write all text fields (names, addresses, descriptions) in Bengali script (e.g., `রাজু দাস`, `কলকাতা`), while keeping technical fields like email, phone numbers, dates, and dropdown options unchanged.

> **উদাহরণ (Example):**
> আপনি বললেন: *"fill in Bengali, my name is raju das, address kolkata"*
> ফলাফল: নাম ঘরে লেখা হবে **রাজু দাস**, ঠিকানা ঘরে লেখা হবে **কলকাতা**।

---

## 🗺️ Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│               CHROME EXTENSION                      │
│  popup.html/js  ←→  background.js  ←→  content_script.js  │
│                          │         ↕ formExtractor.js      │
│                          │         ↕ formFiller.js         │
│                          │  audioRecorder.js               │
│                          ↓                                  │
│                    HTTP POST /api/process                   │
└──────────────────┬──────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────┐
│               BACKEND (FastAPI)                     │
│  api/routes.py                                      │
│       ├── whisper_service.py  (Voice → Text)        │
│       └── gemini_service.py   (Text → Form Fields)  │
│               └── config/prompts.py  (AI Prompt)    │
│               └── utils/field_processor.py (Clean)  │
└─────────────────────────────────────────────────────┘
```

**Pipeline in plain English:**
1. Extension captures your voice from the microphone.
2. Extension scans the web page and extracts all form fields (IDs, labels, types, options).
3. Both the audio and form structure are sent to the backend.
4. **Whisper** (running locally on your machine) converts speech to text.
5. **Google Gemini** reads the transcription + form fields and returns a JSON mapping each field to its value.
6. Extension fills the form fields on the page.

---

## 🛠️ Tech Stack

| Component | Technology |
|-----------|------------|
| Backend | Python 3.10+, FastAPI, Uvicorn |
| Speech-to-Text | Faster-Whisper (runs **locally**, no API) |
| LLM / AI Brain | Google Gemini (`gemini-3.1-flash-lite-preview`) via LangChain |
| Chrome Extension | Manifest V3, Vanilla JavaScript, HTML/CSS |
| Configuration | Pydantic Settings, python-dotenv |

---

## 📦 Setup & Installation

### Prerequisites

- **Python 3.10 or higher**
- **Google Chrome** (or any Chromium-based browser)
- **Google Gemini API key** — get one free at [Google AI Studio](https://aistudio.google.com/app/apikey)
- (Optional) A CUDA-compatible GPU for faster Whisper transcription

---

### Step 1 — Clone the Repository

```bash
git clone https://github.com/yourusername/autoForm_multilingual.git
cd autoForm_multilingual
```

---

### Step 2 — Create a Virtual Environment

```bash
# Create
python -m venv venv

# Activate — Windows
.\venv\Scripts\activate

# Activate — Linux / macOS
source venv/bin/activate
```

---

### Step 3 — Install Python Dependencies

```bash
pip install -r requirements.txt
```

> **Note:** The first run will also download the Whisper model (around 1.5 GB for `medium`). This happens automatically.

---

### Step 4 — Create the `.env` File

Create a file named `.env` in the project root with the following:

```env
# Required
GOOGLE_API_KEY=your_google_gemini_api_key_here

# Optional — override defaults
GOOGLE_MODEL=gemini-3.1-flash-lite-preview
WHISPER_MODEL=medium
WHISPER_DEVICE=cpu
PORT=8000
DEBUG=false
```

| Variable | Default | Description |
|----------|---------|-------------|
| `GOOGLE_API_KEY` | *(required)* | Your Google Gemini API key |
| `GOOGLE_MODEL` | `gemini-3.1-flash-lite-preview` | Gemini model to use for field mapping |
| `WHISPER_MODEL` | `medium` | Whisper model size (`tiny`, `base`, `small`, `medium`, `large`) |
| `WHISPER_DEVICE` | `cpu` | `cpu` or `cuda` (if you have a GPU) |
| `PORT` | `8000` | Port the backend server listens on |
| `DEBUG` | `false` | Enable verbose debug logging |

---

### Step 5 — Start the Backend Server

```bash
python main.py
```

You should see:
```
INFO: Starting FormFiller server...
INFO: Server will run at http://0.0.0.0:8000
INFO: API documentation available at http://0.0.0.0:8000/docs
INFO: Initializing AI models...
INFO: Whisper model loaded successfully
INFO: Google model loaded successfully
```

The server is now running at **`http://localhost:8000`**.
Interactive API docs (Swagger UI) are at **`http://localhost:8000/docs`**.

---

### Step 6 — Load the Chrome Extension

1. Open Chrome and go to `chrome://extensions`
2. Enable **Developer mode** (top-right toggle)
3. Click **Load unpacked**
4. Select the `chrome_extension/` folder from this project
5. The FormFiller icon appears in your Chrome toolbar

---

### Step 7 — Configure the Extension's Backend URL

Open `chrome_extension/config.js` and set the `BACKEND_URL` to where your backend is running:

```js
const CONFIG = {
    // For local development:
    BACKEND_URL: 'http://localhost:8000',

    // For cloud deployment (e.g., Azure):
    // BACKEND_URL: 'https://your-app.azurewebsites.net',
};
```

---

## 🚀 Using the Extension

1. Navigate to any website with a form.
2. Click the **FormFiller extension icon** in Chrome.
3. Click **Start Recording** 🎤 and speak your information clearly.
   - English: *"My name is Alice Smith, email alice at example dot com, phone 9876543210"*
   - Bengali: *"fill in Bengali, name Raju Das, address 12 MG Road Kolkata"*
4. Click **Stop Recording** ⏹️.
5. Watch the form fill itself automatically!

---

## ☁️ Cloud Deployment (API Reference)

If the backend is deployed on a cloud platform (e.g., Azure App Service, Railway, Render, Google Cloud Run), the Chrome extension can point to it directly — no local server needed.

### Updating the Extension for Cloud

Edit `chrome_extension/config.js`:
```js
BACKEND_URL: 'https://your-deployed-backend.azurewebsites.net'
```

---

### API Endpoints

All endpoints are relative to your `BACKEND_URL`.

---

#### `GET /` — Root / Status Check

Confirms the server is running.

**Request:**
```http
GET https://your-backend-url/
```

**Response:**
```json
{
  "name": "FormFiller",
  "version": "0.1.0",
  "status": "running",
  "message": "FormFiller backend is active. Send POST requests to /api/process"
}
```

---

#### `GET /health` — Health Check

Returns the current model configuration. Useful for cloud platform health probes.

**Request:**
```http
GET https://your-backend-url/health
```

**Response:**
```json
{
  "status": "healthy",
  "model": "medium",
  "device": "cpu"
}
```

---

#### `POST /api/process` — Main Endpoint

Processes the audio and returns mapped form field values. This is the only endpoint the Chrome extension uses.

**Request** (`multipart/form-data`):

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `audio_file` | File | ✅ Yes | Audio recording (WAV, MP3, OGG, WebM, etc.) |
| `form_data_json` | String | ⬜ Optional | JSON string describing the form fields |

The `form_data_json` is a JSON array of field objects. Example:
```json
[
  {
    "id": "first_name",
    "label": "First Name",
    "type": "text",
    "placeholder": "Enter your first name"
  },
  {
    "id": "gender",
    "label": "Gender",
    "type": "radio",
    "options": ["Male", "Female", "Other"]
  },
  {
    "id": "country",
    "label": "Country",
    "type": "select",
    "options": ["India", "Bangladesh", "United States"]
  }
]
```

**Example — cURL:**
```bash
curl -X POST "https://your-backend-url/api/process" \
  -F "audio_file=@/path/to/recording.wav" \
  -F 'form_data_json=[{"id":"first_name","label":"First Name","type":"text"},{"id":"email","label":"Email","type":"email"}]'
```

**Example — Python:**
```python
import requests

with open("recording.wav", "rb") as f:
    response = requests.post(
        "https://your-backend-url/api/process",
        files={"audio_file": ("recording.wav", f, "audio/wav")},
        data={
            "form_data_json": '[{"id":"first_name","label":"First Name","type":"text"}]'
        }
    )

print(response.json())
```

**Response:**
```json
{
  "success": true,
  "transcribed_text": "my name is alice smith email alice at example dot com",
  "form_data": {
    "first_name": "Alice Smith",
    "email": "alice@example.com"
  },
  "message": "Audio processed and form fields mapped successfully"
}
```

**Error Response:**
```json
{
  "success": false,
  "transcribed_text": "",
  "form_data": {},
  "message": "Error processing audio: <error details>"
}
```

---

### Deploying on Azure App Service

1. Create an Azure App Service with a Python runtime.
2. Set the following **Application Settings** (equivalent to `.env`):
   - `GOOGLE_API_KEY` = your key
   - `WHISPER_MODEL` = `small` *(use a smaller model on cloud to save memory)*
   - `WHISPER_DEVICE` = `cpu`
3. Deploy your code (via GitHub Actions, Azure CLI, or ZIP deploy).
4. Set the **startup command** to: `python main.py`
5. Update `chrome_extension/config.js` with your Azure URL.

> **Tip:** Whisper's `medium` model needs ~2 GB RAM. Use `small` or `base` on free/cheap cloud tiers.

---

## ✅ Works Well For

- Standard contact / registration forms
- Government / civic forms
- Survey and questionnaire forms
- Exam / test registration portals
- Any form with predictable HTML field structure

## ⚠️ Known Limitations

- Forms with heavy real-time JavaScript validation may not fill correctly.
- Multi-page forms (wizard-style, step-by-step) — only the current visible step is processed.
- Extremely complex conditional logic forms may have partial fills.
- Whisper transcription accuracy depends on audio quality and microphone.

---

## 🛡️ Privacy

| Component | Where it runs | Data sent externally? |
|-----------|--------------|----------------------|
| Voice recording | Your browser | No |
| Whisper (Speech-to-Text) | Your machine (local) | **No** — fully offline |
| Google Gemini (LLM) | Google's API | Only the **text transcription** + field labels are sent — no raw audio |

Your voice audio **never leaves your machine**. Only the plain text transcription is sent to Google Gemini for field mapping.

---

## 📁 Project Structure

```
autoForm_multilingual/
├── main.py                    # FastAPI app entry point
├── requirements.txt           # Python dependencies
├── .env                       # Your API keys (create this — not committed)
│
├── api/
│   └── routes.py              # POST /api/process endpoint
│
├── config/
│   ├── settings.py            # Environment variable config
│   └── prompts.py             # AI prompt for Gemini (multilingual logic lives here)
│
├── services/
│   ├── whisper_service.py     # Faster-Whisper speech-to-text
│   └── gemini_service.py      # Google Gemini LLM field mapping
│
├── models/
│   └── models.py              # Pydantic data models
│
├── utils/
│   ├── field_processor.py     # Post-processing: normalize emails, phones, booleans
│   ├── file_handler.py        # Temporary file utilities
│   └── logger.py              # Rotating file logger
│
├── chrome_extension/
│   ├── manifest.json          # Extension metadata & permissions
│   ├── config.js              # Backend URL configuration ← change this for cloud
│   ├── popup.html / popup.js  # Extension popup UI
│   ├── background.js          # Service worker: orchestrates the pipeline
│   ├── content_script.js      # Injected into pages: coordinates extraction & filling
│   ├── formExtractor.js       # Scans DOM for form fields
│   ├── formFiller.js          # Fills form fields on the page
│   └── audioRecorder.js       # Microphone capture
│
└── assets/
    └── PROJECT_DOCUMENTATION.md  # Detailed technical documentation
```

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.