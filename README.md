# CivicLens \#ignite 8.0

## Smart Civic Issue Reporting and Resolution Platform

CivicLens is a platform for reporting and managing civic problems such as potholes, damaged streetlights, overflowing garbage, water leaks, and damaged roads.

Citizens can report an issue using a photo, location, text, or voice. Authorities can view reports, identify important issues, assign them to workers, track their progress, and verify repairs.

## What CivicLens Does

### Report an Issue

Citizens can submit a photo along with their location and an optional description.

Voice input is also supported to make reporting easier for people who are not comfortable typing.

### Find Duplicate Reports

Several people may report the same pothole or broken streetlight.

CivicLens uses image embeddings and location data to find reports that are likely referring to the same physical issue.

PostGIS first finds nearby reports. The image embeddings are then compared using pgvector.

This prevents the same problem from becoming dozens of separate tickets.

### Classify Issues

The system can identify the type of civic problem from the submitted image.

Examples include:

Potholes
Road damage
Garbage
Broken streetlights
Water leakage

This removes the need for authorities to manually categorize every report.

### Prioritize Issues

Not every complaint has the same urgency.

CivicLens calculates a priority score using factors such as:

Severity
Number of reports
Age of the complaint
Distance from schools
Distance from hospitals
Potential public impact

The score is explainable, so authorities can understand why an issue has a higher priority.

### Manage Reports

Authorities can:

View reported issues on a map
Filter and sort issues
Assign issues to departments
Assign field workers
Track progress
Monitor overdue issues
Update issue status

### Verify Repairs

When a repair is completed, the worker uploads an after photo.

The system compares the original and repair photos to determine whether the issue appears to have been fixed.

Citizens can also confirm the repair or report that the problem still exists.

### SLA and Escalation

Important issues can have a defined resolution deadline.

If the deadline is missed, the issue becomes overdue and can be escalated to the appropriate authority.

## How It Works

```text
Citizen
   |
   v
Report with Photo and Location
   |
   v
Issue Classification
   |
   v
Find Nearby Reports
   |
   v
Compare Image Embeddings
   |
   v
Existing Issue or New Issue
   |
   v
Calculate Priority
   |
   v
Authority Assignment
   |
   v
Repair
   |
   v
After Photo
   |
   v
Repair Verification
   |
   v
Citizen Confirmation
   |
   v
Resolved
```

## Technology

### Mobile App

Flutter
Dart

### Web Application and Backend

Next.js
TypeScript

### Database

PostgreSQL
PostGIS
pgvector

### AI

Hugging Face models
SigLIP or CLIP for image embeddings
Computer vision models for classification
Speech recognition for voice input

### Image Storage

Cloudinary

### Authentication and Realtime Updates

Supabase Authentication
Supabase Realtime

### Deployment

Vercel
Supabase
Cloudinary

## Architecture

```text
                Flutter App
                     |
                     v
              Next.js Backend
                     |
          +----------+----------+
          |          |          |
          v          v          v
     PostgreSQL  Cloudinary  AI Service
          |
      +---+---+
      |       |
   PostGIS  pgvector
      |       |
      +---+---+
          |
          v
    Authority Dashboard
```

## Why CivicLens

The main idea is simple.

A civic complaint should not just become another ticket in a database.

If 100 people report the same pothole, the authority should understand that there is **one pothole affecting 100 people**, not 100 unrelated complaints.

CivicLens combines location, images, reporting history, and repair evidence to represent the actual issue and its impact.

## Accessibility

CivicLens is designed to keep reporting simple.

A citizen can:

Take a photo
Share their location
Describe the problem using their voice
Submit the report

This reduces the amount of typing and technical knowledge required to report an issue.

## Project

CivicLens was developed as part of the **Ignite 8.0 hackathon**.

The project focuses on building a practical system that connects citizens and authorities through a complete reporting, prioritization, assignment, and verification workflow.
