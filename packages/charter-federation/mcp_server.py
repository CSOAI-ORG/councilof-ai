"""Local stdio MCP reference reader, explicitly pinned to protocol 2025-06-18.

No network, credential, publication, filesystem-write or execution tools.
This is a local transport prototype, not hosted-platform certification.
"""
import json
import sys
from pathlib import Path
from register import TOOLS, call_tool, load_register


def respond(message, data):
    if not isinstance(message, dict) or message.get('jsonrpc') != '2.0' or not isinstance(message.get('method'), str):
        return {'jsonrpc': '2.0', 'id': None, 'error': {'code': -32600, 'message': 'Invalid Request'}}
    if 'id' not in message:
        return None
    ident = message['id']
    if isinstance(ident, (dict, list, bool)):
        return {'jsonrpc': '2.0', 'id': None, 'error': {'code': -32600, 'message': 'Invalid identifier'}}
    method = message['method']
    params = message.get('params', {})
    try:
        if not isinstance(params, dict):
            raise ValueError('Parameters must be an object')
        if method == 'initialize':
            value = {'protocolVersion': '2025-06-18', 'capabilities': {'tools': {}},
                     'serverInfo': {'name': 'council-charter-register', 'version': '0.1.0'},
                     'instructions': 'References and drafts only. No approval, execution or legal determination.'}
        elif method == 'ping':
            value = {}
        elif method == 'tools/list':
            value = {'tools': TOOLS}
        elif method == 'tools/call':
            try:
                result = call_tool(data, params.get('name'), params.get('arguments', {}))
                value = {'content': [{'type': 'text', 'text': json.dumps(result)}], 'isError': False}
            except (ValueError, TypeError) as exc:
                value = {'content': [{'type': 'text', 'text': str(exc)}], 'isError': True}
        else:
            return {'jsonrpc': '2.0', 'id': ident, 'error': {'code': -32601, 'message': 'Method not found'}}
        return {'jsonrpc': '2.0', 'id': ident, 'result': value}
    except ValueError as exc:
        return {'jsonrpc': '2.0', 'id': ident, 'error': {'code': -32602, 'message': str(exc)}}


def main():
    data = load_register(Path(__file__).with_name('register.json'))
    while True:
        raw = sys.stdin.buffer.readline(1048577)
        if not raw:
            return
        if len(raw) > 1048576:
            print(json.dumps({'jsonrpc': '2.0', 'id': None, 'error': {'code': -32700, 'message': 'Request too large'}}), flush=True)
            return
        try:
            message = json.loads(raw)
            response = respond(message, data)
        except (ValueError, UnicodeDecodeError):
            response = {'jsonrpc': '2.0', 'id': None, 'error': {'code': -32700, 'message': 'Parse error'}}
        if response is not None:
            print(json.dumps(response), flush=True)


if __name__ == '__main__':
    main()
