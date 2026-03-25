import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Badge } from '@/components/ui/badge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function validateSelectValue(value) {
  if (value === "" || value === null) return undefined;
  return value;
}

export const getStatusBadge = (status) => {
  switch (status) {
    case 'pending':
      return <Badge variant="warning">En attente</Badge>;
    case 'approved':
      return <Badge variant="success">Approuvée</Badge>;
    case 'rejected':
      return <Badge variant="destructive">Rejetée</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
};