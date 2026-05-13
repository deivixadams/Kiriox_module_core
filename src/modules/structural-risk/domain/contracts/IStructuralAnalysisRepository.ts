export interface IStructuralAnalysisRepository {
  runAnalysis(runSaId: string): Promise<unknown>;
}
