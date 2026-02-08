Model Manager v1 for Ollama

<img width="1429" height="2279" alt="Screenshot 2026-02-07 211904" src="https://github.com/user-attachments/assets/2a20cf3b-6c6c-4438-ac72-b25a6ca0ad31" />




Clone the repo



npm i



npm run dev



Who this is for: Ollama users that run through models and need an easier way to manage existing + create new model files.



No Backend Required



The app runs entirely in the browser as a static React application

It connects directly to your Ollama server via HTTP API calls

All configuration (like the server URL) is stored in localStorage





Direct Ollama API Communication The app communicates directly with your Ollama instance using standard REST endpoints:

GET /api/tags - List installed models

GET /api/ps - List running models

POST /api/show - Get model details

POST /api/pull - Download models (including from Hugging Face)

POST /api/create - Create custom models

POST /api/delete - Delete models

POST /api/generate - Load/unload models from memory





Important Note for LAN Use



     When accessing your Ollama server from another machine, you'll need to:



Set OLLAMA\_HOST=0.0.0.0 when running Ollama (to bind to all interfaces)

Ensure your machines firewall allows connections on port 11434

Use the machine's IP address (e.g., http://192.168.1.100:11434) rather than localhost



Ensure cors origin is set correctly OLLAMA\_ORIGINS can be set to \* if being used only on LAN or more strict settings depending on your network.

