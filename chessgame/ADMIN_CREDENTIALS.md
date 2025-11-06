# 🔐 Admin Credentials

## Default Login Credentials

**Username:** `admin`  
**Password:** `chess2025`

---

## Security Notes

### For Development/Local Use
The current implementation stores credentials in the source code, which is suitable for:
- Local tournaments
- Offline use
- Single-device scenarios
- Development/testing

### Changing the Password

To change the admin password:

1. Open `src/ChessTournament.tsx`
2. Find the `ADMIN_CREDENTIALS` constant (around line 183)
3. Update the password:

```typescript
const ADMIN_CREDENTIALS = {
  username: "admin",
  password: "YOUR_NEW_PASSWORD_HERE"
};
```

4. Save the file and restart the development server

---

## How Authentication Works

### Login Process
1. Click the **"Admin"** button in the header
2. A login modal will appear
3. Enter username and password
4. Click **"Login"** or press Enter

### Logout
- Click the **"Logout"** button (red text) in the header
- This will return you to Participant view

### Session Persistence
- Authentication persists while the page is open
- Refreshing the page will require re-login
- Closing the tab will end the session

---

## Production Security Recommendations

⚠️ **IMPORTANT:** For production use with remote access, implement proper security:

### Required Security Measures
1. **Server-Side Authentication**
   - Use JWT (JSON Web Tokens)
   - Implement OAuth 2.0
   - Use established auth providers (Auth0, Firebase Auth, etc.)

2. **Password Hashing**
   - Never store plain-text passwords
   - Use bcrypt, Argon2, or similar
   - Salt all passwords

3. **HTTPS**
   - Encrypt all data in transit
   - Use SSL certificates
   - Enforce HTTPS redirects

4. **Environment Variables**
   - Store credentials in `.env` files
   - Never commit credentials to version control
   - Use different credentials per environment

5. **Rate Limiting**
   - Prevent brute force attacks
   - Implement login attempt limits
   - Add CAPTCHA after failed attempts

6. **Session Management**
   - Implement secure session storage
   - Add session timeouts
   - Enable "Remember Me" securely

---

## Example .env Setup (Future Enhancement)

Create a `.env` file in the project root:

```env
VITE_ADMIN_USERNAME=your_username
VITE_ADMIN_PASSWORD_HASH=your_hashed_password
VITE_JWT_SECRET=your_secret_key
```

Then access in code:
```typescript
const ADMIN_CREDENTIALS = {
  username: import.meta.env.VITE_ADMIN_USERNAME,
  password: import.meta.env.VITE_ADMIN_PASSWORD_HASH
};
```

---

## Common Issues

### Forgot Password?
1. Check `ADMIN_CREDENTIALS.md` (this file) for default credentials
2. Or check `src/ChessTournament.tsx` line 183
3. If changed and forgotten, edit the source code to reset

### Login Not Working?
- Ensure username and password are correct (case-sensitive)
- Check browser console for errors
- Try refreshing the page
- Clear browser cache

### "Invalid username or password"
- Username: `admin` (lowercase)
- Password: `chess2025` (default)
- No extra spaces
- Check Caps Lock

---

## Multi-Admin Setup (Future Feature)

Currently, there's only one admin account. For multiple admins:

```typescript
const ADMIN_ACCOUNTS = [
  { username: "admin", password: "chess2025", role: "super_admin" },
  { username: "organizer1", password: "pass123", role: "admin" },
  { username: "organizer2", password: "pass456", role: "admin" }
];
```

---

## Access Control Summary

| Role | Login Required | Can Create Tournaments | Can Enter Scores | Can Export Data |
|------|---------------|----------------------|-----------------|----------------|
| Admin | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes |
| Participant | ❌ No | ❌ No | ❌ No | ❌ No |

---

## Best Practices

### For Tournament Organizers
1. ✅ Change default password before first use
2. ✅ Don't share admin credentials with participants
3. ✅ Logout when leaving the device unattended
4. ✅ Use a strong, unique password
5. ✅ Keep credentials secure (password manager)

### For Development
1. ✅ Never commit real passwords to Git
2. ✅ Use `.env` files for sensitive data
3. ✅ Add `.env` to `.gitignore`
4. ✅ Document credential locations
5. ✅ Test logout functionality

---

## Support

For password reset or authentication issues:
- Check source code: `src/ChessTournament.tsx`
- Review this document
- Contact system administrator

---

**Last Updated:** November 6, 2025  
**Default Credentials Valid:** Yes  
**Security Level:** Development (Local Use Only)
