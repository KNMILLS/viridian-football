use criterion::{black_box, criterion_group, criterion_main, Criterion};
use use_engine_prototype::{USEEngine, EngineConfig};

fn benchmark_simulation_execution(c: &mut Criterion) {
    c.bench_function("single_simulation", |b| {
        let mut engine = USEEngine::new();
        engine.start();
        
        b.iter(|| {
            let result = engine.run_simulation();
            black_box(result)
        })
    });
}

fn benchmark_multiple_simulations(c: &mut Criterion) {
    c.bench_function("multiple_simulations_100", |b| {
        b.iter(|| {
            let mut engine = USEEngine::new();
            engine.start();
            
            for _ in 0..100 {
                let result = engine.run_simulation();
                black_box(result);
            }
        })
    });
}

fn benchmark_with_performance_monitoring(c: &mut Criterion) {
    c.bench_function("simulation_with_monitoring", |b| {
        let config = EngineConfig {
            enable_performance_monitoring: true,
            ..EngineConfig::default()
        };
        let mut engine = USEEngine::new_with_config(config);
        engine.start();
        
        b.iter(|| {
            let result = engine.run_simulation();
            black_box(result)
        })
    });
}

criterion_group!(
    benches,
    benchmark_simulation_execution,
    benchmark_multiple_simulations,
    benchmark_with_performance_monitoring
);
criterion_main!(benches);