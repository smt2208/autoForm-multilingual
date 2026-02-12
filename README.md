# AutoForm - Privacy-First Voice Form Filler

AutoForm is a browser extension that automates web form filling using voice commands. It leverages AI models to transcribe speech and intelligently map your intent to form fields.

## 🚀 Key Features

*   **Voice-Powered**: Simply speak to fill out forms.
*   **Intelligent Mapping**: Uses LLMs to understand context and map your speech to the correct fields (e.g., "My name is John" -> fills `First Name` field).
*   **Universal Compatibility**: Works on any website with standard HTML forms.

## 🛠️ Tech Stack

*   **Backend**: Python, FastAPI, Uvicorn
*   **Speech-to-Text**: Faster-Whisper (local inference)
*   **LLM**: OpenAI API
*   **Orchestration**: LangChain
*   **Frontend**: Chrome Extension (Manifest V3), JavaScript, HTML/CSS

## 📊 Architecture Flow

![AutoForm Architecture](assets/AutoForm%20Architecture.png)

## 📦 Installation

### Prerequisites
1.  **Python 3.10+** installed.
2.  **OpenAI API Key** (set in `.env` file).
3.  **Google Chrome** or a Chromium-based browser.

### 1. Backend Setup
```bash
# Clone the repository
git clone https://github.com/yourusername/AutoForm.git
cd AutoForm

# Create and activate virtual environment
python -m venv venv
# Windows:
.\venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env file with your OpenAI API key
echo OPENAI_API_KEY=your_api_key_here > .env

# Start the server
python main.py
```

### 2. Extension Setup
1.  Open Chrome and navigate to `chrome://extensions`.
2.  Enable **Developer mode** (top right toggle).
3.  Click **Load unpacked**.
4.  Select the `chrome_extension` folder from this project.
5.  The AutoForm icon should appear in your toolbar.

## 📖 Usage

1.  Ensure the backend server is running (`http://localhost:8000`).
2.  Navigate to any website with a form (e.g., a registration page).
3.  Click the **AutoForm extension icon**.
4.  Click **Start Recording** and speak the information you want to fill (e.g., "My name is Alice, email is alice@example.com").
5.  Click **Stop Recording**.
6.  Watch as the form fields are automatically filled!

## ⚠️ Limitations

AutoForm is a **generic form filler** designed for simple to mid-complexity forms. It works well for:
- Basic contact forms
- Standard registration/signup forms
- Surveys and questionnaires
- General government forms
- Exam/test registration forms
- General information fields

**May struggle with:**
- Highly dynamic forms that change based on user input
- Complex forms with intricate conditional logic
- Forms with multiple interdependent field validations
- Real-time validation forms with complex rules

For best results, speak clearly and provide detailed information. The tool performs well on standard forms but may need additional context for highly complex dynamic scenarios.

## 🛡️ Privacy Note
This project uses:
- **Whisper** runs locally for transcription.
- **OpenAI API** for intelligent field mapping.
- Audio transcription happens locally, but field mapping uses OpenAI's API.

## 📄 License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.