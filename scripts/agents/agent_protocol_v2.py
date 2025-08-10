#!/usr/bin/env python3
"""
Agent Protocol V2 - Self-Correcting Agent Framework
==================================================

This protocol ensures agents:
1. Never hang or get stuck
2. Self-correct when issues are detected
3. Provide continuous health monitoring
4. Automatically recover from failures
5. Maintain clear communication channels
"""

import subprocess
import time
import json
import os
import sys
import threading
import signal
import psutil
import traceback
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Optional, Callable, Any
from abc import ABC, abstractmethod

class AgentProtocolV2(ABC):
    """Base class for all agents with self-correction capabilities"""
    
    def __init__(self, agent_name: str, role: str):
        self.agent_name = agent_name
        self.role = role
        self.start_time = datetime.now()
        self.last_activity = datetime.now()
        self.task_count = 0
        self.error_count = 0
        self.is_running = False
        self.health_check_interval = 10  # seconds
        self.max_idle_time = 60  # seconds
        self.max_error_count = 5
        self.restart_count = 0
        self.max_restarts = 3
        
        # Health monitoring
        self.health_file = Path(f"agent_monitoring/{agent_name.lower().replace(' ', '_')}_health.json")
        self.health_file.parent.mkdir(exist_ok=True)
        
        # Task queue and processing
        self.task_queue = []
        self.processing_lock = threading.Lock()
        self.health_thread = None
        self.task_thread = None
        
        # Signal handlers for graceful shutdown
        signal.signal(signal.SIGINT, self.signal_handler)
        signal.signal(signal.SIGTERM, self.signal_handler)
        
        print(f"🚀 {self.agent_name} ({self.role}) initialized")
    
    def signal_handler(self, signum, frame):
        """Handle shutdown signals gracefully"""
        print(f"🛑 {self.agent_name} received shutdown signal")
        self.shutdown()
        sys.exit(0)
    
    def update_health(self, status: str = "active", message: str = "Agent is running normally"):
        """Update agent health status"""
        self.last_activity = datetime.now()
        
        health_data = {
            "agent_name": self.agent_name,
            "role": self.role,
            "status": status,
            "message": message,
            "start_time": self.start_time.isoformat(),
            "last_activity": self.last_activity.isoformat(),
            "uptime_seconds": (datetime.now() - self.start_time).total_seconds(),
            "task_count": self.task_count,
            "error_count": self.error_count,
            "restart_count": self.restart_count,
            "pid": os.getpid(),
            "memory_usage_mb": self.get_memory_usage(),
            "cpu_usage_percent": self.get_cpu_usage(),
            "queue_size": len(self.task_queue),
            "is_running": self.is_running
        }
        
        try:
            with open(self.health_file, "w") as f:
                json.dump(health_data, f, indent=2)
        except Exception as e:
            print(f"❌ {self.agent_name} health update error: {e}")
    
    def get_memory_usage(self) -> float:
        """Get current memory usage in MB"""
        try:
            process = psutil.Process(os.getpid())
            return process.memory_info().rss / 1024 / 1024
        except:
            return 0.0
    
    def get_cpu_usage(self) -> float:
        """Get current CPU usage percentage"""
        try:
            process = psutil.Process(os.getpid())
            return process.cpu_percent()
        except:
            return 0.0
    
    def health_check_loop(self):
        """Continuous health monitoring loop"""
        print(f"💓 {self.agent_name} health monitoring started")
        
        while self.is_running:
            try:
                # Check for idle timeout
                idle_time = (datetime.now() - self.last_activity).total_seconds()
                if idle_time > self.max_idle_time:
                    print(f"⚠️ {self.agent_name} detected idle timeout ({idle_time:.1f}s)")
                    self.handle_idle_timeout()
                
                # Check error count
                if self.error_count > self.max_error_count:
                    print(f"🚨 {self.agent_name} error count exceeded limit")
                    self.handle_error_threshold()
                
                # Update health status
                self.update_health("active", f"{self.agent_name} is running and healthy")
                
                # Print heartbeat
                print(f"💓 {self.agent_name} heartbeat - Tasks: {self.task_count}, Errors: {self.error_count}")
                
                time.sleep(self.health_check_interval)
                
            except Exception as e:
                self.error_count += 1
                print(f"❌ {self.agent_name} health check error: {e}")
                time.sleep(5)
    
    def task_processing_loop(self):
        """Main task processing loop with self-correction"""
        print(f"⚙️ {self.agent_name} task processing started")
        
        while self.is_running:
            try:
                # Process tasks from queue
                with self.processing_lock:
                    if self.task_queue:
                        task = self.task_queue.pop(0)
                        self.process_task(task)
                    else:
                        # No tasks - perform idle work
                        self.perform_idle_work()
                
                # Update activity timestamp
                self.last_activity = datetime.now()
                
                # Small delay to prevent busy waiting
                time.sleep(1)
                
            except Exception as e:
                self.error_count += 1
                print(f"❌ {self.agent_name} task processing error: {e}")
                traceback.print_exc()
                time.sleep(5)
    
    def process_task(self, task: Dict):
        """Process a single task with error handling"""
        try:
            print(f"📋 {self.agent_name} processing task: {task.get('type', 'unknown')}")
            
            # Update task count
            self.task_count += 1
            
            # Execute task based on type
            task_type = task.get('type', 'unknown')
            
            if task_type == 'code_generation':
                self.handle_code_generation(task)
            elif task_type == 'testing':
                self.handle_testing(task)
            elif task_type == 'refactoring':
                self.handle_refactoring(task)
            elif task_type == 'optimization':
                self.handle_optimization(task)
            elif task_type == 'documentation':
                self.handle_documentation(task)
            else:
                self.handle_generic_task(task)
            
            print(f"✅ {self.agent_name} completed task: {task_type}")
            
        except Exception as e:
            self.error_count += 1
            print(f"❌ {self.agent_name} task error: {e}")
            self.handle_task_error(task, e)
    
    def perform_idle_work(self):
        """Perform work when no tasks are available"""
        try:
            # Agent-specific idle work
            self.idle_work()
            
            # Update activity
            self.last_activity = datetime.now()
            
        except Exception as e:
            self.error_count += 1
            print(f"❌ {self.agent_name} idle work error: {e}")
    
    def handle_idle_timeout(self):
        """Handle idle timeout - restart agent if necessary"""
        print(f"🔄 {self.agent_name} handling idle timeout")
        
        if self.restart_count < self.max_restarts:
            self.restart_count += 1
            print(f"🔄 {self.agent_name} restarting due to idle timeout (attempt {self.restart_count})")
            self.restart()
        else:
            print(f"❌ {self.agent_name} exceeded max restarts, shutting down")
            self.shutdown()
    
    def handle_error_threshold(self):
        """Handle error threshold exceeded"""
        print(f"🚨 {self.agent_name} handling error threshold")
        
        if self.restart_count < self.max_restarts:
            self.restart_count += 1
            print(f"🔄 {self.agent_name} restarting due to error threshold (attempt {self.restart_count})")
            self.restart()
        else:
            print(f"❌ {self.agent_name} exceeded max restarts, shutting down")
            self.shutdown()
    
    def handle_task_error(self, task: Dict, error: Exception):
        """Handle task-specific errors"""
        print(f"⚠️ {self.agent_name} handling task error: {error}")
        
        # Try to recover from task error
        try:
            self.recover_from_task_error(task, error)
        except Exception as recovery_error:
            print(f"❌ {self.agent_name} task recovery failed: {recovery_error}")
    
    def restart(self):
        """Restart the agent"""
        print(f"🔄 {self.agent_name} restarting...")
        
        # Stop current threads
        self.is_running = False
        
        if self.health_thread:
            self.health_thread.join(timeout=5)
        
        if self.task_thread:
            self.task_thread.join(timeout=5)
        
        # Reset error count
        self.error_count = 0
        
        # Start new threads
        self.is_running = True
        self.start_threads()
        
        print(f"✅ {self.agent_name} restarted successfully")
    
    def shutdown(self):
        """Graceful shutdown"""
        print(f"🛑 {self.agent_name} shutting down...")
        
        self.is_running = False
        self.update_health("shutting_down", "Agent is shutting down")
        
        # Stop threads
        if self.health_thread:
            self.health_thread.join(timeout=5)
        
        if self.task_thread:
            self.task_thread.join(timeout=5)
        
        print(f"✅ {self.agent_name} shutdown complete")
    
    def start_threads(self):
        """Start monitoring and task processing threads"""
        # Health monitoring thread
        self.health_thread = threading.Thread(target=self.health_check_loop, daemon=True)
        self.health_thread.start()
        
        # Task processing thread
        self.task_thread = threading.Thread(target=self.task_processing_loop, daemon=True)
        self.task_thread.start()
    
    def start(self):
        """Start the agent"""
        print(f"🚀 {self.agent_name} starting...")
        
        self.is_running = True
        self.start_threads()
        
        print(f"✅ {self.agent_name} started successfully")
        
        # Keep main thread alive
        try:
            while self.is_running:
                time.sleep(1)
        except KeyboardInterrupt:
            print(f"🛑 {self.agent_name} received interrupt")
            self.shutdown()
    
    def add_task(self, task: Dict):
        """Add a task to the processing queue"""
        with self.processing_lock:
            self.task_queue.append(task)
            print(f"📥 {self.agent_name} added task: {task.get('type', 'unknown')}")
    
    # Abstract methods that must be implemented by specific agents
    @abstractmethod
    def idle_work(self):
        """Agent-specific idle work"""
        pass
    
    @abstractmethod
    def handle_code_generation(self, task: Dict):
        """Handle code generation tasks"""
        pass
    
    @abstractmethod
    def handle_testing(self, task: Dict):
        """Handle testing tasks"""
        pass
    
    @abstractmethod
    def handle_refactoring(self, task: Dict):
        """Handle refactoring tasks"""
        pass
    
    @abstractmethod
    def handle_optimization(self, task: Dict):
        """Handle optimization tasks"""
        pass
    
    @abstractmethod
    def handle_documentation(self, task: Dict):
        """Handle documentation tasks"""
        pass
    
    @abstractmethod
    def handle_generic_task(self, task: Dict):
        """Handle generic tasks"""
        pass
    
    @abstractmethod
    def recover_from_task_error(self, task: Dict, error: Exception):
        """Recover from task-specific errors"""
        pass

