package com.viridianfootball.engine.simulation;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.HashMap;

/**
 * Contains the results of a football game simulation
 */
public class SimulationResult {
    
    private LocalDateTime simulationTime;
    private long executionTimeMs;
    private boolean successful;
    private String gameId;
    private Map<String, Object> gameData;
    private Map<String, Object> statistics;
    
    public SimulationResult() {
        this.simulationTime = LocalDateTime.now();
        this.successful = true;
        this.gameData = new HashMap<>();
        this.statistics = new HashMap<>();
    }
    
    public SimulationResult(String gameId) {
        this();
        this.gameId = gameId;
    }
    
    public LocalDateTime getSimulationTime() {
        return simulationTime;
    }
    
    public void setSimulationTime(LocalDateTime simulationTime) {
        this.simulationTime = simulationTime;
    }
    
    public long getExecutionTimeMs() {
        return executionTimeMs;
    }
    
    public void setExecutionTimeMs(long executionTimeMs) {
        this.executionTimeMs = executionTimeMs;
    }
    
    public boolean isSuccessful() {
        return successful;
    }
    
    public void setSuccessful(boolean successful) {
        this.successful = successful;
    }
    
    public String getGameId() {
        return gameId;
    }
    
    public void setGameId(String gameId) {
        this.gameId = gameId;
    }
    
    public Map<String, Object> getGameData() {
        return gameData;
    }
    
    public void setGameData(Map<String, Object> gameData) {
        this.gameData = gameData;
    }
    
    public void addGameData(String key, Object value) {
        this.gameData.put(key, value);
    }
    
    public Map<String, Object> getStatistics() {
        return statistics;
    }
    
    public void setStatistics(Map<String, Object> statistics) {
        this.statistics = statistics;
    }
    
    public void addStatistic(String key, Object value) {
        this.statistics.put(key, value);
    }
}