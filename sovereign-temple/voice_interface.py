#!/usr/bin/env python3
"""
Voice Interface for Sovereign Temple
Speech-to-Text (Whisper) + Text-to-Speech (ElevenLabs)
Allows talking to Sovereign naturally
"""

import os
import io
import base64
import asyncio
import aiohttp
from typing import Optional, Dict, Any, Callable
from dataclasses import dataclass
import tempfile
import subprocess

# ElevenLabs voices
ELEVENLABS_VOICES = {
    "rachel": "21m00Tcm4TlvDq8ikWAM",  # Calm, mature female
    "adam": "pNInz6obpgDQGcFmaJgB",  # Deep male
    "antoni": "ErXwobaYiN019PkySvjV",  # Young male
    "elli": "MF3mGyEYCl7XYWbV9V6O",  # Soft female
    "josh": "TxGEqnHWrfWFTfGW9XjX",  # Young male
    "arnold": "VR6AewLTigWG4xSOukaG",  # Strong male
    "bella": "EXAVITQu4vr4xnSDxMaL",  # Young female
}


@dataclass
class VoiceConfig:
    """Voice configuration"""

    stt_model: str = "whisper-1"
    tts_voice: str = "rachel"  # Default voice
    tts_model: str = "eleven_monolingual_v1"
    output_format: str = "mp3"
    sample_rate: int = 24000


class VoiceInterface:
    """
    Voice interface for Sovereign Temple
    Converts speech to text, processes through consciousness,
    returns text + optional speech response
    """

    def __init__(
        self, openai_key: Optional[str] = None, elevenlabs_key: Optional[str] = None
    ):
        self.openai_key = openai_key or os.getenv("OPENAI_API_KEY")
        self.elevenlabs_key = elevenlabs_key or os.getenv("ELEVENLABS_API_KEY")
        self.config = VoiceConfig()
        self.session: Optional[aiohttp.ClientSession] = None

        # Callback for when speech is recognized
        self.on_speech_recognized: Optional[Callable[[str], None]] = None
        # Callback for when response is ready
        self.on_response_ready: Optional[Callable[[str, Optional[bytes]], None]] = None

    async def initialize(self):
        """Initialize HTTP session"""
        self.session = aiohttp.ClientSession()

    async def close(self):
        """Close session"""
        if self.session:
            await self.session.close()

    async def speech_to_text(self, audio_data: bytes, format: str = "wav") -> str:
        """
        Convert speech to text using OpenAI Whisper

        Args:
            audio_data: Raw audio bytes
            format: Audio format (wav, mp3, etc.)

        Returns:
            Transcribed text
        """
        if not self.openai_key:
            return "[Error: OpenAI API key not set]"

        url = "https://api.openai.com/v1/audio/transcriptions"

        # Create form data
        data = aiohttp.FormData()
        data.add_field(
            "file",
            io.BytesIO(audio_data),
            filename=f"audio.{format}",
            content_type=f"audio/{format}",
        )
        data.add_field("model", self.config.stt_model)
        data.add_field("language", "en")

        headers = {"Authorization": f"Bearer {self.openai_key}"}

        async with self.session.post(url, data=data, headers=headers) as resp:
            if resp.status == 200:
                result = await resp.json()
                return result.get("text", "")
            else:
                error = await resp.text()
                return f"[STT Error: {error}]"

    async def text_to_speech(self, text: str, voice: Optional[str] = None) -> bytes:
        """
        Convert text to speech using ElevenLabs

        Args:
            text: Text to speak
            voice: Voice ID or name

        Returns:
            Audio bytes
        """
        if not self.elevenlabs_key:
            # Fallback: Use OpenAI TTS
            return await self._openai_tts(text)

        # Resolve voice
        voice_id = voice or self.config.tts_voice
        if voice_id in ELEVENLABS_VOICES:
            voice_id = ELEVENLABS_VOICES[voice_id]

        url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}"

        headers = {
            "xi-api-key": self.elevenlabs_key,
            "Content-Type": "application/json",
        }

        payload = {
            "text": text,
            "model_id": self.config.tts_model,
            "voice_settings": {"stability": 0.5, "similarity_boost": 0.75},
        }

        async with self.session.post(url, json=payload, headers=headers) as resp:
            if resp.status == 200:
                return await resp.read()
            else:
                error = await resp.text()
                # Fallback to OpenAI
                return await self._openai_tts(text)

    async def _openai_tts(self, text: str) -> bytes:
        """Fallback TTS using OpenAI"""
        if not self.openai_key:
            return b""

        url = "https://api.openai.com/v1/audio/speech"

        headers = {
            "Authorization": f"Bearer {self.openai_key}",
            "Content-Type": "application/json",
        }

        payload = {
            "model": "tts-1",
            "input": text,
            "voice": "alloy",  # alloy, echo, fable, onyx, nova, shimmer
        }

        async with self.session.post(url, json=payload, headers=headers) as resp:
            if resp.status == 200:
                return await resp.read()
            else:
                return b""

    async def process_voice_interaction(self, audio_input: bytes) -> Dict[str, Any]:
        """
        Full voice interaction pipeline:
        1. Speech → Text (Whisper)
        2. Process through Sovereign (MCP tools)
        3. Text → Speech (ElevenLabs/OpenAI)

        Args:
            audio_input: Raw audio bytes

        Returns:
            Dict with text and audio response
        """
        # Step 1: Speech to text
        recognized_text = await self.speech_to_text(audio_input)

        if recognized_text.startswith("[Error"):
            return {
                "success": False,
                "error": recognized_text,
                "recognized_text": "",
                "response_text": "",
                "audio_response": None,
            }

        # Notify callback
        if self.on_speech_recognized:
            self.on_speech_recognized(recognized_text)

        # Step 2: Process through Sovereign consciousness
        # This would call the MCP server with the recognized text
        # For now, return a simple response
        response_text = f"I heard you say: '{recognized_text}'. Processing through Sovereign consciousness..."

        # Step 3: Text to speech
        audio_response = await self.text_to_speech(response_text)

        # Notify callback
        if self.on_response_ready:
            self.on_response_ready(response_text, audio_response)

        return {
            "success": True,
            "recognized_text": recognized_text,
            "response_text": response_text,
            "audio_response": audio_response,
        }

    def get_available_voices(self) -> Dict[str, str]:
        """Get available voice names"""
        return list(ELEVENLABS_VOICES.keys())


