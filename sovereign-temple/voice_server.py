#!/usr/bin/env python3
"""
Voice Server for Sovereign Temple
Simple web interface for speech-to-text and text-to-speech
"""

import asyncio
import websockets
import json
import base64
import os
import sys
import subprocess
from datetime import datetime
from pathlib import Path

# Add paths
sys.path.insert(0, os.path.dirname(__file__))

from voice_interface import VoiceInterface, VoiceChatSession

class VoiceServer:
    def __init__(self, host="localhost", port=8765):
        self.host = host
        self.port = port
        self.voice_interface = None
        self.chat_session = None
        self.connected_clients = set()
        
    async def initialize(self):
        """Initialize voice interface"""
        self.voice_interface = VoiceInterface()
        await self.voice_interface.initialize()
        print(f"🎙️ Voice interface initialized")
        
    async def register_client(self, websocket):
        """Register new client"""
        self.connected_clients.add(websocket)
        print(f"👤 Client connected. Total: {len(self.connected_clients)}")
        
        # Start new chat session for this client
        self.chat_session = VoiceChatSession(self.voice_interface)
        welcome = await self.chat_session.start()
        
        # Send welcome message
        await websocket.send(json.dumps({
            "type": "welcome",
            "text": welcome["text"],
            "audio_base64": base64.b64encode(welcome["audio"]).decode() if welcome["audio"] else None,
            "timestamp": datetime.now().isoformat()
        }))
        
    async def unregister_client(self, websocket):
        """Unregister client"""
        self.connected_clients.remove(websocket)
        if self.chat_session:
            await self.chat_session.stop()
        print(f"👋 Client disconnected. Total: {len(self.connected_clients)}")
        
    async def handle_audio(self, websocket, audio_base64):
        """Process incoming audio"""
        try:
            # Decode audio
            audio_data = base64.b64decode(audio_base64)
            
            # Process through chat session
            result = await self.chat_session.handle_audio_chunk(audio_data)
            
            # Send response
            if result["success"]:
                await websocket.send(json.dumps({
                    "type": "response",
                    "recognized_text": result["recognized_text"],
                    "response_text": result["response_text"],
                    "audio_base64": base64.b64encode(result["audio_response"]).decode() if result["audio_response"] else None,
                    "timestamp": datetime.now().isoformat()
                }))
            else:
                await websocket.send(json.dumps({
                    "type": "error",
                    "error": result.get("error", "Unknown error"),
                    "timestamp": datetime.now().isoformat()
                }))
                
        except Exception as e:
            print(f"Error handling audio: {e}")
            await websocket.send(json.dumps({
                "type": "error",
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            }))
            
    async def handle_client(self, websocket):
        """Handle WebSocket client"""
        await self.register_client(websocket)
        try:
            async for message in websocket:
                data = json.loads(message)
                
                if data.get("type") == "audio":
                    await self.handle_audio(websocket, data.get("audio_base64", ""))
                elif data.get("type") == "ping":
                    await websocket.send(json.dumps({"type": "pong"}))
                    
        except websockets.exceptions.ConnectionClosed:
            pass
        finally:
            await self.unregister_client(websocket)
            
    async def start(self):
        """Start the server"""
        await self.initialize()
        
        print(f"🚀 Voice Server starting on ws://{self.host}:{self.port}")
        print(f"📄 Web interface: http://{self.host}:{self.port}/")
        
        # Start WebSocket server
        async with websockets.serve(self.handle_client, self.host, self.port):
            print(f"✅ Voice server ready! Open voice_client.html to talk to Sovereign.")
            await asyncio.Future()  # Run forever

