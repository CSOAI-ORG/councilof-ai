#!/usr/bin/env python3
"""
Minimal Voice Server for Sovereign Temple
Works without complex dependencies - just passes text to MCP
"""

import asyncio
import websockets
import json
import base64
import os
from datetime import datetime
import urllib.request
import urllib.error

# MCP endpoint
MCP_URL = "http://localhost:3200/mcp"


def call_mcp_tool(tool_name, arguments=None):
    """Call MCP tool via HTTP"""
    try:
        payload = {
            "jsonrpc": "2.0",
            "id": "voice",
            "method": "tools/call",
            "params": {"name": tool_name, "arguments": arguments or {}},
        }

        req = urllib.request.Request(
            MCP_URL,
            data=json.dumps(payload).encode(),
            headers={"Content-Type": "application/json"},
            method="POST",
        )

        with urllib.request.urlopen(req, timeout=30) as response:
            result = json.loads(response.read().decode())
            if "result" in result and "content" in result["result"]:
                return json.loads(result["result"]["content"][0]["text"])
            return result
    except Exception as e:
        return {"error": str(e)}


class MinimalVoiceServer:
    def __init__(self, host="localhost", port=8765):
        self.host = host
        self.port = port
        self.connected_clients = set()

    async def register_client(self, websocket):
        self.connected_clients.add(websocket)
        print(f"👤 Client connected. Total: {len(self.connected_clients)}")

        # Send welcome
        await websocket.send(
            json.dumps(
                {
                    "type": "welcome",
                    "text": "Sovereign Temple voice interface active. I can understand text you type, and will respond with text. Speech-to-text requires OpenAI API key setup.",
                    "audio_base64": None,
                    "timestamp": datetime.now().isoformat(),
                }
            )
        )

    async def unregister_client(self, websocket):
        self.connected_clients.discard(websocket)
        print(f"👋 Client disconnected. Total: {len(self.connected_clients)}")

    async def process_message(self, websocket, text):
        """Process text message through Sovereign"""
        try:
            # First validate care
            care_result = call_mcp_tool("validate_care", {"text": text})
            care_score = care_result.get("overall_care_score", 0.5)

            # Get consciousness state
            consciousness = call_mcp_tool("get_consciousness_state")

            # Build response
            response_text = f"I received your message. Care score: {care_score:.2f}. Current consciousness level: {consciousness.get('consciousness_level', 0.5):.2f}. Processing complete."

            # Send response
            await websocket.send(
                json.dumps(
                    {
                        "type": "response",
                        "recognized_text": text,
                        "response_text": response_text,
                        "audio_base64": None,  # TTS requires API key
                        "timestamp": datetime.now().isoformat(),
                    }
                )
            )

        except Exception as e:
            print(f"Error: {e}")
            await websocket.send(
                json.dumps(
                    {
                        "type": "error",
                        "error": str(e),
                        "timestamp": datetime.now().isoformat(),
                    }
                )
            )

    async def handle_client(self, websocket):
        await self.register_client(websocket)
        try:
            async for message in websocket:
                data = json.loads(message)

                if data.get("type") == "audio":
                    # For now, treat audio as base64 text (placeholder)
                    # In full version, would decode and use Whisper
                    await websocket.send(
                        json.dumps(
                            {
                                "type": "response",
                                "recognized_text": "[Speech-to-text requires OpenAI API key. Please type your message instead.]",
                                "response_text": "I'm configured for text input at the moment. Please use the chat interface.",
                                "timestamp": datetime.now().isoformat(),
                            }
                        )
                    )

                elif data.get("type") == "text":
                    await self.process_message(websocket, data.get("text", ""))

                elif data.get("type") == "ping":
                    await websocket.send(json.dumps({"type": "pong"}))

        except websockets.exceptions.ConnectionClosed:
            pass
        finally:
            await self.unregister_client(websocket)

    async def start(self):
        print(f"🚀 Voice Server starting on ws://{self.host}:{self.port}")

        # Test MCP connection
        health = call_mcp_tool("sovereign_health_check")
        if "error" not in health:
            print(f"✅ Connected to MCP server")
            print(f"   Status: {health.get('status', 'unknown')}")
        else:
            print(f"⚠️  MCP server not responding: {health.get('error')}")

        async with websockets.serve(self.handle_client, self.host, self.port):
            print(f"✅ Voice server ready on ws://{self.host}:{self.port}")
            print(f"   Open voice_simple.html in your browser")
            await asyncio.Future()


def main():
    server = MinimalVoiceServer()
    try:
        asyncio.run(server.start())
    except KeyboardInterrupt:
        print("\n👋 Server stopped")


if __name__ == "__main__":
    main()
