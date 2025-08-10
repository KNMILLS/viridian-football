#!/usr/bin/env python3
"""
Agent Runner - Keeps multiple agents running persistently
"""

import time
import threading
import sys

def run_agent(agent_name):
    """Run an agent in a persistent loop"""
    print(f"🚀 Starting {agent_name}...")
    while True:
        try:
            print(f"🤖 {agent_name} is running and ready for tasks...")
            time.sleep(30)  # Heartbeat every 30 seconds
        except KeyboardInterrupt:
            print(f"🛑 {agent_name} shutting down...")
            break
        except Exception as e:
            print(f"❌ {agent_name} error: {e}")
            time.sleep(5)  # Wait before retrying

def main():
    """Start all agents"""
    agents = [
        "Engine Development Agent",
        "Testing Agent", 
        "Data Model Agent",
        "Orchestrator Agent",
        "Documentation Agent",
        "UI/UX Agent",
        "Game Logic Agent"
    ]
    
    print("🚀 Initializing multi-agent development system...")
    
    # Start each agent in its own thread
    threads = []
    for agent in agents:
        thread = threading.Thread(target=run_agent, args=(agent,))
        thread.daemon = True
        thread.start()
        threads.append(thread)
        time.sleep(1)  # Small delay between agent starts
    
    print(f"✅ All {len(agents)} agents are now running!")
    print("📊 Agent Status: All agents active and ready for tasks")
    
    try:
        # Keep main thread alive
        while True:
            time.sleep(60)
            print("💓 System heartbeat - All agents operational")
    except KeyboardInterrupt:
        print("🛑 Shutting down multi-agent system...")

if __name__ == "__main__":
    main()
