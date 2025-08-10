package com.viridianfootball.engine.performance;

import java.time.LocalDateTime;
import java.util.concurrent.atomic.AtomicLong;

/**
 * Performance metrics tracking for the USE Engine
 */
public class PerformanceMetrics {
    
    private AtomicLong simulationsExecuted = new AtomicLong(0);
    private AtomicLong totalExecutionTime = new AtomicLong(0);
    private LocalDateTime trackingStartTime;
    private boolean isTracking = false;
    
    /**
     * Start performance tracking
     */
    public void startTracking() {
        this.trackingStartTime = LocalDateTime.now();
        this.isTracking = true;
        this.simulationsExecuted.set(0);
        this.totalExecutionTime.set(0);
    }
    
    /**
     * Stop performance tracking
     */
    public void stopTracking() {
        this.isTracking = false;
    }
    
    /**
     * Record a completed simulation
     * 
     * @param executionTimeMs Execution time in milliseconds
     */
    public void recordSimulation(long executionTimeMs) {
        if (isTracking) {
            simulationsExecuted.incrementAndGet();
            totalExecutionTime.addAndGet(executionTimeMs);
        }
    }
    
    /**
     * Get the number of simulations executed since tracking started
     * 
     * @return Number of simulations
     */
    public long getSimulationsExecuted() {
        return simulationsExecuted.get();
    }
    
    /**
     * Get the total execution time for all simulations
     * 
     * @return Total execution time in milliseconds
     */
    public long getTotalExecutionTime() {
        return totalExecutionTime.get();
    }
    
    /**
     * Get the average execution time per simulation
     * 
     * @return Average execution time in milliseconds
     */
    public double getAverageExecutionTime() {
        long sims = simulationsExecuted.get();
        if (sims == 0) return 0.0;
        return (double) totalExecutionTime.get() / sims;
    }
    
    /**
     * Get simulations per second
     * 
     * @return Simulations per second
     */
    public double getSimulationsPerSecond() {
        if (!isTracking || trackingStartTime == null) return 0.0;
        
        long secondsElapsed = java.time.Duration.between(trackingStartTime, LocalDateTime.now()).getSeconds();
        if (secondsElapsed == 0) return 0.0;
        
        return (double) simulationsExecuted.get() / secondsElapsed;
    }
    
    /**
     * Check if performance tracking is currently active
     * 
     * @return True if tracking is active
     */
    public boolean isTracking() {
        return isTracking;
    }
}