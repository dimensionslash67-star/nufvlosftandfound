NU Fairview Lost & Found Management System

A modern web-based Lost and Found management system built for National University Fairview (NUFV) 
— replacing the legacy PHP system with a fast, secure, and mobile-friendly Next.js application.

The NUFV Lost and Found System is an internal web application that helps students and staff of National University Fairview report, browse, and claim lost items found within the campus.
The system has two sides:

Public side — Students can browse found items and submit claims without logging in
Staff/Admin side — Authorized staff can add items, manage records, track claims, and generate reports

This project is a full migration from a PHP + MySQL system to a modern Next.js 15 + PostgreSQL stack, deployed on Vercel with cloud image storage via Vercel Blob.

Features
Public (No Login Required)

Browse all found items with search and filters
Filter by item type, date range, and location
View item details and submit a claim request
Mobile-friendly responsive design

Staff Portal

Secure login with JWT authentication
Add new found items with photo uploads
Update item status (Available → Claimed → Returned → Disposed)
View and manage claimed items

Admin Dashboard

Full item management (create, edit, delete)
User account management (create staff, assign roles)
Audit logs — track every action taken in the system
Statistics dashboard with item counts by category
Generate and download CSV reports
Bulk import items via CSV file
System settings management

Automated Background Tasks

Daily disposal cron — automatically marks unclaimed items older than 30 days as Disposed
Overdue tracking cron — flags items that have passed their due date

