---
author: Nithissh
pubDatetime: 2026-02-14T03:02:00.000Z
title: "SOC Metrics and Objectives"
featured: false
draft: false
tags:
  - tryhackme
description: "Explore key metrics driving SOC effectiveness and discover ways to improve them."
---

This post covers notes from the TryHackMe SOC Metrics room — what gets measured in a SOC, why those numbers matter, and how to move them in the right direction.

### Core SOC Performance Metrics

Everything in a SOC can be quantified. The numbers below are the ones leadership cares about most:

| Metric | Formula | What it Shows |
|------|------|------|
| Alerts Count (AC) | Total alerts received | Analyst workload |
| False Positive Rate (FPR) | False Positives / Total Alerts | Noise level in detections |
| Alert Escalation Rate (AER) | Escalated Alerts / Total Alerts | L1 experience and confidence |
| Threat Detection Rate (TDR) | Detected Threats / Total Threats | SOC reliability |

**Healthy targets to aim for:** roughly 5–30 alerts per analyst per day, FPR below 80%, AER below 20%, and TDR at 100%.

### Time-Based Response Metrics (SLA)

These measure detection and response speed — arguably the most critical numbers in incident response.

| Metric | Meaning | Target |
|------|------|------|
| MTTD | Time from attack to detection | ~5 min |
| MTTA | Time from alert to analyst starting triage | ~10 min |
| MTTR | Time from detection to threat stopped | ~60 min |
| SOC Availability | Monitoring schedule | 24/7 or 8/5 |

The order of events goes: Attack → Detection (MTTD) → Analyst picks alert (MTTA) → Response and remediation (MTTR). Each stage has a window, and your job is to shrink all three.

### Why Metrics Matter for L1

This isn't just management overhead. Good metrics directly improve SOC effectiveness and reduce the number of successful attacks. They're also used for performance evaluation — if you consistently hit solid numbers, that's your path to L2 and beyond.

### Fixing Common Metric Problems

#### False Positive Rate Above 80%

When most of your alerts are noise, two things help: exclude trusted behavior (scheduled updates, known admin tasks) from triggering alerts, and automate handling of the most common false positives via SOAR or scripts.

#### MTTD Above 30 Minutes

If detection is slow, work with your SOC engineers to optimize detection rules. Also verify that logs are arriving in real time — delayed log ingestion silently inflates MTTD.

#### MTTA Above 30 Minutes

Analysts need to know an alert exists before they can work it. Enable real-time notifications, and make sure alert load is balanced across the team so no single analyst is drowning.

#### MTTR Above 4 Hours

Long response times usually mean escalations are too slow or procedures are unclear. Push to escalate threats faster, and make sure your incident response procedures are documented and accessible — not locked in someone's head.