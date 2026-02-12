const nodemailer = require('nodemailer');
require('dotenv').config();
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// Create Transporter using SMTP settings from .env
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT, // 587
    secure: false, // true for 465, false for other ports (STARTTLS)
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    },
    tls: {
        ciphers: 'SSLv3'
    }
});

// Verify connection configuration
transporter.verify(function (error, success) {
    if (error) {
        console.log("SMTP Connection Error:", error);
    } else {
        console.log("SMTP Server is ready to take our messages");
    }
});

const sendEmail = async (to, subject, html) => {
    try {
        const info = await transporter.sendMail({
            from: `"Expense Claim System" <${process.env.SMTP_USER}>`, // sender address
            to: to, // list of receivers
            subject: subject, // Subject line
            html: html, // html body
        });
        console.log("Message sent: %s", info.messageId);
        return info;
    } catch (error) {
        console.error("Error sending email:", error);
        return null;
    }
};

// 1. Notify Requester that claim is submitted
const sendClaimSubmissionEmail = async (user, claim) => {
    const subject = `Claim Submitted: ${claim.title}`;
    const html = `
        <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
            <h2 style="color: #2563eb;">Claim Submitted Successfully</h2>
            <p>Hi <strong>${user.name}</strong>,</p>
            <p>Your expense claim has been successfully submitted and is now pending approval.</p>
            
            <div style="background-color: #f8fafc; padding: 15px; border-radius: 5px; margin: 15px 0;">
                <h3 style="margin-top: 0; color: #475569;">Claim Details</h3>
                <p><strong>Title:</strong> ${claim.title}</p>
                <p><strong>Amount:</strong> $${claim.amount}</p>
                <p><strong>Date:</strong> ${claim.date}</p>
                <p><strong>Type:</strong> ${claim.type}</p>
            </div>

            <p>You will be notified once an approver takes action.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="font-size: 12px; color: #94a3b8;">This is an automated message from the Expense Claim System.</p>
        </div>
    `;
    return sendEmail(user.email, subject, html);
};

// 2. Notify Approver that action is required
const sendApprovalRequestEmail = async (approver, claim, requesterName) => {
    const subject = `Action Required: Approval for ${claim.title}`;
    const html = `
        <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
            <h2 style="color: #d97706;">Action Required: Pending Approval</h2>
            <p>Hi <strong>${approver.name}</strong>,</p>
            <p>You have a new expense claim from <strong>${requesterName}</strong> waiting for your approval.</p>
            
            <div style="background-color: #fff7ed; padding: 15px; border-radius: 5px; margin: 15px 0; border-left: 4px solid #d97706;">
                <h3 style="margin-top: 0; color: #9a3412;">Claim Summary</h3>
                <p><strong>Title:</strong> ${claim.title}</p>
                <p><strong>Amount:</strong> $${claim.amount}</p>
                <p><strong>Requester:</strong> ${requesterName}</p>
                <p><strong>Date:</strong> ${claim.date}</p>
            </div>

            <p>Please log in to the dashboard to Approve or Reject this claim.</p>
            <a href="${FRONTEND_URL}/dashboard" style="display: inline-block; background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Go to Dashboard</a>
            
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="font-size: 12px; color: #94a3b8;">This is an automated message.</p>
        </div>
    `;
    return sendEmail(approver.email, subject, html);
};

// 3. Notify Requester of Outcome (Approved/Rejected)
const sendClaimStatusUpdateEmail = async (user, claim, status) => {
    const color = status === 'Approved' ? '#16a34a' : '#dc2626';
    const subject = `Claim ${status}: ${claim.title}`;
    const html = `
        <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
            <h2 style="color: ${color};">Claim ${status}</h2>
            <p>Hi <strong>${user.name}</strong>,</p>
            <p>Your expense claim <strong>${claim.title}</strong> has been <strong>${status}</strong>.</p>
            
            <div style="background-color: #f8fafc; padding: 15px; border-radius: 5px; margin: 15px 0;">
                <p><strong>Amount:</strong> $${claim.amount}</p>
                <p><strong>Status:</strong> <span style="color: ${color}; font-weight: bold;">${status}</span></p>
                <p><strong>Remarks:</strong> Check dashboard for details.</p>
            </div>

            <a href="http://localhost:3000/claim/${claim.id}" style="display: inline-block; background-color: #475569; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Claim</a>
        </div>
    `;
    return sendEmail(user.email, subject, html);
};

