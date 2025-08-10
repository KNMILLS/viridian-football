package com.viridianfootball.engine.core;

/**
 * Configuration class for the USE Engine
 * Contains all configurable parameters for engine operation
 */
public class EngineConfig {
    
    // Performance settings
    private int maxSimulationsPerSecond = 100;
    private int threadPoolSize = 4;
    private boolean enablePerformanceMonitoring = true;
    
    // Simulation settings
    private boolean enableRealtimeSimulation = false;
    private double timeAcceleration = 1.0;
    private boolean enableDetailedPhysics = true;
    
    // AI settings
    private boolean enableAIDecisionMaking = true;
    private int aiComplexityLevel = 3; // 1-5 scale
    
    public EngineConfig() {
        // Default configuration
    }
    
    // Getters and Setters
    public int getMaxSimulationsPerSecond() {
        return maxSimulationsPerSecond;
    }
    
    public void setMaxSimulationsPerSecond(int maxSimulationsPerSecond) {
        this.maxSimulationsPerSecond = maxSimulationsPerSecond;
    }
    
    public int getThreadPoolSize() {
        return threadPoolSize;
    }
    
    public void setThreadPoolSize(int threadPoolSize) {
        this.threadPoolSize = threadPoolSize;
    }
    
    public boolean isEnablePerformanceMonitoring() {
        return enablePerformanceMonitoring;
    }
    
    public void setEnablePerformanceMonitoring(boolean enablePerformanceMonitoring) {
        this.enablePerformanceMonitoring = enablePerformanceMonitoring;
    }
    
    public boolean isEnableRealtimeSimulation() {
        return enableRealtimeSimulation;
    }
    
    public void setEnableRealtimeSimulation(boolean enableRealtimeSimulation) {
        this.enableRealtimeSimulation = enableRealtimeSimulation;
    }
    
    public double getTimeAcceleration() {
        return timeAcceleration;
    }
    
    public void setTimeAcceleration(double timeAcceleration) {
        this.timeAcceleration = timeAcceleration;
    }
    
    public boolean isEnableDetailedPhysics() {
        return enableDetailedPhysics;
    }
    
    public void setEnableDetailedPhysics(boolean enableDetailedPhysics) {
        this.enableDetailedPhysics = enableDetailedPhysics;
    }
    
    public boolean isEnableAIDecisionMaking() {
        return enableAIDecisionMaking;
    }
    
    public void setEnableAIDecisionMaking(boolean enableAIDecisionMaking) {
        this.enableAIDecisionMaking = enableAIDecisionMaking;
    }
    
    public int getAiComplexityLevel() {
        return aiComplexityLevel;
    }
    
    public void setAiComplexityLevel(int aiComplexityLevel) {
        this.aiComplexityLevel = aiComplexityLevel;
    }
}