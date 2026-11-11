// Control-plane-only base for the isolated csoai-process-replay research Worker.
// No model weights, bindings, fetching, secrets, mutation or permitted application action.
export default {fetch(){return new Response(JSON.stringify({state:'RESEARCH_BASE_DENY_ALL',model_loaded:false,execution_authority:false,storage_writes:0}),{status:503,headers:{'Content-Type':'application/json','Cache-Control':'no-store','X-Robots-Tag':'noindex, nofollow'}})}};
