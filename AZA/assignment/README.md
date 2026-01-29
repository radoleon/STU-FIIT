# AZA Practical Assignment

### Description  
This repository contains solutions for the AZA practical assignment: **Scheduling with Deadlines** (basic feasibility-check version and an optimized Disjoint Set / DSU version) and **Huffman compression/decompression** for ASCII input, plus a PDF with complexity analysis.

### Contents
- `scheduling.cpp` — Scheduling with deadlines (feasibility check).
- `scheduling_ds.cpp` — Scheduling with deadlines using Disjoint Set (DSU) optimization.
- `huffman_comp.cpp` — Huffman compression (reads `input.txt`, writes `output.bin`).
- `huffman_decomp.cpp` — Huffman decompression (reads `output.bin`, writes `decoded.txt`).
- `complexity_analysis.pdf` — Time/space complexity analysis and file-format description.

### Tasks implemented
#### **1) Scheduling with Deadlines**
- Greedy scheduling in profit order with a feasibility check after inserting each job.
- Optimized version that schedules each job as late as possible using Disjoint Sets (DSU) of time slots.

#### **2) Huffman Compression**
- Builds a Huffman code for the full ASCII range (0–255) based on input frequencies.
- Produces a compressed file that contains:
  - 256-byte header of code lengths,
  - code definitions written bit-by-bit,
  - encoded data bitstream,
  - final padding-length byte.

### Compile
    g++ -std=c++17 -O2 -o scheduling scheduling.cpp
    g++ -std=c++17 -O2 -o scheduling_ds scheduling_ds.cpp
    g++ -std=c++17 -O2 -o huffman_comp huffman_comp.cpp
    g++ -std=c++17 -O2 -o huffman_decomp huffman_decomp.cpp

### Notes
- Both scheduling programs use a built-in example job list and print the selected jobs and total profit.
- Filenames are currently **hardcoded** (Huffman: `input.txt` → `output.bin` → `decoded.txt`).
- The repository includes a PDF with complexity analysis and additional details (including the compressed file layout).

### Technologies
![https://skillicons.dev/icons?i=cpp,gcc,linux,git,python](https://skillicons.dev/icons?i=cpp)
