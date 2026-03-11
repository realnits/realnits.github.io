---
author: Nithissh
pubDatetime: 2026-02-13T09:00:00.000Z
title: "SOC L1 Alert Reporting"
featured: false
draft: false
tags:
  - tryhackme
description: "Learning more about SOC alert reporting, escalation flow, and cross-team communication."
---

This post covers notes from the TryHackMe SOC L1 Alert Reporting room — the full reporting lifecycle from initial triage through escalation and crisis communication. If you're getting into SOC work, solid reporting is arguably the most underrated skill you'll need.

### The Alert Funnel

Not every alert becomes an incident. The vast majority of what hits an L1 analyst's queue gets closed as a false positive. Here's the typical flow:

| Stage | Volume | Action |
|-------|--------|--------|
| L1 receives | Many alerts | Initial triage and investigation |
| L2 escalation | Few True Positives | Deeper investigation and remediation |
| Major incident | Rarely | Full DFIR case |

The key things to remember — L1 analysts receive alerts through SIEM, EDR, or a ticketing platform. Most get closed at L1 as false positives, complex or dangerous ones get escalated to L2, and only a handful ever turn into full incidents.

### Reporting and Escalation Basics

When you escalate, you're handing off your work to someone else. The quality of that handoff matters. A few principles to keep in mind:

- Detailed documentation is required for complex cases, not just short comments
- Always include your investigation steps and the evidence you collected
- This is especially important for **True Positives** before escalation
- L2 uses your L1 report as their starting context, so make it count
- If you need to verify permissions or changes, loop in IT; for employee confirmation, reach out to HR

### Alert Reporting with the 5W Method

Writing clear reports helps L2 quickly understand the situation, saves investigation time, and stores useful context permanently. Raw logs are typically kept for only 3–12 months, but alert reports live much longer. There's also a selfish reason — if you can explain it clearly, you actually understand it.

| Element | Description | Example |
|---------|-------------|---------|
| **Who** | User or account involved | john.doe@company.com, admin account |
| **What** | Action performed | Login attempt, command execution, file download |
| **When** | Start and end time | 2026-02-13 08:00–08:15 UTC |
| **Where** | Location of activity | Host: WS-123, IP: 192.168.1.50, Service: VPN |
| **Why** | Reasoning behind verdict | Confirmed with user, matches known behavior pattern |

### Escalation Guide

#### When to Escalate to L2

| Scenario | Action |
|----------|--------|
| Major cyberattack detected | Escalate immediately |
| Requires remediation | Malware removal, host isolation, password reset |
| External communication needed | Management, partners, law enforcement |
| Uncertainty about alert | Need senior help to understand |

#### Escalation Steps

Once you've decided to escalate, the process is straightforward:

1. Reassign the alert to the L2 analyst currently on shift
2. Notify them directly via chat or in person
3. Complete the formal escalation form if your team requires one

#### What L2 Does After Escalation

After receiving your escalation, L2 reads your report and may ask clarifying questions. From there, they perform deeper analysis, confirm whether it's truly a True Positive, contact other departments if needed, and kick off Incident Response for major cases.

> **For new analysts:** Asking L2 for help when you're unsure is normal and expected — it's always better than closing an alert blindly, and it often becomes a valuable learning opportunity.

### SOC Communication Scenarios

Real-world SOC work throws curveballs. Here's how to handle the common ones:

| Situation | Response |
|-----------|----------|
| Urgent critical alert, L2 not responding (30 min) | Use emergency contacts: Call L2 → L3 → Manager |
| Account compromise validation | Do NOT message through the compromised account — contact the user via phone or alternative method |
| Sudden flood of alerts | Continue your prioritization workflow — inform L2 about the high alert volume |
| Realized alert misclassification | Immediately inform L2 (attackers may stay hidden for weeks) |
| SIEM logs missing or not searchable | Don't ignore the alert — investigate what you can and report the issue to L2 or your SOC engineer |

The overarching theme here is **don't freeze**. Be ready for unexpected situations, follow crisis communication procedures if they exist, and always document the actions you take during incidents.

</div>