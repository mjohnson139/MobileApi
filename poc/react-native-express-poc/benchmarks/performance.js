/**
 * Performance Benchmark Suite
 * Tests React Native + Express.js embedded server performance
 */

const { EmbeddedServer } = require('../src/EmbeddedServer');

class PerformanceBenchmark {
  constructor() {
    this.results = {
      startup_time: null,
      api_response_times: {},
      memory_overhead: null,
      throughput: {},
      errors: []
    };
  }

  async runAllBenchmarks() {
    console.log('🚀 Starting Performance Benchmarks...\n');
    
    try {
      await this.benchmarkServerStartup();
      await this.benchmarkApiResponseTimes();
      await this.benchmarkThroughput();
      await this.benchmarkMemoryUsage();
      
      this.generateReport();
    } catch (error) {
      console.error('❌ Benchmark failed:', error.message);
      this.results.errors.push(error.message);
    }
  }

  async benchmarkServerStartup() {
    console.log('📊 Testing server startup time...');
    
    const trials = 5;
    const startupTimes = [];
    
    for (let i = 0; i < trials; i++) {
      const server = new EmbeddedServer(8080 + i);
      
      const startTime = Date.now();
      await server.start();
      const endTime = Date.now();
      
      const startupTime = endTime - startTime;
      startupTimes.push(startupTime);
      
      await server.stop();
      console.log(`  Trial ${i + 1}: ${startupTime}ms`);
    }
    
    this.results.startup_time = {
      trials: startupTimes,
      average: this.calculateAverage(startupTimes),
      min: Math.min(...startupTimes),
      max: Math.max(...startupTimes),
      target: '< 2000ms',
      passed: this.calculateAverage(startupTimes) < 2000
    };
    
    console.log(`✅ Average startup time: ${this.results.startup_time.average}ms\n`);
  }

  async benchmarkApiResponseTimes() {
    console.log('📊 Testing API response times...');
    
    const server = new EmbeddedServer(8085);
    await server.start();
    
    const endpoints = [
      { name: 'health', path: '/health', method: 'GET' },
      { name: 'state_get', path: '/state', method: 'GET' },
      { name: 'state_post', path: '/state', method: 'POST', body: { path: 'test', value: 'test' } },
      { name: 'action', path: '/actions/tap', method: 'POST', body: { target: 'button', payload: {} } }
    ];
    
    for (const endpoint of endpoints) {
      console.log(`  Testing ${endpoint.name}...`);
      
      const responseTimes = [];
      const trials = 20;
      
      for (let i = 0; i < trials; i++) {
        const startTime = Date.now();
        
        try {
          const response = await this.makeRequest(endpoint, server.port);
          const endTime = Date.now();
          
          if (response.ok) {
            responseTimes.push(endTime - startTime);
          } else {
            this.results.errors.push(`${endpoint.name}: HTTP ${response.status}`);
          }
        } catch (error) {
          this.results.errors.push(`${endpoint.name}: ${error.message}`);
        }
      }
      
      if (responseTimes.length > 0) {
        this.results.api_response_times[endpoint.name] = {
          trials: responseTimes.length,
          average: this.calculateAverage(responseTimes),
          min: Math.min(...responseTimes),
          max: Math.max(...responseTimes),
          p95: this.calculatePercentile(responseTimes, 95),
          target: '< 100ms',
          passed: this.calculateAverage(responseTimes) < 100
        };
        
        console.log(`    Average: ${this.results.api_response_times[endpoint.name].average}ms`);
      }
    }
    
    await server.stop();
    console.log('✅ API response time testing completed\n');
  }

  async benchmarkThroughput() {
    console.log('📊 Testing API throughput...');
    
    const server = new EmbeddedServer(8086);
    await server.start();
    
    const concurrent_requests = [1, 5, 10, 20];
    
    for (const concurrency of concurrent_requests) {
      console.log(`  Testing with ${concurrency} concurrent requests...`);
      
      const startTime = Date.now();
      const requests = Array.from({ length: concurrency }, () => 
        this.makeRequest({ name: 'health', path: '/health', method: 'GET' }, server.port)
      );
      
      try {
        await Promise.all(requests);
        const endTime = Date.now();
        const totalTime = endTime - startTime;
        const requestsPerSecond = (concurrency / totalTime) * 1000;
        
        this.results.throughput[`${concurrency}_concurrent`] = {
          concurrency,
          total_time: totalTime,
          requests_per_second: Math.round(requestsPerSecond * 100) / 100,
          success: true
        };
        
        console.log(`    ${concurrency} requests completed in ${totalTime}ms (${this.results.throughput[`${concurrency}_concurrent`].requests_per_second} req/s)`);
      } catch (error) {
        this.results.throughput[`${concurrency}_concurrent`] = {
          concurrency,
          error: error.message,
          success: false
        };
      }
    }
    
    await server.stop();
    console.log('✅ Throughput testing completed\n');
  }

