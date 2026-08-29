import uvicorn

if __name__ == "__main__":
    uvicorn.run(
        "api.app:app",
        
        # Required for Tailscale and remote clients.
        
        host="0.0.0.0",
        port=8100,
        reload=False,
    )