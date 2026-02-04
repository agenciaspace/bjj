# Deployment Checklist - BJJ Academy App

Use this checklist to ensure everything is properly configured before deploying to production.

## Pre-Deployment Checks

### Environment Configuration
- [ ] `.env` file contains all required variables
  - [ ] `VITE_SUPABASE_URL` is set to production URL
  - [ ] `VITE_SUPABASE_ANON_KEY` is set to production key
  - [ ] `VITE_GEMINI_API_KEY` is set (optional, for AI features)
- [ ] `.env` is in `.gitignore` (never commit secrets!)
- [ ] All sensitive data removed from code

### Database Setup
- [ ] Run `final-fix-database.sql` in Supabase SQL Editor
- [ ] Run `setup-storage-bucket.sql` to create avatars bucket
- [ ] Verify all tables exist:
  - [ ] `profiles`
  - [ ] `academies`
  - [ ] `academy_members`
  - [ ] `trainings`
  - [ ] `check_ins`
- [ ] Verify RLS policies are active
- [ ] Test database connections
- [ ] Verify storage bucket exists with correct policies

### Build Configuration
- [ ] Run `npm install` to install all dependencies
- [ ] Run `npm run build` successfully
- [ ] Check `dist/` folder is generated
- [ ] Verify build has no errors or warnings
- [ ] Test `npm run preview` locally

### Face Recognition Models
- [x] All model files present in `public/models/`:
  - [x] `face_landmark_68_model-shard1`
  - [x] `face_landmark_68_model-weights_manifest.json`
  - [x] `face_recognition_model-shard1`
  - [x] `face_recognition_model-shard2`
  - [x] `face_recognition_model-weights_manifest.json`
  - [x] `ssd_mobilenetv1_model-shard1`
  - [x] `ssd_mobilenetv1_model-shard2`
  - [x] `ssd_mobilenetv1_model-weights_manifest.json`
- [ ] Models load correctly in browser
- [ ] Face recognition works in test environment

### PWA Configuration
- [ ] PWA manifest is configured
- [ ] Service worker is registered
- [ ] Icons are present:
  - [ ] `public/pwa-192x192.png`
  - [ ] `public/pwa-512x512.png`
- [ ] PWA installs correctly on mobile devices

### Vercel Configuration
- [ ] `vercel.json` is properly configured
- [ ] Build commands are correct
- [ ] Rewrites are set up properly
- [ ] Environment variables are configured in Vercel dashboard:
  - [ ] `VITE_SUPABASE_URL`
  - [ ] `VITE_SUPABASE_ANON_KEY`
  - [ ] `VITE_GEMINI_API_KEY` (optional)

## Feature Testing

### Authentication
- [ ] Google OAuth works correctly
- [ ] Users can sign in
- [ ] Users can sign out
- [ ] Session persists across page refreshes
- [ ] Protected routes require authentication

### Student Features
- [ ] Profile creation works
- [ ] Avatar upload works
- [ ] Belt/degree selection works
- [ ] Training sessions can be logged
- [ ] Check-in works (manual and face recognition)
- [ ] Academy join works with valid code
- [ ] Academy list shows correctly
- [ ] Timer works
- [ ] Achievements display correctly

### Professor/Owner Features
- [ ] Academy creation works
- [ ] Join code generation works
- [ ] Member requests appear correctly
- [ ] Approval/rejection works
- [ ] Student promotion works
- [ ] Class check-in with face recognition works
- [ ] Member statistics display correctly

### Face Recognition
- [ ] Face enrollment works
- [ ] Camera access is requested
- [ ] Face detection works
- [ ] Recognition matches enrolled faces
- [ ] Face data is encrypted
- [ ] Face data can be deleted

### Data Sync
- [ ] Local storage works for offline
- [ ] Data syncs to Supabase
- [ ] Data persists after refresh
- [ ] Export/Import functionality works

### Multi-Language
- [ ] Portuguese language works
- [ ] English language works
- [ ] Language switch works
- [ ] All translations are present

## Performance & Security

