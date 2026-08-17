import { WorkspaceDocument, ChatMessage, ExtractedField } from "./types";

export const SAMPLE_DOCUMENT: WorkspaceDocument = {
  id: "doc-enterprise-agreement",
  title: "Enterprise Master Services Agreement",
  filename: "confidential_enterprise_services_v2.pdf",
  pages: 14,
  format: "PDF",
  size: "1.4 MB",
  sections: [
    {
      id: "sec-1",
      page: 1,
      clauseNumber: "1.1",
      title: "Scope & Provision of Services",
      content:
        "The Service Provider agrees to deliver enterprise document transformation, compression, and analysis infrastructure in accordance with the specifications outlined in Schedule A. All services are rendered statelessly.",
    },
    {
      id: "sec-2",
      page: 3,
      clauseNumber: "2.4",
      title: "Intellectual Property & Data Ownership",
      content:
        "Customer retains sole and exclusive ownership of all right, title, and interest in and to all Customer Data, including all files, documents, and derived text processed through the platform. Service Provider shall not use Customer Data for model training or permanent archiving.",
    },
    {
      id: "sec-3",
      page: 7,
      clauseNumber: "4.2",
      title: "Termination & Data Purging Obligations",
      content:
        "Upon expiration or termination of this Agreement for any reason, all temporary memory allocations, cached document representations, and session vectors must be irrevocably purged within 30 calendar days following written notice. Confirmation of erasure shall be provided upon request.",
    },
    {
      id: "sec-4",
      page: 9,
      clauseNumber: "6.1",
      title: "Limitation of Aggregate Liability",
      content:
        "Except for breaches of Section 2.4 (Intellectual Property) and gross negligence, neither party's total aggregate liability arising out of or related to this Agreement shall exceed the total amount paid by Customer in the preceding twelve (12) months.",
    },
    {
      id: "sec-5",
      page: 12,
      clauseNumber: "8.3",
      title: "Security & Encryption Protocols",
      content:
        "Service Provider agrees to maintain industry-standard security safeguards. All data in transit shall be encrypted via TLS 1.3, and any ephemeral in-memory processing buffers shall be cleared upon session completion.",
    },
  ],
};

export const INITIAL_CHAT_MESSAGES: ChatMessage[] = [
  {
    id: "msg-1",
    sender: "user",
    text: "What are the data retention and termination obligations specified in Section 4?",
    timestamp: "10:42 AM",
  },
  {
    id: "msg-2",
    sender: "assistant",
    text: "According to Section 4.2 of the agreement, upon termination or expiration, all temporary memory allocations, cached document representations, and session vectors must be irrevocably purged within 30 calendar days following written notice. A formal confirmation of erasure is available upon request.",
    timestamp: "10:42 AM",
    citations: [
      {
        id: "cit-1",
        page: 7,
        clause: "Clause 4.2",
        excerpt: "All temporary memory allocations, cached document representations, and session vectors must be irrevocably purged within 30 calendar days...",
        sectionId: "sec-3",
      },
    ],
    jsonPayload: {
      section: "4.2",
      retention_period_days: 30,
      purging_confirmed: true,
      vectors_cleared: true,
    },
  },
];

export const SAMPLE_EXTRACTED_FIELDS: ExtractedField[] = [
  {
    key: "retention_period",
    label: "Data Purge Window",
    value: "30 Days after termination",
    category: "Obligation",
    citation: "Page 7, Clause 4.2",
  },
  {
    key: "liability_cap",
    label: "Aggregate Liability Limit",
    value: "12 months of service fees paid",
    category: "Financial",
    citation: "Page 9, Clause 6.1",
  },
  {
    key: "data_ownership",
    label: "Customer Data Ownership",
    value: "Exclusive ownership retained by customer",
    category: "Term",
    citation: "Page 3, Clause 2.4",
  },
  {
    key: "encryption_standard",
    label: "In-Transit Encryption",
    value: "TLS 1.3 / Ephemeral Buffer Teardown",
    category: "Compliance",
    citation: "Page 12, Clause 8.3",
  },
];

export const SUGGESTED_PROMPTS = [
  "Summarize key termination obligations and notice periods",
  "What is the maximum aggregate liability cap in Section 6?",
  "Does the vendor have rights to use data for AI model training?",
  "List the required security and encryption specifications",
];
