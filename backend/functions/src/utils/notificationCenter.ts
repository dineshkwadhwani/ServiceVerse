import { db, messaging } from '@/utils/firebase';
import { Logger } from '@/utils/logger';
import * as functions from 'firebase-functions';

const Resend = require('resend').Resend;

const logger = new Logger('NotificationCenter');

export type NotificationEvent =
  | 'ACCOUNT_CREATED'
  | 'SP_REGISTERED'
  | 'SP_ASSIGNED_TO_AM'
  | 'SP_ONBOARDING_COMPLETE'
  | 'SP_ACTIVATION_COMPLETE'
  | 'ORDER_CREATED'
  | 'ORDER_CONFIRMED'
  | 'ORDER_COMPLETED'
  | 'DEASSOCIATION_REQUESTED'
  | 'DEASSOCIATION_APPROVED';

interface BasePayload {
  [key: string]: any;
}

let resendClient: any = null;

function getResendClient() {
  if (!resendClient) {
    const apiKey = process.env.RESEND_API_KEY || functions.config().resend?.api_key;
    if (apiKey) {
      resendClient = new Resend(apiKey);
    }
  }
  return resendClient;
}

function getFromEmail() {
  return (
    process.env.FROM_EMAIL_ADDRESS ||
    functions.config().email?.from_address ||
    'onboarding@resend.dev'
  );
}

function getTokensFromUser(userData: any): string[] {
  const tokens: string[] = [];

  if (typeof userData?.fcmToken === 'string' && userData.fcmToken.trim()) {
    tokens.push(userData.fcmToken.trim());
  }

  if (Array.isArray(userData?.fcmTokens)) {
    userData.fcmTokens.forEach((token: any) => {
      if (typeof token === 'string' && token.trim()) {
        tokens.push(token.trim());
      }
    });
  }

  if (Array.isArray(userData?.deviceTokens)) {
    userData.deviceTokens.forEach((token: any) => {
      if (typeof token === 'string' && token.trim()) {
        tokens.push(token.trim());
      }
    });
  }

  return Array.from(new Set(tokens));
}

async function getUserById(uid: string): Promise<any | null> {
  if (!uid) return null;

  const userDoc = await db.collection('users').doc(uid).get();
  if (!userDoc.exists) return null;

  return {
    uid: userDoc.id,
    ...userDoc.data(),
  };
}

async function getUsersByRole(role: string): Promise<any[]> {
  const snapshot = await db.collection('users').where('role', '==', role).get();
  return snapshot.docs.map((doc) => ({ uid: doc.id, ...doc.data() }));
}

async function sendEmail(to: string, subject: string, html: string) {
  if (!to) return;

  const resend = getResendClient();
  if (!resend) {
    logger.warn('Resend not configured. Skipping email.', { to, subject });
    return;
  }

  try {
    await resend.emails.send({
      from: getFromEmail(),
      to,
      subject,
      html,
    });
    logger.info('Email sent successfully', { to, subject });
  } catch (error: any) {
    logger.warn('Email sending failed', { to, subject, error: error?.message || String(error) });
  }
}

async function sendPush(tokens: string[], title: string, body: string, data?: Record<string, string>) {
  if (!tokens.length) return;

  await messaging.sendEachForMulticast({
    tokens,
    notification: { title, body },
    data,
  });
}

async function notifyUsers(params: {
  userIds?: string[];
  emails?: string[];
  emailSubject?: string;
  emailHtml?: string;
  pushTitle?: string;
  pushBody?: string;
  pushData?: Record<string, string>;
}) {
  const userIds = Array.from(new Set((params.userIds || []).filter(Boolean)));
  const explicitEmails = Array.from(new Set((params.emails || []).filter(Boolean)));

  const users = await Promise.all(userIds.map((uid) => getUserById(uid)));
  const validUsers = users.filter(Boolean) as any[];

  const emails = new Set<string>(explicitEmails);
  const tokens: string[] = [];

  validUsers.forEach((user) => {
    if (user.email) emails.add(user.email);
    tokens.push(...getTokensFromUser(user));
  });

  if (params.emailSubject && params.emailHtml) {
    await Promise.all(
      Array.from(emails).map(async (email) => {
        try {
          await sendEmail(email, params.emailSubject!, params.emailHtml!);
        } catch (error: any) {
          logger.warn('Email notification failed', { email, error: error?.message || String(error) });
        }
      })
    );
  }

  if (params.pushTitle && params.pushBody) {
    try {
      await sendPush(Array.from(new Set(tokens)), params.pushTitle, params.pushBody, params.pushData);
    } catch (error: any) {
      logger.warn('Push notification failed', { error: error?.message || String(error) });
    }
  }
}

function htmlMessage(title: string, lines: string[]) {
  return `
    <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #111827;">
      <h2 style="margin: 0 0 12px;">${title}</h2>
      ${lines.map((line) => `<p style="margin: 0 0 8px;">${line}</p>`).join('')}
    </div>
  `;
}

