'use client';

import { memo, useMemo } from 'react';
import type { AnalysisData, CardConfig, QuestionKey } from './types';
import { buildCardConfigs, QUESTIONS, QUESTION_KEYS } from './cardConfigs';
import { QuestionCard } from './QuestionCard';

type Props = {
  answers: AnalysisData['answers'];
  activeDetail: QuestionKey | null;
  onDetailToggle: (key: QuestionKey) => void;
};

export const QuestionCardsGrid = memo(function QuestionCardsGrid({ answers, activeDetail, onDetailToggle }: Props) {
  // rule rerender-memo: expensive derivation memoized, depends only on answers
  const cards: CardConfig[] = useMemo(() => buildCardConfigs(answers), [answers]);

  return (
    <div style={{ display: 'flex', gap: '0.7rem', marginBottom: '1.2rem', overflowX: 'auto' }}>
      {cards.map((card, idx) => (
        <QuestionCard
          key={card.key}
          card={card}
          index={idx}
          isActive={activeDetail === card.key}
          onDetailToggle={onDetailToggle}
          question={QUESTIONS[QUESTION_KEYS[idx]]}
        />
      ))}
    </div>
  );
});