class VoiceChatSession:
    """
    Manages a voice chat session with Sovereign
    """

    def __init__(
        self,
        voice_interface: VoiceInterface,
        mcp_endpoint: str = "http://localhost:3200/mcp",
    ):
        self.voice = voice_interface
        self.mcp_endpoint = mcp_endpoint
        self.conversation_history: list = []
        self.is_active = False

    async def start(self):
        """Start voice chat session"""
        await self.voice.initialize()
        self.is_active = True

        # Welcome message
        welcome = "Sovereign Temple voice interface active. I'm listening."
        welcome_audio = await self.voice.text_to_speech(welcome)

        return {"text": welcome, "audio": welcome_audio}

    async def handle_audio_chunk(self, audio_data: bytes) -> Dict[str, Any]:
        """Process incoming audio chunk"""
        if not self.is_active:
            return {"error": "Session not active"}

        result = await self.voice.process_voice_interaction(audio_data)

        if result["success"]:
            self.conversation_history.append(
                {"role": "user", "content": result["recognized_text"]}
            )
            self.conversation_history.append(
                {"role": "sovereign", "content": result["response_text"]}
            )

        return result

    async def stop(self):
        """End voice chat session"""
        self.is_active = False
        await self.voice.close()

        # Goodbye message
        goodbye = "Voice session ended. Sovereign remains attentive."
        goodbye_audio = await self.voice.text_to_speech(goodbye)

        return {
            "text": goodbye,
            "audio": goodbye_audio,
            "history": self.conversation_history,
        }


# MCP Tool integration
def create_voice_mcp_tools() -> list:
    """Create MCP tool definitions for voice interface"""
    return [
        {
            "name": "voice_transcribe",
            "description": "Transcribe audio to text using Whisper",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "audio_base64": {
                        "type": "string",
                        "description": "Base64 encoded audio data",
                    },
                    "format": {
                        "type": "string",
                        "enum": ["wav", "mp3", "m4a"],
                        "default": "wav",
                    },
                },
                "required": ["audio_base64"],
            },
        },
        {
            "name": "voice_speak",
            "description": "Convert text to speech",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "text": {"type": "string", "description": "Text to speak"},
                    "voice": {
                        "type": "string",
                        "description": "Voice name (rachel, adam, antoni, elli, etc.)",
                    },
                },
                "required": ["text"],
            },
        },
        {
            "name": "voice_chat",
            "description": "Full voice interaction - transcribe audio and get spoken response",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "audio_base64": {
                        "type": "string",
                        "description": "Base64 encoded audio",
                    },
                    "process_through_sovereign": {"type": "boolean", "default": True},
                },
                "required": ["audio_base64"],
            },
        },
        {
            "name": "voice_list_voices",
            "description": "List available voices for text-to-speech",
            "inputSchema": {"type": "object", "properties": {}},
        },
    ]


if __name__ == "__main__":
    # Test the voice interface
    import asyncio

    async def test():
        vi = VoiceInterface()
        await vi.initialize()

        # Test TTS
        print("Testing text-to-speech...")
        audio = await vi.text_to_speech(
            "Hello, I am Sovereign. How can I assist you today?"
        )
        print(f"Generated {len(audio)} bytes of audio")

        await vi.close()

    asyncio.run(test())