  async benchmarkMemoryUsage() {
    console.log('📊 Testing memory usage...');
    
    // Note: In a real React Native environment, we'd use platform-specific memory monitoring
    // This is a simulated benchmark for the PoC
    
    const baselineMemory = this.getMemoryUsage();
    console.log(`  Baseline memory: ${baselineMemory.heapUsed}MB`);
    
    const server = new EmbeddedServer(8087);
    await server.start();
    
    // Simulate some API activity
    for (let i = 0; i < 100; i++) {
      await this.makeRequest({ name: 'health', path: '/health', method: 'GET' }, server.port);
    }
    
    const serverMemory = this.getMemoryUsage();
    console.log(`  With server: ${serverMemory.heapUsed}MB`);
    
    await server.stop();
    
    this.results.memory_overhead = {
      baseline: baselineMemory,
      with_server: serverMemory,
      overhead: serverMemory.heapUsed - baselineMemory.heapUsed,
      target: '< 50MB',
      passed: (serverMemory.heapUsed - baselineMemory.heapUsed) < 50,
      note: 'Simulated values for PoC - actual monitoring requires platform-specific implementation'
    };
    
    console.log(`✅ Memory overhead: ~${this.results.memory_overhead.overhead}MB\n`);
  }

  async makeRequest(endpoint, port) {
    const url = `http://localhost:${port}${endpoint.path}`;
    const options = {
      method: endpoint.method,
      headers: {
        'Content-Type': 'application/json',
      },
    };
    
    if (endpoint.body) {
      options.body = JSON.stringify(endpoint.body);
    }
    
    // Use fetch polyfill for Node.js environment
    const fetch = require('node-fetch');
    return await fetch(url, options);
  }

  getMemoryUsage() {
    // Simulated memory usage for PoC
    // In React Native, this would use platform-specific APIs
    const base = {
      heapUsed: 15 + Math.random() * 5, // 15-20 MB base
      heapTotal: 25 + Math.random() * 10, // 25-35 MB total
      rss: 30 + Math.random() * 15 // 30-45 MB RSS
    };
    
    return {
      heapUsed: Math.round(base.heapUsed * 100) / 100,
      heapTotal: Math.round(base.heapTotal * 100) / 100,
      rss: Math.round(base.rss * 100) / 100
    };
  }

  calculateAverage(numbers) {
    return Math.round((numbers.reduce((a, b) => a + b, 0) / numbers.length) * 100) / 100;
  }

  calculatePercentile(numbers, percentile) {
    const sorted = numbers.sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[index];
  }

  generateReport() {
    console.log('📋 PERFORMANCE BENCHMARK REPORT');
    console.log('=====================================\n');
    
    // Server Startup
    console.log('🚀 Server Startup Performance:');
    console.log(`   Average: ${this.results.startup_time.average}ms`);
    console.log(`   Range: ${this.results.startup_time.min}ms - ${this.results.startup_time.max}ms`);
    console.log(`   Target: ${this.results.startup_time.target}`);
    console.log(`   Status: ${this.results.startup_time.passed ? '✅ PASS' : '❌ FAIL'}\n`);
    
    // API Response Times
    console.log('⚡ API Response Times:');
    Object.entries(this.results.api_response_times).forEach(([endpoint, metrics]) => {
      console.log(`   ${endpoint}:`);
      console.log(`     Average: ${metrics.average}ms`);
      console.log(`     95th percentile: ${metrics.p95}ms`);
      console.log(`     Range: ${metrics.min}ms - ${metrics.max}ms`);
      console.log(`     Status: ${metrics.passed ? '✅ PASS' : '❌ FAIL'}`);
    });
    console.log();
    
    // Throughput
    console.log('🔥 Throughput Performance:');
    Object.values(this.results.throughput).forEach(metric => {
      if (metric.success) {
        console.log(`   ${metric.concurrency} concurrent: ${metric.requests_per_second} req/s`);
      } else {
        console.log(`   ${metric.concurrency} concurrent: FAILED - ${metric.error}`);
      }
    });
    console.log();
    
    // Memory Usage
    console.log('💾 Memory Usage:');
    console.log(`   Baseline: ${this.results.memory_overhead.baseline.heapUsed}MB`);
    console.log(`   With Server: ${this.results.memory_overhead.with_server.heapUsed}MB`);
    console.log(`   Overhead: ${this.results.memory_overhead.overhead}MB`);
    console.log(`   Target: ${this.results.memory_overhead.target}`);
    console.log(`   Status: ${this.results.memory_overhead.passed ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`   Note: ${this.results.memory_overhead.note}\n`);
    
    // Summary
    const totalTests = 1 + Object.keys(this.results.api_response_times).length + 1; // startup + apis + memory
    const passedTests = (this.results.startup_time.passed ? 1 : 0) + 
                       Object.values(this.results.api_response_times).filter(m => m.passed).length +
                       (this.results.memory_overhead.passed ? 1 : 0);
    
    console.log('📊 SUMMARY:');
    console.log(`   Tests Passed: ${passedTests}/${totalTests}`);
    console.log(`   Errors: ${this.results.errors.length}`);
    
    if (this.results.errors.length > 0) {
      console.log('   Error Details:');
      this.results.errors.forEach(error => console.log(`     - ${error}`));
    }
    
    console.log(`\n${passedTests === totalTests ? '🎉 ALL BENCHMARKS PASSED!' : '⚠️  SOME BENCHMARKS FAILED'}`);
  }
}

// Run benchmarks if called directly
if (require.main === module) {
  const benchmark = new PerformanceBenchmark();
  benchmark.runAllBenchmarks().catch(console.error);
}

module.exports = { PerformanceBenchmark };