# Portfolio Setup Instructions

## Files to Add

### 1. Your Photo
- **File name:** `igal-photo.jpg` (or `.png`)
- **Location:** `public/assets/images/igal-photo.jpg`
- **Recommended size:** 400x400 pixels or larger, square format works best
- **Note:** This will appear in the "About Me" section

### 2. Your Resume
- **File name:** `Igal_Tal_Merom_Resume.pdf`
- **Location:** `public/assets/documents/Igal_Tal_Merom_Resume.pdf`
- **Note:** This will be downloaded when visitors click "Download Resume"

## Email Setup (Contact Form)

To enable the contact form to send emails to your Gmail (talm13124@gmail.com):

1. Go to [EmailJS.com](https://www.emailjs.com/)
2. Create a free account
3. Set up a service (Gmail)
4. Create an email template
5. Get your:
   - Service ID
   - Template ID  
   - Public Key

6. Replace the placeholders in `src/components/Contact.jsx`:
   ```javascript
   await emailjs.send(
     'YOUR_SERVICE_ID',    // Replace with your actual service ID
     'YOUR_TEMPLATE_ID',   // Replace with your actual template ID
     templateParams,
     'YOUR_PUBLIC_KEY'     // Replace with your actual public key
   );
   ```

## What's Already Done ✅

- ✅ Removed all Gymble references
- ✅ Updated content based on your LinkedIn profile
- ✅ Fixed GitHub and LinkedIn links
- ✅ Updated projects to match your GitHub repos
- ✅ Set up folder structure for resume and photo
- ✅ Contact form ready for EmailJS integration

## Quick Start

1. Add your photo: `public/assets/images/igal-photo.jpg`
2. Add your resume: `public/assets/documents/Igal_Tal_Merom_Resume.pdf`
3. Set up EmailJS (optional - form works without it but won't send emails)
4. Run `npm run dev` to see your portfolio! 