---
author: Nithissh
pubDatetime: 2026-02-14T03:02:00.000Z
title: "SOC Workbooks and Lookups"
featured: false
draft: false
tags:
  - tryhackme
description: "Discover useful corporate resources to help you structure and simplify L1 alert triage."
---

This post covers notes from the TryHackMe SOC Workbooks room — how identity and asset inventories give you the business context that makes alert triage actually effective.

The core idea here is that alert triage is not just checking logs. It's about understanding **business context**. Who is the person involved? What system was accessed? Does the action make sense given their role? Without that context, you're guessing.

### Identity Inventory

An identity inventory is a central database containing information about employees and service accounts — their roles, privileges, and organizational details. It's what lets you determine whether a user's activity is normal or suspicious.

#### Key Details Stored

- Name and username
- Role, job position, and department
- Location and working hours
- Privileges and access rights
- Contact information

#### Investigation Questions It Answers

- Should this user have access to this data?
- Is the login time normal for this role?
- Is communication between two users expected?
- Is this a real user account or a service account?

#### Identity Data Sources

| Source | What it Provides |
|------|------|
| Active Directory / Entra ID | Main corporate identity database |
| SSO Providers (Okta, Google Workspace) | Cloud authentication and user details |
| HR Systems | Official employee information |
| Custom Sheets / Internal DB | Additional internal tracking |

### Asset Inventory

An asset inventory lists company computers, servers, and endpoints along with their purpose and ownership. It's how you verify whether system access is legitimate and appropriate.

#### Key Details Stored

- Hostname, IP address, and OS
- Physical or cloud location
- Owner or team responsible
- Business purpose of the system

#### Investigation Questions It Answers

- Is this a sensitive server?
- Should this user be accessing this machine?
- Is the access location normal?
- Is this a workstation or a production server?

#### Asset Data Sources

| Source | What it Provides |
|------|------|
| Active Directory | Registered domain machines |
| SIEM / EDR | Host telemetry and metadata |
| MDM Tools (Intune, Jamf) | Managed corporate devices |
| Custom Sheets / Internal DB | Manual asset tracking |

> **Why inventories matter:** They provide business context during investigations, help you distinguish normal behavior from malicious behavior, reduce false positives, speed up triage, and give you the confidence to justify your verdicts.