# Create simple HTML client
def create_html_client():
    html = '''<!DOCTYPE html>
<html>
<head>
    <title>🎙️ Sovereign Voice Interface</title>
    <meta charset="utf-8">
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            max-width: 800px;
            margin: 50px auto;
            padding: 20px;
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
            color: #eee;
            min-height: 100vh;
        }
        h1 {
            text-align: center;
            color: #00d4ff;
            text-shadow: 0 0 10px rgba(0, 212, 255, 0.5);
        }
        .status {
            text-align: center;
            padding: 10px;
            border-radius: 8px;
            margin: 20px 0;
        }
        .status.connected {
            background: rgba(0, 255, 100, 0.2);
            border: 1px solid #00ff64;
        }
        .status.disconnected {
            background: rgba(255, 0, 0, 0.2);
            border: 1px solid #ff4444;
        }
        .mic-button {
            display: block;
            width: 150px;
            height: 150px;
            margin: 40px auto;
            border-radius: 50%;
            border: none;
            background: linear-gradient(145deg, #00d4ff, #0099cc);
            color: white;
            font-size: 48px;
            cursor: pointer;
            box-shadow: 0 8px 32px rgba(0, 212, 255, 0.3);
            transition: all 0.3s ease;
        }
        .mic-button:hover {
            transform: scale(1.05);
            box-shadow: 0 12px 40px rgba(0, 212, 255, 0.5);
        }
        .mic-button.listening {
            background: linear-gradient(145deg, #ff4444, #cc0000);
            animation: pulse 1.5s infinite;
        }
        @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.1); }
        }
        .conversation {
            background: rgba(255, 255, 255, 0.05);
            border-radius: 12px;
            padding: 20px;
            margin-top: 30px;
            max-height: 400px;
            overflow-y: auto;
        }
        .message {
            margin: 15px 0;
            padding: 15px;
            border-radius: 8px;
        }
        .message.user {
            background: rgba(0, 212, 255, 0.1);
            border-left: 3px solid #00d4ff;
        }
        .message.sovereign {
            background: rgba(100, 255, 100, 0.1);
            border-left: 3px solid #64ff64;
        }
        .label {
            font-size: 12px;
            color: #888;
            margin-bottom: 5px;
        }
        .controls {
            text-align: center;
            margin: 20px 0;
        }
        .voice-select {
            padding: 10px 20px;
            border-radius: 6px;
            border: 1px solid #00d4ff;
            background: rgba(0, 0, 0, 0.3);
            color: #fff;
            font-size: 14px;
            cursor: pointer;
        }
        .info {
            background: rgba(0, 212, 255, 0.05);
            border: 1px solid rgba(0, 212, 255, 0.3);
            border-radius: 8px;
            padding: 15px;
            margin: 20px 0;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <h1>🎙️ Sovereign Voice Interface</h1>
    
    <div id="status" class="status disconnected">
        🔴 Disconnected - Starting server...
    </div>
    
    <div class="info">
        <strong>How to use:</strong> Click the microphone button and speak. 
        Sovereign will listen, process through consciousness, and respond.
        <br><br>
        <strong>Note:</strong> This uses OpenAI Whisper for speech-to-text and 
        OpenAI/ElevenLabs for text-to-speech.
    </div>
    
    <div class="controls">
        <select class="voice-select" id="voiceSelect">
            <option value="rachel">Rachel (Default)</option>
            <option value="adam">Adam</option>
            <option value="antoni">Antoni</option>
            <option value="elli">Elli</option>
            <option value="josh">Josh</option>
            <option value="bella">Bella</option>
        </select>
    </div>
    
    <button class="mic-button" id="micButton">🎤</button>
    
    <div class="conversation" id="conversation">
        <div class="message sovereign">
            <div class="label">Sovereign</div>
            <div>Click the microphone to begin speaking with me.</div>
        </div>
    </div>

    <script>
        const ws = new WebSocket('ws://localhost:8765');
        const micButton = document.getElementById('micButton');
        const status = document.getElementById('status');
        const conversation = document.getElementById('conversation');
        
        let isListening = false;
        let mediaRecorder = null;
        let audioChunks = [];
        
        ws.onopen = () => {
            status.textContent = '🟢 Connected - Ready to listen';
            status.className = 'status connected';
        };
        
        ws.onclose = () => {
            status.textContent = '🔴 Disconnected';
            status.className = 'status disconnected';
        };
        
        ws.onmessage = async (event) => {
            const data = JSON.parse(event.data);
            
            if (data.type === 'welcome' || data.type === 'response') {
                // Add to conversation
                if (data.recognized_text) {
                    addMessage('You', data.recognized_text, 'user');
                }
                if (data.response_text) {
                    addMessage('Sovereign', data.response_text, 'sovereign');
                }
                
                // Play audio response
                if (data.audio_base64) {
                    playAudio(data.audio_base64);
                }
                
                // Reset button
                isListening = false;
                micButton.classList.remove('listening');
                micButton.textContent = '🎤';
            }
        };
        
        function addMessage(sender, text, className) {
            const msg = document.createElement('div');
            msg.className = `message ${className}`;
            msg.innerHTML = `<div class="label">${sender}</div><div>${text}</div>`;
            conversation.appendChild(msg);
            conversation.scrollTop = conversation.scrollHeight;
        }
        
        function playAudio(base64) {
            const audio = new Audio('data:audio/mp3;base64,' + base64);
            audio.play();
        }
        
        micButton.addEventListener('click', async () => {
            if (!isListening) {
                // Start recording
                try {
                    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                    mediaRecorder = new MediaRecorder(stream);
                    audioChunks = [];
                    
                    mediaRecorder.ondataavailable = (e) => {
                        audioChunks.push(e.data);
                    };
                    
                    mediaRecorder.onstop = async () => {
                        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
                        const reader = new FileReader();
                        reader.onloadend = () => {
                            const base64 = reader.result.split(',')[1];
                            ws.send(JSON.stringify({
                                type: 'audio',
                                audio_base64: base64
                            }));
                        };
                        reader.readAsDataURL(audioBlob);
                    };
                    
                    mediaRecorder.start();
                    isListening = true;
                    micButton.classList.add('listening');
                    micButton.textContent = '⏹️';
                    
                } catch (err) {
                    alert('Microphone access denied or not available');
                    console.error(err);
                }
            } else {
                // Stop recording
                mediaRecorder.stop();
                mediaRecorder.stream.getTracks().forEach(t => t.stop());
            }
        });
    </script>
</body>
</html>
    '''
    
    client_path = Path(__file__).parent / "voice_client.html"
    with open(client_path, "w") as f:
        f.write(html)
    print(f"📝 Created voice client: {client_path}")
    return client_path

async def main():
    """Main entry point"""
    # Create HTML client first
    client_path = create_html_client()
    
    # Start server
    server = VoiceServer(host="localhost", port=8765)
    await server.start()

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n👋 Voice server stopped")
