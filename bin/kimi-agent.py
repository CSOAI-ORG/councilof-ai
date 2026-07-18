#!/usr/bin/env python3
"""
Kimi CLI Agent Wrapper for OpenClaw
Provides non-interactive access to Kimi Code CLI
"""

import subprocess
import sys
import os
import json
from pathlib import Path

def run_kimi(prompt: str, thinking: bool = False, cwd: str = None) -> str:
    """Run kimi CLI with a prompt and return the output"""
    
    # Build kimi command
    cmd = ["kimi"]
    if thinking:
        cmd.append("--thinking")
    
    # Add --no-interactive or similar if available
    # For now, use a subprocess with timeout
    
    env = os.environ.copy()
    env["KIMI_NO_INTERACTIVE"] = "1"
    
    try:
        result = subprocess.run(
            cmd,
            input=prompt,
            capture_output=True,
            text=True,
            timeout=120,
            cwd=cwd or os.getcwd(),
            env=env
        )
        
        # Clean up the output (remove ANSI codes, progress bars, etc)
        output = result.stdout + result.stderr
        
        # Basic cleanup of ANSI escape codes
        import re
        output = re.sub(r'\x1b\[[0-9;]*[mK]', '', output)
        output = re.sub(r'\r\n', '\n', output)
        
        # Extract just the response (after the prompt)
        lines = output.split('\n')
        response_lines = []
        found_input = False
        
        for line in lines:
            if 'input' in line.lower() and '─' in line:
                found_input = True
                continue
            if found_input and line.strip() and not line.startswith('─'):
                if 'agent (' in line and 'context:' in line:
                    break
                response_lines.append(line)
        
        return '\n'.join(response_lines).strip() or output.strip()
        
    except subprocess.TimeoutExpired:
        return "Error: Kimi CLI timed out after 120 seconds"
    except Exception as e:
        return f"Error running Kimi: {str(e)}"

def main():
    """Main entry point"""
    # Read input from stdin or args
    if len(sys.argv) > 1:
        prompt = sys.argv[1]
    else:
        prompt = sys.stdin.read()
    
    # Check for mode flags
    thinking = "--thinking" in sys.argv or os.getenv("KIMI_THINKING") == "1"
    
    # Run kimi
    result = run_kimi(prompt, thinking=thinking)
    print(result)

if __name__ == "__main__":
    main()
