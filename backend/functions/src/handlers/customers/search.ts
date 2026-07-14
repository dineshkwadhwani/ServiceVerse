import { Request, Response } from 'express';
import { db } from '@/utils/firebase';
import { Logger } from '@/utils/logger';

const logger = new Logger('CustomerSearch');

/**
 * Search customer by phone number
 * GET /customers/search?phone={phone}
 */
export const searchCustomer = async (req: Request, res: Response) => {
  try {
    const { phone } = req.query;

    if (!phone || typeof phone !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Phone number is required',
      });
    }

    // Search for customer in users collection
    const snapshot = await db
      .collection('users')
      .where('phone', '==', phone)
      .where('role', '==', 'CUSTOMER')
      .limit(1)
      .get();

    if (snapshot.empty) {
      return res.status(404).json({
        success: false,
        error: 'Customer not found',
        data: null,
      });
    }

    const customerDoc = snapshot.docs[0];
    const customer = {
      customerId: customerDoc.id,
      phone: customerDoc.data().phone,
      name: customerDoc.data().name || customerDoc.data().firstName || '',
      email: customerDoc.data().email || '',
      address: customerDoc.data().address || '',
      city: customerDoc.data().city || '',
      pin: customerDoc.data().pin || '',
    };

    logger.info('Customer found', { customerId: customer.customerId, phone });

    return res.status(200).json({
      success: true,
      data: customer,
    });
  } catch (error: any) {
    logger.error('Customer search failed', error);
    return res.status(500).json({
      success: false,
      error: error?.message || 'Failed to search customer',
    });
  }
};
