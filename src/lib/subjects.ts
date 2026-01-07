export const caExams = {
  Foundation: {
    papers: [
      { name: 'Paper 1: Principles & Practice of Accounting', value: 'Principles & Practice of Accounting' },
      { name: 'Paper 2: Business Laws & Business Correspondence & Reporting (BCR)', value: 'Business Laws & Business Correspondence & Reporting' },
      { name: 'Paper 3: Business Mathematics, Logical Reasoning & Statistics', value: 'Business Mathematics, Logical Reasoning & Statistics' },
      { name: 'Paper 4: Business Economics & Business & Commercial Knowledge (BCK)', value: 'Business Economics & Business & Commercial Knowledge' },
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
        { name: 'Paper 6: Financial Management & Strategic Management (FM & SM)', value: 'Financial Management & Strategic Management' },
      ],
    },
  },
  Final: {
    'Group I': {
      papers: [
        { name: 'Paper 1: Financial Reporting', value: 'Financial Reporting' },
        { name: 'Paper 2: Advanced Financial Management (AFM)', value: 'Advanced Financial Management' },
        { name: 'Paper 3: Advanced Auditing, Assurance & Professional Ethics', value: 'Advanced Auditing, Assurance & Professional Ethics' },
      ],
    },
    'Group II': {
      papers: [
        { name: 'Paper 4: Direct Tax Laws & International Taxation', value: 'Direct Tax Laws & International Taxation' },
        { name: 'Paper 5: Indirect Tax Laws', value: 'Indirect Tax Laws' },
        { name: 'Paper 6: Integrated Business Solutions (Multidisciplinary Case Study)', value: 'Integrated Business Solutions' },
      ],
    },
  },
} as const;

export type Level = keyof typeof caExams;
export type Group = keyof typeof caExams['Intermediate'] | keyof typeof caExams['Final'];