// 4. Send New Account Credentials to Employee
const sendNewAccountCredentials = async (user, password) => {
    const subject = `Welcome to Expense Claim System - Your Credentials`;
    const html = `
        <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
            <h2 style="color: #2563eb;">Welcome, ${user.name}!</h2>
            <p>Your account has been created successfully. Please use the following credentials to log in:</p>
            
            <div style="background-color: #f8fafc; padding: 15px; border-radius: 5px; margin: 15px 0; border-left: 4px solid #2563eb;">
                <p><strong>Username:</strong> ${user.username}</p>
                <p><strong>Password:</strong> ${password}</p>
            </div>

            <p style="color: #d97706;"><strong>Note:</strong> Your account is currently <strong>Pending Approval</strong>. You can log in, but you cannot submit claims until an Admin activates your account.</p>

            <a href="http://localhost:3000" style="display: inline-block; background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Login Now</a>
            
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="font-size: 12px; color: #94a3b8;">Please change your password after your first login (Feature coming soon).</p>
        </div>
    `;
    return sendEmail(user.email, subject, html);
};

// 5. Notify Admin of New Registration
const sendRegistrationApprovalRequest = async (admin, newUser) => {
    const subject = `New Employee Registration: ${newUser.name}`;
    const html = `
        <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
            <h2 style="color: #d97706;">New Registration Request</h2>
            <p>A new employee has registered and is waiting for account activation.</p>
            
            <div style="background-color: #fff7ed; padding: 15px; border-radius: 5px; margin: 15px 0;">
                <p><strong>Name:</strong> ${newUser.name}</p>
                <p><strong>Email:</strong> ${newUser.email}</p>
                <p><strong>Department:</strong> ${newUser.department}</p>
            </div>

            <p>Please log in to the Admin Dashboard to activate this user.</p>
            <a href="${FRONTEND_URL}/employee-management" style="display: inline-block; background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Manage Employees</a>
        </div>
    `;
    return sendEmail(admin.email, subject, html);
};

module.exports = {
    sendClaimSubmissionEmail,
    sendApprovalRequestEmail,
    sendClaimStatusUpdateEmail,
    sendNewAccountCredentials,
    sendRegistrationApprovalRequest,

    // 6. Notify Requester of Auto-Approval
    sendAutoApprovalEmail: async (user, claim) => {
        const subject = `Claim Auto-Approved: ${claim.title}`;
        const html = `
            <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
                <h2 style="color: #16a34a;">Claim Automatically Approved</h2>
                <p>Hi <strong>${user.name}</strong>,</p>
                <p>Your expense claim <strong>${claim.title}</strong> has been <strong>Approved Automatically</strong> as there is no specific approver assigned for your department's level.</p>
                
                <div style="background-color: #f0fdf4; padding: 15px; border-radius: 5px; margin: 15px 0; border-left: 4px solid #16a34a;">
                    <p><strong>Amount:</strong> $${claim.amount}</p>
                    <p><strong>Status:</strong> <span style="color: #16a34a; font-weight: bold;">Approved</span></p>
                </div>

                <a href="${FRONTEND_URL}/claim/${claim.id}" style="display: inline-block; background-color: #475569; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Claim</a>
            </div>
        `;
        return sendEmail(user.email, subject, html);
    },

    // 7. Send Password Reset
    sendPasswordResetEmail: async (user, newPassword) => {
        const subject = `Password Reset Request`;
        const html = `
            <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
                <h2 style="color: #2563eb;">Password Reset</h2>
                <p>Hi <strong>${user.name}</strong>,</p>
                <p>We received a request to reset your password. Here are your new credentials:</p>
                
                <div style="background-color: #f8fafc; padding: 15px; border-radius: 5px; margin: 15px 0; border-left: 4px solid #2563eb;">
                    <p><strong>Username:</strong> ${user.username}</p>
                    <p><strong>New Password:</strong> ${newPassword}</p>
                </div>

                <p style="color: #d97706;"><strong>Important:</strong> Please log in and change your password immediately.</p>
                
                <a href="${FRONTEND_URL}" style="display: inline-block; background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Login Now</a>
            </div>
        `;
        return sendEmail(user.email, subject, html);
    }
};
