"use client";

import { Layout } from '@/components/layout/Layout';

export default function SupportLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Layout>
      {children}
    </Layout>
  );
}
