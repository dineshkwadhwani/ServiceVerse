/**
 * Notification Messages Configuration
 * Centralized management of all push and email notification templates
 * Push: Short, summarized messages (limited character space)
 * Email: Professional, detailed templates (HTML formatted)
 */

export interface NotificationTemplate {
  push: {
    title: string;
    body: string;
  };
  email: {
    subject: string;
    template: (data: Record<string, any>) => string;
  };
}

export const notificationMessages: Record<string, NotificationTemplate> = {
  ACCOUNT_CREATED: {
    push: {
      title: 'Welcome to ServiceVerse',
      body: 'Your account has been created successfully.',
    },
    email: {
      subject: 'Welcome to ServiceVerse – Your Account is Ready',
      template: (data) => `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #2d3748; max-width: 600px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to ServiceVerse!</h1>
          </div>

          <div style="background-color: #f7fafc; padding: 30px; border-radius: 0 0 8px 8px; border: 1px solid #e2e8f0; border-top: none;">
            <p>Dear ${data.name || 'User'},</p>

            <p>Thank you for signing up with ServiceVerse! Your ${data.role === 'SERVICE_PROVIDER' ? 'Service Provider' : 'Customer'} account has been successfully created and is ready to use.</p>

            <div style="background-color: white; padding: 20px; border-radius: 6px; border-left: 4px solid #667eea; margin: 20px 0;">
              <p style="margin: 0;"><strong>What's Next?</strong></p>
              <ul style="margin: 10px 0; padding-left: 20px;">
                ${data.role === 'SERVICE_PROVIDER'
                  ? '<li>Complete your profile and upload necessary documents</li><li>Set up your working hours and service menu</li><li>Wait for Account Manager approval</li>'
                  : '<li>Browse available services in your area</li><li>Create orders and track them in real-time</li><li>Connect with trusted service providers</li>'
                }
              </ul>
            </div>

            <p>If you have any questions or need assistance, please don't hesitate to reach out to our support team.</p>

            <p style="margin-top: 30px;">Best regards,<br><strong>The ServiceVerse Team</strong></p>
          </div>
        </div>
      `,
    },
  },

  SP_REGISTERED: {
    push: {
      title: 'New Service Provider Registration',
      body: '${businessName} has registered. Awaiting assignment.',
    },
    email: {
      subject: 'New Service Provider Registration – Action Required',
      template: (data) => `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #2d3748; max-width: 600px;">
          <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">New Service Provider Registration</h1>
          </div>

          <div style="background-color: #f7fafc; padding: 30px; border-radius: 0 0 8px 8px; border: 1px solid #e2e8f0; border-top: none;">
            <p>Hello,</p>

            <p>A new Service Provider has registered on the ServiceVerse platform:</p>

            <div style="background-color: white; padding: 20px; border-radius: 6px; margin: 20px 0; border: 1px solid #e2e8f0;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr style="border-bottom: 1px solid #e2e8f0;">
                  <td style="padding: 10px 0; color: #718096;"><strong>Business Name</strong></td>
                  <td style="padding: 10px 0; text-align: right;">${data.businessName || 'N/A'}</td>
                </tr>
                <tr style="border-bottom: 1px solid #e2e8f0;">
                  <td style="padding: 10px 0; color: #718096;"><strong>Owner Name</strong></td>
                  <td style="padding: 10px 0; text-align: right;">${data.name || 'N/A'}</td>
                </tr>
                <tr style="border-bottom: 1px solid #e2e8f0;">
                  <td style="padding: 10px 0; color: #718096;"><strong>Email</strong></td>
                  <td style="padding: 10px 0; text-align: right;">${data.email || 'N/A'}</td>
                </tr>
                <tr style="border-bottom: 1px solid #e2e8f0;">
                  <td style="padding: 10px 0; color: #718096;"><strong>Service</strong></td>
                  <td style="padding: 10px 0; text-align: right;">${data.serviceName || 'N/A'}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; color: #718096;"><strong>Registration Date</strong></td>
                  <td style="padding: 10px 0; text-align: right;">${new Date().toLocaleDateString()}</td>
                </tr>
              </table>
            </div>

            <p style="background-color: #fef5e7; padding: 15px; border-radius: 6px; border-left: 4px solid #f39c12; margin: 20px 0;">
              <strong>Status:</strong> This service provider is awaiting assignment to an Account Manager. Please review and assign them accordingly.
            </p>

            <p>If you have any questions, please contact the support team.</p>

            <p style="margin-top: 30px;">Best regards,<br><strong>ServiceVerse System</strong></p>
          </div>
        </div>
      `,
    },
  },

  SP_ASSIGNED_TO_AM: {
    push: {
      title: 'Service Provider Assignment',
      body: '${spName} assigned to ${amName}',
    },
    email: {
      subject: 'You Have Been Assigned a Service Provider',
      template: (data) => `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #2d3748; max-width: 600px;">
          <div style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">New Service Provider Assignment</h1>
          </div>

          <div style="background-color: #f7fafc; padding: 30px; border-radius: 0 0 8px 8px; border: 1px solid #e2e8f0; border-top: none;">
            <p>Dear ${data.amName || 'Account Manager'},</p>

            <p>You have been assigned a new Service Provider to manage:</p>

            <div style="background-color: white; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #4facfe;">
              <h3 style="margin-top: 0; color: #2d3748;">${data.spName || 'Service Provider'}</h3>
              <p style="margin: 10px 0; color: #718096;">Business: ${data.spName || 'N/A'}</p>
              <p style="margin: 10px 0; color: #718096;">Service: ${data.serviceName || 'N/A'}</p>
            </div>

            <p><strong>Next Steps:</strong></p>
            <ol style="color: #4a5568;">
              <li>Review their profile and business details</li>
              <li>Guide them through the onboarding process</li>
              <li>Ensure all required documents are submitted</li>
              <li>Set up service menu and pricing</li>
              <li>Activate their account when ready</li>
            </ol>

            <p>Log in to your dashboard to view more details and start the onboarding process.</p>

            <p style="margin-top: 30px;">Best regards,<br><strong>The ServiceVerse Team</strong></p>
          </div>
        </div>
      `,
    },
  },

  SP_ONBOARDING_COMPLETE: {
    push: {
      title: 'Onboarding Complete',
      body: 'Your profile setup is complete!',
    },
    email: {
      subject: 'Onboarding Complete – Next Steps',
      template: (data) => `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #2d3748; max-width: 600px;">
          <div style="background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Onboarding Complete! 🎉</h1>
          </div>

          <div style="background-color: #f7fafc; padding: 30px; border-radius: 0 0 8px 8px; border: 1px solid #e2e8f0; border-top: none;">
            <p>Congratulations!</p>

            <p>You have successfully completed your onboarding process with ServiceVerse. Your profile is now fully set up.</p>

            <div style="background-color: #e6fffa; padding: 20px; border-radius: 6px; border-left: 4px solid #38f9d7; margin: 20px 0;">
              <p style="margin: 0;"><strong>What You've Completed:</strong></p>
              <ul style="margin: 10px 0; padding-left: 20px; color: #234e52;">
                <li>✓ Profile Information</li>
                <li>✓ Working Hours Setup</li>
                <li>✓ Service Menu Configuration</li>
                <li>✓ Document Verification</li>
              </ul>
            </div>

            <p><strong>What's Next:</strong></p>
            <p>Your account is pending activation by a SuperAdmin. You'll receive a notification once your account is activated and you can start accepting orders.</p>

            <p>In the meantime, you can:</p>
            <ul style="color: #4a5568;">
              <li>Review your service listings</li>
              <li>Update your pricing if needed</li>
              <li>Add photos or documents</li>
            </ul>

            <p>Thank you for joining ServiceVerse. We're excited to have you on board!</p>

            <p style="margin-top: 30px;">Best regards,<br><strong>The ServiceVerse Team</strong></p>
          </div>
        </div>
      `,
    },
  },

  SP_ACTIVATION_COMPLETE: {
    push: {
      title: 'Account Activated',
      body: 'Your account is now active! Start accepting orders.',
    },
    email: {
      subject: 'Your Account is Now Active – Ready to Serve!',
      template: (data) => `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #2d3748; max-width: 600px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Your Account is Now Active! ✨</h1>
          </div>

          <div style="background-color: #f7fafc; padding: 30px; border-radius: 0 0 8px 8px; border: 1px solid #e2e8f0; border-top: none;">
            <p>Dear ${data.name || 'Service Provider'},</p>

            <p>Great news! Your ServiceVerse account has been activated and is now live. You are ready to start serving customers!</p>

            <div style="background-color: #f0f4ff; padding: 20px; border-radius: 6px; border-left: 4px solid #667eea; margin: 20px 0;">
              <p style="margin: 0;"><strong>You Can Now:</strong></p>
              <ul style="margin: 10px 0; padding-left: 20px;">
                <li>Accept customer orders</li>
                <li>Manage your schedule and availability</li>
                <li>Track order history and earnings</li>
                <li>Communicate with customers</li>
                <li>View performance analytics</li>
              </ul>
            </div>

            <p><strong>Getting Started:</strong></p>
            <ol style="color: #4a5568;">
              <li>Log in to your dashboard</li>
              <li>Check pending orders in your queue</li>
              <li>Update your availability status</li>
              <li>Confirm you're ready to serve</li>
            </ol>

            <p style="background-color: #fef5e7; padding: 15px; border-radius: 6px; border-left: 4px solid #f39c12; margin: 20px 0;">
              <strong>Pro Tip:</strong> Keep your profile updated with latest service rates and working hours to attract more customers.
            </p>

            <p>For any assistance, contact our support team. Happy serving!</p>

            <p style="margin-top: 30px;">Best regards,<br><strong>The ServiceVerse Team</strong></p>
          </div>
        </div>
      `,
    },
  },

  ORDER_CREATED: {
    push: {
      title: 'New Order',
      body: 'Order #${orderId} has been created',
    },
    email: {
      subject: 'New Order Created – Order #${orderId}',
      template: (data) => `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #2d3748; max-width: 600px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">New Order Created</h1>
          </div>

          <div style="background-color: #f7fafc; padding: 30px; border-radius: 0 0 8px 8px; border: 1px solid #e2e8f0; border-top: none;">
            <p>A new order has been created:</p>

            <div style="background-color: white; padding: 20px; border-radius: 6px; margin: 20px 0; border: 1px solid #e2e8f0;">
              <p style="margin: 0; color: #718096;"><strong>Order ID:</strong> #${data.orderId || 'N/A'}</p>
              <p style="margin: 10px 0; color: #718096;"><strong>Created:</strong> ${new Date().toLocaleString()}</p>
            </div>

            <p>Log in to your dashboard to view and manage this order.</p>

            <p style="margin-top: 30px;">Best regards,<br><strong>ServiceVerse</strong></p>
          </div>
        </div>
      `,
    },
  },

  ORDER_CONFIRMED: {
    push: {
      title: 'Order Confirmed',
      body: 'Order #${orderId} is confirmed',
    },
    email: {
      subject: 'Order Confirmed – Order #${orderId}',
      template: (data) => `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #2d3748; max-width: 600px;">
          <div style="background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">Order Confirmed ✓</h1>
          </div>

          <div style="background-color: #f7fafc; padding: 30px; border-radius: 0 0 8px 8px; border: 1px solid #e2e8f0; border-top: none;">
            <p>Good news!</p>

            <p>Your order has been confirmed. You can track its progress in real-time on your dashboard.</p>

            <div style="background-color: #e6fffa; padding: 20px; border-radius: 6px; border-left: 4px solid #38f9d7; margin: 20px 0;">
              <p style="margin: 0; color: #234e52;"><strong>Order #${data.orderId || 'N/A'}</strong></p>
              <p style="margin: 10px 0; color: #234e52;">Status: Confirmed</p>
            </div>

            <p>You'll receive updates as the service progresses. Thank you for using ServiceVerse!</p>

            <p style="margin-top: 30px;">Best regards,<br><strong>The ServiceVerse Team</strong></p>
          </div>
        </div>
      `,
    },
  },

  ORDER_COMPLETED: {
    push: {
      title: 'Order Completed',
      body: 'Order #${orderId} is complete. Rate your experience!',
    },
    email: {
      subject: 'Order Completed – Leave a Review',
      template: (data) => `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #2d3748; max-width: 600px;">
          <div style="background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">Order Completed! 🎉</h1>
          </div>

          <div style="background-color: #f7fafc; padding: 30px; border-radius: 0 0 8px 8px; border: 1px solid #e2e8f0; border-top: none;">
            <p>Your order has been completed successfully!</p>

            <div style="background-color: #e6fffa; padding: 20px; border-radius: 6px; border-left: 4px solid #38f9d7; margin: 20px 0;">
              <p style="margin: 0;"><strong>Order #${data.orderId || 'N/A'}</strong></p>
              <p style="margin: 10px 0; color: #234e52;">Status: Completed</p>
            </div>

            <p><strong>We'd Love Your Feedback!</strong></p>
            <p>Help us improve by rating your experience and leaving a review of the service you received. Your feedback helps us maintain quality standards.</p>

            <p>Thank you for choosing ServiceVerse!</p>

            <p style="margin-top: 30px;">Best regards,<br><strong>The ServiceVerse Team</strong></p>
          </div>
        </div>
      `,
    },
  },

  DEASSOCIATION_REQUESTED: {
    push: {
      title: 'Deassociation Request',
      body: '${customerName} requested deassociation',
    },
    email: {
      subject: 'Customer Deassociation Request – Action Required',
      template: (data) => `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #2d3748; max-width: 600px;">
          <div style="background: linear-gradient(135deg, #fa709a 0%, #fee140 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">Deassociation Request</h1>
          </div>

          <div style="background-color: #f7fafc; padding: 30px; border-radius: 0 0 8px 8px; border: 1px solid #e2e8f0; border-top: none;">
            <p>A customer has requested deassociation from your service:</p>

            <div style="background-color: white; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #fa709a;">
              <p style="margin: 0;"><strong>${data.customerName || 'Customer'}</strong></p>
              <p style="margin: 10px 0; color: #718096;"><strong>Reason:</strong> ${data.reason || 'Not specified'}</p>
            </div>

            <p style="background-color: #fff5f5; padding: 15px; border-radius: 6px; border-left: 4px solid #fc8181;">
              Please review this request and take appropriate action. Contact the customer if needed for clarification.
            </p>

            <p style="margin-top: 20px;">Log in to your dashboard to view and respond to this request.</p>

            <p style="margin-top: 30px;">Best regards,<br><strong>ServiceVerse</strong></p>
          </div>
        </div>
      `,
    },
  },

  DEASSOCIATION_APPROVED: {
    push: {
      title: 'Deassociation Approved',
      body: 'Your deassociation request has been approved',
    },
    email: {
      subject: 'Deassociation Request Approved',
      template: (data) => `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #2d3748; max-width: 600px;">
          <div style="background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">Deassociation Approved ✓</h1>
          </div>

          <div style="background-color: #f7fafc; padding: 30px; border-radius: 0 0 8px 8px; border: 1px solid #e2e8f0; border-top: none;">
            <p>Your deassociation request has been approved.</p>

            <div style="background-color: #e6fffa; padding: 20px; border-radius: 6px; border-left: 4px solid #38f9d7; margin: 20px 0;">
              <p style="margin: 0; color: #234e52;">You have been successfully deassociated from this service provider.</p>
            </div>

            <p>You can now connect with other service providers or request to be associated with a different one.</p>

            <p>Thank you for using ServiceVerse!</p>

            <p style="margin-top: 30px;">Best regards,<br><strong>The ServiceVerse Team</strong></p>
          </div>
        </div>
      `,
    },
  },
};
