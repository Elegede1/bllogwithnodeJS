const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');

// Configure nodemailer transporter
const transporter = nodemailer.createTransport({
  service: 'gmail', // or your email service
  auth: {
    user: process.env.EMAIL_USER, // your email
    pass: process.env.EMAIL_PASS  // your app password
  }
});

// GET contact page
router.get('/', (req, res) => {
  res.render('contact', {
    title: 'Contact Us'
  });
});

// POST contact form
router.post('/', async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;
    
    // Validate input
    if (!name || !email || !subject || !message) {
      req.flash('error_msg', 'Please fill in all fields');
      return res.redirect('/contact');
    }
    
    // Email options
    const mailOptions = {
      from: email,
      to: process.env.CONTACT_EMAIL, // your email address
      subject: `Contact Form: ${subject}`,
      html: `
        <h3>New Contact Form Submission</h3>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <p><strong>Message:</strong></p>
        <p>${message.replace(/\n/g, '<br>')}</p>
      `,
      replyTo: email
    };
    
    // Send email
    await transporter.sendMail(mailOptions);
    
    req.flash('success_msg', 'Your message has been sent successfully!');
    res.redirect('/contact');
    
  } catch (error) {
    console.error('Email error:', error);
    req.flash('error_msg', 'Failed to send message. Please try again.');
    res.redirect('/contact');
  }
});

module.exports = router;