### Performance
- [ ] Page load time is acceptable (< 3s)
- [ ] Images are optimized
- [ ] Bundle size is reasonable
- [ ] No memory leaks in browser console
- [ ] Lighthouse score is good (80+)

### Security
- [ ] RLS policies are active on all tables
- [ ] Public access is limited appropriately
- [ ] API keys are not exposed in client code
- [ ] CORS is configured correctly
- [ ] XSS vulnerabilities are minimal
- [ ] Input validation is in place

## Browser Compatibility

- [ ] Works in Chrome (desktop)
- [ ] Works in Firefox (desktop)
- [ ] Works in Safari (desktop)
- [ ] Works in Chrome (mobile)
- [ ] Works in Safari (iOS)
- [ ] Camera access works on mobile

## Mobile Testing

- [ ] Responsive design works on phones
- [ ] Touch interactions work correctly
- [ ] Camera access works on mobile
- [ ] PWA installs on Android
- [ ] PWA installs on iOS
- [ ] Offline mode works
- [ ] Performance is acceptable on mobile

## Documentation

- [ ] README.md is up to date
- [ ] PRODUCTION_SETUP_GUIDE.md is complete
- [ ] QUICK_START_GUIDE.md is complete
- [ ] This deployment checklist is complete
- [ ] Legal documents (if required):
  - [ ] Terms of Service
  - [ ] Privacy Policy
  - [ ] Cookie Policy

## Final Checks

### Before Going Live
- [ ] All automated tests pass
- [ ] Manual testing is complete
- [ ] No critical bugs remaining
- [ ] Performance meets requirements
- [ ] Security audit passed
- [ ] Team has reviewed changes
- [ ] Backup plan is in place
- [ ] Rollback plan is ready

### Deployment Day
- [ ] Database backup created
- [ ] Current production state documented
- [ ] Deployment scheduled during low-traffic hours
- [ ] Team is available for support
- [ ] Monitoring tools are active
- [ ] Error tracking is enabled

### Post-Deployment
- [ ] Verify site is accessible
- [ ] Test critical user flows
- [ ] Check error logs
- [ ] Monitor performance
- [ ] Verify data sync
- [ ] Test authentication
- [ ] Verify mobile functionality

### Monitoring Setup
- [ ] Vercel Analytics is enabled
- [ ] Supabase logging is active
- [ ] Error tracking (Sentry) is configured
- [ ] Uptime monitoring is set up
- [ ] Alerts are configured for:
  - [ ] High error rates
  - [ ] Slow response times
  - [ ] Database issues
  - [ ] Authentication failures

## Rollback Procedure

If deployment fails:

1. **Immediate Actions**:
   - [ ] Revert to previous deployment
   - [ ] Notify team members
   - [ ] Check system logs

2. **Investigation**:
   - [ ] Identify root cause
   - [ ] Document the issue
   - [ ] Create fix plan

3. **Recovery**:
   - [ ] Test fix in staging
   - [ ] Deploy fix
   - [ ] Verify resolution

## Maintenance Tasks

### Weekly
- [ ] Check error logs
- [ ] Review user feedback
- [ ] Monitor storage usage
- [ ] Check API rate limits

### Monthly
- [ ] Update dependencies
- [ ] Review security patches
- [ ] Optimize database queries
- [ ] Clean up old data

### Quarterly
- [ ] Full security audit
- [ ] Performance review
- [ ] User survey
- [ ] Feature planning

## Emergency Contacts

- [ ] Technical Lead: [Name, Phone, Email]
- [ ] Database Admin: [Name, Phone, Email]
- [ ] DevOps Engineer: [Name, Phone, Email]
- [ ] Project Manager: [Name, Phone, Email]

---

## Deployment Summary

**Date**: [YYYY-MM-DD]
**Deployed By**: [Name]
**Version**: [X.X.X]
**Environment**: [Production/Staging]

### Changes Included:
1. [ ]
2. [ ]
3. [ ]

### Known Issues:
1. [ ]
2. [ ]

### Post-Deployment Status:
- [ ] Successful
- [ ] Partial Success (issues noted above)
- [ ] Failed (rollback performed)

**Notes**: 

---

**Last Updated**: 2026-02-03
**Version**: 1.0.0