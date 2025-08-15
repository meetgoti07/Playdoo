"use client";

import { useParams } from "next/navigation";
import { SupportTicketDetail } from "@/components/support/SupportTicketDetail";

export default function SupportTicketPage() {
  const params = useParams();
  const ticketId = params.id as string;

  return <SupportTicketDetail ticketId={ticketId} />;
}
