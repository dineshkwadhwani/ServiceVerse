import { db, messaging } from '@/utils/firebase';
import { Logger } from '@/utils/logger';
import * as functions from 'firebase-functions';
import { notificationMessages } from '@/config/notificationMessages';

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

// Interpolate template variables (e.g., ${orderId} with data.orderId)
function interpolateTemplate(template: string, data: Record<string, any>): string {
  return template.replace(/\$\{(\w+)\}/g, (match, key) => {
    return data[key] !== undefined ? String(data[key]) : match;
  });
}

export async function sendNotificationByEvent(event: NotificationEvent, payload: BasePayload) {
  try {
    const template = notificationMessages[event];
    if (!template) {
      logger.warn('No notification template found', { event });
      return;
    }

    switch (event) {
      case 'ACCOUNT_CREATED': {
        await notifyUsers({
          userIds: payload.userId ? [payload.userId] : [],
          emails: payload.email ? [payload.email] : [],
          emailSubject: template.email.subject,
          emailHtml: template.email.template(payload),
        });
        break;
      }

      case 'SP_REGISTERED': {
        const superAdmins = await getUsersByRole('SUPERADMIN');
        const pushBody = interpolateTemplate(template.push.body, {
          businessName: payload.businessName || payload.name,
          name: payload.name,
        });
        await notifyUsers({
          userIds: superAdmins.map((u) => u.uid),
          pushTitle: template.push.title,
          pushBody,
          emailSubject: template.email.subject,
          emailHtml: template.email.template(payload),
        });
        break;
      }

      case 'SP_ASSIGNED_TO_AM': {
        const pushBody = interpolateTemplate(template.push.body, {
          spName: payload.spName || payload.spId,
          amName: payload.amName || payload.amId,
        });
        await notifyUsers({
          userIds: [payload.spId, payload.amId],
          pushTitle: template.push.title,
          pushBody,
          pushData: {
            type: 'SP_ASSIGNED_TO_AM',
            spId: String(payload.spId || ''),
            amId: String(payload.amId || ''),
          },
          emailSubject: template.email.subject,
          emailHtml: template.email.template(payload),
        });
        break;
      }

      case 'SP_ONBOARDING_COMPLETE': {
        await notifyUsers({
          userIds: [payload.spId],
          pushTitle: template.push.title,
          pushBody: template.push.body,
          pushData: {
            type: 'SP_ONBOARDING_COMPLETE',
            spId: String(payload.spId || ''),
          },
          emailSubject: template.email.subject,
          emailHtml: template.email.template(payload),
        });
        break;
      }

      case 'SP_ACTIVATION_COMPLETE': {
        const superAdmins = await getUsersByRole('SUPERADMIN');

        // Notify SP
        await notifyUsers({
          userIds: [payload.spId],
          pushTitle: template.push.title,
          pushBody: template.push.body,
          pushData: {
            type: 'SP_ACTIVATION_COMPLETE',
            spId: String(payload.spId || ''),
          },
          emailSubject: template.email.subject,
          emailHtml: template.email.template(payload),
        });

        // Notify SuperAdmins
        await notifyUsers({
          userIds: superAdmins.map((u) => u.uid),
          emailSubject: template.email.subject,
          emailHtml: template.email.template(payload),
        });
        break;
      }

      case 'ORDER_CREATED': {
        const pushBody = interpolateTemplate(template.push.body, { orderId: payload.orderId });
        await notifyUsers({
          userIds: payload.notifyUserIds || [],
          pushTitle: template.push.title,
          pushBody,
          pushData: {
            type: 'ORDER_CREATED',
            orderId: String(payload.orderId || ''),
          },
        });
        break;
      }

      case 'ORDER_CONFIRMED': {
        const pushBody = interpolateTemplate(template.push.body, { orderId: payload.orderId });
        const subject = interpolateTemplate(template.email.subject, { orderId: payload.orderId });
        await notifyUsers({
          userIds: [payload.spId, payload.customerId],
          pushTitle: template.push.title,
          pushBody,
          emailSubject: subject,
          emailHtml: template.email.template(payload),
        });
        break;
      }

      case 'ORDER_COMPLETED': {
        const pushBody = interpolateTemplate(template.push.body, { orderId: payload.orderId });
        await notifyUsers({
          userIds: [payload.customerId],
          pushTitle: template.push.title,
          pushBody,
          pushData: {
            type: 'ORDER_COMPLETED',
            orderId: String(payload.orderId || ''),
          },
          emailSubject: template.email.subject,
          emailHtml: template.email.template(payload),
        });
        break;
      }

      case 'DEASSOCIATION_REQUESTED': {
        const pushBody = interpolateTemplate(template.push.body, {
          customerName: payload.customerName || 'Customer',
        });
        // Notify AM
        await notifyUsers({
          userIds: payload.amId ? [payload.amId] : [],
          pushTitle: template.push.title,
          pushBody,
          pushData: {
            type: 'DEASSOCIATION_REQUESTED',
            requestId: String(payload.requestId || ''),
          },
          emailSubject: template.email.subject,
          emailHtml: template.email.template(payload),
        });

        // Notify Customer (different message)
        await notifyUsers({
          userIds: payload.customerId ? [payload.customerId] : [],
          emails: payload.customerEmail ? [payload.customerEmail] : [],
          emailSubject: 'Your deassociation request has been submitted',
          emailHtml: notificationMessages['DEASSOCIATION_APPROVED'].email.template(payload),
        });
        break;
      }

      case 'DEASSOCIATION_APPROVED': {
        await notifyUsers({
          userIds: payload.customerId ? [payload.customerId] : [],
          emails: payload.customerEmail ? [payload.customerEmail] : [],
          pushTitle: template.push.title,
          pushBody: template.push.body,
          pushData: {
            type: 'DEASSOCIATION_APPROVED',
            requestId: String(payload.requestId || ''),
          },
          emailSubject: template.email.subject,
          emailHtml: template.email.template(payload),
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