class EngineDevelopmentAgent(AgentProtocolV2):
    """Engine Development Agent with self-correction"""
    
    def __init__(self):
        super().__init__("Engine Development Agent", "Core engine development and optimization")
    
    def idle_work(self):
        """Engine development idle work"""
        # Analyze code quality, review recent changes, optimize algorithms
        print(f"🔧 {self.agent_name} performing engine optimization analysis")
        time.sleep(2)
    
    def handle_code_generation(self, task: Dict):
        """Handle engine code generation"""
        print(f"🔧 {self.agent_name} generating engine code: {task.get('description', 'No description')}")
        # Implement engine code generation logic
        time.sleep(3)
    
    def handle_testing(self, task: Dict):
        """Handle engine testing"""
        print(f"🧪 {self.agent_name} testing engine components: {task.get('description', 'No description')}")
        # Implement engine testing logic
        time.sleep(2)
    
    def handle_refactoring(self, task: Dict):
        """Handle engine refactoring"""
        print(f"🔄 {self.agent_name} refactoring engine code: {task.get('description', 'No description')}")
        # Implement engine refactoring logic
        time.sleep(4)
    
    def handle_optimization(self, task: Dict):
        """Handle engine optimization"""
        print(f"⚡ {self.agent_name} optimizing engine performance: {task.get('description', 'No description')}")
        # Implement engine optimization logic
        time.sleep(5)
    
    def handle_documentation(self, task: Dict):
        """Handle engine documentation"""
        print(f"📚 {self.agent_name} documenting engine: {task.get('description', 'No description')}")
        # Implement engine documentation logic
        time.sleep(2)
    
    def handle_generic_task(self, task: Dict):
        """Handle generic engine tasks"""
        print(f"🔧 {self.agent_name} handling generic task: {task.get('description', 'No description')}")
        # Implement generic task logic
        time.sleep(1)
    
    def recover_from_task_error(self, task: Dict, error: Exception):
        """Recover from engine task errors"""
        print(f"🔄 {self.agent_name} recovering from error: {error}")
        # Implement engine-specific error recovery
        time.sleep(2)