export async function sendNotificationByEvent(event: NotificationEvent, payload: BasePayload) {
  try {
    switch (event) {
      case 'ACCOUNT_CREATED': {
        await notifyUsers({
          userIds: payload.userId ? [payload.userId] : [],
          emails: payload.email ? [payload.email] : [],
          emailSubject: 'Your ServiceVerse account is created',
          emailHtml: htmlMessage('Welcome to ServiceVerse', [
            `Hi ${payload.name || 'there'}, your ${payload.role || 'user'} account has been created successfully.`,
          ]),
        });
        break;
      }

      case 'SP_REGISTERED': {
        const superAdmins = await getUsersByRole('SUPERADMIN');
        await notifyUsers({
          userIds: superAdmins.map((u) => u.uid),
          pushTitle: 'New SP Registration',
          pushBody: `${payload.businessName || payload.name || 'Service Provider'} has registered.`,
          emailSubject: 'New Service Provider registered',
          emailHtml: htmlMessage('New SP Registration', [
            `${payload.businessName || payload.name || 'A service provider'} has registered and is awaiting assignment.`,
          ]),
        });
        break;
      }

      case 'SP_ASSIGNED_TO_AM': {
        await notifyUsers({
          userIds: [payload.spId, payload.amId],
          pushTitle: 'Service Provider Assignment',
          pushBody: `SP assignment completed: ${payload.spName || payload.spId}`,
          pushData: {
            type: 'SP_ASSIGNED_TO_AM',
            spId: String(payload.spId || ''),
            amId: String(payload.amId || ''),
          },
          emailSubject: 'Service Provider assignment update',
          emailHtml: htmlMessage('SP Assigned to Account Manager', [
            `Service Provider ${payload.spName || payload.spId} has been assigned to ${payload.amName || payload.amId}.`,
          ]),
        });
        break;
      }

      case 'SP_ONBOARDING_COMPLETE': {
        await notifyUsers({
          userIds: [payload.spId],
          pushTitle: 'Onboarding Completed',
          pushBody: 'Your onboarding is complete.',
          pushData: {
            type: 'SP_ONBOARDING_COMPLETE',
            spId: String(payload.spId || ''),
          },
          emailSubject: 'Your onboarding is complete',
          emailHtml: htmlMessage('Onboarding Complete', [
            'Your onboarding has been completed successfully.',
          ]),
        });
        break;
      }

      case 'SP_ACTIVATION_COMPLETE': {
        const superAdmins = await getUsersByRole('SUPERADMIN');

        await notifyUsers({
          userIds: [payload.spId],
          pushTitle: 'Activation Complete',
          pushBody: 'Your account is now active.',
          pushData: {
            type: 'SP_ACTIVATION_COMPLETE',
            spId: String(payload.spId || ''),
          },
          emailSubject: 'Your account is active now',
          emailHtml: htmlMessage('Activation Complete', [
            'Your Service Provider account is now active.',
          ]),
        });

        await notifyUsers({
          userIds: superAdmins.map((u) => u.uid),
          emailSubject: 'SP activation completed',
          emailHtml: htmlMessage('SP Activation Completed', [
            `${payload.spName || payload.spId} is now active.`,
          ]),
        });
        break;
      }

      case 'ORDER_CREATED': {
        await notifyUsers({
          userIds: payload.notifyUserIds || [],
          pushTitle: 'New Order Created',
          pushBody: `Order ${payload.orderId} has been created.`,
          pushData: {
            type: 'ORDER_CREATED',
            orderId: String(payload.orderId || ''),
          },
        });
        break;
      }

      case 'ORDER_CONFIRMED': {
        await notifyUsers({
          userIds: [payload.spId, payload.customerId],
          emailSubject: `Order ${payload.orderId} confirmed`,
          emailHtml: htmlMessage('Order Confirmed', [
            `Order ${payload.orderId} has been confirmed.`,
          ]),
        });
        break;
      }

      case 'ORDER_COMPLETED': {
        await notifyUsers({
          userIds: [payload.customerId],
          pushTitle: 'Order Completed',
          pushBody: `Order ${payload.orderId} is completed.`,
          pushData: {
            type: 'ORDER_COMPLETED',
            orderId: String(payload.orderId || ''),
          },
        });
        break;
      }

      case 'DEASSOCIATION_REQUESTED': {
        await notifyUsers({
          userIds: payload.amId ? [payload.amId] : [],
          pushTitle: 'New Deassociation Request',
          pushBody: `${payload.customerName || 'Customer'} requested deassociation.`,
          pushData: {
            type: 'DEASSOCIATION_REQUESTED',
            requestId: String(payload.requestId || ''),
          },
          emailSubject: 'New deassociation request',
          emailHtml: htmlMessage('Deassociation Request', [
            `${payload.customerName || 'A customer'} has requested deassociation.`,
            `Reason: ${payload.reason || 'Not specified'}`,
          ]),
        });

        await notifyUsers({
          userIds: payload.customerId ? [payload.customerId] : [],
          emails: payload.customerEmail ? [payload.customerEmail] : [],
          emailSubject: 'Your deassociation request is submitted',
          emailHtml: htmlMessage('Request Submitted', [
            'Your deassociation request has been submitted to your Account Manager.',
          ]),
        });
        break;
      }

      case 'DEASSOCIATION_APPROVED': {
        await notifyUsers({
          userIds: payload.customerId ? [payload.customerId] : [],
          emails: payload.customerEmail ? [payload.customerEmail] : [],
          pushTitle: 'Deassociation Approved',
          pushBody: 'Your deassociation request has been approved.',
          pushData: {
            type: 'DEASSOCIATION_APPROVED',
            requestId: String(payload.requestId || ''),
          },
          emailSubject: 'Your deassociation request is approved',
          emailHtml: htmlMessage('Request Approved', [
            'Your deassociation request has been approved.',
          ]),
        });
        break;
      }

      default:
        logger.warn('Unhandled notification event', { event });
    }
  } catch (error: any) {
    logger.warn('Notification dispatch failed', {
      event,
      error: error?.message || String(error),
    });
  }
}
