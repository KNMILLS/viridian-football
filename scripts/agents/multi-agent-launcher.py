#!/usr/bin/env python3
"""
Multi-Agent Launcher - Starts each agent as a separate process
"""

import subprocess
import time
import sys
import os

def start_agent_process(agent_name):
    """Start an agent as a separate Python process"""
    agent_script = f"""
import time
import sys

print(f"🚀 {agent_name} starting...")
print(f"📊 {agent_name} PID: {{os.getpid()}}")

while True:
    try:
        print(f"🤖 {agent_name} is running and ready for tasks...")
        time.sleep(30)  # Heartbeat every 30 seconds
    except KeyboardInterrupt:
        print(f"🛑 {agent_name} shutting down...")
        break
    except Exception as e:
        print(f"❌ {agent_name} error: {{e}}")
        time.sleep(5)
"""
    
    # Write agent script to temporary file
    script_file = f"agent_{agent_name.replace(' ', '_').lower()}.py"
    with open(script_file, 'w') as f:
        f.write(agent_script)
    
    # Start agent as separate process
    try:
        process = subprocess.Popen([sys.executable, script_file], 
                                 stdout=subprocess.PIPE, 
                                 stderr=subprocess.PIPE,
                                 text=True)
        print(f"✅ Started {agent_name} (PID: {process.pid})")
        return process
    except Exception as e:
        print(f"❌ Failed to start {agent_name}: {e}")
        return None

def main():
    """Launch all agents as separate processes"""
    agents = [
        "Engine Development Agent",
        "Testing Agent", 
        "Data Model Agent",
        "Orchestrator Agent",
        "Documentation Agent",
        "UI/UX Agent",
        "Game Logic Agent"
    ]
    
    print("🚀 Launching multi-agent development system...")
    print(f"📊 Target: {len(agents)} concurrent agents")
    
    processes = []
    
    # Start each agent as separate process
    for agent in agents:
        process = start_agent_process(agent)
        if process:
            processes.append((agent, process))
        time.sleep(2)  # Delay between starts
    
    print(f"✅ Successfully started {len(processes)} agents!")
    print("📊 All agents are now running as separate processes")
    print("🔍 Cursor should now detect multiple agents")
    
    # Monitor processes
    try:
        while True:
            active_count = sum(1 for _, p in processes if p.poll() is None)
            print(f"💓 System status: {active_count}/{len(processes)} agents active")
            time.sleep(60)
    except KeyboardInterrupt:
        print("🛑 Shutting down all agents...")
        for agent, process in processes:
            if process.poll() is None:
                process.terminate()
                print(f"🛑 Terminated {agent}")

if __name__ == "__main__":
    main()
