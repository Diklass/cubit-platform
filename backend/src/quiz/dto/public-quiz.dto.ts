export class PublicQuizDto {
  id: string;
  title: string;
  timeLimitSec?: number;
  questions: {
    id: string;
    type: string;
    text: string;
    required: boolean;
    options: {
      id: string;
      text: string;
    }[];
  }[];
}
