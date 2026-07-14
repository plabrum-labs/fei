import numpy as np


def compute(freq):
    xs = np.linspace(0, 10, 200)
    ys = np.sin(freq * xs)
    return [[float(x), float(y)] for x, y in zip(xs, ys)]
