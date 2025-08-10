package com.viridianfootball.engine.performance;

import java.util.concurrent.atomic.AtomicLong;
import java.util.concurrent.atomic.AtomicDouble;

/**
 * Performance metrics for the USE Engine
 * 
 * Tracks various performance indicators including timing,
 * memory usage, and throughput metrics.
 */
public class PerformanceMetrics {
    
    // Timing metrics
    private final AtomicLong totalSteps = new AtomicLong(0);
    private final AtomicLong successfulSteps = new AtomicLong(0);
    private final AtomicLong failedSteps = new AtomicLong(0);
    private final AtomicLong skippedSteps = new AtomicLong(0);
    
    // Performance timing
    private final AtomicDouble averageStepTime = new AtomicDouble(0.0);
    private final AtomicDouble minStepTime = new AtomicDouble(Double.MAX_VALUE);
    private final AtomicDouble maxStepTime = new AtomicDouble(0.0);
    private final AtomicDouble lastStepTime = new AtomicDouble(0.0);
    
    // Memory metrics
    private final AtomicLong peakMemoryUsage = new AtomicLong(0);
    private final AtomicLong currentMemoryUsage = new AtomicLong(0);
    private final AtomicLong totalMemoryAllocated = new AtomicLong(0);
    
    // Throughput metrics
    private final AtomicDouble averageFPS = new AtomicDouble(0.0);
    private final AtomicDouble currentFPS = new AtomicDouble(0.0);
    private final AtomicLong totalEntitiesProcessed = new AtomicLong(0);
    
    // Error metrics
    private final AtomicLong totalErrors = new AtomicLong(0);
    private final AtomicLong totalWarnings = new AtomicLong(0);
    private final AtomicLong totalTimeouts = new AtomicLong(0);
    
    /**
     * Creates a new performance metrics instance
     */
    public PerformanceMetrics() {
        // Initialize with default values
    }
    
    /**
     * Records a simulation step
     * 
     * @param stepTime Time taken for the step (seconds)
     * @param success Whether the step was successful
     * @param entityCount Number of entities processed
     */
    public void recordStep(double stepTime, boolean success, int entityCount) {
        totalSteps.incrementAndGet();
        lastStepTime.set(stepTime);
        
        if (success) {
            successfulSteps.incrementAndGet();
        } else {
            failedSteps.incrementAndGet();
        }
        
        // Update timing statistics
        updateStepTimeStats(stepTime);
        
        // Update entity count
        totalEntitiesProcessed.addAndGet(entityCount);
        
        // Update FPS
        updateFPS(stepTime);
    }
    
    /**
     * Records a skipped step
     */
    public void recordSkippedStep() {
        totalSteps.incrementAndGet();
        skippedSteps.incrementAndGet();
    }
    
    /**
     * Records an error
     */
    public void recordError() {
        totalErrors.incrementAndGet();
    }
    
    /**
     * Records a warning
     */
    public void recordWarning() {
        totalWarnings.incrementAndGet();
    }
    
    /**
     * Records a timeout
     */
    public void recordTimeout() {
        totalTimeouts.incrementAndGet();
    }
    
    /**
     * Updates memory usage metrics
     * 
     * @param currentUsage Current memory usage in bytes
     * @param allocated Total memory allocated in bytes
     */
    public void updateMemoryUsage(long currentUsage, long allocated) {
        currentMemoryUsage.set(currentUsage);
        totalMemoryAllocated.set(allocated);
        
        // Update peak if current usage is higher
        long current = currentMemoryUsage.get();
        long peak = peakMemoryUsage.get();
        if (current > peak) {
            peakMemoryUsage.set(current);
        }
    }
    
    /**
     * Updates step time statistics
     * 
     * @param stepTime Time for the current step
     */
    private void updateStepTimeStats(double stepTime) {
        // Update min/max
        double currentMin = minStepTime.get();
        if (stepTime < currentMin) {
            minStepTime.set(stepTime);
        }
        
        double currentMax = maxStepTime.get();
        if (stepTime > currentMax) {
            maxStepTime.set(stepTime);
        }
        
        // Update average
        long total = totalSteps.get();
        double currentAvg = averageStepTime.get();
        double newAvg = ((currentAvg * (total - 1)) + stepTime) / total;
        averageStepTime.set(newAvg);
    }
    
