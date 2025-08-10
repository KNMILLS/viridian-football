package com.viridianfootball.engine;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.BeforeEach;
import java.time.Duration;
import java.time.Instant;

public class USEEnginePerformanceTest {
    
    private USEEngine engine;
    
    @BeforeEach
    void setUp() {
        engine = new USEEngine();
    }
    
    @Test
    void testPerformanceWith10000Players() {
        System.out.println("\n=== JAVA PERFORMANCE TEST ===");
        
        // Test with 10,000 players
        int playerCount = 10000;
        engine.initializePlayers(playerCount);
        
        // Simulate 1 hour of game time
        double simulationDuration = 3600; // 1 hour in seconds
        
        Instant start = Instant.now();
        engine.simulateSeason(simulationDuration);
        Instant end = Instant.now();
        
        Duration duration = Duration.between(start, end);
        
        System.out.println("\n=== PERFORMANCE RESULTS ===");
        System.out.println("Player count: " + playerCount);
        System.out.println("Simulation duration: " + simulationDuration + " seconds");
        System.out.println("Real time: " + duration.toMillis() + "ms");
        System.out.println("Performance ratio: " + 
            (double)simulationDuration / (duration.toMillis() / 1000.0));
        
        // Calculate memory usage (approximate)
        Runtime runtime = Runtime.getRuntime();
        long memoryUsed = runtime.totalMemory() - runtime.freeMemory();
        System.out.println("Memory used: " + (memoryUsed / 1024 / 1024) + "MB");
        
        engine.printStatistics();
    }
}