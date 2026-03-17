# Password Reset Email Setup

FinanceME can send real password reset emails through SMTP.

## Required backend environment variables

Add these variables to your backend `.env`:

```env
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_smtp_username
SMTP_PASS=your_smtp_password
MAIL_FROM="FinanceME <no-reply@example.com>"
PASSWORD_RESET_URL_BASE=https://your-app.example/reset-password
```

## Local debug mode

If you do not have SMTP configured yet, you can still test the flow locally:

```env
PASSWORD_RESET_DEBUG=true
```

In debug mode, `POST /api/auth/request-password-reset` returns the reset token in the API response so the mobile app can use it directly.

## Notes

- Reset tokens are stored hashed in MongoDB.
- Tokens expire after 15 minutes.
- Tokens are invalidated immediately after a successful password reset.
