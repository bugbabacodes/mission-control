# 📧 Email Monitoring Workflow

> **Last Updated:** 2026-02-06  
> **Purpose:** Client email management system for Ishan  
> **Philosophy:** Responsive, professional, scalable

---

## 🎯 Core Principles

1. **Respond, Don't React** — Every email gets a deliberate, thoughtful response
2. **Inbox Zero Daily** — Clear inbox by end of business day
3. **Start With Them** — Begin emails with "You" or "Your" — client-centric communication
4. **Under-Promise, Over-Deliver** — Set realistic expectations, then exceed them
5. **Document Everything** — If it's not tracked, it doesn't exist

---

## 📂 Inbox Categories

### Priority Matrix

| Category | Response Time | Examples | Action |
|----------|---------------|----------|--------|
| 🔴 **URGENT** | < 2 hours | Production issues, critical bugs, escalations | Drop everything, respond immediately |
| 🟡 **IMPORTANT** | < 24 hours | New inquiries, project questions, meeting requests | Schedule focused response time |
| 🟢 **FYI** | < 48 hours | Updates, non-urgent requests, general communication | Batch process during low-energy periods |
| ⚪ **NEWSLETTER/PROMO** | No response | Subscriptions, cold outreach, newsletters | Auto-filter or unsubscribe |

### Category Labels (Gmail/Outlook)

- `URGENT-Client` — Red flag, immediate attention
- `Important-Reply` — Needs response within 24h
- `FYI-Read` — Informational, no immediate action
- `Waiting-On` — Awaiting client/team response
- `Follow-Up` — Requires scheduled follow-up
- `Proposal-Sent` — Active proposals in negotiation
- `Closed-Loop` — Completed/resolved threads

---

## ⏰ Response Time Goals

### By Client Tier

| Tier | Definition | Response Goal | Weekly Touchpoint |
|------|------------|---------------|-------------------|
| **Tier 1** | Enterprise/High-Value (>$50K) | 1 hour | Daily check-in |
| **Tier 2** | Growth/Mid-Size ($10K-50K) | 4 hours | 2x/week updates |
| **Tier 3** | Early/Small (<$10K) | 24 hours | Weekly updates |
| **Prospect** | In sales cycle | 2 hours | Per sales cadence |

### Business Hours

- **Standard:** Monday–Friday, 9:00 AM – 6:00 PM IST
- **Tier 1 Emergency:** Available until 8:00 PM IST
- **Weekends:** Only for URGENT Tier 1 issues

---

## 🔄 Daily Email Workflow

### Morning Routine (9:00–9:30 AM)

```
1. ☕ Quick scan for URGENT (red flags)
2. 📧 Process overnight emails (triage only)
3. 🎯 Identify top 3 priority responses for the day
4. ⏰ Schedule response blocks in calendar
```

### Midday Check (1:00–1:15 PM)

```
1. 👀 Check for new URGENT emails
2. 📝 Send any promised morning follow-ups
3. 📊 Update email tracking spreadsheet
```

### End-of-Day Clear (5:30–6:00 PM)

```
1. 📥 Inbox Zero — process remaining emails
2. 🔄 Move "Waiting-On" to Follow-Up tracker
3. 📅 Schedule tomorrow's priority responses
4. ✅ Mark completed threads
```

---

## 📊 Email Tracking System

### Tracking Spreadsheet (Google Sheets/Airtable)

| Field | Description | Example |
|-------|-------------|---------|
| **Email ID** | Unique identifier | `2026-02-06-001` |
| **Client** | Company/Contact name | Acme Corp — Jane Doe |
| **Tier** | Client priority level | Tier 2 |
| **Subject** | Email subject line | Q1 Campaign Budget Approval |
| **Received** | Date/time received | 2026-02-06 09:15 IST |
| **Category** | URGENT/IMPORTANT/FYI | IMPORTANT |
| **Status** | Current state | Awaiting Response |
| **Response Due** | SLA deadline | 2026-02-06 13:15 IST |
| **Sent** | Response sent date | 2026-02-06 11:30 IST |
| **Follow-Up Date** | Next touchpoint | 2026-02-08 |
| **Thread Status** | Open/Closed/Pending | Open |
| **Notes** | Context/keywords | Budget discussion, needs CFO approval |

### Status Options

- `New` — Just received, not reviewed
- `Triaged` — Categorized, awaiting response
- `Drafting` — Response in progress
- `Sent` — Response delivered
- `Awaiting Client` — Waiting for their reply
- `Follow-Up Scheduled` — Reminder set
- `Closed` — Complete, no further action
- `Escalated` — Moved to senior/team

---

