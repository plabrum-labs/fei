# Critique: Action subsampling supports policy compression in large action spaces

**Liu & Gershman (2025)**, *PLoS Comput Biol* 21(9): e1013444

> Scaffold. Grounded, methods-level critique — read the actual methods and cite the
> paper's own numbers, not generic "limitations." See [[skeptical-critique-approach]].

## Does the model do what it claims?

<!-- Is "action subsampling" doing real work, or is it observationally equivalent to a
plain capacity-limited softmax over the full action set? What experiment would separate
them, and did the paper run it? -->

## Methods scrutiny

<!-- Consideration-set inference: is k identified from behavior, or hand-set? How is the
proposal distribution parameterized and fit? Sample sizes, trial counts, model-comparison
metric (AIC/BIC/cross-val?) and margins. -->

## Alternative explanations

<!-- Could observed "subsampling" reflect memory limits, attention, or motor cost rather
than a policy-compression bottleneck? What does the paper rule out, and how? -->

## Scaling / generalization claims

<!-- Action spaces tested are presumably small (tens?). The extension spec pushes to
billions of actions — does anything in the paper's evidence actually license extrapolation
that far, or is that a leap the extension needs to earn empirically? -->

## Verdict

<!-- Net read: what's solid, what's oversold, what I'd want to see next. -->