    /**
     * Updates FPS calculation
     * 
     * @param stepTime Time for the current step
     */
    private void updateFPS(double stepTime) {
        if (stepTime > 0) {
            double fps = 1.0 / stepTime;
            currentFPS.set(fps);
            
            // Update average FPS
            long total = totalSteps.get();
            double currentAvg = averageFPS.get();
            double newAvg = ((currentAvg * (total - 1)) + fps) / total;
            averageFPS.set(newAvg);
        }
    }
    
    /**
     * Resets all metrics to zero
     */
    public void reset() {
        totalSteps.set(0);
        successfulSteps.set(0);
        failedSteps.set(0);
        skippedSteps.set(0);
        
        averageStepTime.set(0.0);
        minStepTime.set(Double.MAX_VALUE);
        maxStepTime.set(0.0);
        lastStepTime.set(0.0);
        
        peakMemoryUsage.set(0);
        currentMemoryUsage.set(0);
        totalMemoryAllocated.set(0);
        
        averageFPS.set(0.0);
        currentFPS.set(0.0);
        totalEntitiesProcessed.set(0);
        
        totalErrors.set(0);
        totalWarnings.set(0);
        totalTimeouts.set(0);
    }
    
    // Getters for all metrics
    
    public long getTotalSteps() { return totalSteps.get(); }
    public long getSuccessfulSteps() { return successfulSteps.get(); }
    public long getFailedSteps() { return failedSteps.get(); }
    public long getSkippedSteps() { return skippedSteps.get(); }
    
    public double getAverageStepTime() { return averageStepTime.get(); }
    public double getMinStepTime() { return minStepTime.get(); }
    public double getMaxStepTime() { return maxStepTime.get(); }
    public double getLastStepTime() { return lastStepTime.get(); }
    
    public long getPeakMemoryUsage() { return peakMemoryUsage.get(); }
    public long getCurrentMemoryUsage() { return currentMemoryUsage.get(); }
    public long getTotalMemoryAllocated() { return totalMemoryAllocated.get(); }
    
    public double getAverageFPS() { return averageFPS.get(); }
    public double getCurrentFPS() { return currentFPS.get(); }
    public long getTotalEntitiesProcessed() { return totalEntitiesProcessed.get(); }
    
    public long getTotalErrors() { return totalErrors.get(); }
    public long getTotalWarnings() { return totalWarnings.get(); }
    public long getTotalTimeouts() { return totalTimeouts.get(); }
    
    /**
     * Gets the success rate as a percentage
     * 
     * @return Success rate percentage
     */
    public double getSuccessRate() {
        long total = totalSteps.get();
        if (total == 0) return 0.0;
        return (double) successfulSteps.get() / total * 100.0;
    }
    
    /**
     * Gets the error rate as a percentage
     * 
     * @return Error rate percentage
     */
    public double getErrorRate() {
        long total = totalSteps.get();
        if (total == 0) return 0.0;
        return (double) failedSteps.get() / total * 100.0;
    }
    
    /**
     * Gets the average entities processed per step
     * 
     * @return Average entities per step
     */
    public double getAverageEntitiesPerStep() {
        long total = totalSteps.get();
        if (total == 0) return 0.0;
        return (double) totalEntitiesProcessed.get() / total;
    }
    
    /**
     * Gets memory usage in MB
     * 
     * @return Memory usage in MB
     */
    public double getCurrentMemoryUsageMB() {
        return currentMemoryUsage.get() / (1024.0 * 1024.0);
    }
    
    /**
     * Gets peak memory usage in MB
     * 
     * @return Peak memory usage in MB
     */
    public double getPeakMemoryUsageMB() {
        return peakMemoryUsage.get() / (1024.0 * 1024.0);
    }
    
    @Override
    public String toString() {
        return "PerformanceMetrics{" +
                "totalSteps=" + getTotalSteps() +
                ", successRate=" + String.format("%.1f%%", getSuccessRate()) +
                ", avgStepTime=" + String.format("%.3fms", getAverageStepTime() * 1000) +
                ", currentFPS=" + String.format("%.1f", getCurrentFPS()) +
                ", memoryUsage=" + String.format("%.1fMB", getCurrentMemoryUsageMB()) +
                ", entitiesProcessed=" + getTotalEntitiesProcessed() +
                '}';
    }
}
