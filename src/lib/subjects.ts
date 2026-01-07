export const caExams = {
  Foundation: {
    papers: [
      { name: 'Paper 1: Accounting', value: 'Accounting' },
      { name: 'Paper 2: Business Laws', value: 'Business Laws' },
      { name: 'Paper 3: Quantitative Aptitude', value: 'Quantitative Aptitude' },
      { name: 'Paper 4: Business Economics', value: 'Business Economics' },
    ],
  },
  Intermediate: {
    'Group I': {
      papers: [
        { name: 'Paper 1: Advanced Accounting', value: 'Advanced Accounting' },
        { name: 'Paper 2: Corporate & Other Laws', value: 'Corporate & Other Laws' },
        { name: 'Paper 3: Taxation', value: 'Taxation' },
      ],
    },
    'Group II': {
      papers: [
        { name: 'Paper 4: Cost & Management Accounting', value: 'Cost & Management Accounting' },
        { name: 'Paper 5: Auditing & Ethics', value: 'Auditing & Ethics' },
        { name: 'Paper 6: Financial Management & Strategic Management', value: 'Financial Management & Strategic Management' },
      ],
    },
  },
  Final: {
    'Group I': {
      papers: [
        { name: 'Paper 1: Financial Reporting', value: 'Financial Reporting' },
        { name: 'Paper 2: Strategic Financial Management (SFM)', value: 'Strategic Financial Management' },
        { name: 'Paper 3: Advanced Auditing & Professional Ethics', value: 'Advanced Auditing & Professional Ethics' },
      ],
    },
    'Group II': {
      papers: [
        { name: 'Paper 4: Corporate & Economic Laws', value: 'Corporate & Economic Laws' },
        { name: 'Paper 5: Strategic Cost Management & Performance Evaluation (SCMP)', value: 'Strategic Cost Management & Performance Evaluation' },
        { name: 'Paper 6: Integrated Business Solutions', value: 'Integrated Business Solutions' },
      ],
    },
  },
} as const;

export type Level = keyof typeof caExams;
export type Group = keyof typeof caExams['Intermediate'] | keyof typeof caExams['Final'];
