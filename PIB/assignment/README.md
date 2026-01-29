# Software Vulnerabilities and Secure Programming

### Description  
This repository contains a **document-only** school assignment focused on memory-related software vulnerabilities and secure programming principles. It covers how modern memory works (stack/heap), demonstrates typical vulnerabilities (buffer overflow, format-string, use-after-free, memory leak), and evaluates both static and dynamic analysis tools with practical recommendations.

### Document
- Final report (PDF): `PIB_final_report.pdf`

### Topics Covered
- Memory model concepts (virtual memory, stack, heap, function calls)
- Source-code vulnerabilities enabling memory exploitation (e.g., stack/heap overflow)
- Example vulnerable programs: buffer overflow, format-string attack, use-after-free, memory leak
- Operating system mitigations: ASLR and NX (and other protections)
- Analysis tools:
  - Dynamic analysis with Valgrind (runtime memory errors)
  - Static analysis with Cppcheck (unsafe patterns, some memory issues, logic issues)
- Secure programming recommendations based on tool experimentation
- Comparison note on memory-safe languages (e.g., Rust vs C/C++)

### How to Use
This project contains no runnable application code; the deliverable is the PDF report.

1. Open the report:
    - `PIB_final_report.pdf`

2. If you want to reproduce the experiments described in the report (Optional):
    - Install Valgrind and run the sample programs through it to detect invalid reads/writes and memory leaks.
    - Install Cppcheck and scan the sample C/C++ code to detect unsafe patterns and common mistakes.
    - Experiment in a controlled environment with mitigations like ASLR disabled (only for learning/testing) as described in the report.

### Technologies
![https://skillicons.dev/icons?i=c,cpp,linux,python,git](https://skillicons.dev/icons?i=cpp,linux,docker)