class TestingAgent(AgentProtocolV2):
    """Testing Agent with self-correction"""
    
    def __init__(self):
        super().__init__("Testing Agent", "Comprehensive testing and quality assurance")
    
    def idle_work(self):
        """Testing idle work"""
        # Review test coverage, analyze test results, prepare test cases
        print(f"🧪 {self.agent_name} analyzing test coverage and results")
        time.sleep(2)
    
    def handle_code_generation(self, task: Dict):
        """Handle test code generation"""
        print(f"🧪 {self.agent_name} generating test code: {task.get('description', 'No description')}")
        # Implement test code generation logic
        time.sleep(3)
    
    def handle_testing(self, task: Dict):
        """Handle testing tasks"""
        print(f"🧪 {self.agent_name} executing tests: {task.get('description', 'No description')}")
        # Implement testing logic
        time.sleep(4)
    
    def handle_refactoring(self, task: Dict):
        """Handle test refactoring"""
        print(f"🔄 {self.agent_name} refactoring tests: {task.get('description', 'No description')}")
        # Implement test refactoring logic
        time.sleep(3)
    
    def handle_optimization(self, task: Dict):
        """Handle test optimization"""
        print(f"⚡ {self.agent_name} optimizing test performance: {task.get('description', 'No description')}")
        # Implement test optimization logic
        time.sleep(3)
    
    def handle_documentation(self, task: Dict):
        """Handle test documentation"""
        print(f"📚 {self.agent_name} documenting tests: {task.get('description', 'No description')}")
        # Implement test documentation logic
        time.sleep(2)
    
    def handle_generic_task(self, task: Dict):
        """Handle generic testing tasks"""
        print(f"🧪 {self.agent_name} handling generic task: {task.get('description', 'No description')}")
        # Implement generic task logic
        time.sleep(1)
    
    def recover_from_task_error(self, task: Dict, error: Exception):
        """Recover from testing task errors"""
        print(f"🔄 {self.agent_name} recovering from error: {error}")
        # Implement testing-specific error recovery
        time.sleep(2)

