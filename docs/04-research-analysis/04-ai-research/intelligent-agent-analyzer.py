#!/usr/bin/env python3
"""
Intelligent Agent Analyzer for Viridian Football

This script analyzes running agents, their capabilities, and automatically
selects and configures the optimal agent for specific tasks.

Usage:
    python intelligent-agent-analyzer.py --analyze-running
    python intelligent-agent-analyzer.py --select-for-task "engine optimization"
    python intelligent-agent-analyzer.py --auto-configure
"""

import os
import sys
import json
import psutil
import subprocess
import argparse
import threading
import time
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass
from enum import Enum

class AgentStatus(Enum):
    RUNNING = "running"
    IDLE = "idle"
    BUSY = "busy"
    ERROR = "error"
    UNKNOWN = "unknown"

@dataclass
class AgentInfo:
    """Information about a detected agent"""
    pid: int
    name: str
    role: str
    status: AgentStatus
    capabilities: List[str]
    current_task: Optional[str]
    resource_usage: Dict[str, float]
    uptime: float
    performance_score: float
    last_heartbeat: datetime
    error_count: int
    success_count: int

class IntelligentAgentAnalyzer:
    """Intelligent agent analysis and selection system"""
    
    def __init__(self, project_root: str = "."):
        self.project_root = Path(project_root)
        self.docs_path = self.project_root / "docs"
        self.ai_research_path = self.docs_path / "04-research-analysis" / "04-ai-research"
        
        # Agent detection patterns
        self.agent_patterns = {
            'Engine Development Agent': {
                'keywords': ['engine', 'USE', 'performance', 'optimization', 'core', 'system'],
                'process_patterns': ['python', 'java', 'rust'],
                'file_patterns': ['engine', 'USE', 'performance'],
                'capabilities': [
                    "USE engine implementation",
                    "Performance optimization", 
                    "Build management",
                    "Integration coordination",
                    "Documentation maintenance"
                ]
            },
            'Testing Agent': {
                'keywords': ['test', 'validation', 'quality', 'coverage', 'qa', 'testing'],
                'process_patterns': ['pytest', 'test', 'validation'],
                'file_patterns': ['test', 'validation', 'quality'],
                'capabilities': [
                    "Test development",
                    "Test execution",
                    "Result reporting",
                    "Coverage analysis",
                    "Quality validation"
                ]
            },
            'Data Model Agent': {
                'keywords': ['data', 'schema', 'database', 'model', 'structure', 'migration'],
                'process_patterns': ['database', 'schema', 'migration'],
                'file_patterns': ['data', 'schema', 'database'],
                'capabilities': [
                    "Schema design",
                    "Data validation",
                    "Migration management",
                    "Interface design",
                    "Integrity maintenance"
                ]
            },
            'Orchestrator Agent': {
                'keywords': ['orchestrator', 'coordinate', 'manage', 'delegate', 'supervise'],
                'process_patterns': ['orchestrator', 'coordinator', 'manager'],
                'file_patterns': ['orchestrator', 'coordinate'],
                'capabilities': [
                    "Task decomposition",
                    "Agent coordination",
                    "Health monitoring",
                    "Conflict resolution",
                    "State management"
                ]
            },
            'General Development Agent': {
                'keywords': ['development', 'code', 'implement', 'general'],
                'process_patterns': ['python', 'java', 'rust', 'development'],
                'file_patterns': ['development', 'code'],
                'capabilities': [
                    "General development",
                    "Protocol compliance",
                    "Code implementation",
                    "Documentation",
                    "Integration"
                ]
            }
        }
        
        # Task-to-agent mapping
        self.task_mapping = {
            'engine': ['Engine Development Agent'],
            'performance': ['Engine Development Agent'],
            'optimization': ['Engine Development Agent'],
            'testing': ['Testing Agent'],
            'validation': ['Testing Agent'],
            'data': ['Data Model Agent'],
            'schema': ['Data Model Agent'],
            'database': ['Data Model Agent'],
            'coordination': ['Orchestrator Agent'],
            'management': ['Orchestrator Agent'],
            'development': ['General Development Agent', 'Engine Development Agent'],
            'documentation': ['General Development Agent'],
            'integration': ['Engine Development Agent', 'General Development Agent']
        }
    
    def detect_running_agents(self) -> List[AgentInfo]:
        """Detect all running agents in the system"""
        print("🔍 Detecting running agents...")
        
        running_agents = []
        
        for proc in psutil.process_iter(['pid', 'name', 'cmdline', 'create_time', 'memory_info', 'cpu_percent']):
            try:
                # Check if this is a Python process that might be an agent
                if 'python' in proc.info['name'].lower():
                    cmdline = ' '.join(proc.info['cmdline'] or [])
                    
                    # Check if this looks like an agent process
                    if self._is_agent_process(cmdline, proc.info['name']):
                        agent_info = self._analyze_agent_process(proc)
                        if agent_info:
                            running_agents.append(agent_info)
                            print(f"  ✅ Detected: {agent_info.name} ({agent_info.role})")
                
                # Check for other agent types (Java, Rust, etc.)
                elif any(pattern in proc.info['name'].lower() for pattern in ['java', 'rust', 'node']):
                    cmdline = ' '.join(proc.info['cmdline'] or [])
                    if self._is_agent_process(cmdline, proc.info['name']):
                        agent_info = self._analyze_agent_process(proc)
                        if agent_info:
                            running_agents.append(agent_info)
                            print(f"  ✅ Detected: {agent_info.name} ({agent_info.role})")
                            
            except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
                continue
        
        print(f"📊 Found {len(running_agents)} running agents")
        return running_agents
    
    def _is_agent_process(self, cmdline: str, process_name: str) -> bool:
        """Check if a process looks like an agent"""
        cmdline_lower = cmdline.lower()
        process_lower = process_name.lower()
        
        # Check for agent-related keywords
        agent_keywords = ['agent', 'cursor', 'viridian', 'football', 'nfl', 'gm']
        
        for keyword in agent_keywords:
            if keyword in cmdline_lower or keyword in process_lower:
                return True
        
        # Check for project-specific patterns
        if 'viridian' in cmdline_lower or 'football' in cmdline_lower:
            return True
        
        return False
    
    def _analyze_agent_process(self, proc) -> Optional[AgentInfo]:
        """Analyze a specific agent process"""
        try:
            # Get basic process info
            pid = proc.info['pid']
            name = proc.info['name']
            create_time = proc.info['create_time']
            
            # Calculate uptime
            uptime = time.time() - create_time
            
            # Get resource usage
            memory_mb = proc.info['memory_info'].rss / 1024 / 1024
            cpu_percent = proc.info['cpu_percent']
            
            # Determine agent role
            role = self._detect_agent_role(proc)
            
            # Get capabilities
            capabilities = self.agent_patterns.get(role, {}).get('capabilities', [])
            
            # Determine status
            status = self._determine_agent_status(proc, cpu_percent, memory_mb)
            
            # Get current task (if possible)
            current_task = self._get_current_task(proc)
            
            # Calculate performance score
            performance_score = self._calculate_performance_score(proc, cpu_percent, memory_mb, uptime)
            
            # Get error/success counts (simplified)
            error_count = 0  # Would need to parse logs in real implementation
            success_count = 0  # Would need to parse logs in real implementation
            
            return AgentInfo(
                pid=pid,
                name=name,
                role=role,
                status=status,
                capabilities=capabilities,
                current_task=current_task,
                resource_usage={'memory_mb': memory_mb, 'cpu_percent': cpu_percent},
                uptime=uptime,
                performance_score=performance_score,
                last_heartbeat=datetime.now(),  # Simplified
                error_count=error_count,
                success_count=success_count
            )
            
        except Exception as e:
            print(f"⚠️  Error analyzing process {proc.info['pid']}: {e}")
            return None
    
    def _detect_agent_role(self, proc) -> str:
        """Detect the role of an agent process"""
        try:
            cmdline = ' '.join(proc.info['cmdline'] or [])
            cmdline_lower = cmdline.lower()
            
            # Check each role pattern
            for role, patterns in self.agent_patterns.items():
                for keyword in patterns['keywords']:
                    if keyword.lower() in cmdline_lower:
                        return role
            
            # Default to General Development Agent
            return "General Development Agent"
            
        except Exception:
            return "General Development Agent"
    
    def _determine_agent_status(self, proc, cpu_percent: float, memory_mb: float) -> AgentStatus:
        """Determine the current status of an agent"""
        try:
            # Check if process is responding
            if not proc.is_running():
                return AgentStatus.ERROR
            
            # Check resource usage for busy status
            if cpu_percent > 80 or memory_mb > 1000:  # High resource usage
                return AgentStatus.BUSY
            elif cpu_percent < 5 and memory_mb < 100:  # Low resource usage
                return AgentStatus.IDLE
            else:
                return AgentStatus.RUNNING
                
        except Exception:
            return AgentStatus.UNKNOWN
    
    def _get_current_task(self, proc) -> Optional[str]:
        """Get the current task of an agent (simplified)"""
        try:
            # In a real implementation, this would parse logs or check shared state
            # For now, return a placeholder
            return "Unknown task"
        except Exception:
            return None
    
    def _calculate_performance_score(self, proc, cpu_percent: float, memory_mb: float, uptime: float) -> float:
        """Calculate a performance score for the agent"""
        try:
            # Base score starts at 100
            score = 100.0
            
            # Penalize high resource usage
            if cpu_percent > 90:
                score -= 20
            elif cpu_percent > 70:
                score -= 10
            
            if memory_mb > 2000:
                score -= 20
            elif memory_mb > 1000:
                score -= 10
            
            # Bonus for stable uptime
            if uptime > 3600:  # More than 1 hour
                score += 10
            elif uptime > 1800:  # More than 30 minutes
                score += 5
            
            # Ensure score is within bounds
            return max(0.0, min(100.0, score))
            
        except Exception:
            return 50.0  # Default score
    
    def analyze_running_agents(self) -> Dict:
        """Analyze all running agents and generate a comprehensive report"""
        print("🔍 Analyzing running agents...")
        
        running_agents = self.detect_running_agents()
        
        if not running_agents:
            print("📊 No running agents detected")
            return {
                "total_agents": 0,
                "agents": [],
                "recommendations": ["No agents running - consider starting new agents"]
            }
        
        # Calculate statistics
        total_agents = len(running_agents)
        busy_agents = [a for a in running_agents if a.status == AgentStatus.BUSY]
        idle_agents = [a for a in running_agents if a.status == AgentStatus.IDLE]
        error_agents = [a for a in running_agents if a.status == AgentStatus.ERROR]
        
        # Group by role
        agents_by_role = {}
        for agent in running_agents:
            if agent.role not in agents_by_role:
                agents_by_role[agent.role] = []
            agents_by_role[agent.role].append(agent)
        
        # Generate recommendations
        recommendations = self._generate_recommendations(running_agents, agents_by_role)
        
        analysis_report = {
            "timestamp": datetime.now().isoformat(),
            "total_agents": total_agents,
            "status_breakdown": {
                "running": len([a for a in running_agents if a.status == AgentStatus.RUNNING]),
                "busy": len(busy_agents),
                "idle": len(idle_agents),
                "error": len(error_agents)
            },
            "role_breakdown": {role: len(agents) for role, agents in agents_by_role.items()},
            "agents": [self._agent_to_dict(agent) for agent in running_agents],
            "recommendations": recommendations,
            "optimal_agent_selection": self._select_optimal_agents(running_agents)
        }
        
        print(f"📊 Analysis complete: {total_agents} agents analyzed")
        return analysis_report
    
    def _generate_recommendations(self, agents: List[AgentInfo], agents_by_role: Dict) -> List[str]:
        """Generate recommendations based on agent analysis"""
        recommendations = []
        
        # Check for missing critical roles
        critical_roles = ['Engine Development Agent', 'Testing Agent', 'Data Model Agent']
        for role in critical_roles:
            if role not in agents_by_role:
                recommendations.append(f"Start a {role} - critical role missing")
        
        # Check for overloaded agents
        for agent in agents:
            if agent.status == AgentStatus.BUSY and agent.performance_score < 70:
                recommendations.append(f"Agent {agent.name} is overloaded - consider starting additional {agent.role}")
        
        # Check for idle agents that could be utilized
        idle_count = len([a for a in agents if a.status == AgentStatus.IDLE])
        if idle_count > 2:
            recommendations.append(f"{idle_count} agents are idle - consider task redistribution")
        
        # Check for error states
        error_agents = [a for a in agents if a.status == AgentStatus.ERROR]
        for agent in error_agents:
            recommendations.append(f"Agent {agent.name} is in error state - restart recommended")
        
        if not recommendations:
            recommendations.append("Agent system is well-balanced and healthy")
        
        return recommendations
    
    def _select_optimal_agents(self, agents: List[AgentInfo]) -> Dict:
        """Select optimal agents for different task types"""
        optimal_selection = {}
        
        # Group agents by role
        agents_by_role = {}
        for agent in agents:
            if agent.role not in agents_by_role:
                agents_by_role[agent.role] = []
            agents_by_role[agent.role].append(agent)
        
        # Select best agent for each role
        for role, role_agents in agents_by_role.items():
            if role_agents:
                # Sort by performance score and select the best
                best_agent = max(role_agents, key=lambda a: a.performance_score)
                optimal_selection[role] = {
                    "agent_id": best_agent.pid,
                    "name": best_agent.name,
                    "performance_score": best_agent.performance_score,
                    "status": best_agent.status.value,
                    "capabilities": best_agent.capabilities
                }
        
        return optimal_selection
    
    def select_agent_for_task(self, task_description: str) -> Optional[AgentInfo]:
        """Select the best agent for a specific task"""
        print(f"🎯 Selecting agent for task: {task_description}")
        
        running_agents = self.detect_running_agents()
        
        if not running_agents:
            print("❌ No running agents available")
            return None
        
        # Determine task type
        task_lower = task_description.lower()
        suitable_roles = []
        
        for task_keyword, roles in self.task_mapping.items():
            if task_keyword in task_lower:
                suitable_roles.extend(roles)
        
        if not suitable_roles:
            suitable_roles = ["General Development Agent"]  # Default
        
        # Filter agents by suitable roles
        suitable_agents = [a for a in running_agents if a.role in suitable_roles]
        
        if not suitable_agents:
            print(f"❌ No suitable agents found for task type: {suitable_roles}")
            return None
        
        # Score agents based on multiple factors
        scored_agents = []
        for agent in suitable_agents:
            score = self._calculate_task_suitability_score(agent, task_description)
            scored_agents.append((agent, score))
        
        # Select the best agent
        best_agent, best_score = max(scored_agents, key=lambda x: x[1])
        
        print(f"✅ Selected agent: {best_agent.name} ({best_agent.role}) - Score: {best_score:.2f}")
        return best_agent
    
    def _calculate_task_suitability_score(self, agent: AgentInfo, task_description: str) -> float:
        """Calculate how suitable an agent is for a specific task"""
        score = 0.0
        
        # Base score from performance
        score += agent.performance_score * 0.3
        
        # Status bonus/penalty
        if agent.status == AgentStatus.IDLE:
            score += 20  # Idle agents are preferred
        elif agent.status == AgentStatus.BUSY:
            score -= 10  # Busy agents are penalized
        elif agent.status == AgentStatus.ERROR:
            score -= 50  # Error agents are heavily penalized
        
        # Capability match bonus
        task_lower = task_description.lower()
        capability_matches = sum(1 for cap in agent.capabilities if cap.lower() in task_lower)
        score += capability_matches * 10
        
        # Uptime bonus (stable agents preferred)
        if agent.uptime > 3600:  # More than 1 hour
            score += 15
        elif agent.uptime > 1800:  # More than 30 minutes
            score += 10
        
        # Error rate penalty
        if agent.error_count > 0:
            score -= agent.error_count * 5
        
        return max(0.0, score)
    
    def auto_configure_agent(self, task_description: str) -> Dict:
        """Automatically configure the best agent for a task"""
        print(f"🤖 Auto-configuring agent for task: {task_description}")
        
        # Select the best agent
        selected_agent = self.select_agent_for_task(task_description)
        
        if not selected_agent:
            # No suitable agent found, recommend starting a new one
            recommended_role = self._recommend_new_agent_role(task_description)
            return {
                "status": "no_suitable_agent",
                "recommendation": f"Start a new {recommended_role}",
                "task_description": task_description,
                "configuration": self._generate_agent_configuration(recommended_role, task_description)
            }
        
        # Configure the selected agent
        configuration = self._generate_agent_configuration(selected_agent.role, task_description)
        
        return {
            "status": "agent_selected",
            "selected_agent": self._agent_to_dict(selected_agent),
            "task_description": task_description,
            "configuration": configuration,
            "estimated_completion_time": self._estimate_completion_time(selected_agent, task_description)
        }
    
    def _recommend_new_agent_role(self, task_description: str) -> str:
        """Recommend what type of agent to start for a task"""
        task_lower = task_description.lower()
        
        for task_keyword, roles in self.task_mapping.items():
            if task_keyword in task_lower:
                return roles[0]  # Return the first (most suitable) role
        
        return "General Development Agent"
    
    def _generate_agent_configuration(self, role: str, task_description: str) -> Dict:
        """Generate configuration for an agent"""
        role_config = self.agent_patterns.get(role, {})
        
        return {
            "role": role,
            "task": task_description,
            "capabilities": role_config.get('capabilities', []),
            "protocols": {
                "timeout_seconds": 300,
                "heartbeat_interval": 30,
                "max_retries": 3,
                "resource_limits": {
                    "max_memory_mb": 1000,
                    "max_cpu_percent": 80
                }
            },
            "communication": {
                "format": "json",
                "reporting_interval": 60
            },
            "error_handling": {
                "graceful_failure": True,
                "exponential_backoff": True,
                "human_escalation": True
            }
        }
    
    def _estimate_completion_time(self, agent: AgentInfo, task_description: str) -> str:
        """Estimate task completion time"""
        # Simplified estimation based on agent performance and task complexity
        base_time = 30  # minutes
        
        # Adjust based on agent performance
        if agent.performance_score > 80:
            base_time *= 0.8
        elif agent.performance_score < 60:
            base_time *= 1.5
        
        # Adjust based on task complexity
        task_words = len(task_description.split())
        if task_words > 50:
            base_time *= 1.5
        elif task_words < 10:
            base_time *= 0.7
        
        return f"{int(base_time)} minutes"
    
    def _agent_to_dict(self, agent: AgentInfo) -> Dict:
        """Convert AgentInfo to dictionary"""
        return {
            "pid": agent.pid,
            "name": agent.name,
            "role": agent.role,
            "status": agent.status.value,
            "capabilities": agent.capabilities,
            "current_task": agent.current_task,
            "resource_usage": agent.resource_usage,
            "uptime_seconds": agent.uptime,
            "performance_score": agent.performance_score,
            "error_count": agent.error_count,
            "success_count": agent.success_count
        }

