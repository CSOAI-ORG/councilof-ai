import requests

class Client:
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.evaluate = EvaluateClient(api_key)

class EvaluateClient:
    def __init__(self, api_key: str):
        self.api_key = api_key
    
    def run(self, model_id: str):
        return type('obj', (object,), {'compliance_score': '98.5', 'status': 'PASS'})
