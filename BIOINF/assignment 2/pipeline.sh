#!/bin/bash

#### Raw Data Quality Control

mkdir C_fastqc_paired
mkdir T_fastqc_paired

fastqc P18.C_R1.fastq.gz P18.C_R2.fastq.gz -o C_fastqc_paired/
fastqc P18.T_R1.fastq.gz P18.T_R2.fastq.gz -o T_fastqc_paired/


#### Read Alignment

wget https://hgdownload.gi.ucsc.edu/goldenPath/hg38/bigZips/latest/hg38.fa.gz
gunzip hg38.fa.gz

samtools faidx hg38.fa
samtools dict hg38.fa > hg38.dict

bwa index hg38.fa


bwa mem -t 8 \
-R "@RG\tID:ID_02_P18_C\tSM:Control\tPL:ILLUMINA\tLB:LB_02_P18_C\tPU:PU_02_P18_C\tCN:FIITSTU\tDT:2026-01-01T00:00:00" \
hg38.fa P18.C_R1.fastq.gz P18.C_R2.fastq.gz | \
samtools view -hbS - > C.bwa.bam

samtools sort -o C.bwa.sorted.bam C.bwa.bam
samtools index C.bwa.sorted.bam

bwa mem -t 8 \
-R "@RG\tID:ID_02_P18_T\tSM:Tumor\tPL:ILLUMINA\tLB:LB_02_P18_T\tPU:PU_02_P18_T\tCN:FIITSTU\tDT:2026-01-01T00:00:00" \
hg38.fa P18.T_R1.fastq.gz P18.T_R2.fastq.gz | \
samtools view -hbS - > T.bwa.bam

samtools sort -o T.bwa.sorted.bam T.bwa.bam
samtools index T.bwa.sorted.bam


mkdir C.bwa_alignment_stats
mkdir T.bwa_alignment_stats

samtools stats C.bwa.sorted.bam > C.bwa_alignment_stats/C.samtools.stats.txt
samtools stats T.bwa.sorted.bam > T.bwa_alignment_stats/T.samtools.stats.txt

qualimap bamqc \
-bam C.bwa.sorted.bam \
-outdir C.bwa_alignment_stats/C.qualimap \
--java-mem-size=6G \
--nt 8

qualimap bamqc \
-bam T.bwa.sorted.bam \
-outdir T.bwa_alignment_stats/T.qualimap \
--java-mem-size=6G \
--nt 8


#### Postprocessing

wget https://ftp.ncbi.nih.gov/snp/organisms/human_9606/VCF/common_all_20180418.vcf.gz
wget https://ftp.ncbi.nih.gov/snp/organisms/human_9606/VCF/common_all_20180418.vcf.gz.tbi

bcftools annotate --rename-chrs <(awk '{print $1, "chr"$1}' <(contig_map.txt)) -O z -o dbsnp.chr.vcf.gz common_all_20180418.vcf.gz
bcftools index -t dbsnp.chr.vcf.gz


gatk MarkDuplicates \
-I C.bwa.sorted.bam \
-O C.bwa.dedup.bam \
-M C.bwa.dup_metrics.txt \
--CREATE_INDEX true

gatk MarkDuplicates \
-I T.bwa.sorted.bam \
-O T.bwa.dedup.bam \
-M T.bwa.dup_metrics.txt \
--CREATE_INDEX true

gatk BaseRecalibrator \
-R hg38.fa \
-I C.bwa.dedup.bam \
--known-sites dbsnp.chr.vcf.gz \
-O C.bwa.recal.table

gatk BaseRecalibrator \
-R hg38.fa \
-I T.bwa.dedup.bam \
--known-sites dbsnp.chr.vcf.gz \
-O T.bwa.recal.table

gatk ApplyBQSR \
-R hg38.fa \
-I C.bwa.dedup.bam \
--bqsr-recal-file C.bwa.recal.table \
-O C.bwa.cleaned.bam

gatk ApplyBQSR \
-R hg38.fa \
-I T.bwa.dedup.bam \
--bqsr-recal-file T.bwa.recal.table \
-O T.bwa.cleaned.bam


#### Post-Alignment Quality Control

samtools stats C.bwa.cleaned.bam > C.bwa_alignment_stats/C.cleaned.samtools.stats.txt
samtools stats T.bwa.cleaned.bam > T.bwa_alignment_stats/T.cleaned.samtools.stats.txt