def main():
    """Main function"""
    parser = argparse.ArgumentParser(description="Intelligent Agent Analyzer for Viridian Football")
    parser.add_argument("--analyze-running", action="store_true", help="Analyze all running agents")
    parser.add_argument("--select-for-task", help="Select best agent for specific task")
    parser.add_argument("--auto-configure", help="Auto-configure agent for task")
    parser.add_argument("--project-root", default=".", help="Project root directory")
    
    args = parser.parse_args()
    
    # Initialize analyzer
    analyzer = IntelligentAgentAnalyzer(args.project_root)
    
    try:
        if args.analyze_running:
            # Analyze running agents
            analysis_report = analyzer.analyze_running_agents()
            print("\n📊 AGENT ANALYSIS REPORT:")
            print(json.dumps(analysis_report, indent=2))
            
        elif args.select_for_task:
            # Select agent for task
            selected_agent = analyzer.select_agent_for_task(args.select_for_task)
            if selected_agent:
                print("\n🎯 SELECTED AGENT:")
                print(json.dumps(analyzer._agent_to_dict(selected_agent), indent=2))
            else:
                print("❌ No suitable agent found")
                
        elif args.auto_configure:
            # Auto-configure agent
            configuration = analyzer.auto_configure_agent(args.auto_configure)
            print("\n🤖 AUTO-CONFIGURATION RESULT:")
            print(json.dumps(configuration, indent=2))
            
        else:
            # Default: analyze running agents
            analysis_report = analyzer.analyze_running_agents()
            print("\n📊 AGENT ANALYSIS REPORT:")
            print(json.dumps(analysis_report, indent=2))
        
        sys.exit(0)
        
    except Exception as e:
        print(f"❌ Analysis failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