## 🚨 Escalation Triggers

### Auto-Escalate When:

1. **No response after 3 follow-ups** → Move to "Cold/Closed"
2. **Client mentions "urgent," "critical," or "down"** → Mark URGENT immediately
3. **Budget discussion >$25K** → Flag for proposal process
4. **Negative sentiment detected** → Escalate to senior review
5. **Legal/compliance mentioned** → Pause, involve legal

### Escalation Path

```
Tier 3 Issue → Handle directly
    ↓
Tier 2 Issue → Self-manage, document
    ↓
Tier 1 Issue + URGENT → Immediate response + notify Ishan
    ↓
Crisis/Conflict → Pause + escalate to Ishan immediately
```

---

## 📅 Follow-Up Sequences

### Standard Follow-Up Cadence

| Stage | Timing | Channel | Purpose |
|-------|--------|---------|---------|
| **Initial Response** | Same day | Email | Acknowledge + set expectations |
| **Follow-Up 1** | +2 days | Email | Gentle reminder |
| **Follow-Up 2** | +5 days | Email + LinkedIn | Add value, check timing |
| **Follow-Up 3** | +10 days | Email | Final check-in |
| **Close Loop** | +14 days | Email | "Permission to close" message |

### Proposal-Specific Follow-Up

| Stage | Timing | Action |
|-------|--------|--------|
| **Day 0** | Immediately | Confirm receipt + timeline |
| **Day 3** | Check-in | Address questions/concerns |
| **Day 7** | Value-add | Share relevant case study |
| **Day 14** | Final push | "What would help decide?" |
| **Day 21** | Close attempt | "Permission to close" |

---

## 🤖 Automation Rules

### Gmail Filters (Auto-Apply)

```
From: *@tier1-client-domain.com → Label: URGENT-Client
Subject: "urgent" OR "critical" OR "ASAP" → Label: URGENT-Client + Star
Subject: "proposal" OR "contract" OR "invoice" → Label: Important-Reply
From: noreply@ OR newsletter@ → Label: Newsletter/Promo + Skip Inbox
Subject: "unsubscribe" → Label: Newsletter/Promo + Skip Inbox
```

### Auto-Responses (Vacation/OOO)

```
Subject: Out of Office — Ishan

Hello,

I'm currently out of the office with limited email access.

For urgent matters:
- Tier 1 clients: Call [phone]
- General inquiries: I'll respond by [date]

Thank you for your patience.

Best,
Ishan
```

---

## 📈 KPIs & Metrics

### Weekly Review (Every Friday)

| Metric | Target | Measurement |
|--------|--------|-------------|
| Average Response Time | < 4 hours | Track from receipt to first response |
| Inbox Zero Days | 5/5 | Days with cleared inbox |
| Client Satisfaction | > 90% | Post-interaction survey |
| Follow-Up Completion | 100% | No missed follow-ups |
| Escalation Rate | < 5% | Issues requiring senior help |

### Monthly Analysis

- Response time trends by client tier
- Most common email categories
- Peak volume days/times
- Template effectiveness (response rates)
- Unsubscribe/refine newsletter filtering

---

## 🛠️ Tools & Resources

### Recommended Stack

| Purpose | Tool | Alternative |
|---------|------|-------------|
| Email Client | Gmail + Superhuman | Outlook + Spark |
| Tracking | Google Sheets | Airtable |
| Scheduling | Calendly | SavvyCal |
| Templates | TextExpander | Gmail Templates |
| CRM | HubSpot Free | Pipedrive |
| Follow-Up | Boomerang | FollowUpThen |

### Quick Access

- **Templates:** `mission-control/memory/courage/response-templates.md`
- **Client Directory:** [Link to CRM]
- **Tracking Sheet:** [Link to Google Sheet]
- **Calendar:** [Link to scheduling]

---

## ✅ Daily Checklist

```markdown
## Morning (9:00 AM)
- [ ] Scan for URGENT emails
- [ ] Triage overnight inbox
- [ ] Identify top 3 priorities

## Midday (1:00 PM)
- [ ] Check for new URGENT
- [ ] Send morning promised replies
- [ ] Update tracking sheet

## End of Day (5:30 PM)
- [ ] Inbox Zero achieved
- [ ] Schedule tomorrow's priorities
- [ ] Review tomorrow's calendar
- [ ] Confirm no missed follow-ups
```

---

## 📝 Notes & Updates

**2026-02-06:** Initial workflow creation. Focus on establishing baseline response times and categorization system.

---

*Remember: Email is asynchronous communication. Be responsive, not reactive. Quality over quantity. The goal is happy clients, not an empty inbox.*
