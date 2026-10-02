# Somatic Variant Analysis of a Tumor/Normal Sample

### Description
A complete **somatic variant calling and annotation** analysis of the paired control and tumor sample
P18, from raw read quality control through alignment to the hg38 reference genome, variant calling with
three different callers, functional annotation and interpretation of the findings. Project 2 for the
Bioinformatics course at FIIT STU. `pipeline.sh` contains all commands of the analysis, in the order
they were executed.

### Pipeline
- **Quality control** - FastQC on both reads of the control and tumor sample.
- **Alignment** - BWA-MEM against hg38, conversion to BAM, sorting and indexing.
- **Postprocessing** - renaming the chromosomes in the dbSNP common variants database, GATK
  MarkDuplicates, and base quality score recalibration (BaseRecalibrator + ApplyBQSR).
- **Post-alignment QC** - samtools stats and Qualimap on the cleaned BAM files.
- **Variant calling** - GATK Mutect2 with FilterMutectCalls for SNVs and indels, Strelka (Docker) and
  Manta for structural variants.
- **Caller comparison** - `som.py` from hap.py, comparing Strelka against Mutect2.
- **Annotation** - GATK Funcotator with `funcotator_dataSources.v1.7.20200521s`, output in MAF format.
- **Visualisation** - R `maftools` (plotmafSummary, oncoplot, titv, lollipop, rainfall, tcgaCompare).

### Results
The raw data met the quality standards, with mean base quality above 30 and a uniform read length of
101 bp. After alignment, 99.81 % of the reads were mapped in the control sample and 99.79 % in the tumor
sample, with an error rate of roughly 0.21 %. Mean genome coverage reached 4.6655× and 6.462×, which is
low compared to the ~30× normally expected for reliable variant detection.

Manta found only three structural variants, too few for meaningful annotation. In the comparison of SNVs,
Strelka and Mutect2 shared 163 true positives, but the precision of Strelka was low (0.2286), and for
indels no true positives were found. The analysis therefore continued with the GATK output.

### Interpretation
Only High and Moderate impact variants were kept (`Frame_Shift_Ins`, `Frame_Shift_Del`,
`Nonsense_Mutation`, `Splice_Site`, `In_Frame_Ins`, `In_Frame_Del`, `Missense_Mutation`). Variants with a
dbSNP record were either benign or had no reported clinical significance. FLG and KCNJ18 are associated
with disease in UniProt, but not of an oncogenic type; PABPC1 is listed in COSMIC CGC as Tier 2, where the
available evidence is not sufficient to confirm its role; the remaining genes (MUC12, MUC3A, GXYLT1,
LDHAL6B, ZNF717, SPATC1, PABPC3) have no record. The detected mutations therefore resemble common genetic
variability rather than a tumor profile, and the results do not support the presence of a clear driver
mutation in this sample.

### Showcase
> MAF Summary

<img width="1920" height="1020" alt="" src="https://github.com/user-attachments/assets/4a8bf552-35ca-41e5-b49c-26040d9d8b8c" />

### How to Reproduce
Required tools: FastQC, BWA, samtools, bcftools, GATK, Qualimap, Strelka and hap.py (run through Docker),
Manta, and R with the `maftools` package.

> [!IMPORTANT]
> The raw reads `P18.C_R{1,2}.fastq.gz` and `P18.T_R{1,2}.fastq.gz` are not part of this repository.
> The reference genome, the dbSNP database and the annotation sources are downloaded by the pipeline
> itself.

### Technologies
![](https://skillicons.dev/icons?i=bash,r,docker,linux)

> [!NOTE]
> This project was developed as a team collaboration between two students.
