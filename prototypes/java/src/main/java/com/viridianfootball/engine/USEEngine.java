package com.viridianfootball.engine;

import java.util.*;
import java.time.Duration;
import java.time.Instant;

/**
 * USE Engine Prototype for Java Performance Benchmarking
 * 
 * This prototype implements a basic simulation loop to test:
 * - Performance with 10,000+ player records
 * - Memory usage patterns
 * - CPU utilization
 * - Simulation speed
 */
public class USEEngine {
    
    private static class Player {
        public int id;
        public String name;
        public double positionX, positionY;
        public double velocityX, velocityY;
        public double fatigue;
        public double injuryRisk;
        public String bodyState;
        
        public Player(int id, String name) {
            this.id = id;
            this.name = name;
            this.positionX = Math.random() * 100;
            this.positionY = Math.random() * 100;
            this.velocityX = (Math.random() - 0.5) * 10;
            this.velocityY = (Math.random() - 0.5) * 10;
            this.fatigue = Math.random();
            this.injuryRisk = Math.random() * 0.1;
            this.bodyState = "normal";
        }
    }
    
    private static class BodyStateMachine {
        public static void updatePlayerState(Player player, double deltaTime) {
            // Update position based on velocity
            player.positionX += player.velocityX * deltaTime;
            player.positionY += player.velocityY * deltaTime;
            
            // Apply fatigue accumulation
            player.fatigue += deltaTime * 0.01;
            if (player.fatigue > 1.0) player.fatigue = 1.0;
            
            // Update injury risk based on fatigue and movement
            double movement = Math.abs(player.velocityX) + Math.abs(player.velocityY);
            player.injuryRisk += deltaTime * movement * 0.001;
            if (player.injuryRisk > 1.0) player.injuryRisk = 1.0;
            
            // Update body state based on fatigue
            if (player.fatigue > 0.8) {
                player.bodyState = "exhausted";
            } else if (player.fatigue > 0.5) {
                player.bodyState = "tired";
            } else {
                player.bodyState = "normal";
            }
        }
    }
    
    private static class SpatialAwareness {
        public static List<Player> getNearbyPlayers(Player player, List<Player> allPlayers, double radius) {
            List<Player> nearby = new ArrayList<>();
            for (Player other : allPlayers) {
                if (other.id != player.id) {
                    double distance = Math.sqrt(
                        Math.pow(player.positionX - other.positionX, 2) +
                        Math.pow(player.positionY - other.positionY, 2)
                    );
                    if (distance <= radius) {
                        nearby.add(other);
                    }
                }
            }
            return nearby;
        }
    }
    
    private List<Player> players;
    private double simulationTime;
    private Random random;
    
    public USEEngine() {
        this.players = new ArrayList<>();
        this.simulationTime = 0.0;
        this.random = new Random(42); // Deterministic for benchmarking
    }
    
    public void initializePlayers(int playerCount) {
        System.out.println("Initializing " + playerCount + " players...");
        for (int i = 0; i < playerCount; i++) {
            players.add(new Player(i, "Player_" + i));
        }
    }
    
    public void simulateSeason(double seasonDuration) {
        System.out.println("Starting season simulation...");
        Instant start = Instant.now();
        
        double deltaTime = 0.016; // 60 FPS simulation
        int steps = (int)(seasonDuration / deltaTime);
        
        for (int step = 0; step < steps; step++) {
            // Update all players
            for (Player player : players) {
                BodyStateMachine.updatePlayerState(player, deltaTime);
                
                // Apply some random movement
                player.velocityX += (random.nextDouble() - 0.5) * 0.1;
                player.velocityY += (random.nextDouble() - 0.5) * 0.1;
                
                // Get nearby players for spatial awareness
                List<Player> nearby = SpatialAwareness.getNearbyPlayers(player, players, 10.0);
                
                // Simple interaction based on proximity
                if (!nearby.isEmpty()) {
                    Player nearest = nearby.get(0);
                    double distance = Math.sqrt(
                        Math.pow(player.positionX - nearest.positionX, 2) +
                        Math.pow(player.positionY - nearest.positionY, 2)
                    );
                    
                    if (distance < 2.0) {
                        // Players are very close - potential collision
                        player.velocityX *= 0.9;
                        player.velocityY *= 0.9;
                    }
                }
            }
            
            simulationTime += deltaTime;
            
            // Progress report every 1000 steps
            if (step % 1000 == 0) {
                System.out.printf("Simulation progress: %.1f%%\n", 
                    (double)step / steps * 100);
            }
        }
        
        Instant end = Instant.now();
        Duration duration = Duration.between(start, end);
        
        System.out.println("Season simulation completed!");
        System.out.println("Simulation time: " + duration.toMillis() + "ms");
        System.out.println("Total players: " + players.size());
        System.out.println("Final simulation time: " + simulationTime + " seconds");
    }
    
    public void printStatistics() {
        System.out.println("\n=== SIMULATION STATISTICS ===");
        System.out.println("Total players: " + players.size());
        System.out.println("Average fatigue: " + 
            players.stream().mapToDouble(p -> p.fatigue).average().orElse(0.0));
        System.out.println("Average injury risk: " + 
            players.stream().mapToDouble(p -> p.injuryRisk).average().orElse(0.0));
        
        // Count body states
        Map<String, Long> bodyStates = players.stream()
            .collect(java.util.stream.Collectors.groupingBy(
                p -> p.bodyState, java.util.stream.Collectors.counting()));
        
        System.out.println("Body state distribution:");
        bodyStates.forEach((state, count) -> 
            System.out.println("  " + state + ": " + count + " players"));
    }
    
    public static void main(String[] args) {
        USEEngine engine = new USEEngine();
        
        // Initialize with 10,000 players for benchmarking
        int playerCount = 10000;
        engine.initializePlayers(playerCount);
        
        // Simulate a full season (16 weeks * 7 days * 24 hours * 3600 seconds)
        double seasonDuration = 16 * 7 * 24 * 3600; // seconds
        engine.simulateSeason(seasonDuration);
        
        engine.printStatistics();
    }
}