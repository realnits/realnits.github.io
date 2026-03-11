---
author: Nithissh
pubDatetime: 2026-02-16T03:02:00.000Z
title: "Introduction to EDR"
featured: false
draft: false
tags:
  - tryhackme
description: "Learn the fundamentals of EDR and explore its features and working."
---

This post covers notes from the TryHackMe Introduction to EDR room — understanding how Endpoint Detection and Response fills the gap that traditional antivirus leaves wide open.

### Why EDR Is Needed

Organizations rely heavily on endpoint devices — laptops, servers, workstations. With remote work becoming the norm, the traditional network perimeter has all but disappeared. Network security alone can't protect devices that aren't on the corporate network. EDR solves this by continuously monitoring endpoints regardless of location.

**Common EDR Solutions:** CrowdStrike Falcon, SentinelOne ActiveEDR, Microsoft Defender for Endpoint, Symantec EDR, OpenEDR

### The Three Pillars of EDR

#### Visibility

EDR continuously records detailed endpoint activity: process executions and parent-child relationships, registry changes, file and folder modifications, user actions, and network connections. It also maintains a historical activity timeline. This makes attack timeline reconstruction, threat hunting, and deep investigation context possible.

#### Detection

EDR doesn't rely on a single detection method. It layers multiple techniques:

| Technique | Detects |
|--------|------|
| Signature detection | Known malware |
| Behavioral detection | Suspicious actions (e.g. `winword.exe → powershell.exe`) |
| Anomaly detection | Deviations from normal behavior |
| IOC matching | Known malicious hashes/IPs |
| MITRE mapping | Attack stage identification |
| Machine learning | Multi-step advanced attacks |

#### Response

Analysts can act directly from the EDR console — isolate a host to contain spread, terminate a malicious process, quarantine files, open a remote shell, or collect forensic artifacts like memory dumps, event logs, registry exports, and files.

### EDR vs Antivirus

The easiest way to understand EDR is to compare it with traditional antivirus:

| Antivirus | EDR |
|------|------|
| Signature-based | Behavior + context-based |
| Preventive | Investigative + responsive |
| Limited visibility | Full activity timeline |
| Detects known malware | Detects unknown/advanced threats |
| No attack reconstruction | Full attack chain visibility |

Think of it this way: AV is the security guard at the entrance. EDR is the cameras plus the investigators inside the building.

### How EDR Works

**EDR Agents (Sensors)** are installed on endpoints. They monitor activities in real time, send telemetry to the central console, and perform basic detections locally.

**EDR Console (Brain)** correlates all the collected data, applies analytics and ML, generates alerts, and provides a single pane of glass for response actions.

#### Telemetry — The Key Concept

Telemetry is the detailed endpoint activity data that makes everything else possible — process activity, network connections, command-line execution, file changes, registry changes. Without telemetry, you can't detect stealth attacks, build full attack timelines, or assist investigations meaningfully.

### Example Attack — AV vs EDR

To see the difference in practice, consider how a typical attack chain plays out:

| Attack Stage | AV Response | EDR Response |
|------|------|------|
| Malicious document download | Often ignored | Logged and monitored |
| Macro execution | Often missed | Suspicious behavior detected |
| PowerShell payload | Often missed | Flagged |
| Process injection | Not detected | Detected |
| Remote connection | Limited visibility | Detected |
| Final outcome | Appears clean | Alert + response actions |

### EDR in the Security Ecosystem

EDR doesn't work in isolation. It integrates with firewalls, email security gateways, DLP, IAM, and SIEM (which serves as the central investigation platform). Together, these tools provide defense in depth — EDR handles the endpoint layer with visibility, intelligent detection, and immediate response that traditional antivirus simply cannot match.