def create_agent(agent_type: str) -> AgentProtocolV2:
    """Factory function to create agents"""
    agents = {
        "engine": EngineDevelopmentAgent,
        "testing": TestingAgent,
        # Add more agent types here
    }
    
    if agent_type not in agents:
        raise ValueError(f"Unknown agent type: {agent_type}")
    
    return agents[agent_type]()

def main():
    """Main function to demonstrate the agent protocol"""
    print("🚀 Starting Agent Protocol V2 Demo")
    print("=" * 50)
    
    # Create and start agents
    agents = []
    
    try:
        # Create engine development agent
        engine_agent = create_agent("engine")
        agents.append(engine_agent)
        
        # Create testing agent
        testing_agent = create_agent("testing")
        agents.append(testing_agent)
        
        # Start agents in separate threads
        agent_threads = []
        for agent in agents:
            thread = threading.Thread(target=agent.start, daemon=True)
            thread.start()
            agent_threads.append(thread)
        
        print("✅ All agents started successfully")
        
        # Add some sample tasks
        sample_tasks = [
            {"type": "code_generation", "description": "Generate USE Engine core"},
            {"type": "testing", "description": "Run unit tests"},
            {"type": "refactoring", "description": "Refactor player model"},
            {"type": "optimization", "description": "Optimize simulation loop"},
            {"type": "documentation", "description": "Update API docs"}
        ]
        
        # Distribute tasks to agents
        for i, task in enumerate(sample_tasks):
            agent = agents[i % len(agents)]
            agent.add_task(task)
        
        # Keep main thread alive
        while True:
            time.sleep(10)
            
            # Print status
            print(f"\n📊 Agent Status Summary:")
            for agent in agents:
                print(f"  {agent.agent_name}: Tasks={agent.task_count}, Errors={agent.error_count}")
    
    except KeyboardInterrupt:
        print("\n🛑 Shutting down agents...")
        for agent in agents:
            agent.shutdown()
        print("✅ All agents shut down")

if __name__ == "__main__":
    main()
