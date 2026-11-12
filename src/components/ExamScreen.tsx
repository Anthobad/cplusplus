import React from 'react';
import { CURRICULUM_EXAMS } from '../data/curriculumSummary';
import { ExamView } from './ExamView';

type Props = Omit<React.ComponentProps<typeof ExamView>, 'exam'> & { examId: string };
export default function ExamScreen({ examId, ...props }: Props) {
  const exam = CURRICULUM_EXAMS.find(item => item.id === examId) || CURRICULUM_EXAMS[0];
  return <ExamView key={exam.id} {...props} exam={{...exam,questions:[]}} />;
}
