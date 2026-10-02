# Local Sequence Alignment (Smith-Waterman)

### Description
A console program implementing the **Smith-Waterman** algorithm for local alignment of two sequences,
supporting both nucleotide and amino acid input. Assignment 1 for the Bioinformatics course at FIIT STU.

### Contents
- `local_alignment.py` - Implementation of the algorithm.
- `data/hem_mouse_a.fasta`, `data/hem_rat_a.fasta` - Example amino acid sequences of mouse and rat
  hemoglobin.
- `data/hem_mouse_n.fasta`, `data/hem_rat_n.fasta` - Nucleotide sequences of the same samples.
- `data/alignment_results_a.txt`, `data/alignment_results_n.txt` - Example output for both runs.

### Implementation
- The user selects the sequence type in the console; for amino acids the **BLOSUM62** or **PAM250**
  substitution matrix is loaded through Biopython, for nucleotides a built-in 4×4 DNA matrix
  (match `+5`, mismatch `-4`) is used with a linear gap penalty (`GAP_PENALTY = -10`).
- Two FASTA paths are then entered; headers are stripped and all inputs are validated.
- Matrix `F` is initialised to zeros, since a local alignment may start at any position. Each cell is the
  maximum of the diagonal transition (match or mismatch), the transition from above and from the left
  (a gap in one of the sequences) and zero, while the global maximum and its position are tracked.
- The traceback starts at that maximum and walks the matrix until a cell with value `0` is reached,
  recomputing the three possible transitions at each step to decide deterministically how to extend
  the alignment.
- Statistics are then computed (length, matches, mismatches, gaps, identity, and the number of similar
  substitutions for proteins) and the alignment is rendered as three lines - the first sequence, a middle
  line marking the match type (`|`, `.`, `:`) and the second sequence - wrapped at 100 characters,
  printed to the console and written to `alignment_results.txt`.

### Results
The algorithm was tested on mouse and rat hemoglobin samples, for both nucleotide and amino acid
sequences. The output was verified against **EMBOSS Water**; because Water uses the Gotoh optimisation,
`GAP_EXTEND` was set to `0.0005` to approximate a linear gap penalty. Apart from the extra statistics
reported by Water, the sequences and numeric values matched.

### How to Run
1. Install the dependency:
```
pip install biopython
```
2. Start the program and answer the prompts - sequence type `[n]`/`[a]`, substitution matrix `[b]`/`[p]`,
and the two FASTA paths separated by a space:
```
python local_alignment.py
```

### Technologies
![](https://skillicons.dev/icons?i=py)
