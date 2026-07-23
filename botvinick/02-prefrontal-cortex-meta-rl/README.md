# Prefrontal Cortex as a Meta-Reinforcement Learning System

**Wang, Kurth-Nelson, Kumaran, Tirumala, Soyer, Leibo, Hassabis & Botvinick** — *Nature Neuroscience* (2018).
https://www.nature.com/articles/s41593-018-0147-8 · DeepMind: https://deepmind.google/blog/prefrontal-cortex-as-a-meta-reinforcement-learning-system/

**Why it's in the course — claim (b), and the `simharness` build target.** Casts the prefrontal
cortex / dopamine system as a meta-RL system: slow dopaminergic RL trains a recurrent network that
itself becomes a fast, in-context RL learner. Meta-learned on **bandit tasks** — the exact family
`simharness` already generates — so this is the natural Axis-D build: race a meta-learned recurrent
agent against Rescorla-Wagner on the same task and measure the sample-efficiency gap.

Jane X. Wang's background (Michigan PhD, Northwestern postdoc, then DeepMind) grounds the
neuroscience framing. Lead group: **Matthew Botvinick** (DeepMind).

**Next step:** add `paper.pdf`, then run the `pdf-to-markdown` skill to produce `paper.md`.
