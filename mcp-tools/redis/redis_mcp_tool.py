#!/usr/bin/env python3
"""
Redis MCP Tool — Caching Integration
====================================
Port: 3107
Function: Response caching for SOV3
"""

import json
import redis
from http.server import HTTPServer, BaseHTTPRequestHandler
from typing import Any, Dict, Optional
import hashlib
import pickle

REDIS_HOST = "localhost"
REDIS_PORT = 6379
REDIS_DB = 0

class RedisCache:
    """Redis caching client for SOV3"""
    
    def __init__(self):
        try:
            self.client = redis.Redis(
                host=REDIS_HOST,
                port=REDIS_PORT,
                db=REDIS_DB,
                decode_responses=False,
                socket_connect_timeout=5
            )
            self.client.ping()
            self.connected = True
        except Exception as e:
            print(f"⚠️ Redis connection failed: {e}")
            self.client = None
            self.connected = False
    
    def _generate_key(self, prefix: str, data: Any) -> str:
        """Generate cache key from data"""
        if isinstance(data, str):
            key_data = data
        else:
            key_data = json.dumps(data, sort_keys=True)
        
        hash_obj = hashlib.sha256(key_data.encode()).hexdigest()[:16]
        return f"sov3:{prefix}:{hash_obj}"
    
    def get(self, key: str) -> Optional[Any]:
        """Get value from cache"""
        if not self.connected:
            return None
        
        try:
            data = self.client.get(key)
            if data:
                return pickle.loads(data)
            return None
        except Exception as e:
            print(f"Redis get error: {e}")
            return None
    
    def set(
        self,
        key: str,
        value: Any,
        ttl: int = 3600,
        tags: Optional[list] = None
    ) -> bool:
        """Set value in cache with optional tags"""
        if not self.connected:
            return False
        
        try:
            serialized = pickle.dumps(value)
            self.client.setex(key, ttl, serialized)
            
            # Add to tag sets for invalidation
            if tags:
                for tag in tags:
                    self.client.sadd(f"sov3:tag:{tag}", key)
            
            return True
        except Exception as e:
            print(f"Redis set error: {e}")
            return False
    
    def delete(self, key: str) -> bool:
        """Delete key from cache"""
        if not self.connected:
            return False
        
        try:
            self.client.delete(key)
            return True
        except Exception as e:
            print(f"Redis delete error: {e}")
            return False
    
    def invalidate_by_tag(self, tag: str) -> int:
        """Invalidate all keys with a tag"""
        if not self.connected:
            return 0
        
        try:
            keys = self.client.smembers(f"sov3:tag:{tag}")
            if keys:
                self.client.delete(*keys)
                self.client.delete(f"sov3:tag:{tag}")
            return len(keys)
        except Exception as e:
            print(f"Redis invalidate error: {e}")
            return 0
    
    def get_stats(self) -> Dict[str, Any]:
        """Get Redis statistics"""
        if not self.connected:
            return {"connected": False}
        
        try:
            info = self.client.info()
            return {
                "connected": True,
                "version": info.get("redis_version"),
                "uptime_seconds": info.get("uptime_in_seconds"),
                "connected_clients": info.get("connected_clients"),
                "used_memory_human": info.get("used_memory_human"),
                "total_keys": self.client.dbsize()
            }
        except Exception as e:
            return {"connected": False, "error": str(e)}
    
    def cache_response(
        self,
        query_type: str,
        query_data: Any,
        response: Any,
        ttl: int = 3600,
        tags: Optional[list] = None
    ) -> Dict[str, Any]:
        """Cache a response with metadata"""
        
        key = self._generate_key(query_type, query_data)
        
        cache_entry = {
            "response": response,
            "cached_at": json.dumps({}),  # Will be timestamp
            "query_type": query_type
        }
        
        success = self.set(key, cache_entry, ttl, tags)
        
        return {
            "success": success,
            "key": key,
            "ttl": ttl,
            "tags": tags or []
        }
    
    def get_cached_response(
        self,
        query_type: str,
        query_data: Any
    ) -> Dict[str, Any]:
        """Get cached response if exists"""
        
        key = self._generate_key(query_type, query_data)
        cached = self.get(key)
        
        if cached:
            return {
                "hit": True,
                "response": cached.get("response"),
                "cached_at": cached.get("cached_at"),
                "key": key
            }
        else:
            return {
                "hit": False,
                "key": key
            }


# Initialize cache
redis_cache = RedisCache()

class RedisHandler(BaseHTTPRequestHandler):
    def do_POST(self):
        content_length = int(self.headers.get('Content-Length', 0))
        post_data = self.rfile.read(content_length)
        
        try:
            request = json.loads(post_data)
            tool = request.get('tool')
            params = request.get('params', {})
            
            if tool == 'redis_cache_response':
                result = redis_cache.cache_response(
                    query_type=params.get('query_type', 'default'),
                    query_data=params.get('query_data'),
                    response=params.get('response'),
                    ttl=params.get('ttl', 3600),
                    tags=params.get('tags')
                )
            elif tool == 'redis_get_cached':
                result = redis_cache.get_cached_response(
                    query_type=params.get('query_type', 'default'),
                    query_data=params.get('query_data')
                )
            elif tool == 'redis_delete':
                result = {
                    "success": redis_cache.delete(params.get('key', ''))
                }
            elif tool == 'redis_invalidate_tag':
                count = redis_cache.invalidate_by_tag(params.get('tag', ''))
                result = {"invalidated_count": count}
            elif tool == 'redis_stats':
                result = redis_cache.get_stats()
            elif tool == 'redis_health':
                result = {
                    "healthy": redis_cache.connected,
                    "host": REDIS_HOST,
                    "port": REDIS_PORT
                }
            else:
                result = {"error": f"Unknown tool: {tool}"}
            
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(result, default=str).encode())
            
        except Exception as e:
            self.send_response(500)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({"error": str(e)}).encode())
    
    def log_message(self, format, *args):
        pass

def run_server():
    server = HTTPServer(('localhost', 3107), RedisHandler)
    print("💾 Redis MCP Tool running on port 3107")
    print("   Response caching for SOV3")
    print(f"   Status: {'Connected' if redis_cache.connected else 'Disconnected'}")
    print("   Endpoints: /mcp (POST)")
    server.serve_forever()

if __name__ == "__main__":
    run_server()
