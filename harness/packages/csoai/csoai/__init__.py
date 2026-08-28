import requests

class Client:
    def __init__(self, api_key: str, base_url: str = "https://councilof.ai/api"):
        self.api_key = api_key
        self.base_url = base_url
        self.evaluate = EvaluateClient(api_key, base_url)
        self.state = StateClient(api_key, base_url)

class EvaluateClient:
    def __init__(self, api_key: str, base_url: str):
        self.api_key = api_key
        self.base_url = base_url
    
    def run(self, model_id: str):
        # In a real environment, this would do: 
        # requests.post(f"{self.base_url}/evaluate", json={"model": model_id}, headers={"Authorization": f"Bearer {self.api_key}"})
        return type('obj', (object,), {'compliance_score': '98.5', 'status': 'PASS'})

class StateClient:
    def __init__(self, api_key: str, base_url: str):
        self.api_key = api_key
        self.base_url = base_url
    
    def get_live_board(self):
        return requests.get(f"{self.base_url}/gspc").json()
