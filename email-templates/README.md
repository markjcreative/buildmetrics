# BuildMetrics Email Templates

All templates use the `base.html` wrapper. Replace `{{CONTENT}}` with the template body and `{{SUBJECT}}` with the email subject line.

## Template Index

| # | File | Trigger | Key Variables |
|---|------|---------|---------------|
| 01 | `01-waitlist-confirmation.html` | Waitlist form submitted | `name`, `email` |
| 02 | `02-access-granted.html` | Admin grants early access | `name`, `login_url` |
| 03 | `03-welcome.html` | New account created | `name`, `dashboard_url` |
| 04 | `04-password-reset.html` | Password reset requested | `name`, `reset_url`, `expires_in` |
| 05 | `05-pdf-report-ready.html` | PDF report generated | `name`, `calc_name`, `project_name`, `download_url` |
| 06 | `06-project-shared.html` | Project shared with user | `recipient_name`, `sender_name`, `project_name`, `project_url` |
| 07 | `07-team-invite.html` | Team invitation sent | `recipient_name`, `inviter_name`, `team_name`, `accept_url` |
| 08 | `08-payment-failed.html` | Subscription payment fails | `name`, `amount`, `next_retry`, `update_billing_url` |
| 09 | `09-weekly-digest.html` | Weekly cron (Monday) | `name`, `week`, `calcs_run`, `projects_active`, `pdfs_exported` |
| 10 | `10-calc-check-failed.html` | Utilisation > 1.0 | `name`, `calc_name`, `check_name`, `utilisation`, `calc_url` |

## Connecting to Resend

In `landing/api/waitlist.php` and any future PHP mailer, use:

```php
function send_email($api_key, $to, $subject, $html) {
    $ch = curl_init('https://api.resend.com/emails');
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST           => true,
        CURLOPT_HTTPHEADER     => [
            'Authorization: Bearer ' . $api_key,
            'Content-Type: application/json',
        ],
        CURLOPT_POSTFIELDS => json_encode([
            'from'    => 'BuildMetrics <noreply@buildmetrics.uk>',
            'to'      => [$to],
            'subject' => $subject,
            'html'    => $html,
        ]),
    ]);
    curl_exec($ch);
    curl_close($ch);
}
```

Render a template:
```php
$html = file_get_contents(__DIR__ . '/../../email-templates/base.html');
$body = file_get_contents(__DIR__ . '/../../email-templates/03-welcome.html');
$html = str_replace(['{{CONTENT}}', '{{SUBJECT}}', '{{name}}', '{{dashboard_url}}'], 
                    ['Welcome', $body, $name, 'https://app.buildmetrics.uk/dashboard.html'], $html);
send_email($RESEND_API_KEY, $userEmail, 'Welcome to BuildMetrics', $html);
```

## GitHub → Hostinger Auto-Deploy

See `.github/workflows/deploy.yml`. Add these secrets in GitHub → Settings → Secrets:

| Secret | Value |
|--------|-------|
| `FTP_SERVER` | Your Hostinger FTP hostname (e.g. `ftp.buildmetrics.uk`) |
| `FTP_USERNAME_LANDING` | FTP username for `buildmetrics.uk` |
| `FTP_PASSWORD_LANDING` | FTP password for `buildmetrics.uk` |
| `FTP_USERNAME_APP` | FTP username for `app.buildmetrics.uk` |
| `FTP_PASSWORD_APP` | FTP password for `app.buildmetrics.uk` |

Every push to `main` automatically deploys both the landing page and the app.

## In-App Notifications

Add to any app page that loads `topNav.js`:
```html
<script src="/js/ui/notifications.js"></script>
```
TopNav auto-calls `Notifications.init()` — the bell appears in the header.

Trigger a notification anywhere in the app:
```js
Notifications.add('CALC_PASS', 'Beam Design B1 — all checks passed', { link: '/calcs/beam.html' });
Notifications.add('PDF_READY', 'Your report is ready to download', { link: '/reports/...' });
Notifications.add('PROJECT_SHARED', 'Mark shared "Office Block A" with you', { toast: true });
```

## Full Notification Catalogue (38 types)

| Category | Type | Description |
|----------|------|-------------|
| Auth | `WELCOME` | Account created |
| Auth | `EMAIL_VERIFY` | Email verification sent |
| Auth | `PASSWORD_RESET` | Password reset requested |
| Auth | `PASSWORD_CHANGED` | Password successfully changed |
| Auth | `LOGIN_NEW_DEVICE` | Login from unrecognised device |
| Auth | `PROFILE_UPDATED` | Profile details updated |
| Projects | `PROJECT_CREATED` | New project created |
| Projects | `PROJECT_SHARED` | Project shared with you |
| Projects | `PROJECT_UPDATED` | Project updated by collaborator |
| Projects | `PROJECT_DEADLINE` | Deadline approaching |
| Projects | `PROJECT_COMPLETED` | Project marked complete |
| Projects | `PROJECT_DELETED` | Project deleted |
| Calcs | `CALC_SAVED` | Calculation saved |
| Calcs | `CALC_PASS` | All Eurocode checks passed ✓ |
| Calcs | `CALC_FAIL` | Check failed — review required ✗ |
| Calcs | `CALC_SHARED` | Calculation shared with you |
| Calcs | `CALC_ERROR` | Calculation engine error |
| Reports | `PDF_READY` | PDF report generated |
| Reports | `PDF_DOWNLOADED` | PDF downloaded |
| Reports | `REPORT_SHARED` | Report shared with client |
| Reports | `WORD_READY` | Word export ready |
| Collab | `TEAM_INVITE` | Invited to join a team |
| Collab | `TEAM_JOINED` | Team member joined |
| Collab | `TEAM_REMOVED` | Removed from team |
| Collab | `COMMENT_ADDED` | New comment on your calculation |
| Collab | `MENTION` | Mentioned in a comment |
| Collab | `REVIEW_REQUESTED` | Review requested on a calculation |
| Billing | `PLAN_FREE` | Free plan active |
| Billing | `PLAN_UPGRADED` | Subscription upgraded |
| Billing | `PLAN_RENEWAL` | Renewal reminder |
| Billing | `PAYMENT_FAILED` | Payment failed — action required |
| Billing | `INVOICE_READY` | Invoice available |
| System | `NEW_CALCULATOR` | New calculator added to the platform |
| System | `MAINTENANCE` | Scheduled maintenance notice |
| System | `FEATURE_UPDATE` | New features available |
| System | `WEEKLY_DIGEST` | Weekly activity summary |
| Waitlist | `WAITLIST_CONFIRMED` | Waitlist signup confirmed |
| Waitlist | `ACCESS_GRANTED` | Early access granted |
