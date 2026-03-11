---
author: Nithissh
pubDatetime: 2026-02-28T10:10:00.000Z
title: "Introduction to SOAR"
featured: false
draft: false
tags:
  - tryhackme
description: "Learn the concepts and methodology surrounding security orchestration, automation, and response."
---

This post covers notes from the TryHackMe Introduction to SOAR room — understanding what SOAR platforms do, why traditional SOCs need them, and how playbooks automate the repetitive parts of security operations.

### Traditional Security Operations Center

A **Security Operations Center (SOC)** is a centralized team responsible for monitoring, detecting, investigating, and responding to cyber threats within an organization. The main goal is to improve security incident handling through continuous monitoring, threat analysis, and incident response.

Every functional SOC relies on three pillars:

| Pillar | Description |
|---|---|
| **People** | Security analysts and incident responders |
| **Processes** | Incident handling procedures and workflows |
| **Technology** | Security tools like SIEM, EDR, Firewalls, etc. |

#### Key SOC Capabilities

**Monitoring and Detection** — Continuous monitoring of network and systems to detect suspicious activities and anomalies, primarily through SIEM. Think multiple failed login attempts, logins from unusual locations, or suspicious network traffic.

**Recovery and Remediation** — The SOC acts as first responder. Common actions include isolating compromised endpoints, removing malware, blocking malicious IPs, and stopping malicious processes using tools like EDR, firewalls, and IAM.

**Threat Intelligence** — SOC teams rely on threat intelligence feeds to stay current on known threats: malicious IP addresses, malware hashes, malicious domains, and IOCs.

**Communication** — SOC teams coordinate with IT, management, and sysadmins. Something as simple as creating a ticket for IT to verify a patch deployment is part of the daily workflow.

### Challenges Faced by Traditional SOCs

#### Alert Fatigue

Security tools generate massive volumes of alerts, many of which are false positives. Over time, analysts become overwhelmed and may start missing real threats buried in the noise.

#### Too Many Disconnected Tools

Firewall logs stored in one place, endpoint logs elsewhere, email security in yet another dashboard. Analysts must manually correlate data across all of them, leading to tool overload and slow investigations.

#### Manual Processes

When investigation procedures aren't documented and knowledge lives only in experienced analysts' heads, the result is slower incident response, inconsistent investigations, and a painful onboarding process for new analysts.

#### Talent Shortage

The cybersecurity talent gap is real. When organizations can't hire enough skilled professionals, existing analysts get overloaded with alerts, burn out faster, and response times suffer.

### What is SOAR?

**SOAR — Security Orchestration, Automation, and Response** — is a platform that integrates and automates the security tools used by SOC teams. It provides a unified interface for multiple tools, automated investigation workflows, and built-in case management and ticketing.

The three core capabilities map directly to the challenges above:

| Capability | Purpose |
|---|---|
| **Orchestration** | Connects and coordinates multiple security tools |
| **Automation** | Automatically performs investigation steps |
| **Response** | Takes security actions directly from the platform |

### Orchestration

Orchestration integrates different tools into a single workflow. Consider a VPN brute force investigation — without SOAR, an analyst manually switches between SIEM (check login logs), Threat Intelligence (check IP reputation), IAM (disable compromised user), and a Ticketing System (track investigation). With SOAR, all these tools are connected through **playbooks** — predefined workflows describing how to investigate an alert.

An example playbook for VPN brute force might look like:

1. Receive alert from SIEM
2. Check user's historical login activity
3. Check IP reputation in threat intelligence
4. Check for successful login attempts
5. Escalate if necessary

### Automation

Automation lets SOAR execute playbooks without manual intervention. Using the same VPN brute force example — SOAR receives the alert from SIEM, automatically checks historical login data, queries TI feeds for IP reputation, disables the user in IAM if the IP is malicious, and creates a ticket. All without an analyst touching it. This is how analysts can handle hundreds of alerts efficiently.

### Response

SOAR enables direct response actions from a single interface:

| Action | Tool Used |
|---|---|
| Block malicious IP | Firewall |
| Disable compromised user | IAM |
| Isolate infected host | EDR |
| Open investigation ticket | Ticketing system |

These responses can also be fully automated through playbooks.

### How SOAR Solves SOC Challenges

| SOC Challenge | SOAR Solution |
|---|---|
| Alert fatigue | Automation reduces manual investigations |
| Disconnected tools | Orchestration integrates tools |
| Manual processes | Playbooks standardize workflows |
| Talent shortage | Automation reduces analyst workload |

### Do SOAR Tools Replace SOC Analysts?

No. SOAR automates repetitive tasks, but human analysts remain essential. Complex investigations still require human judgment. Contextual decisions need someone who understands the business. Analysts create and refine the playbooks themselves. And automated actions still need validation. SOAR is a **force multiplier**, not a replacement.

### SOAR Playbooks

Playbooks are automated workflows used to investigate and respond to specific alert types. They have predefined investigation steps, decision-based logic (if/else), integration with multiple security tools, and the ability to automate responses end-to-end.

#### Phishing Investigation Playbook

Phishing emails are one of the most common attack vectors. A typical playbook handles them like this:

1. Receive alert — suspicious email detected
2. Create incident ticket
3. Check email contents for URLs or attachments
4. If neither exists, notify users and close
5. If present — analyze URL, scan attachment, check threat intelligence
6. If confirmed malicious — block domain, remove email from inboxes, alert affected users

#### CVE Patching Playbook

A CVE (Common Vulnerabilities and Exposures) is a publicly disclosed vulnerability with a unique identifier. The challenge is that new CVEs are released constantly, they're difficult to track manually, and delays in patching increase risk. An automated playbook handles this by monitoring new CVE announcements, analyzing vulnerability details, assessing severity and risk score, checking for affected internal systems, creating patching tickets, testing patches in staging, and deploying to production.

### Role of SOC Analysts in Playbooks

Even with automation, analysts are involved at key stages — approving high-risk actions, verifying false positives, reviewing automated decisions, and updating playbooks for new threat types.

### Key Takeaways

Traditional SOCs struggle with alert fatigue, manual workflows, disconnected tools, and talent shortages. SOAR platforms address all of these through orchestration, automation, and response capabilities. Playbooks automate common investigations like phishing detection and CVE patch management, but SOC analysts remain essential for decision-making and complex investigations.
