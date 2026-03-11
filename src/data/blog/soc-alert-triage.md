---
author: Nithissh
pubDatetime: 2026-02-13T10:00:00.000Z
title: "SOC L1 Alert Triage"
featured: false
draft: false
tags:
  - tryhackme
description: "Learning more about SOC alerts and building a systematic approach to efficiently triaging them."
---

This post covers notes from the TryHackMe SOC L1 Alert Triage room — the full lifecycle of how security events become actionable alerts and how analysts systematically work through them.

### From Events to Triage

Security monitoring starts with an **event** — a login, a process execution, a file download, a network connection. Systems that witness the event (OS, firewall, cloud services, applications) create **logs** about it. Those logs get shipped to centralized security tools like SIEM, EDR, or a SOC platform.

Here's the thing: organizations generate millions of logs per day across thousands of systems, and the vast majority of that activity is completely normal. No analyst can manually review raw logs at that scale. That's where alerting comes in — security tools analyze the logs, detect suspicious patterns, and generate **alerts** that analysts can actually triage.

> **The flow:** Event → Log → Centralize → Alert → Analyst Review → Action

#### Alert Management Tools

| Solution Type | Common Tools | Purpose |
|--------------|-------------|---------|
| SIEM | Splunk ES, Elastic | Main security dashboard — collects logs and surfaces alerts |
| EDR / NDR | Microsoft Defender, CrowdStrike | Detects threats on devices or network; usually feeds into SIEM |
| SOAR | Splunk SOAR, Cortex SOAR | Automates actions and correlates alerts from multiple tools |
| ITSM / Ticketing | Jira, TheHive | Tracks and manages security cases and task assignments |

#### Roles and Responsibilities

| Role | Main Responsibility |
|-----|---------------------|
| SOC L1 Analyst | Reviews alerts, filters false positives, escalates real threats |
| SOC L2 Analyst | Performs deeper investigation and handles remediation |
| SOC Engineer | Improves detections and ensures alerts contain useful information |
| SOC Manager | Monitors team performance and ensures attacks are not missed |

### Alert Properties

Every alert carries metadata that gives you context before you even start investigating. Understanding these properties is essential for quick triage:

| # | Property | Meaning | Example |
|---|--------|---------|-------|
| 1 | Alert Time | When the alert was created (may lag behind event) | Alert: 15:35, Event: 15:32 |
| 2 | Alert Name | Short summary of what happened | Unusual Login Location, RDP Bruteforce |
| 3 | Alert Severity | Urgency/seriousness level | Low, Medium, High, Critical |
| 4 | Alert Status | Current handling state | New, In Progress, Closed |
| 5 | Alert Verdict | Real threat or not | True Positive, False Positive |
| 6 | Alert Assignee | Analyst responsible for review | Alert owner |
| 7 | Alert Description | Why alert triggered and what it means | Rule logic + attack reasoning |
| 8 | Alert Fields | Key details and evidence | Hostname, Command line, etc. |

### How Alert Priority is Decided

When you open your queue, the question is always: **what do I look at first?** The logic is straightforward:

- Pick only **new and unassigned** alerts — avoid anything already being handled
- Prioritize by severity: **Critical → High → Medium → Low**
- Higher severity means higher likelihood of a real attack and greater business impact
- If severity is equal, prioritize by **time** — investigate the oldest alerts first, since an older alert may mean the attacker has already progressed further in the kill chain

### Alert Investigation

Before diving in, always assign the alert to yourself and change its status to *In Progress*. This prevents duplicate work and signals to your team that someone is on it.

From there, the investigation flow looks like this:

1. Read the alert name, description, and indicators to understand what triggered it
2. Analyze activity inside SIEM or EDR logs
3. Follow available playbooks or runbooks if your team has them
4. Identify **who** is affected — user, host, network segment, cloud resource
5. Identify **what** action happened — login, malware delivery, phishing, command execution
6. Check events before and after the alert for additional suspicious behavior
7. Use threat intelligence sources to validate your suspicion
8. Make a verdict: **True Positive** (real attack) or **False Positive** (benign)
9. Write a clear comment explaining your investigation steps and reasoning
10. Escalate if required, then move the alert status to **Closed**