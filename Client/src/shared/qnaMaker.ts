export interface IQnASearchResultList {
  answers: IQnASearchResult[];
  activeLearningEnabled: boolean;
}

export interface IQnASearchResult {
  questions: string[];
  answer: string;
  score: number;
  id: number;
  source: string;
  metadata: any[];
  context: IContext;
}

export interface IContext {
  isContextOnly: boolean;
  prompts: any[];
}
