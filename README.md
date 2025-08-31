# Comfort Zone: An AI-Powered Shield for Mindful Browsing

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Project Status: Active](https://img.shields.io/badge/status-active-brightgreen.svg)](https://github.com/IdreesInc/Mutable)
[![Version](https://img.shields.io/badge/version-1.0.0--hackathon-blue)](https://github.com/IdreesInc/Mutable)

**Comfort Zone is a browser extension that leverages advanced AI to provide users with proactive, intelligent, and customizable control over their online experience. It identifies and shields users from emotionally triggering content, fostering a healthier and safer digital environment.**

This project was developed for the **Youth Hackathon 2025 (August 15-31)**, under the theme: **Youth Leading the Way - Building MIL Solutions for Impact**.
<img width="1912" height="1001" alt="Снимок экрана (100)" src="https://github.com/user-attachments/assets/4f7fba6d-8774-417c-9d31-4b60611b4d91" />

---

## 1. The Challenge: Beyond Keyword Filtering

In an era of information overload, protecting one's mental well-being online is a significant challenge. Existing content filters, like our foundational concept app "Mutable," primarily rely on keyword-based blocking. While useful, this approach is fundamentally limited. It fails to detect nuanced negativity, sarcasm, passive aggression, or emotionally charged topics that don't contain obvious trigger words.

The modern web, driven by complex algorithms and user-generated content, requires a more intelligent solution.

## 2. Our Solution: Proactive Semantic Shielding

**Comfort Zone** represents an evolution from reactive filtering to proactive protection. By integrating a sophisticated AI core, our extension performs deep **semantic analysis** on web content. It understands the *context, sentiment, and emotional intent* behind the text, allowing it to identify potentially disturbing material that traditional methods miss.

This empowers users to create a personalized "comfort zone," shielding them from content that causes anxiety, distress, or emotional fatigue, thereby promoting critical **Media and Information Literacy (MIL)** skills.

<img width="1917" height="1013" alt="Снимок экрана (101)" src="https://github.com/user-attachments/assets/8e88f52d-db29-4606-9d94-540a1371ca0b" />

<img width="960" height="423" alt="Снимок экрана 2025-08-31 141813" src="https://github.com/user-attachments/assets/30d0f03c-ddd6-42f2-a0e0-1fec66db0c0b" />


## 3. Core Features

<p>
  <img src="https://api.iconify.design/tabler/brain.svg?color=%237CB9E8" width="24" alt="AI Core Icon" valign="middle">&nbsp;&nbsp;<strong>Advanced Semantic Analysis</strong>
  <br>
  Utilizes a multi-model AI engine to understand context and tone, moving far beyond simple word matching.
</p>

<p>
  <img src="https://api.iconify.design/tabler/radar-2.svg?color=%237CB9E8" width="24" alt="Sentiment Icon" valign="middle">&nbsp;&nbsp;<strong>Nuanced Emotional Detection</strong>
  <br>
  Identifies a spectrum of potentially triggering content, including toxicity, depression-related themes, sarcasm, and passive aggression.
</p>

<p>
  <img src="https://api.iconify.design/tabler/filter.svg?color=%237CB9E8" width="24" alt="Filter Icon" valign="middle">&nbsp;&nbsp;<strong>Zero-Shot Topic Filtering</strong>
  <br>
  Enables users to mute entire topics (e.g., "politics," "social issues") based on the text's meaning, not a predefined keyword list.
</p>

<p>
  <img src="https://api.iconify.design/tabler/adjustments-horizontal.svg?color=%237CB9E8" width="24" alt="Controls Icon" valign="middle">&nbsp;&nbsp;<strong>Granular Sensitivity Controls</strong>
  <br>
  Empowers users with sliders to define their personal tolerance thresholds for different categories of content, ensuring a fully customized experience.
</p>

<p>
  <img src="https://api.iconify.design/tabler/world-www.svg?color=%237CB9E8" width="24" alt="Compatibility Icon" valign="middle">&nbsp;&nbsp;<strong>Broad Platform Compatibility</strong>
  <br>
  Designed to function seamlessly across major social media sites, news aggregators, and forums, including Twitter/X, Facebook, and Reddit.
</p>

## 4. Technology: The AI Core

Comfort Zone's intelligence is powered by a carefully selected suite of frontier neural networks. This multi-layered, psychology-informed approach allows for a highly nuanced and accurate analysis of online content.

| Model Category | Hugging Face Model | Role in Comfort Zone |
| :--- | :--- | :--- |
| **Toxicity Detection** | [Detoxifying a Language Model](https://huggingface.co/docs/trl/detoxifying_a_lm) | Provides the first line of defense against overtly toxic, aggressive, or hateful language. |
| **Depression Analysis** | [xlm-roberta-base-cls-depression](https://huggingface.co/malexandersalazar/xlm-roberta-base-cls-depression) | Identifies linguistic patterns and themes associated with depression, offering a crucial filter for sensitive users. |
| **Sarcasm Detection** | [multilingual-sarcasm-detector](https://huggingface.co/helinivan/multilingual-sarcasm-detector) | Detects implicit negativity often missed by other systems, such as sarcasm and passive-aggressive communication. |
| **Topic Classification**| [bart-large-mnli](https://huggingface.co/facebook/bart-large-mnli) | Powers our zero-shot filtering, allowing the system to understand and classify content into broad topics on the fly. |

Architecture:
<img width="2492" height="1148" alt="df" src="https://github.com/user-attachments/assets/e2df7b61-0d12-4d2f-992d-0bed3b3d9e41" />

## 5. A Vision for Media & Information Literacy

Our project was architected to directly address the core principles of the UNESCO GMIL Hackathon.

*   **AI and MIL**: We provide a practical tool that helps users navigate the complexities of an AI-driven information ecosystem, turning a potential threat into an opportunity for empowerment.
*   **Youth Engagement**: As a team of young innovators, we are building a solution *for* youth, positioning them not as passive consumers of information, but as active curators of their own digital spaces.
*   **Impact & Inclusion**: Comfort Zone is designed to be a tool for digital well-being that serves everyone, particularly those from marginalized communities who are often disproportionately exposed to online hate and negativity.

## 6. Project Roadmap

Comfort Zone is currently a fully functional prototype. Our vision extends to a comprehensive suite of tools for digital wellness.

*   **Q4 2025**: **Personalized Sensitivity Calibration**
    *   Launch an interactive onboarding module that helps users understand their content sensitivities and recommends initial filter settings.
*   **2026**: **Cross-Platform Expansion**
    *   Begin development of a background service for iOS and Android to extend protection to mobile environments.
*   **Ongoing**: **AI Core Enhancement**
    *   Continuously evaluate and integrate state-of-the-art models to improve detection accuracy and broaden the scope of filterable content categories.

## 7. The Team

Our team brings together a diverse skill set in software architecture, AI engineering, user interface design, and data-driven research.

*   **Alina Chigireva**: Team Lead, Architecture, AI, Presentation & Video, Core Integration, UI
*   **Polina Getmanskaya**: Architecture, Core Integration, Core Developer
*   **Vitaliia Zubareva**: UI, UI Integration
*   **Viktoriia Simonenko**: Presentation, Data Analysis, Research
*   **Adam Suraj**: Presentation, Research, Survey
*   **Maria Harchenko**: AI, AI Integration




