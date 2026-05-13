export interface QuestionGraphElement {
  element_kind: 'node' | 'edge';
  element_data: Record<string, unknown>;
}

export interface IQuestionGraphRepository {
  getFullGraph(reinoId?: string): Promise<QuestionGraphElement[]>;
}
