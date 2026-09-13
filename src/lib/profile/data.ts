import type { Profile } from './types';

/**
 * Source of truth: Trinadh_Kumar_Reddi_Resume_Ai (approved resume upload).
 * Transcribed as literally as possible. Fields not present in the source
 * document are intentionally omitted rather than guessed — see
 * `interests` and parts of `contact` below, which the resume did not
 * state explicitly.
 */
export const profile: Profile = {
  personal: {
    fullName: 'Trinadh Kumar Reddi',
    headline:
      'Aspiring AI/ML Engineer with hands-on experience building RAG systems, data analysis pipelines, LangGraph, and modern data tooling.',
    // Local avatar photo — served from /public/avatar.jpg
    avatarUrl: '/avatar.jpg',
  },

  summary:
    'Aspiring AI/ML Engineer with hands-on experience building RAG systems, data analysis pipelines, LangGraph, and modern data tooling.',

  education: [
    {
      institution: 'Bonam Venkata Chalamayya Engineering College, Odalarevu',
      program: 'B.Tech, Artificial Intelligence and Machine Learning',
      detail: 'CGPA: 7.86',
      period: '2021 – 2025',
    },
    {
      institution: 'Sri Chaitanya Jr College, Amalapuram',
      program: 'Intermediate (MPC)',
      detail: '81.4%',
      period: '2019 – 2021',
    },
    {
      institution: 'G R Mariappan Sir C V Raman (EM) P S, Amalapuram',
      program: 'Class X',
      detail: '93%',
      period: '2018 – 2019',
    },
  ],

  experience: [
    {
      role: 'Gen AI Intern',
      organization: 'TalentSmart Soft Solutions Pvt. Ltd.',
      employmentType: 'Paid',
      period: 'May 2026 – Present',
      highlights: [
        'Working as a Generative AI Intern, building and contributing to Gen AI-powered solutions and applications.',
      ],
    },
    {
      role: 'Agentic AI Intern',
      organization: 'Innomatics Research Labs',
      employmentType: 'Unpaid',
      period: 'Feb 2026 – May 2026',
      highlights: [
        'Completed an Agentic AI Internship, gaining hands-on proficiency in Python problem solving, FastAPI, prompt engineering, LangChain, RAG, agents, and LangGraph.',
      ],
    },
  ],

  skills: [
    { category: 'Programming Languages', items: ['Python', 'SQL'] },
    {
      category: 'Data Analysis & Visualization',
      items: ['Pandas', 'NumPy', 'Matplotlib', 'Plotly', 'Power BI'],
    },
    {
      category: 'Web Scraping & Data Collection',
      items: ['BeautifulSoup', 'Requests', 'Regular Expressions (Regex)'],
    },
    {
      category: 'Machine Learning',
      items: [
        'Scikit-learn',
        'Deep Learning Basics',
        'NLP',
        'RAG',
        'LangGraph',
        'Computer Vision (dlib, DeepFace)',
      ],
    },
    {
      category: 'Generative AI / LLMs',
      items: [
        'LLM Orchestration',
        'Prompt Engineering',
        'MCP (Model Context Protocol)',
        'OpenRouter / LLM APIs',
      ],
    },
    {
      category: 'Databases',
      items: ['MySQL', 'SQLite', 'RDBMS', 'SQL Queries', 'Joins'],
    },
    {
      category: 'Tools',
      items: [
        'Jupyter Notebook',
        'VS Code',
        'Git & GitHub',
        'Streamlit',
        'Power BI',
        'MS Excel',
        'Gmail API / OAuth2',
      ],
    },
    {
      category: 'Soft Skills',
      items: ['Teamwork', 'Critical Thinking', 'Communication', 'Problem Solving'],
    },
  ],

  projects: [
    {
      name: 'Retro Personal AI Assistant',
      stack: ['MCP (Model Context Protocol)', 'Gmail API', 'Python', 'LLM Orchestration'],
      githubUrl: 'https://github.com/redditrinadhkumar/retro-personal-ai-assistant',
      highlights: [
        'Built a personal AI assistant on a custom MCP (Model Context Protocol) architecture with a planner-executor loop that dynamically selects tools such as memory retrieval, web search, and email actions.',
        "Designed a two-tier memory system combining verbatim recent message history with an LLM-generated rolling summary to manage the model's context window efficiently.",
        'Implemented a safe-write email workflow integrated with the Gmail API that always creates drafts first and only sends after explicit user confirmation.',
        'Built a modular capability registry that lets new tools (e.g., calendar) be added with zero changes to the core planning or execution logic.',
      ],
    },
    {
      name: 'Velora — AI-Moderated Social Platform',
      stack: ['Python', 'FastAPI', 'LLM APIs', 'Streamlit'],
      githubUrl: 'https://github.com/redditrinadhkumar/velora',
      highlights: [
        'Designed and built an AI-moderated social platform where every post and comment passes through an LLM-powered moderation pipeline before publishing.',
        'Implemented context-aware content scoring, automated flagging, and an appeal workflow backed by an agentic review loop.',
        'Built the full-stack backend with FastAPI and integrated real-time LLM calls for moderation decisions with sub-second latency targets.',
      ],
    },
    {
      name: 'FaceGate — Local Network Face ID Authentication',
      stack: ['React', 'FastAPI', 'face_recognition', 'dlib', 'SQLite', 'mkcert'],
      githubUrl: 'https://github.com/redditrinadhkumar/facegate',
      highlights: [
        'Built a full-stack facial recognition attendance system from scratch, with an iPhone-style dark UI deployable over a local network.',
        'Replaced an initial DeepFace/ArcFace and RetinaFace pipeline with the face_recognition/dlib library, cutting per-frame inference time from ~48s to ~0.1s.',
        'Implemented multi-angle face registration and anti-spoofing checks, and enabled secure LAN access over HTTPS using mkcert.',
        'Diagnosed and resolved cascading backend issues including async FastAPI bugs, axios timeouts, and login payload errors.',
      ],
    },
    {
      name: 'RAG Customer Support Assistant',
      stack: ['LangGraph', 'ChromaDB', 'Groq / LLaMA3', 'Streamlit'],
      githubUrl: 'https://github.com/redditrinadhkumar/RAG-Customer-Support-Assistant',
      highlights: [
        'Built a production-style Retrieval-Augmented Generation system for customer support as part of an internship at Innomatics Research Labs.',
        'Implemented a PDF ingestion pipeline that chunks documents, generates embeddings with BAAI/bge-small-en-v1.5, and stores them in ChromaDB for semantic retrieval.',
        'Designed a LangGraph workflow with intent detection and conditional routing, generating answers via Groq/LLaMA3 or OpenAI based on retrieved context and confidence scores.',
        'Added a human-in-the-loop escalation flow with low-confidence routing and a Streamlit UI with multi-PDF uploads, streaming responses, source citations, and an analytics dashboard.',
      ],
    },
    {
      name: 'Resume Agentic RAG',
      stack: ['LangGraph', 'RAG', 'Python', 'FastAPI', 'ChromaDB'],
      githubUrl: 'https://github.com/redditrinadhkumar/resume-agentic-rag',
      highlights: [
        'Built an agentic RAG system that ingests a resume PDF and answers recruiter-style questions grounded strictly in the document content.',
        'Implemented a multi-step LangGraph agent that decides whether to retrieve, rerank, or fall back to a direct LLM answer based on retrieval confidence.',
        'Exposed the agent via a FastAPI endpoint with streaming response support, designed to be embedded into portfolio and HR tooling.',
      ],
    },
    {
      name: 'Risk–Return Evaluation of Indian Mutual Funds',
      stack: ['Python', 'BeautifulSoup', 'Requests', 'Pandas', 'NumPy', 'Matplotlib', 'Plotly'],
      githubUrl: 'https://github.com/redditrinadhkumar/Risk-Return-Evaluation-of-Indian-Mutual-Funds',
      highlights: [
        'Scraped financial data from online sources using Python, BeautifulSoup, and Requests, building a clean dataset of Indian mutual fund metrics.',
        'Analyzed performance metrics including Average Return, Volatility, Sharpe Ratio, AUM, and TER across multiple fund categories.',
        'Performed comprehensive EDA and interactive visualizations identifying ETFs and Index Funds as strong risk-adjusted investment options.',
        'Generated actionable insights for investors with comparative category breakdowns and correlation analysis of risk vs. return.',
      ],
    },
  ],


  certifications: [
    {
      name: 'Professional Course: Data Science with Generative AI',
      issuer: 'Innomatics Research Labs',
    },
    { name: 'Microsoft Certified: Azure AI Fundamentals', issuer: 'Microsoft', date: 'June 19, 2024' },
    {
      name: 'Machine Learning with Python (ML0101EN)',
      issuer: 'Cognitive Class (IBM)',
      date: 'February 12, 2024',
    },
    { name: 'Python', issuer: 'GUVI', date: 'August 6, 2023' },
  ],

  // Not explicitly listed as a separate "achievements" section on the source
  // resume, so left empty. The assistant must say this isn't available
  // rather than inferring achievements from projects/certifications.
  achievements: [],

  // Not stated on the source resume — intentionally left empty rather than guessed.
  interests: [],

  contact: {
    email: 'redditrinadhkumar@gmail.com',
    phone: '+91 7674878252',
    // LinkedIn and GitHub URLs confirmed from task specification.
    linkedinUrl: 'https://www.linkedin.com/in/trinadh-kumar-reddi-a45b79265/',
    githubUrl: 'https://github.com/redditrinadhkumar',
  },
};
