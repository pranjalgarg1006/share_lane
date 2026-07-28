const nodemailer = require('nodemailer');

// Create reusable transporter
const createTransporter = () => {
  // Remove any spaces from the password (Gmail app passwords sometimes have spaces)
  const emailPass = process.env.EMAIL_PASS ? process.env.EMAIL_PASS.replace(/\s/g, '') : '';
  
  if (!process.env.EMAIL_USER || !emailPass) {
    throw new Error('Email credentials are not configured. Please set EMAIL_USER and EMAIL_PASS in .env file.');
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: emailPass
    },
    // Add connection timeout and other options for better reliability
    pool: true,
    maxConnections: 1,
    rateDelta: 2000,
    rateLimit: 5
  });

  // Verify transporter configuration
  return transporter;
};

// Send OTP email
const sendOTPEmail = async (email, otp, name) => {
  let transporter;
  try {
    // Create and verify transporter
    transporter = createTransporter();
    
    // Verify connection configuration
    await transporter.verify();
    console.log('Email server is ready to send messages');

    const mailOptions = {
      from: `"ShareLane" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Verify Your Email - ShareLane',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Email Verification</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0;">ShareLane</h1>
          </div>
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e0e0e0;">
            <h2 style="color: #667eea; margin-top: 0;">Email Verification</h2>
            <p>Hello ${name || 'there'},</p>
            <p>Thank you for signing up for ShareLane! To complete your registration, please verify your email address using the OTP below:</p>
            <div style="background: white; padding: 20px; border-radius: 5px; text-align: center; margin: 30px 0; border: 2px dashed #667eea;">
              <h1 style="color: #667eea; font-size: 36px; letter-spacing: 5px; margin: 0;">${otp}</h1>
            </div>
            <p style="color: #666; font-size: 14px;">This OTP will expire in 10 minutes. If you didn't request this verification, please ignore this email.</p>
            <p style="margin-top: 30px;">Best regards,<br>The ShareLane Team</p>
          </div>
        </body>
        </html>
      `,
      text: `
        Hello ${name || 'there'},
        
        Thank you for signing up for ShareLane! To complete your registration, please verify your email address using the OTP below:
        
        ${otp}
        
        This OTP will expire in 10 minutes. If you didn't request this verification, please ignore this email.
        
        Best regards,
        The ShareLane Team
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('OTP email sent successfully:', info.messageId);
    console.log('Email sent to:', email);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending OTP email:', error);
    
    // Provide more detailed error messages
    let errorMessage = 'Failed to send OTP email';
    
    if (error.code === 'EAUTH') {
      errorMessage = 'Email authentication failed. Please check your EMAIL_USER and EMAIL_PASS in .env file.';
    } else if (error.code === 'ECONNECTION' || error.code === 'ETIMEDOUT') {
      errorMessage = 'Email server connection failed. Please check your internet connection and email service configuration.';
    } else if (error.response) {
      errorMessage = `Email service error: ${error.response}`;
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    console.error('Detailed error:', {
      code: error.code,
      command: error.command,
      response: error.response,
      responseCode: error.responseCode
    });
    
    throw new Error(errorMessage);
  } finally {
    // Don't close transporter - let nodemailer pool manage connections
    // Closing it can cause issues with subsequent emails
  }
};

// Send booking confirmation email
const sendBookingConfirmationEmail = async (bookingData) => {
  let transporter;
  try {
    console.log('📧 Starting to send booking confirmation email...');
    console.log('📧 Email configuration check:', {
      hasEmailUser: !!process.env.EMAIL_USER,
      emailUser: process.env.EMAIL_USER ? process.env.EMAIL_USER.substring(0, 3) + '***' : 'not set',
      hasEmailPass: !!process.env.EMAIL_PASS
    });

    // Create and verify transporter
    transporter = createTransporter();
    
    // Verify connection configuration
    console.log('📧 Verifying email server connection...');
    await transporter.verify();
    console.log('✅ Email server is ready to send booking confirmation');

    const {
      studentEmail,
      studentName,
      bookingReference,
      seatsBooked,
      totalPrice,
      pickupLocation,
      destination,
      rideDate,
      rideTime,
      providerName,
      providerEmail,
      providerPhone,
      specialRequests,
      pickupNotes,
      bookedAt,
      isConfirmed = false // Flag to indicate if booking is confirmed by admin
    } = bookingData;

    // Format date
    const formattedDate = new Date(rideDate).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // Format booking time
    const formattedBookingTime = new Date(bookedAt).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const mailOptions = {
      from: `"ShareLane" <${process.env.EMAIL_USER}>`,
      to: studentEmail,
      subject: isConfirmed 
        ? `Booking Confirmed - ${bookingReference} | ShareLane`
        : `Payment Received - Booking Pending Confirmation - ${bookingReference} | ShareLane`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Booking Confirmation</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0;">ShareLane</h1>
            <p style="color: white; margin: 10px 0 0 0; font-size: 18px;">Booking Confirmation</p>
          </div>
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e0e0e0;">
            <h2 style="color: #667eea; margin-top: 0;">Hello ${studentName},</h2>
            ${isConfirmed 
              ? `<p>Great news! Your ride booking has been <strong>confirmed</strong> by the ride provider! We're excited to have you join us on this journey.</p>
                 <div style="background: #d4edda; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #28a745;">
                   <p style="color: #155724; margin: 0; font-weight: bold;">✅ Booking Confirmed - You're All Set!</p>
                 </div>`
              : `<p>Your payment has been received successfully! Your ride booking is now pending confirmation from the ride provider.</p>
                 <div style="background: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ffc107;">
                   <p style="color: #856404; margin: 0; font-weight: bold;">✅ Payment Received - Waiting for Admin Confirmation</p>
                 </div>`
            }
            
            <div style="background: white; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #667eea;">
              <h3 style="color: #667eea; margin-top: 0;">Booking Reference</h3>
              <p style="font-size: 24px; font-weight: bold; color: #333; margin: 0;">${bookingReference}</p>
            </div>

            <div style="background: white; padding: 20px; border-radius: 5px; margin: 20px 0;">
              <h3 style="color: #667eea; margin-top: 0; border-bottom: 2px solid #e0e0e0; padding-bottom: 10px;">Ride Details</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 10px 0; color: #666; width: 40%;"><strong>Pickup Location:</strong></td>
                  <td style="padding: 10px 0; color: #333;">${pickupLocation}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; color: #666;"><strong>Destination:</strong></td>
                  <td style="padding: 10px 0; color: #333;">${destination}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; color: #666;"><strong>Date:</strong></td>
                  <td style="padding: 10px 0; color: #333;">${formattedDate}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; color: #666;"><strong>Time:</strong></td>
                  <td style="padding: 10px 0; color: #333;">${rideTime}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; color: #666;"><strong>Seats Booked:</strong></td>
                  <td style="padding: 10px 0; color: #333;">${seatsBooked} seat${seatsBooked > 1 ? 's' : ''}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; color: #666;"><strong>Total Price:</strong></td>
                  <td style="padding: 10px 0; color: #333; font-weight: bold; font-size: 18px;">₹${totalPrice.toFixed(2)}</td>
                </tr>
              </table>
            </div>

            <div style="background: white; padding: 20px; border-radius: 5px; margin: 20px 0;">
              <h3 style="color: #667eea; margin-top: 0; border-bottom: 2px solid #e0e0e0; padding-bottom: 10px;">Driver Information</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 10px 0; color: #666; width: 40%;"><strong>Name:</strong></td>
                  <td style="padding: 10px 0; color: #333;">${providerName}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; color: #666;"><strong>Email:</strong></td>
                  <td style="padding: 10px 0; color: #333;">${providerEmail}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; color: #666;"><strong>Phone:</strong></td>
                  <td style="padding: 10px 0; color: #333;">${providerPhone || 'Not provided'}</td>
                </tr>
              </table>
            </div>

            ${specialRequests ? `
            <div style="background: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ffc107;">
              <h4 style="color: #856404; margin-top: 0;">Special Requests</h4>
              <p style="color: #856404; margin: 0;">${specialRequests}</p>
            </div>
            ` : ''}

            ${pickupNotes ? `
            <div style="background: #d1ecf1; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #0c5460;">
              <h4 style="color: #0c5460; margin-top: 0;">Pickup Notes</h4>
              <p style="color: #0c5460; margin: 0;">${pickupNotes}</p>
            </div>
            ` : ''}

            <div style="background: #e7f3ff; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #2196F3;">
              <h4 style="color: #0d47a1; margin-top: 0;">Important Information</h4>
              <ul style="color: #0d47a1; margin: 10px 0; padding-left: 20px;">
                <li>Please arrive at the pickup location 5-10 minutes before the scheduled time</li>
                <li>Keep your booking reference (${bookingReference}) handy for reference</li>
                <li>Contact the driver directly if you have any questions or need to make changes</li>
                ${isConfirmed 
                  ? `<li>Your booking has been <strong>Confirmed</strong> by the driver - you're all set for your ride!</li>`
                  : `<li>Your booking status is currently <strong>Pending</strong> and will be confirmed by the driver</li>`
                }
              </ul>
            </div>

            <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0; text-align: center;">
              <p style="color: #666; font-size: 12px; margin: 0;">Booking created on: ${formattedBookingTime}</p>
            </div>

            <p style="margin-top: 30px;">If you have any questions or need to make changes to your booking, please contact us or reach out to your driver directly.</p>
            <p>We hope you have a safe and pleasant journey!</p>
            <p style="margin-top: 30px;">Best regards,<br><strong>The ShareLane Team</strong></p>
          </div>
        </body>
        </html>
      `,
      text: `
        Hello ${studentName},
        
        ${isConfirmed 
          ? `Great news! Your ride booking has been confirmed by the ride provider! We're excited to have you join us on this journey.
        
        ✅ Booking Confirmed - You're All Set!`
          : `Your payment has been received successfully! Your ride booking is now pending confirmation from the ride provider.
        
        ✅ Payment Received - Waiting for Admin Confirmation`
        }
        
        BOOKING REFERENCE: ${bookingReference}
        
        RIDE DETAILS:
        - Pickup Location: ${pickupLocation}
        - Destination: ${destination}
        - Date: ${formattedDate}
        - Time: ${rideTime}
        - Seats Booked: ${seatsBooked} seat${seatsBooked > 1 ? 's' : ''}
        - Total Price: ₹${totalPrice.toFixed(2)}
        
        DRIVER INFORMATION:
        - Name: ${providerName}
        - Email: ${providerEmail}
        - Phone: ${providerPhone || 'Not provided'}
        
        ${specialRequests ? `SPECIAL REQUESTS: ${specialRequests}\n` : ''}
        ${pickupNotes ? `PICKUP NOTES: ${pickupNotes}\n` : ''}
        
        IMPORTANT INFORMATION:
        - Please arrive at the pickup location 5-10 minutes before the scheduled time
        - Keep your booking reference (${bookingReference}) handy for reference
        - Contact the driver directly if you have any questions or need to make changes
        ${isConfirmed 
          ? '- Your booking has been Confirmed by the driver - you\'re all set for your ride!'
          : '- Your booking status is currently Pending and will be confirmed by the driver'
        }
        
        Booking created on: ${formattedBookingTime}
        
        If you have any questions or need to make changes to your booking, please contact us or reach out to your driver directly.
        
        We hope you have a safe and pleasant journey!
        
        Best regards,
        The ShareLane Team
      `
    };

    console.log('📧 Sending email to:', studentEmail);
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Booking confirmation email sent successfully!');
    console.log('📧 Message ID:', info.messageId);
    console.log('📧 Email sent to:', studentEmail);
    console.log('📧 Response:', info.response);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Error sending booking confirmation email:');
    console.error('Error message:', error.message);
    console.error('Error code:', error.code);
    console.error('Error stack:', error.stack);
    
    // Provide more detailed error messages
    let errorMessage = 'Failed to send booking confirmation email';
    
    if (error.code === 'EAUTH') {
      errorMessage = 'Email authentication failed. Please check your EMAIL_USER and EMAIL_PASS in .env file.';
      console.error('❌ AUTHENTICATION ERROR: Check your email credentials in .env file');
    } else if (error.code === 'ECONNECTION' || error.code === 'ETIMEDOUT') {
      errorMessage = 'Email server connection failed. Please check your internet connection and email service configuration.';
      console.error('❌ CONNECTION ERROR: Cannot connect to email server');
    } else if (error.response) {
      errorMessage = `Email service error: ${error.response}`;
      console.error('❌ SERVICE ERROR:', error.response);
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    console.error('📧 Detailed error information:', {
      code: error.code,
      command: error.command,
      response: error.response,
      responseCode: error.responseCode,
      message: error.message
    });
    
    throw new Error(errorMessage);
  } finally {
    // Don't close transporter - let nodemailer pool manage connections
    // Closing it can cause issues with subsequent emails
  }
};

// Send booking rejection email
const sendBookingRejectionEmail = async (bookingData) => {
  let transporter;
  try {
    console.log('📧 Starting to send booking rejection email...');
    console.log('📧 Email configuration check:', {
      hasEmailUser: !!process.env.EMAIL_USER,
      emailUser: process.env.EMAIL_USER ? process.env.EMAIL_USER.substring(0, 3) + '***' : 'not set',
      hasEmailPass: !!process.env.EMAIL_PASS
    });

    // Create and verify transporter
    transporter = createTransporter();
    
    // Verify connection configuration
    console.log('📧 Verifying email server connection...');
    await transporter.verify();
    console.log('✅ Email server is ready to send booking rejection');

    const {
      studentEmail,
      studentName,
      bookingReference,
      seatsBooked,
      totalPrice,
      pickupLocation,
      destination,
      rideDate,
      rideTime,
      providerName,
      providerEmail,
      providerPhone,
      cancellationReason,
      bookedAt
    } = bookingData;

    // Format date
    const formattedDate = new Date(rideDate).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // Format booking time
    const formattedBookingTime = new Date(bookedAt).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const mailOptions = {
      from: `"ShareLane" <${process.env.EMAIL_USER}>`,
      to: studentEmail,
      subject: `Booking Rejected/Cancelled - ${bookingReference} | ShareLane`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Booking Rejection</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0;">ShareLane</h1>
            <p style="color: white; margin: 10px 0 0 0; font-size: 18px;">Booking Rejection Notice</p>
          </div>
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e0e0e0;">
            <h2 style="color: #ef4444; margin-top: 0;">Hello ${studentName},</h2>
            <p>We regret to inform you that your booking request has been rejected by the ride provider.</p>
            
            <div style="background: #fee2e2; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ef4444;">
              <h3 style="color: #ef4444; margin-top: 0;">Booking Reference</h3>
              <p style="font-size: 24px; font-weight: bold; color: #333; margin: 0;">${bookingReference}</p>
            </div>

            <div style="background: white; padding: 20px; border-radius: 5px; margin: 20px 0;">
              <h3 style="color: #ef4444; margin-top: 0; border-bottom: 2px solid #e0e0e0; padding-bottom: 10px;">Booking Details</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 10px 0; color: #666; width: 40%;"><strong>Pickup Location:</strong></td>
                  <td style="padding: 10px 0; color: #333;">${pickupLocation}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; color: #666;"><strong>Destination:</strong></td>
                  <td style="padding: 10px 0; color: #333;">${destination}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; color: #666;"><strong>Date:</strong></td>
                  <td style="padding: 10px 0; color: #333;">${formattedDate}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; color: #666;"><strong>Time:</strong></td>
                  <td style="padding: 10px 0; color: #333;">${rideTime}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; color: #666;"><strong>Seats Booked:</strong></td>
                  <td style="padding: 10px 0; color: #333;">${seatsBooked} seat${seatsBooked > 1 ? 's' : ''}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; color: #666;"><strong>Total Price:</strong></td>
                  <td style="padding: 10px 0; color: #333; font-weight: bold;">₹${totalPrice.toFixed(2)}</td>
                </tr>
              </table>
            </div>

            <div style="background: white; padding: 20px; border-radius: 5px; margin: 20px 0;">
              <h3 style="color: #ef4444; margin-top: 0; border-bottom: 2px solid #e0e0e0; padding-bottom: 10px;">Ride Provider Information</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 10px 0; color: #666; width: 40%;"><strong>Name:</strong></td>
                  <td style="padding: 10px 0; color: #333;">${providerName}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; color: #666;"><strong>Email:</strong></td>
                  <td style="padding: 10px 0; color: #333;">${providerEmail}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; color: #666;"><strong>Phone:</strong></td>
                  <td style="padding: 10px 0; color: #333;">${providerPhone || 'Not provided'}</td>
                </tr>
              </table>
            </div>

            <div style="background: #fee2e2; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ef4444;">
              <h4 style="color: #dc2626; margin-top: 0;">Rejection Reason</h4>
              <p style="color: #991b1b; margin: 0;">${cancellationReason || 'Rejected by staff'}</p>
            </div>

            <div style="background: #e7f3ff; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #2196F3;">
              <h4 style="color: #0d47a1; margin-top: 0;">What's Next?</h4>
              <ul style="color: #0d47a1; margin: 10px 0; padding-left: 20px;">
                <li>Your booking has been cancelled and any payment will be refunded (if applicable)</li>
                <li>You can search for other available rides on ShareLane</li>
                <li>If you have questions about this rejection, you can contact the ride provider directly</li>
                <li>We apologize for any inconvenience caused</li>
              </ul>
            </div>

            <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0; text-align: center;">
              <p style="color: #666; font-size: 12px; margin: 0;">Booking created on: ${formattedBookingTime}</p>
            </div>

            <p style="margin-top: 30px;">We hope you find another suitable ride soon!</p>
            <p style="margin-top: 30px;">Best regards,<br><strong>The ShareLane Team</strong></p>
          </div>
        </body>
        </html>
      `,
      text: `
        Hello ${studentName},
        
        We regret to inform you that your booking request has been rejected by the ride provider.
        
        BOOKING REFERENCE: ${bookingReference}
        
        BOOKING DETAILS:
        - Pickup Location: ${pickupLocation}
        - Destination: ${destination}
        - Date: ${formattedDate}
        - Time: ${rideTime}
        - Seats Booked: ${seatsBooked} seat${seatsBooked > 1 ? 's' : ''}
        - Total Price: ₹${totalPrice.toFixed(2)}
        
        RIDE PROVIDER INFORMATION:
        - Name: ${providerName}
        - Email: ${providerEmail}
        - Phone: ${providerPhone || 'Not provided'}
        
        REJECTION REASON: ${cancellationReason || 'Rejected by staff'}
        
        WHAT'S NEXT?
        - Your booking has been cancelled and any payment will be refunded (if applicable)
        - You can search for other available rides on ShareLane
        - If you have questions about this rejection, you can contact the ride provider directly
        - We apologize for any inconvenience caused
        
        Booking created on: ${formattedBookingTime}
        
        We hope you find another suitable ride soon!
        
        Best regards,
        The ShareLane Team
      `
    };

    console.log('📧 Sending rejection email to:', studentEmail);
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Booking rejection email sent successfully!');
    console.log('📧 Message ID:', info.messageId);
    console.log('📧 Email sent to:', studentEmail);
    console.log('📧 Response:', info.response);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Error sending booking rejection email:');
    console.error('Error message:', error.message);
    console.error('Error code:', error.code);
    console.error('Error stack:', error.stack);
    
    // Provide more detailed error messages
    let errorMessage = 'Failed to send booking rejection email';
    
    if (error.code === 'EAUTH') {
      errorMessage = 'Email authentication failed. Please check your EMAIL_USER and EMAIL_PASS in .env file.';
      console.error('❌ AUTHENTICATION ERROR: Check your email credentials in .env file');
    } else if (error.code === 'ECONNECTION' || error.code === 'ETIMEDOUT') {
      errorMessage = 'Email server connection failed. Please check your internet connection and email service configuration.';
      console.error('❌ CONNECTION ERROR: Cannot connect to email server');
    } else if (error.response) {
      errorMessage = `Email service error: ${error.response}`;
      console.error('❌ SERVICE ERROR:', error.response);
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    console.error('📧 Detailed error information:', {
      code: error.code,
      command: error.command,
      response: error.response,
      responseCode: error.responseCode,
      message: error.message
    });
    
    throw new Error(errorMessage);
  } finally {
    // Don't close transporter - let nodemailer pool manage connections
    // Closing it can cause issues with subsequent emails
  }
};

module.exports = {
  sendOTPEmail,
  sendBookingConfirmationEmail,
  sendBookingRejectionEmail
};

