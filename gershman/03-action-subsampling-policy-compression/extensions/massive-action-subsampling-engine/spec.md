# Massive Action-Subsampling Engine

## Goal

Extend Liu and Gershman’s action-subsampling model into a high-performance research platform. Test whether agents can learn small, high-quality consideration sets as structured action spaces grow from thousands to billions of actions.

## System

Build the simulation and search engine in Rust, with optional CUDA kernels for batched generation and evaluation. Environments provide compact states, compositional actions, deterministic replay, and exact or approximate action values.

Compare full enumeration, uniform subsampling, state-independent and state-dependent learned proposals, hierarchical generation, and information-seeking proposals.

## Experiment

Use program-synthesis tasks where actions are bytecode instructions composed from opcodes, operands, constants, and control-flow targets. Scale action-space size, consideration-set size, model capacity, training transitions, and evaluation compute.

Measure regret against an oracle, reward per evaluated action, top-action recall, compute-normalized performance, transfer to unseen tasks, and scaling-law or phase-transition behavior.

## Deliverables

Produce an open-source Rust engine, Python bindings, distributed experiment runner, reproducible benchmark suite, datasets, and an analysis of how consideration-set quality scales with compute.
