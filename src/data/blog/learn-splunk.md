---
author: Nithissh
pubDatetime: 2026-02-23T03:02:00.000Z
title: "Splunk - The Basics"
featured: false
draft: false
tags:
  - tryhackme
description: "Understand how SOC analysts use Splunk for log investigations."
---

This post covers notes from the TryHackMe Splunk Basics room — understanding how Splunk's core components work together and how the web interface is used for log investigation.

### Core Splunk Components

Splunk is built around three main components that work together to collect, process, store, search, and visualize machine data:

**Data Sources → Forwarder → Indexer → Search Head**

#### The Forwarder

A lightweight agent installed on endpoints to collect logs and send them to the Splunk Indexer. It's designed to use minimal resources so it doesn't impact endpoint performance. Common data sources include web servers (traffic logs), Windows machines (Event Logs, PowerShell, Sysmon), Linux hosts (system and host logs), and databases (connection requests, responses, errors).

#### The Indexer

The core processing engine of Splunk. It receives data from Forwarders, parses the raw data, normalizes it into field-value pairs, categorizes events, and stores everything as structured, searchable events ready for analysis.

#### The Search Head

The component analysts interact with most. It executes searches using SPL (Search Processing Language), sends search requests to the Indexer, receives matching events as field-value pairs, and displays results in the Search & Reporting App. Results can be transformed into tables, pie charts, bar charts, and column charts.

### Splunk Web Interface Overview

When you log into Splunk, the default home screen has several key sections worth understanding.

#### Splunk Bar (Top Navigation)

Located at the top of the interface, the Splunk Bar provides access to:
- **Messages** — system-level notifications
- **Settings** — Splunk instance configuration
- **Activity** — monitor search jobs and processes
- **Help** — tutorials and documentation
- **Find** — search across the app

It also lets you switch between installed Splunk apps.

#### Apps Panel

Displays installed Splunk apps. The default app is **Search & Reporting**. You can switch apps through either the Apps Panel or the Splunk Bar app switcher.

#### Explore Splunk Panel

Provides quick access to adding data, installing new Splunk apps, and accessing Splunk documentation.

#### Dashboard

By default, no dashboards are displayed. You can select from existing dashboards using the dropdown menu, visit the dashboards listing page, create custom dashboards, or view your personal dashboards under the **Yours** tab.

### Summary

The three components form a clean pipeline: **Forwarder** collects and forwards logs, **Indexer** parses, normalizes, and stores events, and **Search Head** searches, analyzes, and visualizes data using SPL. The web interface ties it all together with navigation, app management, data onboarding, and dashboard capabilities.