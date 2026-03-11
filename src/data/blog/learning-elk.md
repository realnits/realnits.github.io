---
author: Nithissh
pubDatetime: 2026-02-28T10:02:00.000Z
title: "ELK - The Basics"
featured: false
draft: false
tags:
  - tryhackme
description: "Understand how SOC analysts use the Elastic Stack (ELK) for log investigations."
---

This post covers notes from the TryHackMe ELK Basics room — understanding the Elastic Stack from a SOC analyst's perspective, including how logs flow through the pipeline and how Kibana is used for investigation.

### Overview of Elastic Stack

The **Elastic Stack (ELK)** is a collection of open-source tools used to collect, store, search, analyze, and visualize large volumes of data. Originally built for application monitoring and large dataset search, it's now widely used in Security Operations Centers as a near-SIEM solution with real-time data ingestion and analysis.

Its main capabilities include log collection from multiple sources, data normalization and processing, fast searching and analytics, and visualization through dashboards.

### Core Components of Elastic Stack

| Component | Purpose |
|---|---|
| **Elasticsearch** | Stores, searches, and analyzes data |
| **Logstash** | Processes and transforms incoming logs |
| **Beats** | Lightweight agents that collect logs from endpoints |
| **Kibana** | Web interface used to visualize and analyze data |

SOC analysts mainly interact with **Kibana**, not the backend components.

#### Elasticsearch

The search and analytics engine at the heart of the stack. It works with JSON-formatted documents and provides a RESTful API for interaction. Its core functions are data storage, fast search queries, data analysis, and indexing logs.

#### Logstash

A data processing pipeline that collects logs from multiple sources, parses and normalizes data before storing it. Its configuration is split into three sections:

| Section | Purpose |
|---|---|
| **Input** | Defines where logs are coming from |
| **Filter** | Processes or normalizes logs |
| **Output** | Sends processed logs to destination |

Output destinations include Elasticsearch, Kibana, file storage, or network ports. Logstash supports many input, filter, and output plugins for flexibility.

#### Beats

Lightweight data shippers (agents) installed on endpoints that send logs directly to Logstash or Elasticsearch:

- **Winlogbeat** — Windows event logs
- **Packetbeat** — Network traffic
- **Filebeat** — Log files
- **Metricbeat** — System metrics

#### Kibana

The web-based visualization tool and the primary interface for SOC analysts. It displays data stored in Elasticsearch and provides capabilities to search logs, create visualizations, build dashboards, and investigate security events.

### How ELK Components Work Together

The data flow is straightforward:

**Beats → Logstash → Elasticsearch → Kibana**

Beats collect logs from endpoints. Logstash receives those logs, parses and normalizes them into field:value pairs. Elasticsearch stores and indexes the data. Kibana visualizes and lets you analyze the stored logs.

### Kibana Discover Tab

SOC analysts spend most of their time in the **Discover Tab**. This is where log investigation happens.

#### Main Discover Tab Elements

| Element | Description |
|---|---|
| **Logs** | Each row represents a single event log |
| **Fields Pane** | Displays parsed fields from logs |
| **Index Pattern** | Defines which dataset/log source is used |
| **Search Bar** | Used to search logs with queries |
| **Time Filter** | Filters logs by time range |
| **Time Interval Chart** | Displays event counts over time |
| **Top Bar** | Save, share, or open searches |
| **Add Filter** | Apply filters without writing queries |

### Index Patterns

An index pattern is required for Kibana to access data from Elasticsearch. It determines which indices (log datasets) are used. Each log source has its own structure, logs are normalized into fields and values, and one index pattern can reference multiple indices. For example, `vpn_connections` would be used for VPN logs.

### Fields Pane

Located on the left side of the Discover tab, the Fields Pane shows all normalized fields along with the top 5 values and their occurrence percentage.

#### Filtering Options

| Button | Function |
|---|---|
| **+** | Show logs containing this value |
| **-** | Exclude logs containing this value |

You can also apply filters using the **Add Filter** button.

### Time Filter

Allows filtering logs based on specific time ranges — last 15 minutes, last 24 hours, or a custom date range. This is essential for focusing investigations during specific incident timeframes.

### Timeline (Event Histogram)

Displays the number of events over time. This is where you spot spikes and anomalies — a sudden spike in logs may indicate brute force attacks, malware activity, or system failures.

### Creating Tables from Logs

By default, logs appear as raw entries. To reduce noise, select the important fields and display them as columns. This gives you a cleaner view, easier analysis, and a reusable format. Tables can be saved for future sessions.

### Kibana Query Language (KQL)

KQL is used in the Discover search bar to query logs stored in Elasticsearch. There are two types of searches:

| Type | Description |
|---|---|
| **Free Text Search** | Searches for a term anywhere in logs |
| **Field-Based Search** | Searches within a specific field |

#### Free Text Search

Search for any word or phrase. For example, searching `United States` returns logs containing that phrase anywhere in the document.

Important behavior: KQL searches **complete words**. Searching `United` alone won't return results if only "United States" exists. Use wildcards (`United*`) for partial matches — this would match United States, United Kingdom, United Nations, etc.

#### Logical Operators in KQL

| Operator | Purpose | Example |
|---|---|---|
| **AND** | Both conditions must exist | `"United States" AND "Virginia"` |
| **OR** | Either condition | `"United States" OR "England"` |
| **NOT** | Exclude term | `"United States" AND NOT ("Florida")` |

#### Field-Based Search

Search within a specific field using the syntax `FieldName : Value`. For example: `Source_ip : 238.163.231.224 AND UserName : Suleman` requires both the source IP and username to match.

### Kibana Visualization

Used to display data in visual formats like tables, pie charts, bar charts, and line charts.

#### Field Correlation

You can combine fields to analyze relationships — for example, Source_IP vs Source_Country, or User vs Failed Login Attempts.

#### Steps to Create a Visualization

1. Open the **Visualization Tab**
2. Select visualization type
3. Add fields and configure metrics
4. Click **Save**, add a title and description, and save to the library

### Dashboards

Dashboards combine multiple visualizations and searches into a single view for centralized visibility, security monitoring, and incident investigation.

#### Steps to Create a Dashboard

1. Go to the **Dashboard Tab**
2. Click **Create Dashboard**
3. Select **Add from Library** and add your saved visualizations and searches
4. Arrange the dashboard layout
5. Click **Save**

### SOC Analyst Usage Summary

| Activity | Tool Used |
|---|---|
| Log investigation | Discover Tab |
| Searching logs | KQL |
| Filtering events | Fields Pane / Filters |
| Identifying spikes | Timeline |
| Visual analysis | Visualization |
| Monitoring overview | Dashboard |

The bottom line: ELK is widely used as a log analysis platform in SOC environments. Analysts mainly interact with Kibana, and the key skills to develop are writing KQL queries, investigating logs in the Discover tab, building visualizations, and creating dashboards. The focus is on log analysis and investigation, not backend configuration.