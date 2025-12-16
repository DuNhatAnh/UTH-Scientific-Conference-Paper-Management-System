
import { mockFetch } from './api';

export interface PaperSubmission {
  id: string;
  title: string;
  abstract: string;
  keywords: string[];
  track: string;
  authors: Author[];
  fileUrl: string;
  status: 'submitted' | 'under_review' | 'accepted' | 'rejected' | 'camera_ready';
  createdAt: string;
}

interface Author {
  name: string;
  email: string;
  affiliation: string;
  isCorresponding: boolean;
}

export const submitPaper = async (paper: Omit<PaperSubmission, 'id' | 'status' | 'createdAt'>) => {
  return mockFetch({
    id: Math.random().toString(36).substr(2, 9),
    status: 'submitted',
    createdAt: new Date().toISOString(),
    ...paper
  });
};

export const getMySubmissions = async () => {
  return mockFetch([
    {
      id: '156',
      title: 'A Survey on Smart Grid Security Protocols',
      track: 'Energy Systems',
      status: 'accepted',
      updatedAt: '10/04/2024'
    },
    {
      id: '342',
      title: 'Optimizing Neural Networks for Edge Devices',
      track: 'AI & Big Data',
      status: 'under_review',
      updatedAt: '12/05/2024'
    }
  ]);
};
