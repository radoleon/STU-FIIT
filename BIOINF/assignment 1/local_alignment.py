from pathlib import Path

from Bio.Align import substitution_matrices

substitution_matrix = None
is_nucleotide = False

EDNA = {
  'A': {'A':  5, 'C': -4, 'G': -4, 'T': -4},
  'C': {'A': -4, 'C':  5, 'G': -4, 'T': -4},
  'G': {'A': -4, 'C': -4, 'G':  5, 'T': -4},
  'T': {'A': -4, 'C': -4, 'G': -4, 'T':  5},
}

GAP_PENALTY = -10

def read_fasta(path):
  sequence_lines = []
  
  with open(path, 'r') as fasta:
    for line in fasta:
      if line.strip() and not line.startswith('>'):
        sequence_lines.append(line.strip())
  
  return ''.join(sequence_lines)

def setup_alignment():
  global substitution_matrix, is_nucleotide

  mode = ''
  while mode not in ['n', 'a']:
    mode = input('Select the type of sequence to align:\t[n] nucleotides\t[a] amino acids\n>> ')
    mode = mode.strip().lower()

  is_nucleotide = mode == 'n'

  if not is_nucleotide:
    matrix = ''
    while matrix not in ['b', 'p']:
      matrix = input('Select the substitution matrix to use:\t[b] BLOSUM62\t[p] PAM250\n>> ')
      matrix = matrix.strip().lower()
      
    substitution_matrix = substitution_matrices.load('BLOSUM62') if matrix == 'b' else substitution_matrices.load('PAM250')
  else:
    substitution_matrix = EDNA

  input_files_input = input('Enter the paths to the two FASTA files (.fasta) separated by a space:\n>> ')
  input_files = input_files_input.strip().split()

  if len(input_files) != 2:
    print('Error: Exactly two FASTA file paths must be provided')
    exit(1)

  for f in input_files:
    if not Path(f).is_file() or not Path(f).exists() or Path(f).suffix.lower() != '.fasta':
      print('Error: File(s) not found or inaccessible, or not in FASTA format')
      exit(1)

  return input_files

def smith_waterman(seq_1, seq_2):
  len_seq_1 = len(seq_1)
  len_seq_2 = len(seq_2)

  F = [[0] * (len_seq_2 + 1) for _ in range(len_seq_1 + 1)]

  max_score = 0
  max_i, max_j = 0, 0

  for i in range(1, len_seq_1 + 1):
    for j in range(1, len_seq_2 + 1):
      diagonal = F[i - 1][j - 1] + substitution_matrix[seq_1[i - 1]][seq_2[j - 1]]
      up = F[i - 1][j] + GAP_PENALTY
      left = F[i][j - 1] + GAP_PENALTY

      F[i][j] = max(diagonal, up, left, 0)

      if F[i][j] > max_score:
        max_score = F[i][j]
        max_i, max_j = i, j

  return F, max_i, max_j

def output_results(aligned_1, aligned_2):
  stats = {
    'length': 0,
    'matches': 0,
    'mismatches': 0,
    'gaps': 0,
    'similarity': 0,
    'identity': 0
  }
  
  mid = ''
  
  for x, y in zip(aligned_1, aligned_2):
    if x == y:
      mid += '|'
      stats['matches'] += 1
    elif '-' in [x, y]:
      mid += ' '
      stats['gaps'] += 1
    elif not is_nucleotide and substitution_matrix[x][y] > 0:
      mid += ':'
      stats['mismatches'] += 1
      stats['similarity'] += 1
    else:
      mid += '.'
      stats['mismatches'] += 1
  
    stats['length'] += 1

  stats['identity'] = stats['matches'] / stats['length'] if stats['length'] > 0 else 0

  start = 0
  length = stats['length']
  output_file = 'alignment_results.txt'

  summary = (
    f'{'Length:':.<{50 - len(str(stats['length']))}}{stats['length']}\n'
    f'{'Matches:':.<{50 - len(str(stats['matches']))}}{stats['matches']}\n'
    f'{'Mismatches:':.<{50 - len(str(stats['mismatches']))}}{stats['mismatches']}\n'
    f'{'Gaps:':.<{50 - len(str(stats['gaps']))}}{stats['gaps']}\n'
    f'{'Identity:':.<{50 - len(f'{stats['identity']:.2f}')}}{stats['identity']:.2f}'
  )

  if not is_nucleotide:
    summary += f'\n{'Similarity:':.<{50 - len(f'{stats['similarity']}')}}{stats['similarity']}'

  print(f'\nResults are saved in: {output_file}\n')

  with open(output_file, 'w') as f:
    f.write(summary + '\n')
    print(summary)

    while start < length:
      end = min(start + 100, length)
      chunk = f'\n{aligned_1[start:end]}\n{mid[start:end]}\n{aligned_2[start:end]}'
      start = end

      f.write(chunk + '\n')
      print(chunk)

def traceback(F, seq_1, seq_2, start_i, start_j):
  i, j = start_i, start_j
  aligned_1, aligned_2 = '', ''

  while i > 0 and j > 0 and F[i][j] != 0:
    diagonal = F[i - 1][j - 1] + substitution_matrix[seq_1[i - 1]][seq_2[j - 1]]
    up = F[i - 1][j] + GAP_PENALTY
    left = F[i][j - 1] + GAP_PENALTY

    if F[i][j] == diagonal:
      aligned_1 += seq_1[i - 1]
      aligned_2 += seq_2[j - 1]
      i -= 1
      j -= 1
    
    elif F[i][j] == up:
      aligned_1 += seq_1[i - 1]
      aligned_2 += '-'
      i -= 1
    
    elif F[i][j] == left:
      aligned_1 += '-'
      aligned_2 += seq_2[j - 1]
      j -= 1

  output_results(aligned_1[::-1], aligned_2[::-1])

if __name__ == '__main__':
  [file_1, file_2] = setup_alignment()
    
  seq_1 = read_fasta(file_1)
  seq_2 = read_fasta(file_2)

  F, max_i, max_j = smith_waterman(seq_1, seq_2)
  traceback(F, seq_1, seq_2, max_i, max_j)
