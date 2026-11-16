# SPDX-License-Identifier: MIT
# Copyright (c) 2026 Fareed Khan. See LICENSE in this directory.
# Extracted unchanged Event/Tempo definitions from notebook cell 61 at
# 47797403ee78c3c6243c7fb8bd456ddce000f578; imports added for standalone use.
from dataclasses import dataclass, field
import heapq
import itertools

@dataclass(order=True)
class Event:
    time: int
    priority: int
    seq: int
    kind: str = field(compare=False)
    payload: object = field(compare=False, default=None)


class Tempo:
    '''A min-heap over (time, priority, seq). The important method is not pop,
    it is pop_batch: everything sharing a key comes out together, so the handler
    can treat millions of events as one array operation.'''

    def __init__(self):
        self._heap = []
        self._seq = itertools.count()

    def push(self, time, kind, payload=None, priority=0):
        heapq.heappush(self._heap,
                       Event(time, priority, next(self._seq), kind, payload))

    def pop_batch(self):
        head = heapq.heappop(self._heap)
        batch = [head.payload]
        while self._heap and (self._heap[0].time, self._heap[0].priority,
                              self._heap[0].kind) == (head.time, head.priority, head.kind):
            batch.append(heapq.heappop(self._heap).payload)
        return head.time, head.kind, batch

    def __len__(self):
        return len(self._heap)
