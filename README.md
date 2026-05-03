# Nourish

Nourish is a clinical nutrition recommendation prototype for hypertension management that adapts the DASH diet to Indian food composition data. The system combines a React/Vite patient application, a FastAPI backend, a DASH-based recommendation engine, and an AI-assisted recipe generation module grounded in IFCT-2017 nutritional lookup.

## System Architecture

```mermaid
graph TD
    subgraph T1 ["Tier 1: Frontend Client"]
        Patient["📱 Patient Web App (React + Vite)<br/>- Authentication<br/>- Health Profile Input<br/>- Meal Plan Viewing<br/>- PWA Support"]
    end

    subgraph T2 ["Tier 2: Backend Server"]
        API["⚙️ FastAPI Backend<br/>- REST API Endpoints<br/>- Token Authentication<br/>- Validation & Routing"]
    end

    subgraph T3 ["Tier 3: Recommendation & AI Layer"]
        ML["🧠 DASH Recommendation Engine<br/>1. Sodium Safety Filter<br/>2. Z-Score Normalization<br/>3. Weighted DASH Scoring<br/>4. BMR/TDEE Caloric Matching"]
        AI["🤖 AI Recipe Generation Module<br/>- Gemma 4 via LM Studio<br/>- Tool-calling loop<br/>- IFCT nutrition lookup<br/>- Structured DASH recipe output"]
    end

    subgraph T4 ["Tier 4: Data Layer"]
        APPDB[("🗄️ SQLite App Database<br/>- Users<br/>- Sessions<br/>- Patient Profiles<br/>- Saved AI Recipes")]
        CSV[("📄 INdb Recipe Corpus (CSV)<br/>- Tagged Indian recipes<br/>- Per-serving nutrient values")]
        IFCT[("🔎 IFCT-2017 SQLite FTS5 DB<br/>- Food composition lookup<br/>- AI nutrition verification")]
        PG[("🐘 PostgreSQL (Planned)<br/>- Production persistence<br/>- Concurrent multi-user support")]
    end

    Patient -->|"JSON over HTTPS"| API
    API --> ML
    API --> AI
    API --> APPDB
    ML --> CSV
    AI --> IFCT
    AI --> APPDB
    PG -.->|"planned migration"| APPDB

    %% GitHub Aesthetic Styling
    classDef default fill:none,stroke:#8b949e,stroke-width:1px,color:#c9d1d9;
    classDef db fill:#1f6feb,stroke:#58a6ff,stroke-width:1.5px,color:#ffffff;
    class APPDB,CSV,IFCT,PG db;
    
    %% Style adjustments for the subgraphs
    style T1 fill:none,stroke:#30363d,stroke-dasharray: 5 5
    style T2 fill:none,stroke:#30363d,stroke-dasharray: 5 5
    style T3 fill:none,stroke:#30363d,stroke-dasharray: 5 5
    style T4 fill:none,stroke:#30363d,stroke-dasharray: 5 5
```
<p align="center"><b>Figure: System architecture of Nourish.</b></p>

## Workflow Overview

1. The patient logs in and submits clinical profile information such as age, sex, weight, height, activity level, blood pressure stage, and dietary preference.
2. The FastAPI backend validates the request and retrieves the patient profile from the application database.
3. The recommendation engine loads the tagged Indian recipe corpus and removes meals exceeding the sodium safety threshold.
4. Remaining recipes are normalized and assigned weighted DASH scores.
5. Caloric needs are computed using the Mifflin-St Jeor equation with activity and population-specific adjustment.
6. A meal exchange plan is generated across breakfast, lunch, dinner, and snacks.
7. Optionally, the AI recipe module can generate structured DASH-friendly recipes grounded in IFCT-2017 nutritional lookup.
8. The resulting plan is returned to the frontend for patient viewing.

## Current Implementation

- Frontend: React, Vite, TypeScript, Material UI, PWA support
- Backend: FastAPI, Python 3.13
- Recommendation engine: pandas, NumPy, scikit-learn
- App persistence: SQLite with SQLAlchemy ORM
- Nutrition corpus: tagged INdb CSV
- AI nutrition grounding: IFCT-2017 SQLite FTS5 database
- Planned production database: PostgreSQL

## Planned Extensions

- Natural language dietary logging using the existing LLM + tool-calling pipeline
- Clinician dashboard with dietician override workflow
- Wearable integration for blood pressure feedback loops
- PostgreSQL migration for production-scale deployment
- Multilingual and voice-based dietary logging
