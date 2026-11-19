"""Reuse SwarmChat's actual store, membership and message API in an isolated folder."""
import importlib
from .dependencies import swarmchat

api = importlib.import_module(swarmchat.__name__ + ".api")
store_module = importlib.import_module(swarmchat.__name__ + ".store")


class RehearsalMessages:
    def __init__(self, data_dir):
        self.store = store_module.Store(str(data_dir))
        self.tokens = {}
        for actor in ("planner", "challenger"):
            self.tokens[actor] = self.store.add_user(actor, actor.title())
        self.channel = api.channel_create(self.store, "planner", {
            "name": "rehearsal", "members": ["challenger"], "public": False})["chat"]["id"]

    def request(self, token, method, params):
        actor = self.store.me(token)
        if not actor or method not in {"send", "read"}:
            raise ValueError("Unknown actor or unsupported message operation")
        return api.METHODS[method](self.store, actor, params)

    def publish(self, core):
        context = core["scenario_id"]
        messages = [
            ("planner", f"Fixture {context}: inspect {core['config']['intervention']}"),
            ("challenger", "Check supplier A evidence after revocation; messages grant no authority."),
            ("planner", core["lesson"])]
        for actor, text in messages:
            self.request(self.tokens[actor], "send", {"chat": self.channel, "text": text})
        return self.request(self.tokens["planner"], "read",
                            {"chat": self.channel, "last": 3})["messages"]

    def close(self):
        self.store.close()