qualimap bamqc \
-bam C.bwa.cleaned.bam \
-outdir C.bwa_alignment_stats/C.cleaned.qualimap \
--java-mem-size=6G \
--nt 8

qualimap bamqc \
-bam T.bwa.cleaned.bam \
-outdir T.bwa_alignment_stats/T.cleaned.qualimap \
--java-mem-size=6G \
--nt 8


#### Variant Calling

gatk Mutect2 \
-R hg38.fa \
-I T.bwa.cleaned.bam \
-I C.bwa.cleaned.bam \
-tumor Tumor \
-normal Control \
-O somatic.gatk.vcf.gz

gatk FilterMutectCalls \
-R hg38.fa \
-V somatic.gatk.vcf.gz \
-O somatic.gatk.filtered.vcf.gz


docker run --rm -v $PWD:/data quay.io/biocontainers/strelka:2.9.10--h9ee0642_1 \
configureStrelkaSomaticWorkflow.py \
--normalBam /data/C.bwa.cleaned.bam \
--tumorBam /data/T.bwa.cleaned.bam \
--referenceFasta /data/hg38.fa \
--runDir /data/strelka_run_dir

docker run --rm -v $PWD:/data quay.io/biocontainers/strelka:2.9.10--h9ee0642_1 \
/data/strelka_run_dir/runWorkflow.py -m local -j 4


configManta.py \
--normalBam C.bwa.cleaned.bam \
--tumorBam T.bwa.cleaned.bam \
--referenceFasta hg38.fa \
--runDir manta_run_dir

./manta_run_dir/runWorkflow.py -m local -j 4


mkdir varcall_stats

bcftools stats somatic.gatk.filtered.vcf.gz > varcall_stats/somatic.gatk.filtered.vcf.stats

bcftools stats strelka_run_dir/results/variants/somatic.snvs.vcf.gz > varcall_stats/somatic.strelka.snvs.vcf.stats
bcftools stats strelka_run_dir/results/variants/somatic.indels.vcf.gz > varcall_stats/somatic.strelka.indels.vcf.stats

bcftools stats manta_run_dir/results/variants/somaticSV.vcf.gz > varcall_stats/somatic.manta.sv.vcf.stats


docker run --rm -v $PWD:/data quay.io/biocontainers/hap.py:0.3.14--py27h5c5a3ab_0 \
som.py \
-r /data/hg38.fa \
-o /data/strelka_vs_mutect2 \
/data/somatic.gatk.filtered.vcf.gz \
/data/strelka_run_dir/results/variants/somatic.snvs.vcf.gz

docker run --rm -v $PWD:/data quay.io/biocontainers/hap.py:0.3.14--py27h5c5a3ab_0 \
som.py \
-r /data/hg38.fa \
-o /data/strelka_vs_mutect2_indels \
/data/somatic.gatk.filtered.vcf.gz \
/data/strelka_run_dir/results/variants/somatic.indels.vcf.gz


#### Post-Processing and Annotation

mkdir funcotator_data
cd funcotator_data

curl -O ftp://gsapubftp-anonymous@ftp.broadinstitute.org/bundle/funcotator/funcotator_dataSources.v1.7.20200521s.tar.gz
tar -xvzf funcotator_dataSources.v1.7.20200521s.tar.gz

gatk Funcotator \
-R hg38.fa \
-V somatic.gatk.filtered.vcf.gz \
-O somatic.gatk.annotated.maf.gz \
--data-sources-path funcotator_data/funcotator_dataSources.v1.7.20200521s \
--ref-version hg38 \
--output-file-format MAF


R
library(maftools)

maf <- read.maf("somatic.gatk.annotated.maf.gz")
plotmafSummary(maf = maf, addStat = "median")

oncoplot(maf, top = 20)

maf.titv <- titv(maf = maf, plot = FALSE)
plotTiTv(res = maf.titv)

lollipopPlot(maf = maf, gene = "FLG")
rainfallPlot(maf = maf)

tcgaCompare(maf = maf, cohortName = "MySample")

top.genes <- subsetMaf(maf, genes = getGeneSummary(maf)$Hugo_Symbol[1:10], mafObj = FALSE) 
write.table(top.genes, file = "top_10_mutated_genes.tsv", sep = "\t", row.names = FALSE, quote = FALSE)
